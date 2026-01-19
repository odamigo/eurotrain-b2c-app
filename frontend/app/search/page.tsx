'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Train, ArrowLeft, Calendar, Users, ArrowRight, 
  Loader2, AlertCircle, SlidersHorizontal 
} from 'lucide-react';
import { searchJourneys, Journey, JourneySearchResult } from '@/lib/api/client';
import { JourneyCard } from '@/components/search/JourneyCard';

function SearchResultsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const [results, setResults] = useState<JourneySearchResult | null>(null);
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
        
        const data = await searchJourneys({
          origin,
          destination,
          departureDate: date,
          passengers: { adults, children },
        });
        
        setResults(data);
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
    // Store journey in sessionStorage for booking page
    sessionStorage.setItem('selectedJourney', JSON.stringify(journey));
    sessionStorage.setItem('passengers', JSON.stringify({ adults, children }));
    
    // Navigate to booking page
    router.push(`/booking?journeyId=${journey.id}`);
  };

  // Format date for display
  const formatDisplayDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('tr-TR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
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
              {results && (
                <>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{results.origin.city}</div>
                    <div className="text-sm text-blue-200">{results.origin.name}</div>
                  </div>
                  <ArrowRight className="w-6 h-6 text-blue-200" />
                  <div className="text-center">
                    <div className="text-2xl font-bold">{results.destination.city}</div>
                    <div className="text-sm text-blue-200">{results.destination.name}</div>
                  </div>
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
        {results && !isLoading && !error && (
          <>
            {/* Results Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  {results.journeys.length} Sefer Bulundu
                </h2>
                <p className="text-slate-500 text-sm">
                  En ucuz fiyatlar gösterilmektedir
                </p>
              </div>
              
              <button className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors">
                <SlidersHorizontal className="w-4 h-4" />
                <span>Filtrele</span>
              </button>
            </div>

            {/* Journey List */}
            {results.journeys.length > 0 ? (
              <div className="space-y-4">
                {results.journeys.map((journey) => (
                  <JourneyCard
                    key={journey.id}
                    journey={journey}
                    passengers={{ adults, children }}
                    onSelect={handleSelectJourney}
                  />
                ))}
              </div>
            ) : (
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
          </>
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