import { Injectable } from '@nestjs/common';
import { Resend } from 'resend';

@Injectable()
export class EmailService {
  private resend: Resend;

  constructor() {
    this.resend = new Resend(process.env.RESEND_API_KEY);
  }

  async sendMagicLink(email: string, token: string): Promise<boolean> {
    try {
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      const magicLink = frontendUrl + '/my-trips?token=' + token;
      
      await this.resend.emails.send({
        from: 'onboarding@resend.dev',
        to: email,
        subject: 'Biletlerinize Erisim Linki',
        html: this.getMagicLinkTemplate(magicLink),
      });
      return true;
    } catch (error) {
      console.error('Email gonderme hatasi:', error);
      return false;
    }
  }

  async sendBookingConfirmation(
    email: string,
    bookingDetails: {
      pnr: string;
      customerName: string;
      fromStation: string;
      toStation: string;
      departureDate: string;
      price: number;
    },
  ): Promise<boolean> {
    try {
      await this.resend.emails.send({
        from: 'onboarding@resend.dev',
        to: email,
        subject: 'Bilet Onayi - ' + bookingDetails.pnr,
        html: this.getBookingTemplate(bookingDetails),
      });
      return true;
    } catch (error) {
      console.error('Email gonderme hatasi:', error);
      return false;
    }
  }

  private getMagicLinkTemplate(magicLink: string): string {
    return '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">' +
      '<h2 style="color: #1a365d;">EuroTrain</h2>' +
      '<p>Merhaba,</p>' +
      '<p>Biletlerinize erismek icin asagidaki butona tiklayin:</p>' +
      '<a href="' + magicLink + '" style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 16px 0;">Biletlerimi Goruntule</a>' +
      '<p style="color: #666; font-size: 14px;">Bu link 24 saat gecerlidir.</p>' +
      '</div>';
  }

  private getBookingTemplate(details: { pnr: string; customerName: string; fromStation: string; toStation: string; departureDate: string; price: number }): string {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    return '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">' +
      '<h2 style="color: #1a365d;">EuroTrain - Bilet Onayi</h2>' +
      '<p>Sayin ' + details.customerName + ',</p>' +
      '<p>Biletiniz basariyla olusturuldu!</p>' +
      '<div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">' +
      '<h3 style="margin-top: 0;">Seyahat Detaylari</h3>' +
      '<p><strong>PNR:</strong> ' + details.pnr + '</p>' +
      '<p><strong>Guzergah:</strong> ' + details.fromStation + ' - ' + details.toStation + '</p>' +
      '<p><strong>Tarih:</strong> ' + details.departureDate + '</p>' +
      '<p><strong>Tutar:</strong> ' + details.price + ' EUR</p>' +
      '</div>' +
      '<a href="' + frontendUrl + '/my-trips" style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Biletimi Goruntule</a>' +
      '</div>';
  }
}
