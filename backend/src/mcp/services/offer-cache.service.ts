import { Injectable, Logger } from '@nestjs/common';
import * as crypto from 'crypto';

// ============================================================
// TYPES
// ============================================================

export interface CachedOffer {
  offer_ref: string;
  offer_location: string;  // ERA API offer path
  search_id: string;
  
  // Journey details
  origin_code: string;
  origin_name: string;
  destination_code: string;
  destination_name: string;
  departure: string;        // ISO datetime
  arrival: string;          // ISO datetime
  duration_minutes: number;
  
  // Train details
  operator: string;
  operator_code: string;
  train_number: string;
  comfort_class: string;
  
  // Price
  price: number;
  currency: string;
  
  // Conditions
  is_refundable: boolean;
  is_exchangeable: boolean;
  
  // Metadata
  created_at: Date;
  expires_at: Date;
  
  // Passenger context
  adults: number;
  children: number;
}

export interface SearchResult {
  search_id: string;
  offers: CachedOffer[];
  created_at: Date;
  expires_at: Date;
}

// ============================================================
// CONSTANTS
// ============================================================

const OFFER_TTL_MINUTES = 15;  // Offers expire after 15 minutes
const CLEANUP_INTERVAL_MS = 60 * 1000;  // Cleanup every minute
const MAX_OFFERS_PER_SEARCH = 50;  // Limit offers per search

// ============================================================
// SERVICE
// ============================================================

@Injectable()
export class OfferCacheService {
  private readonly logger = new Logger(OfferCacheService.name);
  
  // In-memory caches
  private offerCache: Map<string, CachedOffer> = new Map();
  private searchCache: Map<string, SearchResult> = new Map();
  
  constructor() {
    // Start cleanup interval
    setInterval(() => this.cleanupExpired(), CLEANUP_INTERVAL_MS);
    this.logger.log('OfferCacheService initialized with in-memory storage');
  }

  // ============================================================
  // PUBLIC METHODS
  // ============================================================

  /**
   * Generate unique offer reference (hash)
   * This hides the actual ERA offer_location from AI/logs
   */
  generateOfferRef(offerLocation: string, searchId: string): string {
    const hash = crypto
      .createHash('sha256')
      .update(`${offerLocation}:${searchId}:${Date.now()}`)
      .digest('hex')
      .substring(0, 16);
    return `offer_${hash}`;
  }

  /**
   * Generate unique search ID
   */
  generateSearchId(): string {
    const hash = crypto.randomBytes(8).toString('hex');
    return `search_${hash}`;
  }

  /**
   * Cache a search result with multiple offers
   */
  cacheSearchResult(
    searchId: string,
    offers: Omit<CachedOffer, 'offer_ref' | 'created_at' | 'expires_at'>[]
  ): SearchResult {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + OFFER_TTL_MINUTES * 60 * 1000);
    
    const cachedOffers: CachedOffer[] = offers.slice(0, MAX_OFFERS_PER_SEARCH).map(offer => {
      const offerRef = this.generateOfferRef(offer.offer_location, searchId);
      
      const cachedOffer: CachedOffer = {
        ...offer,
        offer_ref: offerRef,
        search_id: searchId,
        created_at: now,
        expires_at: expiresAt,
      };
      
      // Cache individual offer
      this.offerCache.set(offerRef, cachedOffer);
      
      return cachedOffer;
    });

    const searchResult: SearchResult = {
      search_id: searchId,
      offers: cachedOffers,
      created_at: now,
      expires_at: expiresAt,
    };

    // Cache search result
    this.searchCache.set(searchId, searchResult);
    
    this.logger.debug(
      `Cached ${cachedOffers.length} offers for search ${searchId}, expires at ${expiresAt.toISOString()}`
    );

    return searchResult;
  }

  /**
   * Get offer by reference
   */
  getOffer(offerRef: string): CachedOffer | null {
    const offer = this.offerCache.get(offerRef);
    
    if (!offer) {
      this.logger.debug(`Offer not found: ${offerRef}`);
      return null;
    }
    
    if (new Date() > offer.expires_at) {
      this.logger.debug(`Offer expired: ${offerRef}`);
      this.offerCache.delete(offerRef);
      return null;
    }
    
    return offer;
  }

  /**
   * Get search result by ID
   */
  getSearchResult(searchId: string): SearchResult | null {
    const search = this.searchCache.get(searchId);
    
    if (!search) {
      return null;
    }
    
    if (new Date() > search.expires_at) {
      this.searchCache.delete(searchId);
      return null;
    }
    
    return search;
  }

  /**
   * Check if offer is still valid
   */
  isOfferValid(offerRef: string): boolean {
    const offer = this.getOffer(offerRef);
    return offer !== null;
  }

  /**
   * Get remaining TTL for an offer in seconds
   */
  getOfferTTL(offerRef: string): number {
    const offer = this.offerCache.get(offerRef);
    if (!offer) return 0;
    
    const remaining = offer.expires_at.getTime() - Date.now();
    return Math.max(0, Math.floor(remaining / 1000));
  }

  /**
   * Get cache statistics
   */
  getStats(): { offers: number; searches: number } {
    return {
      offers: this.offerCache.size,
      searches: this.searchCache.size,
    };
  }

  // ============================================================
  // PRIVATE METHODS
  // ============================================================

  private cleanupExpired(): void {
    const now = new Date();
    let expiredOffers = 0;
    let expiredSearches = 0;

    // Cleanup expired offers
    for (const [key, offer] of this.offerCache.entries()) {
      if (now > offer.expires_at) {
        this.offerCache.delete(key);
        expiredOffers++;
      }
    }

    // Cleanup expired searches
    for (const [key, search] of this.searchCache.entries()) {
      if (now > search.expires_at) {
        this.searchCache.delete(key);
        expiredSearches++;
      }
    }

    if (expiredOffers > 0 || expiredSearches > 0) {
      this.logger.debug(
        `Cleanup: removed ${expiredOffers} expired offers, ${expiredSearches} expired searches`
      );
    }
  }
}
