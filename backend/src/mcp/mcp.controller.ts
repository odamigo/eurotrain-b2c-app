import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  Headers,
  Req,
  Res,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { OfferCacheService, CachedOffer } from './services/offer-cache.service';
import { SessionCacheService, TravelerData } from './services/session-cache.service';
import { CheckoutService } from './services/checkout.service';
import { EraSearchService } from '../era/services/era-search.service';
import {
  SearchTrainsInput,
  SearchTrainsOutput,
  SearchTrainsOffer,
  GetOfferDetailsInput,
  GetOfferDetailsOutput,
  CreateSessionInput,
  CreateSessionOutput,
  GetBookingStatusInput,
  GetBookingStatusOutput,
  McpErrorOutput,
  MCP_ERROR_CODES,
} from './dto/mcp.dto';

// ============================================================
// RATE LIMITING
// ============================================================

interface RateLimitEntry {
  count: number;
  windowStart: number;
}

const rateLimitStore: Map<string, RateLimitEntry> = new Map();

const RATE_LIMIT = {
  maxRequests: 30,
  windowMs: 60 * 1000,
};

function checkRateLimit(identifier: string): boolean {
  const now = Date.now();
  const entry = rateLimitStore.get(identifier);
  
  if (!entry || now - entry.windowStart > RATE_LIMIT.windowMs) {
    rateLimitStore.set(identifier, { count: 1, windowStart: now });
    return true;
  }
  
  if (entry.count >= RATE_LIMIT.maxRequests) {
    return false;
  }
  
  entry.count++;
  return true;
}

// ============================================================
// PII REDACTION
// ============================================================

function redactEmail(email: string): string {
  if (!email) return '';
  const [local, domain] = email.split('@');
  if (!domain) return '***@***';
  return `${local.charAt(0)}***@${domain.charAt(0)}***.${domain.split('.').pop()}`;
}

function redactName(name: string): string {
  if (!name) return '';
  return `${name.charAt(0)}***`;
}

// ============================================================
// MCP CONTROLLER
// ============================================================

@Controller('mcp/tools')
export class McpController {
  private readonly logger = new Logger(McpController.name);

  constructor(
    private readonly offerCache: OfferCacheService,
    private readonly sessionCache: SessionCacheService,
    private readonly checkoutService: CheckoutService,
    private readonly eraSearchService: EraSearchService,
  ) {}

  // ============================================================
  // TOOL 1: SEARCH TRAINS
  // ============================================================

  @Post('search-trains')
  async searchTrains(
    @Body() input: SearchTrainsInput,
    @Headers('x-forwarded-for') clientIp?: string,
  ): Promise<SearchTrainsOutput | McpErrorOutput> {
    const startTime = Date.now();
    const traceId = input.trace_id || `tr_${Date.now()}`;
    
    this.logger.log(`[${traceId}] search-trains: ${input.origin} → ${input.destination}, ${input.date}`);

    try {
      const rateLimitKey = clientIp || 'anonymous';
      if (!checkRateLimit(rateLimitKey)) {
        return this.errorResponse(
          MCP_ERROR_CODES.RATE_LIMIT_EXCEEDED,
          'Çok fazla istek gönderildi. Lütfen bir dakika bekleyin.',
          traceId,
          'Rate limit exceeded'
        );
      }

      if (!input.origin || !input.destination || !input.date) {
        return this.errorResponse(
          MCP_ERROR_CODES.INVALID_INPUT,
          'Kalkış, varış ve tarih bilgileri zorunludur.',
          traceId
        );
      }

      const adults = input.passengers?.adults || 1;
      const children = input.passengers?.children || 0;

      const searchResult = await this.eraSearchService.simpleSearch(
        input.origin,
        input.destination,
        input.date,
        { adults, children }
      );

      const searchId = this.offerCache.generateSearchId();
      const offersToCache: Omit<CachedOffer, 'offer_ref' | 'created_at' | 'expires_at'>[] = [];
      
      if (searchResult?.offers && Array.isArray(searchResult.offers)) {
        for (const offer of searchResult.offers) {
          const legSolution = searchResult.legs?.[0]?.solutions?.find(
            (s: any) => s.id === offer.legSolution
          );
          
          if (!legSolution) continue;

          const segment = legSolution.segments?.[0];
          const departure = new Date(legSolution.departure);
          const arrival = new Date(legSolution.arrival);

          const durationMinutes = this.parseDuration(legSolution.duration) || 
            Math.round((arrival.getTime() - departure.getTime()) / 60000);

          offersToCache.push({
            offer_location: offer.offerLocation || `/offers/mock/${offer.id}`,
            search_id: searchId,
            
            origin_code: input.origin,
            origin_name: legSolution.origin?.label || input.origin,
            destination_code: input.destination,
            destination_name: legSolution.destination?.label || input.destination,
            departure: legSolution.departure,
            arrival: legSolution.arrival,
            duration_minutes: durationMinutes,
            
            operator: segment?.marketingCarrier || segment?.operatingCarrier || 'TRAIN',
            operator_code: segment?.marketingCarrier || 'TRAIN',
            train_number: segment?.vehicle?.reference || '',
            comfort_class: offer.comfortCategory || 'standard',
            
            price: offer.prices?.total?.amount || 0,
            currency: offer.prices?.total?.currency || 'EUR',
            
            is_refundable: offer.flexibility?.refundable || false,
            is_exchangeable: offer.flexibility?.exchangeable || true,
            
            adults,
            children,
          });
        }
      }

      const cachedSearch = this.offerCache.cacheSearchResult(searchId, offersToCache);

      const offers: SearchTrainsOffer[] = cachedSearch.offers.map(offer => ({
        offer_ref: offer.offer_ref,
        departure: this.formatTime(offer.departure),
        arrival: this.formatTime(offer.arrival),
        departure_datetime: offer.departure,
        arrival_datetime: offer.arrival,
        duration_minutes: offer.duration_minutes,
        operator: offer.operator,
        train_number: offer.train_number,
        price: {
          amount: offer.price,
          currency: offer.currency,
        },
        comfort_class: offer.comfort_class,
        seats_available: true,
        is_refundable: offer.is_refundable,
        is_exchangeable: offer.is_exchangeable,
        offer_expires_at: offer.expires_at.toISOString(),
      }));

      const duration = Date.now() - startTime;
      this.logger.log(`[${traceId}] search-trains completed: ${offers.length} offers, ${duration}ms`);

      return {
        success: true,
        search_id: searchId,
        route: {
          origin: cachedSearch.offers[0]?.origin_name || input.origin,
          destination: cachedSearch.offers[0]?.destination_name || input.destination,
        },
        date: input.date,
        passengers: { adults, children },
        offers,
        offers_count: offers.length,
        search_expires_at: cachedSearch.expires_at.toISOString(),
        trace_id: traceId,
      };

    } catch (error: any) {
      this.logger.error(`[${traceId}] search-trains error: ${error.message}`);
      return this.errorResponse(
        MCP_ERROR_CODES.SERVICE_UNAVAILABLE,
        'Sefer arama şu an yapılamıyor. Lütfen daha sonra tekrar deneyin.',
        traceId,
        error.message,
        'Birkaç dakika bekleyip tekrar deneyin.'
      );
    }
  }

  // ============================================================
  // TOOL 2: GET OFFER DETAILS
  // ============================================================

  @Post('get-offer-details')
  async getOfferDetails(
    @Body() input: GetOfferDetailsInput,
  ): Promise<GetOfferDetailsOutput | McpErrorOutput> {
    const traceId = input.trace_id || `tr_${Date.now()}`;
    
    this.logger.log(`[${traceId}] get-offer-details: ${input.offer_ref}`);

    try {
      if (!input.offer_ref || !input.search_id) {
        return this.errorResponse(
          MCP_ERROR_CODES.INVALID_INPUT,
          'Teklif referansı ve arama ID zorunludur.',
          traceId
        );
      }

      // FIX: getOffer only takes 1 parameter
      const offer = this.offerCache.getOffer(input.offer_ref);
      
      if (!offer) {
        return this.errorResponse(
          MCP_ERROR_CODES.OFFER_EXPIRED,
          'Teklif bulunamadı veya süresi dolmuş. Lütfen yeni bir arama yapın.',
          traceId
        );
      }

      // Verify search_id matches
      if (offer.search_id !== input.search_id) {
        return this.errorResponse(
          MCP_ERROR_CODES.OFFER_EXPIRED,
          'Teklif bulunamadı veya süresi dolmuş. Lütfen yeni bir arama yapın.',
          traceId
        );
      }

      const passengerCount = offer.adults + offer.children;
      const ticketTotal = offer.price * passengerCount;
      const serviceFee = Math.round(ticketTotal * 0.05 * 100) / 100;
      const totalPrice = ticketTotal + serviceFee;

      return {
        success: true,
        offer_ref: offer.offer_ref,
        
        journey: {
          origin: offer.origin_name,
          origin_code: offer.origin_code,
          destination: offer.destination_name,
          destination_code: offer.destination_code,
          departure: offer.departure,
          arrival: offer.arrival,
          duration_minutes: offer.duration_minutes,
          departure_formatted: this.formatTime(offer.departure),
          arrival_formatted: this.formatTime(offer.arrival),
          date_formatted: this.formatDate(offer.departure),
        },
        
        train: {
          operator: offer.operator,
          operator_name: this.getOperatorName(offer.operator),
          train_number: offer.train_number,
          train_type: this.getTrainType(offer.operator),
        },
        
        class: {
          code: offer.comfort_class,
          name: this.getClassName(offer.comfort_class),
          amenities: this.getAmenities(offer.comfort_class),
        },
        
        pricing: {
          ticket_price: offer.price,
          ticket_total: ticketTotal,
          service_fee: serviceFee,
          total_price: totalPrice,
          currency: offer.currency,
          per_passenger: offer.price,
          passenger_count: passengerCount,
        },
        
        rules: {
          is_refundable: offer.is_refundable,
          is_exchangeable: offer.is_exchangeable,
          refund_conditions: offer.is_refundable 
            ? 'Kalkıştan 24 saat öncesine kadar ücretsiz iptal' 
            : 'Bu bilet iade edilemez',
          exchange_conditions: offer.is_exchangeable
            ? 'Kalkıştan 2 saat öncesine kadar değiştirilebilir (fark ücreti uygulanabilir)'
            : 'Bu bilet değiştirilemez',
          baggage: this.getBaggageInfo(offer.operator),
        },
        
        boarding: {
          check_in_minutes: this.getCheckInTime(offer.operator),
          documents_required: this.getDocumentsRequired(offer.operator),
          boarding_info: [
            'E-bilet ile doğrudan trene binebilirsiniz',
            'Kimlik belgesi yanınızda bulunmalıdır',
          ],
        },
        
        offer_expires_at: offer.expires_at.toISOString(),
        trace_id: traceId,
      };

    } catch (error: any) {
      this.logger.error(`[${traceId}] get-offer-details error: ${error.message}`);
      return this.errorResponse(
        MCP_ERROR_CODES.INTERNAL_ERROR,
        'Teklif detayları alınamadı.',
        traceId,
        error.message
      );
    }
  }

  // ============================================================
  // TOOL 3: CREATE BOOKING SESSION
  // ============================================================

  @Post('create-booking-session')
  async createBookingSession(
    @Body() input: CreateSessionInput,
    @Headers('user-agent') userAgent?: string,
    @Headers('x-forwarded-for') clientIp?: string,
  ): Promise<CreateSessionOutput | McpErrorOutput> {
    const traceId = input.trace_id || `tr_${Date.now()}`;
    
    this.logger.log(`[${traceId}] create-booking-session: ${input.offer_ref}`);

    try {
      if (!input.offer_ref || !input.search_id) {
        return this.errorResponse(
          MCP_ERROR_CODES.INVALID_INPUT,
          'Teklif referansı ve arama ID zorunludur.',
          traceId
        );
      }

      // FIX: getOffer only takes 1 parameter
      const offer = this.offerCache.getOffer(input.offer_ref);
      
      if (!offer) {
        return this.errorResponse(
          MCP_ERROR_CODES.OFFER_EXPIRED,
          'Teklif bulunamadı veya süresi dolmuş. Lütfen yeni bir arama yapın.',
          traceId
        );
      }

      // Verify search_id matches
      if (offer.search_id !== input.search_id) {
        return this.errorResponse(
          MCP_ERROR_CODES.OFFER_EXPIRED,
          'Teklif bulunamadı veya süresi dolmuş. Lütfen yeni bir arama yapın.',
          traceId
        );
      }

      const adults = input.passengers?.adults || offer.adults;
      const children = input.passengers?.children || offer.children;

      const idempotencyKey = this.sessionCache.generateIdempotencyKey(
        input.offer_ref,
        adults,
        children,
        traceId
      );

      const session = this.sessionCache.createSession({
        offer_ref: offer.offer_ref,
        offer_location: offer.offer_location,
        search_id: input.search_id,
        
        origin_code: offer.origin_code,
        origin_name: offer.origin_name,
        destination_code: offer.destination_code,
        destination_name: offer.destination_name,
        departure: offer.departure,
        arrival: offer.arrival,
        operator: offer.operator,
        train_number: offer.train_number,
        comfort_class: offer.comfort_class,
        
        base_price: offer.price,
        currency: offer.currency,
        
        adults,
        children,
        
        locale: input.locale,
        trace_id: traceId,
        user_agent: userAgent,
        ip_address: clientIp,
      }, idempotencyKey);

      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      const checkoutUrl = `${frontendUrl}/checkout/${session.session_token}`;

      const response: CreateSessionOutput = {
        success: true,
        session_token: session.session_token,
        checkout_url: checkoutUrl,
        
        journey_summary: {
          route: `${session.origin_name} → ${session.destination_name}`,
          date: this.formatDate(session.departure),
          time: `${this.formatTime(session.departure)} - ${this.formatTime(session.arrival)}`,
          operator: session.operator,
          train_number: session.train_number,
          class: this.getClassName(session.comfort_class),
        },
        
        pricing_summary: {
          ticket_price: session.base_price,
          service_fee: session.service_fee,
          total_price: session.total_price,
          currency: session.currency,
          passengers: `${adults} yetişkin${children > 0 ? `, ${children} çocuk` : ''}`,
        },
        
        session_expires_at: session.expires_at.toISOString(),
        remaining_seconds: this.sessionCache.getSessionTTL(session.session_token),
        
        next_steps: [
          'Yolcu bilgilerini doldurun',
          'Ödeme bilgilerini girin',
          'Rezervasyonu onaylayın',
          'E-bilet e-posta adresinize gönderilecek',
        ],
        
        trace_id: traceId,
      };

      this.logger.log(`[${traceId}] create-booking-session completed: ${session.session_token}`);
      return response;

    } catch (error: any) {
      this.logger.error(`[${traceId}] create-booking-session error: ${error.message}`);
      return this.errorResponse(
        MCP_ERROR_CODES.INTERNAL_ERROR,
        'Rezervasyon oluşturulamadı. Lütfen tekrar deneyin.',
        traceId,
        error.message
      );
    }
  }

  // ============================================================
  // TOOL 4: GET BOOKING STATUS
  // ============================================================

  @Post('get-booking-status')
  async getBookingStatus(
    @Body() input: GetBookingStatusInput,
  ): Promise<GetBookingStatusOutput | McpErrorOutput> {
    const traceId = input.trace_id || `tr_${Date.now()}`;
    
    this.logger.log(`[${traceId}] get-booking-status: ${input.booking_reference}`);

    try {
      const booking = await this.checkoutService.getBookingByReference(input.booking_reference);
      
      if (!booking) {
        return this.errorResponse(
          MCP_ERROR_CODES.BOOKING_NOT_FOUND,
          'Rezervasyon bulunamadı. Referans numarasını kontrol edin.',
          traceId
        );
      }

      return {
        success: true,
        booking_reference: booking.booking_reference,
        pnr: booking.pnr,
        status: booking.status,
        journey: booking.journey,
        travelers: booking.travelers,
        pricing: booking.pricing,
        ticket_url: booking.ticket_url,
        created_at: booking.created_at,
        trace_id: traceId,
      };

    } catch (error: any) {
      this.logger.error(`[${traceId}] get-booking-status error: ${error.message}`);
      return this.errorResponse(
        MCP_ERROR_CODES.INTERNAL_ERROR,
        'Rezervasyon durumu sorgulanamadı.',
        traceId,
        error.message
      );
    }
  }

  // ============================================================
  // SESSION ENDPOINTS (for checkout page)
  // ============================================================

  @Get('session/:token')
  async getSession(@Param('token') token: string): Promise<any> {
    const session = this.sessionCache.getSession(token);
    
    if (!session) {
      throw new HttpException('Session not found or expired', HttpStatus.NOT_FOUND);
    }

    return {
      valid: true,
      session_token: session.session_token,
      status: session.status,
      
      journey: {
        origin: session.origin_name,
        destination: session.destination_name,
        departure: session.departure,
        arrival: session.arrival,
        operator: session.operator,
        train_number: session.train_number,
        comfort_class: session.comfort_class,
      },
      
      pricing: {
        base_price: session.base_price,
        service_fee: session.service_fee,
        total_price: session.total_price,
        promo_discount: session.promo_discount,
        currency: session.currency,
      },
      
      passengers: {
        adults: session.adults,
        children: session.children,
      },
      
      travelers: session.travelers,
      
      expires_at: session.expires_at.toISOString(),
      remaining_seconds: this.sessionCache.getSessionTTL(token),
    };
  }

  @Post('session/:token/travelers')
  async updateSessionTravelers(
    @Param('token') token: string,
    @Body() body: { travelers: TravelerData[] },
  ): Promise<any> {
    const session = this.sessionCache.updateTravelers(token, body.travelers);
    
    if (!session) {
      throw new HttpException('Session not found or expired', HttpStatus.NOT_FOUND);
    }

    const redactedTravelers = body.travelers.map(t => ({
      name: `${redactName(t.first_name)} ${redactName(t.last_name)}`,
      email: redactEmail(t.email || ''),
    }));
    this.logger.log(`Session ${token} travelers updated: ${JSON.stringify(redactedTravelers)}`);

    return { success: true, status: session.status };
  }

  @Post('session/:token/promo')
  async applyPromoCode(
    @Param('token') token: string,
    @Body() body: { promo_code: string },
  ): Promise<any> {
    let discount = 0;
    const code = body.promo_code?.toUpperCase();
    
    if (code === 'EUROTRAIN10') {
      discount = 10;
    } else if (code === 'WELCOME20') {
      discount = 20;
    } else {
      throw new HttpException('Invalid promo code', HttpStatus.BAD_REQUEST);
    }

    const session = this.sessionCache.applyPromoCode(token, code, discount);
    
    if (!session) {
      throw new HttpException('Session not found or expired', HttpStatus.NOT_FOUND);
    }

    return { 
      success: true, 
      discount,
      new_total: session.total_price,
    };
  }

  @Post('session/:token/extend')
  async extendSession(@Param('token') token: string): Promise<any> {
    const session = this.sessionCache.extendSession(token);
    
    if (!session) {
      throw new HttpException('Session not found or expired', HttpStatus.NOT_FOUND);
    }

    return { 
      success: true, 
      new_expiry: session.expires_at.toISOString(),
      remaining_seconds: this.sessionCache.getSessionTTL(token),
    };
  }

  // ============================================================
  // PAYMENT ENDPOINTS
  // ============================================================

  @Post('session/:token/initiate-payment')
  async initiatePayment(
    @Param('token') token: string,
    @Req() req: Request,
  ): Promise<any> {
    const customerIp = (req as any).ip || req.headers['x-forwarded-for'] || 'unknown';
    
    this.logger.log(`Initiating payment for session: ${token}`);

    const result = await this.checkoutService.initiatePayment({
      session_token: token,
      customer_ip: customerIp as string,
    });

    if (!result.success) {
      // FIX: Don't spread result after success: false (it would overwrite)
      throw new HttpException(
        result,
        HttpStatus.BAD_REQUEST
      );
    }

    return result;
  }

  @Get('payment/callback')
  async handlePaymentCallbackGet(
    @Query() query: any,
    @Res() res: Response,
  ): Promise<void> {
    this.logger.log(`Payment callback GET: ${JSON.stringify(query)}`);

    const result = await this.checkoutService.handlePaymentCallback({
      order_id: query.merchantPaymentId || query.MERCHANTPAYMENTID || query.orderId,
      response_code: query.responseCode || query.RESPONSECODE || '00',
      response_msg: query.responseMsg || query.RESPONSEMSG,
      pg_tran_id: query.pgTranId || query.PGTRANID,
      auth_code: query.authCode || query.AUTHCODE,
      card_last_four: query.panLast4 || query.PANLAST4,
      card_brand: query.cardBrand || query.CARDBRAND,
      is_3d_secure: (query.is3D || query.IS3D) === 'YES',
      raw_data: query,
    });

    res.redirect(result.redirect_url);
  }

  @Post('payment/callback')
  async handlePaymentCallbackPost(
    @Body() body: any,
    @Query() query: any,
    @Res() res: Response,
  ): Promise<void> {
    const data = { ...body, ...query };
    this.logger.log(`Payment callback POST: ${JSON.stringify(data)}`);

    const result = await this.checkoutService.handlePaymentCallback({
      order_id: data.merchantPaymentId || data.MERCHANTPAYMENTID || data.orderId,
      response_code: data.responseCode || data.RESPONSECODE || '00',
      response_msg: data.responseMsg || data.RESPONSEMSG,
      pg_tran_id: data.pgTranId || data.PGTRANID,
      auth_code: data.authCode || data.AUTHCODE,
      card_last_four: data.panLast4 || data.PANLAST4,
      card_brand: data.cardBrand || data.CARDBRAND,
      is_3d_secure: (data.is3D || data.IS3D) === 'YES',
      raw_data: data,
    });

    res.redirect(result.redirect_url);
  }

  @Get('booking/:reference')
  async getBooking(@Param('reference') reference: string): Promise<any> {
    const booking = await this.checkoutService.getBookingByReference(reference);
    
    if (!booking) {
      throw new HttpException('Booking not found', HttpStatus.NOT_FOUND);
    }

    return {
      success: true,
      booking,
    };
  }

  // ============================================================
  // HELPER METHODS
  // ============================================================

  private formatTime(isoString: string): string {
    const date = new Date(isoString);
    return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  }

  private formatDate(isoString: string): string {
    const date = new Date(isoString);
    return date.toLocaleDateString('tr-TR', { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    });
  }

  private parseDuration(isoDuration: string): number {
    if (!isoDuration) return 0;
    const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
    if (!match) return 0;
    const hours = parseInt(match[1] || '0', 10);
    const minutes = parseInt(match[2] || '0', 10);
    return hours * 60 + minutes;
  }

  private getClassName(code: string): string {
    const names: Record<string, string> = {
      standard: 'Standart',
      comfort: 'Business',
      premier: 'Birinci Sınıf',
      first: 'Birinci Sınıf',
    };
    return names[code] || 'Standart';
  }

  private getOperatorName(code: string): string {
    const names: Record<string, string> = {
      EUROSTAR: 'Eurostar',
      SNCF: 'SNCF TGV',
      TGV: 'TGV',
      THALYS: 'Thalys',
      ICE: 'Deutsche Bahn ICE',
      TRENITALIA: 'Trenitalia',
      FRECCIAROSSA: 'Frecciarossa',
      RENFE: 'Renfe AVE',
    };
    return names[code?.toUpperCase()] || code;
  }

  private getAmenities(code: string): string[] {
    const amenities: Record<string, string[]> = {
      standard: ['WiFi', 'Elektrik prizi', 'Klima'],
      comfort: ['WiFi', 'Elektrik prizi', 'Klima', 'Geniş koltuk', 'Hafif ikram'],
      premier: ['WiFi', 'Elektrik prizi', 'Klima', 'Premium koltuk', 'Yemek servisi', 'Lounge erişimi'],
    };
    return amenities[code] || amenities.standard;
  }

  private getTrainType(operator: string): string {
    const types: Record<string, string> = {
      EUROSTAR: 'Yüksek Hızlı Tren',
      THALYS: 'Yüksek Hızlı Tren',
      TGV: 'Yüksek Hızlı Tren',
      ICE: 'Yüksek Hızlı Tren',
      FRECCIAROSSA: 'Yüksek Hızlı Tren',
    };
    return types[operator?.toUpperCase()] || 'Tren';
  }

  private getBaggageInfo(operator: string): string {
    if (operator?.toUpperCase().includes('EUROSTAR')) {
      return '2 büyük bavul + 1 el bagajı';
    }
    return '2 bavul + 1 el bagajı (kişi başı)';
  }

  private getCheckInTime(operator: string): number {
    if (operator?.toUpperCase().includes('EUROSTAR')) {
      return 45;
    }
    return 30;
  }

  private getDocumentsRequired(operator: string): string[] {
    if (operator?.toUpperCase().includes('EUROSTAR')) {
      return ['Pasaport veya Kimlik Kartı', 'E-Bilet'];
    }
    return ['Kimlik Belgesi', 'E-Bilet'];
  }

  private errorResponse(
    errorCode: string,
    userMessage: string,
    traceId: string,
    technicalMessage?: string,
    retrySuggestion?: string,
  ): McpErrorOutput {
    return {
      success: false,
      error_code: errorCode,
      user_message: userMessage,
      technical_message: technicalMessage,
      retry_suggestion: retrySuggestion,
      trace_id: traceId,
    };
  }
}
