import { Injectable, Logger } from '@nestjs/common';
import { EraAuthService } from './era-auth.service';
import { EraMockService } from '../mock/era-mock.service';
import { 
  EraPlace, 
  EraPlaceAutocompleteParams,
} from '../interfaces/era-api.types';

@Injectable()
export class EraPlacesService {
  private readonly logger = new Logger(EraPlacesService.name);
  
  // Places cache - haftalık güncelleme yeterli
  private placesCache: EraPlace[] = [];
  private placesCacheTime: Date | null = null;
  private readonly CACHE_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 gün

  constructor(
    private authService: EraAuthService,
    private mockService: EraMockService,
  ) {}

  /**
   * İstasyon/şehir autocomplete araması
   */
  async autocomplete(params: EraPlaceAutocompleteParams): Promise<EraPlace[]> {
    // Mock mode
    if (this.authService.isMockMode()) {
      this.logger.debug(`Mock autocomplete: ${params.query}`);
      return this.mockService.searchPlaces(params.query, params.size || 10, params.type);
    }

    // Real API
    const config = this.authService.getConfig();
    const headers = await this.authService.getHeaders();

    const queryParams = new URLSearchParams({
      query: params.query,
      size: String(params.size || 10),
    });

    if (params.type) queryParams.set('type', params.type);
    if (params.boost) queryParams.set('boost', params.boost);

    try {
      const response = await fetch(
        `${config.apiUrl}/places/autocomplete?${queryParams}`,
        { method: 'GET', headers }
      );

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error(`Autocomplete failed: ${response.status} - ${errorText}`);
        throw new Error(`Places autocomplete failed: ${response.status}`);
      }

      const places: EraPlace[] = await response.json();
      this.logger.debug(`Found ${places.length} places for query: ${params.query}`);
      
      return places;
    } catch (error) {
      this.logger.error('Autocomplete error', error);
      throw error;
    }
  }

  /**
   * Tüm yerleri getirir (cache'li)
   */
  async getAllPlaces(forceRefresh = false): Promise<EraPlace[]> {
    // Cache kontrolü
    if (!forceRefresh && this.isCacheValid()) {
      this.logger.debug('Returning cached places');
      return this.placesCache;
    }

    // Mock mode
    if (this.authService.isMockMode()) {
      this.logger.debug('Mock getAllPlaces');
      this.placesCache = this.mockService.getAllPlaces();
      this.placesCacheTime = new Date();
      return this.placesCache;
    }

    // Real API
    const config = this.authService.getConfig();
    const headers = await this.authService.getHeaders();

    try {
      this.logger.log('Fetching all places from ERA API...');
      
      const response = await fetch(
        `${config.apiUrl}/places`,
        { method: 'GET', headers }
      );

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error(`GetAllPlaces failed: ${response.status} - ${errorText}`);
        throw new Error(`Get all places failed: ${response.status}`);
      }

      this.placesCache = await response.json();
      this.placesCacheTime = new Date();
      
      this.logger.log(`Cached ${this.placesCache.length} places`);
      
      return this.placesCache;
    } catch (error) {
      this.logger.error('GetAllPlaces error', error);
      throw error;
    }
  }

  /**
   * Place code ile yer bul (cache'ten)
   */
  async getPlaceByCode(code: string): Promise<EraPlace | null> {
    // Cache boşsa doldur
    if (this.placesCache.length === 0) {
      await this.getAllPlaces();
    }

    return this.placesCache.find(p => p.code === code) || null;
  }

  /**
   * Place ID ile yer bul (cache'ten)
   */
  async getPlaceById(id: string): Promise<EraPlace | null> {
    // Cache boşsa doldur
    if (this.placesCache.length === 0) {
      await this.getAllPlaces();
    }

    return this.placesCache.find(p => p.id === id) || null;
  }

  /**
   * Cache'in geçerli olup olmadığını kontrol eder
   */
  private isCacheValid(): boolean {
    if (!this.placesCacheTime || this.placesCache.length === 0) {
      return false;
    }

    const now = new Date();
    const cacheAge = now.getTime() - this.placesCacheTime.getTime();
    
    return cacheAge < this.CACHE_DURATION_MS;
  }

  /**
   * Cache'i temizle
   */
  clearCache(): void {
    this.placesCache = [];
    this.placesCacheTime = null;
    this.logger.log('Places cache cleared');
  }

  /**
   * Cache durumunu döndür
   */
  getCacheStatus(): { count: number; cachedAt: Date | null; isValid: boolean } {
    return {
      count: this.placesCache.length,
      cachedAt: this.placesCacheTime,
      isValid: this.isCacheValid(),
    };
  }
}
