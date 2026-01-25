// ============================================================
// ERA API Client for Frontend
// EuroTrain B2C Platform
// ============================================================

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// ============================================================
// ERA TYPES (Frontend'de kullanılacak)
// ============================================================

export interface EraPlace {
  id: string;
  type: 'city' | 'station';
  code: string;
  label: string;
  localLabel?: string;
  country?: {
    code: string;
    label: string;
    localLabel?: string;
  };
  timezone?: string;
}

export interface EraPrice {
  amount: number;
  currency: string;
}

export interface EraSegment {
  id: string;
  sequenceNumber: number;
  origin: EraPlace;
  destination: EraPlace;
  departure: string;
  arrival: string;
  duration: string;
  operatingCarrier?: string;
  marketingCarrier?: string;
  vehicle?: {
    type: string;
    reference?: string;
    code?: string;
  };
}

export interface EraLegSolution {
  id: string;
  origin: EraPlace;
  destination: EraPlace;
  departure: string;
  arrival: string;
  duration: string;
  segments: EraSegment[];
}

export interface EraFlexibility {
  label?: string;
  code?: string;
  refundable?: boolean;
  exchangeable?: boolean;
}

export interface EraOffer {
  id: string;
  legSolution: string;
  offerLocation: string;
  products?: string[];
  prices?: {
    total?: EraPrice;
  };
  comfortCategory?: 'standard' | 'comfort' | 'premier';
  flexibility?: EraFlexibility;
  ticketingOptions?: Array<{
    code: string;
    label?: string;
  }>;
}

export interface EraProduct {
  id: string;
  code?: string;
  type: string;
  label?: string;
  supplier?: string;
  marketingCarrier?: string;
  segment?: string;
  prices?: {
    total?: EraPrice;
  };
  comfortCategory?: string;
  flexibility?: EraFlexibility;
}

export interface EraTraveler {
  id: string;
  type: 'ADULT' | 'YOUTH' | 'CHILD' | 'INFANT' | 'SENIOR';
}

export interface EraLeg {
  origin: EraPlace;
  destination: EraPlace;
  departure: string;
  solutions: EraLegSolution[];
}

export interface EraSearchResponse {
  id: string;
  success?: boolean;
  searchId?: string;
  pointOfSale?: string;
  origin?: EraPlace;
  destination?: EraPlace;
  offersCount?: number;
  legs: EraLeg[];
  travelers: EraTraveler[];
  offers: EraOffer[];
  products: EraProduct[];
}

export interface EraBooking {
  id: string;
  reference?: string;
  status: 'CREATED' | 'PREBOOKED' | 'INVOICED' | 'REFUNDED' | 'CANCELLED';
  items: EraBookingItem[];
  travelers?: EraBookingTraveler[];
  prices?: {
    total?: EraPrice;
  };
  expiresAt?: string;
  createdAt?: string;
}

export interface EraBookingItem {
  id: string;
  reference?: string;
  status?: string;
  pnr?: string;
}

export interface EraBookingTraveler {
  id: string;
  type: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
}

// ============================================================
// SEARCH PARAMS (Basitleştirilmiş)
// ============================================================

export interface SearchParams {
  origin: string;
  destination: string;
  departureDate: string;
  adults?: number;
  children?: number;
  youths?: number;
  seniors?: number;
}

// ============================================================
// ERA API FUNCTIONS
// ============================================================

/**
 * İstasyon/şehir autocomplete araması
 */
export async function searchPlaces(
  query: string,
  options?: { type?: 'city' | 'station'; size?: number }
): Promise<EraPlace[]> {
  try {
    const params = new URLSearchParams({ query });
    if (options?.type) params.set('type', options.type);
    if (options?.size) params.set('size', options.size.toString());

    const response = await fetch(`${API_URL}/era/places/autocomplete?${params}`);
    
    if (!response.ok) {
      throw new Error('İstasyon araması başarısız');
    }
    
    const data = await response.json();
    return data.places || [];
  } catch (error) {
    console.error('İstasyon arama hatası:', error);
    return [];
  }
}

/**
 * Place code ile yer getir
 */
export async function getPlaceByCode(code: string): Promise<EraPlace | null> {
  try {
    const response = await fetch(`${API_URL}/era/places/${code}`);
    
    if (!response.ok) {
      return null;
    }
    
    const data = await response.json();
    return data.place || null;
  } catch (error) {
    console.error('Place getirme hatası:', error);
    return null;
  }
}

/**
 * Sefer araması
 */
export async function searchJourneys(params: SearchParams): Promise<EraSearchResponse> {
  const response = await fetch(`${API_URL}/era/search`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      origin: params.origin,
      destination: params.destination,
      departureDate: params.departureDate,
      adults: params.adults || 1,
      children: params.children || 0,
      youths: params.youths || 0,
      seniors: params.seniors || 0,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Sefer araması başarısız');
  }

  return await response.json();
}

/**
 * Search ID ile sonuçları getir
 */
export async function getSearchResults(searchId: string): Promise<EraSearchResponse> {
  const response = await fetch(`${API_URL}/era/search/${searchId}`);

  if (!response.ok) {
    throw new Error('Arama sonuçları bulunamadı');
  }

  return await response.json();
}

/**
 * Sonraki/önceki sayfa (pagination)
 */
export async function getAdditionalOffers(
  searchId: string,
  page: 'next' | 'previous'
): Promise<EraSearchResponse> {
  const response = await fetch(`${API_URL}/era/search/${searchId}?page=${page}`, {
    method: 'POST',
  });

  if (!response.ok) {
    throw new Error('Ek sonuçlar yüklenemedi');
  }

  return await response.json();
}

/**
 * Booking oluştur
 */
export async function createBooking(offerLocations: string[]): Promise<EraBooking> {
  const response = await fetch(`${API_URL}/era/bookings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ offerLocations }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Rezervasyon oluşturulamadı');
  }

  const data = await response.json();
  return data.booking;
}

/**
 * Booking getir
 */
export async function getBooking(bookingId: string): Promise<EraBooking> {
  const response = await fetch(`${API_URL}/era/bookings/${bookingId}`);

  if (!response.ok) {
    throw new Error('Rezervasyon bulunamadı');
  }

  const data = await response.json();
  return data.booking;
}

/**
 * Yolcu bilgilerini güncelle
 */
export async function updateTravelers(
  bookingId: string,
  itemId: string,
  travelers: Array<{
    id: string;
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
    dateOfBirth?: string;
  }>
): Promise<EraBooking> {
  const response = await fetch(
    `${API_URL}/era/bookings/${bookingId}/items/${itemId}/travelers`,
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ travelers }),
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Yolcu bilgileri güncellenemedi');
  }

  const data = await response.json();
  return data.booking;
}

/**
 * Ön rezervasyon (prebook)
 */
export async function prebookBooking(bookingId: string): Promise<EraBooking> {
  const response = await fetch(`${API_URL}/era/bookings/${bookingId}/prebook`, {
    method: 'POST',
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Ön rezervasyon başarısız');
  }

  const data = await response.json();
  return data.booking;
}

/**
 * Rezervasyonu onayla (confirm)
 */
export async function confirmBooking(bookingId: string): Promise<EraBooking> {
  const response = await fetch(`${API_URL}/era/bookings/${bookingId}/confirm`, {
    method: 'POST',
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Rezervasyon onaylanamadı');
  }

  const data = await response.json();
  return data.booking;
}

/**
 * Bilet yazdır
 */
export async function printTickets(
  bookingId: string,
  format: 'PDF' | 'PKPASS' = 'PDF'
): Promise<{ tickets: Array<{ id: string; url?: string; format: string }> }> {
  const response = await fetch(`${API_URL}/era/bookings/${bookingId}/print`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ format }),
  });

  if (!response.ok) {
    throw new Error('Bilet yazdırılamadı');
  }

  return await response.json();
}

// ============================================================
// HELPER FUNCTIONS
// ============================================================

/**
 * ISO 8601 duration'ı dakikaya çevir (PT2H30M → 150)
 */
export function parseDuration(isoDuration: string): number {
  const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
  if (!match) return 0;
  
  const hours = parseInt(match[1] || '0');
  const minutes = parseInt(match[2] || '0');
  
  return hours * 60 + minutes;
}

/**
 * Dakikayı okunabilir formata çevir (150 → "2s 30dk")
 */
export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  if (hours === 0) return `${mins}dk`;
  if (mins === 0) return `${hours}s`;
  return `${hours}s ${mins}dk`;
}

/**
 * ISO 8601 duration'ı okunabilir formata çevir
 */
export function formatIsoDuration(isoDuration: string): string {
  return formatDuration(parseDuration(isoDuration));
}

/**
 * Tarihi formatla
 */
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

/**
 * Tarihi tam formatla
 */
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

/**
 * Fiyatı formatla
 */
export function formatPrice(amount: number, currency: string = 'EUR'): string {
  const symbols: Record<string, string> = {
    EUR: '€',
    USD: '$',
    GBP: '£',
    TRY: '₺',
  };
  
  const symbol = symbols[currency] || currency;
  return `${symbol}${amount.toFixed(2)}`;
}

/**
 * Offer'dan journey bilgilerini çıkar (UI için)
 */
export function getJourneyFromOffer(
  offer: EraOffer,
  searchResponse: EraSearchResponse
): {
  id: string;
  offerLocation: string;
  origin: EraPlace;
  destination: EraPlace;
  departure: string;
  arrival: string;
  duration: string;
  durationMinutes: number;
  price: number;
  currency: string;
  carrier: string;
  trainNumber: string;
  trainType: string;
  comfortCategory: string;
  flexibility: EraFlexibility | undefined;
  segments: EraSegment[];
  isRefundable: boolean;
  isExchangeable: boolean;
} | null {
  // LegSolution'ı bul
  const legSolution = searchResponse.legs[0]?.solutions.find(
    s => s.id === offer.legSolution
  );
  
  if (!legSolution) return null;

  // Product'ı bul
  const productId = offer.products?.[0];
  const product = searchResponse.products.find(p => p.id === productId);

  const segment = legSolution.segments[0];
  const durationMinutes = parseDuration(legSolution.duration);

  return {
    id: offer.id,
    offerLocation: offer.offerLocation,
    origin: legSolution.origin,
    destination: legSolution.destination,
    departure: legSolution.departure,
    arrival: legSolution.arrival,
    duration: legSolution.duration,
    durationMinutes,
    price: offer.prices?.total?.amount || 0,
    currency: offer.prices?.total?.currency || 'EUR',
    carrier: segment?.marketingCarrier || segment?.operatingCarrier || 'Unknown',
    trainNumber: segment?.vehicle?.reference || '',
    trainType: segment?.vehicle?.type || '',
    comfortCategory: offer.comfortCategory || 'standard',
    flexibility: offer.flexibility,
    segments: legSolution.segments,
    isRefundable: offer.flexibility?.refundable || false,
    isExchangeable: offer.flexibility?.exchangeable || false,
  };
}

/**
 * Search response'dan tüm journey'leri çıkar
 */
export function getJourneysFromSearch(searchResponse: EraSearchResponse) {
  return searchResponse.offers
    .map(offer => getJourneyFromOffer(offer, searchResponse))
    .filter((j): j is NonNullable<typeof j> => j !== null)
    .sort((a, b) => new Date(a.departure).getTime() - new Date(b.departure).getTime());
}

// ============================================================
// BACKWARD COMPATIBILITY (Eski interface'lerle uyum)
// ============================================================

export interface Station {
  code: string;
  name: string;
  city: string;
  country: string;
}

export interface Journey {
  id: string;
  offerLocation: string;
  origin: Station;
  destination: Station;
  departure: string;
  arrival: string;
  departureTime: string;
  arrivalTime: string;
  duration: string;
  durationMinutes: number;
  price: {
    amount: number;
    currency: string;
  };
  operator: string;
  operatorName: string; // Added for UI display
  trainNumber: string;
  trainType: string;
  comfortCategory: 'standard' | 'comfort' | 'premier';
  flexibility?: EraFlexibility;
  segments: EraSegment[];
  isRefundable: boolean;
  isExchangeable: boolean;
}

/**
 * EraPlace'i Station'a çevir (backward compat)
 */
export function placeToStation(place: EraPlace): Station {
  return {
    code: place.code,
    name: place.label,
    city: place.localLabel || place.label,
    country: place.country?.label || '',
  };
}

/**
 * Carrier code'dan okunabilir isim al
 */
function getOperatorName(carrierCode: string): string {
  const operatorNames: Record<string, string> = {
    'EUROSTAR': 'Eurostar',
    'SNCF': 'SNCF TGV',
    'TGV': 'TGV',
    'THALYS': 'Thalys',
    'TRENITALIA': 'Trenitalia',
    'FRECCIAROSSA': 'Frecciarossa',
    'DBAHN': 'Deutsche Bahn',
    'ICE': 'ICE',
    'RENFE': 'Renfe',
    'AVE': 'AVE',
    'SBB': 'SBB',
    'OBB': 'ÖBB',
    'NS': 'NS International',
  };
  
  return operatorNames[carrierCode.toUpperCase()] || carrierCode;
}

/**
 * Search response'u eski format Journey[]'e çevir
 */
export function toJourneyArray(searchResponse: EraSearchResponse): Journey[] {
  const journeys = getJourneysFromSearch(searchResponse);
  
  return journeys.map(j => ({
    id: j.id,
    offerLocation: j.offerLocation,
    origin: placeToStation(j.origin),
    destination: placeToStation(j.destination),
    departure: j.departure,
    arrival: j.arrival,
    departureTime: j.departure,
    arrivalTime: j.arrival,
    duration: j.duration,
    durationMinutes: j.durationMinutes,
    price: {
      amount: j.price,
      currency: j.currency,
    },
    operator: j.carrier,
    operatorName: getOperatorName(j.carrier),
    trainNumber: j.trainNumber,
    trainType: j.trainType,
    comfortCategory: j.comfortCategory as 'standard' | 'comfort' | 'premier',
    flexibility: j.flexibility,
    segments: j.segments,
    isRefundable: j.isRefundable,
    isExchangeable: j.isExchangeable,
  }));
}
