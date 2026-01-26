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
  // MEVCUT METODLAR (Değişmedi)
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

    const booking = this.bookingsRepository.create({
      ...createBookingDto,
      price: finalPrice,
      departure_date: createBookingDto.departure_date,
      departure_time: createBookingDto.departure_time,
      arrival_time: createBookingDto.arrival_time,
      train_number: createBookingDto.train_number,
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
    departure_date: Date | string;
    departure_time: string;
    arrival_time: string;
    train_number: string;
    operator: string;
    operatorCode?: string;
    ticket_class: string;
    adults: number;
    children: number;
    travelersData?: any[];
    price: number;
    serviceFee: number;
    totalPrice: number;
    currency: string;
    promoCode?: string;
    promoDiscount?: number;
    paymentId: string;
    paymentMethod?: string;
    sessionToken?: string;
    traceId?: string;
    era_booking_reference?: string;
    era_pnr?: string;
  }): Promise<Booking> {
    const booking = this.bookingsRepository.create({
      ...data,
      status: BookingStatus.CONFIRMED,
      confirmedAt: new Date(),
    });

    const saved = await this.bookingsRepository.save(booking);
    this.logger.log(`Booking created from session: ${saved.bookingReference}`);
    
    return saved;
  }

  /**
   * Durumu güncelle
   */
  async updateStatus(
    id: number, 
    status: string, 
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
   */
  async updateTicketInfo(
    id: number,
    ticketData: {
      ticket_pdf_url?: string;
      ticket_pkpass_url?: string;
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

    const totalPrice = Number(booking.totalPrice || booking.price);
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
      qb.andWhere('booking.departure_date BETWEEN :fromDate AND :toDate', {
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

    // Toplam gelir
    const revenueResult = await this.bookingsRepository
      .createQueryBuilder('booking')
      .select('COALESCE(SUM(COALESCE(booking.totalPrice, booking.price)), 0)', 'total')
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
   */
  async getUpcomingByEmail(email: string): Promise<Booking[]> {
    const today = new Date();
    
    return this.bookingsRepository
      .createQueryBuilder('booking')
      .where('booking.customerEmail = :email', { email })
      .andWhere('booking.departure_date >= :today', { today })
      .andWhere('booking.status IN (:...statuses)', {
        statuses: [BookingStatus.CONFIRMED, BookingStatus.TICKETED],
      })
      .orderBy('booking.departure_date', 'ASC')
      .getMany();
  }

  /**
   * Geçmiş yolculuklar (müşteri için)
   */
  async getPastByEmail(email: string): Promise<Booking[]> {
    const today = new Date();
    
    return this.bookingsRepository
      .createQueryBuilder('booking')
      .where('booking.customerEmail = :email', { email })
      .andWhere('booking.departure_date < :today', { today })
      .orderBy('booking.departure_date', 'DESC')
      .getMany();
  }
}
