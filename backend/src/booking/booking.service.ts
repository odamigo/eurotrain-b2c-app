import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, Like } from 'typeorm';
import { Booking, BookingStatus } from './entities/booking.entity';

export interface BookingSearchParams {
  query?: string;
  status?: BookingStatus;
  fromDate?: Date;
  toDate?: Date;
  page?: number;
  limit?: number;
}

export interface BookingListResult {
  bookings: Booking[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

@Injectable()
export class BookingService {
  private readonly logger = new Logger(BookingService.name);

  constructor(
    @InjectRepository(Booking)
    private readonly bookingRepository: Repository<Booking>,
  ) {}

  // ============================================================
  // CREATE
  // ============================================================

  async create(data: Partial<Booking>): Promise<Booking> {
    const booking = this.bookingRepository.create(data);
    return this.bookingRepository.save(booking);
  }

  // ============================================================
  // READ
  // ============================================================

  async findById(id: number): Promise<Booking | null> {
    return this.bookingRepository.findOne({ where: { id } });
  }

  async findByReference(reference: string): Promise<Booking | null> {
    return this.bookingRepository.findOne({ where: { bookingReference: reference } });
  }

  async findByPnr(pnr: string): Promise<Booking | null> {
    return this.bookingRepository.findOne({ where: { pnr } });
  }

  async findByEmail(email: string): Promise<Booking[]> {
    return this.bookingRepository.find({
      where: { customerEmail: email },
      order: { createdAt: 'DESC' },
    });
  }

  async findByPaymentId(paymentId: string): Promise<Booking | null> {
    return this.bookingRepository.findOne({ where: { paymentId } });
  }

  async search(params: BookingSearchParams): Promise<BookingListResult> {
    const { query, status, fromDate, toDate, page = 1, limit = 20 } = params;

    const qb = this.bookingRepository.createQueryBuilder('booking');

    if (query) {
      qb.andWhere(
        '(booking.bookingReference LIKE :query OR booking.pnr LIKE :query OR booking.customerEmail LIKE :query OR booking.customerName LIKE :query)',
        { query: `%${query}%` },
      );
    }

    if (status) {
      qb.andWhere('booking.status = :status', { status });
    }

    if (fromDate && toDate) {
      qb.andWhere('booking.departureDate BETWEEN :fromDate AND :toDate', {
        fromDate: fromDate.toISOString(),
        toDate: toDate.toISOString(),
      });
    }

    qb.orderBy('booking.createdAt', 'DESC');
    qb.skip((page - 1) * limit);
    qb.take(limit);

    const [bookings, total] = await qb.getManyAndCount();

    return {
      bookings,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getUpcomingBookings(email: string): Promise<Booking[]> {
    const now = new Date().toISOString();
    return this.bookingRepository.find({
      where: {
        customerEmail: email,
        status: BookingStatus.CONFIRMED,
      },
      order: { departureDate: 'ASC' },
    });
  }

  async getPastBookings(email: string): Promise<Booking[]> {
    const now = new Date().toISOString();
    return this.bookingRepository.find({
      where: {
        customerEmail: email,
      },
      order: { departureDate: 'DESC' },
    });
  }

  // ============================================================
  // UPDATE
  // ============================================================

  async updateStatus(id: number, status: BookingStatus, reason?: string): Promise<Booking> {
    const booking = await this.findById(id);
    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    booking.status = status;
    booking.statusReason = reason || null;
    booking.lastStatusChange = new Date();

    if (status === BookingStatus.CONFIRMED) {
      booking.confirmedAt = new Date();
    } else if (status === BookingStatus.CANCELLED) {
      booking.cancelledAt = new Date();
    }

    return this.bookingRepository.save(booking);
  }

  async updateTicketInfo(
    id: number,
    ticketData: {
      ticketPdfUrl?: string;
      ticketPkpassUrl?: string;
      ticketData?: any;
    },
  ): Promise<Booking> {
    const booking = await this.findById(id);
    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    if (ticketData.ticketPdfUrl) booking.ticketPdfUrl = ticketData.ticketPdfUrl;
    if (ticketData.ticketPkpassUrl) booking.ticketPkpassUrl = ticketData.ticketPkpassUrl;
    if (ticketData.ticketData) booking.ticketData = ticketData.ticketData;

    booking.status = BookingStatus.TICKETED;

    return this.bookingRepository.save(booking);
  }

  async processRefund(
    id: number,
    amount: number,
    reason: string,
    refundedBy: string,
  ): Promise<Booking> {
    const booking = await this.findById(id);
    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    const newRefundedAmount = Number(booking.refundedAmount || 0) + amount;
    booking.refundedAmount = newRefundedAmount;
    booking.refundReason = reason;
    booking.refundedBy = refundedBy;
    booking.refundedAt = new Date();

    if (newRefundedAmount >= Number(booking.totalPrice)) {
      booking.status = BookingStatus.REFUNDED;
    } else {
      booking.status = BookingStatus.PARTIALLY_REFUNDED;
    }

    return this.bookingRepository.save(booking);
  }

  // ============================================================
  // STATISTICS
  // ============================================================

  async getStats(): Promise<{
    total: number;
    confirmed: number;
    cancelled: number;
    revenue: number;
  }> {
    const total = await this.bookingRepository.count();
    const confirmed = await this.bookingRepository.count({
      where: { status: BookingStatus.CONFIRMED },
    });
    const cancelled = await this.bookingRepository.count({
      where: { status: BookingStatus.CANCELLED },
    });

    const revenueResult = await this.bookingRepository
      .createQueryBuilder('booking')
      .select('SUM(booking.totalPrice)', 'total')
      .where('booking.status IN (:...statuses)', {
        statuses: [BookingStatus.CONFIRMED, BookingStatus.TICKETED],
      })
      .getRawOne();

    return {
      total,
      confirmed,
      cancelled,
      revenue: parseFloat(revenueResult?.total || '0'),
    };
  }

  async getTodayBookings(): Promise<Booking[]> {
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0)).toISOString();
    const endOfDay = new Date(today.setHours(23, 59, 59, 999)).toISOString();

    return this.bookingRepository.find({
      where: {
        createdAt: Between(new Date(startOfDay), new Date(endOfDay)),
      },
      order: { createdAt: 'DESC' },
    });
  }
}
