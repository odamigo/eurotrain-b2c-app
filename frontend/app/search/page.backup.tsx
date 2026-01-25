'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Train, ArrowLeft, Calendar, Users, ArrowRight, 
  Loader2, AlertCircle, SlidersHorizontal, Clock,
  RefreshCw, ChevronDown
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
} from '@/lib/api/era-client';

// Journey Card Component
function JourneyCard({ 
  journey, 
  onSelect 
}: { 
  journey: Journey; 
  onSelect: (journey: Journey) => void;
}) {
  const durationStr = formatDuration(journey.durationMinutes);
  
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-all duration-200">
      <div className="p-6">
        <div className="flex items-center justify-between">
          {/* Left: Times and Route */}
          <div className="flex items-center gap-8">
            {/* Departure */}
            <div className="text-center">
              <div className="text-2xl font-bold text-slate-900">
                {formatTime(journey.departure)}
              </div>
              <div className="text-sm text-slate-500 mt-1">
                {journey.origin.city}
              </div>
            </div>

            {/* Duration Arrow */}
            <div className="flex flex-col items-center px-4">
              <div className="text-xs text-slate-400 mb-1">{durationStr}</div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-slate-300"></div>
                <div className="w-20 h-0.5 bg-slate-300"></div>
                <ArrowRight className="w-4 h-4 text-slate-400" />
              </div>
              <div className="text-xs text-slate-400 mt-1">
                {journey.segments.length > 1 
                  ? `${journey.segments.length - 1} aktarma` 
                  : 'Direkt'}
              </div>
            </div>

            {/* Arrival */}
            <div className="text-center">
              <div className="text-2xl font-bold text-slate-900">
                {formatTime(journey.arrival)}
              </div>
              <div className="text-sm text-slate-500 mt-1">
                {journey.destination.city}
              </div>
            </div>
          </div>

          {/* Center: Train Info */}
          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className="flex items-center gap-2">
                <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-sm font-medium">
                  {journey.trainType || 'Tren'}
                </span>
              </div>
              <div className="text-sm text-slate-500 mt-1">
                {journey.operator}
              </div>
              {journey.trainNumber && (
                <div className="text-xs text-slate-400">
                  {journey.trainNumber}
                </div>
              )}
            </div>
          </div>

          {/* Right: Price and Action */}
          <div className="text-right">
            <div className="text-2xl font-bold text-slate-900">
              {formatPrice(journey.price.amount, journey.price.currency)}
            </div>
            <div className="text-sm text-slate-500 mb-3">
              {journey.comfortCategory === 'standard' ? 'Standart' : 
               journey.comfortCategory === 'comfort' ? 'Konfor' : 'Premium'}
            </div>
            <button
              onClick={() => onSelect(journey)}
              className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white 
                         font-medium rounded-lg hover:from-blue-700 hover:to-indigo-700
                         transition-all duration-200"
            >
              Seç
            </button>
          </div>
        </div>

        {/* Bottom: Features */}
        <div className="flex items-center gap-4 mt-4 pt-4 border-t border-slate-100">
          {journey.isRefundable && (
            <span className="text-xs text-emerald-600 bg-emerald-50 px-2 py-1 rounded">
              ✓ İade edilebilir
            </span>
          )}
          {journey.isExchangeable && (
            <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
              ✓ Değiştirilebilir
            </span>
          )}
          {journey.flexibility?.label && (
            <span className="text-xs text-slate-500">
              {journey.flexibility.label}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// Main Search Results Content
function SearchResultsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const [searchResponse, setSearchResponse] = useState<EraSearchResponse | null>(null);
  const [journeys, setJourneys] = useState<Journey[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
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

  // Handle journey selection
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
    <main className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <Train className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-slate-900">EuroTrain</span>
            </Link>
            
            <Link 
              href="/"
              className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Yeni Arama</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Search Summary */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Route Info */}
            <div className="flex items-center gap-4">
              {searchResponse && (
                <>
                  <div className="text-center">
                    <div className="text-2xl font-bold">
                      {searchResponse.origin?.label || origin}
                    </div>
                    <div className="text-sm text-blue-200">
                      {searchResponse.origin?.country?.label || ''}
                    </div>
                  </div>
                  <ArrowRight className="w-6 h-6 text-blue-200" />
                  <div className="text-center">
                    <div className="text-2xl font-bold">
                      {searchResponse.destination?.label || destination}
                    </div>
                    <div className="text-sm text-blue-200">
                      {searchResponse.destination?.country?.label || ''}
                    </div>
                  </div>
                </>
              )}
              {!searchResponse && !isLoading && (
                <>
                  <div className="text-2xl font-bold">{origin}</div>
                  <ArrowRight className="w-6 h-6 text-blue-200" />
                  <div className="text-2xl font-bold">{destination}</div>
                </>
              )}
            </div>
            
            {/* Date & Passengers */}
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-200" />
                <span>{formatDisplayDate(date)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-200" />
                <span>
                  {adults} Yetişkin{children > 0 && `, ${children} Çocuk`}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Results Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Loading State */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-4" />
            <p className="text-slate-600">Seferler aranıyor...</p>
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
            <h3 className="text-xl font-semibold text-slate-900 mb-2">Bir Hata Oluştu</h3>
            <p className="text-slate-600 mb-6">{error}</p>
            <Link
              href="/"
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Ana Sayfaya Dön
            </Link>
          </div>
        )}

        {/* Results */}
        {!isLoading && !error && journeys.length > 0 && (
          <>
            {/* Results Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  {journeys.length} Sefer Bulundu
                </h2>
                <p className="text-slate-500 text-sm">
                  Fiyatlar kişi başı gösterilmektedir
                </p>
              </div>
              
              <button className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors">
                <SlidersHorizontal className="w-4 h-4" />
                <span>Filtrele</span>
              </button>
            </div>

            {/* Journey List */}
            <div className="space-y-4">
              {journeys.map((journey) => (
                <JourneyCard
                  key={journey.id}
                  journey={journey}
                  onSelect={handleSelectJourney}
                />
              ))}
            </div>
          </>
        )}

        {/* No Results */}
        {!isLoading && !error && journeys.length === 0 && searchResponse && (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Train className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-xl font-semibold text-slate-900 mb-2">
              Sefer Bulunamadı
            </h3>
            <p className="text-slate-600 mb-6">
              Bu tarih ve güzergah için uygun sefer bulunamamıştır.
            </p>
            <Link
              href="/"
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors inline-block"
            >
              Farklı Tarih Dene
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}

// Main page component with Suspense
export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
      </div>
    }>
      <SearchResultsContent />
    </Suspense>
  );
}
