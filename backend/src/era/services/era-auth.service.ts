import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EraAuthResponse, EraTokenCache, EraApiConfig } from '../interfaces/era-api.types';

@Injectable()
export class EraAuthService {
  private readonly logger = new Logger(EraAuthService.name);
  private tokenCache: EraTokenCache | null = null;
  private readonly config: EraApiConfig;

  constructor(private configService: ConfigService) {
    this.config = {
      authUrl: this.configService.get<string>('ERA_AUTH_URL', 'https://authent-sandbox.era.raileurope.com'),
      apiUrl: this.configService.get<string>('ERA_API_URL', 'https://api-sandbox.era.raileurope.com'),
      clientId: this.configService.get<string>('ERA_CLIENT_ID', ''),
      clientSecret: this.configService.get<string>('ERA_CLIENT_SECRET', ''),
      pointOfSale: this.configService.get<string>('ERA_POINT_OF_SALE', ''),
      mockMode: this.configService.get<string>('ERA_MOCK_MODE', 'true') === 'true',
    };
  }

  /**
   * Config'i döndürür (mock mode kontrolü için)
   */
  getConfig(): EraApiConfig {
    return this.config;
  }

  /**
   * Mock mode aktif mi?
   */
  isMockMode(): boolean {
    return this.config.mockMode || !this.config.clientId;
  }

  /**
   * Geçerli token'ı döndürür, yoksa yeni alır
   */
  async getToken(): Promise<string> {
    // Mock mode'da fake token döndür
    if (this.isMockMode()) {
      this.logger.debug('Mock mode - returning fake token');
      return 'mock-token-for-development';
    }

    // Cache'te geçerli token var mı?
    if (this.tokenCache && this.isTokenValid()) {
      this.logger.debug('Using cached token');
      return this.tokenCache.token;
    }

    // Yeni token al
    return this.refreshToken();
  }

  /**
   * Token'ın hala geçerli olup olmadığını kontrol eder
   * 5 dakika erken expire ettirir (güvenlik marjı)
   */
  private isTokenValid(): boolean {
    if (!this.tokenCache) return false;
    
    const now = new Date();
    const expiresAt = new Date(this.tokenCache.expiresAt);
    const marginMs = 5 * 60 * 1000; // 5 dakika
    
    return now.getTime() < (expiresAt.getTime() - marginMs);
  }

  /**
   * Yeni token alır ve cache'ler
   */
  private async refreshToken(): Promise<string> {
    this.logger.log('Refreshing ERA API token...');

    try {
      const response = await fetch(`${this.config.authUrl}/oauth2/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'client_credentials',
          client_id: this.config.clientId,
          client_secret: this.config.clientSecret,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error(`Token request failed: ${response.status} - ${errorText}`);
        throw new Error(`ERA Auth failed: ${response.status}`);
      }

      const data: EraAuthResponse = await response.json();
      
      // Token'ı cache'le
      const expiresInMs = parseInt(data.expires_in) * 1000;
      this.tokenCache = {
        token: data.access_token,
        expiresAt: new Date(Date.now() + expiresInMs),
      };

      this.logger.log(`Token refreshed, expires at: ${this.tokenCache.expiresAt.toISOString()}`);
      
      return data.access_token;
    } catch (error) {
      this.logger.error('Failed to refresh token', error);
      throw error;
    }
  }

  /**
   * API istekleri için header'ları döndürür
   */
  async getHeaders(correlationId?: string): Promise<Record<string, string>> {
    const token = await this.getToken();
    
    const headers: Record<string, string> = {
      'Authorization': `Bearer ${token}`,
      'X-Point-Of-Sale': this.config.pointOfSale,
      'Content-Type': 'application/json',
    };

    if (correlationId) {
      headers['X-CorrelationId'] = correlationId;
    }

    return headers;
  }

  /**
   * Token cache'ini temizler (test/debug için)
   */
  clearCache(): void {
    this.tokenCache = null;
    this.logger.log('Token cache cleared');
  }
}
