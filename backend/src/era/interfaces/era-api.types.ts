// ============================================================
// ERA API TypeScript Interfaces
// EuroTrain B2C Platform
// Generated from OpenAPI Specifications
// ============================================================

// ============================================================
// COMMON TYPES
// ============================================================

export interface EraResource {
  id?: string;
  errors?: EraResourceError[];
  warnings?: EraResourceError[];
}

export interface EraResourceError {
  code?: string;
  label?: string;
  type?: 'technical' | 'functional';
  details?: string[];
  causes?: EraCauseError[];
}

export interface EraCauseError {
  code?: string;
  label?: string;
  type?: 'technical' | 'functional';
  details?: string[];
}

export interface EraPrice {
  amount: number;
  currency: string;
}

export interface EraPrices {
  total?: EraPrice;
  base?: EraPrice;
  fees?: EraPrice;
  discount?: EraPrice;
}

export interface EraLocation {
  lat: number;
  lon: number;
}

// ============================================================
// AUTHENTICATION
// ============================================================

export interface EraAuthRequest {
  grant_type: 'client_credentials';
  client_id: string;
  client_secret: string;
}

export interface EraAuthResponse {
  access_token: string;
  token_type: 'Bearer';
  expires_in: string; // "3600"
}

export interface EraTokenCache {
  token: string;
  expiresAt: Date;
}

// ============================================================
// PLACES
// ============================================================

export interface EraCountry {
  code: string;
  label: string;
  localLabel?: string;
}

export interface EraPlace extends EraResource {
  type: 'city' | 'station';
  code: string;
  uicCode?: string;
  label: string;
  localLabel?: string;
  country?: EraCountry;
  timezone?: string;
  location?: EraLocation;
  ticketOffice?: boolean | null;
  ticketMachine?: boolean | null;
}

export interface EraPlaceAutocompleteParams {
  query: string;
  type?: 'city' | 'station';
  size?: number;
  boost?: 'city' | 'station';
}

// ============================================================
// SEARCH - REQUEST
// ============================================================

export interface EraLegRequest {
  departure: string; // Place code (e.g., "FRPAR")
  arrival: string;   // Place code (e.g., "GBLON")
  departureTime: string; // ISO 8601 datetime
}

export type EraTravelerType = 
  | 'ADULT' 
  | 'YOUTH' 
  | 'CHILD' 
  | 'INFANT' 
  | 'SENIOR';

export interface EraTravelerRequest {
  type: EraTravelerType;
  dateOfBirth?: string; // YYYY-MM-DD
  passengerCards?: EraPassengerCard[];
}

export interface EraPassengerCard {
  code: string;
  number?: string;
}

export interface EraSearchRequest {
  legs: EraLegRequest[];
  travelers: EraTravelerRequest[];
  productFilters?: string[]; // ["RIT"]
  multiProviderEnabled?: boolean;
  seatReservationOnly?: boolean;
}

// ============================================================
// SEARCH - RESPONSE
// ============================================================

export interface EraSearchResponse extends EraResource {
  pointOfSale?: string;
  legs: EraLeg[];
  travelers: EraTraveler[];
  offers: EraOffer[];
  products: EraProduct[];
  services?: EraService[];
  highlights?: EraLegSolutionHighlight[];
  multiProviderEnabled?: boolean;
}

export interface EraLeg {
  origin: EraPlace;
  destination: EraPlace;
  departure: string; // ISO 8601
  directOnly?: boolean;
  solutions: EraLegSolution[];
}

export interface EraLegSolution extends EraResource {
  origin: EraPlace;
  destination: EraPlace;
  departure: string; // ISO 8601 local time
  arrival: string;   // ISO 8601 local time
  duration: string;  // ISO 8601 duration (e.g., "PT2H30M")
  segments: EraSegment[];
  segmentConnections?: EraSegmentConnection[];
  travelerInformationRequired?: EraTravelerInformationRequired;
  offersSellableReason?: 'full_fare' | 'free' | 'supplement_at_station' | 'available_supplement_api' | 'unknown';
}

export interface EraSegment extends EraResource {
  sequenceNumber: number;
  origin: EraPlace;
  destination: EraPlace;
  departure: string;
  arrival: string;
  duration: string;
  operatingCarrier?: string;
  marketingCarrier?: string;
  supplier?: string;
  vehicle?: EraVehicle;
  type?: EraSegmentType;
  marketingInformation?: string;
  operatingCarrierRicsCode?: string;
  travelerInformationRequired?: EraTravelerInformationRequired;
}

export interface EraVehicle {
  type: 'High-Speed' | 'Inter-City' | 'Branch-Line/Regional' | 'Night-Train';
  reference?: string;
  code?: string;
  identityNameRule?: string;
  identityName?: string;
  lineName?: EraLineName;
}

export interface EraLineName {
  text?: string;
  colors?: {
    background?: string;
    font?: string;
  };
}

export interface EraSegmentType {
  label?: string;
  code?: string;
}

export interface EraSegmentConnection {
  fromSegment: string;
  toSegment: string;
  duration: string;
  type: 'TRANSFER' | 'WAIT';
}

export interface EraTravelerInformationRequired {
  defaultTravelerInformationRequired?: string[];
  travelerInformationRequiredOverride?: Record<string, string[]>;
}

export interface EraTraveler extends EraResource {
  type: EraTravelerType;
  dateOfBirth?: string;
  passengerCards?: EraPassengerCard[];
}

// ============================================================
// OFFERS & PRODUCTS
// ============================================================

export interface EraOffer extends EraResource {
  legSolution: string; // ID reference
  offerLocation: string; // Used for booking
  products?: string[]; // ID references
  prices?: EraPrices;
  comfortCategory?: EraComfortCategory;
  flexibility?: EraFlexibility;
  compatibleOffers?: string[];
  ticketingOptions?: EraTicketingOption[];
  conditions?: EraCondition[];
  globalRoundTripPrice?: boolean;
}

export type EraComfortCategory = 'standard' | 'comfort' | 'premier';

export interface EraFlexibility {
  label?: string;
  code?: string;
  refundable?: boolean;
  exchangeable?: boolean;
}

export interface EraTicketingOption {
  code: 'PAH' | 'TOD' | 'ETK' | 'PKP'; // Print At Home, Ticket On Departure, E-Ticket, etc.
  label?: string;
}

export interface EraProduct extends EraResource {
  code?: string;
  type: 'point-to-point' | 'point-to-point-reservation' | 'pass' | 'card';
  label?: string;
  description?: string;
  supplier?: string;
  marketingCarrier?: string;
  segment?: string;
  traveler?: string;
  prices?: EraPrices;
  conditions?: EraCondition[];
  externalReservation?: boolean;
  comfortCategory?: EraComfortCategory;
  flexibility?: EraFlexibility;
  fareClass?: string;
  cabinClass?: string;
  seatPreferences?: EraSeatPreference[];
}

export interface EraSeatPreference {
  code: string;
  label?: string;
  available?: boolean;
}

export interface EraCondition {
  code?: string;
  label?: string;
  description?: string;
  type?: 'REFUND' | 'EXCHANGE' | 'VALIDITY' | 'GENERAL';
  scope?: 'pax' | 'product' | 'carrier' | 'supplier' | 'global';
}

export interface EraService extends EraResource {
  code?: string;
  label?: string;
  description?: string;
  type?: string;
  included?: boolean;
  prices?: EraPrices;
}

export interface EraLegSolutionHighlight {
  legSolution: string;
  strategy?: string;
  highlights?: {
    comfort?: string;
    offers?: string[];
  }[];
}

// ============================================================
// BOOKING - CREATE
// ============================================================

export interface EraCreateBookingRequest {
  items: EraBookingItemRequest[];
}

export interface EraBookingItemRequest {
  offerLocations: string[]; // From offer.offerLocation
}

// ============================================================
// BOOKING - RESPONSE
// ============================================================

export type EraBookingStatus = 
  | 'CREATED' 
  | 'PREBOOKED' 
  | 'INVOICED' 
  | 'REFUNDED' 
  | 'PARTIALLY_REFUNDED'
  | 'CANCELLED';

export interface EraBooking extends EraResource {
  reference?: string; // ERA booking reference
  status: EraBookingStatus;
  items: EraBookingItem[];
  travelers?: EraBookingTraveler[];
  contact?: EraBookingContact;
  prices?: EraPrices;
  expiresAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface EraBookingItem extends EraResource {
  reference?: string;
  status?: string;
  legSolution?: EraLegSolution;
  products?: EraProduct[];
  travelers?: EraBookingTraveler[];
  ticketingOptionSelected?: EraTicketingOption;
  prices?: EraPrices;
  tickets?: EraTicket[];
  pnr?: string; // Carrier PNR
}

export interface EraBookingTraveler extends EraResource {
  type: EraTravelerType;
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  email?: string;
  phone?: string;
  document?: EraDocument;
  passengerCards?: EraPassengerCard[];
}

export interface EraDocument {
  type: 'PASSPORT' | 'ID_CARD' | 'DRIVING_LICENSE';
  number: string;
  expiryDate?: string;
  countryCode?: string;
}

export interface EraBookingContact {
  email: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
}

// ============================================================
// BOOKING - UPDATE TRAVELERS
// ============================================================

export interface EraUpdateTravelersRequest {
  travelers: EraBookingTravelerInput[];
}

export interface EraBookingTravelerInput {
  id: string; // Traveler ID from booking
  firstName: string;
  lastName: string;
  dateOfBirth?: string;
  email?: string;
  phone?: string;
  document?: EraDocument;
}

// ============================================================
// CHECKOUT
// ============================================================

export interface EraPrebookRequest {
  // Usually empty, just POST to endpoint
}

export interface EraPrebookResponse extends EraBooking {
  // Same as booking but status = PREBOOKED
}

export interface EraConfirmRequest {
  // Usually empty, just POST to endpoint
}

export interface EraConfirmResponse extends EraBooking {
  // Same as booking but status = INVOICED
}

export interface EraHoldRequest {
  // Usually empty, just POST to endpoint
}

export interface EraHoldResponse extends EraBooking {
  // Booking held for later confirmation
}

// ============================================================
// TICKETS
// ============================================================

export interface EraTicket extends EraResource {
  reference?: string;
  type?: string;
  format?: 'PDF' | 'PKPASS';
  url?: string;
  data?: string; // Base64 encoded
}

export interface EraPrintRequest {
  format?: 'PDF' | 'PKPASS';
}

export interface EraPrintResponse {
  tickets: EraTicket[];
}

// ============================================================
// REFUND
// ============================================================

export interface EraRefundQuotationRequest {
  items?: string[]; // Item IDs to refund (empty = all)
}

export interface EraRefundQuotation extends EraResource {
  bookingId: string;
  items: EraRefundItem[];
  prices?: EraPrices;
  fee?: EraPrice;
  refundAmount?: EraPrice;
  expiresAt?: string;
}

export interface EraRefundItem {
  itemId: string;
  refundable: boolean;
  refundAmount?: EraPrice;
  fee?: EraPrice;
  reason?: string;
}

export interface EraRefundConfirmRequest {
  quotationId: string;
}

export interface EraRefundResponse extends EraResource {
  bookingId: string;
  status: 'REFUNDED' | 'PARTIALLY_REFUNDED';
  refundedAmount?: EraPrice;
  refundTransactionId?: string;
}

// ============================================================
// EXCHANGE
// ============================================================

export interface EraExchangeSearchRequest {
  legs: EraLegRequest[];
  items?: string[]; // Item IDs to exchange
}

export interface EraExchangeSearchResponse extends EraResource {
  offers: EraOffer[];
  products: EraProduct[];
  priceDifference?: EraPrice;
}

export interface EraExchangeQuotationRequest {
  offerLocation: string; // New offer
}

export interface EraExchangeQuotation extends EraResource {
  bookingId: string;
  newOffer: EraOffer;
  priceDifference?: EraPrice;
  fee?: EraPrice;
  expiresAt?: string;
}

export interface EraExchangeConfirmRequest {
  quotationId: string;
}

export interface EraExchangeResponse extends EraResource {
  booking: EraBooking;
  exchangeTransactionId?: string;
}

// ============================================================
// HEALTH
// ============================================================

export interface EraHealthStatus {
  supplier: string;
  status: 'UP' | 'DOWN' | 'DEGRADED';
  lastChecked?: string;
}

// ============================================================
// API CLIENT CONFIG
// ============================================================

export interface EraApiConfig {
  authUrl: string;      // https://authent-sandbox.era.raileurope.com
  apiUrl: string;       // https://api-sandbox.era.raileurope.com
  clientId: string;
  clientSecret: string;
  pointOfSale: string;
  mockMode?: boolean;
}

// ============================================================
// INTERNAL HELPER TYPES
// ============================================================

export interface EraApiHeaders {
  'Authorization': string;
  'X-Point-Of-Sale': string;
  'Content-Type': string;
  'X-CorrelationId'?: string;
}

export interface EraPaginationParams {
  page?: 'next' | 'previous';
}

// ============================================================
// CARRIER-SPECIFIC TYPES
// ============================================================

export type EraCarrierCode = 
  | 'DBAHN'      // Deutsche Bahn (Germany)
  | 'SNCF'       // SNCF (France)
  | 'SBB'        // Swiss Federal Railways
  | 'OBB'        // Austrian Railways
  | 'TRENITALIA' // Italy
  | 'RENFE'      // Spain
  | 'RDG'        // Rail Delivery Group (UK)
  | 'EUROSTAR'   // Eurostar
  | 'THALYS'     // Thalys
  | 'REGIOJET'   // RegioJet
  | 'RHB'        // Rhätische Bahn (Swiss Panoramic)
  | 'STS';       // Swiss Travel System

export interface EraCarrierInfo {
  code: EraCarrierCode;
  name: string;
  country: string;
  requiresDocument?: boolean;
  requiresPhone?: boolean;
  requiresCheckIn?: boolean;
  seatReservationIncluded?: boolean;
  seatReservationRequired?: boolean;
  externalReservation?: boolean;
}

// ============================================================
// EXPORTS
// ============================================================

export type {
  // Re-export for convenience
  EraResource as Resource,
  EraPrice as Price,
  EraPlace as Place,
  EraOffer as Offer,
  EraProduct as Product,
  EraBooking as Booking,
  EraSegment as Segment,
  EraTraveler as Traveler,
};
