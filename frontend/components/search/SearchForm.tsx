'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRightLeft, Calendar, Users, Search, Sparkles } from 'lucide-react';
import { StationAutocomplete } from './StationAutocomplete';
import { Station } from '@/lib/api/client';

export function SearchForm() {
  const router = useRouter();
  const [origin, setOrigin] = useState<Station | null>(null);
  const [destination, setDestination] = useState<Station | null>(null);
  const [departureDate, setDepartureDate] = useState('');
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Swap origin and destination
  const handleSwap = () => {
    const temp = origin;
    setOrigin(destination);
    setDestination(temp);
  };

  // Get minimum date (today)
  const getMinDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!origin || !destination || !departureDate) {
      return;
    }

    setIsSubmitting(true);

    // Build search params
    const params = new URLSearchParams({
  origin: (origin as any).id || origin.code,
  destination: (destination as any).id || destination.code,
      date: departureDate,
      adults: adults.toString(),
      children: children.toString(),
    });

    // Navigate to search results page
    router.push(`/search?${params.toString()}`);
  };

  const isFormValid = origin && destination && departureDate && adults > 0;

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-6 md:p-8 border border-slate-200/50">
        {/* Header */}
        <div className="flex items-center gap-2 mb-6">
          <Sparkles className="w-5 h-5 text-amber-500" />
          <span className="text-sm font-medium text-slate-600">
            Avrupa'nın en iyi tren fiyatlarını keşfedin
          </span>
        </div>

        {/* Station Inputs */}
        <div className="grid md:grid-cols-2 gap-4 mb-6">
          <div className="relative">
            <StationAutocomplete
              label="Nereden"
              placeholder="İstasyon ara..."
              value={origin}
              onChange={setOrigin}
              icon="origin"
            />
          </div>

          {/* Swap Button */}
          <div className="hidden md:flex absolute left-1/2 top-[140px] -translate-x-1/2 z-10">
            <button
              type="button"
              onClick={handleSwap}
              className="w-10 h-10 bg-white border-2 border-slate-200 rounded-full 
                         flex items-center justify-center shadow-md
                         hover:border-blue-500 hover:text-blue-500 transition-colors"
            >
              <ArrowRightLeft className="w-4 h-4" />
            </button>
          </div>

          <div className="relative">
            <StationAutocomplete
              label="Nereye"
              placeholder="İstasyon ara..."
              value={destination}
              onChange={setDestination}
              icon="destination"
            />
          </div>
        </div>

        {/* Mobile Swap Button */}
        <div className="flex md:hidden justify-center -mt-2 mb-4">
          <button
            type="button"
            onClick={handleSwap}
            className="w-10 h-10 bg-white border-2 border-slate-200 rounded-full 
                       flex items-center justify-center shadow-md
                       hover:border-blue-500 hover:text-blue-500 transition-colors"
          >
            <ArrowRightLeft className="w-4 h-4 rotate-90" />
          </button>
        </div>

        {/* Date and Passengers */}
        <div className="grid md:grid-cols-3 gap-4 mb-6">
          {/* Date Picker */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Tarih
            </label>
            <div className="relative">
              <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="date"
                value={departureDate}
                onChange={(e) => setDepartureDate(e.target.value)}
                min={getMinDate()}
                className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-xl 
                           text-slate-900 
                           focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                           transition-all duration-200"
              />
            </div>
          </div>

          {/* Adults */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Yetişkin
            </label>
            <div className="relative">
              <Users className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <select
                value={adults}
                onChange={(e) => setAdults(Number(e.target.value))}
                className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-xl 
                           text-slate-900 appearance-none cursor-pointer
                           focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                           transition-all duration-200"
              >
                {[1, 2, 3, 4, 5, 6].map((num) => (
                  <option key={num} value={num}>
                    {num} Yetişkin
                  </option>
                ))}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          {/* Children */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Çocuk (0-11)
            </label>
            <div className="relative">
              <Users className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <select
                value={children}
                onChange={(e) => setChildren(Number(e.target.value))}
                className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-xl 
                           text-slate-900 appearance-none cursor-pointer
                           focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                           transition-all duration-200"
              >
                {[0, 1, 2, 3, 4].map((num) => (
                  <option key={num} value={num}>
                    {num} Çocuk
                  </option>
                ))}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={!isFormValid || isSubmitting}
          className="w-full py-4 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 
                     text-white font-semibold rounded-xl
                     hover:from-blue-700 hover:to-indigo-700
                     focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                     disabled:opacity-50 disabled:cursor-not-allowed
                     transition-all duration-200 transform hover:scale-[1.02]
                     flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Aranıyor...</span>
            </>
          ) : (
            <>
              <Search className="w-5 h-5" />
              <span>Tren Ara</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}
