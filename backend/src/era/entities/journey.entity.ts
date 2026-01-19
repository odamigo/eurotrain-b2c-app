export interface Journey {
  id: string;
  origin: string;
  destination: string;
  departureTime: string;
  arrivalTime: string;
  duration: number; // minutes
  transfers: number;
  legs: JourneyLeg[];
  prices: JourneyPrice[];
  available: boolean;
}

export interface JourneyLeg {
  id: string;
  trainNumber: string;
  trainType: TrainType;
  operator: string;
  origin: {
    stationId: string;
    stationName: string;
    departureTime: string;
    platform?: string;
  };
  destination: {
    stationId: string;
    stationName: string;
    arrivalTime: string;
    platform?: string;
  };
  duration: number;
  amenities: string[];
}

export interface JourneyPrice {
  class: 'FIRST' | 'SECOND';
  flexibility: 'NON_FLEXIBLE' | 'SEMI_FLEXIBLE' | 'FLEXIBLE';
  price: number;
  currency: string;
  availableSeats: number;
  conditions: PriceCondition[];
}

export interface PriceCondition {
  type: 'REFUND' | 'EXCHANGE' | 'CANCELLATION';
  allowed: boolean;
  fee?: number;
  deadline?: string;
  description: string;
}

export type TrainType = 
  | 'TGV'           // France high-speed
  | 'ICE'           // Germany high-speed
  | 'FRECCIAROSSA'  // Italy high-speed
  | 'FRECCIARGENTO' // Italy high-speed
  | 'AVE'           // Spain high-speed
  | 'EUROSTAR'      // UK-Europe
  | 'THALYS'        // Belgium/Netherlands/Germany
  | 'INTERCITY'     // Regional fast
  | 'REGIONAL'      // Local trains
  | 'NIGHTJET'      // Night trains
  | 'TGV_LYRIA'     // France-Switzerland
  | 'RENFE'         // Spain
  | 'SBB'           // Switzerland
  | 'OBB'           // Austria
  | 'NS'            // Netherlands
  | 'DB';           // Germany

export const TRAIN_OPERATORS: Record<TrainType, { name: string; country: string; logo?: string }> = {
  TGV: { name: 'TGV inOui', country: 'France' },
  ICE: { name: 'Deutsche Bahn ICE', country: 'Germany' },
  FRECCIAROSSA: { name: 'Trenitalia Frecciarossa', country: 'Italy' },
  FRECCIARGENTO: { name: 'Trenitalia Frecciargento', country: 'Italy' },
  AVE: { name: 'Renfe AVE', country: 'Spain' },
  EUROSTAR: { name: 'Eurostar', country: 'International' },
  THALYS: { name: 'Thalys', country: 'International' },
  INTERCITY: { name: 'InterCity', country: 'Various' },
  REGIONAL: { name: 'Regional', country: 'Various' },
  NIGHTJET: { name: 'ÖBB Nightjet', country: 'Austria' },
  TGV_LYRIA: { name: 'TGV Lyria', country: 'France/Switzerland' },
  RENFE: { name: 'Renfe', country: 'Spain' },
  SBB: { name: 'SBB', country: 'Switzerland' },
  OBB: { name: 'ÖBB', country: 'Austria' },
  NS: { name: 'NS International', country: 'Netherlands' },
  DB: { name: 'Deutsche Bahn', country: 'Germany' },
};