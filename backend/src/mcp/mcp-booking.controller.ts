import { 
  Controller, 
  Post, 
  Get, 
  Body, 
  Param, 
  BadRequestException,
  NotFoundException,
  HttpException,
  HttpStatus,
  Req,
} from '@nestjs/common';
import { BookingsService } from '../bookings/bookings.service';
import { PaymentService } from '../payment/payment.service';
import { EraSearchService } from '../era/services/era-search.service';
import { PaymentCurrency } from '../payment/entities/payment.entity';
import * as crypto from 'crypto';

// ============================================================
// CONSTANTS
// ============================================================

const SERVICE_FEE_PERCENT = 0.05; // %5 hizmet bedeli

// ============================================================
// RATE LIMITING & ANTI-ABUSE
// ============================================================

interface RateLimitEntry {
  count: number;
  firstRequest: number;
  blocked: boolean;
  blockUntil?: number;
}

const rateLimitStore: Map<string, RateLimitEntry> = new Map();

const RATE_LIMIT = {
  maxRequests: 10,
  windowMs: 60 * 1000,
  blockDurationMs: 5 * 60 * 1000,
};

function checkRateLimit(identifier: string): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  const entry = rateLimitStore.get(identifier);
  
  if (entry?.blocked && entry.blockUntil && now < entry.blockUntil) {
    return { allowed: false, retryAfter: Math.ceil((entry.blockUntil - now) / 1000) };
  }
  
  if (!entry || now - entry.firstRequest > RATE_LIMIT.windowMs || (entry.blocked && entry.blockUntil && now >= entry.blockUntil)) {
    rateLimitStore.set(identifier, { count: 1, firstRequest: now, blocked: false });
    return { allowed: true };
  }
  
  entry.count++;
  
  if (entry.count > RATE_LIMIT.maxRequests) {
    entry.blocked = true;
    entry.blockUntil = now + RATE_LIMIT.blockDurationMs;
    return { allowed: false, retryAfter: Math.ceil(RATE_LIMIT.blockDurationMs / 1000) };
  }
  
  return { allowed: true };
}

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
}

function isValidName(name: string): boolean {
  const nameRegex = /^[a-zA-ZÀ-ÿ\s\-'\.]{2,100}$/;
  return nameRegex.test(name);
}

function sanitizeInput(input: string): string {
  return input.trim().replace(/[<>]/g, '').substring(0, 200);
}

// ============================================================
// DTOs
// ============================================================

export class CreateMcpBookingDto {
  origin: string;
  originCode?: string;
  destination: string;
  destinationCode?: string;
  departureDate: string;
  departureTime: string;
  arrivalTime: string;
  trainNumber: string;
  operator: string;
  comfortClass: string;
  price: number;
  currency: string;
  passengerName: string;
  passengerEmail: string;
  adults?: number;
  children?: number;
  mcpSessionId?: string;
  offerId?: string;
}

export interface TravelerDto {
  title: 'MR' | 'MS';
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  dateOfBirth?: string;
  type: 'adult' | 'child';
  passportNumber?: string;
  passportExpiry?: string;
  passportCountry?: string;
}

export class InitiatePaymentDto {
  acceptedPrice: number;
  travelers?: TravelerDto[];
  promoCode?: string;
  customerIp?: string;
}

export class McpBookingResponse {
  success: boolean;
  bookingToken?: string;
  bookingId?: number;
  checkoutUrl?: string;
  expiresAt?: string;
  error?: string;
  summary?: {
    route: string;
    date: string;
    time: string;
    train: string;
    class: string;
    price: string;
    passenger: string;
    adults: number;
    children: number;
  };
}

export interface PriceVerificationResponse {
  valid: boolean;
  priceStatus: 'same' | 'increased' | 'decreased' | 'unavailable';
  originalPrice: number;
  currentPrice?: number;
  priceDifference?: number;
  percentageChange?: number;
  journeyAvailable: boolean;
  alternatives?: Array<{
    trainNumber: string;
    departureTime: string;
    arrivalTime: string;
    price: number;
    operator: string;
  }>;
  message?: string;
  error?: string;
}

const PRICE_TOLERANCE = {
  percentageThreshold: 2,
  absoluteThreshold: 2,
};

// ============================================================
// MCP BOOKING CONTROLLER
// ============================================================

@Controller('mcp')
export class McpBookingController {
  private bookingTokens: Map<string, {
    bookingId: number;
    expiresAt: Date;
    used: boolean;
    adults: number;
    children: number;
    comfortClass: string;
    travelers?: TravelerDto[];
    originalSearch?: {
      originCode: string;
      destinationCode: string;
      date: string;
      trainNumber: string;
      operator: string;
    };
  }> = new Map();

  constructor(
    private readonly bookingsService: BookingsService,
    private readonly paymentService: PaymentService,
    private readonly eraSearchService: EraSearchService,
  ) {
    setInterval(() => this.cleanupExpiredTokens(), 5 * 60 * 1000);
  }

  /**
   * POST /mcp/booking/create
   * MCP'den gelen booking isteği
   */
  @Post('booking/create')
  async createMcpBooking(
    @Body() dto: CreateMcpBookingDto,
    @Req() req: any,
  ): Promise<McpBookingResponse> {
    try {
      const clientIp = req.ip || req.headers['x-forwarded-for'] || 'unknown';
      const identifier = `${clientIp}:${dto.passengerEmail || 'anonymous'}`;
      
      const rateCheck = checkRateLimit(identifier);
      if (!rateCheck.allowed) {
        throw new HttpException(
          `Too many requests. Please try again in ${rateCheck.retryAfter} seconds.`,
          HttpStatus.TOO_MANY_REQUESTS
        );
      }
      
      // Validations
      if (!dto.origin || !dto.destination) {
        throw new BadRequestException('Origin and destination are required');
      }
      if (!dto.passengerName || !dto.passengerEmail) {
        throw new BadRequestException('Passenger name and email are required');
      }
      if (!dto.price || dto.price <= 0 || dto.price > 10000) {
        throw new BadRequestException('Invalid price. Must be between 0.01 and 10000 EUR.');
      }
      if (!isValidEmail(dto.passengerEmail)) {
        throw new BadRequestException('Invalid email address');
      }
      if (!isValidName(dto.passengerName)) {
        throw new BadRequestException('Invalid passenger name.');
      }
      
      const sanitizedName = sanitizeInput(dto.passengerName);
      const sanitizedOrigin = sanitizeInput(dto.origin);
      const sanitizedDestination = sanitizeInput(dto.destination);
      
      const validClasses = ['standard', 'comfort', 'premier'];
      const comfortClass = dto.comfortClass?.toLowerCase() || 'standard';
      if (!validClasses.includes(comfortClass)) {
        throw new BadRequestException('Invalid comfort class.');
      }

      const adults = dto.adults || 1;
      const children = dto.children || 0;

      // REFACTORED: camelCase kullan
      const booking = await this.bookingsService.create({
        customerName: sanitizedName,
        customerEmail: dto.passengerEmail.toLowerCase().trim(),
        fromStation: sanitizedOrigin,
        toStation: sanitizedDestination,
        price: dto.price,
        departureDate: dto.departureDate,
        departureTime: dto.departureTime,
        arrivalTime: dto.arrivalTime,
        trainNumber: dto.trainNumber ? sanitizeInput(dto.trainNumber) : undefined,
        operator: dto.operator ? sanitizeInput(dto.operator) : undefined,
      } as any);

      const bookingToken = this.generateBookingToken();
      const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

      this.bookingTokens.set(bookingToken, {
        bookingId: booking.id,
        expiresAt,
        used: false,
        adults,
        children,
        comfortClass,
        originalSearch: {
          originCode: dto.originCode || sanitizedOrigin,
          destinationCode: dto.destinationCode || sanitizedDestination,
          date: dto.departureDate,
          trainNumber: dto.trainNumber || '',
          operator: dto.operator || '',
        },
      });

      const baseUrl = process.env.FRONTEND_URL || 'https://eurotrain.net';
      const checkoutUrl = `${baseUrl}/booking/checkout?token=${bookingToken}`;

      const passengerCount = adults + children;
      const ticketTotal = dto.price * passengerCount;
      const serviceFee = Math.round(ticketTotal * SERVICE_FEE_PERCENT * 100) / 100;
      const grandTotal = ticketTotal + serviceFee;

      const summary = {
        route: `${sanitizedOrigin} → ${sanitizedDestination}`,
        date: dto.departureDate,
        time: `${dto.departureTime} - ${dto.arrivalTime}`,
        train: `${dto.operator || ''} ${dto.trainNumber || ''}`.trim(),
        class: comfortClass,
        price: `€${grandTotal.toFixed(2)}`,
        passenger: sanitizedName,
        adults,
        children,
      };

      return {
        success: true,
        bookingToken,
        bookingId: booking.id,
        checkoutUrl,
        expiresAt: expiresAt.toISOString(),
        summary,
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Booking creation failed',
      };
    }
  }

  /**
   * GET /mcp/booking/verify/:token
   * Token ile booking bilgilerini getir
   */
  @Get('booking/verify/:token')
  async verifyBookingToken(@Param('token') token: string) {
    const tokenData = this.bookingTokens.get(token);

    if (!tokenData) {
      return { valid: false, error: 'Invalid booking token' };
    }

    if (new Date() > tokenData.expiresAt) {
      this.bookingTokens.delete(token);
      return { valid: false, error: 'Booking token has expired' };
    }

    if (tokenData.used) {
      return { valid: false, error: 'Booking token already used' };
    }

    const booking = await this.bookingsService.findOne(tokenData.bookingId);

    if (!booking) {
      return { valid: false, error: 'Booking not found' };
    }

    // REFACTORED: camelCase kullan
    return {
      valid: true,
      booking: {
        id: booking.id,
        customerName: booking.customerName,
        customerEmail: booking.customerEmail,
        fromStation: booking.fromStation,
        toStation: booking.toStation,
        departureDate: booking.departureDate,
        departureTime: booking.departureTime,
        arrivalTime: booking.arrivalTime,
        trainNumber: booking.trainNumber,
        operator: booking.operator,
        ticketClass: tokenData.comfortClass || 'standard',
        price: booking.totalPrice,
        status: booking.status,
        adults: tokenData.adults,
        children: tokenData.children,
      },
      expiresAt: tokenData.expiresAt.toISOString(),
      remainingMinutes: Math.max(0, Math.floor((tokenData.expiresAt.getTime() - Date.now()) / 60000)),
    };
  }

  /**
   * GET /mcp/booking/verify-price/:token
   * Fiyat doğrulaması
   */
  @Get('booking/verify-price/:token')
  async verifyPrice(@Param('token') token: string): Promise<PriceVerificationResponse> {
    const tokenData = this.bookingTokens.get(token);

    if (!tokenData) {
      return { 
        valid: false, 
        priceStatus: 'unavailable',
        originalPrice: 0,
        journeyAvailable: false,
        error: 'Invalid booking token' 
      };
    }

    if (new Date() > tokenData.expiresAt) {
      this.bookingTokens.delete(token);
      return { 
        valid: false, 
        priceStatus: 'unavailable',
        originalPrice: 0,
        journeyAvailable: false,
        error: 'Booking token has expired' 
      };
    }

    const booking = await this.bookingsService.findOne(tokenData.bookingId);
    if (!booking) {
      return { 
        valid: false, 
        priceStatus: 'unavailable',
        originalPrice: 0,
        journeyAvailable: false,
        error: 'Booking not found' 
      };
    }

    // REFACTORED: booking.price → booking.totalPrice
    const originalPrice = Number(booking.totalPrice);
    const searchParams = tokenData.originalSearch;

    try {
      // REFACTORED: camelCase kullan
      const searchResult = await this.eraSearchService.simpleSearch(
        searchParams?.originCode || booking.fromStation,
        searchParams?.destinationCode || booking.toStation,
        searchParams?.date || booking.departureDate?.toString() || '',
        { adults: tokenData.adults, children: tokenData.children }
      );

      const matchingJourney = this.findMatchingJourney(
        searchResult,
        booking.trainNumber,
        booking.operator,
        booking.departureTime
      );

      if (!matchingJourney) {
        const alternatives = this.getAlternatives(searchResult, 5);
        
        return {
          valid: true,
          priceStatus: 'unavailable',
          originalPrice,
          journeyAvailable: false,
          alternatives,
          message: 'Bu sefer artık mevcut değil.',
        };
      }

      const currentPrice = matchingJourney.price;
      const priceDifference = currentPrice - originalPrice;
      const percentageChange = originalPrice > 0 
        ? (priceDifference / originalPrice) * 100 
        : 0;

      const isWithinTolerance = 
        Math.abs(percentageChange) <= PRICE_TOLERANCE.percentageThreshold ||
        Math.abs(priceDifference) <= PRICE_TOLERANCE.absoluteThreshold;

      let priceStatus: 'same' | 'increased' | 'decreased';
      let message: string;

      if (isWithinTolerance) {
        priceStatus = 'same';
        message = 'Fiyat değişmedi.';
      } else if (priceDifference > 0) {
        priceStatus = 'increased';
        message = `Fiyat €${priceDifference.toFixed(2)} arttı.`;
      } else {
        priceStatus = 'decreased';
        message = `Fiyat €${Math.abs(priceDifference).toFixed(2)} düştü.`;
      }

      return {
        valid: true,
        priceStatus,
        originalPrice,
        currentPrice,
        priceDifference,
        percentageChange,
        journeyAvailable: true,
        message,
      };

    } catch (error) {
      console.error('Price verification error:', error);
      return {
        valid: true,
        priceStatus: 'same',
        originalPrice,
        currentPrice: originalPrice,
        journeyAvailable: true,
        message: 'Fiyat doğrulaması yapılamadı. Orijinal fiyatla devam ediliyor.',
      };
    }
  }

  /**
   * GET /mcp/booking/status/:token
   */
  @Get('booking/status/:token')
  async getBookingStatus(@Param('token') token: string) {
    const tokenData = this.bookingTokens.get(token);

    if (!tokenData) {
      throw new NotFoundException('Invalid or expired booking token');
    }

    if (new Date() > tokenData.expiresAt) {
      this.bookingTokens.delete(token);
      throw new BadRequestException('Booking token has expired');
    }

    const booking = await this.bookingsService.findOne(tokenData.bookingId);

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    const payments = await this.paymentService.getPaymentsByBookingId(tokenData.bookingId);
    const completedPayment = payments.find(p => p.status === 'completed');

    // REFACTORED: camelCase kullan
    return {
      success: true,
      booking: {
        id: booking.id,
        status: booking.status,
        route: `${booking.fromStation} → ${booking.toStation}`,
        date: booking.departureDate,
        price: booking.totalPrice,
        pnr: booking.pnr,
      },
      payment: {
        status: completedPayment ? 'completed' : (payments.length > 0 ? 'pending' : 'not_started'),
        completedAt: completedPayment?.completedAt,
      },
      tokenValid: true,
      expiresAt: tokenData.expiresAt.toISOString(),
    };
  }

  /**
   * POST /mcp/booking/initiate-payment/:token
   * Ödeme başlat - Traveler bilgileri ile
   */
  @Post('booking/initiate-payment/:token')
  async initiatePaymentWithToken(
    @Param('token') token: string,
    @Body() body: InitiatePaymentDto,
  ) {
    const tokenData = this.bookingTokens.get(token);

    if (!tokenData) {
      throw new NotFoundException('Invalid or expired booking token');
    }

    if (new Date() > tokenData.expiresAt) {
      this.bookingTokens.delete(token);
      throw new BadRequestException('Booking token has expired');
    }

    const booking = await this.bookingsService.findOne(tokenData.bookingId);

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    // Validate travelers if provided
    if (body.travelers && body.travelers.length > 0) {
      const leadTraveler = body.travelers[0];
      
      await this.bookingsService.update(tokenData.bookingId, {
        customerName: `${leadTraveler.firstName} ${leadTraveler.lastName}`,
        customerEmail: leadTraveler.email || booking.customerEmail,
      });
      
      (tokenData as any).travelers = body.travelers;
    }

    // REFACTORED: booking.price → booking.totalPrice
    const finalPrice = body.acceptedPrice || Number(booking.totalPrice);

    const orderId = `MCP-${booking.id}-${Date.now()}`;
    
    const paymentResult = await this.paymentService.initiatePayment({
      orderId,
      bookingId: booking.id,
      amount: finalPrice,
      currency: PaymentCurrency.EUR,
      customerEmail: booking.customerEmail,
      customerName: booking.customerName,
      customerIp: body.customerIp,
    });

    if (paymentResult.success) {
      tokenData.used = true;
      
      if (body.acceptedPrice && body.acceptedPrice !== Number(booking.totalPrice)) {
        await this.bookingsService.update(tokenData.bookingId, {
          price: body.acceptedPrice,
        } as any);
      }
    }

    return paymentResult;
  }

  // ============================================================
  // HELPER METHODS
  // ============================================================

  private generateBookingToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  private cleanupExpiredTokens(): void {
    const now = new Date();
    for (const [token, data] of this.bookingTokens.entries()) {
      if (now > data.expiresAt) {
        this.bookingTokens.delete(token);
      }
    }
  }

  private findMatchingJourney(
    searchResult: any,
    trainNumber: string | null,
    operator: string | null,
    departureTime: string | null
  ): { price: number } | null {
    if (!searchResult?.offers || !Array.isArray(searchResult.offers)) {
      return null;
    }

    for (const offer of searchResult.offers) {
      const legSolution = searchResult.legs?.[0]?.solutions?.find(
        (s: any) => s.id === offer.legSolution
      );

      if (!legSolution) continue;

      const segment = legSolution.segments?.[0];
      const offerTrainNumber = segment?.vehicle?.reference || '';
      const offerOperator = segment?.marketingCarrier || segment?.operatingCarrier || '';
      
      const trainMatch = 
        (trainNumber && offerTrainNumber.includes(trainNumber)) ||
        (operator && offerOperator.toUpperCase().includes(operator.toUpperCase()));

      let timeMatch = true;
      if (departureTime && legSolution.departure) {
        const originalTime = this.parseTime(departureTime);
        const offerTime = new Date(legSolution.departure);
        const timeDiff = Math.abs(originalTime.getTime() - offerTime.getTime());
        timeMatch = timeDiff <= 5 * 60 * 1000;
      }

      if (trainMatch && timeMatch) {
        return {
          price: offer.prices?.total?.amount || 0,
        };
      }
    }

    return null;
  }

  private parseTime(timeStr: string): Date {
    const today = new Date();
    const [hours, minutes] = timeStr.split(':').map(Number);
    today.setHours(hours || 0, minutes || 0, 0, 0);
    return today;
  }

  private getAlternatives(searchResult: any, limit: number): Array<{
    trainNumber: string;
    departureTime: string;
    arrivalTime: string;
    price: number;
    operator: string;
  }> {
    if (!searchResult?.offers || !Array.isArray(searchResult.offers)) {
      return [];
    }

    const alternatives: Array<{
      trainNumber: string;
      departureTime: string;
      arrivalTime: string;
      price: number;
      operator: string;
    }> = [];

    for (const offer of searchResult.offers.slice(0, limit)) {
      const legSolution = searchResult.legs?.[0]?.solutions?.find(
        (s: any) => s.id === offer.legSolution
      );

      if (!legSolution) continue;

      const segment = legSolution.segments?.[0];

      alternatives.push({
        trainNumber: segment?.vehicle?.reference || 'N/A',
        departureTime: legSolution.departure 
          ? new Date(legSolution.departure).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
          : 'N/A',
        arrivalTime: legSolution.arrival
          ? new Date(legSolution.arrival).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
          : 'N/A',
        price: offer.prices?.total?.amount || 0,
        operator: segment?.marketingCarrier || segment?.operatingCarrier || 'N/A',
      });
    }

    return alternatives;
  }
}
