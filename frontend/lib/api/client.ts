// API Base URL
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// ==================== INTERFACES ====================

export interface Station {
  code: string;
  name: string;
  city: string;
  country: string;
}

export interface Journey {
  id: string;
  origin: Station;
  destination: Station;
  departureTime: string;
  arrivalTime: string;
  duration: number;
  price: number;
  currency: string;
  operator: string;
  trainNumber: string;
  trainType: string;
  availableSeats: number;
  transfers: number;
  availableClasses: string[];
  operators: string[];
  trainTypes: string[];
  legs: JourneyLeg[];
  prices: {
    from?: number;
    economy?: number;
    business?: number;
    first?: number;
  };
}

export interface JourneyLeg {
  origin: Station;
  destination: Station;
  departureTime: string;
  arrivalTime: string;
  trainNumber: string;
  trainType: string;
  operator: string;
  platform?: string;
}

export interface JourneySearchResult {
  origin: Station;
  destination: Station;
  date: string;
  journeys: Journey[];
}

export interface JourneySearchParams {
  origin: string;
  destination: string;
  departureDate: string;
  passengers: {
    adults: number;
    children?: number;
  };
}

export interface Booking {
  id: number;
  customerName: string;
  customerEmail: string;
  fromStation: string;
  toStation: string;
  price: number;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'PAID';
  createdAt: string;
  departureDate?: string;
  departureTime?: string;
  arrivalTime?: string;
  trainNumber?: string;
  operator?: string;
  pnr?: string;
  priceBreakdown?: {
    basePrice: number;
    serviceFee: number;
    discount?: number;
    finalPrice: number;
  };
}

export interface CreateBookingParams {
  customerName: string;
  customerEmail: string;
  fromStation: string;
  toStation: string;
  price: number;
  promoCode?: string;
  journeyId?: string;
  departure_date?: string;
  departure_time?: string;
  arrival_time?: string;
  train_number?: string;
  operator?: string;
  passengers?: {
    adults: number;
    children?: number;
  };
}

export interface Campaign {
  id: number;
  code: string;
  name: string;
  discountType: 'FIXED' | 'PERCENT';
  discountValue: number;
  usageLimit: number;
  usedCount: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

export interface PriceCalculation {
  basePrice: number;
  serviceFee: number;
  discount: number;
  finalPrice: number;
  currency: string;
}

// ==================== STATION API ====================

export async function searchStations(query: string): Promise<Station[]> {
  try {
    const response = await fetch(`${API_URL}/era/stations/search?query=${encodeURIComponent(query)}`);
    
    if (!response.ok) {
      throw new Error('İstasyon araması başarısız');
    }
    
    const data = await response.json();
    return (data.stations || []).map((s: { id: string; name: string; city: string; country: string }) => ({
      code: s.id,
      name: s.name,
      city: s.city,
      country: s.country,
    }));
  } catch (error) {
    console.error('İstasyon arama hatası:', error);
    return getMockStations(query);
  }
}

function getMockStations(query: string): Station[] {
  const allStations: Station[] = [
    { code: 'FRPAR', name: 'Paris Gare du Nord', city: 'Paris', country: 'Fransa' },
    { code: 'FRPLY', name: 'Paris Gare de Lyon', city: 'Paris', country: 'Fransa' },
    { code: 'GBLON', name: 'London St Pancras', city: 'Londra', country: 'İngiltere' },
    { code: 'NLAMS', name: 'Amsterdam Centraal', city: 'Amsterdam', country: 'Hollanda' },
    { code: 'DEBER', name: 'Berlin Hauptbahnhof', city: 'Berlin', country: 'Almanya' },
    { code: 'DEMUC', name: 'München Hauptbahnhof', city: 'Münih', country: 'Almanya' },
    { code: 'BEBRX', name: 'Bruxelles-Midi', city: 'Brüksel', country: 'Belçika' },
    { code: 'CHZRH', name: 'Zürich HB', city: 'Zürih', country: 'İsviçre' },
    { code: 'ITROM', name: 'Roma Termini', city: 'Roma', country: 'İtalya' },
    { code: 'ITMIL', name: 'Milano Centrale', city: 'Milano', country: 'İtalya' },
    { code: 'ESMAD', name: 'Madrid Puerta de Atocha', city: 'Madrid', country: 'İspanya' },
    { code: 'ESBCN', name: 'Barcelona Sants', city: 'Barselona', country: 'İspanya' },
    { code: 'ATVIE', name: 'Wien Hauptbahnhof', city: 'Viyana', country: 'Avusturya' },
    { code: 'CZPRG', name: 'Praha hlavní nádraží', city: 'Prag', country: 'Çekya' },
  ];

  const lowerQuery = query.toLowerCase();
  return allStations.filter(
    station =>
      station.name.toLowerCase().includes(lowerQuery) ||
      station.city.toLowerCase().includes(lowerQuery) ||
      station.country.toLowerCase().includes(lowerQuery)
  );
}

// ==================== JOURNEY API ====================

export async function searchJourneys(params: JourneySearchParams): Promise<JourneySearchResult> {
  try {
    const response = await fetch(`${API_URL}/era/journeys/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        origin: params.origin,
        destination: params.destination,
        departureDate: params.departureDate,
        passengers: params.passengers,
      }),
    });

    if (!response.ok) {
      throw new Error('Sefer araması başarısız');
    }

    const data = await response.json();
    
    const originStation: Station = {
      code: data.origin?.id || params.origin,
      name: data.origin?.name || params.origin,
      city: data.origin?.city || '',
      country: data.origin?.country || '',
    };

    const destStation: Station = {
      code: data.destination?.id || params.destination,
      name: data.destination?.name || params.destination,
      city: data.destination?.city || '',
      country: data.destination?.country || '',
    };

    // Transform outboundJourneys to Journey[]
    const journeys: Journey[] = (data.outboundJourneys || []).map((j: {
      id: string;
      departureTime: string;
      arrivalTime: string;
      duration: number;
      transfers: number;
      trainTypes: string[];
      operators: string[];
      prices: { from?: number; economy?: number; business?: number; first?: number; currency?: string };
      availableClasses: string[];
      legs: Array<{
        origin: { id: string; name: string; city: string; country: string };
        destination: { id: string; name: string; city: string; country: string };
        departureTime: string;
        arrivalTime: string;
        trainNumber: string;
        trainType: string;
        operator: string;
      }>;
    }) => {
      const firstLeg = j.legs?.[0];
      
      // FİYAT: prices.from kullan, yoksa economy, yoksa 0
      const price = j.prices?.from || j.prices?.economy || j.prices?.business || 0;
      
      return {
        id: j.id,
        origin: originStation,
        destination: destStation,
        departureTime: j.departureTime,
        arrivalTime: j.arrivalTime,
        duration: j.duration,
        price: price,
        currency: j.prices?.currency || 'EUR',
        operator: j.operators?.[0] || firstLeg?.operator || 'Unknown',
        trainNumber: firstLeg?.trainNumber || '',
        trainType: j.trainTypes?.[0] || firstLeg?.trainType || '',
        availableSeats: 50,
        transfers: j.transfers,
        availableClasses: j.availableClasses || [],
        operators: j.operators || [],
        trainTypes: j.trainTypes || [],
        legs: (j.legs || []).map(leg => ({
          origin: {
            code: leg.origin?.id || '',
            name: leg.origin?.name || '',
            city: leg.origin?.city || '',
            country: leg.origin?.country || '',
          },
          destination: {
            code: leg.destination?.id || '',
            name: leg.destination?.name || '',
            city: leg.destination?.city || '',
            country: leg.destination?.country || '',
          },
          departureTime: leg.departureTime,
          arrivalTime: leg.arrivalTime,
          trainNumber: leg.trainNumber,
          trainType: leg.trainType,
          operator: leg.operator,
        })),
        prices: j.prices || {},
      };
    });

    return {
      origin: originStation,
      destination: destStation,
      date: params.departureDate,
      journeys,
    };
  } catch (error) {
    console.error('Sefer arama hatası:', error);
    return getMockJourneys(params);
  }
}

function getMockJourneys(params: JourneySearchParams): JourneySearchResult {
  const originStation = getMockStations(params.origin)[0] || {
    code: params.origin,
    name: params.origin,
    city: params.origin,
    country: '',
  };

  const destStation = getMockStations(params.destination)[0] || {
    code: params.destination,
    name: params.destination,
    city: params.destination,
    country: '',
  };

  const mockJourneys: Journey[] = [
    {
      id: 'j1',
      origin: originStation,
      destination: destStation,
      departureTime: '2026-01-20T08:30:00',
      arrivalTime: '2026-01-20T11:45:00',
      duration: 195,
      price: 94,
      currency: 'EUR',
      operator: 'Thalys',
      trainNumber: 'TH9012',
      trainType: 'High-Speed',
      availableSeats: 45,
      transfers: 0,
      availableClasses: ['economy', 'business'],
      operators: ['Thalys'],
      trainTypes: ['High-Speed'],
      legs: [],
      prices: { from: 94 },
    },
  ];

  return {
    origin: originStation,
    destination: destStation,
    date: params.departureDate,
    journeys: mockJourneys,
  };
}

// ==================== BOOKING API ====================

export async function createBooking(params: CreateBookingParams): Promise<Booking> {
  const response = await fetch(`${API_URL}/bookings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Rezervasyon oluşturulamadı');
  }

  return await response.json();
}

export async function getBooking(id: number): Promise<Booking> {
  const response = await fetch(`${API_URL}/bookings/${id}`);

  if (!response.ok) {
    throw new Error('Rezervasyon bulunamadı');
  }

  return await response.json();
}

export async function getBookings(): Promise<Booking[]> {
  const response = await fetch(`${API_URL}/bookings`);

  if (!response.ok) {
    throw new Error('Rezervasyonlar yüklenemedi');
  }

  return await response.json();
}

// ==================== CAMPAIGN API ====================

export async function validatePromoCode(code: string): Promise<Campaign | null> {
  try {
    const response = await fetch(`${API_URL}/campaigns/validate/${code}`);

    if (!response.ok) {
      return null;
    }

    return await response.json();
  } catch {
    return null;
  }
}

export async function getCampaigns(): Promise<Campaign[]> {
  const response = await fetch(`${API_URL}/campaigns`);

  if (!response.ok) {
    throw new Error('Kampanyalar yüklenemedi');
  }

  return await response.json();
}

// ==================== PRICING API ====================

export async function calculatePrice(
  basePrice: number,
  promoCode?: string
): Promise<PriceCalculation> {
  const params = new URLSearchParams({
    amount: basePrice.toString(),
  });

  if (promoCode) {
    params.append('promoCode', promoCode);
  }

  const response = await fetch(`${API_URL}/pricing/calculate?${params}`);

  if (!response.ok) {
    throw new Error('Fiyat hesaplanamadı');
  }

  return await response.json();
}

// ==================== PAYMENT API ====================

export async function initiatePayment(params: {
  orderId: string;
  amount: number;
  customerEmail: string;
  customerName: string;
}): Promise<{ success: boolean; redirectUrl?: string; message?: string }> {
  const response = await fetch(`${API_URL}/payment/initiate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  });

  return await response.json();
}

export async function getPaymentStatus(orderId: string): Promise<{
  status: string;
  booking?: Booking;
}> {
  const response = await fetch(`${API_URL}/payment/status/${orderId}`);

  if (!response.ok) {
    throw new Error('Ödeme durumu alınamadı');
  }

  return await response.json();
}

// ==================== MY TRIPS API ====================

export async function requestMagicLink(email: string): Promise<{ success: boolean; message: string }> {
  const response = await fetch(`${API_URL}/my-trips/request-link`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email }),
  });

  return await response.json();
}

export async function verifyMagicLink(token: string): Promise<Booking[]> {
  const response = await fetch(`${API_URL}/my-trips/verify?token=${token}`);

  if (!response.ok) {
    throw new Error('Token geçersiz veya süresi dolmuş');
  }

  return await response.json();
}

export async function getBookingByPnr(pnr: string): Promise<Booking> {
  const response = await fetch(`${API_URL}/my-trips/order/${pnr}`);

  if (!response.ok) {
    throw new Error('Bilet bulunamadı');
  }

  return await response.json();
}

// ==================== HELPER FUNCTIONS ====================

export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}s ${mins}dk`;
}

export function formatTime(dateTimeString: string): string {
  const date = new Date(dateTimeString);
  return date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
}

export function formatPrice(price: number, currency: string = 'EUR'): string {
  return `€${price.toFixed(2)}`;
}
// ==================== CAMPAIGN API EXTENDED ====================

export const campaignApi = {
  getAll: async (): Promise<Campaign[]> => {
    const response = await fetch(`${API_URL}/campaigns`);
    if (!response.ok) throw new Error('Kampanyalar yüklenemedi');
    return response.json();
  },

  getById: async (id: number): Promise<Campaign> => {
    const response = await fetch(`${API_URL}/campaigns/${id}`);
    if (!response.ok) throw new Error('Kampanya bulunamadı');
    return response.json();
  },

  create: async (data: Partial<Campaign>): Promise<Campaign> => {
    const response = await fetch(`${API_URL}/campaigns`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Kampanya oluşturulamadı');
    return response.json();
  },

  update: async (id: number, data: Partial<Campaign>): Promise<Campaign> => {
    const response = await fetch(`${API_URL}/campaigns/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Kampanya güncellenemedi');
    return response.json();
  },

  delete: async (id: number): Promise<void> => {
    const response = await fetch(`${API_URL}/campaigns/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Kampanya silinemedi');
  },
};

// ==================== BOOKING API EXTENDED ====================

export const bookingApi = {
  getAll: async (): Promise<Booking[]> => {
    const response = await fetch(`${API_URL}/bookings`);
    if (!response.ok) throw new Error('Rezervasyonlar yüklenemedi');
    return response.json();
  },

  getById: async (id: number): Promise<Booking> => {
    const response = await fetch(`${API_URL}/bookings/${id}`);
    if (!response.ok) throw new Error('Rezervasyon bulunamadı');
    return response.json();
  },

  create: async (data: CreateBookingParams): Promise<Booking> => {
    const response = await fetch(`${API_URL}/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Rezervasyon oluşturulamadı');
    return response.json();
  },

  update: async (id: number, data: Partial<Booking>): Promise<Booking> => {
    const response = await fetch(`${API_URL}/bookings/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Rezervasyon güncellenemedi');
    return response.json();
  },
};

// ==================== CREATE CAMPAIGN DTO ====================

export interface CreateCampaignDto {
  name: string;
  code?: string;
  description?: string;
  type?: string;
  discountType: 'PERCENTAGE' | 'FIXED' | 'PERCENT';
  discountValue: number;
  discountCurrency?: string;
  discountTarget?: string;
  maxDiscountAmount?: number;
  minOrderAmount?: number;
  stackable?: boolean;
  priority?: number;
  usageLimit?: number;
  usagePerUser?: number;
  refundable?: boolean;
  startDate?: string;
  endDate?: string;
  active?: boolean;
}