import { Injectable, Logger } from '@nestjs/common';
import { Booking } from '../bookings/entities/booking.entity';

/**
 * iCal (.ics) dosyası oluşturma servisi
 * 
 * RFC 5545 standardına uygun iCalendar formatı:
 * https://datatracker.ietf.org/doc/html/rfc5545
 * 
 * Desteklenen takvim uygulamaları:
 * - Google Calendar
 * - Apple Calendar (iCal)
 * - Microsoft Outlook
 * - Yahoo Calendar
 */
@Injectable()
export class CalendarService {
  private readonly logger = new Logger(CalendarService.name);

  /**
   * Booking'den iCal (.ics) dosyası oluşturur
   * 
   * @param booking - Rezervasyon bilgileri
   * @returns iCal formatında string
   */
  generateIcs(booking: Booking): string {
    this.logger.log(`Generating iCal for booking: ${booking.bookingReference}`);

    // Tarih ve saat bilgilerini parse et
    const { startDate, endDate } = this.parseDateTime(
      booking.departureDate,
      booking.departureTime,
      booking.arrivalTime
    );

    // Unique ID oluştur (RFC 5545 UID)
    const uid = `${booking.bookingReference}@eurotrain.net`;

    // Şu anki zaman (DTSTAMP için)
    const now = this.formatDateTimeUTC(new Date());

    // Event açıklaması
    const description = this.buildDescription(booking);

    // Event konumu
    const location = `${booking.fromStation} → ${booking.toStation}`;

    // iCal içeriği oluştur
    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//EuroTrain//Ticket Calendar//TR',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'X-WR-CALNAME:EuroTrain Biletleri',
      'X-WR-TIMEZONE:Europe/Paris',
      '',
      // Timezone tanımları
      'BEGIN:VTIMEZONE',
      'TZID:Europe/Paris',
      'BEGIN:DAYLIGHT',
      'TZOFFSETFROM:+0100',
      'TZOFFSETTO:+0200',
      'TZNAME:CEST',
      'DTSTART:19700329T020000',
      'RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=-1SU',
      'END:DAYLIGHT',
      'BEGIN:STANDARD',
      'TZOFFSETFROM:+0200',
      'TZOFFSETTO:+0100',
      'TZNAME:CET',
      'DTSTART:19701025T030000',
      'RRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU',
      'END:STANDARD',
      'END:VTIMEZONE',
      '',
      // Ana event
      'BEGIN:VEVENT',
      `UID:${uid}`,
      `DTSTAMP:${now}`,
      `DTSTART;TZID=Europe/Paris:${startDate}`,
      `DTEND;TZID=Europe/Paris:${endDate}`,
      `SUMMARY:🚂 ${booking.fromStation} → ${booking.toStation}`,
      `DESCRIPTION:${this.escapeIcsText(description)}`,
      `LOCATION:${this.escapeIcsText(location)}`,
      'STATUS:CONFIRMED',
      'TRANSP:OPAQUE',
      `ORGANIZER;CN=EuroTrain:mailto:tickets@eurotrain.net`,
      '',
      // 1 gün önce hatırlatıcı
      'BEGIN:VALARM',
      'TRIGGER:-P1D',
      'ACTION:DISPLAY',
      `DESCRIPTION:Yarın tren yolculuğunuz var: ${booking.fromStation} → ${booking.toStation}`,
      'END:VALARM',
      '',
      // 2 saat önce hatırlatıcı
      'BEGIN:VALARM',
      'TRIGGER:-PT2H',
      'ACTION:DISPLAY',
      `DESCRIPTION:2 saat sonra treniniz kalkıyor! PNR: ${booking.pnr || booking.bookingReference}`,
      'END:VALARM',
      '',
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');

    return icsContent;
  }

  /**
   * Birden fazla booking için tek iCal dosyası oluşturur
   * 
   * @param bookings - Rezervasyon listesi
   * @returns iCal formatında string
   */
  generateMultipleIcs(bookings: Booking[]): string {
    this.logger.log(`Generating iCal for ${bookings.length} bookings`);

    const now = this.formatDateTimeUTC(new Date());

    // Header
    const header = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//EuroTrain//Ticket Calendar//TR',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'X-WR-CALNAME:EuroTrain Biletleri',
      'X-WR-TIMEZONE:Europe/Paris',
      '',
      // Timezone
      'BEGIN:VTIMEZONE',
      'TZID:Europe/Paris',
      'BEGIN:DAYLIGHT',
      'TZOFFSETFROM:+0100',
      'TZOFFSETTO:+0200',
      'TZNAME:CEST',
      'DTSTART:19700329T020000',
      'RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=-1SU',
      'END:DAYLIGHT',
      'BEGIN:STANDARD',
      'TZOFFSETFROM:+0200',
      'TZOFFSETTO:+0100',
      'TZNAME:CET',
      'DTSTART:19701025T030000',
      'RRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU',
      'END:STANDARD',
      'END:VTIMEZONE',
    ];

    // Events
    const events = bookings.map((booking) => {
      const { startDate, endDate } = this.parseDateTime(
        booking.departureDate,
        booking.departureTime,
        booking.arrivalTime
      );
      const uid = `${booking.bookingReference}@eurotrain.net`;
      const description = this.buildDescription(booking);

      return [
        '',
        'BEGIN:VEVENT',
        `UID:${uid}`,
        `DTSTAMP:${now}`,
        `DTSTART;TZID=Europe/Paris:${startDate}`,
        `DTEND;TZID=Europe/Paris:${endDate}`,
        `SUMMARY:🚂 ${booking.fromStation} → ${booking.toStation}`,
        `DESCRIPTION:${this.escapeIcsText(description)}`,
        `LOCATION:${this.escapeIcsText(booking.fromStation)}`,
        'STATUS:CONFIRMED',
        'BEGIN:VALARM',
        'TRIGGER:-P1D',
        'ACTION:DISPLAY',
        `DESCRIPTION:Yarın tren yolculuğunuz var`,
        'END:VALARM',
        'BEGIN:VALARM',
        'TRIGGER:-PT2H',
        'ACTION:DISPLAY',
        `DESCRIPTION:2 saat sonra treniniz kalkıyor!`,
        'END:VALARM',
        'END:VEVENT',
      ].join('\r\n');
    });

    // Footer
    const footer = ['', 'END:VCALENDAR'];

    return [...header, ...events, ...footer].join('\r\n');
  }

  /**
   * Tarih ve saat stringlerini iCal formatına çevirir
   */
  private parseDateTime(
    dateStr: string,
    departureTime: string,
    arrivalTime: string
  ): { startDate: string; endDate: string } {
    // Tarih formatı: YYYY-MM-DD veya ISO string
    let year: string, month: string, day: string;

    if (dateStr.includes('T')) {
      // ISO format
      const date = new Date(dateStr);
      year = date.getFullYear().toString();
      month = (date.getMonth() + 1).toString().padStart(2, '0');
      day = date.getDate().toString().padStart(2, '0');
    } else if (dateStr.includes('-')) {
      // YYYY-MM-DD format
      [year, month, day] = dateStr.split('-');
    } else {
      // Fallback - bugün
      const today = new Date();
      year = today.getFullYear().toString();
      month = (today.getMonth() + 1).toString().padStart(2, '0');
      day = today.getDate().toString().padStart(2, '0');
    }

    // Saat formatı: HH:MM veya HH:MM:SS
    const depTime = this.parseTime(departureTime);
    const arrTime = this.parseTime(arrivalTime);

    // iCal format: YYYYMMDDTHHMMSS
    const startDate = `${year}${month}${day}T${depTime}00`;
    
    // Varış tarihi - eğer varış saati kalkıştan küçükse ertesi gün
    let endDate: string;
    if (arrTime < depTime) {
      // Ertesi gün
      const nextDay = new Date(parseInt(year), parseInt(month) - 1, parseInt(day) + 1);
      const nextYear = nextDay.getFullYear().toString();
      const nextMonth = (nextDay.getMonth() + 1).toString().padStart(2, '0');
      const nextDayStr = nextDay.getDate().toString().padStart(2, '0');
      endDate = `${nextYear}${nextMonth}${nextDayStr}T${arrTime}00`;
    } else {
      endDate = `${year}${month}${day}T${arrTime}00`;
    }

    return { startDate, endDate };
  }

  /**
   * Saat stringini HHMM formatına çevirir
   */
  private parseTime(timeStr: string): string {
    if (!timeStr) return '0000';

    // HH:MM:SS veya HH:MM formatından HH:MM al
    const parts = timeStr.split(':');
    const hours = parts[0]?.padStart(2, '0') || '00';
    const minutes = parts[1]?.padStart(2, '0') || '00';

    return `${hours}${minutes}`;
  }

  /**
   * Date objesini UTC iCal formatına çevirir
   */
  private formatDateTimeUTC(date: Date): string {
    const year = date.getUTCFullYear();
    const month = (date.getUTCMonth() + 1).toString().padStart(2, '0');
    const day = date.getUTCDate().toString().padStart(2, '0');
    const hours = date.getUTCHours().toString().padStart(2, '0');
    const minutes = date.getUTCMinutes().toString().padStart(2, '0');
    const seconds = date.getUTCSeconds().toString().padStart(2, '0');

    return `${year}${month}${day}T${hours}${minutes}${seconds}Z`;
  }

  /**
   * Event açıklaması oluşturur
   */
  private buildDescription(booking: Booking): string {
    const lines = [
      '🎫 EuroTrain E-Bilet',
      '',
      `📍 Güzergah: ${booking.fromStation} → ${booking.toStation}`,
      `📅 Tarih: ${this.formatDisplayDate(booking.departureDate)}`,
      `🕐 Kalkış: ${booking.departureTime || '-'}`,
      `🕐 Varış: ${booking.arrivalTime || '-'}`,
      '',
      `🚂 Tren: ${booking.operator || '-'} ${booking.trainNumber || ''}`,
      `💺 Sınıf: ${this.formatClass(booking.ticketClass)}`,
    ];

    if (booking.coach && booking.seat) {
      lines.push(`🎫 Vagon/Koltuk: ${booking.coach}/${booking.seat}`);
    }

    lines.push(
      '',
      `👤 Yolcu: ${booking.customerName}`,
      `📧 Email: ${booking.customerEmail}`,
      '',
      `🔖 PNR: ${booking.pnr || booking.bookingReference}`,
      `💰 Ücret: €${Number(booking.totalPrice || 0).toFixed(2)}`,
      '',
      '📱 Biletinizi görüntülemek için:',
      `https://eurotrain.net/my-trips`,
      '',
      '⚠️ Önemli: Yolculuk sırasında kimlik belgenizi yanınızda bulundurun.',
    );

    return lines.join('\\n');
  }

  /**
   * iCal için özel karakterleri escape eder
   */
  private escapeIcsText(text: string): string {
    if (!text) return '';
    
    return text
      .replace(/\\/g, '\\\\')
      .replace(/;/g, '\\;')
      .replace(/,/g, '\\,')
      .replace(/\n/g, '\\n')
      .replace(/\r/g, '');
  }

  /**
   * Tarih formatını görüntüleme için düzenler
   */
  private formatDisplayDate(dateStr: string): string {
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

  /**
   * Sınıf kodunu Türkçe'ye çevirir
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

  /**
   * iCal dosya adı oluşturur
   */
  getFileName(booking: Booking): string {
    const ref = booking.pnr || booking.bookingReference;
    const date = booking.departureDate?.split('T')[0] || 'ticket';
    return `eurotrain-${ref}-${date}.ics`;
  }

  /**
   * Çoklu bilet için dosya adı
   */
  getMultipleFileName(): string {
    const date = new Date().toISOString().split('T')[0];
    return `eurotrain-tickets-${date}.ics`;
  }
}
