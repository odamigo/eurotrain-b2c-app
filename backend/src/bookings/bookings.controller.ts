import { 
  Controller, Get, Post, Body, Patch, Param, Delete, 
  Query, HttpCode, HttpStatus, BadRequestException, NotFoundException 
} from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';
import { BookingStatus } from './entities/booking.entity';

// ============================================================
// DTOs for Refund & Exchange
// ============================================================

class RefundQuotationDto {
  bookingId: number;
  reason?: string;
}

class RefundConfirmDto {
  bookingId: number;
  quotationId: string;
  reason: string;
  refundedBy?: string;
}

class ExchangeSearchDto {
  bookingId: number;
  newDepartureDate: string;
  newDepartureTime?: string;
}

class ExchangeConfirmDto {
  bookingId: number;
  quotationId: string;
  newOfferId: string;
}

// ============================================================
// CONTROLLER
// ============================================================

@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  // ============================================================
  // MEVCUT CRUD ENDPOINT'LERİ
  // ============================================================

  @Post()
  create(@Body() createBookingDto: CreateBookingDto) {
    return this.bookingsService.create(createBookingDto);
  }

  @Get()
  findAll() {
    return this.bookingsService.findAll();
  }

  @Get('stats')
  getStats() {
    return this.bookingsService.getStats();
  }

  @Get('today')
  getTodayBookings() {
    return this.bookingsService.getTodayBookings();
  }

  @Get('search')
  search(
    @Query('query') query?: string,
    @Query('status') status?: string,
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.bookingsService.search({
      query,
      status,
      fromDate: fromDate ? new Date(fromDate) : undefined,
      toDate: toDate ? new Date(toDate) : undefined,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20,
    });
  }

  @Get('by-email/:email')
  findByEmail(@Param('email') email: string) {
    return this.bookingsService.findByEmail(email);
  }

  @Get('by-email/:email/upcoming')
  getUpcomingByEmail(@Param('email') email: string) {
    return this.bookingsService.getUpcomingByEmail(email);
  }

  @Get('by-email/:email/past')
  getPastByEmail(@Param('email') email: string) {
    return this.bookingsService.getPastByEmail(email);
  }

  @Get('by-reference/:reference')
  findByReference(@Param('reference') reference: string) {
    return this.bookingsService.findByReference(reference);
  }

  @Get('by-pnr/:pnr')
  findByPnr(@Param('pnr') pnr: string) {
    return this.bookingsService.findByPnr(pnr);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.bookingsService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateBookingDto: UpdateBookingDto) {
    return this.bookingsService.update(+id, updateBookingDto);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body() body: { status: BookingStatus; reason?: string },
  ) {
    return this.bookingsService.updateStatus(+id, body.status, body.reason);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.bookingsService.remove(+id);
  }

  // ============================================================
  // REFUND ENDPOINT'LERİ
  // ============================================================

  /**
   * İade teklifi al
   * POST /bookings/:id/refund/quotation
   */
  @Post(':id/refund/quotation')
  @HttpCode(HttpStatus.OK)
  async getRefundQuotation(
    @Param('id') id: string,
    @Body() body: { reason?: string },
  ) {
    const booking = await this.bookingsService.findOne(+id);
    if (!booking) {
      throw new NotFoundException('Rezervasyon bulunamadı');
    }

    // İade edilebilirlik kontrolü
    if (booking.status === BookingStatus.CANCELLED || 
        booking.status === BookingStatus.REFUNDED) {
      throw new BadRequestException('Bu rezervasyon zaten iptal edilmiş veya iade edilmiş');
    }

    // İade hesaplaması
    const quotation = await this.bookingsService.calculateRefundQuotation(+id, body.reason);
    
    return {
      success: true,
      quotation,
    };
  }

  /**
   * İadeyi onayla
   * POST /bookings/:id/refund/confirm
   */
  @Post(':id/refund/confirm')
  @HttpCode(HttpStatus.OK)
  async confirmRefund(
    @Param('id') id: string,
    @Body() body: { quotationId: string; reason: string; refundedBy?: string },
  ) {
    const booking = await this.bookingsService.findOne(+id);
    if (!booking) {
      throw new NotFoundException('Rezervasyon bulunamadı');
    }

    // İadeyi işle
    const result = await this.bookingsService.processRefundWithQuotation(
      +id,
      body.quotationId,
      body.reason,
      body.refundedBy || 'customer',
    );

    return {
      success: true,
      message: 'İade işlemi başarıyla tamamlandı',
      booking: result.booking,
      refundAmount: result.refundAmount,
      refundTransactionId: result.transactionId,
    };
  }

  /**
   * Hızlı iptal (iade olmadan)
   * POST /bookings/:id/cancel
   */
  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  async cancelBooking(
    @Param('id') id: string,
    @Body() body: { reason?: string },
  ) {
    const booking = await this.bookingsService.findOne(+id);
    if (!booking) {
      throw new NotFoundException('Rezervasyon bulunamadı');
    }

    if (booking.status === BookingStatus.CANCELLED) {
      throw new BadRequestException('Bu rezervasyon zaten iptal edilmiş');
    }

    const result = await this.bookingsService.updateStatus(
      +id, 
      BookingStatus.CANCELLED, 
      body.reason || 'Müşteri tarafından iptal edildi'
    );

    return {
      success: true,
      message: 'Rezervasyon iptal edildi',
      booking: result,
    };
  }

  // ============================================================
  // EXCHANGE (DEĞİŞİKLİK) ENDPOINT'LERİ
  // ============================================================

  /**
   * Değişiklik için uygun seferleri ara
   * POST /bookings/:id/exchange/search
   */
  @Post(':id/exchange/search')
  @HttpCode(HttpStatus.OK)
  async searchExchangeOptions(
    @Param('id') id: string,
    @Body() body: { newDepartureDate: string; newDepartureTime?: string },
  ) {
    const booking = await this.bookingsService.findOne(+id);
    if (!booking) {
      throw new NotFoundException('Rezervasyon bulunamadı');
    }

    // Değiştirilebilirlik kontrolü
    if (booking.status !== BookingStatus.CONFIRMED && 
        booking.status !== BookingStatus.TICKETED) {
      throw new BadRequestException('Bu rezervasyon değiştirilemez');
    }

    // Yeni tarih için sefer ara
    const options = await this.bookingsService.searchExchangeOptions(
      +id,
      body.newDepartureDate,
      body.newDepartureTime,
    );

    return {
      success: true,
      originalBooking: {
        id: booking.id,
        departureDate: booking.departureDate,
        departureTime: booking.departureTime,
        fromStation: booking.fromStation,
        toStation: booking.toStation,
        totalPrice: booking.totalPrice,
      },
      options,
    };
  }

  /**
   * Değişiklik teklifi al
   * POST /bookings/:id/exchange/quotation
   */
  @Post(':id/exchange/quotation')
  @HttpCode(HttpStatus.OK)
  async getExchangeQuotation(
    @Param('id') id: string,
    @Body() body: { newOfferId: string },
  ) {
    const booking = await this.bookingsService.findOne(+id);
    if (!booking) {
      throw new NotFoundException('Rezervasyon bulunamadı');
    }

    const quotation = await this.bookingsService.calculateExchangeQuotation(
      +id,
      body.newOfferId,
    );

    return {
      success: true,
      quotation,
    };
  }

  /**
   * Değişikliği onayla
   * POST /bookings/:id/exchange/confirm
   */
  @Post(':id/exchange/confirm')
  @HttpCode(HttpStatus.OK)
  async confirmExchange(
    @Param('id') id: string,
    @Body() body: { quotationId: string; newOfferId: string },
  ) {
    const booking = await this.bookingsService.findOne(+id);
    if (!booking) {
      throw new NotFoundException('Rezervasyon bulunamadı');
    }

    const result = await this.bookingsService.processExchange(
      +id,
      body.quotationId,
      body.newOfferId,
    );

    return {
      success: true,
      message: 'Bilet değişikliği başarıyla tamamlandı',
      oldBooking: result.oldBooking,
      newBooking: result.newBooking,
      priceDifference: result.priceDifference,
      exchangeFee: result.exchangeFee,
    };
  }

  // ============================================================
  // KOŞULLAR VE BİLGİ ENDPOINT'LERİ
  // ============================================================

  /**
   * Rezervasyonun iade/değişiklik koşullarını getir
   * GET /bookings/:id/conditions
   */
  @Get(':id/conditions')
  async getConditions(@Param('id') id: string) {
    const booking = await this.bookingsService.findOne(+id);
    if (!booking) {
      throw new NotFoundException('Rezervasyon bulunamadı');
    }

    const conditions = await this.bookingsService.getBookingConditions(+id);

    return {
      success: true,
      conditions,
    };
  }
}
