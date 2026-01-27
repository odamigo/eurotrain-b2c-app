import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';
import { Booking, BookingStatus } from './entities/booking.entity';
import { PricingService } from '../pricing/pricing.service';
import { CampaignsService } from '../campaigns/campaigns.service';
import { v4 as uuidv4 } from 'uuid';

// ============================================================
// INTERFACES - EXPORTED
// ============================================================

export interface RefundQuotation {
  id: string;
  bookingId: number;
  refundableAmount: number;
  refundFee: number;
  netRefundAmount: number;
  currency: string;
  reason?: string;
  expiresAt: Date;
  conditions: string[];
}

export interface ExchangeQuotation {
  id: string;
  bookingId: number;
  newOfferId: string;
  originalPrice: number;
  newPrice: number;
  priceDifference: number;
  exchangeFee: number;
  totalDue: number;
  currency: string;
  expiresAt: Date;
  conditions: string[];
}

export interface ExchangeOption {
  offerId: string;
  departureDate: string;
  departureTime: string;
  arrivalTime: string;
  trainNumber: string;
  operator: string;
  price: number;
  priceDifference: number;
  available: boolean;
}

// In-memory quotation cache (production'da Redis kullanılmalı)
const quotationCache = new Map<string, RefundQuotation | ExchangeQuotation>();

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

  async findByReference(reference: string): Promise<Booking | null> {
    return this.bookingsRepository.findOne({ 
      where: { bookingReference: reference } 
    });
  }

  async findByPaymentId(paymentId: string): Promise<Booking | null> {
    return this.bookingsRepository.findOne({ 
      where: { paymentId } 
    });
  }

  async findBySessionToken(sessionToken: string): Promise<Booking | null> {
    return this.bookingsRepository.findOne({ 
      where: { sessionToken } 
    });
  }

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

    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));
    
    const todayCount = await this.bookingsRepository.count({
      where: {
        createdAt: Between(startOfDay, endOfDay),
      },
    });

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

  async getPastByEmail(email: string): Promise<Booking[]> {
    const today = new Date();
    
    return this.bookingsRepository
      .createQueryBuilder('booking')
      .where('booking.customerEmail = :email', { email })
      .andWhere('booking.departureDate < :today', { today })
      .orderBy('booking.departureDate', 'DESC')
      .getMany();
  }

  // ============================================================
  // REFUND (İADE) METODLARI
  // ============================================================

  /**
   * İade teklifi hesapla
   */
  async calculateRefundQuotation(bookingId: number, reason?: string): Promise<RefundQuotation> {
    const booking = await this.findOne(bookingId);
    if (!booking) {
      throw new NotFoundException('Rezervasyon bulunamadı');
    }

    // İade kurallarını belirle
    const conditions = this.getRefundConditions(booking);
    const { refundableAmount, refundFee } = this.calculateRefundAmount(booking);

    const quotation: RefundQuotation = {
      id: uuidv4(),
      bookingId,
      refundableAmount: Number(booking.totalPrice),
      refundFee,
      netRefundAmount: refundableAmount,
      currency: booking.currency || 'EUR',
      reason,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 dakika geçerli
      conditions,
    };

    // Cache'e kaydet
    quotationCache.set(quotation.id, quotation);

    this.logger.log(`Refund quotation created: ${quotation.id} for booking ${bookingId}`);

    return quotation;
  }

  /**
   * İade tutarını hesapla
   */
  private calculateRefundAmount(booking: Booking): { refundableAmount: number; refundFee: number } {
    const totalPrice = Number(booking.totalPrice);
    const departureDate = new Date(booking.departureDate);
    const now = new Date();
    const hoursUntilDeparture = (departureDate.getTime() - now.getTime()) / (1000 * 60 * 60);

    let refundPercentage = 100;
    let refundFee = 0;

    // Kalkışa göre iade oranı
    if (hoursUntilDeparture < 0) {
      // Kalkış geçmiş - iade yok
      refundPercentage = 0;
    } else if (hoursUntilDeparture < 2) {
      // 2 saatten az - %0 iade
      refundPercentage = 0;
    } else if (hoursUntilDeparture < 24) {
      // 24 saatten az - %50 iade
      refundPercentage = 50;
      refundFee = 10; // €10 işlem ücreti
    } else if (hoursUntilDeparture < 72) {
      // 3 günden az - %75 iade
      refundPercentage = 75;
      refundFee = 5; // €5 işlem ücreti
    } else {
      // 3 günden fazla - %100 iade
      refundPercentage = 100;
      refundFee = 0;
    }

    const refundableAmount = Math.max(0, (totalPrice * refundPercentage / 100) - refundFee);

    return { refundableAmount, refundFee };
  }

  /**
   * İade koşullarını getir
   */
  private getRefundConditions(booking: Booking): string[] {
    const departureDate = new Date(booking.departureDate);
    const now = new Date();
    const hoursUntilDeparture = (departureDate.getTime() - now.getTime()) / (1000 * 60 * 60);

    const conditions: string[] = [];

    if (hoursUntilDeparture < 0) {
      conditions.push('Kalkış saati geçtiği için iade yapılamamaktadır.');
    } else if (hoursUntilDeparture < 2) {
      conditions.push('Kalkışa 2 saatten az kaldığı için iade yapılamamaktadır.');
    } else if (hoursUntilDeparture < 24) {
      conditions.push('Kalkışa 24 saatten az kaldığı için %50 iade yapılabilir.');
      conditions.push('€10 işlem ücreti kesilecektir.');
    } else if (hoursUntilDeparture < 72) {
      conditions.push('Kalkışa 3 günden az kaldığı için %75 iade yapılabilir.');
      conditions.push('€5 işlem ücreti kesilecektir.');
    } else {
      conditions.push('Tam iade yapılabilir.');
    }

    conditions.push('İade, ödeme yapılan yönteme 5-10 iş günü içinde aktarılacaktır.');

    return conditions;
  }

  /**
   * İadeyi işle (quotation ile)
   */
  async processRefundWithQuotation(
    bookingId: number,
    quotationId: string,
    reason: string,
    refundedBy: string,
  ): Promise<{ booking: Booking; refundAmount: number; transactionId: string }> {
    // Quotation'ı kontrol et
    const quotation = quotationCache.get(quotationId) as RefundQuotation;
    if (!quotation) {
      throw new BadRequestException('İade teklifi bulunamadı veya süresi dolmuş');
    }

    if (quotation.bookingId !== bookingId) {
      throw new BadRequestException('İade teklifi bu rezervasyona ait değil');
    }

    if (new Date() > quotation.expiresAt) {
      quotationCache.delete(quotationId);
      throw new BadRequestException('İade teklifinin süresi dolmuş');
    }

    // İadeyi işle
    const booking = await this.processRefund(
      bookingId,
      quotation.netRefundAmount,
      reason,
      refundedBy,
    );

    // Quotation'ı temizle
    quotationCache.delete(quotationId);

    const transactionId = `REF-${Date.now()}-${bookingId}`;

    this.logger.log(`Refund processed: ${transactionId} for booking ${bookingId}`);

    return {
      booking,
      refundAmount: quotation.netRefundAmount,
      transactionId,
    };
  }

  /**
   * İade işle (eski metod - uyumluluk için)
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

    const totalPrice = Number(booking.totalPrice);
    if (newRefundedAmount >= totalPrice) {
      booking.status = BookingStatus.REFUNDED;
    } else {
      booking.status = BookingStatus.PARTIALLY_REFUNDED;
    }

    this.logger.log(`Booking ${id} refunded: ${amount} by ${refundedBy}`);
    return this.bookingsRepository.save(booking);
  }

  // ============================================================
  // EXCHANGE (DEĞİŞİKLİK) METODLARI
  // ============================================================

  /**
   * Değişiklik için uygun seferleri ara
   */
  async searchExchangeOptions(
    bookingId: number,
    newDepartureDate: string,
    newDepartureTime?: string,
  ): Promise<ExchangeOption[]> {
    const booking = await this.findOne(bookingId);
    if (!booking) {
      throw new NotFoundException('Rezervasyon bulunamadı');
    }

    // Mock sefer seçenekleri (gerçek implementasyonda ERA API çağrılacak)
    const originalPrice = Number(booking.totalPrice);
    
    const options: ExchangeOption[] = [
      {
        offerId: `exchange-${uuidv4().slice(0, 8)}`,
        departureDate: newDepartureDate,
        departureTime: '08:00',
        arrivalTime: '10:30',
        trainNumber: 'ES9010',
        operator: booking.operator,
        price: originalPrice - 10,
        priceDifference: -10,
        available: true,
      },
      {
        offerId: `exchange-${uuidv4().slice(0, 8)}`,
        departureDate: newDepartureDate,
        departureTime: '10:00',
        arrivalTime: '12:30',
        trainNumber: 'ES9012',
        operator: booking.operator,
        price: originalPrice,
        priceDifference: 0,
        available: true,
      },
      {
        offerId: `exchange-${uuidv4().slice(0, 8)}`,
        departureDate: newDepartureDate,
        departureTime: '14:00',
        arrivalTime: '16:30',
        trainNumber: 'ES9014',
        operator: booking.operator,
        price: originalPrice + 15,
        priceDifference: 15,
        available: true,
      },
      {
        offerId: `exchange-${uuidv4().slice(0, 8)}`,
        departureDate: newDepartureDate,
        departureTime: '18:00',
        arrivalTime: '20:30',
        trainNumber: 'ES9018',
        operator: booking.operator,
        price: originalPrice + 25,
        priceDifference: 25,
        available: true,
      },
    ];

    return options;
  }

  /**
   * Değişiklik teklifi hesapla
   */
  async calculateExchangeQuotation(
    bookingId: number,
    newOfferId: string,
  ): Promise<ExchangeQuotation> {
    const booking = await this.findOne(bookingId);
    if (!booking) {
      throw new NotFoundException('Rezervasyon bulunamadı');
    }

    const originalPrice = Number(booking.totalPrice);
    
    // Mock yeni fiyat (gerçek implementasyonda offer'dan alınacak)
    const newPrice = originalPrice + Math.floor(Math.random() * 30) - 10;
    const priceDifference = newPrice - originalPrice;
    const exchangeFee = 10; // €10 değişiklik ücreti

    const quotation: ExchangeQuotation = {
      id: uuidv4(),
      bookingId,
      newOfferId,
      originalPrice,
      newPrice,
      priceDifference,
      exchangeFee,
      totalDue: Math.max(0, priceDifference) + exchangeFee,
      currency: booking.currency || 'EUR',
      expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 dakika geçerli
      conditions: this.getExchangeConditions(booking),
    };

    // Cache'e kaydet
    quotationCache.set(quotation.id, quotation);

    this.logger.log(`Exchange quotation created: ${quotation.id} for booking ${bookingId}`);

    return quotation;
  }

  /**
   * Değişiklik koşullarını getir
   */
  private getExchangeConditions(booking: Booking): string[] {
    const departureDate = new Date(booking.departureDate);
    const now = new Date();
    const hoursUntilDeparture = (departureDate.getTime() - now.getTime()) / (1000 * 60 * 60);

    const conditions: string[] = [];

    if (hoursUntilDeparture < 2) {
      conditions.push('Kalkışa 2 saatten az kaldığı için değişiklik yapılamamaktadır.');
    } else {
      conditions.push('€10 değişiklik ücreti uygulanacaktır.');
      
      if (hoursUntilDeparture < 24) {
        conditions.push('Kalkışa 24 saatten az kaldığı için sadece daha geç seferlere değişiklik yapılabilir.');
      }
    }

    conditions.push('Fiyat farkı varsa ek ödeme gerekebilir.');
    conditions.push('Değişiklik işlemi geri alınamaz.');

    return conditions;
  }

  /**
   * Değişikliği işle
   */
  async processExchange(
    bookingId: number,
    quotationId: string,
    newOfferId: string,
  ): Promise<{
    oldBooking: Booking;
    newBooking: Booking;
    priceDifference: number;
    exchangeFee: number;
  }> {
    // Quotation'ı kontrol et
    const quotation = quotationCache.get(quotationId) as ExchangeQuotation;
    if (!quotation) {
      throw new BadRequestException('Değişiklik teklifi bulunamadı veya süresi dolmuş');
    }

    if (quotation.bookingId !== bookingId) {
      throw new BadRequestException('Değişiklik teklifi bu rezervasyona ait değil');
    }

    if (new Date() > quotation.expiresAt) {
      quotationCache.delete(quotationId);
      throw new BadRequestException('Değişiklik teklifinin süresi dolmuş');
    }

    const oldBooking = await this.findOne(bookingId);
    if (!oldBooking) {
      throw new NotFoundException('Rezervasyon bulunamadı');
    }

    // Eski rezervasyonu güncelle
    oldBooking.status = BookingStatus.EXCHANGED;
    oldBooking.statusReason = `Yeni rezervasyona değiştirildi`;
    await this.bookingsRepository.save(oldBooking);

    // Yeni rezervasyon oluştur (mock - gerçek implementasyonda yeni offer ile)
    const newBookingData: Partial<Booking> = {
      ...oldBooking,
      id: undefined,
      bookingReference: `ET-${Date.now().toString(36).toUpperCase()}`,
      totalPrice: quotation.newPrice,
      status: BookingStatus.CONFIRMED,
      confirmedAt: new Date(),
      createdAt: undefined,
      updatedAt: undefined,
      metadata: {
        ...oldBooking.metadata,
        exchangedFrom: oldBooking.bookingReference,
        exchangeFee: quotation.exchangeFee,
      },
    };

    const newBooking = this.bookingsRepository.create(newBookingData);
    const savedNewBooking = await this.bookingsRepository.save(newBooking);

    // Quotation'ı temizle
    quotationCache.delete(quotationId);

    this.logger.log(`Exchange processed: ${oldBooking.bookingReference} -> ${savedNewBooking.bookingReference}`);

    return {
      oldBooking,
      newBooking: savedNewBooking,
      priceDifference: quotation.priceDifference,
      exchangeFee: quotation.exchangeFee,
    };
  }

  // ============================================================
  // KOŞULLAR
  // ============================================================

  /**
   * Rezervasyonun tüm koşullarını getir
   */
  async getBookingConditions(bookingId: number): Promise<{
    refund: { allowed: boolean; conditions: string[] };
    exchange: { allowed: boolean; conditions: string[] };
  }> {
    const booking = await this.findOne(bookingId);
    if (!booking) {
      throw new NotFoundException('Rezervasyon bulunamadı');
    }

    const departureDate = new Date(booking.departureDate);
    const now = new Date();
    const hoursUntilDeparture = (departureDate.getTime() - now.getTime()) / (1000 * 60 * 60);

    const isRefundable = hoursUntilDeparture >= 2 && 
      booking.status !== BookingStatus.CANCELLED &&
      booking.status !== BookingStatus.REFUNDED;

    const isExchangeable = hoursUntilDeparture >= 2 &&
      (booking.status === BookingStatus.CONFIRMED || booking.status === BookingStatus.TICKETED);

    return {
      refund: {
        allowed: isRefundable,
        conditions: this.getRefundConditions(booking),
      },
      exchange: {
        allowed: isExchangeable,
        conditions: this.getExchangeConditions(booking),
      },
    };
  }
}
