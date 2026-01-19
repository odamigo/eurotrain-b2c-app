import { Injectable, Logger } from '@nestjs/common';
import { MSU_CONFIG } from './msu.config';

interface SessionTokenRequest {
  amount: number;
  orderId: string;
  customerEmail: string;
  customerName: string;
  customerId?: string;
}

interface SessionTokenResponse {
  success: boolean;
  sessionToken?: string;
  errorCode?: string;
  errorMessage?: string;
  redirectUrl?: string;
}

@Injectable()
export class MsuService {
  private readonly logger = new Logger(MsuService.name);

  async createSessionToken(request: SessionTokenRequest): Promise<SessionTokenResponse> {
    try {
      const params = new URLSearchParams();
      params.append('ACTION', 'SESSIONTOKEN');
      params.append('MERCHANTUSER', MSU_CONFIG.merchantUser);
      params.append('MERCHANTPASSWORD', MSU_CONFIG.merchantPassword);
      params.append('MERCHANT', MSU_CONFIG.merchant);
      params.append('SESSIONTYPE', 'PAYMENTSESSION');
      params.append('AMOUNT', request.amount.toFixed(2));
      params.append('CURRENCY', MSU_CONFIG.currency);
      params.append('MERCHANTPAYMENTID', request.orderId);
      params.append('CUSTOMER', request.customerId || request.customerEmail);
      params.append('CUSTOMERNAME', request.customerName);
      params.append('CUSTOMEREMAIL', request.customerEmail);
      params.append('RETURNURL', MSU_CONFIG.returnUrl);
      params.append('LANGUAGE', MSU_CONFIG.language);

      this.logger.log(`Creating session token for order: ${request.orderId}`);

      const response = await fetch(MSU_CONFIG.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
      });

      const result = await response.json();

      this.logger.log(`MSU Response: ${JSON.stringify(result)}`);

      if (result.responseCode === '00') {
        const redirectUrl = `${MSU_CONFIG.hostedPageUrl}/hpp/${result.sessionToken}`;
        
        return {
          success: true,
          sessionToken: result.sessionToken,
          redirectUrl: redirectUrl,
        };
      } else {
        return {
          success: false,
          errorCode: result.responseCode,
          errorMessage: result.responseMsg || result.errorMsg || 'Session oluşturulamadı',
        };
      }
    } catch (error) {
      this.logger.error(`Session token creation failed: ${error.message}`);
      return {
        success: false,
        errorCode: 'SYSTEM_ERROR',
        errorMessage: 'Ödeme oturumu oluşturulamadı. Lütfen tekrar deneyin.',
      };
    }
  }

  async queryPayment(sessionToken: string): Promise<any> {
    try {
      const params = new URLSearchParams();
      params.append('ACTION', 'QUERYSESSION');
      params.append('MERCHANTUSER', MSU_CONFIG.merchantUser);
      params.append('MERCHANTPASSWORD', MSU_CONFIG.merchantPassword);
      params.append('MERCHANT', MSU_CONFIG.merchant);
      params.append('SESSIONTOKEN', sessionToken);

      const response = await fetch(MSU_CONFIG.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
      });

      return await response.json();
    } catch (error) {
      this.logger.error(`Query payment failed: ${error.message}`);
      return null;
    }
  }

  verifyCallback(callbackData: any): boolean {
    // sdSha512 hash doğrulaması yapılabilir
    // Şimdilik responseCode kontrolü
    return callbackData.responseCode === '00';
  }
}