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

// Import modular configs
import { mockPlaces, placesMap } from './era-places-data';
import { classConfigs, ClassConfig } from './era-class-configs';
import {
  directRoutes,
  multiSegmentRoutes,
  DirectRouteConfig,
  MultiSegmentRouteConfig,
  hasDirectRoute,
  hasMultiSegmentRoute,
} from './era-route-configs';

@Injectable()
export class EraMockService {
  private readonly logger = new Logger(EraMockService.name);

  // In-memory storage
  private mockBookings: Map<string, EraBooking> = new Map();
  private mockSearches: Map<string, EraSearchResponse> = new Map();

  // ============================================================
  // HELPER: ID Generation
  // ============================================================

  private generateBookingReference(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let result = 'ET-';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  private generateShortId(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  // ============================================================
  // PLACES METHODS
  // ============================================================

  searchPlaces(query: string, limit: number = 10, type?: 'city' | 'station'): EraPlace[] {
    const searchTerm = query.toLowerCase();
    let results = mockPlaces.filter(place =>
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
    return [...mockPlaces];
  }

  getPlaceByCode(code: string): EraPlace | undefined {
    return placesMap.get(code);
  }

  // ============================================================
  // SEARCH METHODS
  // ============================================================

  searchJourneys(request: EraSearchRequest): EraSearchResponse {
    const searchId = this.generateShortId();
    const leg = request.legs[0];

    // Support both naming conventions
    const originCode = (leg as any).departure || (leg as any).origin;
    const destinationCode = (leg as any).arrival || (leg as any).destination;
    const departureTime = (leg as any).departureTime || (leg as any).departureDate;

    const origin = this.getPlaceByCode(originCode);
    const destination = this.getPlaceByCode(destinationCode);

    if (!origin || !destination) {
      throw new BadRequestException(`Invalid origin (${originCode}) or destination (${destinationCode})`);
    }

    const routeKey = `${originCode}-${destinationCode}`;
    const directConfig = directRoutes[routeKey];
    const multiSegmentConfig = multiSegmentRoutes[routeKey];

    const departureTimes = ['06:15', '07:30', '08:45', '10:15', '12:30', '14:45', '16:15', '18:30', '20:00'];
    const offers: EraOffer[] = [];
    const products: EraProduct[] = [];
    const legSolutions: EraLegSolution[] = [];

    const departureDate = departureTime?.split('T')[0] || new Date().toISOString().split('T')[0];

    // Track for highlights
    let cheapestPrice = Infinity;
    let cheapestOfferId = '';
    let fastestDuration = Infinity;
    let fastestOfferId = '';

    // Generate journeys based on route type
    if (directConfig) {
      // Direct route - generate direct journeys
      this.generateDirectJourneys(
        directConfig,
        departureTimes,
        departureDate,
        origin,
        destination,
        request,
        legSolutions,
        offers,
        products,
        { cheapestPrice, cheapestOfferId, fastestDuration, fastestOfferId }
      );
    }

    if (multiSegmentConfig) {
      // Multi-segment route - generate connecting journeys
      // Only generate 3-4 multi-segment options (not every departure time)
      const connectionTimes = ['07:00', '10:00', '14:00', '17:00'];
      this.generateMultiSegmentJourneys(
        multiSegmentConfig,
        connectionTimes,
        departureDate,
        origin,
        destination,
        request,
        legSolutions,
        offers,
        products,
        { cheapestPrice, cheapestOfferId, fastestDuration, fastestOfferId }
      );
    }

    // If no configured route, use default
    if (!directConfig && !multiSegmentConfig) {
      const defaultConfig = this.getDefaultRouteConfig(origin, destination);
      this.generateDirectJourneys(
        defaultConfig,
        departureTimes,
        departureDate,
        origin,
        destination,
        request,
        legSolutions,
        offers,
        products,
        { cheapestPrice, cheapestOfferId, fastestDuration, fastestOfferId }
      );
    }

    // Find highlights from offers
    let finalCheapest = '';
    let finalFastest = '';
    offers.forEach(offer => {
      if (offer.prices?.total?.amount && offer.prices.total.amount < cheapestPrice) {
        cheapestPrice = offer.prices.total.amount;
        finalCheapest = offer.id || '';
      }
    });

    const response: EraSearchResponse = {
      id: searchId,
      pointOfSale: 'EUROTRAIN',
      legs: [{
        origin,
        destination,
        departure: `${departureDate}T00:00:00`,
        solutions: legSolutions,
      }],
      travelers: request.travelers.map((t) => ({
        id: this.generateShortId(),
        type: t.type,
        dateOfBirth: t.dateOfBirth,
      })),
      offers,
      products,
      highlights: {
        cheapestOfferId: finalCheapest,
        fastestOfferId: fastestOfferId,
      },
    };

    this.mockSearches.set(searchId, response);
    return response;
  }

  // ============================================================
  // DIRECT JOURNEY GENERATION
  // ============================================================

  private generateDirectJourneys(
    config: DirectRouteConfig,
    departureTimes: string[],
    departureDate: string,
    origin: EraPlace,
    destination: EraPlace,
    request: EraSearchRequest,
    legSolutions: EraLegSolution[],
    offers: EraOffer[],
    products: EraProduct[],
    highlights: { cheapestPrice: number; cheapestOfferId: string; fastestDuration: number; fastestOfferId: string }
  ): void {
    departureTimes.forEach((time, timeIndex) => {
      const legSolutionId = this.generateShortId();

      const [hours, minutes] = time.split(':').map(Number);
      const departureMinutes = hours * 60 + minutes;
      const arrivalMinutes = departureMinutes + config.duration;
      const arrivalHours = Math.floor(arrivalMinutes / 60) % 24;
      const arrivalMins = arrivalMinutes % 60;
      const arrivalTime = `${arrivalHours.toString().padStart(2, '0')}:${arrivalMins.toString().padStart(2, '0')}`;
      const trainNumber = `${config.trainPrefix} ${9000 + timeIndex * 100 + Math.floor(Math.random() * 50)}`;

      const segment: EraSegment = {
        id: this.generateShortId(),
        sequenceNumber: 1,
        origin,
        destination,
        departure: `${departureDate}T${time}:00`,
        arrival: `${departureDate}T${arrivalTime}:00`,
        duration: this.formatDuration(config.duration),
        operatingCarrier: config.carrier,
        marketingCarrier: config.carrier,
        supplier: config.carrier,
        vehicle: {
          type: config.trainType,
          reference: trainNumber,
          code: config.trainPrefix,
          identityName: config.carrierName,
        },
      };

      const legSolution: EraLegSolution = {
        id: legSolutionId,
        origin,
        destination,
        departure: segment.departure,
        arrival: segment.arrival,
        duration: segment.duration,
        segments: [segment],
        segmentCount: 1,
        isDirect: true,
      };
      legSolutions.push(legSolution);

      // Generate offers for each class
      this.generateOffersForLegSolution(
        legSolution,
        config,
        request,
        offers,
        products,
        highlights,
        time
      );
    });
  }

  // ============================================================
  // MULTI-SEGMENT JOURNEY GENERATION
  // ============================================================

  private generateMultiSegmentJourneys(
    config: MultiSegmentRouteConfig,
    connectionTimes: string[],
    departureDate: string,
    origin: EraPlace,
    destination: EraPlace,
    request: EraSearchRequest,
    legSolutions: EraLegSolution[],
    offers: EraOffer[],
    products: EraProduct[],
    highlights: { cheapestPrice: number; cheapestOfferId: string; fastestDuration: number; fastestOfferId: string }
  ): void {
    const transferStation = this.getPlaceByCode(config.via);
    if (!transferStation) {
      this.logger.warn(`Transfer station ${config.via} not found`);
      return;
    }

    connectionTimes.forEach((time, timeIndex) => {
      const legSolutionId = this.generateShortId();

      // Segment 1: Origin → Transfer
      const [hours1, minutes1] = time.split(':').map(Number);
      const departure1Minutes = hours1 * 60 + minutes1;
      const arrival1Minutes = departure1Minutes + config.segments[0].duration;
      const arrival1Hours = Math.floor(arrival1Minutes / 60) % 24;
      const arrival1Mins = arrival1Minutes % 60;
      const arrival1Time = `${arrival1Hours.toString().padStart(2, '0')}:${arrival1Mins.toString().padStart(2, '0')}`;
      const trainNumber1 = `${config.segments[0].trainPrefix} ${8000 + timeIndex * 100 + Math.floor(Math.random() * 50)}`;

      const segment1: EraSegment = {
        id: this.generateShortId(),
        sequenceNumber: 1,
        origin,
        destination: transferStation,
        departure: `${departureDate}T${time}:00`,
        arrival: `${departureDate}T${arrival1Time}:00`,
        duration: this.formatDuration(config.segments[0].duration),
        operatingCarrier: config.segments[0].carrier,
        marketingCarrier: config.segments[0].carrier,
        supplier: config.segments[0].carrier,
        vehicle: {
          type: config.segments[0].trainType,
          reference: trainNumber1,
          code: config.segments[0].trainPrefix,
          identityName: config.segments[0].carrierName,
        },
      };

      // Segment 2: Transfer → Destination (after transfer time)
      const departure2Minutes = arrival1Minutes + config.transferTime;
      const departure2Hours = Math.floor(departure2Minutes / 60) % 24;
      const departure2Mins = departure2Minutes % 60;
      const departure2Time = `${departure2Hours.toString().padStart(2, '0')}:${departure2Mins.toString().padStart(2, '0')}`;
      
      const arrival2Minutes = departure2Minutes + config.segments[1].duration;
      const arrival2Hours = Math.floor(arrival2Minutes / 60) % 24;
      const arrival2Mins = arrival2Minutes % 60;
      const arrival2Time = `${arrival2Hours.toString().padStart(2, '0')}:${arrival2Mins.toString().padStart(2, '0')}`;
      const trainNumber2 = `${config.segments[1].trainPrefix} ${7000 + timeIndex * 100 + Math.floor(Math.random() * 50)}`;

      // Handle day overflow
      let arrivalDateStr = departureDate;
      if (arrival2Minutes >= 24 * 60) {
        const nextDay = new Date(departureDate);
        nextDay.setDate(nextDay.getDate() + 1);
        arrivalDateStr = nextDay.toISOString().split('T')[0];
      }

      const segment2: EraSegment = {
        id: this.generateShortId(),
        sequenceNumber: 2,
        origin: transferStation,
        destination,
        departure: `${departureDate}T${departure2Time}:00`,
        arrival: `${arrivalDateStr}T${arrival2Time}:00`,
        duration: this.formatDuration(config.segments[1].duration),
        operatingCarrier: config.segments[1].carrier,
        marketingCarrier: config.segments[1].carrier,
        supplier: config.segments[1].carrier,
        vehicle: {
          type: config.segments[1].trainType,
          reference: trainNumber2,
          code: config.segments[1].trainPrefix,
          identityName: config.segments[1].carrierName,
        },
      };

      const legSolution: EraLegSolution = {
        id: legSolutionId,
        origin,
        destination,
        departure: segment1.departure,
        arrival: segment2.arrival,
        duration: this.formatDuration(config.totalDuration),
        segments: [segment1, segment2],
        segmentCount: 2,
        isDirect: false,
        transferTime: config.transferTime,
        transferStation: transferStation.label,
      };
      legSolutions.push(legSolution);

      // Generate offers - use combined config for pricing
      const combinedConfig: DirectRouteConfig = {
        duration: config.totalDuration,
        basePrice: config.totalBasePrice,
        carrier: config.segments[0].carrier, // Primary carrier
        carrierName: `${config.segments[0].carrierName} + ${config.segments[1].carrierName}`,
        trainType: config.segments[0].trainType,
        trainPrefix: config.segments[0].trainPrefix,
      };

      this.generateOffersForLegSolution(
        legSolution,
        combinedConfig,
        request,
        offers,
        products,
        highlights,
        time
      );
    });
  }

  // ============================================================
  // OFFER GENERATION (shared by direct and multi-segment)
  // ============================================================

  private generateOffersForLegSolution(
    legSolution: EraLegSolution,
    config: DirectRouteConfig,
    request: EraSearchRequest,
    offers: EraOffer[],
    products: EraProduct[],
    highlights: { cheapestPrice: number; cheapestOfferId: string; fastestDuration: number; fastestOfferId: string },
    time: string
  ): void {
    classConfigs.forEach((classConfig) => {
      const offerId = this.generateShortId();
      const productId = this.generateShortId();
      const baseVariation = 0.85 + Math.random() * 0.3;
      const timeMultiplier = this.getTimeMultiplier(time);
      const price = Math.round(config.basePrice * classConfig.priceMultiplier * baseVariation * timeMultiplier);

      // Track cheapest (standard class only)
      if (classConfig.code === 'STANDARD' && price < highlights.cheapestPrice) {
        highlights.cheapestPrice = price;
        highlights.cheapestOfferId = offerId;
      }
      // Track fastest (standard class only)
      if (classConfig.code === 'STANDARD' && config.duration < highlights.fastestDuration) {
        highlights.fastestDuration = config.duration;
        highlights.fastestOfferId = offerId;
      }

      const product: EraProduct = {
        id: productId,
        code: `${config.carrier}_${classConfig.code}`,
        type: 'point-to-point',
        label: classConfig.label,
        supplier: config.carrier,
        marketingCarrier: config.carrier,
        segment: legSolution.segments[0].id,
        prices: { total: { amount: price, currency: 'EUR' } },
        comfortCategory: classConfig.comfortCategory,
        flexibility: {
          label: classConfig.flexibilityLabel,
          code: classConfig.flexibilityCode,
          refundable: classConfig.refundable,
          exchangeable: classConfig.exchangeable,
        },
      };
      products.push(product);

      const offer: EraOffer = {
        id: offerId,
        legSolution: legSolution.id!,
        offerLocation: `offer:${offerId}`,
        products: [productId],
        prices: { total: { amount: price * request.travelers.length, currency: 'EUR' } },
        comfortCategory: classConfig.comfortCategory,
        flexibility: product.flexibility,
        ticketingOptions: [
          { code: 'ETK', label: 'E-Ticket' },
          { code: 'PAH', label: 'Print at Home' },
        ],
        isDirect: legSolution.isDirect,
        segmentCount: legSolution.segmentCount,
      };
      offers.push(offer);
    });
  }

  // ============================================================
  // HELPER METHODS
  // ============================================================

  private getTimeMultiplier(time: string): number {
    const hour = parseInt(time.split(':')[0]);
    if ((hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 19)) return 1.15;
    if (hour >= 10 && hour <= 15) return 0.95;
    return 1.0;
  }

  private formatDuration(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `PT${mins}M`;
    if (mins === 0) return `PT${hours}H`;
    return `PT${hours}H${mins}M`;
  }

  private getDefaultRouteConfig(origin: EraPlace, destination: EraPlace): DirectRouteConfig {
    const baseDuration = 180;
    const originCountry = origin.country?.code || '';
    const destCountry = destination.country?.code || '';

    if (originCountry === 'FR' || destCountry === 'FR') {
      return { duration: baseDuration, basePrice: 79, carrier: 'SNCF', carrierName: 'TGV', trainType: 'High-Speed', trainPrefix: 'TGV' };
    }
    if (originCountry === 'DE' || destCountry === 'DE') {
      return { duration: baseDuration, basePrice: 79, carrier: 'DBAHN', carrierName: 'ICE', trainType: 'High-Speed', trainPrefix: 'ICE' };
    }
    if (originCountry === 'IT' || destCountry === 'IT') {
      return { duration: baseDuration, basePrice: 69, carrier: 'TRENITALIA', carrierName: 'Frecciarossa', trainType: 'High-Speed', trainPrefix: 'FR' };
    }
    if (originCountry === 'ES' || destCountry === 'ES') {
      return { duration: baseDuration, basePrice: 69, carrier: 'RENFE', carrierName: 'AVE', trainType: 'High-Speed', trainPrefix: 'AVE' };
    }
    return { duration: baseDuration, basePrice: 69, carrier: 'RAIL', carrierName: 'EuroRail', trainType: 'Inter-City', trainPrefix: 'IC' };
  }

  getAdditionalOffers(searchId: string, page: 'next' | 'previous'): EraSearchResponse {
    const cached = this.mockSearches.get(searchId);
    if (!cached) throw new NotFoundException('Search not found or expired');
    return cached;
  }

  getOfferById(searchId: string, offerId: string): EraOffer | null {
    const cached = this.mockSearches.get(searchId);
    if (!cached) return null;
    return cached.offers?.find(o => o.id === offerId) || null;
  }

  // ============================================================
  // BOOKING METHODS
  // ============================================================

  createBooking(offerLocations: string[]): EraBooking {
    const bookingId = this.generateShortId();
    const reference = this.generateBookingReference();

    const booking: EraBooking = {
      id: bookingId,
      reference,
      status: 'CREATED',
      items: offerLocations.map((loc, index) => ({
        id: this.generateShortId(),
        reference: `${reference}-${index + 1}`,
        status: 'CREATED',
      })),
      travelers: [],
      prices: { total: { amount: 0, currency: 'EUR' } },
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
    };

    this.mockBookings.set(bookingId, booking);
    this.logger.debug(`Mock booking created: ${bookingId} (ref: ${reference})`);
    return booking;
  }

  getBooking(bookingId: string): EraBooking | null {
    return this.mockBookings.get(bookingId) || null;
  }

  updateTravelers(bookingId: string, itemId: string, travelers: EraBookingTravelerInput[]): EraBooking {
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
    booking.items.forEach((item) => {
      item.pnr = this.generateBookingReference();
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
        id: this.generateShortId(),
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
  // REFUND & EXCHANGE METHODS
  // ============================================================

  getRefundQuotation(bookingId: string, items?: string[]): EraRefundQuotation {
    const booking = this.mockBookings.get(bookingId);
    if (!booking) throw new NotFoundException('Booking not found');

    return {
      id: this.generateShortId(),
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
      id: this.generateShortId(),
      bookingId,
      status: 'REFUNDED',
      refundedAmount: { amount: 45, currency: 'EUR' },
      refundTransactionId: `REF-${this.generateShortId()}`,
    };
  }

  searchExchangeOffers(bookingId: string, legs: EraLegRequest[], items?: string[]): EraExchangeSearchResponse {
    const searchResponse = this.searchJourneys({ legs, travelers: [{ type: 'ADULT' }] });
    return {
      ...searchResponse,
      priceDifference: { amount: 10, currency: 'EUR' },
    } as EraExchangeSearchResponse;
  }

  getExchangeQuotation(bookingId: string, offerLocation: string): EraExchangeQuotation {
    return {
      id: this.generateShortId(),
      bookingId,
      newOffer: { id: this.generateShortId(), offerLocation } as EraOffer,
      priceDifference: { amount: 10, currency: 'EUR' },
      fee: { amount: 5, currency: 'EUR' },
      expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    };
  }

  confirmExchange(bookingId: string, quotationId: string): EraExchangeResponse {
    const booking = this.mockBookings.get(bookingId);
    if (!booking) throw new NotFoundException('Booking not found');

    return {
      id: this.generateShortId(),
      booking,
      exchangeTransactionId: `EXC-${this.generateShortId()}`,
    };
  }
}
