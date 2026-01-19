import { Injectable } from '@nestjs/common';
import { MOCK_STATIONS, Station } from './entities/station.entity';
import { Journey, JourneyLeg, JourneyPrice, TrainType, TRAIN_OPERATORS } from './entities/journey.entity';
import { SearchJourneyDto, JourneySearchResultDto, JourneySummary } from './dto/search-journey.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class EraMockService {
  
  // Station search with autocomplete
  searchStations(query: string, limit: number = 10, country?: string): Station[] {
    const searchTerm = query.toLowerCase();
    
    let results = MOCK_STATIONS.filter(station => 
      station.name.toLowerCase().includes(searchTerm) ||
      station.city.toLowerCase().includes(searchTerm) ||
      station.code.toLowerCase().includes(searchTerm)
    );
    
    if (country) {
      results = results.filter(s => s.countryCode === country.toUpperCase());
    }
    
    return results.slice(0, limit);
  }
  
  // Get station by ID
  getStation(stationId: string): Station | undefined {
    return MOCK_STATIONS.find(s => s.id === stationId);
  }
  
  // Search journeys
  searchJourneys(dto: SearchJourneyDto): JourneySearchResultDto {
    const origin = this.getStation(dto.origin);
    const destination = this.getStation(dto.destination);
    
    if (!origin || !destination) {
      throw new Error('Invalid origin or destination station');
    }
    
    const searchId = uuidv4();
    const outboundJourneys = this.generateMockJourneys(origin, destination, dto.departureDate, dto.passengers.adults);
    
    let returnJourneys: JourneySummary[] | undefined;
    if (dto.returnDate) {
      returnJourneys = this.generateMockJourneys(destination, origin, dto.returnDate, dto.passengers.adults);
    }
    
    return {
      searchId,
      origin: {
        id: origin.id,
        name: origin.name,
        city: origin.city,
        country: origin.country,
      },
      destination: {
        id: destination.id,
        name: destination.name,
        city: destination.city,
        country: destination.country,
      },
      departureDate: dto.departureDate,
      outboundJourneys,
      returnJourneys,
      searchedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 min cache
    };
  }
  
  // Generate mock journeys for a route
  private generateMockJourneys(origin: Station, destination: Station, date: string, passengerCount: number): JourneySummary[] {
    const journeys: JourneySummary[] = [];
    const routeInfo = this.getRouteInfo(origin, destination);
    
    // Generate 5-8 journeys throughout the day
    const departureTimes = ['06:15', '08:30', '10:45', '12:20', '14:35', '16:50', '18:25', '20:10'];
    const journeyCount = Math.min(departureTimes.length, 5 + Math.floor(Math.random() * 3));
    
    for (let i = 0; i < journeyCount; i++) {
      const departureTime = departureTimes[i];
      const journey = this.generateSingleJourney(origin, destination, date, departureTime, routeInfo);
      journeys.push(journey);
    }
    
    return journeys.sort((a, b) => a.departureTime.localeCompare(b.departureTime));
  }
  
  // Get route-specific info (train types, duration, transfers)
  private getRouteInfo(origin: Station, destination: Station): RouteInfo {
    const routes: Record<string, RouteInfo> = {
      // France internal
      'FRPAR-FRLYS': { trainTypes: ['TGV'], baseDuration: 120, basePrice: 79, transfers: 0 },
      'FRPAR-FRNIC': { trainTypes: ['TGV'], baseDuration: 330, basePrice: 99, transfers: 0 },
      'FRPAR-FRMRS': { trainTypes: ['TGV'], baseDuration: 180, basePrice: 89, transfers: 0 },
      
      // France-Germany
      'FRPAR-DEBER': { trainTypes: ['ICE', 'TGV'], baseDuration: 480, basePrice: 149, transfers: 1 },
      'FRPAR-DEFRA': { trainTypes: ['ICE', 'TGV'], baseDuration: 240, basePrice: 119, transfers: 0 },
      'FRPAR-DEMUC': { trainTypes: ['TGV', 'ICE'], baseDuration: 360, basePrice: 139, transfers: 1 },
      
      // France-Italy
      'FRPAR-ITROM': { trainTypes: ['TGV', 'FRECCIAROSSA'], baseDuration: 600, basePrice: 129, transfers: 1 },
      'FRPAR-ITMIL': { trainTypes: ['TGV'], baseDuration: 420, basePrice: 99, transfers: 0 },
      'FRLYS-ITROM': { trainTypes: ['TGV', 'FRECCIAROSSA'], baseDuration: 540, basePrice: 119, transfers: 1 },
      
      // France-Spain
      'FRPAR-ESBAR': { trainTypes: ['TGV'], baseDuration: 390, basePrice: 109, transfers: 0 },
      'FRPAR-ESMAD': { trainTypes: ['TGV', 'AVE'], baseDuration: 600, basePrice: 149, transfers: 1 },
      
      // France-Belgium-Netherlands
      'FRPAR-BEBRU': { trainTypes: ['THALYS'], baseDuration: 82, basePrice: 69, transfers: 0 },
      'FRPAR-NLAMS': { trainTypes: ['THALYS'], baseDuration: 195, basePrice: 89, transfers: 0 },
      'BEBRU-NLAMS': { trainTypes: ['THALYS'], baseDuration: 113, basePrice: 49, transfers: 0 },
      
      // France-UK
      'FRPAR-GBLON': { trainTypes: ['EUROSTAR'], baseDuration: 136, basePrice: 89, transfers: 0 },
      
      // France-Switzerland
      'FRPAR-CHZRH': { trainTypes: ['TGV_LYRIA'], baseDuration: 240, basePrice: 99, transfers: 0 },
      'FRPAR-CHGVA': { trainTypes: ['TGV_LYRIA'], baseDuration: 185, basePrice: 89, transfers: 0 },
      'FRLYS-CHGVA': { trainTypes: ['TGV_LYRIA'], baseDuration: 110, basePrice: 59, transfers: 0 },
      
      // Germany internal
      'DEBER-DEMUC': { trainTypes: ['ICE'], baseDuration: 240, basePrice: 89, transfers: 0 },
      'DEBER-DEFRA': { trainTypes: ['ICE'], baseDuration: 240, basePrice: 79, transfers: 0 },
      'DEBER-DEHAM': { trainTypes: ['ICE'], baseDuration: 105, basePrice: 59, transfers: 0 },
      'DEFRA-DEMUC': { trainTypes: ['ICE'], baseDuration: 195, basePrice: 69, transfers: 0 },
      
      // Germany-Austria
      'DEMUC-ATVIE': { trainTypes: ['ICE', 'OBB'], baseDuration: 240, basePrice: 69, transfers: 0 },
      'DEBER-ATVIE': { trainTypes: ['ICE', 'OBB'], baseDuration: 480, basePrice: 99, transfers: 1 },
      
      // Italy internal
      'ITROM-ITMIL': { trainTypes: ['FRECCIAROSSA'], baseDuration: 175, basePrice: 69, transfers: 0 },
      'ITROM-ITFLO': { trainTypes: ['FRECCIAROSSA'], baseDuration: 95, basePrice: 49, transfers: 0 },
      'ITROM-ITVEN': { trainTypes: ['FRECCIAROSSA'], baseDuration: 225, basePrice: 79, transfers: 0 },
      'ITROM-ITNAP': { trainTypes: ['FRECCIAROSSA'], baseDuration: 70, basePrice: 45, transfers: 0 },
      'ITMIL-ITVEN': { trainTypes: ['FRECCIAROSSA'], baseDuration: 145, basePrice: 49, transfers: 0 },
      'ITMIL-ITFLO': { trainTypes: ['FRECCIAROSSA'], baseDuration: 100, basePrice: 45, transfers: 0 },
      
      // Spain internal
      'ESMAD-ESBAR': { trainTypes: ['AVE'], baseDuration: 155, basePrice: 69, transfers: 0 },
      'ESMAD-ESSEV': { trainTypes: ['AVE'], baseDuration: 135, basePrice: 59, transfers: 0 },
      'ESMAD-ESVAL': { trainTypes: ['AVE'], baseDuration: 100, basePrice: 49, transfers: 0 },
      
      // Switzerland internal
      'CHZRH-CHGVA': { trainTypes: ['SBB'], baseDuration: 170, basePrice: 79, transfers: 0 },
      'CHZRH-CHBSL': { trainTypes: ['SBB'], baseDuration: 53, basePrice: 35, transfers: 0 },
    };
    
    // Check both directions
    const key1 = `${origin.id}-${destination.id}`;
    const key2 = `${destination.id}-${origin.id}`;
    
    if (routes[key1]) return routes[key1];
    if (routes[key2]) return routes[key2];
    
    // Default route for unknown combinations
    return {
      trainTypes: ['INTERCITY'],
      baseDuration: 300 + Math.floor(Math.random() * 300),
      basePrice: 80 + Math.floor(Math.random() * 80),
      transfers: Math.random() > 0.6 ? 1 : 0,
    };
  }
  
  // Generate a single journey
  private generateSingleJourney(
    origin: Station, 
    destination: Station, 
    date: string, 
    departureTime: string,
    routeInfo: RouteInfo
  ): JourneySummary {
    const journeyId = uuidv4();
    
    // Add some randomness to duration (+/- 15 min)
    const durationVariance = Math.floor(Math.random() * 30) - 15;
    const duration = routeInfo.baseDuration + durationVariance;
    
    // Calculate arrival time
    const [depHours, depMinutes] = departureTime.split(':').map(Number);
    const depDate = new Date(`${date}T${departureTime}:00`);
    const arrDate = new Date(depDate.getTime() + duration * 60 * 1000);
    const arrivalTime = `${arrDate.getHours().toString().padStart(2, '0')}:${arrDate.getMinutes().toString().padStart(2, '0')}`;
    
    // Price variance (+/- 20%)
    const priceVariance = 1 + (Math.random() * 0.4 - 0.2);
    const basePrice = Math.round(routeInfo.basePrice * priceVariance);
    
    // Select train type
    const trainType = routeInfo.trainTypes[Math.floor(Math.random() * routeInfo.trainTypes.length)] as TrainType;
    const operator = TRAIN_OPERATORS[trainType]?.name || 'Unknown';
    
    // Generate legs
    const legs = this.generateLegs(origin, destination, date, departureTime, arrivalTime, trainType, routeInfo.transfers);
    
    return {
      id: journeyId,
      departureTime: `${date}T${departureTime}:00`,
      arrivalTime: `${date}T${arrivalTime}:00`,
      duration,
      transfers: routeInfo.transfers,
      trainTypes: [trainType],
      operators: [operator],
      prices: {
        from: basePrice,
        currency: 'EUR',
      },
      availableClasses: ['FIRST', 'SECOND'],
      legs,
    };
  }
  
  // Generate journey legs
  private generateLegs(
    origin: Station,
    destination: Station,
    date: string,
    departureTime: string,
    arrivalTime: string,
    trainType: TrainType,
    transfers: number
  ): any[] {
    const trainNumber = this.generateTrainNumber(trainType);
    const operator = TRAIN_OPERATORS[trainType]?.name || 'Unknown';
    
    if (transfers === 0) {
      return [{
        trainNumber,
        trainType,
        operator,
        origin: origin.name,
        destination: destination.name,
        departureTime: `${date}T${departureTime}:00`,
        arrivalTime: `${date}T${arrivalTime}:00`,
      }];
    }
    
    // For now, simplified - would need intermediate stations for real transfers
    return [{
      trainNumber,
      trainType,
      operator,
      origin: origin.name,
      destination: destination.name,
      departureTime: `${date}T${departureTime}:00`,
      arrivalTime: `${date}T${arrivalTime}:00`,
    }];
  }
  
  // Generate realistic train numbers
  private generateTrainNumber(trainType: TrainType): string {
    const prefixes: Record<TrainType, string> = {
      TGV: 'TGV',
      ICE: 'ICE',
      FRECCIAROSSA: 'FR',
      FRECCIARGENTO: 'FA',
      AVE: 'AVE',
      EUROSTAR: 'ES',
      THALYS: 'THA',
      INTERCITY: 'IC',
      REGIONAL: 'RE',
      NIGHTJET: 'NJ',
      TGV_LYRIA: 'TGV',
      RENFE: 'AVE',
      SBB: 'IC',
      OBB: 'RJ',
      NS: 'IC',
      DB: 'ICE',
    };
    
    const prefix = prefixes[trainType] || 'TR';
    const number = Math.floor(Math.random() * 9000) + 1000;
    return `${prefix} ${number}`;
  }
  
  // Get full journey details with prices
  getJourneyDetails(journeyId: string, passengerCount: number): Journey | null {
    // In real implementation, this would fetch from cache or ERA API
    // For mock, we generate based on ID
    return null; // Simplified for now
  }
}

interface RouteInfo {
  trainTypes: TrainType[];
  baseDuration: number;
  basePrice: number;
  transfers: number;
}