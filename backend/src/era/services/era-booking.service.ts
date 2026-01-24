import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { EraAuthService } from './era-auth.service';
import { EraMockService } from '../mock/era-mock.service';
import { 
  EraBooking,
  EraBookingStatus,
  EraCreateBookingRequest,
  EraUpdateTravelersRequest,
  EraBookingTravelerInput,
  EraPrebookResponse,
  EraConfirmResponse,
  EraPrintResponse,
} from '../interfaces/era-api.types';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class EraBookingService {
  private readonly logger = new Logger(EraBookingService.name);

  constructor(
    private authService: EraAuthService,
    private mockService: EraMockService,
  ) {}

  /**
   * Yeni booking oluştur
   * Status: CREATED
   */
  async createBooking(offerLocations: string[]): Promise<EraBooking> {
    const correlationId = uuidv4();
    this.logger.log(`Creating booking [${correlationId}] with ${offerLocations.length} offers`);

    // Mock mode
    if (this.authService.isMockMode()) {
      return this.mockService.createBooking(offerLocations);
    }

    // Real API
    const config = this.authService.getConfig();
    const headers = await this.authService.getHeaders(correlationId);

    const request: EraCreateBookingRequest = {
      items: offerLocations.map(loc => ({ offerLocations: [loc] })),
    };

    try {
      const response = await fetch(
        `${config.apiUrl}/bookings`,
        {
          method: 'POST',
          headers,
          body: JSON.stringify(request),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        this.logger.error(`Create booking failed: ${response.status}`, errorData);
        throw new BadRequestException(`Booking creation failed: ${errorData.label || response.status}`);
      }

      const booking: EraBooking = await response.json();
      this.logger.log(`Booking created [${correlationId}]: ${booking.id} - Status: ${booking.status}`);
      
      return booking;
    } catch (error) {
      this.logger.error(`Create booking error [${correlationId}]`, error);
      throw error;
    }
  }

  /**
   * Booking detayını getir
   */
  async getBooking(bookingId: string, refresh = false): Promise<EraBooking> {
    this.logger.debug(`Getting booking: ${bookingId}`);

    // Mock mode
    if (this.authService.isMockMode()) {
      const booking = this.mockService.getBooking(bookingId);
      if (!booking) throw new NotFoundException('Booking not found');
      return booking;
    }

    // Real API
    const config = this.authService.getConfig();
    const headers = await this.authService.getHeaders();

    const url = refresh 
      ? `${config.apiUrl}/bookings/${bookingId}?refresh=true`
      : `${config.apiUrl}/bookings/${bookingId}`;

    try {
      const response = await fetch(url, { method: 'GET', headers });

      if (!response.ok) {
        if (response.status === 404) {
          throw new NotFoundException('Booking not found');
        }
        throw new Error(`Get booking failed: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      this.logger.error('Get booking error', error);
      throw error;
    }
  }

  /**
   * Yolcu bilgilerini güncelle
   * Her booking item için ayrı çağrılmalı!
   */
  async updateTravelers(
    bookingId: string, 
    itemId: string, 
    travelers: EraBookingTravelerInput[]
  ): Promise<EraBooking> {
    this.logger.log(`Updating travelers for booking: ${bookingId}, item: ${itemId}`);

    // Mock mode
    if (this.authService.isMockMode()) {
      return this.mockService.updateTravelers(bookingId, itemId, travelers);
    }

    // Real API
    const config = this.authService.getConfig();
    const headers = await this.authService.getHeaders();

    const request: EraUpdateTravelersRequest = { travelers };

    try {
      const response = await fetch(
        `${config.apiUrl}/bookings/${bookingId}/items/${itemId}/travelers`,
        {
          method: 'PUT',
          headers,
          body: JSON.stringify(request),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new BadRequestException(`Update travelers failed: ${errorData.label || response.status}`);
      }

      return await response.json();
    } catch (error) {
      this.logger.error('Update travelers error', error);
      throw error;
    }
  }

  /**
   * Ön rezervasyon yap
   * Status: CREATED → PREBOOKED
   */
  async prebook(bookingId: string): Promise<EraPrebookResponse> {
    this.logger.log(`Prebooking: ${bookingId}`);

    // Mock mode
    if (this.authService.isMockMode()) {
      return this.mockService.prebook(bookingId);
    }

    // Real API
    const config = this.authService.getConfig();
    const headers = await this.authService.getHeaders();

    try {
      const response = await fetch(
        `${config.apiUrl}/bookings/${bookingId}/checkout/prebook`,
        { method: 'POST', headers }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new BadRequestException(`Prebook failed: ${errorData.label || response.status}`);
      }

      const booking: EraPrebookResponse = await response.json();
      this.logger.log(`Prebooked: ${bookingId} - Status: ${booking.status}`);
      
      return booking;
    } catch (error) {
      this.logger.error('Prebook error', error);
      throw error;
    }
  }

  /**
   * Rezervasyonu onayla
   * Status: PREBOOKED → INVOICED
   */
  async confirm(bookingId: string): Promise<EraConfirmResponse> {
    this.logger.log(`Confirming booking: ${bookingId}`);

    // Mock mode
    if (this.authService.isMockMode()) {
      return this.mockService.confirm(bookingId);
    }

    // Real API
    const config = this.authService.getConfig();
    const headers = await this.authService.getHeaders();

    try {
      const response = await fetch(
        `${config.apiUrl}/bookings/${bookingId}/checkout/confirm`,
        { method: 'POST', headers }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new BadRequestException(`Confirm failed: ${errorData.label || response.status}`);
      }

      const booking: EraConfirmResponse = await response.json();
      this.logger.log(`Confirmed: ${bookingId} - Status: ${booking.status}`);
      
      return booking;
    } catch (error) {
      this.logger.error('Confirm error', error);
      throw error;
    }
  }

  /**
   * Rezervasyonu beklet (confirm yerine)
   */
  async hold(bookingId: string): Promise<EraBooking> {
    this.logger.log(`Holding booking: ${bookingId}`);

    // Mock mode
    if (this.authService.isMockMode()) {
      return this.mockService.hold(bookingId);
    }

    // Real API
    const config = this.authService.getConfig();
    const headers = await this.authService.getHeaders();

    try {
      const response = await fetch(
        `${config.apiUrl}/bookings/${bookingId}/checkout/hold`,
        { method: 'POST', headers }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new BadRequestException(`Hold failed: ${errorData.label || response.status}`);
      }

      return await response.json();
    } catch (error) {
      this.logger.error('Hold error', error);
      throw error;
    }
  }

  /**
   * Bilet yazdır
   */
  async printTickets(bookingId: string, format: 'PDF' | 'PKPASS' = 'PDF'): Promise<EraPrintResponse> {
    this.logger.log(`Printing tickets for: ${bookingId}`);

    // Mock mode
    if (this.authService.isMockMode()) {
      return this.mockService.printTickets(bookingId, format);
    }

    // Real API
    const config = this.authService.getConfig();
    const headers = await this.authService.getHeaders();

    try {
      const response = await fetch(
        `${config.apiUrl}/bookings/${bookingId}/print`,
        {
          method: 'POST',
          headers,
          body: JSON.stringify({ format }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new BadRequestException(`Print failed: ${errorData.label || response.status}`);
      }

      return await response.json();
    } catch (error) {
      this.logger.error('Print error', error);
      throw error;
    }
  }

  /**
   * Booking item sil
   * Sadece CREATED veya PREBOOKED durumda çalışır
   * En az 1 item kalmalı
   */
  async deleteItem(bookingId: string, itemId: string): Promise<EraBooking> {
    this.logger.log(`Deleting item ${itemId} from booking ${bookingId}`);

    // Mock mode
    if (this.authService.isMockMode()) {
      return this.mockService.deleteItem(bookingId, itemId);
    }

    // Real API
    const config = this.authService.getConfig();
    const headers = await this.authService.getHeaders();

    try {
      const response = await fetch(
        `${config.apiUrl}/bookings/${bookingId}/items/${itemId}`,
        { method: 'DELETE', headers }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new BadRequestException(`Delete item failed: ${errorData.label || response.status}`);
      }

      return await this.getBooking(bookingId, true);
    } catch (error) {
      this.logger.error('Delete item error', error);
      throw error;
    }
  }

  /**
   * Tam booking akışı helper - test için
   */
  async fullBookingFlow(
    offerLocation: string,
    travelers: EraBookingTravelerInput[]
  ): Promise<{ booking: EraBooking; tickets: EraPrintResponse }> {
    // 1. Create
    const booking = await this.createBooking([offerLocation]);
    
    // 2. Update travelers (her item için)
    for (const item of booking.items) {
      await this.updateTravelers(booking.id!, item.id!, travelers);
    }
    
    // 3. Prebook
    await this.prebook(booking.id!);
    
    // 4. Confirm
    const confirmedBooking = await this.confirm(booking.id!);
    
    // 5. Print
    const tickets = await this.printTickets(booking.id!);
    
    return { booking: confirmedBooking, tickets };
  }
}
