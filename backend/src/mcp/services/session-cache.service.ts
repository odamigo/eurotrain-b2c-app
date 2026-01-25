import { Injectable, Logger } from '@nestjs/common';
import * as crypto from 'crypto';

// ============================================================
// TYPES
// ============================================================

export interface TravelerData {
  title: 'MR' | 'MS';
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  date_of_birth?: string;
  type: 'adult' | 'child';
  // Passport (for international routes)
  passport_number?: string;
  passport_expiry?: string;
  passport_country?: string;
}

export interface BookingSession {
  session_token: string;
  
  // Offer reference
  offer_ref: string;
  offer_location: string;  // ERA API path
  search_id: string;
  
  // Journey details (copied from offer for quick access)
  origin_code: string;
  origin_name: string;
  destination_code: string;
  destination_name: string;
  departure: string;
  arrival: string;
  operator: string;
  train_number: string;
  comfort_class: string;
  
  // Pricing
  base_price: number;
  service_fee: number;
  total_price: number;
  currency: string;
  
  // Passengers
  adults: number;
  children: number;
  
  // Travelers (filled during checkout)
  travelers?: TravelerData[];
  
  // Promo code
  promo_code?: string;
  promo_discount?: number;
  
  // Status
  status: 'CREATED' | 'TRAVELERS_ADDED' | 'PAYMENT_INITIATED' | 'COMPLETED' | 'EXPIRED' | 'CANCELLED';
  
  // ERA booking (after payment initiated)
  era_booking_id?: string;
  
  // Metadata
  locale: string;
  created_at: Date;
  expires_at: Date;
  
  // Tracing
  trace_id: string;
  user_agent?: string;
  ip_address?: string;
}

export interface SessionCreateInput {
  offer_ref: string;
  offer_location: string;
  search_id: string;
  
  origin_code: string;
  origin_name: string;
  destination_code: string;
  destination_name: string;
  departure: string;
  arrival: string;
  operator: string;
  train_number: string;
  comfort_class: string;
  
  base_price: number;
  currency: string;
  
  adults: number;
  children: number;
  
  locale?: string;
  trace_id: string;
  user_agent?: string;
  ip_address?: string;
}

// ============================================================
// CONSTANTS
// ============================================================

const SESSION_TTL_MINUTES = 30;  // Sessions expire after 30 minutes
const CLEANUP_INTERVAL_MS = 60 * 1000;  // Cleanup every minute
const SERVICE_FEE_PERCENT = 0.05;  // 5% service fee

// ============================================================
// SERVICE
// ============================================================

@Injectable()
export class SessionCacheService {
  private readonly logger = new Logger(SessionCacheService.name);
  
  // In-memory session cache
  private sessionCache: Map<string, BookingSession> = new Map();
  
  // Idempotency cache (prevent duplicate session creation)
  private idempotencyCache: Map<string, string> = new Map();  // key -> session_token
  
  constructor() {
    setInterval(() => this.cleanupExpired(), CLEANUP_INTERVAL_MS);
    this.logger.log('SessionCacheService initialized with in-memory storage');
  }

  // ============================================================
  // PUBLIC METHODS
  // ============================================================

  /**
   * Generate unique session token
   */
  generateSessionToken(): string {
    const hash = crypto.randomBytes(16).toString('hex');
    return `sess_${hash}`;
  }

  /**
   * Generate idempotency key from input
   */
  generateIdempotencyKey(offerRef: string, adults: number, children: number, traceId: string): string {
    return crypto
      .createHash('sha256')
      .update(`${offerRef}:${adults}:${children}:${traceId}`)
      .digest('hex')
      .substring(0, 32);
  }

  /**
   * Create a new booking session
   */
  createSession(input: SessionCreateInput, idempotencyKey?: string): BookingSession {
    // Check idempotency
    if (idempotencyKey) {
      const existingToken = this.idempotencyCache.get(idempotencyKey);
      if (existingToken) {
        const existingSession = this.sessionCache.get(existingToken);
        if (existingSession && new Date() < existingSession.expires_at) {
          this.logger.debug(`Returning existing session for idempotency key: ${idempotencyKey}`);
          return existingSession;
        }
      }
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + SESSION_TTL_MINUTES * 60 * 1000);
    const sessionToken = this.generateSessionToken();
    
    // Calculate pricing
    const passengerCount = input.adults + input.children;
    const ticketTotal = input.base_price * passengerCount;
    const serviceFee = Math.round(ticketTotal * SERVICE_FEE_PERCENT * 100) / 100;
    const totalPrice = ticketTotal + serviceFee;

    const session: BookingSession = {
      session_token: sessionToken,
      
      offer_ref: input.offer_ref,
      offer_location: input.offer_location,
      search_id: input.search_id,
      
      origin_code: input.origin_code,
      origin_name: input.origin_name,
      destination_code: input.destination_code,
      destination_name: input.destination_name,
      departure: input.departure,
      arrival: input.arrival,
      operator: input.operator,
      train_number: input.train_number,
      comfort_class: input.comfort_class,
      
      base_price: input.base_price,
      service_fee: serviceFee,
      total_price: totalPrice,
      currency: input.currency,
      
      adults: input.adults,
      children: input.children,
      
      status: 'CREATED',
      
      locale: input.locale || 'tr-TR',
      created_at: now,
      expires_at: expiresAt,
      
      trace_id: input.trace_id,
      user_agent: input.user_agent,
      ip_address: input.ip_address,
    };

    // Cache session
    this.sessionCache.set(sessionToken, session);
    
    // Cache idempotency key
    if (idempotencyKey) {
      this.idempotencyCache.set(idempotencyKey, sessionToken);
    }

    this.logger.log(
      `Session created: ${sessionToken}, trace_id: ${input.trace_id}, expires: ${expiresAt.toISOString()}`
    );

    return session;
  }

  /**
   * Get session by token
   */
  getSession(sessionToken: string): BookingSession | null {
    const session = this.sessionCache.get(sessionToken);
    
    if (!session) {
      this.logger.debug(`Session not found: ${sessionToken}`);
      return null;
    }
    
    if (new Date() > session.expires_at) {
      this.logger.debug(`Session expired: ${sessionToken}`);
      session.status = 'EXPIRED';
      return null;
    }
    
    return session;
  }

  /**
   * Update session with traveler data
   */
  updateTravelers(sessionToken: string, travelers: TravelerData[]): BookingSession | null {
    const session = this.getSession(sessionToken);
    if (!session) return null;
    
    session.travelers = travelers;
    session.status = 'TRAVELERS_ADDED';
    
    this.logger.debug(`Travelers updated for session: ${sessionToken}, count: ${travelers.length}`);
    
    return session;
  }

  /**
   * Apply promo code to session
   */
  applyPromoCode(sessionToken: string, promoCode: string, discount: number): BookingSession | null {
    const session = this.getSession(sessionToken);
    if (!session) return null;
    
    session.promo_code = promoCode;
    session.promo_discount = discount;
    session.total_price = session.total_price - discount;
    
    this.logger.debug(`Promo applied to session: ${sessionToken}, code: ${promoCode}, discount: ${discount}`);
    
    return session;
  }

  /**
   * Mark session as payment initiated
   */
  markPaymentInitiated(sessionToken: string, eraBookingId?: string): BookingSession | null {
    const session = this.getSession(sessionToken);
    if (!session) return null;
    
    session.status = 'PAYMENT_INITIATED';
    if (eraBookingId) {
      session.era_booking_id = eraBookingId;
    }
    
    this.logger.log(`Payment initiated for session: ${sessionToken}, ERA booking: ${eraBookingId || 'N/A'}`);
    
    return session;
  }

  /**
   * Mark session as completed
   */
  markCompleted(sessionToken: string): BookingSession | null {
    const session = this.sessionCache.get(sessionToken);
    if (!session) return null;
    
    session.status = 'COMPLETED';
    
    this.logger.log(`Session completed: ${sessionToken}`);
    
    return session;
  }

  /**
   * Mark session as cancelled
   */
  markCancelled(sessionToken: string): BookingSession | null {
    const session = this.sessionCache.get(sessionToken);
    if (!session) return null;
    
    session.status = 'CANCELLED';
    
    this.logger.log(`Session cancelled: ${sessionToken}`);
    
    return session;
  }

  /**
   * Get remaining TTL for a session in seconds
   */
  getSessionTTL(sessionToken: string): number {
    const session = this.sessionCache.get(sessionToken);
    if (!session) return 0;
    
    const remaining = session.expires_at.getTime() - Date.now();
    return Math.max(0, Math.floor(remaining / 1000));
  }

  /**
   * Extend session TTL (e.g., when user is actively filling form)
   */
  extendSession(sessionToken: string, additionalMinutes: number = 10): BookingSession | null {
    const session = this.getSession(sessionToken);
    if (!session) return null;
    
    const maxExpiry = new Date(session.created_at.getTime() + 60 * 60 * 1000);  // Max 1 hour from creation
    const newExpiry = new Date(Math.min(
      session.expires_at.getTime() + additionalMinutes * 60 * 1000,
      maxExpiry.getTime()
    ));
    
    session.expires_at = newExpiry;
    
    this.logger.debug(`Session extended: ${sessionToken}, new expiry: ${newExpiry.toISOString()}`);
    
    return session;
  }

  /**
   * Get cache statistics
   */
  getStats(): { sessions: number; activePayments: number } {
    let activePayments = 0;
    for (const session of this.sessionCache.values()) {
      if (session.status === 'PAYMENT_INITIATED') {
        activePayments++;
      }
    }
    
    return {
      sessions: this.sessionCache.size,
      activePayments,
    };
  }

  // ============================================================
  // PRIVATE METHODS
  // ============================================================

  private cleanupExpired(): void {
    const now = new Date();
    let expired = 0;

    for (const [key, session] of this.sessionCache.entries()) {
      if (now > session.expires_at && session.status !== 'COMPLETED' && session.status !== 'PAYMENT_INITIATED') {
        session.status = 'EXPIRED';
        this.sessionCache.delete(key);
        expired++;
      }
    }

    // Cleanup old idempotency keys (older than session TTL)
    const idempotencyExpiry = new Date(now.getTime() - SESSION_TTL_MINUTES * 60 * 1000);
    for (const [key, token] of this.idempotencyCache.entries()) {
      const session = this.sessionCache.get(token);
      if (!session || session.created_at < idempotencyExpiry) {
        this.idempotencyCache.delete(key);
      }
    }

    if (expired > 0) {
      this.logger.debug(`Cleanup: removed ${expired} expired sessions`);
    }
  }
}
