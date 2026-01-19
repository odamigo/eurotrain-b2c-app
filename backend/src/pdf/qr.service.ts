import { Injectable } from '@nestjs/common';
import * as QRCode from 'qrcode';
import sharp from 'sharp';
import * as path from 'path';
import * as fs from 'fs';

@Injectable()
export class QrService {
  private logoPath: string;
  private eurotrainBlue = '#2563eb';

  constructor() {
    this.logoPath = path.join(__dirname, '..', 'assets', 'logo.png');
  }

  async generateQrCode(data: string, size: number = 300): Promise<Buffer> {
    try {
      // QR kod olustur (mavi tonlarinda)
      const qrBuffer = await QRCode.toBuffer(data, {
        errorCorrectionLevel: 'H',
        type: 'png',
        width: size,
        margin: 2,
        color: {
          dark: this.eurotrainBlue,
          light: '#ffffff',
        },
      });

      // Logo varsa ekle
      if (fs.existsSync(this.logoPath)) {
        return await this.addLogoToQr(qrBuffer, size);
      }

      return qrBuffer;
    } catch (error) {
      console.error('QR kod olusturma hatasi:', error);
      throw error;
    }
  }

  private async addLogoToQr(qrBuffer: Buffer, size: number): Promise<Buffer> {
    try {
      const logoSize = Math.floor(size * 0.25);
      const logoPosition = Math.floor((size - logoSize) / 2);

      // Logo'yu yeniden boyutlandir
      const resizedLogo = await sharp(this.logoPath)
        .resize(logoSize, logoSize, {
          fit: 'contain',
          background: { r: 255, g: 255, b: 255, alpha: 1 },
        })
        .png()
        .toBuffer();

      // Beyaz arka plan ile logo cercevesi olustur
      const padding = 8;
      const bgSize = logoSize + padding * 2;
      const bgPosition = logoPosition - padding;

      const whiteBackground = await sharp({
        create: {
          width: bgSize,
          height: bgSize,
          channels: 4,
          background: { r: 255, g: 255, b: 255, alpha: 1 },
        },
      })
        .png()
        .toBuffer();

      // QR + beyaz arka plan + logo birlestir
      const qrWithBg = await sharp(qrBuffer)
        .composite([
          {
            input: whiteBackground,
            left: bgPosition,
            top: bgPosition,
          },
        ])
        .png()
        .toBuffer();

      const finalQr = await sharp(qrWithBg)
        .composite([
          {
            input: resizedLogo,
            left: logoPosition,
            top: logoPosition,
          },
        ])
        .png()
        .toBuffer();

      return finalQr;
    } catch (error) {
      console.error('Logo ekleme hatasi:', error);
      return qrBuffer;
    }
  }

  generateTicketUrl(bookingId: number, pnr: string): string {
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    return baseUrl + '/ticket/verify?id=' + bookingId + '&pnr=' + pnr;
  }

  async generateTicketQr(bookingId: number, pnr: string): Promise<Buffer> {
    const url = this.generateTicketUrl(bookingId, pnr);
    return this.generateQrCode(url, 200);
  }
}
