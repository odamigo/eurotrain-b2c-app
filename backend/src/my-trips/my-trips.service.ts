import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan, LessThan } from 'typeorm';
import { Booking } from '../bookings/entities/booking.entity';
import * as crypto from 'crypto';

@Injectable()
export class MyTripsService {
  constructor(
    @InjectRepository(Booking)
    private bookingRepository: Repository<Booking>,
  ) {}

  // Magic token oluştur (64 karakter hex)
  private generateMagicToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  // Email ile magic link oluştur
  async createMagicLink(email: string): Promise<{ token: string; expiresAt: Date }> {
    // Bu email'e ait booking var mı?
    const bookings = await this.bookingRepository.find({
      where: { customerEmail: email },
    });

    if (bookings.length === 0) {
      throw new NotFoundException('Bu e-posta adresiyle kayıtlı bilet bulunamadı');
    }

    // Token oluştur (24 saat geçerli)
    const token = this.generateMagicToken();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    // Tüm booking'lere aynı token'ı ata
    await this.bookingRepository.update(
      { customerEmail: email },
      { 
        magic_token: token, 
        token_expires_at: expiresAt 
      },
    );

    return { token, expiresAt };
  }

  // Token ile biletleri getir
  async getBookingsByToken(token: string): Promise<Booking[]> {
    const bookings = await this.bookingRepository.find({
      where: {
        magic_token: token,
        token_expires_at: MoreThan(new Date()),
      },
      order: { departure_date: 'ASC', departure_time: 'ASC' },
    });

    if (bookings.length === 0) {
      throw new NotFoundException('Geçersiz veya süresi dolmuş link');
    }

    return bookings;
  }

  // Email ile biletleri getir (admin veya internal kullanım)
  async getBookingsByEmail(email: string): Promise<Booking[]> {
    return this.bookingRepository.find({
      where: { customerEmail: email },
      order: { departure_date: 'ASC', departure_time: 'ASC' },
    });
  }

  // Tek bilet detayı
  async getBookingById(id: number, token?: string): Promise<Booking> {
    const whereClause: any = { id };
    
    // Token varsa doğrula
    if (token) {
      whereClause.magic_token = token;
      whereClause.token_expires_at = MoreThan(new Date());
    }

    const booking = await this.bookingRepository.findOne({
      where: whereClause,
    });

    if (!booking) {
      throw new NotFoundException('Bilet bulunamadı');
    }

    return booking;
  }

  // Biletleri kategorize et (upcoming / past)
  categorizeBookings(bookings: Booking[]): { upcoming: Booking[]; past: Booking[] } {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const upcoming: Booking[] = [];
    const past: Booking[] = [];

    for (const booking of bookings) {
      if (booking.departure_date) {
        const departureDate = new Date(booking.departure_date);
        if (departureDate >= today) {
          upcoming.push(booking);
        } else {
          past.push(booking);
        }
      } else {
        // Tarih yoksa createdAt'e bak
        const createdDate = new Date(booking.createdAt);
        if (createdDate >= today) {
          upcoming.push(booking);
        } else {
          past.push(booking);
        }
      }
    }

    return { upcoming, past };
  }

  // Order ID ile bilet getir
  async getBookingByOrderId(orderId: string): Promise<Booking> {
    const booking = await this.bookingRepository.findOne({
      where: { pnr: orderId },
    });

    if (!booking) {
      throw new NotFoundException('Bilet bulunamadı');
    }

    return booking;
  }
}