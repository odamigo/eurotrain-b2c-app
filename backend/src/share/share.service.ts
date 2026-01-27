import { Injectable, Logger } from '@nestjs/common';
import { Booking } from '../bookings/entities/booking.entity';

/**
 * Bilet paylaşım servisi
 * 
 * Desteklenen platformlar:
 * - WhatsApp
 * - SMS
 * - Email (mailto:)
 * - Clipboard (copy)
 * - Native Share API
 */
@Injectable()
export class ShareService {
  private readonly logger = new Logger(ShareService.name);

  /**
   * WhatsApp paylaşım URL'i oluşturur
   * 
   * @param booking - Rezervasyon bilgileri
   * @returns WhatsApp deep link URL
   */
  generateWhatsAppUrl(booking: Booking): string {
    const text = this.generateShareText(booking);
    const encodedText = encodeURIComponent(text);
    
    // WhatsApp Universal Link (hem mobil hem web çalışır)
    return `https://wa.me/?text=${encodedText}`;
  }

  /**
   * WhatsApp'ta belirli numaraya gönderme URL'i
   */
  generateWhatsAppUrlWithNumber(booking: Booking, phoneNumber: string): string {
    const text = this.generateShareText(booking);
    const encodedText = encodeURIComponent(text);
    const cleanNumber = phoneNumber.replace(/\D/g, ''); // Sadece rakamlar
    
    return `https://wa.me/${cleanNumber}?text=${encodedText}`;
  }

  /**
   * SMS paylaşım URL'i oluşturur
   */
  generateSmsUrl(booking: Booking): string {
    const text = this.generateShareTextShort(booking);
    const encodedText = encodeURIComponent(text);
    
    // iOS ve Android için farklı formatlar var, bu universal çalışmalı
    return `sms:?body=${encodedText}`;
  }

  /**
   * Email (mailto:) paylaşım URL'i oluşturur
   */
  generateEmailUrl(booking: Booking, recipientEmail?: string): string {
    const subject = encodeURIComponent(
      `Tren Bileti: ${booking.fromStation} → ${booking.toStation} (${this.formatDate(booking.departureDate)})`
    );
    const body = encodeURIComponent(this.generateShareText(booking));
    
    const to = recipientEmail ? recipientEmail : '';
    
    return `mailto:${to}?subject=${subject}&body=${body}`;
  }

  /**
   * Paylaşım için formatlanmış metin oluşturur (uzun versiyon)
   */
  generateShareText(booking: Booking): string {
    const lines = [
      '🚂 EuroTrain Bilet Bilgisi',
      '━━━━━━━━━━━━━━━━━━━━━━━━━━',
      '',
      `📍 ${booking.fromStation} → ${booking.toStation}`,
      `📅 ${this.formatDate(booking.departureDate)}`,
      `🕐 Kalkış: ${booking.departureTime || '-'}`,
      `🕐 Varış: ${booking.arrivalTime || '-'}`,
      '',
      `🚂 ${booking.operator || 'Tren'} ${booking.trainNumber || ''}`,
      `💺 Sınıf: ${this.formatClass(booking.ticketClass)}`,
    ];

    if (booking.coach && booking.seat) {
      lines.push(`🎫 Vagon/Koltuk: ${booking.coach}/${booking.seat}`);
    }

    lines.push(
      '',
      `🔖 PNR: ${booking.pnr || booking.bookingReference}`,
      '',
      '📱 Bilet detayları için:',
      'https://eurotrain.net/my-trips',
    );

    return lines.join('\n');
  }

  /**
   * Paylaşım için kısa metin (SMS için ideal)
   */
  generateShareTextShort(booking: Booking): string {
    return [
      `🚂 ${booking.fromStation} → ${booking.toStation}`,
      `📅 ${this.formatDate(booking.departureDate)} ${booking.departureTime || ''}`,
      `PNR: ${booking.pnr || booking.bookingReference}`,
      'eurotrain.net/my-trips',
    ].join('\n');
  }

  /**
   * Clipboard için düz metin
   */
  generateClipboardText(booking: Booking): string {
    return this.generateShareText(booking);
  }

  /**
   * Native Web Share API için data objesi
   */
  generateWebShareData(booking: Booking): {
    title: string;
    text: string;
    url: string;
  } {
    return {
      title: `Tren Bileti: ${booking.fromStation} → ${booking.toStation}`,
      text: this.generateShareTextShort(booking),
      url: 'https://eurotrain.net/my-trips',
    };
  }

  /**
   * Tüm paylaşım URL'lerini döndürür
   */
  getAllShareUrls(booking: Booking): {
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
  } {
    return {
      whatsapp: this.generateWhatsAppUrl(booking),
      sms: this.generateSmsUrl(booking),
      email: this.generateEmailUrl(booking),
      text: this.generateShareText(booking),
      shortText: this.generateShareTextShort(booking),
      webShare: this.generateWebShareData(booking),
    };
  }

  /**
   * Sosyal medya meta tag'leri için veri
   * (Open Graph / Twitter Cards)
   */
  generateSocialMetaData(booking: Booking): {
    ogTitle: string;
    ogDescription: string;
    ogImage: string;
    twitterCard: string;
  } {
    return {
      ogTitle: `Tren Bileti: ${booking.fromStation} → ${booking.toStation}`,
      ogDescription: `${this.formatDate(booking.departureDate)} tarihinde ${booking.operator} ile seyahat`,
      ogImage: 'https://eurotrain.net/images/og-ticket.png',
      twitterCard: 'summary',
    };
  }

  /**
   * Tarih formatla
   */
  private formatDate(dateStr: string): string {
    if (!dateStr) return '-';

    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('tr-TR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  }

  /**
   * Sınıf formatla
   */
  private formatClass(ticketClass: string): string {
    const classMap: Record<string, string> = {
      standard: 'Standart',
      comfort: 'Business',
      premier: 'Birinci Sınıf',
      first: 'Birinci Sınıf',
      second: 'İkinci Sınıf',
    };

    return classMap[ticketClass?.toLowerCase()] || ticketClass || 'Standart';
  }
}
