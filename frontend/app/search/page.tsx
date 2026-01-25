'use client';

import { useEffect, useState, useMemo, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Train, ArrowLeft, Calendar, Users, ArrowRight, 
  Loader2, AlertCircle, SlidersHorizontal, Clock,
  ChevronDown, ChevronUp, Check, X, Zap, Wifi, Coffee,
  MapPin, Filter
} from 'lucide-react';
import { 
  searchJourneys, 
  toJourneyArray,
  formatTime,
  formatDate,
  formatDuration,
  formatPrice,
  parseDuration,
  EraSearchResponse,
  Journey,
  EraOffer,
  EraLegSolution,
} from '@/lib/api/era-client';

// ============================================================
// TYPES
// ============================================================

interface GroupedJourney {
  solutionId: string;
  departure: string;
  arrival: string;
  durationMinutes: number;
  origin: { code: string; name: string; city: string };
  destination: { code: string; name: string; city: string };
  carrier: string;
  trainNumber: string;
  trainType: string;
  isDirect: boolean;
  segmentCount: number;
  offers: {
    standard?: Journey;
    comfort?: Journey;
    premier?: Journey;
  };
  lowestPrice: number;
  currency: string;
}

// ============================================================
// CONSTANTS
// ============================================================

const TIME_FILTERS = [
  { id: 'early', label: 'Gece/Sabah Erken', range: '00:00 - 08:00', icon: '🌅', start: 0, end: 8 },
  { id: 'morning', label: 'Sabah', range: '08:00 - 12:00', icon: '☀️', start: 8, end: 12 },
  { id: 'afternoon', label: 'Öğleden Sonra', range: '12:00 - 18:00', icon: '🌤️', start: 12, end: 18 },
  { id: 'evening', label: 'Akşam', range: '18:00 - 24:00', icon: '🌙', start: 18, end: 24 },
];

const COMFORT_CONFIG: Record<string, { 
  label: string; 
  labelTR: string;
  bgColor: string; 
  textColor: string;
  borderColor: string;
  icon: string;
  description: string;
}> = {
  standard: { 
    label: 'Standard', 
    labelTR: 'Standart',
    bgColor: 'bg-slate-50', 
    textColor: 'text-slate-700',
    borderColor: 'border-slate-200',
    icon: '🎫',
    description: 'Ekonomik seyahat'
  },
  comfort: { 
    label: 'Business', 
    labelTR: 'Business',
    bgColor: 'bg-amber-50', 
    textColor: 'text-amber-700',
    borderColor: 'border-amber-300',
    icon: '💼',
    description: 'Konforlu seyahat'
  },
  premier: { 
    label: 'First', 
    labelTR: 'Birinci Sınıf',
    bgColor: 'bg-purple-50', 
    textColor: 'text-purple-700',
    borderColor: 'border-purple-300',
    icon: '👑',
    description: 'Premium deneyim'
  },
};

// ============================================================
// HELPER FUNCTIONS
// ============================================================

function groupJourneysBySolution(
  journeys: Journey[],
  searchResponse: EraSearchResponse
): GroupedJourney[] {
  const solutionMap = new Map<string, GroupedJourney>();

  // Her journey'i solution'a göre grupla
  journeys.forEach(journey => {
    // Solution ID'yi offer'dan bul
    const offer = searchResponse.offers.find(o => o.id === journey.id);
    if (!offer) return;

    const solutionId = offer.legSolution;
    
    if (!solutionMap.has(solutionId)) {
      solutionMap.set(solutionId, {
        solutionId,
        departure: journey.departure,
        arrival: journey.arrival,
        durationMinutes: journey.durationMinutes,
        origin: journey.origin,
        destination: journey.destination,
        carrier: journey.operator,
        trainNumber: journey.trainNumber,
        trainType: journey.trainType || 'High-Speed',
        isDirect: journey.segments.length === 1,
        segmentCount: journey.segments.length,
        offers: {},
        lowestPrice: Infinity,
        currency: journey.price.currency,
      });
    }

    const group = solutionMap.get(solutionId)!;
    const category = journey.comfortCategory as keyof typeof group.offers;
    
    group.offers[category] = journey;
    
    if (journey.price.amount < group.lowestPrice) {
      group.lowestPrice = journey.price.amount;
    }
  });

  // Array'e çevir ve kalkış saatine göre sırala
  return Array.from(solutionMap.values()).sort(
    (a, b) => new Date(a.departure).getTime() - new Date(b.departure).getTime()
  );
}

function getHourFromDate(dateStr: string): number {
  return new Date(dateStr).getHours();
}

// ============================================================
// COMPONENTS
// ============================================================

// Journey Card - Accordion Style
function JourneyCard({ 
  group, 
  isExpanded, 
  onToggle,
  onSelectOffer,
}: { 
  group: GroupedJourney;
  isExpanded: boolean;
  onToggle: () => void;
  onSelectOffer: (journey: Journey) => void;
}) {
  const durationStr = formatDuration(group.durationMinutes);
  const offerCount = Object.keys(group.offers).length;

  return (
    <div 
      className={`
        bg-white rounded-2xl shadow-sm border-2 transition-all duration-300
        ${isExpanded 
          ? 'border-blue-400 shadow-lg shadow-blue-100' 
          : 'border-slate-200 hover:border-slate-300 hover:shadow-md'
        }
      `}
    >
      {/* Main Row - Always Visible */}
      <div 
        className="p-5 cursor-pointer select-none"
        onClick={onToggle}
      >
        <div className="flex items-center justify-between gap-4">
          {/* Left: Time & Route */}
          <div className="flex items-center gap-6 flex-1">
            {/* Departure Time */}
            <div className="text-center min-w-[72px]">
              <div className="text-2xl font-bold text-slate-800">
                {formatTime(group.departure)}
              </div>
              <div className="text-xs text-slate-500 mt-0.5">Kalkış</div>
            </div>

            {/* Duration Line */}
            <div className="flex-1 max-w-[180px]">
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-blue-500 border-2 border-white shadow-sm z-10" />
                <div className="flex-1 h-1 bg-gradient-to-r from-blue-500 via-blue-400 to-blue-300 -mx-1" />
                <div className="w-3 h-3 rounded-full bg-blue-300 border-2 border-white shadow-sm z-10" />
              </div>
              <div className="flex justify-center mt-1.5">
                <span className="text-sm font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
                  {durationStr}
                </span>
              </div>
              <div className="text-center mt-1">
                <span className={`text-xs font-medium ${group.isDirect ? 'text-green-600' : 'text-amber-600'}`}>
                  {group.isDirect ? 'Direkt' : `${group.segmentCount - 1} Aktarma`}
                </span>
              </div>
            </div>

            {/* Arrival Time */}
            <div className="text-center min-w-[72px]">
              <div className="text-2xl font-bold text-slate-800">
                {formatTime(group.arrival)}
              </div>
              <div className="text-xs text-slate-500 mt-0.5">Varış</div>
            </div>
          </div>

          {/* Center: Carrier Info */}
          <div className="hidden md:flex items-center gap-3 px-5 border-l border-slate-200">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl flex items-center justify-center">
              <Train className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <div className="font-semibold text-slate-800">{group.carrier}</div>
              <div className="text-sm text-slate-500">{group.trainNumber}</div>
            </div>
          </div>

          {/* Right: Price & Expand */}
          <div className="flex items-center gap-4 pl-5 border-l border-slate-200">
            <div className="text-right">
              <div className="text-xs text-slate-500 mb-0.5">başlayan fiyat</div>
              <div className="text-2xl font-bold text-blue-600">
                {formatPrice(group.lowestPrice, group.currency)}
              </div>
            </div>
            
            <button
              className={`
                p-2.5 rounded-full transition-all duration-300
                ${isExpanded 
                  ? 'bg-blue-600 text-white rotate-180' 
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }
              `}
            >
              <ChevronDown className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Quick Tags - Mobile carrier + features */}
        <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-100 flex-wrap">
          {/* Mobile Carrier */}
          <span className="md:hidden text-sm font-medium text-slate-700 bg-slate-100 px-2 py-1 rounded-lg">
            {group.carrier} • {group.trainNumber}
          </span>
          
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-50 text-green-700 rounded-full text-xs font-medium">
            <Zap className="w-3 h-3" /> Yüksek Hız
          </span>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">
            <Wifi className="w-3 h-3" /> WiFi
          </span>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 text-amber-700 rounded-full text-xs font-medium">
            <Coffee className="w-3 h-3" /> Restoran
          </span>
          
          {offerCount > 1 && (
            <span className="text-xs text-slate-500 ml-auto hidden sm:inline">
              {offerCount} farklı sınıf seçeneği
            </span>
          )}
        </div>
      </div>

      {/* Expanded Content - Class Options */}
      {isExpanded && (
        <div className="border-t-2 border-slate-100 bg-gradient-to-b from-slate-50 to-white p-5 rounded-b-2xl">
          <h4 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
            Bilet Sınıfı Seçin
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Standard Class */}
            {group.offers.standard && (
              <ClassOptionCard
                journey={group.offers.standard}
                category="standard"
                onSelect={() => onSelectOffer(group.offers.standard!)}
              />
            )}

            {/* Business Class */}
            {group.offers.comfort && (
              <ClassOptionCard
                journey={group.offers.comfort}
                category="comfort"
                onSelect={() => onSelectOffer(group.offers.comfort!)}
                isPopular
              />
            )}

            {/* First Class */}
            {group.offers.premier && (
              <ClassOptionCard
                journey={group.offers.premier}
                category="premier"
                onSelect={() => onSelectOffer(group.offers.premier!)}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Class Option Card
function ClassOptionCard({
  journey,
  category,
  onSelect,
  isPopular = false,
}: {
  journey: Journey;
  category: string;
  onSelect: () => void;
  isPopular?: boolean;
}) {
  const config = COMFORT_CONFIG[category] || COMFORT_CONFIG.standard;

  return (
    <div 
      className={`
        relative bg-white rounded-xl border-2 p-4 transition-all cursor-pointer
        hover:shadow-lg hover:-translate-y-0.5
        ${isPopular 
          ? 'border-amber-400 shadow-md shadow-amber-100' 
          : `${config.borderColor} hover:border-blue-400`
        }
      `}
      onClick={onSelect}
    >
      {/* Popular Badge */}
      {isPopular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-gradient-to-r from-amber-400 to-amber-500 text-amber-900 text-xs font-bold rounded-full whitespace-nowrap shadow-sm">
          ⭐ En Popüler
        </div>
      )}

      {/* Class Header */}
      <div className="flex items-center justify-between mb-3 mt-1">
        <div className={`
          inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold
          ${config.bgColor} ${config.textColor}
        `}>
          <span>{config.icon}</span>
          {config.labelTR}
        </div>
      </div>

      {/* Price */}
      <div className="mb-4">
        <div className="text-3xl font-bold text-slate-800">
          {formatPrice(journey.price.amount, journey.price.currency)}
        </div>
        <div className="text-sm text-slate-500">kişi başı</div>
      </div>

      {/* Features */}
      <div className="space-y-2.5 mb-4">
        <div className="flex items-center gap-2 text-sm">
          {journey.isExchangeable ? (
            <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center">
              <Check className="w-3 h-3 text-green-600" />
            </div>
          ) : (
            <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center">
              <X className="w-3 h-3 text-slate-400" />
            </div>
          )}
          <span className={journey.isExchangeable ? 'text-slate-700' : 'text-slate-400'}>
            Değiştirilebilir
          </span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          {journey.isRefundable ? (
            <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center">
              <Check className="w-3 h-3 text-green-600" />
            </div>
          ) : (
            <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center">
              <X className="w-3 h-3 text-slate-400" />
            </div>
          )}
          <span className={journey.isRefundable ? 'text-slate-700' : 'text-slate-400'}>
            İade Edilebilir
          </span>
        </div>
      </div>

      {/* Flexibility Label */}
      {journey.flexibility?.label && (
        <div className={`
          text-xs font-medium px-3 py-1.5 rounded-lg text-center mb-4
          ${journey.flexibility.code === 'FULL_FLEX' 
            ? 'bg-green-100 text-green-700' 
            : journey.flexibility.code === 'FLEXIBLE' 
              ? 'bg-blue-100 text-blue-700' 
              : 'bg-slate-100 text-slate-600'
          }
        `}>
          {journey.flexibility.label}
        </div>
      )}

      {/* Select Button */}
      <button
        className={`
          w-full py-3 rounded-xl font-semibold transition-all text-sm
          ${isPopular 
            ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white shadow-md shadow-amber-200' 
            : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white'
          }
        `}
      >
        Seç
      </button>
    </div>
  );
}

// Time Filter Button
function TimeFilterButton({
  filter,
  isActive,
  onClick,
}: {
  filter: typeof TIME_FILTERS[0];
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`
        px-3 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap
        ${isActive
          ? 'bg-blue-600 text-white shadow-md shadow-blue-200'
          : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
        }
      `}
    >
      <span className="mr-1.5">{filter.icon}</span>
      <span className="hidden sm:inline">{filter.label}</span>
      <span className="sm:hidden">{filter.range.split(' - ')[0]}</span>
    </button>
  );
}

// ============================================================
// MAIN CONTENT COMPONENT
// ============================================================

function SearchResultsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const [searchResponse, setSearchResponse] = useState<EraSearchResponse | null>(null);
  const [journeys, setJourneys] = useState<Journey[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // UI State
  const [expandedJourney, setExpandedJourney] = useState<string | null>(null);
  const [selectedTimeFilters, setSelectedTimeFilters] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<'departure' | 'price' | 'duration'>('departure');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [customTimeRange, setCustomTimeRange] = useState<{ start: string; end: string }>({
    start: '00:00',
    end: '23:59',
  });
  const [filterMode, setFilterMode] = useState<'departure' | 'arrival'>('departure');
  
  // Get search params
  const origin = searchParams.get('origin') || '';
  const destination = searchParams.get('destination') || '';
  const date = searchParams.get('date') || '';
  const adults = parseInt(searchParams.get('adults') || '1');
  const children = parseInt(searchParams.get('children') || '0');

  // Fetch journeys
  useEffect(() => {
    const fetchJourneys = async () => {
      if (!origin || !destination || !date) {
        setError('Eksik arama parametreleri');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        
        const response = await searchJourneys({
          origin,
          destination,
          departureDate: date,
          adults,
          children,
        });
        
        setSearchResponse(response);
        setJourneys(toJourneyArray(response));
      } catch (err) {
        console.error('Search error:', err);
        setError('Seferler yüklenirken bir hata oluştu. Lütfen tekrar deneyin.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchJourneys();
  }, [origin, destination, date, adults, children]);

  // Group journeys by solution
  const groupedJourneys = useMemo(() => {
    if (!searchResponse) return [];
    return groupJourneysBySolution(journeys, searchResponse);
  }, [journeys, searchResponse]);

  // Filter and sort journeys
  const filteredJourneys = useMemo(() => {
    let filtered = [...groupedJourneys];

    // Quick time filters
    if (selectedTimeFilters.length > 0) {
      filtered = filtered.filter(group => {
        const timeField = filterMode === 'departure' ? group.departure : group.arrival;
        const hour = getHourFromDate(timeField);
        
        return selectedTimeFilters.some(filterId => {
          const filter = TIME_FILTERS.find(f => f.id === filterId);
          if (!filter) return false;
          return hour >= filter.start && hour < filter.end;
        });
      });
    }

    // Custom time range
    if (showAdvancedFilters) {
      const startHour = parseInt(customTimeRange.start.split(':')[0]);
      const endHour = parseInt(customTimeRange.end.split(':')[0]);
      const endMinute = parseInt(customTimeRange.end.split(':')[1]);
      
      filtered = filtered.filter(group => {
        const timeField = filterMode === 'departure' ? group.departure : group.arrival;
        const date = new Date(timeField);
        const hour = date.getHours();
        const minute = date.getMinutes();
        
        if (hour < startHour) return false;
        if (hour > endHour) return false;
        if (hour === endHour && minute > endMinute) return false;
        return true;
      });
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'price':
          return a.lowestPrice - b.lowestPrice;
        case 'duration':
          return a.durationMinutes - b.durationMinutes;
        case 'departure':
        default:
          return new Date(a.departure).getTime() - new Date(b.departure).getTime();
      }
    });

    return filtered;
  }, [groupedJourneys, selectedTimeFilters, sortBy, showAdvancedFilters, customTimeRange, filterMode]);

  // Handlers
  const toggleTimeFilter = (filterId: string) => {
    setSelectedTimeFilters(prev =>
      prev.includes(filterId)
        ? prev.filter(f => f !== filterId)
        : [...prev, filterId]
    );
  };

  const clearFilters = () => {
    setSelectedTimeFilters([]);
    setCustomTimeRange({ start: '00:00', end: '23:59' });
  };

  const handleSelectJourney = (journey: Journey) => {
    // Store in sessionStorage for booking page
    sessionStorage.setItem('selectedJourney', JSON.stringify(journey));
    sessionStorage.setItem('searchResponse', JSON.stringify(searchResponse));
    sessionStorage.setItem('passengers', JSON.stringify({ adults, children }));
    
    // Navigate to booking page
    router.push(`/booking?offerId=${journey.id}&searchId=${searchResponse?.id}`);
  };

  // Format date for display
  const formatDisplayDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('tr-TR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200">
                <Train className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-slate-900">EuroTrain</span>
            </Link>
            
            <Link 
              href="/"
              className="flex items-center gap-2 text-slate-600 hover:text-blue-600 transition-colors font-medium"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Yeni Arama</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Search Summary Bar */}
      <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 text-white py-5 shadow-lg">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Route Info */}
            <div className="flex items-center gap-3">
              <MapPin className="w-5 h-5 text-blue-300" />
              {searchResponse && (
                <div className="flex items-center gap-3">
                  <span className="text-lg font-semibold">
                    {searchResponse.origin?.label || origin}
                  </span>
                  <ArrowRight className="w-5 h-5 text-blue-300" />
                  <span className="text-lg font-semibold">
                    {searchResponse.destination?.label || destination}
                  </span>
                </div>
              )}
              {!searchResponse && !isLoading && (
                <div className="flex items-center gap-3">
                  <span className="text-lg font-semibold">{origin}</span>
                  <ArrowRight className="w-5 h-5 text-blue-300" />
                  <span className="text-lg font-semibold">{destination}</span>
                </div>
              )}
            </div>
            
            {/* Date & Passengers */}
            <div className="flex items-center gap-5 text-sm">
              <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-lg">
                <Calendar className="w-4 h-4 text-blue-300" />
                <span>{formatDisplayDate(date)}</span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-lg">
                <Users className="w-4 h-4 text-blue-300" />
                <span>
                  {adults} Yetişkin{children > 0 && `, ${children} Çocuk`}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Results Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Loading State */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mb-4">
              <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            </div>
            <p className="text-slate-600 font-medium">Seferler aranıyor...</p>
            <p className="text-slate-400 text-sm mt-1">En iyi fiyatları buluyoruz</p>
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mb-4">
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
            <h3 className="text-xl font-semibold text-slate-900 mb-2">Bir Hata Oluştu</h3>
            <p className="text-slate-600 mb-6">{error}</p>
            <Link
              href="/"
              className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium"
            >
              Ana Sayfaya Dön
            </Link>
          </div>
        )}

        {/* Results */}
        {!isLoading && !error && groupedJourneys.length > 0 && (
          <>
            {/* Filters Bar */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 mb-6">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                {/* Time Quick Filters */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium text-slate-700 mr-1">
                    {filterMode === 'departure' ? 'Kalkış:' : 'Varış:'}
                  </span>
                  {TIME_FILTERS.map(filter => (
                    <TimeFilterButton
                      key={filter.id}
                      filter={filter}
                      isActive={selectedTimeFilters.includes(filter.id)}
                      onClick={() => toggleTimeFilter(filter.id)}
                    />
                  ))}
                  {selectedTimeFilters.length > 0 && (
                    <button
                      onClick={clearFilters}
                      className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                      title="Filtreleri Temizle"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Sort & More Filters */}
                <div className="flex items-center gap-3">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                    className="px-4 py-2 rounded-xl border border-slate-200 text-sm text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="departure">Kalkış Saati</option>
                    <option value="price">Fiyat (En Ucuz)</option>
                    <option value="duration">Süre (En Kısa)</option>
                  </select>

                  <button
                    onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                    className={`
                      flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all
                      ${showAdvancedFilters 
                        ? 'bg-blue-600 text-white shadow-md' 
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }
                    `}
                  >
                    <SlidersHorizontal className="w-4 h-4" />
                    <span className="hidden sm:inline">Detaylı Filtre</span>
                  </button>
                </div>
              </div>

              {/* Advanced Filters Panel */}
              {showAdvancedFilters && (
                <div className="mt-4 pt-4 border-t border-slate-200">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Filter Mode */}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Filtre Türü
                      </label>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setFilterMode('departure')}
                          className={`
                            flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors
                            ${filterMode === 'departure'
                              ? 'bg-blue-600 text-white'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }
                          `}
                        >
                          Kalkış Saati
                        </button>
                        <button
                          onClick={() => setFilterMode('arrival')}
                          className={`
                            flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors
                            ${filterMode === 'arrival'
                              ? 'bg-blue-600 text-white'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }
                          `}
                        >
                          Varış Saati
                        </button>
                      </div>
                    </div>

                    {/* Custom Time Range */}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Saat Aralığı (Başlangıç)
                      </label>
                      <input
                        type="time"
                        value={customTimeRange.start}
                        onChange={(e) => setCustomTimeRange(prev => ({ ...prev, start: e.target.value }))}
                        className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Saat Aralığı (Bitiş)
                      </label>
                      <input
                        type="time"
                        value={customTimeRange.end}
                        onChange={(e) => setCustomTimeRange(prev => ({ ...prev, end: e.target.value }))}
                        className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Results Header */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  {filteredJourneys.length} Sefer Bulundu
                </h2>
                <p className="text-slate-500 text-sm">
                  Fiyatlar kişi başı gösterilmektedir • Detaylar için sefere tıklayın
                </p>
              </div>
            </div>

            {/* Journey List */}
            <div className="space-y-4">
              {filteredJourneys.map((group) => (
                <JourneyCard
                  key={group.solutionId}
                  group={group}
                  isExpanded={expandedJourney === group.solutionId}
                  onToggle={() => setExpandedJourney(
                    expandedJourney === group.solutionId ? null : group.solutionId
                  )}
                  onSelectOffer={handleSelectJourney}
                />
              ))}
            </div>

            {/* No Results After Filter */}
            {filteredJourneys.length === 0 && groupedJourneys.length > 0 && (
              <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-slate-200">
                <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Filter className="w-8 h-8 text-slate-400" />
                </div>
                <h3 className="text-lg font-semibold text-slate-700 mb-2">
                  Filtrelere Uygun Sefer Bulunamadı
                </h3>
                <p className="text-slate-500 mb-4">
                  Seçtiğiniz kriterlere uygun sefer bulunmuyor. Filtreleri değiştirmeyi deneyin.
                </p>
                <button
                  onClick={clearFilters}
                  className="px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium"
                >
                  Filtreleri Temizle
                </button>
              </div>
            )}
          </>
        )}

        {/* No Results */}
        {!isLoading && !error && groupedJourneys.length === 0 && searchResponse && (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Train className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-xl font-semibold text-slate-900 mb-2">
              Sefer Bulunamadı
            </h3>
            <p className="text-slate-600 mb-6">
              Bu tarih ve güzergah için uygun sefer bulunamadı.
            </p>
            <Link
              href="/"
              className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors inline-block font-medium"
            >
              Farklı Tarih Dene
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}

// ============================================================
// MAIN PAGE WITH SUSPENSE
// ============================================================

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Yükleniyor...</p>
        </div>
      </div>
    }>
      <SearchResultsContent />
    </Suspense>
  );
}
