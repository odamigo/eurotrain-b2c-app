import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import {
  EraPlace,
  EraSearchRequest,
  EraSearchResponse,
  EraOffer,
  EraLegSolution,
  EraSegment,
  EraProduct,
  EraBooking,
  EraBookingStatus,
  EraBookingTravelerInput,
  EraPrebookResponse,
  EraConfirmResponse,
  EraPrintResponse,
  EraRefundQuotation,
  EraRefundResponse,
  EraExchangeSearchResponse,
  EraExchangeQuotation,
  EraExchangeResponse,
  EraLegRequest,
  EraTravelerType,
} from '../interfaces/era-api.types';

@Injectable()
export class EraMockService {
  private readonly logger = new Logger(EraMockService.name);
  
  // In-memory storage for mock bookings
  private mockBookings: Map<string, EraBooking> = new Map();
  private mockSearches: Map<string, EraSearchResponse> = new Map();

  // ============================================================
  // MOCK PLACES DATA
  // ============================================================

  private readonly mockPlaces: EraPlace[] = [
    // France
    { id: 'FRPAR', type: 'city', code: 'FRPAR', label: 'Paris', localLabel: 'Paris', country: { code: 'FR', label: 'France', localLabel: 'France' }, timezone: 'Europe/Paris' },
    { id: 'FRPLY', type: 'station', code: 'FRPLY', label: 'Paris Gare de Lyon', localLabel: 'Paris Gare de Lyon', country: { code: 'FR', label: 'France', localLabel: 'France' }, timezone: 'Europe/Paris' },
    { id: 'FRPNO', type: 'station', code: 'FRPNO', label: 'Paris Gare du Nord', localLabel: 'Paris Gare du Nord', country: { code: 'FR', label: 'France', localLabel: 'France' }, timezone: 'Europe/Paris' },
    { id: 'FRLYS', type: 'city', code: 'FRLYS', label: 'Lyon', localLabel: 'Lyon', country: { code: 'FR', label: 'France', localLabel: 'France' }, timezone: 'Europe/Paris' },
    { id: 'FRMRS', type: 'city', code: 'FRMRS', label: 'Marseille', localLabel: 'Marseille', country: { code: 'FR', label: 'France', localLabel: 'France' }, timezone: 'Europe/Paris' },
    { id: 'FRNIC', type: 'city', code: 'FRNIC', label: 'Nice', localLabel: 'Nice', country: { code: 'FR', label: 'France', localLabel: 'France' }, timezone: 'Europe/Paris' },
    
    // UK
    { id: 'GBLON', type: 'city', code: 'GBLON', label: 'London', localLabel: 'London', country: { code: 'GB', label: 'United Kingdom', localLabel: 'United Kingdom' }, timezone: 'Europe/London' },
    { id: 'GBSTP', type: 'station', code: 'GBSTP', label: 'London St Pancras', localLabel: 'London St Pancras', country: { code: 'GB', label: 'United Kingdom', localLabel: 'United Kingdom' }, timezone: 'Europe/London' },
    { id: 'GBEDB', type: 'city', code: 'GBEDB', label: 'Edinburgh', localLabel: 'Edinburgh', country: { code: 'GB', label: 'United Kingdom', localLabel: 'United Kingdom' }, timezone: 'Europe/London' },
    
    // Germany
    { id: 'DEBER', type: 'city', code: 'DEBER', label: 'Berlin', localLabel: 'Berlin', country: { code: 'DE', label: 'Germany', localLabel: 'Deutschland' }, timezone: 'Europe/Berlin' },
    { id: 'DEMUC', type: 'city', code: 'DEMUC', label: 'Munich', localLabel: 'München', country: { code: 'DE', label: 'Germany', localLabel: 'Deutschland' }, timezone: 'Europe/Berlin' },
    { id: 'DEFRA', type: 'city', code: 'DEFRA', label: 'Frankfurt', localLabel: 'Frankfurt am Main', country: { code: 'DE', label: 'Germany', localLabel: 'Deutschland' }, timezone: 'Europe/Berlin' },
    
    // Italy
    { id: 'ITROM', type: 'city', code: 'ITROM', label: 'Rome', localLabel: 'Roma', country: { code: 'IT', label: 'Italy', localLabel: 'Italia' }, timezone: 'Europe/Rome' },
    { id: 'ITMIL', type: 'city', code: 'ITMIL', label: 'Milan', localLabel: 'Milano', country: { code: 'IT', label: 'Italy', localLabel: 'Italia' }, timezone: 'Europe/Rome' },
    { id: 'ITFLO', type: 'city', code: 'ITFLO', label: 'Florence', localLabel: 'Firenze', country: { code: 'IT', label: 'Italy', localLabel: 'Italia' }, timezone: 'Europe/Rome' },
    { id: 'ITVEN', type: 'city', code: 'ITVEN', label: 'Venice', localLabel: 'Venezia', country: { code: 'IT', label: 'Italy', localLabel: 'Italia' }, timezone: 'Europe/Rome' },
    
    // Spain
    { id: 'ESMAD', type: 'city', code: 'ESMAD', label: 'Madrid', localLabel: 'Madrid', country: { code: 'ES', label: 'Spain', localLabel: 'España' }, timezone: 'Europe/Madrid' },
    { id: 'ESBAR', type: 'city', code: 'ESBAR', label: 'Barcelona', localLabel: 'Barcelona', country: { code: 'ES', label: 'Spain', localLabel: 'España' }, timezone: 'Europe/Madrid' },
    
    // Netherlands
    { id: 'NLAMS', type: 'city', code: 'NLAMS', label: 'Amsterdam', localLabel: 'Amsterdam', country: { code: 'NL', label: 'Netherlands', localLabel: 'Nederland' }, timezone: 'Europe/Amsterdam' },
    
    // Belgium
    { id: 'BEBRU', type: 'city', code: 'BEBRU', label: 'Brussels', localLabel: 'Bruxelles', country: { code: 'BE', label: 'Belgium', localLabel: 'Belgique' }, timezone: 'Europe/Brussels' },
    
    // Switzerland
    { id: 'CHZRH', type: 'city', code: 'CHZRH', label: 'Zurich', localLabel: 'Zürich', country: { code: 'CH', label: 'Switzerland', localLabel: 'Schweiz' }, timezone: 'Europe/Zurich' },
    { id: 'CHGVA', type: 'city', code: 'CHGVA', label: 'Geneva', localLabel: 'Genève', country: { code: 'CH', label: 'Switzerland', localLabel: 'Suisse' }, timezone: 'Europe/Zurich' },
    
    // Austria
    { id: 'ATVIE', type: 'city', code: 'ATVIE', label: 'Vienna', localLabel: 'Wien', country: { code: 'AT', label: 'Austria', localLabel: 'Österreich' }, timezone: 'Europe/Vienna' },
  ];

  // Route configurations for realistic mock data
  private readonly routeConfigs: Record<string, { duration: number; price: number; carrier: string; trainType: string }> = {
    'FRPAR-GBLON': { duration: 136, price: 89, carrier: 'EUROSTAR', trainType: 'High-Speed' },
    'FRPAR-NLAMS': { duration: 195, price: 89, carrier: 'THALYS', trainType: 'High-Speed' },
    'FRPAR-BEBRU': { duration: 82, price: 69, carrier: 'THALYS', trainType: 'High-Speed' },
    'FRPAR-FRLYS': { duration: 120, price: 79, carrier: 'SNCF', trainType: 'High-Speed' },
    'FRPAR-FRMRS': { duration: 180, price: 89, carrier: 'SNCF', trainType: 'High-Speed' },
    'FRPAR-ESBAR': { duration: 390, price: 109, carrier: 'SNCF', trainType: 'High-Speed' },
    'ITROM-ITMIL': { duration: 175, price: 69, carrier: 'TRENITALIA', trainType: 'High-Speed' },
    'ITROM-ITFLO': { duration: 95, price: 49, carrier: 'TRENITALIA', trainType: 'High-Speed' },
    'DEBER-DEMUC': { duration: 240, price: 89, carrier: 'DBAHN', trainType: 'High-Speed' },
    'ESMAD-ESBAR': { duration: 155, price: 69, carrier: 'RENFE', trainType: 'High-Speed' },
    'CHZRH-CHGVA': { duration: 170, price: 79, carrier: 'SBB', trainType: 'Inter-City' },
  };

  // ============================================================
  // PLACES
  // ============================================================

  searchPlaces(query: string, limit: number = 10, type?: 'city' | 'station'): EraPlace[] {
    const searchTerm = query.toLowerCase();
    
    let results = this.mockPlaces.filter(place =>
      place.label.toLowerCase().includes(searchTerm) ||
      place.localLabel?.toLowerCase().includes(searchTerm) ||
      place.code.toLowerCase().includes(searchTerm)
    );

    if (type) {
      results = results.filter(p => p.type === type);
    }

    return results.slice(0, limit);
  }

  getAllPlaces(): EraPlace[] {
    return [...this.mockPlaces];
  }

  getPlaceByCode(code: string): EraPlace | undefined {
    return this.mockPlaces.find(p => p.code === code);
  }

  // ============================================================
  // SEARCH
  // ============================================================

  searchJourneys(request: EraSearchRequest): EraSearchResponse {
    const searchId = uuidv4();
    const leg = request.legs[0];
    
    const origin = this.getPlaceByCode(leg.departure);
    const destination = this.getPlaceByCode(leg.arrival);

    if (!origin || !destination) {
      throw new BadRequestException('Invalid origin or destination');
    }

    // Get route config or use default
    const routeKey = `${leg.departure}-${leg.arrival}`;
    const reverseKey = `${leg.arrival}-${leg.departure}`;
    const config = this.routeConfigs[routeKey] || this.routeConfigs[reverseKey] || {
      duration: 180,
      price: 79,
      carrier: 'UNKNOWN',
      trainType: 'Inter-City',
    };

    // Generate multiple offers at different times
    const departureTimes = ['06:30', '08:15', '10:30', '12:45', '14:30', '16:15', '18:30', '20:00'];
    const offers: EraOffer[] = [];
    const products: EraProduct[] = [];
    const legSolutions: EraLegSolution[] = [];

    const departureDate = leg.departureTime.split('T')[0];

    departureTimes.forEach((time, index) => {
      const legSolutionId = uuidv4();
      const offerId = uuidv4();
      const productId = uuidv4();

      // Calculate arrival time
      const [hours, minutes] = time.split(':').map(Number);
      const departureMinutes = hours * 60 + minutes;
      const arrivalMinutes = departureMinutes + config.duration;
      const arrivalHours = Math.floor(arrivalMinutes / 60) % 24;
      const arrivalMins = arrivalMinutes % 60;
      const arrivalTime = `${arrivalHours.toString().padStart(2, '0')}:${arrivalMins.toString().padStart(2, '0')}`;

      // Price variation
      const priceVariation = 0.8 + Math.random() * 0.4; // 80% - 120%
      const price = Math.round(config.price * priceVariation);

      // Create segment
      const segment: EraSegment = {
        id: uuidv4(),
        sequenceNumber: 1,
        origin,
        destination,
        departure: `${departureDate}T${time}:00`,
        arrival: `${departureDate}T${arrivalTime}:00`,
        duration: `PT${Math.floor(config.duration / 60)}H${config.duration % 60}M`,
        operatingCarrier: config.carrier,
        marketingCarrier: config.carrier,
        supplier: config.carrier,
        vehicle: {
          type: config.trainType as any,
          reference: `${config.carrier}${1000 + index}`,
          code: config.carrier,
        },
      };

      // Create leg solution
      const legSolution: EraLegSolution = {
        id: legSolutionId,
        origin,
        destination,
        departure: segment.departure,
        arrival: segment.arrival,
        duration: segment.duration,
        segments: [segment],
      };
      legSolutions.push(legSolution);

      // Create product
      const product: EraProduct = {
        id: productId,
        code: `${config.carrier}_STANDARD`,
        type: 'point-to-point',
        label: 'Standard Class',
        supplier: config.carrier,
        marketingCarrier: config.carrier,
        segment: segment.id,
        prices: {
          total: { amount: price, currency: 'EUR' },
        },
        comfortCategory: 'standard',
        flexibility: {
          label: 'Semi-Flexible',
          code: 'SEMI_FLEX',
          refundable: true,
          exchangeable: true,
        },
      };
      products.push(product);

      // Create offer
      const offer: EraOffer = {
        id: offerId,
        legSolution: legSolutionId,
        offerLocation: `offer:${offerId}`,
        products: [productId],
        prices: {
          total: { amount: price * request.travelers.length, currency: 'EUR' },
        },
        comfortCategory: 'standard',
        flexibility: product.flexibility,
        ticketingOptions: [{ code: 'PAH', label: 'Print at Home' }],
      };
      offers.push(offer);
    });

    const response: EraSearchResponse = {
      id: searchId,
      pointOfSale: 'EUROTRAIN',
      legs: [{
        origin,
        destination,
        departure: leg.departureTime,
        solutions: legSolutions,
      }],
      travelers: request.travelers.map((t, i) => ({
        id: uuidv4(),
        type: t.type,
        dateOfBirth: t.dateOfBirth,
      })),
      offers,
      products,
    };

    // Cache for pagination
    this.mockSearches.set(searchId, response);

    return response;
  }

  getAdditionalOffers(searchId: string, page: 'next' | 'previous'): EraSearchResponse {
    const cached = this.mockSearches.get(searchId);
    if (!cached) {
      throw new NotFoundException('Search not found or expired');
    }
    // For mock, return same data (in real API, different times would be returned)
    return cached;
  }

  getOfferById(searchId: string, offerId: string): EraOffer | null {
    const cached = this.mockSearches.get(searchId);
    if (!cached) return null;
    return cached.offers?.find(o => o.id === offerId) || null;
  }

  // ============================================================
  // BOOKING
  // ============================================================

  createBooking(offerLocations: string[]): EraBooking {
    const bookingId = uuidv4();
    const reference = `ET${Date.now().toString().slice(-8)}`;

    const booking: EraBooking = {
      id: bookingId,
      reference,
      status: 'CREATED',
      items: offerLocations.map((loc, index) => ({
        id: uuidv4(),
        reference: `${reference}-${index + 1}`,
        status: 'CREATED',
      })),
      travelers: [],
      prices: {
        total: { amount: 0, currency: 'EUR' },
      },
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 min
    };

    this.mockBookings.set(bookingId, booking);
    this.logger.debug(`Mock booking created: ${bookingId}`);

    return booking;
  }

  getBooking(bookingId: string): EraBooking | null {
    return this.mockBookings.get(bookingId) || null;
  }

  updateTravelers(
    bookingId: string, 
    itemId: string, 
    travelers: EraBookingTravelerInput[]
  ): EraBooking {
    const booking = this.mockBookings.get(bookingId);
    if (!booking) throw new NotFoundException('Booking not found');

    booking.travelers = travelers.map(t => ({
      id: t.id,
      type: 'ADULT' as EraTravelerType,
      firstName: t.firstName,
      lastName: t.lastName,
      dateOfBirth: t.dateOfBirth,
      email: t.email,
      phone: t.phone,
      document: t.document,
    }));

    booking.updatedAt = new Date().toISOString();
    this.mockBookings.set(bookingId, booking);

    return booking;
  }

  prebook(bookingId: string): EraPrebookResponse {
    const booking = this.mockBookings.get(bookingId);
    if (!booking) throw new NotFoundException('Booking not found');
    if (booking.status !== 'CREATED') {
      throw new BadRequestException('Booking must be in CREATED status');
    }

    booking.status = 'PREBOOKED';
    booking.updatedAt = new Date().toISOString();
    this.mockBookings.set(bookingId, booking);

    return booking as EraPrebookResponse;
  }

  confirm(bookingId: string): EraConfirmResponse {
    const booking = this.mockBookings.get(bookingId);
    if (!booking) throw new NotFoundException('Booking not found');
    if (booking.status !== 'PREBOOKED') {
      throw new BadRequestException('Booking must be in PREBOOKED status');
    }

    booking.status = 'INVOICED';
    booking.updatedAt = new Date().toISOString();
    
    // Add PNR to items
    booking.items.forEach(item => {
      item.pnr = `PNR${Date.now().toString().slice(-10)}`;
    });

    this.mockBookings.set(bookingId, booking);

    return booking as EraConfirmResponse;
  }

  hold(bookingId: string): EraBooking {
    const booking = this.mockBookings.get(bookingId);
    if (!booking) throw new NotFoundException('Booking not found');

    booking.updatedAt = new Date().toISOString();
    this.mockBookings.set(bookingId, booking);

    return booking;
  }

  printTickets(bookingId: string, format: 'PDF' | 'PKPASS'): EraPrintResponse {
    const booking = this.mockBookings.get(bookingId);
    if (!booking) throw new NotFoundException('Booking not found');
    if (booking.status !== 'INVOICED') {
      throw new BadRequestException('Booking must be INVOICED to print tickets');
    }

    return {
      tickets: [{
        id: uuidv4(),
        reference: booking.reference,
        type: 'E-TICKET',
        format,
        url: `https://mock.eurotrain.net/tickets/${booking.id}.pdf`,
      }],
    };
  }

  deleteItem(bookingId: string, itemId: string): EraBooking {
    const booking = this.mockBookings.get(bookingId);
    if (!booking) throw new NotFoundException('Booking not found');
    if (!['CREATED', 'PREBOOKED'].includes(booking.status)) {
      throw new BadRequestException('Can only delete items in CREATED or PREBOOKED status');
    }
    if (booking.items.length <= 1) {
      throw new BadRequestException('Cannot delete last item');
    }

    booking.items = booking.items.filter(item => item.id !== itemId);
    booking.updatedAt = new Date().toISOString();
    this.mockBookings.set(bookingId, booking);

    return booking;
  }

  // ============================================================
  // REFUND & EXCHANGE
  // ============================================================

  getRefundQuotation(bookingId: string, items?: string[]): EraRefundQuotation {
    const booking = this.mockBookings.get(bookingId);
    if (!booking) throw new NotFoundException('Booking not found');

    return {
      id: uuidv4(),
      bookingId,
      items: booking.items.map(item => ({
        itemId: item.id!,
        refundable: true,
        refundAmount: { amount: 50, currency: 'EUR' },
        fee: { amount: 5, currency: 'EUR' },
      })),
      refundAmount: { amount: 45, currency: 'EUR' },
      fee: { amount: 5, currency: 'EUR' },
      expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    };
  }

  confirmRefund(bookingId: string, quotationId: string): EraRefundResponse {
    const booking = this.mockBookings.get(bookingId);
    if (!booking) throw new NotFoundException('Booking not found');

    booking.status = 'REFUNDED';
    booking.updatedAt = new Date().toISOString();
    this.mockBookings.set(bookingId, booking);

    return {
      id: uuidv4(),
      bookingId,
      status: 'REFUNDED',
      refundedAmount: { amount: 45, currency: 'EUR' },
      refundTransactionId: `REF${Date.now()}`,
    };
  }

  searchExchangeOffers(
    bookingId: string, 
    legs: EraLegRequest[], 
    items?: string[]
  ): EraExchangeSearchResponse {
    // Use regular search for exchange offers
    const searchResponse = this.searchJourneys({ legs, travelers: [{ type: 'ADULT' }] });
    
    return {
      ...searchResponse,
      priceDifference: { amount: 10, currency: 'EUR' },
    } as EraExchangeSearchResponse;
  }

  getExchangeQuotation(bookingId: string, offerLocation: string): EraExchangeQuotation {
    return {
      id: uuidv4(),
      bookingId,
      newOffer: { id: uuidv4(), offerLocation } as EraOffer,
      priceDifference: { amount: 10, currency: 'EUR' },
      fee: { amount: 5, currency: 'EUR' },
      expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    };
  }

  confirmExchange(bookingId: string, quotationId: string): EraExchangeResponse {
    const booking = this.mockBookings.get(bookingId);
    if (!booking) throw new NotFoundException('Booking not found');

    return {
      id: uuidv4(),
      booking,
      exchangeTransactionId: `EXC${Date.now()}`,
    };
  }
}
