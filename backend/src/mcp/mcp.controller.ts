import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Headers,
  HttpException,
  HttpStatus,
  Logger,
  UseGuards,
} from '@nestjs/common';
import { OfferCacheService, CachedOffer } from './services/offer-cache.service';
import { SessionCacheService, TravelerData } from './services/session-cache.service';
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
  maxRequests: 30,       // 30 requests
  windowMs: 60 * 1000,   // per minute
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
      // Rate limit check
      const rateLimitKey = clientIp || 'anonymous';
      if (!checkRateLimit(rateLimitKey)) {
        return this.errorResponse(
          MCP_ERROR_CODES.RATE_LIMIT_EXCEEDED,
          'Çok fazla istek gönderildi. Lütfen bir dakika bekleyin.',
          traceId,
          'Rate limit exceeded'
        );
      }

      // Validate input
      if (!input.origin || !input.destination || !input.date) {
        return this.errorResponse(
          MCP_ERROR_CODES.INVALID_INPUT,
          'Kalkış, varış ve tarih bilgileri zorunludur.',
          traceId
        );
      }

      const adults = input.passengers?.adults || 1;
      const children = input.passengers?.children || 0;

      // Call ERA search (mock or real)
      const searchResult = await this.eraSearchService.simpleSearch(
        input.origin,
        input.destination,
        input.date,
        { adults, children }
      );

      // Generate search ID
      const searchId = this.offerCache.generateSearchId();

      // Transform and cache offers
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

          // Parse duration from ISO 8601 format (e.g., "PT2H30M")
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

      // Cache the search result
      const cachedSearch = this.offerCache.cacheSearchResult(searchId, offersToCache);

      // Transform to output format (no PII, minimal data)
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
        seats_available: true,  // Don't expose actual count
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

    } catch (error) {
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
      // Get offer from cache
      const offer = this.offerCache.getOffer(input.offer_ref);
      
      if (!offer) {
        return this.errorResponse(
          MCP_ERROR_CODES.OFFER_EXPIRED,
          'Bu teklif süresi dolmuş veya bulunamadı. Lütfen yeni bir arama yapın.',
          traceId,
          'Offer not found or expired',
          'search-trains ile yeni arama yapın'
        );
      }

      // Calculate pricing
      const passengerCount = offer.adults + offer.children;
      const ticketPrice = offer.price * passengerCount;
      const serviceFee = Math.round(ticketPrice * 0.05 * 100) / 100;
      const total = ticketPrice + serviceFee;

      // Build response
      const response: GetOfferDetailsOutput = {
        success: true,
        offer_ref: offer.offer_ref,
        
        journey: {
          origin: offer.origin_name,
          destination: offer.destination_name,
          date: offer.departure.split('T')[0],
          departure: this.formatTime(offer.departure),
          arrival: this.formatTime(offer.arrival),
          duration_minutes: offer.duration_minutes,
        },
        
        train: {
          operator: offer.operator,
          train_number: offer.train_number,
          train_type: this.getTrainType(offer.operator),
        },
        
        class_info: {
          name: this.getClassName(offer.comfort_class),
          code: offer.comfort_class,
          amenities: this.getAmenities(offer.comfort_class),
        },
        
        refund_policy: {
          refundable: offer.is_refundable,
          conditions: offer.is_refundable
            ? 'Kalkıştan 24 saat öncesine kadar tam iade yapılabilir.'
            : 'Bu bilet iade edilemez.',
          fee: offer.is_refundable ? undefined : { amount: 0, currency: offer.currency },
        },
        
        exchange_policy: {
          exchangeable: offer.is_exchangeable,
          conditions: offer.is_exchangeable
            ? 'Kalkıştan önce ücretsiz değişiklik yapılabilir.'
            : 'Bu bilet değiştirilemez.',
          fee: offer.is_exchangeable && !offer.is_refundable
            ? { amount: 10, currency: 'EUR' }
            : undefined,
        },
        
        baggage: {
          included: this.getBaggageInfo(offer.operator),
          max_weight_kg: 30,
        },
        
        boarding: {
          check_in_minutes: this.getCheckInTime(offer.operator),
          documents_required: this.getDocumentsRequired(offer.operator),
        },
        
        price_breakdown: {
          ticket_price: ticketPrice,
          service_fee: serviceFee,
          total,
          currency: offer.currency,
          per_passenger: offer.price,
          passengers: passengerCount,
        },
        
        offer_valid_until: offer.expires_at.toISOString(),
        trace_id: traceId,
      };

      this.logger.log(`[${traceId}] get-offer-details completed`);
      return response;

    } catch (error) {
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
      // Get offer from cache
      const offer = this.offerCache.getOffer(input.offer_ref);
      
      if (!offer) {
        return this.errorResponse(
          MCP_ERROR_CODES.OFFER_EXPIRED,
          'Bu teklif süresi dolmuş. Lütfen yeni bir arama yapın.',
          traceId,
          'Offer not found or expired',
          'search-trains ile yeni arama yapın'
        );
      }

      const adults = input.passengers?.adults || offer.adults;
      const children = input.passengers?.children || offer.children;

      // Create session with idempotency
      const idempotencyKey = input.idempotency_key || 
        this.sessionCache.generateIdempotencyKey(input.offer_ref, adults, children, traceId);

      const session = this.sessionCache.createSession({
        offer_ref: offer.offer_ref,
        offer_location: offer.offer_location,
        search_id: offer.search_id,
        
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
        currency: input.currency || offer.currency,
        
        adults,
        children,
        
        locale: input.locale,
        trace_id: traceId,
        user_agent: userAgent,
        ip_address: clientIp,
      }, idempotencyKey);

      // Build checkout URL
      const baseUrl = process.env.FRONTEND_URL || 'https://eurotrain.net';
      const checkoutUrl = `${baseUrl}/checkout/${session.session_token}`;

      const response: CreateSessionOutput = {
        success: true,
        session_token: session.session_token,
        checkout_url: checkoutUrl,
        
        price_summary: {
          ticket_total: session.base_price * (adults + children),
          service_fee: session.service_fee,
          grand_total: session.total_price,
          currency: session.currency,
          passengers: adults + children,
        },
        
        journey_summary: {
          route: `${session.origin_name} → ${session.destination_name}`,
          date: this.formatDate(session.departure),
          time: `${this.formatTime(session.departure)} - ${this.formatTime(session.arrival)}`,
          operator: session.operator,
          train_number: session.train_number,
          class: this.getClassName(session.comfort_class),
        },
        
        session_expires_at: session.expires_at.toISOString(),
        remaining_seconds: this.sessionCache.getSessionTTL(session.session_token),
        
        next_steps: [
          'Checkout sayfasında yolcu bilgilerini doldurun',
          'Koşulları kabul edin',
          'Güvenli ödeme ile biletinizi alın',
          'E-bilet e-posta adresinize gönderilecek',
        ],
        
        trace_id: traceId,
      };

      this.logger.log(`[${traceId}] create-booking-session completed: ${session.session_token}`);
      return response;

    } catch (error) {
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
      // TODO: Implement actual booking lookup from database
      // For now, return a mock response
      
      return this.errorResponse(
        MCP_ERROR_CODES.BOOKING_NOT_FOUND,
        'Rezervasyon bulunamadı. Referans numarasını kontrol edin.',
        traceId,
        'Booking lookup not implemented in mock mode'
      );

    } catch (error) {
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

    // Return session data (without sensitive fields)
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

    // Log with redacted PII
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
    // Mock promo code validation
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

    this.logger.log(`Session extended: ${token}, new expiry: ${session.expires_at.toISOString()}`);

    return { 
      success: true, 
      new_expiry: session.expires_at.toISOString(),
      remaining_seconds: this.sessionCache.getSessionTTL(token),
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

  /**
   * Parse ISO 8601 duration (e.g., "PT2H30M") to minutes
   */
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
      return 45;  // Eurostar requires earlier check-in
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
