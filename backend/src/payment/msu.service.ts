import { Injectable, Logger } from '@nestjs/common';
import { MSU_CONFIG, validateMsuConfig } from './msu.config';
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

  constructor() {
    const validation = validateMsuConfig();
    if (!validation.valid) {
      this.logger.warn('MSU credentials incomplete. Missing: ' + validation.missing.join(', '));
      this.logger.warn('Payment gateway will operate in MOCK mode');
    } else {
      this.logger.log('MSU Service initialized with HASH authentication');
      this.logger.log('Environment: ' + (MSU_CONFIG.apiUrl.includes('test') ? 'TEST' : 'PRODUCTION'));
    }
  }

  private generateRandom(): string {
    return crypto.randomBytes(16).toString('hex');
  }

  private generateHash(params: {
    action: string;
    merchant: string;
    customer?: string;
    merchantPaymentId?: string;
    random: string;
  }): string {
    const hashParts: string[] = [params.action, params.merchant];
    if (params.customer) hashParts.push(params.customer);
    if (params.merchantPaymentId) hashParts.push(params.merchantPaymentId);
    hashParts.push(MSU_CONFIG.merchantSecretKey);
    hashParts.push(params.random);

    const hashString = hashParts.join('');
    return crypto.createHash('sha256').update(hashString).digest('hex');
  }

  verifyCallbackHash(callbackData: {
    merchantPaymentId: string;
    customerId: string;
    sessionToken: string;
    responseCode: string;
    random: string;
    sdSha512: string;
  }): boolean {
    const hashString = [
      callbackData.merchantPaymentId,
      callbackData.customerId,
      callbackData.sessionToken,
      callbackData.responseCode,
      callbackData.random,
      MSU_CONFIG.merchantSecretKey,
    ].join('|');

    const calculatedHash = crypto.createHash('sha512').update(hashString).digest('hex');
    const isValid = calculatedHash.toLowerCase() === callbackData.sdSha512.toLowerCase();
    
    if (!isValid) {
      this.logger.warn('Callback hash verification FAILED');
    }
    return isValid;
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
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: params.toString(),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);
        const result = await response.json();
        
        const logSafe = { ...result };
        if (logSafe.sessionToken) logSafe.sessionToken = logSafe.sessionToken.substring(0, 8) + '***';
        this.logger.log('MSU API Response [' + action + ']: ' + JSON.stringify(logSafe));

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
      if (!this.isConfigured()) {
        this.logger.warn('MSU not configured - returning mock response');
        return this.createMockSessionResponse(request);
      }

      const random = this.generateRandom();
      const hash = this.generateHash({
        action: 'SESSIONTOKEN',
        merchant: MSU_CONFIG.merchant,
        customer: request.customerId || request.customerEmail,
        merchantPaymentId: request.orderId,
        random,
      });

      const params = new URLSearchParams();
      params.append('ACTION', 'SESSIONTOKEN');
      params.append('MERCHANT', MSU_CONFIG.merchant);
      params.append('MERCHANTUSER', MSU_CONFIG.merchantUser);
      params.append('RANDOM', random);
      params.append('HASH', hash);
      params.append('SESSIONTYPE', MSU_CONFIG.sessionType);
      params.append('AMOUNT', request.amount.toFixed(2));
      params.append('CURRENCY', request.currency);
      params.append('MERCHANTPAYMENTID', request.orderId);
      params.append('RETURNURL', MSU_CONFIG.returnUrl);
      params.append('LANGUAGE', MSU_CONFIG.language);
      params.append('CUSTOMER', request.customerId || request.customerEmail);
      params.append('CUSTOMERNAME', request.customerName);
      params.append('CUSTOMEREMAIL', request.customerEmail);

      if (request.customerIp) params.append('CUSTOMERIP', request.customerIp);
      if (request.installmentCount && request.installmentCount > 1) {
        params.append('INSTALLMENTS', request.installmentCount.toString());
      }

      const result = await this.makeRequest(params, 'SESSIONTOKEN');

      if (result.responseCode === '00') {
        const redirectUrl = MSU_CONFIG.hostedPageUrl + '/hpp/' + result.sessionToken;
        this.logger.log('Session token created for order: ' + request.orderId);
        return {
          success: true,
          sessionToken: result.sessionToken,
          redirectUrl,
          rawResponse: result,
        };
      } else {
        this.logger.error('Session token failed: ' + result.responseCode + ' - ' + (result.responseMsg || result.errorMsg));
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
      if (!this.isConfigured()) {
        return { success: false, errorCode: 'NOT_CONFIGURED', errorMessage: 'MSU not configured' };
      }

      const random = this.generateRandom();
      const hash = this.generateHash({
        action: 'QUERYSESSION',
        merchant: MSU_CONFIG.merchant,
        random,
      });

      const params = new URLSearchParams();
      params.append('ACTION', 'QUERYSESSION');
      params.append('MERCHANT', MSU_CONFIG.merchant);
      params.append('MERCHANTUSER', MSU_CONFIG.merchantUser);
      params.append('RANDOM', random);
      params.append('HASH', hash);
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
      return { success: false, errorCode: 'SYSTEM_ERROR', errorMessage: 'Odeme sorgulanamadi' };
    }
  }

  async refundPayment(request: RefundRequest): Promise<RefundResponse> {
    try {
      if (!this.isConfigured()) {
        return { success: false, errorCode: 'NOT_CONFIGURED', errorMessage: 'MSU not configured' };
      }

      const random = this.generateRandom();
      const hash = this.generateHash({
        action: 'REFUND',
        merchant: MSU_CONFIG.merchant,
        random,
      });

      const params = new URLSearchParams();
      params.append('ACTION', 'REFUND');
      params.append('MERCHANT', MSU_CONFIG.merchant);
      params.append('MERCHANTUSER', MSU_CONFIG.merchantUser);
      params.append('RANDOM', random);
      params.append('HASH', hash);
      params.append('PGTRANID', request.pgTranId);
      params.append('AMOUNT', request.amount.toFixed(2));
      params.append('CURRENCY', request.currency);
      if (request.reason) params.append('REASON', request.reason);

      const result = await this.makeRequest(params, 'REFUND');

      if (result.responseCode === '00') {
        return { success: true, refundTransactionId: result.pgTranId, rawResponse: result };
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
      return { success: false, errorCode: 'SYSTEM_ERROR', errorMessage: 'Iade islemi gerceklestirilemedi' };
    }
  }

  verifyCallback(callbackData: any): { valid: boolean; errorMessage?: string } {
    try {
      const responseCode = callbackData.responseCode || callbackData.RESPONSECODE;

      if (callbackData.sdSha512 && MSU_CONFIG.merchantSecretKey) {
        const isHashValid = this.verifyCallbackHash({
          merchantPaymentId: callbackData.merchantPaymentId || callbackData.MERCHANTPAYMENTID || '',
          customerId: callbackData.customerId || callbackData.CUSTOMERID || '',
          sessionToken: callbackData.sessionToken || callbackData.SESSIONTOKEN || '',
          responseCode: responseCode,
          random: callbackData.random || callbackData.RANDOM || '',
          sdSha512: callbackData.sdSha512,
        });
        if (!isHashValid) {
          return { valid: false, errorMessage: 'Callback dogrulama hatasi - Hash gecersiz' };
        }
      }

      if (responseCode === '00') return { valid: true };
      return {
        valid: false,
        errorMessage: callbackData.responseMsg || callbackData.RESPONSEMSG || 'Odeme dogrulanamadi',
      };
    } catch (error) {
      return { valid: false, errorMessage: 'Callback dogrulama hatasi' };
    }
  }

  isConfigured(): boolean {
    return !!(
      MSU_CONFIG.merchant &&
      MSU_CONFIG.merchantUser &&
      MSU_CONFIG.merchantPassword &&
      MSU_CONFIG.merchantSecretKey
    );
  }

  getConfiguration(): { configured: boolean; environment: string; merchant: string } {
    return {
      configured: this.isConfigured(),
      environment: MSU_CONFIG.apiUrl.includes('test') ? 'TEST' : 'PRODUCTION',
      merchant: MSU_CONFIG.merchant,
    };
  }
}
