import { Injectable, Logger } from '@nestjs/common';
import { SessionCacheService, BookingSession, TravelerData } from './session-cache.service';
import { PaymentService } from '../../payment/payment.service';
import { BookingsService } from '../../bookings/bookings.service';
import { Booking, BookingStatus } from '../../bookings/entities/booking.entity';
import { Payment } from '../../payment/entities/payment.entity';
import { PaymentCurrency } from '../../payment/entities/payment.entity';
import * as crypto from 'crypto';

// ============================================================
// TYPES
// ============================================================

export interface InitiatePaymentInput {
  session_token: string;
  return_url?: string;
  cancel_url?: string;
  locale?: string;
  customer_ip?: string;
}

export interface InitiatePaymentResult {
  success: boolean;
  payment_url?: string;
  payment_id?: string;
  order_id?: string;
  expires_at?: string;
  error_code?: string;
  error_message?: string;
}

export interface PaymentCallbackInput {
  order_id: string;
  response_code: string;
  response_msg?: string;
  pg_tran_id?: string;
  auth_code?: string;
  card_last_four?: string;
  card_brand?: string;
  is_3d_secure?: boolean;
  session_token?: string;
  raw_data?: Record<string, any>;
}

export interface PaymentCallbackResult {
  success: boolean;
  booking_reference?: string;
  redirect_url: string;
  error_message?: string;
}

export interface BookingResult {
  booking_reference: string;
  pnr: string;
  status: string;
  journey: {
    origin: string;
    destination: string;
    departure: string;
    arrival: string;
    operator: string;
    train_number: string;
  };
  travelers: Array<{
    name: string;
    type: string;
  }>;
  pricing: {
    ticket_price: number;
    service_fee: number;
    total_paid: number;
    currency: string;
  };
  ticket_url?: string;
  created_at: string;
}

// ============================================================
// CONSTANTS
// ============================================================

const PAYMENT_TTL_MINUTES = 15;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

// ============================================================
// SERVICE
// ============================================================

@Injectable()
export class CheckoutService {
  private readonly logger = new Logger(CheckoutService.name);

  private paymentSessionLinks: Map<string, string> = new Map();

  constructor(
    private readonly sessionCache: SessionCacheService,
    private readonly paymentService: PaymentService,
    private readonly bookingsService: BookingsService,
  ) {}

  // ============================================================
  // INITIATE PAYMENT
  // ============================================================

  async initiatePayment(input: InitiatePaymentInput): Promise<InitiatePaymentResult> {
    const { session_token, customer_ip } = input;
    
    this.logger.log(`Initiating payment for session: ${session_token}`);

    const session = this.sessionCache.getSession(session_token);
    if (!session) {
      return {
        success: false,
        error_code: 'SESSION_NOT_FOUND',
        error_message: 'Oturum bulunamadı veya süresi dolmuş. Lütfen yeni bir arama yapın.',
      };
    }

    if (session.status === 'PAYMENT_INITIATED') {
      return {
        success: false,
        error_code: 'PAYMENT_ALREADY_INITIATED',
        error_message: 'Bu oturum için ödeme zaten başlatılmış.',
      };
    }

    if (session.status === 'COMPLETED') {
      return {
        success: false,
        error_code: 'SESSION_COMPLETED',
        error_message: 'Bu rezervasyon zaten tamamlanmış.',
      };
    }

    if (!session.travelers || session.travelers.length === 0) {
      return {
        success: false,
        error_code: 'NO_TRAVELERS',
        error_message: 'Lütfen yolcu bilgilerini doldurun.',
      };
    }

    const requiredTravelers = session.adults + session.children;
    if (session.travelers.length < requiredTravelers) {
      return {
        success: false,
        error_code: 'MISSING_TRAVELERS',
        error_message: `${requiredTravelers} yolcu bilgisi gerekli, ${session.travelers.length} girilmiş.`,
      };
    }

    const leadTraveler = session.travelers.find(t => t.type === 'adult');
    if (!leadTraveler?.email || !leadTraveler?.phone) {
      return {
        success: false,
        error_code: 'MISSING_CONTACT',
        error_message: 'Ana yolcunun e-posta ve telefon bilgileri zorunludur.',
      };
    }

    try {
      const orderId = this.generateOrderId();
      const eraBookingId = await this.createEraBooking(session);
      
      this.sessionCache.markPaymentInitiated(session_token, eraBookingId);

      const paymentResult = await this.paymentService.initiatePayment({
        orderId,
        bookingId: 0,
        amount: session.total_price,
        currency: this.mapCurrency(session.currency),
        customerEmail: leadTraveler.email,
        customerName: `${leadTraveler.first_name} ${leadTraveler.last_name}`,
        customerIp: customer_ip,
      }, customer_ip);

      if (!paymentResult.success) {
        const sess = this.sessionCache.getSession(session_token);
        if (sess) sess.status = 'TRAVELERS_ADDED';
        
        return {
          success: false,
          error_code: 'PAYMENT_INIT_FAILED',
          error_message: paymentResult.message || 'Ödeme başlatılamadı. Lütfen tekrar deneyin.',
        };
      }

      this.paymentSessionLinks.set(orderId, session_token);

      this.logger.log(`Payment initiated: order=${orderId}, payment=${paymentResult.paymentId}, session=${session_token}`);

      return {
        success: true,
        payment_url: paymentResult.redirectUrl,
        payment_id: paymentResult.paymentId,
        order_id: orderId,
        expires_at: new Date(Date.now() + PAYMENT_TTL_MINUTES * 60 * 1000).toISOString(),
      };

    } catch (error) {
      this.logger.error(`Payment initiation failed: ${(error as Error).message}`, (error as Error).stack);
      
      const sess = this.sessionCache.getSession(session_token);
      if (sess) sess.status = 'TRAVELERS_ADDED';

      return {
        success: false,
        error_code: 'INTERNAL_ERROR',
        error_message: 'Ödeme işlemi başlatılırken bir hata oluştu. Lütfen tekrar deneyin.',
      };
    }
  }

  // ============================================================
  // PAYMENT CALLBACK
  // ============================================================

  async handlePaymentCallback(input: PaymentCallbackInput): Promise<PaymentCallbackResult> {
    const { order_id, response_code } = input;
    
    this.logger.log(`Payment callback: order=${order_id}, code=${response_code}`);

    try {
      const payment = await this.paymentService.getPaymentByOrderId(order_id);
      if (!payment) {
        this.logger.error(`Payment not found for order: ${order_id}`);
        return {
          success: false,
          redirect_url: `${FRONTEND_URL}/payment/error?message=Ödeme+bulunamadı`,
          error_message: 'Ödeme kaydı bulunamadı',
        };
      }

      const sessionToken = this.paymentSessionLinks.get(order_id);
      const session = sessionToken ? this.sessionCache.getSession(sessionToken) : null;

      const isSuccess = response_code === '00';

      if (isSuccess) {
        return await this.completeBooking(payment, session, input);
      } else {
        return await this.handleFailedPayment(payment, session, input);
      }

    } catch (error) {
      this.logger.error(`Payment callback error: ${(error as Error).message}`, (error as Error).stack);
      return {
        success: false,
        redirect_url: `${FRONTEND_URL}/payment/error?message=İşlem+sırasında+hata+oluştu`,
        error_message: (error as Error).message,
      };
    }
  }

  // ============================================================
  // COMPLETE BOOKING (Payment Success)
  // ============================================================

  private async completeBooking(
    payment: Payment,
    session: BookingSession | null,
    callbackInput: PaymentCallbackInput,
  ): Promise<PaymentCallbackResult> {
    
    this.logger.log(`Completing booking for payment: ${payment.id}`);

    try {
      const eraConfirmation = await this.confirmEraBooking(session?.era_booking_id);

      const bookingReference = this.generateBookingReference();
      const pnr = this.generatePnr();

      let booking: Booking;

      if (session) {
        // REFACTORED: camelCase kullan
        booking = await this.bookingsService.createFromSession({
          bookingReference,
          pnr,
          customerName: session.travelers?.[0] 
            ? `${session.travelers[0].first_name} ${session.travelers[0].last_name}`
            : 'Unknown',
          customerEmail: session.travelers?.[0]?.email || '',
          customerPhone: session.travelers?.[0]?.phone || '',
          fromStation: session.origin_name,
          toStation: session.destination_name,
          fromStationCode: session.origin_code,
          toStationCode: session.destination_code,
          departureDate: session.departure,
          departureTime: this.extractTime(session.departure),
          arrivalTime: this.extractTime(session.arrival),
          trainNumber: session.train_number,
          operator: session.operator,
          ticketClass: session.comfort_class,
          adults: session.adults,
          children: session.children,
          travelersData: session.travelers,
          ticketPrice: session.base_price * (session.adults + session.children),
          serviceFee: session.service_fee,
          totalPrice: session.total_price,
          currency: session.currency,
          promoCode: session.promo_code,
          promoDiscount: session.promo_discount,
          paymentId: payment.id,
          paymentMethod: 'credit_card',
          sessionToken: session.session_token,
          traceId: session.trace_id,
          eraBookingId: session.era_booking_id,
          eraPnr: eraConfirmation?.pnr,
        });
      } else {
        // REFACTORED: camelCase kullan
        booking = await this.bookingsService.createFromSession({
          bookingReference,
          pnr,
          customerName: payment.customerName || 'Unknown',
          customerEmail: payment.customerEmail || '',
          fromStation: 'Unknown',
          toStation: 'Unknown',
          departureDate: new Date().toISOString(),
          departureTime: '00:00',
          arrivalTime: '00:00',
          trainNumber: '',
          operator: '',
          ticketClass: 'standard',
          adults: 1,
          children: 0,
          ticketPrice: Number(payment.amount),
          serviceFee: 0,
          totalPrice: Number(payment.amount),
          currency: payment.currency || 'EUR',
          paymentId: payment.id,
        });
      }

      if (session) {
        this.sessionCache.markCompleted(session.session_token);
      }

      this.sendConfirmationEmail(booking).catch(err => {
        this.logger.error(`Failed to send confirmation email: ${err.message}`);
      });

      this.logger.log(`Booking completed: ${bookingReference}, PNR: ${pnr}`);

      return {
        success: true,
        booking_reference: bookingReference,
        redirect_url: `${FRONTEND_URL}/booking/success?ref=${bookingReference}&pnr=${pnr}`,
      };

    } catch (error) {
      this.logger.error(`Complete booking failed: ${(error as Error).message}`, (error as Error).stack);
      
      return {
        success: false,
        redirect_url: `${FRONTEND_URL}/payment/success?orderId=${payment.orderId}&paymentId=${payment.id}&manual=true`,
        error_message: 'Ödeme başarılı ancak rezervasyon oluşturulamadı. Destek ekibimiz sizinle iletişime geçecek.',
      };
    }
  }

  // ============================================================
  // HANDLE FAILED PAYMENT
  // ============================================================

  private async handleFailedPayment(
    payment: Payment,
    session: BookingSession | null,
    callbackInput: PaymentCallbackInput,
  ): Promise<PaymentCallbackResult> {
    
    this.logger.warn(`Payment failed: ${payment.id}, code: ${callbackInput.response_code}`);

    try {
      if (session?.era_booking_id) {
        await this.cancelEraBooking(session.era_booking_id);
      }

      if (session) {
        session.status = 'TRAVELERS_ADDED';
      }

      const errorMessage = this.getPaymentErrorMessage(callbackInput.response_code);

      return {
        success: false,
        redirect_url: `${FRONTEND_URL}/checkout/${session?.session_token}?error=${encodeURIComponent(errorMessage)}`,
        error_message: errorMessage,
      };

    } catch (error) {
      this.logger.error(`Handle failed payment error: ${(error as Error).message}`);
      return {
        success: false,
        redirect_url: `${FRONTEND_URL}/payment/error?message=${encodeURIComponent(callbackInput.response_msg || 'Ödeme başarısız')}`,
        error_message: (error as Error).message,
      };
    }
  }

  // ============================================================
  // GET BOOKING BY REFERENCE
  // ============================================================

  async getBookingByReference(reference: string): Promise<BookingResult | null> {
    const booking = await this.bookingsService.findByReference(reference);

    if (!booking) return null;

    // REFACTORED: camelCase kullan
    return {
      booking_reference: booking.bookingReference,
      pnr: booking.pnr || '',
      status: booking.status,
      journey: {
        origin: booking.fromStation,
        destination: booking.toStation,
        departure: booking.departureDate?.toString() || '',
        arrival: booking.arrivalTime || '',
        operator: booking.operator || '',
        train_number: booking.trainNumber || '',
      },
      travelers: (booking.travelersData || []).map((t: TravelerData) => ({
        name: `${t.first_name} ${t.last_name}`,
        type: t.type,
      })),
      pricing: {
        ticket_price: Number(booking.ticketPrice),
        service_fee: Number(booking.serviceFee || 0),
        total_paid: Number(booking.totalPrice),
        currency: booking.currency || 'EUR',
      },
      ticket_url: booking.ticketPdfUrl,
      created_at: booking.createdAt.toISOString(),
    };
  }

  // ============================================================
  // ERA BOOKING METHODS (Mock implementations)
  // ============================================================

  private async createEraBooking(session: BookingSession): Promise<string> {
    const mockBookingId = `era_${crypto.randomBytes(8).toString('hex')}`;
    this.logger.log(`[MOCK] ERA booking created: ${mockBookingId}`);
    return mockBookingId;
  }

  private async confirmEraBooking(eraBookingId?: string): Promise<{ pnr: string } | null> {
    if (!eraBookingId) return null;
    const mockPnr = `PNR${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
    this.logger.log(`[MOCK] ERA booking confirmed: ${eraBookingId}, PNR: ${mockPnr}`);
    return { pnr: mockPnr };
  }

  private async cancelEraBooking(eraBookingId: string): Promise<void> {
    this.logger.log(`[MOCK] ERA booking cancelled: ${eraBookingId}`);
  }

  // ============================================================
  // HELPER METHODS
  // ============================================================

  private generateOrderId(): string {
    const timestamp = Date.now().toString(36);
    const random = crypto.randomBytes(4).toString('hex');
    return `ET-${timestamp}-${random}`.toUpperCase();
  }

  private generateBookingReference(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let result = 'ET-';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  private generatePnr(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
    let result = 'PNR';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  private mapCurrency(currency: string): PaymentCurrency {
    const map: Record<string, PaymentCurrency> = {
      'EUR': PaymentCurrency.EUR,
      'USD': PaymentCurrency.USD,
      'TRY': PaymentCurrency.TRY,
    };
    return map[currency] || PaymentCurrency.EUR;
  }

  private extractTime(isoString: string): string {
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  }

  private getPaymentErrorMessage(code: string): string {
    const messages: Record<string, string> = {
      '05': 'Kart reddedildi. Lütfen bankanızla iletişime geçin.',
      '51': 'Yetersiz bakiye.',
      '54': 'Kart süresi dolmuş.',
      '57': 'Bu işlem kartınız için izin verilmiyor.',
      '61': 'Günlük limit aşıldı.',
      '62': 'Kart kısıtlanmış.',
      '65': 'Haftalık işlem limiti aşıldı.',
      '91': 'Banka şu anda kullanılamıyor. Lütfen daha sonra tekrar deneyin.',
      '96': 'Sistem hatası. Lütfen tekrar deneyin.',
    };
    return messages[code] || 'Ödeme işlemi başarısız oldu. Lütfen tekrar deneyin.';
  }

  private async sendConfirmationEmail(booking: Booking): Promise<void> {
    this.logger.log(`[PLACEHOLDER] Sending confirmation email to: ${booking.customerEmail}`);
  }
}
