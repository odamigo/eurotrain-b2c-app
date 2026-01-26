'use client';

import { useEffect, useState, useMemo, Suspense, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Train, ArrowLeft, Clock, ArrowRight, ChevronDown,
  Loader2, AlertCircle, MapPin, Calendar, Users,
  Check, X, RefreshCw, ChevronRight, SlidersHorizontal,
  RotateCcw, Tag, Timer, ArrowRightLeft, Zap, Shield,
  Sparkles, TrendingDown, ChevronUp
} from 'lucide-react';
import { 
  searchJourneys, 
  toJourneyArray, 
  formatPrice, 
  formatTime, 
  formatDuration,
  Journey,
  EraSearchResponse 
} from '@/lib/api/era-client';

// ============================================================
// TYPES
// ============================================================

type TripPhase = 'outbound' | 'return';
type SortOption = 'departure' | 'price' | 'duration';

interface SelectedJourneys {
  outbound: Journey | null;
  return: Journey | null;
}

// ============================================================
// CONSTANTS
// ============================================================

const TIME_SLOTS = [
  { id: 'early', label: 'Erken', range: '05:00-09:00', start: 5, end: 9, icon: '🌅' },
  { id: 'morning', label: 'Sabah', range: '09:00-12:00', start: 9, end: 12, icon: '☀️' },
  { id: 'afternoon', label: 'Öğlen', range: '12:00-17:00', start: 12, end: 17, icon: '🌤️' },
  { id: 'evening', label: 'Akşam', range: '17:00-21:00', start: 17, end: 21, icon: '🌆' },
  { id: 'night', label: 'Gece', range: '21:00-05:00', start: 21, end: 5, icon: '🌙' },
];

const CARRIER_STYLES: Record<string, { bg: string; text: string; name: string }> = {
  'EUROSTAR': { bg: 'bg-yellow-400', text: 'text-slate-900', name: 'Eurostar' },
  'Eurostar': { bg: 'bg-yellow-400', text: 'text-slate-900', name: 'Eurostar' },
  'SNCF': { bg: 'bg-rose-600', text: 'text-white', name: 'TGV' },
  'TGV': { bg: 'bg-rose-600', text: 'text-white', name: 'TGV' },
  'THALYS': { bg: 'bg-purple-600', text: 'text-white', name: 'Thalys' },
  'TRENITALIA': { bg: 'bg-emerald-600', text: 'text-white', name: 'Trenitalia' },
  'Frecciarossa': { bg: 'bg-rose-500', text: 'text-white', name: 'Frecciarossa' },
  'DBAHN': { bg: 'bg-red-600', text: 'text-white', name: 'ICE' },
  'ICE': { bg: 'bg-red-600', text: 'text-white', name: 'ICE' },
  'RENFE': { bg: 'bg-purple-700', text: 'text-white', name: 'AVE' },
  'AVE': { bg: 'bg-purple-700', text: 'text-white', name: 'AVE' },
  'SBB': { bg: 'bg-red-500', text: 'text-white', name: 'SBB' },
  'OBB': { bg: 'bg-red-600', text: 'text-white', name: 'ÖBB' },
  'Railjet': { bg: 'bg-red-600', text: 'text-white', name: 'Railjet' },
  'TGV Lyria': { bg: 'bg-rose-600', text: 'text-white', name: 'TGV Lyria' },
  'EuroCity': { bg: 'bg-blue-600', text: 'text-white', name: 'EuroCity' },
};

const CLASS_CONFIG = {
  standard: { 
    label: 'Standart', 
    icon: '🎫', 
    color: 'slate',
    features: ['Standart koltuk', 'WiFi', 'Priz']
  },
  comfort: { 
    label: 'Business', 
    icon: '💼', 
    color: 'amber',
    features: ['Geniş koltuk', 'Yemek', 'Öncelikli biniş', 'Sessiz vagon']
  },
  premier: { 
    label: 'First Class', 
    icon: '👑', 
    color: 'purple',
    features: ['Premium koltuk', 'Şampanya', 'Lounge', 'Özel check-in']
  },
};

// ============================================================
// UTILITY FUNCTIONS
// ============================================================

function getCarrierStyle(carrier: string) {
  return CARRIER_STYLES[carrier] || CARRIER_STYLES[carrier?.toUpperCase()] || 
    { bg: 'bg-blue-600', text: 'text-white', name: carrier };
}

function getHourFromDate(isoString: string): number {
  try {
    return new Date(isoString).getHours();
  } catch {
    return 0;
  }
}

function groupJourneysBySolution(journeys: Journey[]): Map<string, Journey[]> {
  const grouped = new Map<string, Journey[]>();
  journeys.forEach(journey => {
    const key = `${journey.departure}-${journey.trainNumber}`;
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(journey);
  });
  return grouped;
}

function formatDateShort(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
  } catch {
    return dateStr;
  }
}

function formatDateLong(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString('tr-TR', { 
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' 
    });
  } catch {
    return dateStr;
  }
}

// ============================================================
// COMPONENTS
// ============================================================

// Progress Steps (Google Flights style)
function ProgressSteps({ 
  phase, 
  isRoundTrip,
  outboundSelected,
}: { 
  phase: TripPhase;
  isRoundTrip: boolean;
  outboundSelected: boolean;
}) {
  if (!isRoundTrip) return null;
  
  return (
    <div className="flex items-center justify-center gap-2 py-3 bg-slate-50 border-b border-slate-200">
      {/* Step 1: Outbound */}
      <div className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all ${
        phase === 'outbound' 
          ? 'bg-blue-600 text-white' 
          : outboundSelected 
            ? 'bg-green-100 text-green-700' 
            : 'bg-slate-200 text-slate-500'
      }`}>
        {outboundSelected && phase !== 'outbound' ? (
          <Check className="w-4 h-4" />
        ) : (
          <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold">1</span>
        )}
        <span className="font-medium text-sm">Gidiş</span>
      </div>
      
      <ChevronRight className="w-4 h-4 text-slate-400" />
      
      {/* Step 2: Return */}
      <div className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all ${
        phase === 'return' 
          ? 'bg-blue-600 text-white' 
          : 'bg-slate-200 text-slate-500'
      }`}>
        <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold">2</span>
        <span className="font-medium text-sm">Dönüş</span>
      </div>
    </div>
  );
}

// Sticky Selected Journey Summary (Trainline style)
function SelectedJourneySummary({
  journey,
  label,
  onEdit,
}: {
  journey: Journey;
  label: string;
  onEdit: () => void;
}) {
  const carrierStyle = getCarrierStyle(journey.operator);
  
  return (
    <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4 mb-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
              <Check className="w-5 h-5 text-white" />
            </div>
            <span className="font-medium text-green-800">{label} Seçildi</span>
          </div>
          
          <div className="h-6 w-px bg-green-200" />
          
          <div className="flex items-center gap-3">
            <span className={`px-2 py-1 rounded text-xs font-bold ${carrierStyle.bg} ${carrierStyle.text}`}>
              {carrierStyle.name}
            </span>
            <div className="flex items-center gap-2 text-sm">
              <span className="font-semibold text-slate-800">{formatTime(journey.departure)}</span>
              <ArrowRight className="w-3 h-3 text-slate-400" />
              <span className="font-semibold text-slate-800">{formatTime(journey.arrival)}</span>
            </div>
            <span className="text-sm text-slate-500">{formatDuration(journey.durationMinutes)}</span>
            <span className="text-sm font-semibold text-green-600">
              {formatPrice(journey.price.amount, journey.price.currency)}
            </span>
          </div>
        </div>
        
        <button
          onClick={onEdit}
          className="text-sm text-green-600 hover:text-green-700 font-medium flex items-center gap-1"
        >
          <RefreshCw className="w-4 h-4" />
          Değiştir
        </button>
      </div>
    </div>
  );
}

// Filter Pills
function FilterPills({
  selectedSlots,
  onToggle,
  directOnly,
  onDirectChange,
  directCount,
  totalCount,
}: {
  selectedSlots: string[];
  onToggle: (id: string) => void;
  directOnly: boolean;
  onDirectChange: (checked: boolean) => void;
  directCount: number;
  totalCount: number;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 mb-4">
      {/* Direct Only Toggle */}
      <button
        onClick={() => onDirectChange(!directOnly)}
        className={`
          flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium transition-all
          ${directOnly 
            ? 'bg-green-100 text-green-700 ring-2 ring-green-500 ring-offset-1' 
            : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300'
          }
        `}
      >
        {directOnly && <Check className="w-4 h-4" />}
        <Zap className="w-4 h-4" />
        <span>Sadece Direkt</span>
        <span className="text-xs opacity-70">({directCount})</span>
      </button>
      
      <div className="h-6 w-px bg-slate-200 mx-1" />
      
      {/* Time Slots */}
      {TIME_SLOTS.map(slot => (
        <button
          key={slot.id}
          onClick={() => onToggle(slot.id)}
          className={`
            flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium transition-all
            ${selectedSlots.includes(slot.id)
              ? 'bg-blue-100 text-blue-700 ring-2 ring-blue-500 ring-offset-1'
              : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300'
            }
          `}
        >
          <span>{slot.icon}</span>
          <span className="hidden sm:inline">{slot.label}</span>
          <span className="sm:hidden text-xs">{slot.range.split('-')[0]}</span>
        </button>
      ))}
    </div>
  );
}

// Journey Card - Trainline inspired
function JourneyCard({
  journey,
  variants,
  isSelected,
  isCheapest,
  isFastest,
  onSelect,
}: {
  journey: Journey;
  variants: Journey[];
  isSelected: boolean;
  isCheapest: boolean;
  isFastest: boolean;
  onSelect: (journey: Journey) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const carrierStyle = getCarrierStyle(journey.operator);
  const cheapestVariant = variants.reduce((min, v) => v.price.amount < min.price.amount ? v : min, variants[0]);
  const isDirect = !journey.segments || journey.segments.length <= 1;
  
  const sortedVariants = [...variants].sort((a, b) => {
    const order = { standard: 0, comfort: 1, premier: 2 };
    return (order[a.comfortCategory as keyof typeof order] || 0) - (order[b.comfortCategory as keyof typeof order] || 0);
  });

  return (
    <div className={`
      bg-white rounded-2xl border-2 transition-all duration-200 overflow-hidden
      ${isSelected 
        ? 'border-green-500 ring-4 ring-green-100' 
        : isCheapest || isFastest
          ? 'border-blue-200 hover:border-blue-400'
          : 'border-slate-200 hover:border-slate-300'
      }
    `}>
      {/* Badges */}
      {(isCheapest || isFastest) && (
        <div className="flex gap-2 px-4 py-2 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100">
          {isCheapest && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-500 text-white text-xs font-bold rounded-full">
              <TrendingDown className="w-3 h-3" />
              En Ucuz
            </span>
          )}
          {isFastest && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-500 text-white text-xs font-bold rounded-full">
              <Zap className="w-3 h-3" />
              En Hızlı
            </span>
          )}
        </div>
      )}

      {/* Main Row */}
      <div className="p-4">
        <div className="flex items-center gap-4">
          {/* Carrier */}
          <div className="flex flex-col items-center gap-1 min-w-[60px]">
            <span className={`px-2 py-1 rounded-lg text-xs font-bold ${carrierStyle.bg} ${carrierStyle.text}`}>
              {carrierStyle.name}
            </span>
            <span className="text-[10px] text-slate-400">{journey.trainNumber}</span>
          </div>

          {/* Timeline */}
          <div className="flex-1 flex items-center gap-3">
            {/* Departure */}
            <div className="text-center">
              <div className="text-xl font-bold text-slate-900">{formatTime(journey.departure)}</div>
              <div className="text-xs text-slate-500 truncate max-w-[80px]">{journey.origin.city}</div>
            </div>

            {/* Duration Line */}
            <div className="flex-1 flex flex-col items-center min-w-[100px]">
              <div className="w-full flex items-center">
                <div className="w-2 h-2 rounded-full bg-blue-500" />
                <div className="flex-1 h-[2px] bg-gradient-to-r from-blue-500 via-blue-300 to-blue-500 relative">
                  {!isDirect && (
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-amber-400 rounded-full border-2 border-white" />
                  )}
                </div>
                <div className="w-2 h-2 rounded-full bg-blue-500" />
              </div>
              <span className="text-xs text-slate-500 mt-1">{formatDuration(journey.durationMinutes)}</span>
              <span className={`text-[10px] font-medium ${isDirect ? 'text-green-600' : 'text-amber-600'}`}>
                {isDirect ? 'Direkt' : `${(journey.segments?.length || 1) - 1} Aktarma`}
              </span>
            </div>

            {/* Arrival */}
            <div className="text-center">
              <div className="text-xl font-bold text-slate-900">{formatTime(journey.arrival)}</div>
              <div className="text-xs text-slate-500 truncate max-w-[80px]">{journey.destination.city}</div>
            </div>
          </div>

          {/* Price & Action */}
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-xs text-slate-500">kişi başı</div>
              <div className="text-xl font-bold text-green-600">
                {formatPrice(cheapestVariant.price.amount, cheapestVariant.price.currency)}
              </div>
            </div>
            
            <button
              onClick={() => setExpanded(!expanded)}
              className={`
                p-3 rounded-xl transition-all
                ${expanded ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}
              `}
            >
              <ChevronDown className={`w-5 h-5 transition-transform ${expanded ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Expanded: Class Selection (Trainline style) */}
      {expanded && (
        <div className="border-t border-slate-100 bg-slate-50 p-4">
          <h4 className="text-sm font-semibold text-slate-700 mb-3">Bilet Sınıfı Seçin</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {sortedVariants.map((variant) => {
              const config = CLASS_CONFIG[variant.comfortCategory as keyof typeof CLASS_CONFIG] || CLASS_CONFIG.standard;
              const isPopular = variant.comfortCategory === 'comfort';
              
              return (
                <button
                  key={variant.id}
                  onClick={() => onSelect(variant)}
                  className={`
                    relative p-4 rounded-xl border-2 text-left transition-all hover:shadow-md
                    ${isPopular 
                      ? `border-amber-300 bg-amber-50 hover:border-amber-400` 
                      : `border-slate-200 bg-white hover:border-blue-400`
                    }
                  `}
                >
                  {isPopular && (
                    <div className="absolute -top-2 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-amber-500 text-white text-[10px] font-bold rounded-full">
                      En Popüler
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-lg">{config.icon}</span>
                    <span className="text-lg font-bold text-slate-900">
                      {formatPrice(variant.price.amount, variant.price.currency)}
                    </span>
                  </div>
                  
                  <h5 className="font-semibold text-slate-800 mb-2">{config.label}</h5>
                  
                  <div className="space-y-1 mb-3">
                    {config.features.slice(0, 3).map((feature, i) => (
                      <div key={i} className="flex items-center gap-1.5 text-xs text-slate-600">
                        <Check className="w-3 h-3 text-green-500" />
                        {feature}
                      </div>
                    ))}
                  </div>
                  
                  <div className="flex items-center gap-3 text-xs">
                    {variant.isRefundable ? (
                      <span className="text-green-600 flex items-center gap-1">
                        <Check className="w-3 h-3" /> İade
                      </span>
                    ) : (
                      <span className="text-slate-400 flex items-center gap-1">
                        <X className="w-3 h-3" /> İade Yok
                      </span>
                    )}
                    {variant.isExchangeable ? (
                      <span className="text-green-600 flex items-center gap-1">
                        <Check className="w-3 h-3" /> Değişim
                      </span>
                    ) : (
                      <span className="text-slate-400 flex items-center gap-1">
                        <X className="w-3 h-3" /> Değişim Yok
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// MAIN CONTENT
// ============================================================

function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // URL params
  const origin = searchParams.get('origin') || '';
  const destination = searchParams.get('destination') || '';
  const date = searchParams.get('date') || '';
  const returnDate = searchParams.get('returnDate') || '';
  const tripType = searchParams.get('tripType') || 'oneway';
  const directOnlyParam = searchParams.get('directOnly') === 'true';
  const adults = parseInt(searchParams.get('adults') || '1');
  const children = parseInt(searchParams.get('children') || '0');

  const isRoundTrip = tripType === 'roundtrip' && !!returnDate;

  // State
  const [outboundJourneys, setOutboundJourneys] = useState<Journey[]>([]);
  const [returnJourneys, setReturnJourneys] = useState<Journey[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Round-trip flow state
  const [phase, setPhase] = useState<TripPhase>('outbound');
  const [selectedJourneys, setSelectedJourneys] = useState<SelectedJourneys>({ outbound: null, return: null });

  // Filter state
  const [selectedTimeSlots, setSelectedTimeSlots] = useState<string[]>([]);
  const [directOnly, setDirectOnly] = useState(directOnlyParam);
  const [sortBy, setSortBy] = useState<SortOption>('departure');

  // Fetch journeys
  useEffect(() => {
    const fetchJourneys = async () => {
      if (!origin || !destination || !date) {
        setError('Arama parametreleri eksik');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        // Fetch outbound
        const outboundRes = await searchJourneys({
          origin,
          destination,
          departureDate: date,
          adults,
          children,
        });
        setOutboundJourneys(toJourneyArray(outboundRes));

        // Fetch return if round-trip
        if (isRoundTrip && returnDate) {
          const returnRes = await searchJourneys({
            origin: destination,
            destination: origin,
            departureDate: returnDate,
            adults,
            children,
          });
          setReturnJourneys(toJourneyArray(returnRes));
        }
      } catch (err) {
        console.error('Search error:', err);
        setError('Seferler yüklenirken bir hata oluştu');
      } finally {
        setLoading(false);
      }
    };

    fetchJourneys();
  }, [origin, destination, date, returnDate, adults, children, isRoundTrip]);

  // Current journeys based on phase
  const currentJourneys = phase === 'outbound' ? outboundJourneys : returnJourneys;

  // Direct count
  const directCount = useMemo(() => 
    currentJourneys.filter(j => !j.segments || j.segments.length <= 1).length,
  [currentJourneys]);

  // Find cheapest and fastest
  const { cheapestId, fastestId } = useMemo(() => {
    if (currentJourneys.length === 0) return { cheapestId: '', fastestId: '' };
    
    const standardJourneys = currentJourneys.filter(j => j.comfortCategory === 'standard');
    if (standardJourneys.length === 0) return { cheapestId: '', fastestId: '' };
    
    const cheapest = standardJourneys.reduce((min, j) => j.price.amount < min.price.amount ? j : min, standardJourneys[0]);
    const fastest = standardJourneys.reduce((min, j) => j.durationMinutes < min.durationMinutes ? j : min, standardJourneys[0]);
    
    return { cheapestId: cheapest.id, fastestId: fastest.id };
  }, [currentJourneys]);

  // Filter and sort
  const filteredGroups = useMemo(() => {
    let filtered = [...currentJourneys];

    // Direct only
    if (directOnly) {
      filtered = filtered.filter(j => !j.segments || j.segments.length <= 1);
    }

    // Time slots
    if (selectedTimeSlots.length > 0) {
      filtered = filtered.filter(j => {
        const hour = getHourFromDate(j.departure);
        return selectedTimeSlots.some(slotId => {
          const slot = TIME_SLOTS.find(s => s.id === slotId);
          if (!slot) return false;
          if (slot.start < slot.end) {
            return hour >= slot.start && hour < slot.end;
          } else {
            return hour >= slot.start || hour < slot.end;
          }
        });
      });
    }

    // Group and sort
    const grouped = groupJourneysBySolution(filtered);
    const groupedArray = Array.from(grouped.entries());

    groupedArray.sort((a, b) => {
      const aCheapest = a[1].reduce((min, j) => j.price.amount < min.price.amount ? j : min, a[1][0]);
      const bCheapest = b[1].reduce((min, j) => j.price.amount < min.price.amount ? j : min, b[1][0]);

      switch (sortBy) {
        case 'price': return aCheapest.price.amount - bCheapest.price.amount;
        case 'duration': return aCheapest.durationMinutes - bCheapest.durationMinutes;
        default: return new Date(aCheapest.departure).getTime() - new Date(bCheapest.departure).getTime();
      }
    });

    return groupedArray;
  }, [currentJourneys, directOnly, selectedTimeSlots, sortBy]);

  // Toggle time slot
  const toggleTimeSlot = useCallback((slotId: string) => {
    setSelectedTimeSlots(prev => 
      prev.includes(slotId) ? prev.filter(id => id !== slotId) : [...prev, slotId]
    );
  }, []);

  // Handle journey selection
  const handleSelectJourney = useCallback((journey: Journey) => {
    if (isRoundTrip) {
      if (phase === 'outbound') {
        setSelectedJourneys(prev => ({ ...prev, outbound: journey }));
        setPhase('return');
        setSelectedTimeSlots([]);
      } else {
        // Both selected - go to booking
        const outbound = selectedJourneys.outbound!;
        sessionStorage.setItem('selectedOutbound', JSON.stringify(outbound));
        sessionStorage.setItem('selectedReturn', JSON.stringify(journey));
        sessionStorage.setItem('passengers', JSON.stringify({ adults, children }));
        sessionStorage.setItem('tripType', 'roundtrip');
        router.push('/booking');
      }
    } else {
      sessionStorage.setItem('selectedJourney', JSON.stringify(journey));
      sessionStorage.setItem('passengers', JSON.stringify({ adults, children }));
      sessionStorage.setItem('tripType', 'oneway');
      router.push('/booking');
    }
  }, [isRoundTrip, phase, selectedJourneys.outbound, adults, children, router]);

  // Edit outbound selection
  const handleEditOutbound = useCallback(() => {
    setPhase('outbound');
    setSelectedJourneys(prev => ({ ...prev, outbound: null }));
  }, []);

  // Clear filters
  const clearFilters = useCallback(() => {
    setSelectedTimeSlots([]);
    setDirectOnly(false);
  }, []);

  // Route display names
  const originName = outboundJourneys[0]?.origin?.city || origin;
  const destinationName = outboundJourneys[0]?.destination?.city || destination;

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-100 to-white">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex items-center justify-between h-14">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <Train className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-slate-900">EuroTrain</span>
            </Link>
            <Link href="/" className="text-sm text-slate-600 hover:text-blue-600 flex items-center gap-1">
              <ArrowLeft className="w-4 h-4" />
              Yeni Arama
            </Link>
          </div>
        </div>
      </header>

      {/* Progress Steps */}
      <ProgressSteps 
        phase={phase} 
        isRoundTrip={isRoundTrip} 
        outboundSelected={!!selectedJourneys.outbound}
      />

      {/* Route Summary */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <MapPin className="w-5 h-5 text-blue-200" />
              <span className="font-semibold">{phase === 'outbound' ? originName : destinationName}</span>
              <ArrowRight className="w-4 h-4 text-blue-200" />
              <span className="font-semibold">{phase === 'outbound' ? destinationName : originName}</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-blue-100">
              <div className="flex items-center gap-1 bg-white/10 px-3 py-1 rounded-full">
                <Calendar className="w-4 h-4" />
                {formatDateShort(phase === 'outbound' ? date : returnDate)}
              </div>
              <div className="flex items-center gap-1 bg-white/10 px-3 py-1 rounded-full">
                <Users className="w-4 h-4" />
                {adults + children} Yolcu
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* Selected Outbound Summary (when on return phase) */}
        {isRoundTrip && phase === 'return' && selectedJourneys.outbound && (
          <SelectedJourneySummary
            journey={selectedJourneys.outbound}
            label="Gidiş"
            onEdit={handleEditOutbound}
          />
        )}

        {/* Filters */}
        <FilterPills
          selectedSlots={selectedTimeSlots}
          onToggle={toggleTimeSlot}
          directOnly={directOnly}
          onDirectChange={setDirectOnly}
          directCount={directCount}
          totalCount={currentJourneys.length}
        />

        {/* Sort & Count */}
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm text-slate-600">
            <strong className="text-slate-900">{filteredGroups.length}</strong> sefer bulundu
          </span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white"
          >
            <option value="departure">Kalkış Saati</option>
            <option value="price">Fiyat (En Ucuz)</option>
            <option value="duration">Süre (En Kısa)</option>
          </select>
        </div>

        {/* Results */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-10 h-10 text-blue-500 animate-spin mb-4" />
            <p className="text-slate-600">Seferler aranıyor...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-20">
            <AlertCircle className="w-10 h-10 text-red-500 mb-4" />
            <p className="text-slate-800 font-medium">{error}</p>
          </div>
        ) : filteredGroups.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Train className="w-10 h-10 text-slate-300 mb-4" />
            <p className="text-slate-800 font-medium mb-2">Sefer bulunamadı</p>
            <p className="text-slate-500 text-sm mb-4">Filtreleri değiştirmeyi deneyin</p>
            <button
              onClick={clearFilters}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1"
            >
              <RefreshCw className="w-4 h-4" />
              Filtreleri Temizle
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredGroups.map(([key, variants]) => {
              const journey = variants[0];
              const isCheapest = variants.some(v => v.id === cheapestId);
              const isFastest = variants.some(v => v.id === fastestId);
              
              return (
                <JourneyCard
                  key={key}
                  journey={journey}
                  variants={variants}
                  isSelected={false}
                  isCheapest={isCheapest}
                  isFastest={isFastest && !isCheapest}
                  onSelect={handleSelectJourney}
                />
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}

// ============================================================
// MAIN PAGE
// ============================================================

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
      </div>
    }>
      <SearchContent />
    </Suspense>
  );
}
