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
  departure: string;
  arrival: string;
  departure_datetime: string;
  arrival_datetime: string;
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
  offer_expires_at: string;
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
  search_expires_at: string;
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

export interface GetOfferDetailsOutput {
  success: boolean;
  offer_ref: string;

  journey: {
    origin: string;
    origin_code: string;
    destination: string;
    destination_code: string;
    departure: string;
    arrival: string;
    duration_minutes: number;
    departure_formatted: string;
    arrival_formatted: string;
    date_formatted: string;
  };

  train: {
    operator: string;
    operator_name: string;
    train_number: string;
    train_type: string;
  };

  class: {
    code: string;
    name: string;
    amenities: string[];
  };

  pricing: {
    ticket_price: number;
    ticket_total: number;
    service_fee: number;
    total_price: number;
    currency: string;
    per_passenger: number;
    passenger_count: number;
  };

  rules: {
    is_refundable: boolean;
    is_exchangeable: boolean;
    refund_conditions: string;
    exchange_conditions: string;
    baggage: string;
  };

  boarding: {
    check_in_minutes: number;
    documents_required: string[];
    boarding_info: string[];
  };

  offer_expires_at: string;
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

  journey_summary: {
    route: string;
    date: string;
    time: string;
    operator: string;
    train_number: string;
    class: string;
  };

  pricing_summary: {
    ticket_price: number;
    service_fee: number;
    total_price: number;
    currency: string;
    passengers: string;
  };

  session_expires_at: string;
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
  pnr?: string;
  status: string;
  journey: any;
  travelers?: any[];
  pricing?: any;
  ticket_url?: string;
  created_at?: string;
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
