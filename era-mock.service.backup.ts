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
  EraComfortCategory,
} from '../interfaces/era-api.types';

// Class configuration type
interface ClassConfig {
  code: string;
  label: string;
  labelTr: string;
  comfortCategory: EraComfortCategory;
  priceMultiplier: number;
  refundable: boolean;
  exchangeable: boolean;
  flexibilityCode: string;
  flexibilityLabel: string;
}

// Route configuration type
interface RouteConfig {
  duration: number;
  basePrice: number;
  carrier: string;
  carrierName: string;
  trainType: 'High-Speed' | 'Inter-City' | 'Night-Train' | 'Branch-Line/Regional';
  trainPrefix: string;
}

@Injectable()
export class EraMockService {
  private readonly logger = new Logger(EraMockService.name);
  
  // In-memory storage
  private mockBookings: Map<string, EraBooking> = new Map();
  private mockSearches: Map<string, EraSearchResponse> = new Map();

  // ============================================================
  // HELPER: Generate short readable PNR/Reference
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
  // CLASS CONFIGURATIONS
  // ============================================================
  
  private readonly classConfigs: ClassConfig[] = [
    {
      code: 'STANDARD',
      label: 'Standard Class',
      labelTr: 'Standart',
      comfortCategory: 'standard',
      priceMultiplier: 1.0,
      refundable: false,
      exchangeable: true,
      flexibilityCode: 'SEMI_FLEX',
      flexibilityLabel: 'Semi-Flexible',
    },
    {
      code: 'BUSINESS',
      label: 'Business Class',
      labelTr: 'Business',
      comfortCategory: 'comfort',
      priceMultiplier: 1.6,
      refundable: true,
      exchangeable: true,
      flexibilityCode: 'FLEXIBLE',
      flexibilityLabel: 'Flexible',
    },
    {
      code: 'FIRST',
      label: 'First Class',
      labelTr: 'Birinci Sınıf',
      comfortCategory: 'premier',
      priceMultiplier: 2.2,
      refundable: true,
      exchangeable: true,
      flexibilityCode: 'FULL_FLEX',
      flexibilityLabel: 'Fully Flexible',
    },
  ];

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
    { id: 'DECOL', type: 'city', code: 'DECOL', label: 'Cologne', localLabel: 'Köln', country: { code: 'DE', label: 'Germany', localLabel: 'Deutschland' }, timezone: 'Europe/Berlin' },
    // Italy
    { id: 'ITROM', type: 'city', code: 'ITROM', label: 'Rome', localLabel: 'Roma', country: { code: 'IT', label: 'Italy', localLabel: 'Italia' }, timezone: 'Europe/Rome' },
    { id: 'ITMIL', type: 'city', code: 'ITMIL', label: 'Milan', localLabel: 'Milano', country: { code: 'IT', label: 'Italy', localLabel: 'Italia' }, timezone: 'Europe/Rome' },
    { id: 'ITFLO', type: 'city', code: 'ITFLO', label: 'Florence', localLabel: 'Firenze', country: { code: 'IT', label: 'Italy', localLabel: 'Italia' }, timezone: 'Europe/Rome' },
    { id: 'ITVEN', type: 'city', code: 'ITVEN', label: 'Venice', localLabel: 'Venezia', country: { code: 'IT', label: 'Italy', localLabel: 'Italia' }, timezone: 'Europe/Rome' },
    { id: 'ITNAP', type: 'city', code: 'ITNAP', label: 'Naples', localLabel: 'Napoli', country: { code: 'IT', label: 'Italy', localLabel: 'Italia' }, timezone: 'Europe/Rome' },
    // Spain
    { id: 'ESMAD', type: 'city', code: 'ESMAD', label: 'Madrid', localLabel: 'Madrid', country: { code: 'ES', label: 'Spain', localLabel: 'España' }, timezone: 'Europe/Madrid' },
    { id: 'ESBAR', type: 'city', code: 'ESBAR', label: 'Barcelona', localLabel: 'Barcelona', country: { code: 'ES', label: 'Spain', localLabel: 'España' }, timezone: 'Europe/Madrid' },
    { id: 'ESSEV', type: 'city', code: 'ESSEV', label: 'Seville', localLabel: 'Sevilla', country: { code: 'ES', label: 'Spain', localLabel: 'España' }, timezone: 'Europe/Madrid' },
    // Netherlands
    { id: 'NLAMS', type: 'city', code: 'NLAMS', label: 'Amsterdam', localLabel: 'Amsterdam', country: { code: 'NL', label: 'Netherlands', localLabel: 'Nederland' }, timezone: 'Europe/Amsterdam' },
    { id: 'NLROT', type: 'city', code: 'NLROT', label: 'Rotterdam', localLabel: 'Rotterdam', country: { code: 'NL', label: 'Netherlands', localLabel: 'Nederland' }, timezone: 'Europe/Amsterdam' },
    // Belgium
    { id: 'BEBRU', type: 'city', code: 'BEBRU', label: 'Brussels', localLabel: 'Bruxelles', country: { code: 'BE', label: 'Belgium', localLabel: 'Belgique' }, timezone: 'Europe/Brussels' },
    { id: 'BEANT', type: 'city', code: 'BEANT', label: 'Antwerp', localLabel: 'Antwerpen', country: { code: 'BE', label: 'Belgium', localLabel: 'België' }, timezone: 'Europe/Brussels' },
    // Switzerland
    { id: 'CHZRH', type: 'city', code: 'CHZRH', label: 'Zurich', localLabel: 'Zürich', country: { code: 'CH', label: 'Switzerland', localLabel: 'Schweiz' }, timezone: 'Europe/Zurich' },
    { id: 'CHGVA', type: 'city', code: 'CHGVA', label: 'Geneva', localLabel: 'Genève', country: { code: 'CH', label: 'Switzerland', localLabel: 'Suisse' }, timezone: 'Europe/Zurich' },
    { id: 'CHBRN', type: 'city', code: 'CHBRN', label: 'Bern', localLabel: 'Bern', country: { code: 'CH', label: 'Switzerland', localLabel: 'Schweiz' }, timezone: 'Europe/Zurich' },
    // Austria
    { id: 'ATVIE', type: 'city', code: 'ATVIE', label: 'Vienna', localLabel: 'Wien', country: { code: 'AT', label: 'Austria', localLabel: 'Österreich' }, timezone: 'Europe/Vienna' },
    { id: 'ATSBG', type: 'city', code: 'ATSBG', label: 'Salzburg', localLabel: 'Salzburg', country: { code: 'AT', label: 'Austria', localLabel: 'Österreich' }, timezone: 'Europe/Vienna' },
    // Czech Republic
    { id: 'CZPRG', type: 'city', code: 'CZPRG', label: 'Prague', localLabel: 'Praha', country: { code: 'CZ', label: 'Czech Republic', localLabel: 'Česká republika' }, timezone: 'Europe/Prague' },
  ];

  // ============================================================
  // ROUTE CONFIGURATIONS (with reverse routes)
  // ============================================================

  private readonly routeConfigs: Record<string, RouteConfig> = {
    // Eurostar routes
    'FRPAR-GBLON': { duration: 136, basePrice: 89, carrier: 'EUROSTAR', carrierName: 'Eurostar', trainType: 'High-Speed', trainPrefix: 'ES' },
    'GBLON-FRPAR': { duration: 136, basePrice: 89, carrier: 'EUROSTAR', carrierName: 'Eurostar', trainType: 'High-Speed', trainPrefix: 'ES' },
    'GBLON-BEBRU': { duration: 120, basePrice: 69, carrier: 'EUROSTAR', carrierName: 'Eurostar', trainType: 'High-Speed', trainPrefix: 'ES' },
    'BEBRU-GBLON': { duration: 120, basePrice: 69, carrier: 'EUROSTAR', carrierName: 'Eurostar', trainType: 'High-Speed', trainPrefix: 'ES' },
    'GBLON-NLAMS': { duration: 225, basePrice: 99, carrier: 'EUROSTAR', carrierName: 'Eurostar', trainType: 'High-Speed', trainPrefix: 'ES' },
    'NLAMS-GBLON': { duration: 225, basePrice: 99, carrier: 'EUROSTAR', carrierName: 'Eurostar', trainType: 'High-Speed', trainPrefix: 'ES' },
    // Thalys routes
    'FRPAR-NLAMS': { duration: 195, basePrice: 89, carrier: 'THALYS', carrierName: 'Thalys', trainType: 'High-Speed', trainPrefix: 'THA' },
    'NLAMS-FRPAR': { duration: 195, basePrice: 89, carrier: 'THALYS', carrierName: 'Thalys', trainType: 'High-Speed', trainPrefix: 'THA' },
    'FRPAR-BEBRU': { duration: 82, basePrice: 69, carrier: 'THALYS', carrierName: 'Thalys', trainType: 'High-Speed', trainPrefix: 'THA' },
    'BEBRU-FRPAR': { duration: 82, basePrice: 69, carrier: 'THALYS', carrierName: 'Thalys', trainType: 'High-Speed', trainPrefix: 'THA' },
    'FRPAR-DECOL': { duration: 200, basePrice: 79, carrier: 'THALYS', carrierName: 'Thalys', trainType: 'High-Speed', trainPrefix: 'THA' },
    'DECOL-FRPAR': { duration: 200, basePrice: 79, carrier: 'THALYS', carrierName: 'Thalys', trainType: 'High-Speed', trainPrefix: 'THA' },
    'BEBRU-NLAMS': { duration: 113, basePrice: 49, carrier: 'THALYS', carrierName: 'Thalys', trainType: 'High-Speed', trainPrefix: 'THA' },
    'NLAMS-BEBRU': { duration: 113, basePrice: 49, carrier: 'THALYS', carrierName: 'Thalys', trainType: 'High-Speed', trainPrefix: 'THA' },
    // TGV/SNCF routes
    'FRPAR-FRLYS': { duration: 120, basePrice: 79, carrier: 'SNCF', carrierName: 'TGV', trainType: 'High-Speed', trainPrefix: 'TGV' },
    'FRLYS-FRPAR': { duration: 120, basePrice: 79, carrier: 'SNCF', carrierName: 'TGV', trainType: 'High-Speed', trainPrefix: 'TGV' },
    'FRPAR-FRMRS': { duration: 180, basePrice: 89, carrier: 'SNCF', carrierName: 'TGV', trainType: 'High-Speed', trainPrefix: 'TGV' },
    'FRMRS-FRPAR': { duration: 180, basePrice: 89, carrier: 'SNCF', carrierName: 'TGV', trainType: 'High-Speed', trainPrefix: 'TGV' },
    'FRPAR-FRNIC': { duration: 330, basePrice: 99, carrier: 'SNCF', carrierName: 'TGV', trainType: 'High-Speed', trainPrefix: 'TGV' },
    'FRNIC-FRPAR': { duration: 330, basePrice: 99, carrier: 'SNCF', carrierName: 'TGV', trainType: 'High-Speed', trainPrefix: 'TGV' },
    'FRPAR-ESBAR': { duration: 390, basePrice: 109, carrier: 'SNCF', carrierName: 'TGV', trainType: 'High-Speed', trainPrefix: 'TGV' },
    'ESBAR-FRPAR': { duration: 390, basePrice: 109, carrier: 'SNCF', carrierName: 'TGV', trainType: 'High-Speed', trainPrefix: 'TGV' },
    'FRLYS-FRMRS': { duration: 100, basePrice: 49, carrier: 'SNCF', carrierName: 'TGV', trainType: 'High-Speed', trainPrefix: 'TGV' },
    'FRMRS-FRLYS': { duration: 100, basePrice: 49, carrier: 'SNCF', carrierName: 'TGV', trainType: 'High-Speed', trainPrefix: 'TGV' },
    // Trenitalia routes
    'ITROM-ITMIL': { duration: 175, basePrice: 69, carrier: 'TRENITALIA', carrierName: 'Frecciarossa', trainType: 'High-Speed', trainPrefix: 'FR' },
    'ITMIL-ITROM': { duration: 175, basePrice: 69, carrier: 'TRENITALIA', carrierName: 'Frecciarossa', trainType: 'High-Speed', trainPrefix: 'FR' },
    'ITROM-ITFLO': { duration: 95, basePrice: 49, carrier: 'TRENITALIA', carrierName: 'Frecciarossa', trainType: 'High-Speed', trainPrefix: 'FR' },
    'ITFLO-ITROM': { duration: 95, basePrice: 49, carrier: 'TRENITALIA', carrierName: 'Frecciarossa', trainType: 'High-Speed', trainPrefix: 'FR' },
    'ITROM-ITVEN': { duration: 225, basePrice: 79, carrier: 'TRENITALIA', carrierName: 'Frecciarossa', trainType: 'High-Speed', trainPrefix: 'FR' },
    'ITVEN-ITROM': { duration: 225, basePrice: 79, carrier: 'TRENITALIA', carrierName: 'Frecciarossa', trainType: 'High-Speed', trainPrefix: 'FR' },
    'ITROM-ITNAP': { duration: 70, basePrice: 45, carrier: 'TRENITALIA', carrierName: 'Frecciarossa', trainType: 'High-Speed', trainPrefix: 'FR' },
    'ITNAP-ITROM': { duration: 70, basePrice: 45, carrier: 'TRENITALIA', carrierName: 'Frecciarossa', trainType: 'High-Speed', trainPrefix: 'FR' },
    'ITMIL-ITFLO': { duration: 100, basePrice: 45, carrier: 'TRENITALIA', carrierName: 'Frecciarossa', trainType: 'High-Speed', trainPrefix: 'FR' },
    'ITFLO-ITMIL': { duration: 100, basePrice: 45, carrier: 'TRENITALIA', carrierName: 'Frecciarossa', trainType: 'High-Speed', trainPrefix: 'FR' },
    'ITMIL-ITVEN': { duration: 145, basePrice: 55, carrier: 'TRENITALIA', carrierName: 'Frecciarossa', trainType: 'High-Speed', trainPrefix: 'FR' },
    'ITVEN-ITMIL': { duration: 145, basePrice: 55, carrier: 'TRENITALIA', carrierName: 'Frecciarossa', trainType: 'High-Speed', trainPrefix: 'FR' },
    // Deutsche Bahn ICE routes
    'DEBER-DEMUC': { duration: 240, basePrice: 89, carrier: 'DBAHN', carrierName: 'ICE', trainType: 'High-Speed', trainPrefix: 'ICE' },
    'DEMUC-DEBER': { duration: 240, basePrice: 89, carrier: 'DBAHN', carrierName: 'ICE', trainType: 'High-Speed', trainPrefix: 'ICE' },
    'DEBER-DEFRA': { duration: 240, basePrice: 79, carrier: 'DBAHN', carrierName: 'ICE', trainType: 'High-Speed', trainPrefix: 'ICE' },
    'DEFRA-DEBER': { duration: 240, basePrice: 79, carrier: 'DBAHN', carrierName: 'ICE', trainType: 'High-Speed', trainPrefix: 'ICE' },
    'DEMUC-DEFRA': { duration: 195, basePrice: 69, carrier: 'DBAHN', carrierName: 'ICE', trainType: 'High-Speed', trainPrefix: 'ICE' },
    'DEFRA-DEMUC': { duration: 195, basePrice: 69, carrier: 'DBAHN', carrierName: 'ICE', trainType: 'High-Speed', trainPrefix: 'ICE' },
    'DEFRA-DECOL': { duration: 70, basePrice: 39, carrier: 'DBAHN', carrierName: 'ICE', trainType: 'High-Speed', trainPrefix: 'ICE' },
    'DECOL-DEFRA': { duration: 70, basePrice: 39, carrier: 'DBAHN', carrierName: 'ICE', trainType: 'High-Speed', trainPrefix: 'ICE' },
    // RENFE AVE routes
    'ESMAD-ESBAR': { duration: 155, basePrice: 69, carrier: 'RENFE', carrierName: 'AVE', trainType: 'High-Speed', trainPrefix: 'AVE' },
    'ESBAR-ESMAD': { duration: 155, basePrice: 69, carrier: 'RENFE', carrierName: 'AVE', trainType: 'High-Speed', trainPrefix: 'AVE' },
    'ESMAD-ESSEV': { duration: 150, basePrice: 65, carrier: 'RENFE', carrierName: 'AVE', trainType: 'High-Speed', trainPrefix: 'AVE' },
    'ESSEV-ESMAD': { duration: 150, basePrice: 65, carrier: 'RENFE', carrierName: 'AVE', trainType: 'High-Speed', trainPrefix: 'AVE' },
    // SBB routes
    'CHZRH-CHGVA': { duration: 170, basePrice: 79, carrier: 'SBB', carrierName: 'SBB', trainType: 'Inter-City', trainPrefix: 'IC' },
    'CHGVA-CHZRH': { duration: 170, basePrice: 79, carrier: 'SBB', carrierName: 'SBB', trainType: 'Inter-City', trainPrefix: 'IC' },
    'CHZRH-CHBRN': { duration: 60, basePrice: 45, carrier: 'SBB', carrierName: 'SBB', trainType: 'Inter-City', trainPrefix: 'IC' },
    'CHBRN-CHZRH': { duration: 60, basePrice: 45, carrier: 'SBB', carrierName: 'SBB', trainType: 'Inter-City', trainPrefix: 'IC' },
    // ÖBB Railjet routes
    'ATVIE-ATSBG': { duration: 145, basePrice: 55, carrier: 'OBB', carrierName: 'Railjet', trainType: 'High-Speed', trainPrefix: 'RJ' },
    'ATSBG-ATVIE': { duration: 145, basePrice: 55, carrier: 'OBB', carrierName: 'Railjet', trainType: 'High-Speed', trainPrefix: 'RJ' },
    'ATVIE-DEMUC': { duration: 240, basePrice: 69, carrier: 'OBB', carrierName: 'Railjet', trainType: 'High-Speed', trainPrefix: 'RJ' },
    'DEMUC-ATVIE': { duration: 240, basePrice: 69, carrier: 'OBB', carrierName: 'Railjet', trainType: 'High-Speed', trainPrefix: 'RJ' },
    'ATVIE-CZPRG': { duration: 240, basePrice: 59, carrier: 'OBB', carrierName: 'Railjet', trainType: 'High-Speed', trainPrefix: 'RJ' },
    'CZPRG-ATVIE': { duration: 240, basePrice: 59, carrier: 'OBB', carrierName: 'Railjet', trainType: 'High-Speed', trainPrefix: 'RJ' },
    // Cross-border international
    'FRPAR-CHGVA': { duration: 190, basePrice: 89, carrier: 'TGV_LYRIA', carrierName: 'TGV Lyria', trainType: 'High-Speed', trainPrefix: 'TGV' },
    'CHGVA-FRPAR': { duration: 190, basePrice: 89, carrier: 'TGV_LYRIA', carrierName: 'TGV Lyria', trainType: 'High-Speed', trainPrefix: 'TGV' },
    'FRPAR-CHZRH': { duration: 240, basePrice: 99, carrier: 'TGV_LYRIA', carrierName: 'TGV Lyria', trainType: 'High-Speed', trainPrefix: 'TGV' },
    'CHZRH-FRPAR': { duration: 240, basePrice: 99, carrier: 'TGV_LYRIA', carrierName: 'TGV Lyria', trainType: 'High-Speed', trainPrefix: 'TGV' },
    'ITMIL-CHZRH': { duration: 210, basePrice: 79, carrier: 'SBB', carrierName: 'EuroCity', trainType: 'Inter-City', trainPrefix: 'EC' },
    'CHZRH-ITMIL': { duration: 210, basePrice: 79, carrier: 'SBB', carrierName: 'EuroCity', trainType: 'Inter-City', trainPrefix: 'EC' },
    'DEBER-CZPRG': { duration: 250, basePrice: 49, carrier: 'DBAHN', carrierName: 'EuroCity', trainType: 'Inter-City', trainPrefix: 'EC' },
    'CZPRG-DEBER': { duration: 250, basePrice: 49, carrier: 'DBAHN', carrierName: 'EuroCity', trainType: 'Inter-City', trainPrefix: 'EC' },
  };

  // ============================================================
  // PLACES METHODS
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
    const config = this.routeConfigs[routeKey] || this.getDefaultRouteConfig(origin, destination);

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

      this.classConfigs.forEach((classConfig) => {
        const offerId = this.generateShortId();
        const productId = this.generateShortId();
        const baseVariation = 0.85 + Math.random() * 0.3;
        const timeMultiplier = this.getTimeMultiplier(time);
        const price = Math.round(config.basePrice * classConfig.priceMultiplier * baseVariation * timeMultiplier);

        // Track cheapest (standard class only for fair comparison)
        if (classConfig.code === 'STANDARD' && price < cheapestPrice) {
          cheapestPrice = price;
          cheapestOfferId = offerId;
        }
        // Track fastest
        if (classConfig.code === 'STANDARD' && config.duration < fastestDuration) {
          fastestDuration = config.duration;
          fastestOfferId = offerId;
        }

        const product: EraProduct = {
          id: productId,
          code: `${config.carrier}_${classConfig.code}`,
          type: 'point-to-point',
          label: classConfig.label,
          supplier: config.carrier,
          marketingCarrier: config.carrier,
          segment: segment.id,
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
          legSolution: legSolutionId,
          offerLocation: `offer:${offerId}`,
          products: [productId],
          prices: { total: { amount: price * request.travelers.length, currency: 'EUR' } },
          comfortCategory: classConfig.comfortCategory,
          flexibility: product.flexibility,
          ticketingOptions: [
            { code: 'ETK', label: 'E-Ticket' },
            { code: 'PAH', label: 'Print at Home' },
          ],
          isDirect: true,
          segmentCount: 1,
        };
        offers.push(offer);
      });
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
        cheapestOfferId,
        fastestOfferId,
      },
    };

    this.mockSearches.set(searchId, response);
    return response;
  }

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

  private getDefaultRouteConfig(origin: EraPlace, destination: EraPlace): RouteConfig {
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
