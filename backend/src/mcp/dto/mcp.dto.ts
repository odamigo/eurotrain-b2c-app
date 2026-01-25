import { IsString, IsNumber, IsOptional, IsEnum, IsArray, ValidateNested, Min, Max, MaxLength, IsDateString, Matches } from 'class-validator';
import { Type } from 'class-transformer';

// ============================================================
// COMMON TYPES
// ============================================================

export class PassengerCount {
  @IsNumber()
  @Min(1)
  @Max(9)
  adults: number;

  @IsNumber()
  @Min(0)
  @Max(9)
  @IsOptional()
  children?: number;
}

// ============================================================
// SEARCH TRAINS
// ============================================================

export class SearchTrainsInput {
  @IsString()
  @MaxLength(10)
  @Matches(/^[A-Z]{2,5}[A-Z0-9]*$/, { message: 'Invalid station code format' })
  origin: string;

  @IsString()
  @MaxLength(10)
  @Matches(/^[A-Z]{2,5}[A-Z0-9]*$/, { message: 'Invalid station code format' })
  destination: string;

  @IsDateString()
  date: string;

  @ValidateNested()
  @Type(() => PassengerCount)
  passengers: PassengerCount;

  @IsOptional()
  @IsEnum(['standard', 'first', 'any'])
  class_preference?: 'standard' | 'first' | 'any';

  @IsString()
  trace_id: string;
}

export interface SearchTrainsOffer {
  offer_ref: string;
  departure: string;       // "08:15"
  arrival: string;         // "10:30"
  departure_datetime: string;  // ISO
  arrival_datetime: string;    // ISO
  duration_minutes: number;
  operator: string;
  train_number: string;
  price: {
    amount: number;
    currency: string;
  };
  comfort_class: string;
  seats_available: boolean;
  is_refundable: boolean;
  is_exchangeable: boolean;
  offer_expires_at: string;  // ISO
}

export interface SearchTrainsOutput {
  success: boolean;
  search_id: string;
  route: {
    origin: string;
    destination: string;
  };
  date: string;
  passengers: {
    adults: number;
    children: number;
  };
  offers: SearchTrainsOffer[];
  offers_count: number;
  search_expires_at: string;  // ISO
  trace_id: string;
  error?: string;
}

// ============================================================
// GET OFFER DETAILS
// ============================================================

export class GetOfferDetailsInput {
  @IsString()
  @Matches(/^offer_[a-f0-9]{16}$/, { message: 'Invalid offer reference format' })
  offer_ref: string;

  @IsString()
  @Matches(/^search_[a-f0-9]{16}$/, { message: 'Invalid search ID format' })
  search_id: string;

  @IsString()
  trace_id: string;
}

export interface RefundPolicy {
  refundable: boolean;
  conditions: string;
  fee?: {
    amount: number;
    currency: string;
  };
}

export interface ExchangePolicy {
  exchangeable: boolean;
  conditions: string;
  fee?: {
    amount: number;
    currency: string;
  };
}

export interface BaggageInfo {
  included: string;
  max_weight_kg?: number;
  restrictions?: string[];
}

export interface BoardingInfo {
  check_in_minutes: number;
  documents_required: string[];
  special_instructions?: string;
}

export interface GetOfferDetailsOutput {
  success: boolean;
  offer_ref: string;
  
  journey: {
    origin: string;
    destination: string;
    date: string;
    departure: string;
    arrival: string;
    duration_minutes: number;
  };
  
  train: {
    operator: string;
    operator_logo?: string;
    train_number: string;
    train_type?: string;
  };
  
  class_info: {
    name: string;
    code: string;
    amenities: string[];
  };
  
  refund_policy: RefundPolicy;
  exchange_policy: ExchangePolicy;
  baggage: BaggageInfo;
  boarding: BoardingInfo;
  
  price_breakdown: {
    ticket_price: number;
    service_fee: number;
    total: number;
    currency: string;
    per_passenger: number;
    passengers: number;
  };
  
  offer_valid_until: string;  // ISO
  trace_id: string;
  error?: string;
}

// ============================================================
// CREATE BOOKING SESSION
// ============================================================

export class CreateSessionInput {
  @IsString()
  @Matches(/^offer_[a-f0-9]{16}$/, { message: 'Invalid offer reference format' })
  offer_ref: string;

  @IsString()
  @Matches(/^search_[a-f0-9]{16}$/, { message: 'Invalid search ID format' })
  search_id: string;

  @ValidateNested()
  @Type(() => PassengerCount)
  passengers: PassengerCount;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  locale?: string;

  @IsOptional()
  @IsEnum(['EUR', 'USD', 'GBP', 'TRY'])
  currency?: string;

  @IsString()
  trace_id: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  idempotency_key?: string;
}

export interface CreateSessionOutput {
  success: boolean;
  session_token: string;
  checkout_url: string;
  
  price_summary: {
    ticket_total: number;
    service_fee: number;
    grand_total: number;
    currency: string;
    passengers: number;
  };
  
  journey_summary: {
    route: string;
    date: string;
    time: string;
    operator: string;
    train_number: string;
    class: string;
  };
  
  session_expires_at: string;  // ISO
  remaining_seconds: number;
  
  next_steps: string[];
  
  trace_id: string;
  error?: string;
}

// ============================================================
// GET BOOKING STATUS
// ============================================================

export class GetBookingStatusInput {
  @IsString()
  @MaxLength(20)
  booking_reference: string;

  @IsString()
  trace_id: string;
}

export interface GetBookingStatusOutput {
  success: boolean;
  
  booking_reference: string;
  status: 'PENDING_PAYMENT' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED' | 'REFUNDED';
  
  journey: {
    route: string;
    date: string;
    departure_time: string;
  };
  
  tickets_available: boolean;
  download_url?: string;  // Only if confirmed
  
  next_action?: string;
  
  trace_id: string;
  error?: string;
}

// ============================================================
// ERROR RESPONSES
// ============================================================

export interface McpErrorOutput {
  success: false;
  error_code: string;
  user_message: string;
  technical_message?: string;
  retry_suggestion?: string;
  trace_id: string;
}

export const MCP_ERROR_CODES = {
  OFFER_NOT_FOUND: 'OFFER_NOT_FOUND',
  OFFER_EXPIRED: 'OFFER_EXPIRED',
  SESSION_NOT_FOUND: 'SESSION_NOT_FOUND',
  SESSION_EXPIRED: 'SESSION_EXPIRED',
  INVALID_INPUT: 'INVALID_INPUT',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  BOOKING_NOT_FOUND: 'BOOKING_NOT_FOUND',
  PAYMENT_FAILED: 'PAYMENT_FAILED',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;

export type McpErrorCode = typeof MCP_ERROR_CODES[keyof typeof MCP_ERROR_CODES];
