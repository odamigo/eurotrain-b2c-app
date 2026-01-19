import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { MyTripsService } from './my-trips.service';

// DTO'lar
class RequestMagicLinkDto {
  email: string;
}

class VerifyTokenDto {
  token: string;
}

@Controller('my-trips')
export class MyTripsController {
  constructor(private readonly myTripsService: MyTripsService) {}

  /**
   * POST /my-trips/request-link
   * Email ile magic link talep et
   */
  @Post('request-link')
  @HttpCode(HttpStatus.OK)
  async requestMagicLink(@Body() dto: RequestMagicLinkDto) {
    const { token, expiresAt } = await this.myTripsService.createMagicLink(dto.email);
    
    // Gerçek uygulamada burada email gönderilir
    // Şimdilik token'ı döndürüyoruz (test için)
    const magicLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/my-trips?token=${token}`;
    
    return {
      success: true,
      message: 'Bilet bilgileriniz e-posta adresinize gönderildi',
      // Development modda link'i de döndür
      ...(process.env.NODE_ENV !== 'production' && { 
        magicLink,
        token,
        expiresAt 
      }),
    };
  }

  /**
   * GET /my-trips/verify?token=xxx
   * Token ile biletleri getir
   */
  @Get('verify')
  async verifyToken(@Query('token') token: string) {
    const bookings = await this.myTripsService.getBookingsByToken(token);
    const categorized = this.myTripsService.categorizeBookings(bookings);
    
    return {
      success: true,
      data: {
        upcoming: categorized.upcoming.map(this.formatBooking),
        past: categorized.past.map(this.formatBooking),
        total: bookings.length,
      },
    };
  }

  /**
   * GET /my-trips/:id?token=xxx
   * Tek bilet detayı
   */
  @Get(':id')
  async getBooking(
    @Param('id') id: string,
    @Query('token') token?: string,
  ) {
    const booking = await this.myTripsService.getBookingById(parseInt(id), token);
    
    return {
      success: true,
      data: this.formatBookingDetailed(booking),
    };
  }

  /**
   * GET /my-trips/order/:orderId
   * PNR/Order ID ile bilet getir
   */
  @Get('order/:orderId')
  async getByOrderId(@Param('orderId') orderId: string) {
    const booking = await this.myTripsService.getBookingByOrderId(orderId);
    
    return {
      success: true,
      data: this.formatBookingDetailed(booking),
    };
  }

  // Bilet formatla (liste için)
  private formatBooking(booking: any) {
    return {
      id: booking.id,
      orderId: booking.pnr || `ET-${booking.id}`,
      fromStation: booking.fromStation,
      toStation: booking.toStation,
      departureDate: booking.departure_date,
      departureTime: booking.departure_time,
      arrivalTime: booking.arrival_time,
      trainNumber: booking.train_number,
      operator: booking.operator,
      status: booking.status,
      price: booking.price,
    };
  }

  // Bilet formatla (detay için)
  private formatBookingDetailed(booking: any) {
    return {
      id: booking.id,
      orderId: booking.pnr || `ET-${booking.id}`,
      pnr: booking.pnr,
      
      // Yolculuk bilgileri
      fromStation: booking.fromStation,
      toStation: booking.toStation,
      departureDate: booking.departure_date,
      departureTime: booking.departure_time,
      arrivalTime: booking.arrival_time,
      
      // Tren bilgileri
      trainNumber: booking.train_number,
      trainType: booking.operator, // Thalys, Eurostar, vb.
      operator: booking.operator,
      coach: booking.coach,
      seat: booking.seat,
      ticketClass: booking.ticket_class,
      
      // Yolcu bilgileri
      passengerName: booking.customerName,
      passengerEmail: booking.customerEmail,
      
      // Fiyat ve durum
      price: booking.price,
      currency: 'EUR',
      status: booking.status,
      
      // PDF
      ticketPdfUrl: booking.ticket_pdf_url,
      
      // Tarihler
      createdAt: booking.createdAt,
    };
  }
}