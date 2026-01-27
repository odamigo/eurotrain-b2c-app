import {
  Controller,
  Get,
  Param,
  Query,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { ShareService } from './share.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { Booking } from '../bookings/entities/booking.entity';

@Controller('share')
export class ShareController {
  private readonly logger = new Logger(ShareController.name);

  constructor(
    private readonly shareService: ShareService,
    @InjectRepository(Booking)
    private readonly bookingRepository: Repository<Booking>,
  ) {}

  /**
   * GET /share/:bookingId?token=xxx
   * Tüm paylaşım seçeneklerini döndür
   * 
   * @param bookingId - Booking ID
   * @param token - Magic link token
   * @returns Paylaşım URL'leri ve metinler
   */
  @Get(':bookingId')
  async getShareData(
    @Param('bookingId') bookingId: string,
    @Query('token') token: string,
  ): Promise<{
    success: boolean;
    data: {
      whatsapp: string;
      sms: string;
      email: string;
      text: string;
      shortText: string;
      webShare: {
        title: string;
        text: string;
        url: string;
      };
    };
    booking: {
      id: number;
      reference: string;
      route: string;
      date: string;
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

    this.logger.log(`Share data requested for booking: ${booking.bookingReference}`);

    // Paylaşım URL'lerini oluştur
    const shareData = this.shareService.getAllShareUrls(booking);

    return {
      success: true,
      data: shareData,
      booking: {
        id: booking.id,
        reference: booking.pnr || booking.bookingReference,
        route: `${booking.fromStation} → ${booking.toStation}`,
        date: booking.departureDate,
      },
    };
  }

  /**
   * GET /share/:bookingId/whatsapp?token=xxx
   * WhatsApp paylaşım URL'i
   */
  @Get(':bookingId/whatsapp')
  async getWhatsAppUrl(
    @Param('bookingId') bookingId: string,
    @Query('token') token: string,
    @Query('phone') phone?: string,
  ): Promise<{
    success: boolean;
    url: string;
    text: string;
  }> {
    const booking = await this.validateAndGetBooking(bookingId, token);

    const url = phone
      ? this.shareService.generateWhatsAppUrlWithNumber(booking, phone)
      : this.shareService.generateWhatsAppUrl(booking);

    return {
      success: true,
      url,
      text: this.shareService.generateShareText(booking),
    };
  }

  /**
   * GET /share/:bookingId/sms?token=xxx
   * SMS paylaşım URL'i
   */
  @Get(':bookingId/sms')
  async getSmsUrl(
    @Param('bookingId') bookingId: string,
    @Query('token') token: string,
  ): Promise<{
    success: boolean;
    url: string;
    text: string;
  }> {
    const booking = await this.validateAndGetBooking(bookingId, token);

    return {
      success: true,
      url: this.shareService.generateSmsUrl(booking),
      text: this.shareService.generateShareTextShort(booking),
    };
  }

  /**
   * GET /share/:bookingId/email?token=xxx&to=xxx
   * Email paylaşım URL'i
   */
  @Get(':bookingId/email')
  async getEmailUrl(
    @Param('bookingId') bookingId: string,
    @Query('token') token: string,
    @Query('to') recipientEmail?: string,
  ): Promise<{
    success: boolean;
    url: string;
    subject: string;
    body: string;
  }> {
    const booking = await this.validateAndGetBooking(bookingId, token);

    return {
      success: true,
      url: this.shareService.generateEmailUrl(booking, recipientEmail),
      subject: `Tren Bileti: ${booking.fromStation} → ${booking.toStation}`,
      body: this.shareService.generateShareText(booking),
    };
  }

  /**
   * GET /share/:bookingId/text?token=xxx
   * Düz metin (clipboard için)
   */
  @Get(':bookingId/text')
  async getText(
    @Param('bookingId') bookingId: string,
    @Query('token') token: string,
    @Query('format') format: 'full' | 'short' = 'full',
  ): Promise<{
    success: boolean;
    text: string;
  }> {
    const booking = await this.validateAndGetBooking(bookingId, token);

    return {
      success: true,
      text: format === 'short'
        ? this.shareService.generateShareTextShort(booking)
        : this.shareService.generateShareText(booking),
    };
  }

  /**
   * Booking'i valide et ve döndür
   */
  private async validateAndGetBooking(bookingId: string, token: string): Promise<Booking> {
    if (!token) {
      throw new BadRequestException('Token gerekli');
    }

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

    return booking;
  }
}
