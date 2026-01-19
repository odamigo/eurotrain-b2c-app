'use client';

import { Train, Clock, ArrowRight, Users, Zap } from 'lucide-react';
import { Journey, formatDuration, formatTime } from '@/lib/api/client';

interface JourneyCardProps {
  journey: Journey;
  passengers: { adults: number; children: number };
  onSelect: (journey: Journey) => void;
}

export function JourneyCard({ journey, passengers, onSelect }: JourneyCardProps) {
  const totalPassengers = passengers.adults + passengers.children;
  const totalPrice = journey.price * totalPassengers;

  // Format departure and arrival times
  const departureTime = formatTime(journey.departureTime);
  const arrivalTime = formatTime(journey.arrivalTime);
  const duration = formatDuration(journey.duration);

  return (
    <div className="bg-white rounded-xl border border-slate-200 hover:border-blue-300 hover:shadow-lg transition-all duration-200 overflow-hidden">
      {/* Main Content */}
      <div className="p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Time and Route */}
          <div className="flex items-center gap-6 flex-1">
            {/* Departure */}
            <div className="text-center">
              <div className="text-2xl font-bold text-slate-900">{departureTime}</div>
              <div className="text-sm text-slate-500">{journey.origin.city}</div>
            </div>

            {/* Duration */}
            <div className="flex-1 flex flex-col items-center">
              <div className="text-xs text-slate-500 mb-1">{duration}</div>
              <div className="w-full flex items-center gap-2">
                <div className="h-[2px] flex-1 bg-slate-200"></div>
                {journey.transfers === 0 ? (
                  <div className="flex items-center gap-1 text-green-600 text-xs font-medium">
                    <Zap className="w-3 h-3" />
                    <span>Direkt</span>
                  </div>
                ) : (
                  <div className="text-xs text-orange-600 font-medium">
                    {journey.transfers} aktarma
                  </div>
                )}
                <div className="h-[2px] flex-1 bg-slate-200"></div>
              </div>
              <div className="text-xs text-slate-400 mt-1">
                {journey.trainTypes?.[0] || journey.trainType}
              </div>
            </div>

            {/* Arrival */}
            <div className="text-center">
              <div className="text-2xl font-bold text-slate-900">{arrivalTime}</div>
              <div className="text-sm text-slate-500">{journey.destination.city}</div>
            </div>
          </div>

          {/* Price and Select */}
          <div className="flex items-center gap-4 md:border-l md:border-slate-200 md:pl-6">
            <div className="text-right">
              <div className="text-2xl font-bold text-blue-600">€{totalPrice}</div>
              <div className="text-xs text-slate-500">
                {totalPassengers > 1 ? `${totalPassengers} kişi için` : 'kişi başı'}
              </div>
            </div>
            <button
              onClick={() => onSelect(journey)}
              className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
            >
              Seç
            </button>
          </div>
        </div>
      </div>

      {/* Footer - Train Info */}
      <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-4">
          {/* Operator */}
          <div className="flex items-center gap-2">
            <Train className="w-4 h-4 text-slate-400" />
            <span className="text-sm text-slate-600">
              {journey.operators?.[0] || journey.operator}
            </span>
          </div>

          {/* Train Number */}
          {journey.trainNumber && (
            <span className="text-sm text-slate-500">
              {journey.trainNumber}
            </span>
          )}
        </div>

        {/* Available Classes */}
        <div className="flex items-center gap-2">
          {(journey.availableClasses || []).map((cls) => (
            <span
              key={cls}
              className="px-2 py-1 bg-white border border-slate-200 rounded text-xs text-slate-600 capitalize"
            >
              {cls === 'economy' ? 'Ekonomi' : cls === 'business' ? 'Business' : cls === 'first' ? 'First' : cls}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}