import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';
import { Booking, BookingStatus } from './entities/booking.entity';
import { PricingService } from '../pricing/pricing.service';
import { CampaignsService } from '../campaigns/campaigns.service';

@Injectable()
export class BookingsService {
  private readonly logger = new Logger(BookingsService.name);

  constructor(
    @InjectRepository(Booking)
    private bookingsRepository: Repository<Booking>,
    private pricingService: PricingService,
    private campaignsService: CampaignsService,
  ) {}

  // ============================================================
  // MEVCUT METODLAR
  // ============================================================

  async create(createBookingDto: CreateBookingDto) {
    const basePrice = createBookingDto.price;

    const priceCalculation = this.pricingService.calculateFullPrice(
      basePrice,
      'EUR'
    );

    let finalPrice = priceCalculation.total;
    let discount = 0;
    let campaignName: string | null = null;

    if (createBookingDto.promoCode) {
      try {
        const campaign = await this.campaignsService.findByCode(
          createBookingDto.promoCode
        );

        discount = this.campaignsService.calculateDiscount(
          campaign,
          basePrice,
          priceCalculation.serviceFee
        );

        finalPrice = priceCalculation.total - discount;
        campaignName = campaign.name;

        await this.campaignsService.incrementUsage(campaign.id);
      } catch (error) {
        console.log('Invalid promo code:', error.message);
      }
    }

    // REFACTORED: snake_case → camelCase
    const booking = this.bookingsRepository.create({
      ...createBookingDto,
      totalPrice: finalPrice,
      ticketPrice: basePrice,
      serviceFee: priceCalculation.serviceFee,
      departureDate: createBookingDto.departureDate,
      departureTime: createBookingDto.departureTime,
      arrivalTime: createBookingDto.arrivalTime,
      trainNumber: createBookingDto.trainNumber,
      operator: createBookingDto.operator,
    });

    const savedBooking = await this.bookingsRepository.save(booking);

    return {
      ...savedBooking,
      priceBreakdown: {
        basePrice,
        serviceFee: priceCalculation.serviceFee,
        subtotal: priceCalculation.total,
        discount,
        campaignApplied: campaignName,
        finalPrice,
      },
    };
  }

  findAll() {
    return this.bookingsRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  findOne(id: number) {
    return this.bookingsRepository.findOne({ where: { id } });
  }

  findByPnr(pnr: string) {
    return this.bookingsRepository.findOne({ where: { pnr } });
  }

  findByEmail(email: string) {
    return this.bookingsRepository.find({ 
      where: { customerEmail: email },
      order: { createdAt: 'DESC' },
    });
  }

  async update(id: number, updateBookingDto: UpdateBookingDto) {
    await this.bookingsRepository.update(id, updateBookingDto);
    return this.findOne(id);
  }

  async remove(id: number) {
    await this.bookingsRepository.delete(id);
    return { deleted: true };
  }

  // ============================================================
  // YENI METODLAR - Payment & MCP Entegrasyonu
  // ============================================================

  /**
   * Booking reference ile bul
   */
  async findByReference(reference: string): Promise<Booking | null> {
    return this.bookingsRepository.findOne({ 
      where: { bookingReference: reference } 
    });
  }

  /**
   * Payment ID ile bul
   */
  async findByPaymentId(paymentId: string): Promise<Booking | null> {
    return this.bookingsRepository.findOne({ 
      where: { paymentId } 
    });
  }

  /**
   * Session token ile bul
   */
  async findBySessionToken(sessionToken: string): Promise<Booking | null> {
    return this.bookingsRepository.findOne({ 
      where: { sessionToken } 
    });
  }

  /**
   * MCP/Payment akışı için booking oluştur
   * REFACTORED: snake_case → camelCase
   */
  async createFromSession(data: {
    bookingReference: string;
    pnr: string;
    customerName: string;
    customerEmail: string;
    customerPhone?: string;
    fromStation: string;
    toStation: string;
    fromStationCode?: string;
    toStationCode?: string;
    departureDate: string;
    departureTime: string;
    arrivalTime: string;
    trainNumber: string;
    operator: string;
    operatorCode?: string;
    ticketClass: string;
    adults: number;
    children: number;
    travelersData?: any[];
    ticketPrice: number;
    serviceFee: number;
    totalPrice: number;
    currency: string;
    promoCode?: string;
    promoDiscount?: number;
    paymentId: string;
    paymentMethod?: string;
    sessionToken?: string;
    traceId?: string;
    eraBookingId?: string;
    eraPnr?: string;
  }): Promise<Booking> {
    const bookingData: Partial<Booking> = {
      ...data,
      status: BookingStatus.CONFIRMED,
      confirmedAt: new Date(),
    };
    
    const booking = this.bookingsRepository.create(bookingData);
    const saved = await this.bookingsRepository.save(booking);
    
    this.logger.log(`Booking created from session: ${saved.bookingReference}`);
    
    return saved;
  }

  /**
   * Durumu güncelle
   * REFACTORED: status type → BookingStatus
   */
  async updateStatus(
    id: number, 
    status: BookingStatus, 
    reason?: string
  ): Promise<Booking> {
    const booking = await this.findOne(id);
    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    booking.status = status;
    if (reason) {
      booking.statusReason = reason;
    }

    if (status === BookingStatus.CONFIRMED) {
      booking.confirmedAt = new Date();
    } else if (status === BookingStatus.CANCELLED) {
      booking.cancelledAt = new Date();
    }

    return this.bookingsRepository.save(booking);
  }

  /**
   * Bilet bilgilerini güncelle
   * REFACTORED: snake_case → camelCase
   */
  async updateTicketInfo(
    id: number,
    ticketData: {
      ticketPdfUrl?: string;
      ticketPkpassUrl?: string;
      pnr?: string;
      coach?: string;
      seat?: string;
    }
  ): Promise<Booking> {
    const booking = await this.findOne(id);
    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    Object.assign(booking, ticketData);
    booking.status = BookingStatus.TICKETED;

    return this.bookingsRepository.save(booking);
  }

  /**
   * İade işle
   */
  async processRefund(
    id: number,
    amount: number,
    reason: string,
    refundedBy: string
  ): Promise<Booking> {
    const booking = await this.findOne(id);
    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    const newRefundedAmount = Number(booking.refundedAmount || 0) + amount;
    booking.refundedAmount = newRefundedAmount;
    booking.refundReason = reason;
    booking.refundedBy = refundedBy;
    booking.refundedAt = new Date();

    // REFACTORED: booking.price → booking.totalPrice
    const totalPrice = Number(booking.totalPrice);
    if (newRefundedAmount >= totalPrice) {
      booking.status = BookingStatus.REFUNDED;
    } else {
      booking.status = BookingStatus.PARTIALLY_REFUNDED;
    }

    this.logger.log(`Booking ${id} refunded: ${amount} by ${refundedBy}`);
    return this.bookingsRepository.save(booking);
  }

  /**
   * Arama (admin için)
   * REFACTORED: departure_date → departureDate
   */
  async search(params: {
    query?: string;
    status?: string;
    fromDate?: Date;
    toDate?: Date;
    page?: number;
    limit?: number;
  }): Promise<{ bookings: Booking[]; total: number; page: number; limit: number }> {
    const { query, status, fromDate, toDate, page = 1, limit = 20 } = params;

    const qb = this.bookingsRepository.createQueryBuilder('booking');

    if (query) {
      qb.andWhere(
        '(booking.bookingReference ILIKE :query OR booking.pnr ILIKE :query OR booking.customerEmail ILIKE :query OR booking.customerName ILIKE :query)',
        { query: `%${query}%` }
      );
    }

    if (status) {
      qb.andWhere('booking.status = :status', { status });
    }

    if (fromDate && toDate) {
      // REFACTORED: departure_date → departureDate
      qb.andWhere('booking.departureDate BETWEEN :fromDate AND :toDate', {
        fromDate,
        toDate,
      });
    }

    qb.orderBy('booking.createdAt', 'DESC');
    qb.skip((page - 1) * limit);
    qb.take(limit);

    const [bookings, total] = await qb.getManyAndCount();

    return { bookings, total, page, limit };
  }

  /**
   * İstatistikler
   */
  async getStats(): Promise<{
    total: number;
    confirmed: number;
    cancelled: number;
    revenue: number;
    todayCount: number;
  }> {
    const total = await this.bookingsRepository.count();
    
    const confirmed = await this.bookingsRepository.count({
      where: { status: BookingStatus.CONFIRMED },
    });
    
    const cancelled = await this.bookingsRepository.count({
      where: { status: BookingStatus.CANCELLED },
    });

    // Bugünkü rezervasyonlar
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));
    
    const todayCount = await this.bookingsRepository.count({
      where: {
        createdAt: Between(startOfDay, endOfDay),
      },
    });

    // Toplam gelir - REFACTORED: booking.price → booking.totalPrice
    const revenueResult = await this.bookingsRepository
      .createQueryBuilder('booking')
      .select('COALESCE(SUM(booking.totalPrice), 0)', 'total')
      .where('booking.status IN (:...statuses)', {
        statuses: [BookingStatus.CONFIRMED, BookingStatus.TICKETED],
      })
      .getRawOne();

    return {
      total,
      confirmed,
      cancelled,
      revenue: parseFloat(revenueResult?.total || '0'),
      todayCount,
    };
  }

  /**
   * Bugünün rezervasyonları
   */
  async getTodayBookings(): Promise<Booking[]> {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0);
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);

    return this.bookingsRepository.find({
      where: {
        createdAt: Between(startOfDay, endOfDay),
      },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Yaklaşan yolculuklar (müşteri için)
   * REFACTORED: departure_date → departureDate
   */
  async getUpcomingByEmail(email: string): Promise<Booking[]> {
    const today = new Date();
    
    return this.bookingsRepository
      .createQueryBuilder('booking')
      .where('booking.customerEmail = :email', { email })
      .andWhere('booking.departureDate >= :today', { today })
      .andWhere('booking.status IN (:...statuses)', {
        statuses: [BookingStatus.CONFIRMED, BookingStatus.TICKETED],
      })
      .orderBy('booking.departureDate', 'ASC')
      .getMany();
  }

  /**
   * Geçmiş yolculuklar (müşteri için)
   * REFACTORED: departure_date → departureDate
   */
  async getPastByEmail(email: string): Promise<Booking[]> {
    const today = new Date();
    
    return this.bookingsRepository
      .createQueryBuilder('booking')
      .where('booking.customerEmail = :email', { email })
      .andWhere('booking.departureDate < :today', { today })
      .orderBy('booking.departureDate', 'DESC')
      .getMany();
  }
}
