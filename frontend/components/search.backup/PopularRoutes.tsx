'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Train, Clock, Loader2 } from 'lucide-react';
import { getPopularRoutes, PopularRoute } from '@/lib/api/client';

export function PopularRoutes() {
  const router = useRouter();
  const [routes, setRoutes] = useState<PopularRoute[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRoutes = async () => {
      try {
        const data = await getPopularRoutes();
        setRoutes(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Error fetching popular routes:', err);
        setError('Popüler rotalar yüklenemedi');
      } finally {
        setIsLoading(false);
      }
    };

    fetchRoutes();
  }, []);

  const handleRouteClick = (route: PopularRoute) => {
    // Get tomorrow's date as default
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split('T')[0];

    const params = new URLSearchParams({
      origin: route.origin?.code || '',
      destination: route.destination?.code || '',
      date: dateStr,
      adults: '1',
      children: '0',
    });

    router.push(`/search?${params.toString()}`);
  };

  // Country flag emoji helper
  const getCountryFlag = (countryCode: string | undefined) => {
    if (!countryCode) return '🚂';
    const codePoints = countryCode
      .toUpperCase()
      .split('')
      .map((char) => 127397 + char.charCodeAt(0));
    return String.fromCodePoint(...codePoints);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  if (error || routes.length === 0) {
    return null;
  }

  return (
    <div className="w-full">
      <h2 className="text-2xl font-bold text-slate-900 mb-6 text-center">
        Popüler Rotalar
      </h2>
      
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {routes.slice(0, 6).map((route, index) => (
          <button
            key={index}
            onClick={() => handleRouteClick(route)}
            className="group bg-white rounded-xl p-5 border border-slate-200 
                       hover:border-blue-300 hover:shadow-lg
                       transition-all duration-300 text-left"
          >
            {/* Route Header */}
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">{getCountryFlag(route.origin?.countryCode)}</span>
              <span className="font-semibold text-slate-900 truncate">
                {route.origin?.city || route.origin?.name || 'Bilinmiyor'}
              </span>
              <ArrowRight className="w-4 h-4 text-slate-400 flex-shrink-0 
                                     group-hover:text-blue-500 group-hover:translate-x-1 
                                     transition-all duration-200" />
              <span className="text-lg">{getCountryFlag(route.destination?.countryCode)}</span>
              <span className="font-semibold text-slate-900 truncate">
                {route.destination?.city || route.destination?.name || 'Bilinmiyor'}
              </span>
            </div>

            {/* Route Details */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 text-sm text-slate-500">
                <div className="flex items-center gap-1">
                  <Train className="w-4 h-4" />
                  <span>{route.trainType || 'Tren'}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span>{route.duration || '-'}</span>
                </div>
              </div>
              
              <div className="text-right">
                <span className="text-xs text-slate-500">from</span>
                <div className="text-lg font-bold text-blue-600">
                  €{route.minPrice || route.price || 0}
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
