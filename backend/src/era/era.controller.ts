import { Controller, Get, Post, Query, Param, Body, BadRequestException } from '@nestjs/common';
import { EraMockService } from './era-mock.service';
import { SearchJourneyDto, SearchStationDto } from './dto/search-journey.dto';

@Controller('era')
export class EraController {
  constructor(private readonly eraMockService: EraMockService) {}

  // GET /era/stations/search?query=paris&limit=10&country=FR
  @Get('stations/search')
  searchStations(
    @Query('query') query: string,
    @Query('limit') limit?: string,
    @Query('country') country?: string,
  ) {
    if (!query || query.length < 2) {
      throw new BadRequestException('Query must be at least 2 characters');
    }
    
    const stations = this.eraMockService.searchStations(
      query,
      limit ? parseInt(limit) : 10,
      country,
    );
    
    return {
      success: true,
      count: stations.length,
      stations,
    };
  }

  // GET /era/stations/:id
  @Get('stations/:id')
  getStation(@Param('id') id: string) {
    const station = this.eraMockService.getStation(id);
    
    if (!station) {
      throw new BadRequestException('Station not found');
    }
    
    return {
      success: true,
      station,
    };
  }

  // POST /era/journeys/search
  @Post('journeys/search')
  searchJourneys(@Body() dto: SearchJourneyDto) {
    if (!dto.origin || !dto.destination) {
      throw new BadRequestException('Origin and destination are required');
    }
    
    if (!dto.departureDate) {
      throw new BadRequestException('Departure date is required');
    }
    
    if (!dto.passengers || !dto.passengers.adults || dto.passengers.adults < 1) {
      throw new BadRequestException('At least one adult passenger is required');
    }
    
    try {
      const results = this.eraMockService.searchJourneys(dto);
      
      return {
        success: true,
        ...results,
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // GET /era/journeys/:id - Get journey details
  @Get('journeys/:id')
  getJourneyDetails(
    @Param('id') id: string,
    @Query('passengers') passengers?: string,
  ) {
    const passengerCount = passengers ? parseInt(passengers) : 1;
    
    // For MVP, return mock details
    return {
      success: true,
      journey: {
        id,
        message: 'Journey details - will be implemented with full booking flow',
      },
    };
  }

  // GET /era/operators - List all train operators
  @Get('operators')
  getOperators() {
    const operators = [
      { code: 'TGV', name: 'TGV inOui', country: 'France', logo: '/images/operators/tgv.png' },
      { code: 'ICE', name: 'Deutsche Bahn ICE', country: 'Germany', logo: '/images/operators/db.png' },
      { code: 'FRECCIAROSSA', name: 'Trenitalia Frecciarossa', country: 'Italy', logo: '/images/operators/trenitalia.png' },
      { code: 'AVE', name: 'Renfe AVE', country: 'Spain', logo: '/images/operators/renfe.png' },
      { code: 'EUROSTAR', name: 'Eurostar', country: 'International', logo: '/images/operators/eurostar.png' },
      { code: 'THALYS', name: 'Thalys', country: 'International', logo: '/images/operators/thalys.png' },
      { code: 'SBB', name: 'SBB', country: 'Switzerland', logo: '/images/operators/sbb.png' },
      { code: 'OBB', name: 'ÖBB', country: 'Austria', logo: '/images/operators/obb.png' },
      { code: 'NS', name: 'NS International', country: 'Netherlands', logo: '/images/operators/ns.png' },
      { code: 'NIGHTJET', name: 'ÖBB Nightjet', country: 'Austria', logo: '/images/operators/nightjet.png' },
    ];
    
    return {
      success: true,
      operators,
    };
  }

  // GET /era/countries - List supported countries
  @Get('countries')
  getCountries() {
    const countries = [
      { code: 'FR', name: 'France', flag: '🇫🇷' },
      { code: 'DE', name: 'Germany', flag: '🇩🇪' },
      { code: 'IT', name: 'Italy', flag: '🇮🇹' },
      { code: 'ES', name: 'Spain', flag: '🇪🇸' },
      { code: 'NL', name: 'Netherlands', flag: '🇳🇱' },
      { code: 'BE', name: 'Belgium', flag: '🇧🇪' },
      { code: 'CH', name: 'Switzerland', flag: '🇨🇭' },
      { code: 'AT', name: 'Austria', flag: '🇦🇹' },
      { code: 'GB', name: 'United Kingdom', flag: '🇬🇧' },
    ];
    
    return {
      success: true,
      countries,
    };
  }

  // GET /era/popular-routes - Popular routes for homepage
  @Get('popular-routes')
  getPopularRoutes() {
    const routes = [
      { origin: 'FRPAR', destination: 'GBLON', originName: 'Paris', destinationName: 'London', fromPrice: 89, currency: 'EUR', trainType: 'EUROSTAR', duration: 136 },
      { origin: 'FRPAR', destination: 'NLAMS', originName: 'Paris', destinationName: 'Amsterdam', fromPrice: 89, currency: 'EUR', trainType: 'THALYS', duration: 195 },
      { origin: 'FRPAR', destination: 'ESBAR', originName: 'Paris', destinationName: 'Barcelona', fromPrice: 109, currency: 'EUR', trainType: 'TGV', duration: 390 },
      { origin: 'ITROM', destination: 'ITMIL', originName: 'Rome', destinationName: 'Milan', fromPrice: 69, currency: 'EUR', trainType: 'FRECCIAROSSA', duration: 175 },
      { origin: 'DEBER', destination: 'DEMUC', originName: 'Berlin', destinationName: 'Munich', fromPrice: 89, currency: 'EUR', trainType: 'ICE', duration: 240 },
      { origin: 'ESMAD', destination: 'ESBAR', originName: 'Madrid', destinationName: 'Barcelona', fromPrice: 69, currency: 'EUR', trainType: 'AVE', duration: 155 },
      { origin: 'CHZRH', destination: 'FRPAR', originName: 'Zurich', destinationName: 'Paris', fromPrice: 99, currency: 'EUR', trainType: 'TGV_LYRIA', duration: 240 },
      { origin: 'ATVIE', destination: 'DEMUC', originName: 'Vienna', destinationName: 'Munich', fromPrice: 69, currency: 'EUR', trainType: 'OBB', duration: 240 },
    ];
    
    return {
      success: true,
      routes,
    };
  }
}