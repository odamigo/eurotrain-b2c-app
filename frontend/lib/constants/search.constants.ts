// ============================================================
// SEARCH CONSTANTS
// ============================================================

export interface TimeFilter {
  id: string;
  label: string;
  shortLabel: string;
  icon: string;
  start: number; // Hour (0-23)
  end: number;   // Hour (0-23)
}

export interface SortOption {
  id: string;
  label: string;
}

// Time filters for departure
export const TIME_FILTERS: TimeFilter[] = [
  { id: 'early', label: 'Erken', shortLabel: '00-08', icon: '🌅', start: 0, end: 8 },
  { id: 'morning', label: 'Sabah', shortLabel: '08-12', icon: '☀️', start: 8, end: 12 },
  { id: 'afternoon', label: 'Öğlen', shortLabel: '12-18', icon: '🌤️', start: 12, end: 18 },
  { id: 'evening', label: 'Akşam', shortLabel: '18-22', icon: '🌆', start: 18, end: 22 },
  { id: 'night', label: 'Gece', shortLabel: '22-24', icon: '🌙', start: 22, end: 24 },
];

// Sort options
export const SORT_OPTIONS: SortOption[] = [
  { id: 'departure', label: 'Kalkış Saati' },
  { id: 'price', label: 'Fiyat (En Ucuz)' },
  { id: 'duration', label: 'Süre (En Kısa)' },
  { id: 'arrival', label: 'Varış Saati' },
];

// Operator display names
export const OPERATOR_NAMES: Record<string, string> = {
  EUROSTAR: 'Eurostar',
  SNCF: 'SNCF TGV',
  TGV: 'TGV',
  THALYS: 'Thalys',
  TRENITALIA: 'Trenitalia',
  FRECCIAROSSA: 'Frecciarossa',
  FRECCIARGENTO: 'Frecciargento',
  FRECCIABIANCA: 'Frecciabianca',
  DBAHN: 'Deutsche Bahn',
  DB: 'Deutsche Bahn',
  ICE: 'ICE',
  IC: 'InterCity',
  RENFE: 'Renfe',
  AVE: 'AVE',
  SBB: 'SBB',
  OBB: 'ÖBB',
  NS: 'NS International',
  OUIGO: 'OUIGO',
  ITALO: 'Italo',
};

// Highlight badge types
export const HIGHLIGHT_BADGES = {
  cheapest: {
    label: 'En Ucuz',
    color: 'bg-green-100 text-green-700',
  },
  fastest: {
    label: 'En Hızlı',
    color: 'bg-blue-100 text-blue-700',
  },
  recommended: {
    label: 'Önerilen',
    color: 'bg-purple-100 text-purple-700',
  },
} as const;

// Default search settings
export const DEFAULT_SEARCH_SETTINGS = {
  sortBy: 'departure',
  directOnly: false,
  timeFilters: [] as string[],
};

// Results per page
export const RESULTS_PER_PAGE = 20;
