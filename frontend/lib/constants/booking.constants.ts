// ============================================================
// BOOKING CONSTANTS
// ============================================================

import { Smartphone, Printer, QrCode } from 'lucide-react';
import type { ComfortConfig, SeatPreference, TicketingOption } from '@/lib/types/booking.types';

// Comfort class configuration
export const COMFORT_CONFIG: Record<string, ComfortConfig> = {
  standard: {
    label: 'Standard',
    labelTr: 'Standart',
    color: 'text-slate-700',
    bgColor: 'bg-slate-100',
    borderColor: 'border-slate-200',
    icon: '🎫',
    features: ['Standart koltuk', '1 el bagajı', 'Elektrik prizi'],
  },
  comfort: {
    label: 'Business',
    labelTr: 'Business',
    color: 'text-amber-700',
    bgColor: 'bg-amber-100',
    borderColor: 'border-amber-200',
    icon: '💼',
    features: ['Geniş koltuk', '2 bagaj hakkı', 'WiFi', 'Yiyecek servisi'],
  },
  premier: {
    label: 'First Class',
    labelTr: 'Birinci Sınıf',
    color: 'text-purple-700',
    bgColor: 'bg-purple-100',
    borderColor: 'border-purple-200',
    icon: '👑',
    features: ['Lüks koltuk', 'Sınırsız bagaj', 'Premium WiFi', 'Özel lounge', 'Tam yemek'],
  },
};

// Seat preferences
export const SEAT_PREFERENCES: SeatPreference[] = [
  { id: 'window', label: 'Pencere Kenarı', icon: '🪟' },
  { id: 'aisle', label: 'Koridor Kenarı', icon: '🚶' },
  { id: 'any', label: 'Fark Etmez', icon: '💺' },
];

// Ticketing options
export const TICKETING_OPTIONS: TicketingOption[] = [
  {
    id: 'eticket',
    label: 'E-Bilet',
    description: 'Telefonunuzda gösterin',
    icon: Smartphone,
    recommended: true,
  },
  {
    id: 'print',
    label: 'Yazdır',
    description: 'PDF olarak indirin',
    icon: Printer,
    recommended: false,
  },
  {
    id: 'qr',
    label: 'QR Kod',
    description: 'Hızlı biniş için',
    icon: QrCode,
    recommended: false,
  },
];

// Pricing
export const SERVICE_FEE_PERCENT = 0.05; // 5%
export const SEAT_RESERVATION_FEE = 3; // €3 per person per journey

// Booking hold time
export const BOOKING_HOLD_MINUTES = 15;
export const BOOKING_WARNING_MINUTES = 5;

// Promo codes (mock - production'da backend'den gelecek)
export const PROMO_CODES: Record<string, number> = {
  EUROTRAIN10: 10,
  WELCOME20: 20,
  SUMMER25: 25,
};
