import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Query,
  Body,
  UseGuards,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { BookingService, BookingSearchParams } from './booking.service';
import { BookingStatus } from './entities/booking.entity';
import { JwtAuthGuard } from '../security/jwt-auth.guard';

// ============================================================
// PUBLIC ENDPOINTS (for customers)
// ============================================================

@Controller('bookings')
export class BookingController {
  private readonly logger = new Logger(BookingController.name);

  constructor(private readonly bookingService: BookingService) {}

  /**
   * Get booking by reference (public)
   * Used by customers to view their booking
   */
  @Get('reference/:reference')
  async getByReference(@Param('reference') reference: string) {
    const booking = await this.bookingService.findByReference(reference);
    
    if (!booking) {
      throw new NotFoundException('Rezervasyon bulunamadı');
    }

    // Return sanitized data (no internal IDs)
    return {
      success: true,
      booking: {
        reference: booking.bookingReference,
        pnr: booking.pnr,
        status: booking.status,
        journey: {
          from: booking.fromStation,
          to: booking.toStation,
          departureDate: booking.departureDate,
          departureTime: booking.departureTime,
          arrivalTime: booking.arrivalTime,
          trainNumber: booking.trainNumber,
          operator: booking.operator,
          class: booking.ticketClass,
        },
        passengers: {
          adults: booking.adults,
          children: booking.children,
          travelers: (booking.travelersData || []).map(t => ({
            name: `${t.first_name} ${t.last_name}`,
            type: t.type,
          })),
        },
        pricing: {
          ticketPrice: Number(booking.ticketPrice),
          serviceFee: Number(booking.serviceFee),
          total: Number(booking.totalPrice),
          currency: booking.currency,
          promoCode: booking.promoCode,
          promoDiscount: booking.promoDiscount ? Number(booking.promoDiscount) : undefined,
        },
        ticket: booking.ticketPdfUrl ? {
          pdfUrl: booking.ticketPdfUrl,
          pkpassUrl: booking.ticketPkpassUrl,
        } : undefined,
        createdAt: booking.createdAt,
        confirmedAt: booking.confirmedAt,
      },
    };
  }

  /**
   * Get booking by PNR (public)
   */
  @Get('pnr/:pnr')
  async getByPnr(@Param('pnr') pnr: string) {
    const booking = await this.bookingService.findByPnr(pnr);
    
    if (!booking) {
      throw new NotFoundException('Rezervasyon bulunamadı');
    }

    return {
      success: true,
      booking: {
        reference: booking.bookingReference,
        pnr: booking.pnr,
        status: booking.status,
        journey: {
          from: booking.fromStation,
          to: booking.toStation,
          departureDate: booking.departureDate,
          departureTime: booking.departureTime,
          arrivalTime: booking.arrivalTime,
          operator: booking.operator,
        },
      },
    };
  }

  /**
   * Get bookings by email (public, requires email verification in production)
   */
  @Get('email/:email')
  async getByEmail(@Param('email') email: string) {
    const bookings = await this.bookingService.findByEmail(email);

    return {
      success: true,
      count: bookings.length,
      bookings: bookings.map(b => ({
        reference: b.bookingReference,
        pnr: b.pnr,
        status: b.status,
        from: b.fromStation,
        to: b.toStation,
        departureDate: b.departureDate,
        operator: b.operator,
        total: Number(b.totalPrice),
        currency: b.currency,
        createdAt: b.createdAt,
      })),
    };
  }

  /**
   * Download ticket PDF
   */
  @Get(':reference/ticket')
  async getTicket(@Param('reference') reference: string) {
    const booking = await this.bookingService.findByReference(reference);
    
    if (!booking) {
      throw new NotFoundException('Rezervasyon bulunamadı');
    }

    if (!booking.ticketPdfUrl) {
      throw new NotFoundException('Bilet henüz hazır değil');
    }

    return {
      success: true,
      ticket: {
        pdfUrl: booking.ticketPdfUrl,
        pkpassUrl: booking.ticketPkpassUrl,
      },
    };
  }
}

// ============================================================
// ADMIN ENDPOINTS
// ============================================================

@Controller('admin/bookings')
@UseGuards(JwtAuthGuard)
export class AdminBookingController {
  private readonly logger = new Logger(AdminBookingController.name);

  constructor(private readonly bookingService: BookingService) {}

  /**
   * List all bookings (admin)
   */
  @Get()
  async list(
    @Query('query') query?: string,
    @Query('status') status?: BookingStatus,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const result = await this.bookingService.search({
      query,
      status,
      page: parseInt(page || '1'),
      limit: parseInt(limit || '20'),
    });

    return {
      success: true,
      ...result,
    };
  }

  /**
   * Get booking details (admin)
   */
  @Get(':id')
  async getById(@Param('id') id: string) {
    const booking = await this.bookingService.findById(parseInt(id));
    
    if (!booking) {
      throw new NotFoundException('Rezervasyon bulunamadı');
    }

    return {
      success: true,
      booking,
    };
  }

  /**
   * Update booking status (admin)
   */
  @Put(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body() body: { status: BookingStatus; reason?: string },
  ) {
    const booking = await this.bookingService.updateStatus(
      parseInt(id),
      body.status,
      body.reason,
    );

    this.logger.log(`Booking ${id} status updated to ${body.status}`);

    return {
      success: true,
      booking,
    };
  }

  /**
   * Process refund (admin)
   */
  @Post(':id/refund')
  async processRefund(
    @Param('id') id: string,
    @Body() body: { amount: number; reason: string; adminEmail: string },
  ) {
    const booking = await this.bookingService.processRefund(
      parseInt(id),
      body.amount,
      body.reason,
      body.adminEmail,
    );

    this.logger.log(`Booking ${id} refunded: ${body.amount}`);

    return {
      success: true,
      booking,
    };
  }

  /**
   * Get booking statistics (admin)
   */
  @Get('stats/overview')
  async getStats() {
    const stats = await this.bookingService.getStats();
    return {
      success: true,
      stats,
    };
  }

  /**
   * Get today's bookings (admin)
   */
  @Get('stats/today')
  async getTodayBookings() {
    const bookings = await this.bookingService.getTodayBookings();
    return {
      success: true,
      count: bookings.length,
      bookings,
    };
  }
}
