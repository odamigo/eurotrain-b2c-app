import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { EraAuthService } from './era-auth.service';
import { EraMockService } from '../mock/era-mock.service';
import { 
  EraRefundQuotation,
  EraRefundQuotationRequest,
  EraRefundConfirmRequest,
  EraRefundResponse,
  EraExchangeSearchRequest,
  EraExchangeSearchResponse,
  EraExchangeQuotation,
  EraExchangeQuotationRequest,
  EraExchangeConfirmRequest,
  EraExchangeResponse,
  EraLegRequest,
} from '../interfaces/era-api.types';

@Injectable()
export class EraRefundService {
  private readonly logger = new Logger(EraRefundService.name);

  constructor(
    private authService: EraAuthService,
    private mockService: EraMockService,
  ) {}

  // ============================================================
  // REFUND (İADE)
  // ============================================================

  /**
   * İade teklifi al
   * Booking INVOICED durumda olmalı
   */
  async getRefundQuotation(
    bookingId: string, 
    items?: string[]
  ): Promise<EraRefundQuotation> {
    this.logger.log(`Getting refund quotation for booking: ${bookingId}`);

    // Mock mode
    if (this.authService.isMockMode()) {
      return this.mockService.getRefundQuotation(bookingId, items);
    }

    // Real API
    const config = this.authService.getConfig();
    const headers = await this.authService.getHeaders();

    const request: EraRefundQuotationRequest = items ? { items } : {};

    try {
      const response = await fetch(
        `${config.apiUrl}/bookings/${bookingId}/refunds/quotation`,
        {
          method: 'POST',
          headers,
          body: JSON.stringify(request),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new BadRequestException(`Refund quotation failed: ${errorData.label || response.status}`);
      }

      const quotation: EraRefundQuotation = await response.json();
      this.logger.log(`Refund quotation received: ${quotation.id}, amount: ${quotation.refundAmount?.amount}`);
      
      return quotation;
    } catch (error) {
      this.logger.error('Refund quotation error', error);
      throw error;
    }
  }

  /**
   * İadeyi onayla
   */
  async confirmRefund(bookingId: string, quotationId: string): Promise<EraRefundResponse> {
    this.logger.log(`Confirming refund for booking: ${bookingId}, quotation: ${quotationId}`);

    // Mock mode
    if (this.authService.isMockMode()) {
      return this.mockService.confirmRefund(bookingId, quotationId);
    }

    // Real API
    const config = this.authService.getConfig();
    const headers = await this.authService.getHeaders();

    const request: EraRefundConfirmRequest = { quotationId };

    try {
      const response = await fetch(
        `${config.apiUrl}/bookings/${bookingId}/refunds/confirm`,
        {
          method: 'POST',
          headers,
          body: JSON.stringify(request),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new BadRequestException(`Refund confirm failed: ${errorData.label || response.status}`);
      }

      const refundResponse: EraRefundResponse = await response.json();
      this.logger.log(`Refund confirmed: ${bookingId} - Status: ${refundResponse.status}`);
      
      return refundResponse;
    } catch (error) {
      this.logger.error('Refund confirm error', error);
      throw error;
    }
  }

  /**
   * Tam iade akışı helper
   */
  async processFullRefund(bookingId: string): Promise<EraRefundResponse> {
    // 1. Quotation al
    const quotation = await this.getRefundQuotation(bookingId);
    
    // 2. Confirm
    return this.confirmRefund(bookingId, quotation.id!);
  }

  // ============================================================
  // EXCHANGE (DEĞİŞİKLİK)
  // ============================================================

  /**
   * Değişiklik için yeni sefer ara
   */
  async searchExchangeOffers(
    bookingId: string,
    legs: EraLegRequest[],
    items?: string[]
  ): Promise<EraExchangeSearchResponse> {
    this.logger.log(`Searching exchange offers for booking: ${bookingId}`);

    // Mock mode
    if (this.authService.isMockMode()) {
      return this.mockService.searchExchangeOffers(bookingId, legs, items);
    }

    // Real API
    const config = this.authService.getConfig();
    const headers = await this.authService.getHeaders();

    const request: EraExchangeSearchRequest = { legs, items };

    try {
      const response = await fetch(
        `${config.apiUrl}/bookings/${bookingId}/exchanges/search`,
        {
          method: 'POST',
          headers,
          body: JSON.stringify(request),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new BadRequestException(`Exchange search failed: ${errorData.label || response.status}`);
      }

      const searchResponse: EraExchangeSearchResponse = await response.json();
      this.logger.log(`Exchange search completed: ${searchResponse.offers?.length || 0} offers`);
      
      return searchResponse;
    } catch (error) {
      this.logger.error('Exchange search error', error);
      throw error;
    }
  }

  /**
   * Değişiklik teklifi al
   */
  async getExchangeQuotation(
    bookingId: string,
    offerLocation: string
  ): Promise<EraExchangeQuotation> {
    this.logger.log(`Getting exchange quotation for booking: ${bookingId}`);

    // Mock mode
    if (this.authService.isMockMode()) {
      return this.mockService.getExchangeQuotation(bookingId, offerLocation);
    }

    // Real API
    const config = this.authService.getConfig();
    const headers = await this.authService.getHeaders();

    const request: EraExchangeQuotationRequest = { offerLocation };

    try {
      const response = await fetch(
        `${config.apiUrl}/bookings/${bookingId}/exchanges/quotation`,
        {
          method: 'POST',
          headers,
          body: JSON.stringify(request),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new BadRequestException(`Exchange quotation failed: ${errorData.label || response.status}`);
      }

      const quotation: EraExchangeQuotation = await response.json();
      this.logger.log(`Exchange quotation received: ${quotation.id}`);
      
      return quotation;
    } catch (error) {
      this.logger.error('Exchange quotation error', error);
      throw error;
    }
  }

  /**
   * Değişikliği onayla
   */
  async confirmExchange(bookingId: string, quotationId: string): Promise<EraExchangeResponse> {
    this.logger.log(`Confirming exchange for booking: ${bookingId}`);

    // Mock mode
    if (this.authService.isMockMode()) {
      return this.mockService.confirmExchange(bookingId, quotationId);
    }

    // Real API
    const config = this.authService.getConfig();
    const headers = await this.authService.getHeaders();

    const request: EraExchangeConfirmRequest = { quotationId };

    try {
      const response = await fetch(
        `${config.apiUrl}/bookings/${bookingId}/exchanges/confirm`,
        {
          method: 'POST',
          headers,
          body: JSON.stringify(request),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new BadRequestException(`Exchange confirm failed: ${errorData.label || response.status}`);
      }

      const exchangeResponse: EraExchangeResponse = await response.json();
      this.logger.log(`Exchange confirmed: ${bookingId}`);
      
      return exchangeResponse;
    } catch (error) {
      this.logger.error('Exchange confirm error', error);
      throw error;
    }
  }
}
