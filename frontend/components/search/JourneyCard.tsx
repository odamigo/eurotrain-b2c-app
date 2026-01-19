'use client';

import { Train, Clock, ArrowRight, Users, Zap } from 'lucide-react';
import { Journey } from '@/lib/api/client';

interface JourneyCardProps {
  journey: Journey;
  passengers: { adults: number; children: number };
  onSelect: (journey: Journey) => void;
}

export function JourneyCard({ journey, passengers, onSelect }: JourneyCardProps) {
  // Format time from ISO string
  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString('tr-TR', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  };

  // Format date
  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleDateString('tr-TR', { 
      day: 'numeric',
      month: 'short'
    });
  };

  // Get train type color
  const getTrainTypeColor = (trainType: string) => {
    const colors: Record<string, string> = {
      TGV: 'bg-purple-100 text-purple-700',
      ICE: 'bg-red-100 text-red-700',
      Eurostar: 'bg-yellow-100 text-yellow-700',
      Frecciarossa: 'bg-red-100 text-red-700',
      AVE: 'bg-purple-100 text-purple-700',
      Thalys: 'bg-red-100 text-red-700',
    };
    return colors[trainType] || 'bg-blue-100 text-blue-700';
  };

  // Calculate total price
  const totalPassengers = passengers.adults + passengers.children;
  const totalPrice = journey.price.amount * totalPassengers;

  // Check if seats are limited
  const isLimitedSeats = journey.availableSeats < 10;

  return (
    <div className="bg-white rounded-xl border border-slate-200 hover:border-blue-300 hover:shadow-lg transition-all duration-300 overflow-hidden">
      <div className="p-5">
        {/* Top Row: Train Info + Price */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getTrainTypeColor(journey.trainType)}`}>
              {journey.trainType}
            </span>
            <span className="text-sm text-slate-500">{journey.trainNumber}</span>
            {isLimitedSeats && (
              <span className="flex items-center gap-1 px-2 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-medium">
                <Zap className="w-3 h-3" />
                Son {journey.availableSeats} koltuk
              </span>
            )}
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-slate-900">
              €{totalPrice}
            </div>
            {totalPassengers > 1 && (
              <div className="text-xs text-slate-500">
                €{journey.price.amount} × {totalPassengers} yolcu
              </div>
            )}
          </div>
        </div>

        {/* Journey Timeline */}
        <div className="flex items-center gap-4">
          {/* Departure */}
          <div className="flex-1">
            <div className="text-2xl font-bold text-slate-900">
              {formatTime(journey.departure)}
            </div>
            <div className="text-sm text-slate-600 font-medium truncate">
              {journey.origin.name}
            </div>
            <div className="text-xs text-slate-400">
              {formatDate(journey.departure)}
            </div>
          </div>

          {/* Duration */}
          <div className="flex flex-col items-center px-4">
            <div className="text-sm text-slate-500 mb-1">{journey.duration}</div>
            <div className="flex items-center w-32">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              <div className="flex-1 h-0.5 bg-slate-200 relative">
                <Train className="absolute left-1/2 -translate-x-1/2 -top-2 w-4 h-4 text-slate-400" />
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400" />
            </div>
            <div className="text-xs text-slate-400 mt-1">Direkt</div>
          </div>

          {/* Arrival */}
          <div className="flex-1 text-right">
            <div className="text-2xl font-bold text-slate-900">
              {formatTime(journey.arrival)}
            </div>
            <div className="text-sm text-slate-600 font-medium truncate">
              {journey.destination.name}
            </div>
            <div className="text-xs text-slate-400">
              {formatDate(journey.arrival)}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Row: Classes + Select Button */}
      <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {journey.class.map((cls) => (
            <span 
              key={cls}
              className="px-2 py-1 bg-white border border-slate-200 rounded text-xs text-slate-600"
            >
              {cls}
            </span>
          ))}
          <span className="flex items-center gap-1 text-xs text-slate-500">
            <Users className="w-3 h-3" />
            {journey.availableSeats} koltuk
          </span>
        </div>
        
        <button
          onClick={() => onSelect(journey)}
          className="px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white 
                     font-semibold rounded-lg hover:from-blue-700 hover:to-indigo-700
                     transition-all duration-200 transform hover:scale-105"
        >
          Seç
        </button>
      </div>
    </div>
  );
}
