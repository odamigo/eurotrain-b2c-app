'use client';

import Link from 'next/link';
import { ArrowLeft, Calendar, Users, Check } from 'lucide-react';

interface SearchHeaderProps {
  originName: string;
  destinationName: string;
  date: string;
  returnDate?: string;
  passengers: number;
  isRoundTrip: boolean;
  phase: 'outbound' | 'return';
}

// Format date for display
function formatDateDisplay(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'short',
      weekday: 'short',
    });
  } catch {
    return dateStr;
  }
}

export function SearchHeader({
  originName,
  destinationName,
  date,
  returnDate,
  passengers,
  isRoundTrip,
  phase,
}: SearchHeaderProps) {
  // Swap for return phase
  const displayOrigin = phase === 'return' ? destinationName : originName;
  const displayDestination = phase === 'return' ? originName : destinationName;
  const displayDate = phase === 'return' && returnDate ? returnDate : date;

  return (
    <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
      <div className="container mx-auto px-4 py-4">
        {/* Back Button & Route */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              aria-label="Ana sayfaya dön"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-xl font-bold">
                {displayOrigin} → {displayDestination}
              </h1>
              <div className="flex items-center gap-4 text-sm text-blue-100 mt-1">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" />
                  <span>{formatDateDisplay(displayDate)}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Users className="w-4 h-4" />
                  <span>{passengers} Yolcu</span>
                </div>
                {isRoundTrip && (
                  <span className="px-2 py-0.5 bg-blue-500/30 text-white text-xs font-medium rounded-full">
                    Gidiş-Dönüş
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Round-trip Progress Steps */}
        {isRoundTrip && (
          <div className="flex items-center justify-center gap-4 mt-4 pt-4 border-t border-white/20">
            <div className={`flex items-center gap-2 ${phase === 'outbound' ? 'text-white' : 'text-green-300'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                phase === 'outbound' ? 'bg-white text-blue-600' : 'bg-green-400/30 text-green-300'
              }`}>
                {phase === 'outbound' ? '1' : <Check className="w-5 h-5" />}
              </div>
              <span className="font-medium">Gidiş</span>
            </div>
            <div className="w-12 h-0.5 bg-white/30" />
            <div className={`flex items-center gap-2 ${phase === 'return' ? 'text-white' : 'text-white/50'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                phase === 'return' ? 'bg-white text-blue-600' : 'bg-white/20 text-white/50'
              }`}>
                2
              </div>
              <span className="font-medium">Dönüş</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default SearchHeader;
