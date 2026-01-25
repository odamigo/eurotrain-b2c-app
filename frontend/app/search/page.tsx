'use client';

import { useEffect, useState, useMemo, Suspense, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Train, ArrowLeft, Clock, ArrowRight, Filter, ChevronDown, ChevronUp,
  Loader2, AlertCircle, MapPin, Calendar, Users, Zap, Wifi, Coffee,
  Check, X, RefreshCw, Info, ChevronRight, SlidersHorizontal
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
// CONSTANTS
// ============================================================

const TIME_FILTERS = [
  { id: 'night', label: 'Gece', shortLabel: '00-06', icon: '🌙', start: 0, end: 6 },
  { id: 'morning', label: 'Sabah', shortLabel: '06-12', icon: '☀️', start: 6, end: 12 },
  { id: 'afternoon', label: 'Öğlen', shortLabel: '12-18', icon: '🌤️', start: 12, end: 18 },
  { id: 'evening', label: 'Akşam', shortLabel: '18-24', icon: '🌅', start: 18, end: 24 },
];

const SORT_OPTIONS = [
  { id: 'departure', label: 'Kalkış Saati' },
  { id: 'price', label: 'Fiyat (En Ucuz)' },
  { id: 'duration', label: 'Süre (En Kısa)' },
];

const COMFORT_CONFIG: Record<string, { 
  label: string; 
  labelTr: string; 
  color: string; 
  bgColor: string;
  borderColor: string;
  icon: string;
  features: string[];
}> = {
  standard: { 
    label: 'Standard', 
    labelTr: 'Standart', 
    color: 'text-slate-700',
    bgColor: 'bg-slate-50',
    borderColor: 'border-slate-200',
    icon: '🎫',
    features: ['Standart koltuk', '1 el bagajı', 'Elektrik prizi']
  },
  comfort: { 
    label: 'Business', 
    labelTr: 'Business', 
    color: 'text-amber-700',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-300',
    icon: '💼',
    features: ['Geniş koltuk', 'Yemek servisi', 'Öncelikli biniş', 'Sessiz vagon']
  },
  premier: { 
    label: 'First Class', 
    labelTr: 'Birinci Sınıf', 
    color: 'text-purple-700',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-300',
    icon: '👑',
    features: ['Premium koltuk', 'Şampanya servisi', 'Lounge erişimi', 'Özel check-in', 'Ücretsiz WiFi']
  },
};

// Carrier logos/colors
const CARRIER_CONFIG: Record<string, { color: string; textColor: string; abbrev: string }> = {
  'EUROSTAR': { color: 'bg-yellow-400', textColor: 'text-slate-900', abbrev: 'ES' },
  'Eurostar': { color: 'bg-yellow-400', textColor: 'text-slate-900', abbrev: 'ES' },
  'SNCF': { color: 'bg-red-600', textColor: 'text-white', abbrev: 'TGV' },
  'TGV': { color: 'bg-red-600', textColor: 'text-white', abbrev: 'TGV' },
  'THALYS': { color: 'bg-red-700', textColor: 'text-white', abbrev: 'THA' },
  'Thalys': { color: 'bg-red-700', textColor: 'text-white', abbrev: 'THA' },
  'TRENITALIA': { color: 'bg-green-600', textColor: 'text-white', abbrev: 'TI' },
  'Frecciarossa': { color: 'bg-red-500', textColor: 'text-white', abbrev: 'FR' },
  'DBAHN': { color: 'bg-red-600', textColor: 'text-white', abbrev: 'DB' },
  'ICE': { color: 'bg-red-600', textColor: 'text-white', abbrev: 'ICE' },
  'RENFE': { color: 'bg-purple-600', textColor: 'text-white', abbrev: 'AVE' },
  'AVE': { color: 'bg-purple-600', textColor: 'text-white', abbrev: 'AVE' },
  'SBB': { color: 'bg-red-500', textColor: 'text-white', abbrev: 'SBB' },
  'OBB': { color: 'bg-red-600', textColor: 'text-white', abbrev: 'ÖBB' },
  'Railjet': { color: 'bg-red-600', textColor: 'text-white', abbrev: 'RJ' },
  'TGV Lyria': { color: 'bg-red-600', textColor: 'text-white', abbrev: 'TGV' },
  'EuroCity': { color: 'bg-blue-600', textColor: 'text-white', abbrev: 'EC' },
  'DEFAULT': { color: 'bg-blue-600', textColor: 'text-white', abbrev: 'TR' },
};

// ============================================================
// HELPER FUNCTIONS
// ============================================================

function getHourFromDate(isoString: string): number {
  try {
    return new Date(isoString).getHours();
  } catch {
    return 0;
  }
}

function getMinutesFromMidnight(isoString: string): number {
  try {
    const date = new Date(isoString);
    return date.getHours() * 60 + date.getMinutes();
  } catch {
    return 0;
  }
}

function formatMinutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

function getCarrierConfig(carrier: string) {
  return CARRIER_CONFIG[carrier] || CARRIER_CONFIG[carrier?.toUpperCase()] || CARRIER_CONFIG.DEFAULT;
}

function groupJourneysBySolution(journeys: Journey[]): Map<string, Journey[]> {
  const grouped = new Map<string, Journey[]>();
  
  journeys.forEach(journey => {
    const key = `${journey.departure}-${journey.trainNumber}`;
    if (!grouped.has(key)) {
      grouped.set(key, []);
    }
    grouped.get(key)!.push(journey);
  });

  return grouped;
}

// ============================================================
// COMPONENTS
// ============================================================

// Time Range Slider Component - FlixBus/Omio tarzı
function TimeRangeSlider({
  label,
  icon,
  minValue,
  maxValue,
  onChange,
  disabled = false,
}: {
  label: string;
  icon: React.ReactNode;
  minValue: number; // minutes from midnight (0-1440)
  maxValue: number;
  onChange: (min: number, max: number) => void;
  disabled?: boolean;
}) {
  const [localMin, setLocalMin] = useState(minValue);
  const [localMax, setLocalMax] = useState(maxValue);
  const [isDragging, setIsDragging] = useState(false);

  // Sync with parent
  useEffect(() => {
    setLocalMin(minValue);
    setLocalMax(maxValue);
  }, [minValue, maxValue]);

  const handleMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Math.min(parseInt(e.target.value), localMax - 30);
    setLocalMin(value);
  };

  const handleMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Math.max(parseInt(e.target.value), localMin + 30);
    setLocalMax(value);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    onChange(localMin, localMax);
  };

  const minPercent = (localMin / 1440) * 100;
  const maxPercent = (localMax / 1440) * 100;

  return (
    <div className={`${disabled ? 'opacity-50 pointer-events-none' : ''}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
          {icon}
          <span>{label}</span>
        </div>
        <div className="text-sm font-semibold text-blue-600">
          {formatMinutesToTime(localMin)} - {formatMinutesToTime(localMax)}
        </div>
      </div>
      
      {/* Slider Track */}
      <div className="relative h-2 bg-slate-200 rounded-full">
        {/* Active Range */}
        <div 
          className="absolute h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full"
          style={{ 
            left: `${minPercent}%`, 
            width: `${maxPercent - minPercent}%` 
          }}
        />
        
        {/* Min Slider */}
        <input
          type="range"
          min={0}
          max={1440}
          step={15}
          value={localMin}
          onChange={handleMinChange}
          onMouseDown={() => setIsDragging(true)}
          onMouseUp={handleMouseUp}
          onTouchEnd={handleMouseUp}
          className="absolute w-full h-full appearance-none bg-transparent pointer-events-none
            [&::-webkit-slider-thumb]:pointer-events-auto
            [&::-webkit-slider-thumb]:appearance-none
            [&::-webkit-slider-thumb]:w-5
            [&::-webkit-slider-thumb]:h-5
            [&::-webkit-slider-thumb]:bg-white
            [&::-webkit-slider-thumb]:border-2
            [&::-webkit-slider-thumb]:border-blue-500
            [&::-webkit-slider-thumb]:rounded-full
            [&::-webkit-slider-thumb]:shadow-md
            [&::-webkit-slider-thumb]:cursor-grab
            [&::-webkit-slider-thumb]:active:cursor-grabbing
            [&::-webkit-slider-thumb]:hover:scale-110
            [&::-webkit-slider-thumb]:transition-transform
            [&::-moz-range-thumb]:pointer-events-auto
            [&::-moz-range-thumb]:appearance-none
            [&::-moz-range-thumb]:w-5
            [&::-moz-range-thumb]:h-5
            [&::-moz-range-thumb]:bg-white
            [&::-moz-range-thumb]:border-2
            [&::-moz-range-thumb]:border-blue-500
            [&::-moz-range-thumb]:rounded-full
            [&::-moz-range-thumb]:shadow-md
            [&::-moz-range-thumb]:cursor-grab
          "
        />
        
        {/* Max Slider */}
        <input
          type="range"
          min={0}
          max={1440}
          step={15}
          value={localMax}
          onChange={handleMaxChange}
          onMouseDown={() => setIsDragging(true)}
          onMouseUp={handleMouseUp}
          onTouchEnd={handleMouseUp}
          className="absolute w-full h-full appearance-none bg-transparent pointer-events-none
            [&::-webkit-slider-thumb]:pointer-events-auto
            [&::-webkit-slider-thumb]:appearance-none
            [&::-webkit-slider-thumb]:w-5
            [&::-webkit-slider-thumb]:h-5
            [&::-webkit-slider-thumb]:bg-white
            [&::-webkit-slider-thumb]:border-2
            [&::-webkit-slider-thumb]:border-blue-500
            [&::-webkit-slider-thumb]:rounded-full
            [&::-webkit-slider-thumb]:shadow-md
            [&::-webkit-slider-thumb]:cursor-grab
            [&::-webkit-slider-thumb]:active:cursor-grabbing
            [&::-webkit-slider-thumb]:hover:scale-110
            [&::-webkit-slider-thumb]:transition-transform
            [&::-moz-range-thumb]:pointer-events-auto
            [&::-moz-range-thumb]:appearance-none
            [&::-moz-range-thumb]:w-5
            [&::-moz-range-thumb]:h-5
            [&::-moz-range-thumb]:bg-white
            [&::-moz-range-thumb]:border-2
            [&::-moz-range-thumb]:border-blue-500
            [&::-moz-range-thumb]:rounded-full
            [&::-moz-range-thumb]:shadow-md
            [&::-moz-range-thumb]:cursor-grab
          "
        />
      </div>
      
      {/* Time Labels */}
      <div className="flex justify-between mt-1 text-[10px] text-slate-400">
        <span>00:00</span>
        <span>06:00</span>
        <span>12:00</span>
        <span>18:00</span>
        <span>24:00</span>
      </div>
    </div>
  );
}

// Advanced Filters Panel
function AdvancedFiltersPanel({
  isOpen,
  onClose,
  departureRange,
  arrivalRange,
  onDepartureChange,
  onArrivalChange,
  onReset,
}: {
  isOpen: boolean;
  onClose: () => void;
  departureRange: { min: number; max: number };
  arrivalRange: { min: number; max: number };
  onDepartureChange: (min: number, max: number) => void;
  onArrivalChange: (min: number, max: number) => void;
  onReset: () => void;
}) {
  if (!isOpen) return null;

  const hasActiveFilters = 
    departureRange.min > 0 || 
    departureRange.max < 1440 || 
    arrivalRange.min > 0 || 
    arrivalRange.max < 1440;

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 mb-4 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-slate-800 flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4" />
          Detaylı Saat Filtresi
        </h3>
        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <button
              onClick={onReset}
              className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" />
              Sıfırla
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-4 h-4 text-slate-400" />
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {/* Departure Time Slider */}
        <TimeRangeSlider
          label="Kalkış Saati"
          icon={<MapPin className="w-4 h-4 text-green-600" />}
          minValue={departureRange.min}
          maxValue={departureRange.max}
          onChange={onDepartureChange}
        />

        {/* Arrival Time Slider */}
        <TimeRangeSlider
          label="Varış Saati"
          icon={<MapPin className="w-4 h-4 text-red-500" />}
          minValue={arrivalRange.min}
          maxValue={arrivalRange.max}
          onChange={onArrivalChange}
        />
      </div>

      {/* Info Text */}
      <div className="mt-4 pt-4 border-t border-slate-100">
        <p className="text-xs text-slate-500 flex items-start gap-1.5">
          <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
          <span>Slider'ları sürükleyerek tam saat aralığı belirleyebilirsiniz. Hızlı filtreler ile birlikte kullanılabilir.</span>
        </p>
      </div>
    </div>
  );
}

// Carrier Logo Badge
function CarrierBadge({ carrier, operatorName }: { carrier: string; operatorName?: string }) {
  const config = getCarrierConfig(operatorName || carrier);
  
  return (
    <div className={`
      inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-bold
      ${config.color} ${config.textColor}
    `}>
      <Train className="w-3 h-3" />
      <span>{operatorName || config.abbrev}</span>
    </div>
  );
}

// Feature Tags (for collapsed view)
function FeatureTags({ journey }: { journey: Journey }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {journey.trainType === 'High-Speed' && (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full text-xs">
          <Zap className="w-3 h-3" /> Yüksek Hız
        </span>
      )}
      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full text-xs">
        <Wifi className="w-3 h-3" /> WiFi
      </span>
      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full text-xs">
        <Coffee className="w-3 h-3" /> Restoran
      </span>
    </div>
  );
}

// Class Selection Card - Trainline Style
function ClassCard({ 
  journey, 
  isSelected,
  isPopular, 
  onSelect,
  onBook
}: { 
  journey: Journey; 
  isSelected: boolean;
  isPopular: boolean;
  onSelect: () => void;
  onBook: () => void;
}) {
  const config = COMFORT_CONFIG[journey.comfortCategory] || COMFORT_CONFIG.standard;
  const flexibilityLabel = typeof journey.flexibility === 'string' 
    ? journey.flexibility 
    : (journey.flexibility as any)?.label || '';
  
  return (
    <div 
      className={`
        relative rounded-xl border-2 transition-all duration-200 overflow-hidden cursor-pointer
        ${isSelected 
          ? `${config.borderColor} ${config.bgColor} shadow-md` 
          : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'
        }
      `}
      onClick={onSelect}
    >
      {/* Popular Badge */}
      {isPopular && (
        <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-amber-400 to-amber-500 text-white text-xs font-bold py-1 text-center">
          ⭐ En Popüler
        </div>
      )}

      {/* Main Content */}
      <div className={`p-4 ${isPopular ? 'pt-8' : ''}`}>
        {/* Header: Icon + Name + Price */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{config.icon}</span>
            <span className={`font-semibold ${config.color}`}>{config.labelTr}</span>
          </div>
          <div className="text-right">
            <div className="text-xl font-bold text-slate-800">
              {formatPrice(journey.price.amount, journey.price.currency)}
            </div>
            <div className="text-xs text-slate-500">kişi başı</div>
          </div>
        </div>

        {/* Quick Info: Refund + Exchange */}
        <div className="flex items-center gap-4 text-sm mb-3">
          <div className="flex items-center gap-1">
            {journey.isRefundable ? (
              <Check className="w-4 h-4 text-green-600" />
            ) : (
              <X className="w-4 h-4 text-slate-400" />
            )}
            <span className={journey.isRefundable ? 'text-green-700' : 'text-slate-400'}>
              İade
            </span>
          </div>
          <div className="flex items-center gap-1">
            {journey.isExchangeable ? (
              <Check className="w-4 h-4 text-green-600" />
            ) : (
              <X className="w-4 h-4 text-slate-400" />
            )}
            <span className={journey.isExchangeable ? 'text-green-700' : 'text-slate-400'}>
              Değişiklik
            </span>
          </div>
        </div>

        {/* Expand indicator when not selected */}
        {!isSelected && (
          <div className="text-xs text-blue-600 flex items-center gap-1">
            <Info className="w-3 h-3" />
            Detaylar için tıklayın
          </div>
        )}
      </div>

      {/* Expanded Details - Only when selected */}
      {isSelected && (
        <div className={`border-t ${config.borderColor} ${config.bgColor} p-4`}>
          {/* Features */}
          <div className="mb-4">
            <div className="text-xs font-semibold text-slate-600 mb-2">Bu sınıfa dahil:</div>
            <div className="grid grid-cols-1 gap-1.5">
              {config.features.map((feature, i) => (
                <div key={i} className="flex items-center gap-2 text-sm text-slate-700">
                  <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                  <span>{feature}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Flexibility Rules */}
          <div className="mb-4 p-3 bg-white/60 rounded-lg">
            <div className="text-xs font-semibold text-slate-600 mb-2">Bilet Koşulları:</div>
            <div className="space-y-2 text-sm">
              <div className="flex items-start gap-2">
                {journey.isRefundable ? (
                  <>
                    <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="text-green-700 font-medium">İade Edilebilir</span>
                      <p className="text-xs text-slate-500">Kalkıştan 24 saat öncesine kadar tam iade</p>
                    </div>
                  </>
                ) : (
                  <>
                    <X className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="text-red-600 font-medium">İade Edilemez</span>
                      <p className="text-xs text-slate-500">Bu bilet iade edilemez</p>
                    </div>
                  </>
                )}
              </div>
              <div className="flex items-start gap-2">
                {journey.isExchangeable ? (
                  <>
                    <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="text-green-700 font-medium">Değiştirilebilir</span>
                      <p className="text-xs text-slate-500">Kalkıştan önce ücretsiz değişiklik</p>
                    </div>
                  </>
                ) : (
                  <>
                    <X className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="text-red-600 font-medium">Değiştirilemez</span>
                      <p className="text-xs text-slate-500">Bu bilet değiştirilemez</p>
                    </div>
                  </>
                )}
              </div>
            </div>
            {flexibilityLabel && (
              <div className="mt-2 pt-2 border-t border-slate-200 text-xs text-slate-600">
                Esneklik seviyesi: <span className="font-semibold">{flexibilityLabel}</span>
              </div>
            )}
          </div>

          {/* Book Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onBook();
            }}
            className={`
              w-full py-3 rounded-lg font-semibold text-white transition-all
              flex items-center justify-center gap-2
              ${isPopular 
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700' 
                : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700'
              }
            `}
          >
            <span>Bu Bileti Seç</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}

// Journey Card (Accordion)
function JourneyCard({ 
  journeys, 
  isExpanded, 
  onToggle, 
  onSelect,
}: { 
  journeys: Journey[];
  isExpanded: boolean;
  onToggle: () => void;
  onSelect: (journey: Journey) => void;
}) {
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  
  // Sort by comfort category order: standard, comfort, premier
  const sortedJourneys = [...journeys].sort((a, b) => {
    const order = { standard: 0, comfort: 1, premier: 2 };
    return (order[a.comfortCategory] || 0) - (order[b.comfortCategory] || 0);
  });
  
  const cheapest = sortedJourneys.reduce((min, j) => j.price.amount < min.price.amount ? j : min, sortedJourneys[0]);

  // Reset selected class when collapsed
  useEffect(() => {
    if (!isExpanded) {
      setSelectedClass(null);
    }
  }, [isExpanded]);

  return (
    <div className={`
      bg-white rounded-xl border-2 transition-all duration-300 overflow-hidden
      ${isExpanded ? 'border-blue-400 shadow-lg' : 'border-slate-200 hover:border-slate-300'}
    `}>
      {/* Header - Click to expand/collapse */}
      <button
        onClick={onToggle}
        className="w-full p-4 text-left"
      >
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
          {/* Carrier Badge */}
          <div className="flex items-center gap-2">
            <CarrierBadge carrier={cheapest.operator} operatorName={cheapest.operatorName} />
            <span className="text-xs text-slate-500">{cheapest.trainNumber}</span>
          </div>

          {/* Time & Route */}
          <div className="flex items-center gap-3 flex-1">
            <div className="text-center min-w-[50px]">
              <div className="text-lg sm:text-xl font-bold text-slate-800">{formatTime(cheapest.departure)}</div>
              <div className="text-[10px] sm:text-xs text-slate-500 truncate max-w-[60px] sm:max-w-[80px]">{cheapest.origin.city}</div>
            </div>
            
            <div className="flex flex-col items-center flex-1 min-w-[50px]">
              <div className="w-full flex items-center">
                <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-blue-500" />
                <div className="flex-1 h-0.5 bg-gradient-to-r from-blue-500 to-blue-300" />
                <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-blue-300" />
              </div>
              <span className="text-[10px] sm:text-xs text-slate-500 mt-1">{formatDuration(cheapest.durationMinutes)}</span>
              <span className="text-[9px] sm:text-[10px] text-green-600 font-medium">Direkt</span>
            </div>
            
            <div className="text-center min-w-[50px]">
              <div className="text-lg sm:text-xl font-bold text-slate-800">{formatTime(cheapest.arrival)}</div>
              <div className="text-[10px] sm:text-xs text-slate-500 truncate max-w-[60px] sm:max-w-[80px]">{cheapest.destination.city}</div>
            </div>
          </div>

          {/* Price & Expand */}
          <div className="flex items-center justify-between sm:justify-end gap-4">
            <div className="text-right">
              <div className="text-[10px] sm:text-xs text-slate-500">başlayan fiyat</div>
              <div className="text-lg sm:text-xl font-bold text-green-600">
                {formatPrice(cheapest.price.amount, cheapest.price.currency)}
              </div>
            </div>
            <div className={`
              p-2 rounded-full bg-slate-100 transition-transform duration-300
              ${isExpanded ? 'rotate-180' : ''}
            `}>
              <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5 text-slate-500" />
            </div>
          </div>
        </div>

        {/* Feature Tags - Only in collapsed state */}
        {!isExpanded && (
          <div className="mt-3 pt-3 border-t border-slate-100">
            <FeatureTags journey={cheapest} />
          </div>
        )}
      </button>

      {/* Expanded Content - Class Selection */}
      {isExpanded && (
        <div className="border-t border-slate-200 p-4 bg-slate-50/50">
          <div className="mb-4">
            <h4 className="text-sm font-semibold text-slate-700 mb-1">Bilet Sınıfı Seçin</h4>
            <p className="text-xs text-slate-500">Detayları görmek için bir sınıfa tıklayın</p>
          </div>
          
          {/* Class Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {sortedJourneys.map((journey) => (
              <ClassCard
                key={journey.id}
                journey={journey}
                isSelected={selectedClass === journey.id}
                isPopular={journey.comfortCategory === 'comfort'}
                onSelect={() => setSelectedClass(selectedClass === journey.id ? null : journey.id)}
                onBook={() => onSelect(journey)}
              />
            ))}
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
  const adults = parseInt(searchParams.get('adults') || '1');
  const children = parseInt(searchParams.get('children') || '0');

  // State
  const [searchResponse, setSearchResponse] = useState<EraSearchResponse | null>(null);
  const [journeys, setJourneys] = useState<Journey[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // UI State
  const [expandedJourney, setExpandedJourney] = useState<string | null>(null);
  const [selectedTimeFilters, setSelectedTimeFilters] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<'departure' | 'price' | 'duration'>('departure');
  
  // Advanced Filters State
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [departureRange, setDepartureRange] = useState({ min: 0, max: 1440 });
  const [arrivalRange, setArrivalRange] = useState({ min: 0, max: 1440 });

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
        const response = await searchJourneys({
          origin,
          destination,
          departureDate: date,
          adults,
          children,
        });

        setSearchResponse(response);
        const journeyList = toJourneyArray(response);
        setJourneys(journeyList);
        
      } catch (err) {
        console.error('Search error:', err);
        setError('Seferler yüklenirken bir hata oluştu');
      } finally {
        setLoading(false);
      }
    };

    fetchJourneys();
  }, [origin, destination, date, adults, children]);

  // Filter and sort journeys
  const filteredAndSortedGroups = useMemo(() => {
    let filtered = [...journeys];

    // Quick Time filter (buttons)
    if (selectedTimeFilters.length > 0) {
      filtered = filtered.filter(j => {
        const hour = getHourFromDate(j.departure);
        return selectedTimeFilters.some(filterId => {
          const filter = TIME_FILTERS.find(f => f.id === filterId);
          return filter && hour >= filter.start && hour < filter.end;
        });
      });
    }

    // Advanced Time Range filter (sliders)
    if (departureRange.min > 0 || departureRange.max < 1440) {
      filtered = filtered.filter(j => {
        const minutes = getMinutesFromMidnight(j.departure);
        return minutes >= departureRange.min && minutes <= departureRange.max;
      });
    }

    if (arrivalRange.min > 0 || arrivalRange.max < 1440) {
      filtered = filtered.filter(j => {
        const minutes = getMinutesFromMidnight(j.arrival);
        return minutes >= arrivalRange.min && minutes <= arrivalRange.max;
      });
    }

    // Group by solution
    const grouped = groupJourneysBySolution(filtered);
    
    // Convert to array and sort
    const groupedArray = Array.from(grouped.entries());
    
    groupedArray.sort((a, b) => {
      const aJourneys = a[1];
      const bJourneys = b[1];
      const aCheapest = aJourneys.reduce((min, j) => j.price.amount < min.price.amount ? j : min, aJourneys[0]);
      const bCheapest = bJourneys.reduce((min, j) => j.price.amount < min.price.amount ? j : min, bJourneys[0]);

      switch (sortBy) {
        case 'price':
          return aCheapest.price.amount - bCheapest.price.amount;
        case 'duration':
          return aCheapest.durationMinutes - bCheapest.durationMinutes;
        case 'departure':
        default:
          return new Date(aCheapest.departure).getTime() - new Date(bCheapest.departure).getTime();
      }
    });

    return groupedArray;
  }, [journeys, selectedTimeFilters, sortBy, departureRange, arrivalRange]);

  // Toggle time filter
  const toggleTimeFilter = (filterId: string) => {
    setSelectedTimeFilters(prev => 
      prev.includes(filterId) 
        ? prev.filter(id => id !== filterId)
        : [...prev, filterId]
    );
  };

  // Reset advanced filters
  const resetAdvancedFilters = useCallback(() => {
    setDepartureRange({ min: 0, max: 1440 });
    setArrivalRange({ min: 0, max: 1440 });
  }, []);

  // Handle journey selection
  const handleSelectJourney = (journey: Journey) => {
    sessionStorage.setItem('selectedJourney', JSON.stringify(journey));
    sessionStorage.setItem('searchResponse', JSON.stringify(searchResponse));
    sessionStorage.setItem('passengers', JSON.stringify({ adults, children }));
    router.push('/booking');
  };

  // Format date display
  const formatDateDisplay = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('tr-TR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        weekday: 'long'
      });
    } catch {
      return dateStr;
    }
  };

  // Origin/destination names
  const originName = searchResponse?.legs?.[0]?.origin?.label || origin;
  const destinationName = searchResponse?.legs?.[0]?.destination?.label || destination;

  // Check if any advanced filter is active
  const hasAdvancedFilters = departureRange.min > 0 || departureRange.max < 1440 || arrivalRange.min > 0 || arrivalRange.max < 1440;

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16">
            <Link href="/" className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200">
                <Train className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <span className="text-lg sm:text-xl font-bold text-slate-900">EuroTrain</span>
            </Link>
            
            <Link
              href="/"
              className="flex items-center gap-1 sm:gap-2 text-slate-600 hover:text-blue-600 transition-colors text-sm sm:text-base"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Yeni Arama</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Route Summary */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 sm:py-6">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-blue-200" />
              <span className="font-semibold text-sm sm:text-base">{originName}</span>
              <ArrowRight className="w-4 h-4 text-blue-200" />
              <span className="font-semibold text-sm sm:text-base">{destinationName}</span>
            </div>
            <div className="flex items-center gap-3 sm:gap-4 text-blue-100 text-xs sm:text-sm">
              <div className="flex items-center gap-1 bg-white/10 px-2 sm:px-3 py-1 rounded-full">
                <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
                <span>{formatDateDisplay(date)}</span>
              </div>
              <div className="flex items-center gap-1 bg-white/10 px-2 sm:px-3 py-1 rounded-full">
                <Users className="w-3 h-3 sm:w-4 sm:h-4" />
                <span>{adults + children} Yolcu</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        {/* Filters */}
        <div className="mb-4 sm:mb-6">
          {/* Quick Time Filters + Advanced Toggle */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs sm:text-sm text-slate-600">Kalkış:</div>
              <button
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                className={`
                  flex items-center gap-1.5 text-xs sm:text-sm px-3 py-1.5 rounded-lg transition-all
                  ${showAdvancedFilters || hasAdvancedFilters
                    ? 'bg-blue-100 text-blue-700 font-medium'
                    : 'text-slate-600 hover:bg-slate-100'
                  }
                `}
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>Detaylı Filtre</span>
                {hasAdvancedFilters && (
                  <span className="w-2 h-2 bg-blue-600 rounded-full" />
                )}
              </button>
            </div>
            <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
              {TIME_FILTERS.map(filter => (
                <button
                  key={filter.id}
                  onClick={() => toggleTimeFilter(filter.id)}
                  className={`
                    flex flex-col items-center justify-center p-2 sm:p-3 rounded-lg sm:rounded-xl border-2 transition-all
                    ${selectedTimeFilters.includes(filter.id)
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                    }
                  `}
                >
                  <span className="text-base sm:text-lg">{filter.icon}</span>
                  <span className="text-[10px] sm:text-xs font-medium mt-0.5">{filter.shortLabel}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Advanced Filters Panel */}
          <AdvancedFiltersPanel
            isOpen={showAdvancedFilters}
            onClose={() => setShowAdvancedFilters(false)}
            departureRange={departureRange}
            arrivalRange={arrivalRange}
            onDepartureChange={(min, max) => setDepartureRange({ min, max })}
            onArrivalChange={(min, max) => setArrivalRange({ min, max })}
            onReset={resetAdvancedFilters}
          />

          {/* Sort */}
          <div className="flex items-center justify-between">
            <div className="text-xs sm:text-sm text-slate-600">
              {filteredAndSortedGroups.length} Sefer Bulundu
            </div>
            <div className="flex items-center gap-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="text-xs sm:text-sm border border-slate-200 rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {SORT_OPTIONS.map(opt => (
                  <option key={opt.id} value={opt.id}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Results */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-4" />
            <p className="text-slate-600">Seferler aranıyor...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-20">
            <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
            <p className="text-slate-800 font-medium mb-2">Bir hata oluştu</p>
            <p className="text-slate-600 text-sm">{error}</p>
          </div>
        ) : filteredAndSortedGroups.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Train className="w-12 h-12 text-slate-400 mb-4" />
            <p className="text-slate-800 font-medium mb-2">Sefer bulunamadı</p>
            <p className="text-slate-600 text-sm">Farklı tarih veya güzergah deneyin</p>
            {(selectedTimeFilters.length > 0 || hasAdvancedFilters) && (
              <button
                onClick={() => {
                  setSelectedTimeFilters([]);
                  resetAdvancedFilters();
                }}
                className="mt-4 text-blue-600 hover:text-blue-700 text-sm flex items-center gap-1"
              >
                <RefreshCw className="w-4 h-4" />
                Filtreleri Temizle
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            {/* Info text */}
            <p className="text-xs sm:text-sm text-slate-500">
              Fiyatlar kişi başı gösterilmektedir • Sınıf seçmek için sefere tıklayın
            </p>
            
            {filteredAndSortedGroups.map(([key, groupJourneys]) => (
              <JourneyCard
                key={key}
                journeys={groupJourneys}
                isExpanded={expandedJourney === key}
                onToggle={() => setExpandedJourney(expandedJourney === key ? null : key)}
                onSelect={handleSelectJourney}
              />
            ))}
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Yükleniyor...</p>
        </div>
      </div>
    }>
      <SearchContent />
    </Suspense>
  );
}
