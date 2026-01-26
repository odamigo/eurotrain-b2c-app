// ============================================================
// MCP API Client for Frontend
// EuroTrain B2C Platform - Session-based Checkout with Payment
// ============================================================

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// ============================================================
// TYPES
// ============================================================

export interface SessionJourney {
  origin: string;
  destination: string;
  departure: string;
  arrival: string;
  operator: string;
  train_number: string;
  comfort_class: 'standard' | 'comfort' | 'premier';
}

export interface SessionPricing {
  base_price: number;
  service_fee: number;
  total_price: number;
  promo_discount?: number;
  currency: string;
}

export interface SessionPassengers {
  adults: number;
  children: number;
}

export interface TravelerData {
  title: 'MR' | 'MS';
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  date_of_birth?: string;
  type: 'adult' | 'child';
  passport_number?: string;
  passport_expiry?: string;
  passport_country?: string;
}

export interface SessionData {
  valid: boolean;
  session_token: string;
  status: 'CREATED' | 'TRAVELERS_ADDED' | 'PAYMENT_INITIATED' | 'COMPLETED' | 'EXPIRED' | 'CANCELLED';
  journey: SessionJourney;
  pricing: SessionPricing;
  passengers: SessionPassengers;
  travelers?: TravelerData[];
  expires_at: string;
  remaining_seconds: number;
}

export interface PromoResult {
  success: boolean;
  discount: number;
  new_total: number;
}

export interface InitiatePaymentResult {
  success: boolean;
  payment_url?: string;
  payment_id?: string;
  order_id?: string;
  expires_at?: string;
  error_code?: string;
  error_message?: string;
}

export interface BookingData {
  booking_reference: string;
  pnr: string;
  status: string;
  journey: {
    origin: string;
    destination: string;
    departure: string;
    arrival: string;
    operator: string;
    train_number: string;
  };
  travelers: Array<{
    name: string;
    type: string;
  }>;
  pricing: {
    ticket_price: number;
    service_fee: number;
    total_paid: number;
    currency: string;
  };
  ticket_url?: string;
  created_at: string;
}

// ============================================================
// SESSION API FUNCTIONS
// ============================================================

/**
 * Session bilgilerini getir
 */
export async function getSession(sessionToken: string): Promise<SessionData> {
  const response = await fetch(`${API_URL}/mcp/tools/session/${sessionToken}`);
  
  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('SESSION_NOT_FOUND');
    }
    throw new Error('SESSION_ERROR');
  }
  
  return response.json();
}

/**
 * Yolcu bilgilerini güncelle
 */
export async function updateTravelers(
  sessionToken: string, 
  travelers: TravelerData[]
): Promise<{ success: boolean; status: string }> {
  const response = await fetch(`${API_URL}/mcp/tools/session/${sessionToken}/travelers`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ travelers }),
  });
  
  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('SESSION_EXPIRED');
    }
    throw new Error('UPDATE_FAILED');
  }
  
  return response.json();
}

/**
 * Promo kodu uygula
 */
export async function applyPromoCode(
  sessionToken: string, 
  promoCode: string
): Promise<PromoResult> {
  const response = await fetch(`${API_URL}/mcp/tools/session/${sessionToken}/promo`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ promo_code: promoCode }),
  });
  
  if (!response.ok) {
    if (response.status === 400) {
      throw new Error('INVALID_PROMO');
    }
    if (response.status === 404) {
      throw new Error('SESSION_EXPIRED');
    }
    throw new Error('PROMO_ERROR');
  }
  
  return response.json();
}

/**
 * Session'ı extend et
 */
export async function extendSession(sessionToken: string): Promise<{ success: boolean }> {
  const response = await fetch(`${API_URL}/mcp/tools/session/${sessionToken}/extend`, {
    method: 'POST',
  });
  
  if (!response.ok) {
    return { success: false };
  }
  
  return response.json();
}

// ============================================================
// PAYMENT API FUNCTIONS
// ============================================================

/**
 * Ödeme başlat
 * Başarılı olursa payment_url'e yönlendir
 */
export async function initiatePayment(sessionToken: string): Promise<InitiatePaymentResult> {
  const response = await fetch(`${API_URL}/mcp/tools/session/${sessionToken}/initiate-payment`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  
  const data = await response.json();
  
  if (!response.ok) {
    return {
      success: false,
      error_code: data.error_code || 'PAYMENT_ERROR',
      error_message: data.error_message || 'Ödeme başlatılamadı',
    };
  }
  
  return data;
}

/**
 * Rezervasyon bilgilerini getir (ödeme sonrası)
 */
export async function getBooking(reference: string): Promise<BookingData | null> {
  const response = await fetch(`${API_URL}/mcp/tools/booking/${reference}`);
  
  if (!response.ok) {
    return null;
  }
  
  const data = await response.json();
  return data.booking;
}

/**
 * Rezervasyonu referans numarası ile ara
 */
export async function searchBookingByReference(reference: string): Promise<BookingData | null> {
  const response = await fetch(`${API_URL}/bookings/reference/${reference}`);
  
  if (!response.ok) {
    return null;
  }
  
  const data = await response.json();
  return data.booking;
}

/**
 * E-posta ile rezervasyonları listele
 */
export async function getBookingsByEmail(email: string): Promise<BookingData[]> {
  const response = await fetch(`${API_URL}/bookings/email/${email}`);
  
  if (!response.ok) {
    return [];
  }
  
  const data = await response.json();
  return data.bookings || [];
}

// ============================================================
// HELPER FUNCTIONS
// ============================================================

export function getComfortLabel(code: string): string {
  const labels: Record<string, string> = {
    standard: 'Standart',
    comfort: 'Business',
    premier: 'Birinci Sınıf',
  };
  return labels[code] || 'Standart';
}

export function getComfortConfig(code: string): {
  label: string;
  labelTr: string;
  color: string;
  bgColor: string;
  icon: string;
} {
  const configs: Record<string, {
    label: string;
    labelTr: string;
    color: string;
    bgColor: string;
    icon: string;
  }> = {
    standard: { 
      label: 'Standard', 
      labelTr: 'Standart', 
      color: 'text-slate-700', 
      bgColor: 'bg-slate-100', 
      icon: '🎫' 
    },
    comfort: { 
      label: 'Business', 
      labelTr: 'Business', 
      color: 'text-amber-700', 
      bgColor: 'bg-amber-100', 
      icon: '💼' 
    },
    premier: { 
      label: 'First Class', 
      labelTr: 'Birinci Sınıf', 
      color: 'text-purple-700', 
      bgColor: 'bg-purple-100', 
      icon: '👑' 
    },
  };
  return configs[code] || configs.standard;
}

export function getOperatorName(code: string): string {
  const names: Record<string, string> = {
    EUROSTAR: 'Eurostar',
    SNCF: 'SNCF TGV',
    TGV: 'TGV',
    THALYS: 'Thalys',
    TRENITALIA: 'Trenitalia',
    FRECCIAROSSA: 'Frecciarossa',
    DBAHN: 'Deutsche Bahn',
    ICE: 'ICE',
    RENFE: 'Renfe',
    AVE: 'AVE',
  };
  return names[code?.toUpperCase()] || code;
}

export function isInternationalRoute(operator: string): boolean {
  const internationalOperators = ['EUROSTAR', 'THALYS', 'TGV LYRIA'];
  return internationalOperators.some(op => 
    operator?.toUpperCase().includes(op)
  );
}

export function formatPrice(amount: number, currency: string = 'EUR'): string {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: currency,
  }).format(amount);
}

export function formatTime(isoString: string): string {
  try {
    const date = new Date(isoString);
    return date.toLocaleTimeString('tr-TR', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  } catch {
    return '--:--';
  }
}

export function formatDate(isoString: string): string {
  try {
    const date = new Date(isoString);
    return date.toLocaleDateString('tr-TR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return '';
  }
}

export function formatShortDate(isoString: string): string {
  try {
    const date = new Date(isoString);
    return date.toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch {
    return '';
  }
}

export function formatRemainingTime(seconds: number): string {
  if (seconds <= 0) return 'Süre doldu';
  
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  
  if (minutes >= 1) {
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }
  return `${secs} saniye`;
}

export function getPaymentStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    pending: 'Bekliyor',
    processing: 'İşleniyor',
    completed: 'Tamamlandı',
    failed: 'Başarısız',
    refunded: 'İade Edildi',
    partially_refunded: 'Kısmi İade',
    cancelled: 'İptal Edildi',
  };
  return labels[status] || status;
}

export function getBookingStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    pending: 'Bekliyor',
    confirmed: 'Onaylandı',
    ticketed: 'Bilet Kesildi',
    cancelled: 'İptal Edildi',
    refunded: 'İade Edildi',
    partially_refunded: 'Kısmi İade',
    exchanged: 'Değiştirildi',
    expired: 'Süresi Doldu',
  };
  return labels[status] || status;
}

export function getStatusColor(status: string): { bg: string; text: string } {
  const colors: Record<string, { bg: string; text: string }> = {
    pending: { bg: 'bg-yellow-100', text: 'text-yellow-800' },
    processing: { bg: 'bg-blue-100', text: 'text-blue-800' },
    completed: { bg: 'bg-green-100', text: 'text-green-800' },
    confirmed: { bg: 'bg-green-100', text: 'text-green-800' },
    ticketed: { bg: 'bg-green-100', text: 'text-green-800' },
    failed: { bg: 'bg-red-100', text: 'text-red-800' },
    cancelled: { bg: 'bg-gray-100', text: 'text-gray-800' },
    refunded: { bg: 'bg-purple-100', text: 'text-purple-800' },
    partially_refunded: { bg: 'bg-orange-100', text: 'text-orange-800' },
    expired: { bg: 'bg-gray-100', text: 'text-gray-800' },
  };
  return colors[status] || { bg: 'bg-gray-100', text: 'text-gray-800' };
}
