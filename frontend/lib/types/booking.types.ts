// ============================================================
// BOOKING TYPES
// ============================================================

export interface TravelerForm {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  type: 'adult' | 'child' | 'youth' | 'senior';
  seatPreference?: 'window' | 'aisle' | 'any';
  // Carrier-specific fields
  passportNumber?: string;
  passportExpiry?: string;
  nationality?: string;
  // Discount card - YENİ
  discountCard?: {
    code: string;
    number?: string;
  } | null;
}

export interface SeatPreference {
  id: 'window' | 'aisle' | 'any';
  label: string;
  icon: string;
}

export interface TicketingOption {
  id: string;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  recommended?: boolean;
}

export interface ComfortConfig {
  label: string;
  labelTr: string;
  color: string;
  bgColor: string;
  borderColor?: string;
  icon: string;
  features: string[];
}

export interface CarrierRequirement {
  field: string;
  label: string;
  required: boolean;
  type: 'text' | 'date' | 'select';
  options?: { value: string; label: string }[];
}

export interface BookingState {
  journey: Journey | null;
  returnJourney: Journey | null;
  isRoundTrip: boolean;
  passengers: { adults: number; children: number };
  travelers: TravelerForm[];
  currentStep: number;
  ticketingOption: string;
  promoCode: string;
  promoDiscount: number;
  termsAccepted: boolean;
  bookingId: string | null;
  bookingRef: string | null;
}

// Re-export Journey from era-client to avoid circular deps
import type { Journey } from '@/lib/api/era-client';
export type { Journey };
