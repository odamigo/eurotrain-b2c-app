import { 
  Controller, 
  Get, 
  Post, 
  Put,
  Delete,
  Query, 
  Param, 
  Body, 
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { EraPlacesService } from './services/era-places.service';
import { EraSearchService } from './services/era-search.service';
import { EraBookingService } from './services/era-booking.service';
import { EraRefundService } from './services/era-refund.service';
import { EraAuthService } from './services/era-auth.service';

// DTOs
import { SearchJourneysDto } from './dto/search-journeys.dto';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateTravelersDto } from './dto/update-travelers.dto';

@Controller('era')
export class EraController {
  constructor(
    private readonly authService: EraAuthService,
    private readonly placesService: EraPlacesService,
    private readonly searchService: EraSearchService,
    private readonly bookingService: EraBookingService,
    private readonly refundService: EraRefundService,
  ) {}

  // ============================================================
  // PLACES
  // ============================================================

  /**
   * GET /era/places/autocomplete?query=paris&size=10&type=city
   */
  @Get('places/autocomplete')
  async autocomplete(
    @Query('query') query: string,
    @Query('size') size?: string,
    @Query('type') type?: 'city' | 'station',
    @Query('boost') boost?: 'city' | 'station',
  ) {
    if (!query || query.length < 2) {
      throw new BadRequestException('Query must be at least 2 characters');
    }

    const places = await this.placesService.autocomplete({
      query,
      size: size ? parseInt(size) : 10,
      type,
      boost,
    });

    return {
      success: true,
      count: places.length,
      places,
    };
  }

  /**
   * GET /era/places
   */
  @Get('places')
  async getAllPlaces(@Query('refresh') refresh?: string) {
    const places = await this.placesService.getAllPlaces(refresh === 'true');
    
    return {
      success: true,
      count: places.length,
      cacheStatus: this.placesService.getCacheStatus(),
      places,
    };
  }

  /**
   * GET /era/places/:code
   */
  @Get('places/:code')
  async getPlaceByCode(@Param('code') code: string) {
    const place = await this.placesService.getPlaceByCode(code);
    
    if (!place) {
      throw new NotFoundException('Place not found');
    }

    return {
      success: true,
      place,
    };
  }

  // ============================================================
  // SEARCH
  // ============================================================

  /**
   * POST /era/search
   */
  @Post('search')
  async searchJourneys(@Body() dto: SearchJourneysDto) {
    if (!dto.origin || !dto.destination || !dto.departureDate) {
      throw new BadRequestException('Origin, destination and departureDate are required');
    }

    const results = await this.searchService.simpleSearch(
      dto.origin,
      dto.destination,
      dto.departureDate,
      {
        adults: dto.adults || 1,
        children: dto.children,
        youths: dto.youths,
        seniors: dto.seniors,
      }
    );

    return {
      success: true,
      searchId: results.id,
      origin: results.legs[0]?.origin,
      destination: results.legs[0]?.destination,
      offersCount: results.offers?.length || 0,
      ...results,
    };
  }

  /**
   * GET /era/search/:searchId
   */
  @Get('search/:searchId')
  async getSearch(@Param('searchId') searchId: string) {
    const results = await this.searchService.getSearchById(searchId);
    
    if (!results) {
      throw new NotFoundException('Search not found or expired');
    }

    return {
      success: true,
      ...results,
    };
  }

  /**
   * POST /era/search/:searchId?page=next|previous
   */
  @Post('search/:searchId')
  async getAdditionalOffers(
    @Param('searchId') searchId: string,
    @Query('page') page: 'next' | 'previous',
  ) {
    if (!page || !['next', 'previous'].includes(page)) {
      throw new BadRequestException('page query parameter must be "next" or "previous"');
    }

    const results = await this.searchService.getAdditionalOffers(searchId, page);

    return {
      success: true,
      page,
      ...results,
    };
  }

  /**
   * GET /era/search/:searchId/offers/:offerId
   */
  @Get('search/:searchId/offers/:offerId')
  async getOffer(
    @Param('searchId') searchId: string,
    @Param('offerId') offerId: string,
  ) {
    const offer = await this.searchService.getOfferById(searchId, offerId);
    
    if (!offer) {
      throw new NotFoundException('Offer not found');
    }

    return {
      success: true,
      offer,
    };
  }

  // ============================================================
  // BOOKING
  // ============================================================

  /**
   * POST /era/bookings
   */
  @Post('bookings')
  async createBooking(@Body() dto: CreateBookingDto) {
    if (!dto.offerLocations || dto.offerLocations.length === 0) {
      throw new BadRequestException('At least one offerLocation is required');
    }

    const booking = await this.bookingService.createBooking(dto.offerLocations);

    return {
      success: true,
      message: 'Booking created',
      booking,
    };
  }

  /**
   * GET /era/bookings/:bookingId
   */
  @Get('bookings/:bookingId')
  async getBooking(
    @Param('bookingId') bookingId: string,
    @Query('refresh') refresh?: string,
  ) {
    const booking = await this.bookingService.getBooking(bookingId, refresh === 'true');

    return {
      success: true,
      booking,
    };
  }

  /**
   * PUT /era/bookings/:bookingId/items/:itemId/travelers
   */
  @Put('bookings/:bookingId/items/:itemId/travelers')
  async updateTravelers(
    @Param('bookingId') bookingId: string,
    @Param('itemId') itemId: string,
    @Body() dto: UpdateTravelersDto,
  ) {
    if (!dto.travelers || dto.travelers.length === 0) {
      throw new BadRequestException('At least one traveler is required');
    }

    const booking = await this.bookingService.updateTravelers(
      bookingId,
      itemId,
      dto.travelers,
    );

    return {
      success: true,
      message: 'Travelers updated',
      booking,
    };
  }

  /**
   * POST /era/bookings/:bookingId/prebook
   */
  @Post('bookings/:bookingId/prebook')
  async prebook(@Param('bookingId') bookingId: string) {
    const booking = await this.bookingService.prebook(bookingId);

    return {
      success: true,
      message: 'Booking prebooked',
      booking,
    };
  }

  /**
   * POST /era/bookings/:bookingId/confirm
   */
  @Post('bookings/:bookingId/confirm')
  async confirm(@Param('bookingId') bookingId: string) {
    const booking = await this.bookingService.confirm(bookingId);

    return {
      success: true,
      message: 'Booking confirmed',
      booking,
    };
  }

  /**
   * POST /era/bookings/:bookingId/hold
   */
  @Post('bookings/:bookingId/hold')
  async hold(@Param('bookingId') bookingId: string) {
    const booking = await this.bookingService.hold(bookingId);

    return {
      success: true,
      message: 'Booking held',
      booking,
    };
  }

  /**
   * POST /era/bookings/:bookingId/print
   */
  @Post('bookings/:bookingId/print')
  async printTickets(
    @Param('bookingId') bookingId: string,
    @Body('format') format?: 'PDF' | 'PKPASS',
  ) {
    const result = await this.bookingService.printTickets(bookingId, format || 'PDF');

    return {
      success: true,
      message: 'Tickets generated',
      ...result,
    };
  }

  /**
   * DELETE /era/bookings/:bookingId/items/:itemId
   */
  @Delete('bookings/:bookingId/items/:itemId')
  async deleteItem(
    @Param('bookingId') bookingId: string,
    @Param('itemId') itemId: string,
  ) {
    const booking = await this.bookingService.deleteItem(bookingId, itemId);

    return {
      success: true,
      message: 'Item deleted',
      booking,
    };
  }

  // ============================================================
  // REFUND & EXCHANGE
  // ============================================================

  /**
   * POST /era/bookings/:bookingId/refund/quotation
   */
  @Post('bookings/:bookingId/refund/quotation')
  async getRefundQuotation(
    @Param('bookingId') bookingId: string,
    @Body('items') items?: string[],
  ) {
    const quotation = await this.refundService.getRefundQuotation(bookingId, items);

    return {
      success: true,
      quotation,
    };
  }

  /**
   * POST /era/bookings/:bookingId/refund/confirm
   */
  @Post('bookings/:bookingId/refund/confirm')
  async confirmRefund(
    @Param('bookingId') bookingId: string,
    @Body('quotationId') quotationId: string,
  ) {
    if (!quotationId) {
      throw new BadRequestException('quotationId is required');
    }

    const result = await this.refundService.confirmRefund(bookingId, quotationId);

    return {
      success: true,
      message: 'Refund confirmed',
      ...result,
    };
  }

  // ============================================================
  // STATUS & DEBUG
  // ============================================================

  /**
   * GET /era/status
   */
  @Get('status')
  async getStatus() {
    return {
      success: true,
      mode: this.authService.isMockMode() ? 'MOCK' : 'LIVE',
      caches: {
        places: this.placesService.getCacheStatus(),
        searches: this.searchService.getCacheStatus(),
      },
    };
  }

  /**
   * POST /era/cache/clear
   */
  @Post('cache/clear')
  async clearCache() {
    this.placesService.clearCache();
    this.searchService.clearCache();
    this.authService.clearCache();

    return {
      success: true,
      message: 'All caches cleared',
    };
  }
}
