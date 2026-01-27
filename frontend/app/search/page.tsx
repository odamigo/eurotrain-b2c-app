'use client';

import { useEffect, useState, useMemo, Suspense, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Loader2, AlertCircle, Train } from 'lucide-react';
import { 
  searchJourneys, 
  toJourneyArray, 
  formatPrice,
  formatTime,
  Journey,
  EraSearchResponse 
} from '@/lib/api/era-client';
import { TIME_FILTERS } from '@/lib/constants/search.constants';
import { AlertBanner } from '@/components/common';
import {
  SearchHeader,
  FilterBar,
  JourneyCard,
  ConditionsModal,
  SelectedOutboundBanner,
} from '@/components/search';
import type { Alert } from '@/lib/types/common.types';

// ============================================================
// MAIN SEARCH CONTENT
// ============================================================

function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  // URL params
  const origin = searchParams.get('origin') || '';
  const destination = searchParams.get('destination') || '';
  const date = searchParams.get('date') || '';
  const returnDate = searchParams.get('returnDate') || '';
  const passengersParam = searchParams.get('passengers') || '1';
  const tripType = searchParams.get('tripType') || 'oneway';
  const directOnly = searchParams.get('directOnly') === 'true';

  // State
  const [journeys, setJourneys] = useState<Journey[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedJourney, setExpandedJourney] = useState<string | null>(null);
  const [selectedTimeFilters, setSelectedTimeFilters] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState('departure');
  const [showDirectOnly, setShowDirectOnly] = useState(directOnly);
  const [searchResponse, setSearchResponse] = useState<EraSearchResponse | null>(null);
  
  // Round-trip state
  const [phase, setPhase] = useState<'outbound' | 'return'>('outbound');
  const [selectedOutbound, setSelectedOutbound] = useState<Journey | null>(null);

  // Conditions modal state
  const [conditionsModal, setConditionsModal] = useState<{ isOpen: boolean; journey: Journey | null }>({
    isOpen: false,
    journey: null
  });

  // Alerts state
  const [alerts, setAlerts] = useState<Alert[]>([]);

  const isRoundTrip = tripType === 'roundtrip' && returnDate;
  const passengers = parseInt(passengersParam) || 1;

  // Origin/Destination names
  const [originName, setOriginName] = useState(origin);
  const [destinationName, setDestinationName] = useState(destination);

  // Fetch journeys
  useEffect(() => {
    const fetchJourneys = async () => {
      if (!origin || !destination || !date) {
        setError('Eksik arama parametreleri');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const searchDate = phase === 'return' && returnDate ? returnDate : date;
        const searchOrigin = phase === 'return' ? destination : origin;
        const searchDestination = phase === 'return' ? origin : destination;

        const response = await searchJourneys({
          origin: searchOrigin,
          destination: searchDestination,
          departureDate: searchDate,
          passengers,
          directOnly: showDirectOnly,
        });

        setSearchResponse(response);
        const journeyList = toJourneyArray(response);
        setJourneys(journeyList);
        
        // Set origin/destination names
        if (response.origin) setOriginName(response.origin.label || origin);
        if (response.destination) setDestinationName(response.destination.label || destination);

      } catch (err) {
        console.error('Search error:', err);
        setError('Sefer arama sırasında bir hata oluştu');
        setAlerts(prev => {
          // Prevent duplicate errors
          if (prev.some(a => a.type === 'error')) return prev;
          return [...prev, {
            id: 'error-' + Date.now(),
            type: 'error',
            message: 'Bağlantı hatası. Lütfen tekrar deneyin.',
            dismissible: true
          }];
        });
      } finally {
        setLoading(false);
      }
    };

    fetchJourneys();
  }, [origin, destination, date, returnDate, passengers, showDirectOnly, phase]);

  // Filter and sort journeys
  const filteredJourneys = useMemo(() => {
    let result = [...journeys];

    // Time filter
    if (selectedTimeFilters.length > 0) {
      result = result.filter(j => {
        const hour = new Date(j.departure).getHours();
        return selectedTimeFilters.some(filterId => {
          const filter = TIME_FILTERS.find(f => f.id === filterId);
          return filter && hour >= filter.start && hour < filter.end;
        });
      });
    }

    // Direct only filter
    if (showDirectOnly) {
      result = result.filter(j => j.isDirect !== false && (j.segmentCount || 1) === 1);
    }

    // Sort
    switch (sortBy) {
      case 'price':
        result.sort((a, b) => a.price.amount - b.price.amount);
        break;
      case 'duration':
        result.sort((a, b) => a.durationMinutes - b.durationMinutes);
        break;
      case 'arrival':
        result.sort((a, b) => new Date(a.arrival).getTime() - new Date(b.arrival).getTime());
        break;
      case 'departure':
      default:
        result.sort((a, b) => new Date(a.departure).getTime() - new Date(b.departure).getTime());
    }

    return result;
  }, [journeys, selectedTimeFilters, showDirectOnly, sortBy]);

  // Calculate stats
  const directCount = useMemo(() => 
    journeys.filter(j => j.isDirect !== false && (j.segmentCount || 1) === 1).length
  , [journeys]);

  const { cheapestId, fastestId } = useMemo(() => {
    if (filteredJourneys.length === 0) return { cheapestId: null, fastestId: null };
    
    const cheapest = filteredJourneys.reduce((min, j) => 
      j.price.amount < min.price.amount ? j : min
    );
    const fastest = filteredJourneys.reduce((min, j) => 
      j.durationMinutes < min.durationMinutes ? j : min
    );
    
    return { cheapestId: cheapest.id, fastestId: fastest.id };
  }, [filteredJourneys]);

  // Handlers
  const toggleTimeFilter = useCallback((filterId: string) => {
    setSelectedTimeFilters(prev =>
      prev.includes(filterId)
        ? prev.filter(id => id !== filterId)
        : [...prev, filterId]
    );
  }, []);

  const dismissAlert = useCallback((id: string) => {
    setAlerts(prev => prev.filter(a => a.id !== id));
  }, []);

  const showConditions = useCallback((journey: Journey) => {
    setConditionsModal({ isOpen: true, journey });
  }, []);

  const handleSelectJourney = useCallback((journey: Journey, comfortCategory: string) => {
    const selectedJourney = {
      ...journey,
      comfortCategory,
      price: {
        amount: Math.round(journey.price.amount * (comfortCategory === 'comfort' ? 1.6 : comfortCategory === 'premier' ? 2.2 : 1)),
        currency: journey.price.currency
      },
      isRefundable: comfortCategory !== 'standard',
      isExchangeable: true,
    };

    if (isRoundTrip && phase === 'outbound') {
      // Save outbound and switch to return
      setSelectedOutbound(selectedJourney);
      sessionStorage.setItem('selectedOutbound', JSON.stringify(selectedJourney));
      setPhase('return');
      setExpandedJourney(null);
    } else {
      // Final selection - go to booking
      if (isRoundTrip) {
        sessionStorage.setItem('selectedReturn', JSON.stringify(selectedJourney));
        sessionStorage.setItem('tripType', 'roundtrip');
      } else {
        sessionStorage.setItem('selectedJourney', JSON.stringify(selectedJourney));
        sessionStorage.setItem('tripType', 'oneway');
      }
      
      // Store passengers
      sessionStorage.setItem('passengers', JSON.stringify({ adults: passengers, children: 0 }));
      
      router.push(`/booking?passengers=${passengers}`);
    }
  }, [isRoundTrip, phase, passengers, router]);

  const handleChangeOutbound = useCallback(() => {
    setPhase('outbound');
    setSelectedOutbound(null);
    sessionStorage.removeItem('selectedOutbound');
  }, []);

  // Render
  return (
    <main className="min-h-screen bg-slate-50">
      {/* Header */}
      <SearchHeader
        originName={originName}
        destinationName={destinationName}
        date={date}
        returnDate={returnDate}
        passengers={passengers}
        isRoundTrip={!!isRoundTrip}
        phase={phase}
      />

      {/* Selected Outbound Summary (Sticky) */}
      {isRoundTrip && selectedOutbound && phase === 'return' && (
        <SelectedOutboundBanner
          journey={selectedOutbound}
          onChangeClick={handleChangeOutbound}
        />
      )}

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        {/* Alerts */}
        <AlertBanner alerts={alerts} onDismiss={dismissAlert} />

        {/* Filters */}
        <FilterBar
          selectedTimeFilters={selectedTimeFilters}
          onTimeFilterToggle={toggleTimeFilter}
          showDirectOnly={showDirectOnly}
          onDirectOnlyToggle={() => setShowDirectOnly(!showDirectOnly)}
          directCount={directCount}
          sortBy={sortBy}
          onSortChange={setSortBy}
        />

        {/* Results */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
            <p className="text-slate-600">Seferler aranıyor...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-700 font-medium">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Tekrar Dene
            </button>
          </div>
        ) : filteredJourneys.length === 0 ? (
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-8 text-center">
            <Train className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <p className="text-slate-600 font-medium">Bu kriterlere uygun sefer bulunamadı</p>
            <p className="text-slate-500 text-sm mt-2">Filtreleri değiştirmeyi veya farklı bir tarih seçmeyi deneyin</p>
            {showDirectOnly && (
              <button
                onClick={() => setShowDirectOnly(false)}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
              >
                Aktarmalı Seferleri de Göster
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <div className="text-sm text-slate-500 mb-4">
              {filteredJourneys.length} sefer bulundu
            </div>
            {filteredJourneys.map(journey => (
              <JourneyCard
                key={journey.id}
                journey={journey}
                isExpanded={expandedJourney === journey.id}
                onToggle={() => setExpandedJourney(expandedJourney === journey.id ? null : journey.id)}
                onSelect={(comfortCategory) => handleSelectJourney(journey, comfortCategory)}
                isCheapest={journey.id === cheapestId}
                isFastest={journey.id === fastestId}
                onShowConditions={showConditions}
              />
            ))}
          </div>
        )}
      </div>

      {/* Conditions Modal */}
      <ConditionsModal
        isOpen={conditionsModal.isOpen}
        onClose={() => setConditionsModal({ isOpen: false, journey: null })}
        journey={conditionsModal.journey}
      />
    </main>
  );
}

// ============================================================
// MAIN EXPORT WITH SUSPENSE
// ============================================================

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    }>
      <SearchContent />
    </Suspense>
  );
}
