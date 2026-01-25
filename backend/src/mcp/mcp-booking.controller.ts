import { 
  Controller, 
  Post, 
  Get, 
  Body, 
  Param, 
  Query,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { BookingsService } from '../bookings/bookings.service';
import { PaymentService } from '../payment/payment.service';
import { PaymentCurrency } from '../payment/entities/payment.entity';
import * as crypto from 'crypto';

// ============================================================
// DTOs
// ============================================================

export class CreateMcpBookingDto {
  // Journey bilgileri
  origin: string;
  destination: string;
  departureDate: string;
  departureTime: string;
  arrivalTime: string;
  trainNumber: string;
  operator: string;
  comfortClass: string;
  
  // Fiyat
  price: number;
  currency: string;
  
  // Yolcu bilgileri
  passengerName: string;
  passengerEmail: string;
  passengerCount?: number;
  
  // MCP bilgileri
  mcpSessionId?: string;
  offerId?: string;
}

export class McpBookingResponse {
  success: boolean;
  bookingToken?: string;
  bookingId?: number;
  checkoutUrl?: string;
  expiresAt?: string;
  error?: string;
  
  // Özet bilgiler
  summary?: {
    route: string;
    date: string;
    time: string;
    train: string;
    class: string;
    price: string;
    passenger: string;
  };
}

// ============================================================
// MCP BOOKING CONTROLLER
// ============================================================

@Controller('mcp')
export class McpBookingController {
  // Token cache (production'da Redis kullanılmalı)
  private bookingTokens: Map<string, {
    bookingId: number;
    expiresAt: Date;
    used: boolean;
  }> = new Map();

  constructor(
    private readonly bookingsService: BookingsService,
    private readonly paymentService: PaymentService,
  ) {
    // Expired token'ları temizle (her 5 dakikada)
    setInterval(() => this.cleanupExpiredTokens(), 5 * 60 * 1000);
  }

  /**
   * POST /mcp/booking/create
   * MCP'den gelen booking isteği - Pre-filled checkout URL döner
   */
  @Post('booking/create')
  async createMcpBooking(@Body() dto: CreateMcpBookingDto): Promise<McpBookingResponse> {
    try {
      // Validasyon
      if (!dto.origin || !dto.destination) {
        throw new BadRequestException('Origin and destination are required');
      }
      if (!dto.passengerName || !dto.passengerEmail) {
        throw new BadRequestException('Passenger name and email are required');
      }
      if (!dto.price || dto.price <= 0) {
        throw new BadRequestException('Valid price is required');
      }

      // 1. Booking oluştur (PENDING_MCP status)
      const booking = await this.bookingsService.create({
        customerName: dto.passengerName,
        customerEmail: dto.passengerEmail,
        fromStation: dto.origin,
        toStation: dto.destination,
        price: dto.price,
        departure_date: dto.departureDate,
        departure_time: dto.departureTime,
        arrival_time: dto.arrivalTime,
        train_number: dto.trainNumber,
        operator: dto.operator,
      });

      // 2. Unique token oluştur (30 dakika geçerli)
      const bookingToken = this.generateBookingToken();
      const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 dakika

      // Token'ı cache'le
      this.bookingTokens.set(bookingToken, {
        bookingId: booking.id,
        expiresAt,
        used: false,
      });

      // 3. Pre-filled checkout URL oluştur
      const baseUrl = process.env.FRONTEND_URL || 'https://eurotrain.net';
      const checkoutUrl = `${baseUrl}/booking/checkout?token=${bookingToken}`;

      // 4. Özet bilgiler
      const summary = {
        route: `${dto.origin} → ${dto.destination}`,
        date: dto.departureDate,
        time: `${dto.departureTime} - ${dto.arrivalTime}`,
        train: `${dto.operator} ${dto.trainNumber}`,
        class: dto.comfortClass || 'Standard',
        price: `€${dto.price.toFixed(2)}`,
        passenger: dto.passengerName,
      };

      return {
        success: true,
        bookingToken,
        bookingId: booking.id,
        checkoutUrl,
        expiresAt: expiresAt.toISOString(),
        summary,
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Booking creation failed',
      };
    }
  }

  /**
   * GET /mcp/booking/status/:token
   * Booking durumunu sorgula
   */
  @Get('booking/status/:token')
  async getBookingStatus(@Param('token') token: string) {
    const tokenData = this.bookingTokens.get(token);

    if (!tokenData) {
      throw new NotFoundException('Invalid or expired booking token');
    }

    if (new Date() > tokenData.expiresAt) {
      this.bookingTokens.delete(token);
      throw new BadRequestException('Booking token has expired');
    }

    const booking = await this.bookingsService.findOne(tokenData.bookingId);

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    // Ödeme durumunu kontrol et
    const payments = await this.paymentService.getPaymentsByBookingId(tokenData.bookingId);
    const completedPayment = payments.find(p => p.status === 'completed');

    return {
      success: true,
      booking: {
        id: booking.id,
        status: booking.status,
        route: `${booking.fromStation} → ${booking.toStation}`,
        date: booking.departure_date,
        price: booking.price,
        pnr: booking.pnr,
      },
      payment: {
        status: completedPayment ? 'completed' : (payments.length > 0 ? 'pending' : 'not_started'),
        completedAt: completedPayment?.completedAt,
      },
      tokenValid: true,
      expiresAt: tokenData.expiresAt.toISOString(),
    };
  }

  /**
   * GET /mcp/booking/verify/:token
   * Token ile booking bilgilerini getir (checkout sayfası için)
   */
  @Get('booking/verify/:token')
  async verifyBookingToken(@Param('token') token: string) {
    const tokenData = this.bookingTokens.get(token);

    if (!tokenData) {
      return { valid: false, error: 'Invalid booking token' };
    }

    if (new Date() > tokenData.expiresAt) {
      this.bookingTokens.delete(token);
      return { valid: false, error: 'Booking token has expired' };
    }

    if (tokenData.used) {
      return { valid: false, error: 'Booking token already used' };
    }

    const booking = await this.bookingsService.findOne(tokenData.bookingId);

    if (!booking) {
      return { valid: false, error: 'Booking not found' };
    }

    return {
      valid: true,
      booking: {
        id: booking.id,
        customerName: booking.customerName,
        customerEmail: booking.customerEmail,
        fromStation: booking.fromStation,
        toStation: booking.toStation,
        departureDate: booking.departure_date,
        departureTime: booking.departure_time,
        arrivalTime: booking.arrival_time,
        trainNumber: booking.train_number,
        operator: booking.operator,
        ticketClass: booking.ticket_class,
        price: booking.price,
        status: booking.status,
      },
      expiresAt: tokenData.expiresAt.toISOString(),
      remainingMinutes: Math.max(0, Math.floor((tokenData.expiresAt.getTime() - Date.now()) / 60000)),
    };
  }

  /**
   * POST /mcp/booking/initiate-payment/:token
   * Token ile ödeme başlat
   */
  @Post('booking/initiate-payment/:token')
  async initiatePaymentWithToken(
    @Param('token') token: string,
    @Body() body: { customerIp?: string },
  ) {
    const tokenData = this.bookingTokens.get(token);

    if (!tokenData) {
      throw new NotFoundException('Invalid or expired booking token');
    }

    if (new Date() > tokenData.expiresAt) {
      this.bookingTokens.delete(token);
      throw new BadRequestException('Booking token has expired');
    }

    const booking = await this.bookingsService.findOne(tokenData.bookingId);

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    // Ödeme başlat
    const orderId = `MCP-${booking.id}-${Date.now()}`;
    
    const paymentResult = await this.paymentService.initiatePayment({
      orderId,
      bookingId: booking.id,
      amount: Number(booking.price),
      currency: PaymentCurrency.EUR,
      customerEmail: booking.customerEmail,
      customerName: booking.customerName,
      customerIp: body.customerIp,
    });

    if (paymentResult.success) {
      // Token'ı kullanıldı olarak işaretle
      tokenData.used = true;
    }

    return paymentResult;
  }

  // ============================================================
  // HELPER METHODS
  // ============================================================

  private generateBookingToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  private cleanupExpiredTokens(): void {
    const now = new Date();
    for (const [token, data] of this.bookingTokens.entries()) {
      if (now > data.expiresAt) {
        this.bookingTokens.delete(token);
      }
    }
  }
}
