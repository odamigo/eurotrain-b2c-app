import { Controller, Get, Param, Res, NotFoundException } from '@nestjs/common';
import type { Response } from 'express';
import { PdfService } from './pdf.service';
import { BookingsService } from '../bookings/bookings.service';

@Controller('pdf')
export class PdfController {
  constructor(
    private readonly pdfService: PdfService,
    private readonly bookingsService: BookingsService,
  ) {}

  @Get('ticket/:bookingId')
  async downloadTicket(
    @Param('bookingId') bookingId: string,
    @Res() res: Response,
  ): Promise<void> {
    const booking = await this.bookingsService.findOne(+bookingId);
    
    if (!booking) {
      throw new NotFoundException('Rezervasyon bulunamadi');
    }

    const ticketData = {
      pnr: booking.pnr || `ET${bookingId.padStart(8, '0')}`,
      bookingReference: `S${booking.id}`,
      passengerName: booking.customerName,
      passengerEmail: booking.customerEmail,
      fromStation: booking.fromStation,
      toStation: booking.toStation,
      departureDate: booking.departure_date?.toLocaleDateString('tr-TR') || '-',
      departureTime: booking.departure_time || '-',
      arrivalTime: booking.arrival_time || '-',
      trainNumber: booking.train_number || '-',
      coach: booking.coach || '-',
      seat: booking.seat || '-',
      class: booking.ticket_class || 'Standard',
      operator: booking.operator || 'Rail Europe',
      price: Number(booking.price) || 0,
      currency: 'EUR ',
    };

    await this.pdfService.generateTicketPdf(ticketData, res as any);
  }

  @Get('ticket/pnr/:pnr')
  async downloadTicketByPnr(
    @Param('pnr') pnr: string,
    @Res() res: Response,
  ): Promise<void> {
    const booking = await this.bookingsService.findByPnr(pnr);
    
    if (!booking) {
      throw new NotFoundException('Bilet bulunamadi');
    }

    const ticketData = {
      pnr: booking.pnr,
      bookingReference: `S${booking.id}`,
      passengerName: booking.customerName,
      passengerEmail: booking.customerEmail,
      fromStation: booking.fromStation,
      toStation: booking.toStation,
      departureDate: booking.departure_date?.toLocaleDateString('tr-TR') || '-',
      departureTime: booking.departure_time || '-',
      arrivalTime: booking.arrival_time || '-',
      trainNumber: booking.train_number || '-',
      coach: booking.coach || '-',
      seat: booking.seat || '-',
      class: booking.ticket_class || 'Standard',
      operator: booking.operator || 'Rail Europe',
      price: Number(booking.price) || 0,
      currency: 'EUR ',
    };

    await this.pdfService.generateTicketPdf(ticketData, res as any);
  }
}
