import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Res,
  HttpCode,
  HttpStatus,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import type { Response } from 'express';
import { MyTripsService } from './my-trips.service';
import * as PDFDocument from 'pdfkit';
import * as QRCode from 'qrcode';

// DTO'lar
class RequestMagicLinkDto {
  email: string;
}

@Controller('my-trips')
export class MyTripsController {
  private readonly logger = new Logger(MyTripsController.name);

  constructor(private readonly myTripsService: MyTripsService) {}

  /**
   * POST /my-trips/request-link
   * Email ile magic link talep et
   */
  @Post('request-link')
  @HttpCode(HttpStatus.OK)
  async requestMagicLink(@Body() dto: RequestMagicLinkDto) {
    const { token, expiresAt } = await this.myTripsService.createMagicLink(dto.email);
    
    const magicLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/my-trips?token=${token}`;
    
    return {
      success: true,
      message: 'Bilet bilgileriniz e-posta adresinize gönderildi',
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
    if (!token) {
      throw new BadRequestException('Token gerekli');
    }

    const bookings = await this.myTripsService.getBookingsByToken(token);
    const categorized = this.myTripsService.categorizeBookings(bookings);
    
    return {
      success: true,
      data: {
        upcoming: categorized.upcoming.map(b => this.formatBooking(b)),
        past: categorized.past.map(b => this.formatBooking(b)),
        total: bookings.length,
      },
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

  /**
   * GET /my-trips/:id/pdf?token=xxx
   * PDF Bilet İndir
   */
  @Get(':id/pdf')
  async downloadPdf(
    @Param('id') id: string,
    @Query('token') token: string,
    @Res() res: Response,
  ) {
    if (!token) {
      throw new BadRequestException('Token gerekli');
    }

    const booking = await this.myTripsService.getBookingById(parseInt(id), token);
    
    if (!booking) {
      throw new NotFoundException('Bilet bulunamadı');
    }

    this.logger.log(`PDF download requested for booking ${id}`);

    // PDF oluştur
    const doc = new PDFDocument({ 
      size: 'A4',
      margin: 50,
    });

    // Response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=eurotrain-ticket-${booking.pnr || booking.bookingReference}.pdf`);

    doc.pipe(res);

    // ============================================================
    // PDF HEADER
    // ============================================================
    
    // Logo placeholder (mavi kutu)
    doc.rect(50, 40, 60, 30).fill('#1a365d');
    doc.fillColor('#ffffff').fontSize(14).text('EURO', 55, 48, { width: 50 });
    doc.fillColor('#f59e0b').text('TRAIN', 55, 58, { width: 50 });
    
    // Başlık
    doc.fillColor('#1a365d').fontSize(24).text('E-Bilet', 130, 45);
    doc.fillColor('#666666').fontSize(10).text('Electronic Ticket', 130, 70);

    // Rezervasyon No (sağ üst)
    doc.fillColor('#1a365d').fontSize(10).text('Rezervasyon No:', 400, 45);
    doc.fillColor('#000000').fontSize(14).font('Helvetica-Bold').text(booking.pnr || booking.bookingReference, 400, 58);
    doc.font('Helvetica');

    // Ayırıcı çizgi
    doc.moveTo(50, 100).lineTo(545, 100).stroke('#e5e7eb');

    // ============================================================
    // JOURNEY INFO - camelCase
    // ============================================================
    
    const yStart = 120;
    
    // Kalkış
    doc.fillColor('#6b7280').fontSize(10).text('KALKIŞ', 50, yStart);
    doc.fillColor('#000000').fontSize(28).font('Helvetica-Bold').text(
      this.formatTime(booking.departureTime), 
      50, 
      yStart + 15
    );
    doc.font('Helvetica').fontSize(12).text(booking.fromStation, 50, yStart + 50);
    
    // Ok
    doc.fillColor('#3b82f6').fontSize(20).text('→', 260, yStart + 20);
    
    // Varış
    doc.fillColor('#6b7280').fontSize(10).text('VARIŞ', 350, yStart);
    doc.fillColor('#000000').fontSize(28).font('Helvetica-Bold').text(
      this.formatTime(booking.arrivalTime), 
      350, 
      yStart + 15
    );
    doc.font('Helvetica').fontSize(12).text(booking.toStation, 350, yStart + 50);

    // Tarih
    doc.fillColor('#1a365d').fontSize(14).font('Helvetica-Bold').text(
      this.formatDate(booking.departureDate),
      50,
      yStart + 80
    );
    doc.font('Helvetica');

    // ============================================================
    // TRAIN INFO BOX
    // ============================================================

    const boxY = yStart + 110;
    doc.rect(50, boxY, 495, 60).fill('#f8fafc');
    
    // Tren bilgileri
    doc.fillColor('#6b7280').fontSize(9).text('OPERATÖR', 70, boxY + 10);
    doc.fillColor('#000000').fontSize(12).font('Helvetica-Bold').text(booking.operator || '-', 70, boxY + 25);
    doc.font('Helvetica');
    
    doc.fillColor('#6b7280').fontSize(9).text('TREN NO', 200, boxY + 10);
    doc.fillColor('#000000').fontSize(12).font('Helvetica-Bold').text(booking.trainNumber || '-', 200, boxY + 25);
    doc.font('Helvetica');
    
    doc.fillColor('#6b7280').fontSize(9).text('SINIF', 330, boxY + 10);
    doc.fillColor('#000000').fontSize(12).font('Helvetica-Bold').text(
      booking.ticketClass === 'standard' ? 'Standart' :
      booking.ticketClass === 'comfort' ? 'Business' :
      booking.ticketClass === 'premier' ? 'Birinci Sınıf' : booking.ticketClass || '-',
      330, boxY + 25
    );
    doc.font('Helvetica');
    
    doc.fillColor('#6b7280').fontSize(9).text('VAGON / KOLTUK', 430, boxY + 10);
    doc.fillColor('#000000').fontSize(12).font('Helvetica-Bold').text(
      (booking.coach && booking.seat) ? `${booking.coach} / ${booking.seat}` : 'Serbest',
      430, boxY + 25
    );
    doc.font('Helvetica');

    // ============================================================
    // PASSENGER INFO
    // ============================================================

    const passengerY = boxY + 80;
    doc.fillColor('#1a365d').fontSize(12).font('Helvetica-Bold').text('Yolcu Bilgileri', 50, passengerY);
    doc.font('Helvetica');
    
    doc.fillColor('#6b7280').fontSize(10).text('Ad Soyad:', 50, passengerY + 20);
    doc.fillColor('#000000').text(booking.customerName, 120, passengerY + 20);
    
    doc.fillColor('#6b7280').text('E-posta:', 300, passengerY + 20);
    doc.fillColor('#000000').text(this.maskEmail(booking.customerEmail), 360, passengerY + 20);

    if (booking.travelersData && booking.travelersData.length > 1) {
      doc.fillColor('#6b7280').fontSize(9).text('Diğer Yolcular:', 50, passengerY + 40);
      const otherTravelers = booking.travelersData
        .slice(1)
        .map((t: any) => `${t.first_name} ${t.last_name}`)
        .join(', ');
      doc.fillColor('#000000').text(otherTravelers, 130, passengerY + 40);
    }

    // ============================================================
    // QR CODE
    // ============================================================

    const qrY = passengerY + 70;
    
    // QR Code oluştur
    const qrData = JSON.stringify({
      ref: booking.bookingReference,
      pnr: booking.pnr,
      from: booking.fromStationCode || booking.fromStation,
      to: booking.toStationCode || booking.toStation,
      date: booking.departureDate,
      time: booking.departureTime,
      pax: booking.customerName,
    });

    try {
      const qrBuffer = await QRCode.toBuffer(qrData, {
        width: 120,
        margin: 1,
        errorCorrectionLevel: 'M',
      });
      
      doc.image(qrBuffer, 50, qrY, { width: 100, height: 100 });
    } catch (error) {
      // QR oluşturulamazsa placeholder
      doc.rect(50, qrY, 100, 100).stroke('#cccccc');
      doc.fillColor('#999999').fontSize(8).text('QR Kod', 75, qrY + 45);
    }

    // QR yanında bilgi
    doc.fillColor('#6b7280').fontSize(9).text(
      'Bu QR kodu trenin kapısındaki okuyucuya gösterin.',
      170, qrY + 20
    );
    doc.text('Biletinizi her zaman yanınızda bulundurun.', 170, qrY + 35);

    // ============================================================
    // PRICE BOX
    // ============================================================

    const priceY = qrY + 120;
    doc.rect(350, priceY, 195, 80).fill('#f0fdf4');
    
    doc.fillColor('#6b7280').fontSize(9).text('Bilet Ücreti:', 365, priceY + 10);
    doc.fillColor('#000000').fontSize(11).text(`€${Number(booking.ticketPrice || 0).toFixed(2)}`, 480, priceY + 10);
    
    doc.fillColor('#6b7280').fontSize(9).text('Hizmet Bedeli:', 365, priceY + 28);
    doc.fillColor('#000000').fontSize(11).text(`€${Number(booking.serviceFee || 0).toFixed(2)}`, 480, priceY + 28);

    if (booking.promoDiscount && Number(booking.promoDiscount) > 0) {
      doc.fillColor('#059669').fontSize(9).text(`İndirim (${booking.promoCode}):`, 365, priceY + 46);
      doc.text(`-€${Number(booking.promoDiscount).toFixed(2)}`, 480, priceY + 46);
    }

    doc.moveTo(365, priceY + 58).lineTo(530, priceY + 58).stroke('#d1d5db');
    
    doc.fillColor('#1a365d').fontSize(12).font('Helvetica-Bold').text('TOPLAM:', 365, priceY + 63);
    doc.text(`€${Number(booking.totalPrice || 0).toFixed(2)}`, 480, priceY + 63);
    doc.font('Helvetica');

    // ============================================================
    // FOOTER
    // ============================================================

    const footerY = 720;
    doc.moveTo(50, footerY).lineTo(545, footerY).stroke('#e5e7eb');
    
    doc.fillColor('#9ca3af').fontSize(8).text(
      'Bu e-bilet EuroTrain tarafından düzenlenmiştir. Bilet koşulları için eurotrain.net adresini ziyaret edin.',
      50, footerY + 10
    );
    doc.text(
      `Oluşturulma: ${new Date().toLocaleString('tr-TR')} | Ref: ${booking.bookingReference}`,
      50, footerY + 22
    );

    // Bitti
    doc.end();
  }

  /**
   * GET /my-trips/:id/qr?token=xxx
   * QR Kod PNG olarak indir
   */
  @Get(':id/qr')
  async getQrCode(
    @Param('id') id: string,
    @Query('token') token: string,
    @Res() res: Response,
  ) {
    if (!token) {
      throw new BadRequestException('Token gerekli');
    }

    const booking = await this.myTripsService.getBookingById(parseInt(id), token);
    
    if (!booking) {
      throw new NotFoundException('Bilet bulunamadı');
    }

    // QR Data
    const qrData = JSON.stringify({
      ref: booking.bookingReference,
      pnr: booking.pnr,
      from: booking.fromStationCode || booking.fromStation,
      to: booking.toStationCode || booking.toStation,
      date: booking.departureDate,
      time: booking.departureTime,
      pax: booking.customerName,
    });

    try {
      const qrBuffer = await QRCode.toBuffer(qrData, {
        width: 300,
        margin: 2,
        errorCorrectionLevel: 'M',
        color: {
          dark: '#1a365d',
          light: '#ffffff',
        },
      });

      res.setHeader('Content-Type', 'image/png');
      res.setHeader('Content-Disposition', `inline; filename=qr-${booking.bookingReference}.png`);
      res.send(qrBuffer);
    } catch (error) {
      this.logger.error(`QR generation failed: ${(error as Error).message}`);
      throw new BadRequestException('QR kod oluşturulamadı');
    }
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

  // ============================================================
  // HELPER METHODS
  // ============================================================

  // Bilet formatla (liste için) - camelCase
  private formatBooking(booking: any) {
    return {
      id: booking.id,
      orderId: booking.pnr || booking.bookingReference,
      pnr: booking.pnr,
      bookingReference: booking.bookingReference,
      
      // Journey
      fromStation: booking.fromStation,
      toStation: booking.toStation,
      fromStationCode: booking.fromStationCode,
      toStationCode: booking.toStationCode,
      departureDate: booking.departureDate,
      departureTime: booking.departureTime,
      arrivalTime: booking.arrivalTime,
      
      // Train
      trainNumber: booking.trainNumber,
      operator: booking.operator,
      operatorCode: booking.operatorCode,
      ticketClass: booking.ticketClass,
      
      // Passenger
      passengerName: booking.customerName,
      passengerEmail: booking.customerEmail,
      adults: booking.adults,
      children: booking.children,
      
      // Seat
      coach: booking.coach,
      seat: booking.seat,
      
      // Price
      price: booking.totalPrice,
      currency: booking.currency || 'EUR',
      
      // Status
      status: booking.status,
      
      // Timestamps
      createdAt: booking.createdAt,
    };
  }

  // Bilet formatla (detay için)
  private formatBookingDetailed(booking: any) {
    return {
      ...this.formatBooking(booking),
      
      // Additional details
      ticketPrice: booking.ticketPrice,
      serviceFee: booking.serviceFee,
      promoCode: booking.promoCode,
      promoDiscount: booking.promoDiscount,
      
      // Travelers
      travelersData: booking.travelersData,
      
      // Ticket URLs
      ticketPdfUrl: booking.ticketPdfUrl,
      ticketPkpassUrl: booking.ticketPkpassUrl,
      
      // Timestamps
      confirmedAt: booking.confirmedAt,
      cancelledAt: booking.cancelledAt,
    };
  }

  // Saat formatla
  private formatTime(time: string): string {
    if (!time) return '--:--';
    return time.substring(0, 5);
  }

  // Tarih formatla
  private formatDate(dateStr: string): string {
    if (!dateStr) return '-';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('tr-TR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  }

  // Email maskele (GDPR/PII)
  private maskEmail(email: string): string {
    if (!email) return '';
    const [name, domain] = email.split('@');
    if (name.length <= 2) return `${name[0]}***@${domain}`;
    return `${name[0]}***${name[name.length - 1]}@${domain}`;
  }
}
