import { Injectable, Logger } from '@nestjs/common';
import { MSU_CONFIG } from './msu.config';
import * as crypto from 'crypto';

export interface SessionTokenRequest {
  amount: number;
  currency: string;
  orderId: string;
  customerEmail: string;
  customerName: string;
  customerId?: string;
  customerIp?: string;
  installmentCount?: number;
}

export interface SessionTokenResponse {
  success: boolean;
  sessionToken?: string;
  errorCode?: string;
  errorMessage?: string;
  redirectUrl?: string;
  rawResponse?: any;
}

export interface RefundRequest {
  pgTranId: string;
  amount: number;
  currency: string;
  reason?: string;
}

export interface RefundResponse {
  success: boolean;
  refundTransactionId?: string;
  errorCode?: string;
  errorMessage?: string;
  rawResponse?: any;
}

export interface PaymentQueryResponse {
  success: boolean;
  status?: string;
  amount?: number;
  currency?: string;
  cardLastFour?: string;
  cardBrand?: string;
  is3DSecure?: boolean;
  errorCode?: string;
  errorMessage?: string;
  rawResponse?: any;
}

@Injectable()
export class MsuService {
  private readonly logger = new Logger(MsuService.name);

  private generateHash(params: Record<string, string>): string {
    const hashString = Object.keys(params)
      .sort()
      .map(key => params[key])
      .join('') + MSU_CONFIG.merchantPassword;
    
    return crypto.createHash('sha512').update(hashString).digest('base64');
  }

  private async makeRequest(params: URLSearchParams, action: string): Promise<any> {
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= MSU_CONFIG.maxRetries; attempt++) {
      try {
        this.logger.log('MSU API Request [' + action + '] Attempt ' + attempt);
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), MSU_CONFIG.apiTimeout);
        
        const response = await fetch(MSU_CONFIG.apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: params.toString(),
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);
        
        const result = await response.json();
        this.logger.log('MSU API Response [' + action + ']: ' + JSON.stringify(result));
        
        return result;
      } catch (error) {
        lastError = error as Error;
        this.logger.error('MSU API Error [' + action + '] Attempt ' + attempt + ': ' + lastError.message);
        
        if (attempt < MSU_CONFIG.maxRetries) {
          await new Promise(resolve => setTimeout(resolve, MSU_CONFIG.retryDelay * attempt));
        }
      }
    }
    
    throw lastError;
  }

  async createSessionToken(request: SessionTokenRequest): Promise<SessionTokenResponse> {
    try {
      if (!MSU_CONFIG.merchantUser || !MSU_CONFIG.merchantPassword || !MSU_CONFIG.merchant) {
        this.logger.warn('MSU credentials not configured - returning mock response');
        return this.createMockSessionResponse(request);
      }

      const params = new URLSearchParams();
      params.append('ACTION', 'SESSIONTOKEN');
      params.append('MERCHANTUSER', MSU_CONFIG.merchantUser);
      params.append('MERCHANTPASSWORD', MSU_CONFIG.merchantPassword);
      params.append('MERCHANT', MSU_CONFIG.merchant);
      params.append('SESSIONTYPE', 'PAYMENTSESSION');
      params.append('AMOUNT', request.amount.toFixed(2));
      params.append('CURRENCY', request.currency);
      params.append('MERCHANTPAYMENTID', request.orderId);
      params.append('CUSTOMER', request.customerId || request.customerEmail);
      params.append('CUSTOMERNAME', request.customerName);
      params.append('CUSTOMEREMAIL', request.customerEmail);
      params.append('RETURNURL', MSU_CONFIG.returnUrl);
      params.append('LANGUAGE', MSU_CONFIG.language);

      if (MSU_CONFIG.force3DSecure) {
        params.append('FORCEALIASGENERATION', 'NO');
        params.append('PAYMENTSYSTEM', MSU_CONFIG.paymentSystem);
      }

      if (request.installmentCount && request.installmentCount > 1) {
        params.append('INSTALLMENTS', request.installmentCount.toString());
      }

      if (request.customerIp) {
        params.append('CUSTOMERIP', request.customerIp);
      }

      const result = await this.makeRequest(params, 'SESSIONTOKEN');

      if (result.responseCode === '00') {
        const redirectUrl = MSU_CONFIG.hostedPageUrl + '/hpp/' + result.sessionToken;
        return {
          success: true,
          sessionToken: result.sessionToken,
          redirectUrl: redirectUrl,
          rawResponse: result,
        };
      } else {
        return {
          success: false,
          errorCode: result.responseCode,
          errorMessage: result.responseMsg || result.errorMsg || 'Session olusturulamadi',
          rawResponse: result,
        };
      }
    } catch (error) {
      this.logger.error('Session token creation failed: ' + (error as Error).message);
      return {
        success: false,
        errorCode: 'SYSTEM_ERROR',
        errorMessage: 'Odeme oturumu olusturulamadi. Lutfen tekrar deneyin.',
      };
    }
  }

  private createMockSessionResponse(request: SessionTokenRequest): SessionTokenResponse {
    const mockToken = 'MOCK_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    this.logger.warn('Using MOCK payment session for order: ' + request.orderId);
    
    return {
      success: true,
      sessionToken: mockToken,
      redirectUrl: MSU_CONFIG.returnUrl + '?mockPayment=true&orderId=' + request.orderId + '&amount=' + request.amount + '&currency=' + request.currency,
      rawResponse: { mock: true, sessionToken: mockToken },
    };
  }

  async queryPayment(sessionToken: string): Promise<PaymentQueryResponse> {
    try {
      if (!MSU_CONFIG.merchantUser) {
        return { success: false, errorCode: 'NOT_CONFIGURED', errorMessage: 'MSU not configured' };
      }

      const params = new URLSearchParams();
      params.append('ACTION', 'QUERYSESSION');
      params.append('MERCHANTUSER', MSU_CONFIG.merchantUser);
      params.append('MERCHANTPASSWORD', MSU_CONFIG.merchantPassword);
      params.append('MERCHANT', MSU_CONFIG.merchant);
      params.append('SESSIONTOKEN', sessionToken);

      const result = await this.makeRequest(params, 'QUERYSESSION');

      if (result.responseCode === '00') {
        return {
          success: true,
          status: result.status,
          amount: parseFloat(result.amount),
          currency: result.currency,
          cardLastFour: result.panLast4,
          cardBrand: result.cardBrand,
          is3DSecure: result.is3D === 'YES',
          rawResponse: result,
        };
      } else {
        return {
          success: false,
          errorCode: result.responseCode,
          errorMessage: result.responseMsg,
          rawResponse: result,
        };
      }
    } catch (error) {
      this.logger.error('Query payment failed: ' + (error as Error).message);
      return {
        success: false,
        errorCode: 'SYSTEM_ERROR',
        errorMessage: 'Odeme sorgulanamadi',
      };
    }
  }

  async refundPayment(request: RefundRequest): Promise<RefundResponse> {
    try {
      if (!MSU_CONFIG.merchantUser) {
        return { success: false, errorCode: 'NOT_CONFIGURED', errorMessage: 'MSU not configured' };
      }

      const params = new URLSearchParams();
      params.append('ACTION', 'REFUND');
      params.append('MERCHANTUSER', MSU_CONFIG.merchantUser);
      params.append('MERCHANTPASSWORD', MSU_CONFIG.merchantPassword);
      params.append('MERCHANT', MSU_CONFIG.merchant);
      params.append('PGTRANID', request.pgTranId);
      params.append('AMOUNT', request.amount.toFixed(2));
      params.append('CURRENCY', request.currency);

      if (request.reason) {
        params.append('REASON', request.reason);
      }

      const result = await this.makeRequest(params, 'REFUND');

      if (result.responseCode === '00') {
        return {
          success: true,
          refundTransactionId: result.pgTranId,
          rawResponse: result,
        };
      } else {
        return {
          success: false,
          errorCode: result.responseCode,
          errorMessage: result.responseMsg || 'Iade islemi basarisiz',
          rawResponse: result,
        };
      }
    } catch (error) {
      this.logger.error('Refund failed: ' + (error as Error).message);
      return {
        success: false,
        errorCode: 'SYSTEM_ERROR',
        errorMessage: 'Iade islemi gerceklestirilemedi',
      };
    }
  }

  verifyCallback(callbackData: any): { valid: boolean; errorMessage?: string } {
    try {
      const responseCode = callbackData.responseCode || callbackData.RESPONSECODE;
      
      if (responseCode === '00') {
        return { valid: true };
      }
      
      return {
        valid: false,
        errorMessage: callbackData.responseMsg || callbackData.RESPONSEMSG || 'Odeme dogrulanamadi',
      };
    } catch (error) {
      return {
        valid: false,
        errorMessage: 'Callback dogrulama hatasi',
      };
    }
  }

  isConfigured(): boolean {
    return !!(MSU_CONFIG.merchantUser && MSU_CONFIG.merchantPassword && MSU_CONFIG.merchant);
  }
}
