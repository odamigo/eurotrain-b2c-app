import { Injectable, Logger } from '@nestjs/common';
import { EraAuthService } from './era-auth.service';
import { EraMockService } from '../mock/era-mock.service';
import { 
  EraSearchRequest,
  EraSearchResponse,
  EraLegRequest,
  EraTravelerRequest,
  EraOffer,
  EraLegSolution,
} from '../interfaces/era-api.types';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class EraSearchService {
  private readonly logger = new Logger(EraSearchService.name);
  
  // Search cache - kısa süreli (15-30 dk)
  private searchCache: Map<string, { response: EraSearchResponse; expiresAt: Date }> = new Map();

  constructor(
    private authService: EraAuthService,
    private mockService: EraMockService,
  ) {}

  /**
   * Point-to-point sefer araması
   */
  async searchJourneys(request: EraSearchRequest): Promise<EraSearchResponse> {
    const correlationId = uuidv4();
    this.logger.log(`Search request [${correlationId}]: ${JSON.stringify(request.legs[0])}`);

    // Mock mode
    if (this.authService.isMockMode()) {
      this.logger.debug('Mock search mode');
      return this.mockService.searchJourneys(request);
    }

    // Real API
    const config = this.authService.getConfig();
    const headers = await this.authService.getHeaders(correlationId);

    try {
      const response = await fetch(
        `${config.apiUrl}/offers/point-to-point/searches`,
        {
          method: 'POST',
          headers,
          body: JSON.stringify(request),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        this.logger.error(`Search failed: ${response.status}`, errorData);
        throw new Error(`Search failed: ${response.status} - ${errorData.label || 'Unknown error'}`);
      }

      const searchResponse: EraSearchResponse = await response.json();
      
      // Cache'e kaydet
      if (searchResponse.id) {
        this.cacheSearchResponse(searchResponse.id, searchResponse);
      }

      this.logger.log(`Search completed [${correlationId}]: ${searchResponse.offers?.length || 0} offers found`);
      
      return searchResponse;
    } catch (error) {
      this.logger.error(`Search error [${correlationId}]`, error);
      throw error;
    }
  }

  /**
   * Sonraki/önceki sayfayı getir (pagination)
   */
  async getAdditionalOffers(searchId: string, page: 'next' | 'previous'): Promise<EraSearchResponse> {
    this.logger.log(`Getting ${page} page for search: ${searchId}`);

    // Mock mode
    if (this.authService.isMockMode()) {
      return this.mockService.getAdditionalOffers(searchId, page);
    }

    // Real API
    const config = this.authService.getConfig();
    const headers = await this.authService.getHeaders();

    try {
      const response = await fetch(
        `${config.apiUrl}/offers/point-to-point/searches/${searchId}?page=${page}`,
        {
          method: 'POST',
          headers,
        }
      );

      if (!response.ok) {
        throw new Error(`Get additional offers failed: ${response.status}`);
      }

      const searchResponse: EraSearchResponse = await response.json();
      
      // Cache'i güncelle
      this.cacheSearchResponse(searchId, searchResponse);
      
      return searchResponse;
    } catch (error) {
      this.logger.error('Get additional offers error', error);
      throw error;
    }
  }

  /**
   * Önceki aramayı getir (cache veya API)
   */
  async getSearchById(searchId: string): Promise<EraSearchResponse | null> {
    // Önce cache'e bak
    const cached = this.searchCache.get(searchId);
    if (cached && cached.expiresAt > new Date()) {
      this.logger.debug(`Returning cached search: ${searchId}`);
      return cached.response;
    }

    // Mock mode
    if (this.authService.isMockMode()) {
      return null; // Mock'ta persistence yok
    }

    // Real API
    const config = this.authService.getConfig();
    const headers = await this.authService.getHeaders();

    try {
      const response = await fetch(
        `${config.apiUrl}/offers/point-to-point/searches/${searchId}`,
        { method: 'GET', headers }
      );

      if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error(`Get search failed: ${response.status}`);
      }

      const searchResponse: EraSearchResponse = await response.json();
      this.cacheSearchResponse(searchId, searchResponse);
      
      return searchResponse;
    } catch (error) {
      this.logger.error('Get search by ID error', error);
      throw error;
    }
  }

  /**
   * Tek bir offer detayını getir
   */
  async getOfferById(searchId: string, offerId: string): Promise<EraOffer | null> {
    // Önce cache'ten ara
    const search = await this.getSearchById(searchId);
    if (search) {
      return search.offers?.find(o => o.id === offerId) || null;
    }

    // Mock mode
    if (this.authService.isMockMode()) {
      return this.mockService.getOfferById(searchId, offerId);
    }

    // Real API
    const config = this.authService.getConfig();
    const headers = await this.authService.getHeaders();

    try {
      const response = await fetch(
        `${config.apiUrl}/offers/point-to-point/searches/${searchId}/offers/${offerId}`,
        { method: 'GET', headers }
      );

      if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error(`Get offer failed: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      this.logger.error('Get offer by ID error', error);
      throw error;
    }
  }

  /**
   * Search response'u cache'e kaydet
   */
  private cacheSearchResponse(searchId: string, response: EraSearchResponse): void {
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 dakika
    this.searchCache.set(searchId, { response, expiresAt });
    
    // Eski cache'leri temizle
    this.cleanExpiredCache();
  }

  /**
   * Süresi dolmuş cache'leri temizle
   */
  private cleanExpiredCache(): void {
    const now = new Date();
    for (const [key, value] of this.searchCache.entries()) {
      if (value.expiresAt < now) {
        this.searchCache.delete(key);
      }
    }
  }

  /**
   * Basit arama için helper method
   */
  async simpleSearch(
    origin: string,
    destination: string,
    departureDate: string,
    passengers: { adults: number; children?: number; youths?: number; seniors?: number }
  ): Promise<EraSearchResponse> {
    // Traveler listesi oluştur
    const travelers: EraTravelerRequest[] = [];
    
    for (let i = 0; i < passengers.adults; i++) {
      travelers.push({ type: 'ADULT' });
    }
    for (let i = 0; i < (passengers.children || 0); i++) {
      travelers.push({ type: 'CHILD' });
    }
    for (let i = 0; i < (passengers.youths || 0); i++) {
      travelers.push({ type: 'YOUTH' });
    }
    for (let i = 0; i < (passengers.seniors || 0); i++) {
      travelers.push({ type: 'SENIOR' });
    }

    const request: EraSearchRequest = {
      legs: [{
        departure: origin,
        arrival: destination,
        departureTime: departureDate,
      }],
      travelers,
    };

    return this.searchJourneys(request);
  }

  /**
   * Cache durumunu döndür
   */
  getCacheStatus(): { count: number; searches: string[] } {
    return {
      count: this.searchCache.size,
      searches: Array.from(this.searchCache.keys()),
    };
  }

  /**
   * Cache'i temizle
   */
  clearCache(): void {
    this.searchCache.clear();
    this.logger.log('Search cache cleared');
  }
}
