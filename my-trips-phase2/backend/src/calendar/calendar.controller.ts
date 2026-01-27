import {
  Controller,
  Get,
  Param,
  Query,
  Res,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import type { Response } from 'express';
import { CalendarService } from './calendar.service';
import { BookingsService } from '../bookings/bookings.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { Booking } from '../bookings/entities/booking.entity';

@Controller('calendar')
export class CalendarController {
  private readonly logger = new Logger(CalendarController.name);

  constructor(
    private readonly calendarService: CalendarService,
    private readonly bookingsService: BookingsService,
    @InjectRepository(Booking)
    private readonly bookingRepository: Repository<Booking>,
  ) {}

  /**
   * GET /calendar/:bookingId/ics?token=xxx
   * Tek bilet için iCal dosyası indir
   * 
   * @param bookingId - Booking ID
   * @param token - Magic link token (güvenlik için)
   * @returns .ics dosyası
   */
  @Get(':bookingId/ics')
  async downloadIcs(
    @Param('bookingId') bookingId: string,
    @Query('token') token: string,
    @Res() res: Response,
  ): Promise<void> {
    // Token validasyonu
    if (!token) {
      throw new BadRequestException('Token gerekli');
    }

    // Booking'i bul ve token'ı doğrula
    const booking = await this.bookingRepository.findOne({
      where: {
        id: parseInt(bookingId),
        magicToken: token,
        tokenExpiresAt: MoreThan(new Date()),
      },
    });

    if (!booking) {
      throw new NotFoundException('Bilet bulunamadı veya link süresi dolmuş');
    }

    this.logger.log(`iCal download for booking: ${booking.bookingReference}`);

    // iCal içeriği oluştur
    const icsContent = this.calendarService.generateIcs(booking);
    const fileName = this.calendarService.getFileName(booking);

    // Response headers
    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');

    // Dosyayı gönder
    res.send(icsContent);
  }

  /**
   * GET /calendar/all?token=xxx
   * Tüm biletler için tek iCal dosyası
   * 
   * @param token - Magic link token
   * @returns .ics dosyası (tüm biletler)
   */
  @Get('all')
  async downloadAllIcs(
    @Query('token') token: string,
    @Res() res: Response,
  ): Promise<void> {
    // Token validasyonu
    if (!token) {
      throw new BadRequestException('Token gerekli');
    }

    // Token ile tüm booking'leri bul
    const bookings = await this.bookingRepository.find({
      where: {
        magicToken: token,
        tokenExpiresAt: MoreThan(new Date()),
      },
      order: { departureDate: 'ASC' },
    });

    if (bookings.length === 0) {
      throw new NotFoundException('Bilet bulunamadı veya link süresi dolmuş');
    }

    this.logger.log(`iCal download for ${bookings.length} bookings`);

    // Sadece gelecekteki biletleri filtrele (opsiyonel)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const upcomingBookings = bookings.filter((b) => {
      if (!b.departureDate) return false;
      const depDate = new Date(b.departureDate);
      return depDate >= today;
    });

    // Eğer yaklaşan bilet yoksa tümünü gönder
    const bookingsToExport = upcomingBookings.length > 0 ? upcomingBookings : bookings;

    // iCal içeriği oluştur
    const icsContent = this.calendarService.generateMultipleIcs(bookingsToExport);
    const fileName = this.calendarService.getMultipleFileName();

    // Response headers
    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');

    // Dosyayı gönder
    res.send(icsContent);
  }

  /**
   * GET /calendar/:bookingId/preview?token=xxx
   * iCal içeriğini JSON olarak önizle (debug için)
   */
  @Get(':bookingId/preview')
  async previewIcs(
    @Param('bookingId') bookingId: string,
    @Query('token') token: string,
  ): Promise<{
    success: boolean;
    fileName: string;
    contentType: string;
    preview: {
      summary: string;
      location: string;
      start: string;
      end: string;
      description: string;
    };
  }> {
    // Token validasyonu
    if (!token) {
      throw new BadRequestException('Token gerekli');
    }

    // Booking'i bul ve token'ı doğrula
    const booking = await this.bookingRepository.findOne({
      where: {
        id: parseInt(bookingId),
        magicToken: token,
        tokenExpiresAt: MoreThan(new Date()),
      },
    });

    if (!booking) {
      throw new NotFoundException('Bilet bulunamadı veya link süresi dolmuş');
    }

    return {
      success: true,
      fileName: this.calendarService.getFileName(booking),
      contentType: 'text/calendar',
      preview: {
        summary: `🚂 ${booking.fromStation} → ${booking.toStation}`,
        location: `${booking.fromStation} → ${booking.toStation}`,
        start: `${booking.departureDate} ${booking.departureTime}`,
        end: `${booking.departureDate} ${booking.arrivalTime}`,
        description: `PNR: ${booking.pnr || booking.bookingReference}, Tren: ${booking.operator} ${booking.trainNumber}`,
      },
    };
  }

  /**
   * GET /calendar/:bookingId/google?token=xxx
   * Google Calendar'a doğrudan ekle (webcal link)
   */
  @Get(':bookingId/google')
  async getGoogleCalendarLink(
    @Param('bookingId') bookingId: string,
    @Query('token') token: string,
  ): Promise<{
    success: boolean;
    googleCalendarUrl: string;
    appleCalendarUrl: string;
    outlookUrl: string;
    downloadUrl: string;
  }> {
    // Token validasyonu
    if (!token) {
      throw new BadRequestException('Token gerekli');
    }

    // Booking'i bul ve token'ı doğrula
    const booking = await this.bookingRepository.findOne({
      where: {
        id: parseInt(bookingId),
        magicToken: token,
        tokenExpiresAt: MoreThan(new Date()),
      },
    });

    if (!booking) {
      throw new NotFoundException('Bilet bulunamadı veya link süresi dolmuş');
    }

    // Tarih formatları
    const startDate = this.formatGoogleDate(booking.departureDate, booking.departureTime);
    const endDate = this.formatGoogleDate(booking.departureDate, booking.arrivalTime);

    // Event detayları
    const title = encodeURIComponent(`🚂 ${booking.fromStation} → ${booking.toStation}`);
    const location = encodeURIComponent(`${booking.fromStation}, ${booking.toStation}`);
    const details = encodeURIComponent(
      `PNR: ${booking.pnr || booking.bookingReference}\n` +
      `Tren: ${booking.operator} ${booking.trainNumber}\n` +
      `Sınıf: ${booking.ticketClass}\n` +
      `Yolcu: ${booking.customerName}\n\n` +
      `Bilet: https://eurotrain.net/my-trips`
    );

    const baseUrl = process.env.API_URL || 'http://localhost:3001';

    return {
      success: true,
      googleCalendarUrl: 
        `https://calendar.google.com/calendar/render?action=TEMPLATE` +
        `&text=${title}` +
        `&dates=${startDate}/${endDate}` +
        `&details=${details}` +
        `&location=${location}`,
      appleCalendarUrl: `${baseUrl}/calendar/${bookingId}/ics?token=${token}`,
      outlookUrl:
        `https://outlook.live.com/calendar/0/deeplink/compose?` +
        `subject=${title}` +
        `&startdt=${booking.departureDate}T${booking.departureTime || '00:00'}` +
        `&enddt=${booking.departureDate}T${booking.arrivalTime || '23:59'}` +
        `&location=${location}` +
        `&body=${details}`,
      downloadUrl: `${baseUrl}/calendar/${bookingId}/ics?token=${token}`,
    };
  }

  /**
   * Google Calendar için tarih formatı
   * Format: YYYYMMDDTHHMMSS
   */
  private formatGoogleDate(dateStr: string, timeStr: string): string {
    if (!dateStr) {
      const now = new Date();
      return now.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    }

    // Tarih parse
    let year: string, month: string, day: string;
    if (dateStr.includes('T')) {
      const date = new Date(dateStr);
      year = date.getFullYear().toString();
      month = (date.getMonth() + 1).toString().padStart(2, '0');
      day = date.getDate().toString().padStart(2, '0');
    } else {
      [year, month, day] = dateStr.split('-');
    }

    // Saat parse
    let hours = '00', minutes = '00';
    if (timeStr) {
      const timeParts = timeStr.split(':');
      hours = timeParts[0]?.padStart(2, '0') || '00';
      minutes = timeParts[1]?.padStart(2, '0') || '00';
    }

    return `${year}${month}${day}T${hours}${minutes}00`;
  }
}
