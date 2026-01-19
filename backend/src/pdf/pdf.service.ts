import PDFDocument from 'pdfkit';
import { Injectable } from '@nestjs/common';
import { Response } from 'express';

export interface TicketData {
  pnr: string;
  bookingReference: string;
  passengerName: string;
  passengerEmail: string;
  fromStation: string;
  toStation: string;
  departureDate: string;
  departureTime: string;
  arrivalTime: string;
  trainNumber: string;
  coach: string;
  seat: string;
  class: string;
  operator: string;
  price: number;
  currency: string;
  qrCode?: string;
}

@Injectable()
export class PdfService {
  
  async generateTicketPdf(ticket: TicketData, res: Response): Promise<void> {
    const doc = new PDFDocument({
      size: 'A4',
      margin: 40,
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=ticket-${ticket.pnr}.pdf`);
    
    doc.pipe(res);

    // Header - Logo ve Başlık
    this.drawHeader(doc, ticket);
    
    // QR Kod Alanı
    this.drawQRSection(doc, ticket);
    
    // Yolculuk Bilgileri
    this.drawJourneySection(doc, ticket);
    
    // Yolcu Bilgileri
    this.drawPassengerSection(doc, ticket);
    
    // Bilet Detayları
    this.drawTicketDetails(doc, ticket);
    
    // Footer
    this.drawFooter(doc);

    doc.end();
  }

  private drawHeader(doc: typeof PDFDocument.prototype, ticket: TicketData): void {
    // Arka plan şeridi
    doc.rect(0, 0, doc.page.width, 100).fill('#1e40af');
    
    // Logo metni
    doc.fontSize(28)
       .fillColor('#ffffff')
       .font('Helvetica-Bold')
       .text('EuroTrain', 40, 35);
    
    // Alt başlık
    doc.fontSize(10)
       .fillColor('#93c5fd')
       .font('Helvetica')
       .text('Avrupa Tren Bileti', 40, 68);
    
    // Sağ üst - Operatör
    doc.fontSize(14)
       .fillColor('#ffffff')
       .font('Helvetica-Bold')
       .text(ticket.operator || 'Rail Europe', 400, 40, { align: 'right', width: 150 });
    
    // PNR
    doc.fontSize(10)
       .fillColor('#93c5fd')
       .text(`PNR: ${ticket.pnr}`, 400, 60, { align: 'right', width: 150 });
  }

  private drawQRSection(doc: typeof PDFDocument.prototype, ticket: TicketData): void {
    const qrY = 120;
    
    // QR kod placeholder
    doc.rect(40, qrY, 100, 100)
       .lineWidth(2)
       .stroke('#e2e8f0');
    
    doc.fontSize(8)
       .fillColor('#64748b')
       .text('QR KOD', 70, qrY + 45);
    
    // QR yanında bilgi
    doc.fontSize(9)
       .fillColor('#64748b')
       .font('Helvetica')
       .text('Bu bileti mobil cihazinizda veya', 160, qrY + 10)
       .text('cikti alarak kullanabilirsiniz.', 160, qrY + 22)
       .text('Konduktore gosteriniz.', 160, qrY + 34);
    
    // Rezervasyon numarası
    doc.fontSize(11)
       .fillColor('#1e293b')
       .font('Helvetica-Bold')
       .text('Rezervasyon No:', 160, qrY + 60)
       .fontSize(14)
       .fillColor('#1e40af')
       .text(ticket.bookingReference, 160, qrY + 76);
  }

  private drawJourneySection(doc: typeof PDFDocument.prototype, ticket: TicketData): void {
    const sectionY = 250;
    
    // Bölüm başlığı
    doc.rect(40, sectionY, doc.page.width - 80, 30)
       .fill('#f1f5f9');
    
    doc.fontSize(12)
       .fillColor('#1e293b')
       .font('Helvetica-Bold')
       .text('YOLCULUK BILGILERI', 50, sectionY + 9);
    
    // Kalkış
    const journeyY = sectionY + 50;
    
    doc.fontSize(10)
       .fillColor('#64748b')
       .font('Helvetica')
       .text('KALKIS', 50, journeyY);
    
    doc.fontSize(22)
       .fillColor('#1e293b')
       .font('Helvetica-Bold')
       .text(ticket.departureTime, 50, journeyY + 15);
    
    doc.fontSize(12)
       .fillColor('#1e293b')
       .font('Helvetica')
       .text(ticket.fromStation, 50, journeyY + 45);
    
    doc.fontSize(10)
       .fillColor('#64748b')
       .text(ticket.departureDate, 50, journeyY + 62);
    
    // Ok işareti
    doc.fontSize(20)
       .fillColor('#1e40af')
       .text('-->', 260, journeyY + 20);
    
    // Varış
    doc.fontSize(10)
       .fillColor('#64748b')
       .font('Helvetica')
       .text('VARIS', 320, journeyY);
    
    doc.fontSize(22)
       .fillColor('#1e293b')
       .font('Helvetica-Bold')
       .text(ticket.arrivalTime, 320, journeyY + 15);
    
    doc.fontSize(12)
       .fillColor('#1e293b')
       .font('Helvetica')
       .text(ticket.toStation, 320, journeyY + 45);
    
    // Tren numarası
    doc.fontSize(10)
       .fillColor('#64748b')
       .text(`Tren: ${ticket.trainNumber}`, 320, journeyY + 62);
  }

  private drawPassengerSection(doc: typeof PDFDocument.prototype, ticket: TicketData): void {
    const sectionY = 400;
    
    // Bölüm başlığı
    doc.rect(40, sectionY, doc.page.width - 80, 30)
       .fill('#f1f5f9');
    
    doc.fontSize(12)
       .fillColor('#1e293b')
       .font('Helvetica-Bold')
       .text('YOLCU BILGILERI', 50, sectionY + 9);
    
    const infoY = sectionY + 50;
    
    // Yolcu adı
    doc.fontSize(10)
       .fillColor('#64748b')
       .font('Helvetica')
       .text('Yolcu Adi', 50, infoY);
    
    doc.fontSize(14)
       .fillColor('#1e293b')
       .font('Helvetica-Bold')
       .text(ticket.passengerName, 50, infoY + 15);
    
    // Email
    doc.fontSize(10)
       .fillColor('#64748b')
       .font('Helvetica')
       .text('E-posta', 50, infoY + 45);
    
    doc.fontSize(11)
       .fillColor('#1e293b')
       .text(ticket.passengerEmail, 50, infoY + 60);
  }

  private drawTicketDetails(doc: typeof PDFDocument.prototype, ticket: TicketData): void {
    const sectionY = 530;
    
    // Bölüm başlığı
    doc.rect(40, sectionY, doc.page.width - 80, 30)
       .fill('#f1f5f9');
    
    doc.fontSize(12)
       .fillColor('#1e293b')
       .font('Helvetica-Bold')
       .text('BILET DETAYLARI', 50, sectionY + 9);
    
    const detailY = sectionY + 50;
    const col1 = 50;
    const col2 = 180;
    const col3 = 310;
    const col4 = 440;
    
    // Satır 1
    doc.fontSize(9)
       .fillColor('#64748b')
       .font('Helvetica')
       .text('Vagon', col1, detailY)
       .text('Koltuk', col2, detailY)
       .text('Sinif', col3, detailY)
       .text('Ucret', col4, detailY);
    
    doc.fontSize(14)
       .fillColor('#1e293b')
       .font('Helvetica-Bold')
       .text(ticket.coach || '-', col1, detailY + 15)
       .text(ticket.seat || '-', col2, detailY + 15)
       .text(ticket.class || 'Standard', col3, detailY + 15);
    
    // Fiyat vurgulu
    doc.fontSize(18)
       .fillColor('#1e40af')
       .text(`${ticket.currency}${ticket.price.toFixed(2)}`, col4, detailY + 12);
  }

  private drawFooter(doc: typeof PDFDocument.prototype): void {
    const footerY = 700;
    
    // Ayırıcı çizgi
    doc.moveTo(40, footerY)
       .lineTo(doc.page.width - 40, footerY)
       .lineWidth(1)
       .stroke('#e2e8f0');
    
    // Uyarı metni
    doc.fontSize(8)
       .fillColor('#64748b')
       .font('Helvetica')
       .text('* Bu bilet kisiye ozeldir ve devredilemez.', 50, footerY + 15)
       .text('* Yolculuk sirasinda kimlik belgenizi yaninizda bulundurunuz.', 50, footerY + 27)
       .text('* Iptal ve degisiklik kosullari icin eurotrain.net adresini ziyaret ediniz.', 50, footerY + 39);
    
    // Alt logo
    doc.fontSize(10)
       .fillColor('#1e40af')
       .font('Helvetica-Bold')
       .text('eurotrain.net', 50, footerY + 65);
    
    doc.fontSize(8)
       .fillColor('#94a3b8')
       .font('Helvetica')
       .text('2026 EuroTrain - Tum haklari saklidir.', 50, footerY + 80);
  }

  // Buffer olarak PDF oluştur (email için)
  async generateTicketBuffer(ticket: TicketData): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 40,
      });

      const chunks: Buffer[] = [];
      
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Header
      this.drawHeader(doc, ticket);
      this.drawQRSection(doc, ticket);
      this.drawJourneySection(doc, ticket);
      this.drawPassengerSection(doc, ticket);
      this.drawTicketDetails(doc, ticket);
      this.drawFooter(doc);

      doc.end();
    });
  }
}
