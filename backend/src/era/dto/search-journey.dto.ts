export class SearchJourneyDto {
  origin: string;
  destination: string;
  departureDate: string;
  departureTime?: string;
  returnDate?: string;
  passengers: PassengerCount;
  class?: 'FIRST' | 'SECOND' | 'ANY';
  directOnly?: boolean;
  flexibility?: 'NON_FLEXIBLE' | 'SEMI_FLEXIBLE' | 'FLEXIBLE' | 'ANY';
}

export interface PassengerCount {
  adults: number;
  children?: number;
  youths?: number;
  seniors?: number;
  infants?: number;
}

export class SearchStationDto {
  query: string;
  limit?: number;
  country?: string;
}

export class JourneySearchResultDto {
  searchId: string;
  origin: StationSummary;
  destination: StationSummary;
  departureDate: string;
  outboundJourneys: JourneySummary[];
  returnJourneys?: JourneySummary[];
  searchedAt: string;
  expiresAt: string;
}

export interface StationSummary {
  id: string;
  name: string;
  city: string;
  country: string;
}

export interface JourneySummary {
  id: string;
  departureTime: string;
  arrivalTime: string;
  duration: number;
  transfers: number;
  trainTypes: string[];
  operators: string[];
  prices: {
    from: number;
    currency: string;
  };
  availableClasses: ('FIRST' | 'SECOND')[];
  legs: LegSummary[];
}

export interface LegSummary {
  trainNumber: string;
  trainType: string;
  operator: string;
  origin: string;
  destination: string;
  departureTime: string;
  arrivalTime: string;
}