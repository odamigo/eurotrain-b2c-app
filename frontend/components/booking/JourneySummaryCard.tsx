'use client';

import { Train, ArrowRight, Check, X } from 'lucide-react';
import { RotateCcw } from 'lucide-react';
import { formatTime, formatDuration } from '@/lib/api/era-client';
import { COMFORT_CONFIG } from '@/lib/constants/booking.constants';
import type { Journey } from '@/lib/api/era-client';

interface JourneySummaryCardProps {
  journey: Journey;
  label?: 'Gidiş' | 'Dönüş';
  comfortCategory?: string;
}

export function JourneySummaryCard({
  journey,
  label,
  comfortCategory,
}: JourneySummaryCardProps) {
  const comfortConfig =
    COMFORT_CONFIG[comfortCategory || journey.comfortCategory] ||
    COMFORT_CONFIG.standard;

  const formatDateDisplay = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('tr-TR', {
        day: 'numeric',
        month: 'short',
        weekday: 'short',
      });
    } catch {
      return dateStr;
    }
  };

  // Multi-segment detection
  const segmentCount = (journey as any).segmentCount || 1;
  const isDirect = (journey as any).isDirect !== false && segmentCount === 1;

  return (
    <div className="bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl p-5 text-white">
      {/* Label (Gidiş/Dönüş) */}
      {label && (
        <div className="flex items-center gap-2 mb-3 pb-3 border-b border-white/20">
          {label === 'Gidiş' ? (
            <ArrowRight className="w-4 h-4" />
          ) : (
            <RotateCcw className="w-4 h-4" />
          )}
          <span className="text-sm font-medium text-blue-200">{label}</span>
        </div>
      )}

      {/* Operator & Class */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Train className="w-5 h-5" />
          <span className="font-semibold">
            {journey.operatorName || journey.operator}
          </span>
          <span className="text-blue-200 text-sm">{journey.trainNumber}</span>
        </div>
        <div
          className={`px-2.5 py-1 rounded-full text-xs font-bold ${comfortConfig.bgColor} ${comfortConfig.color}`}
        >
          {comfortConfig.icon} {comfortConfig.labelTr}
        </div>
      </div>

      {/* Route Timeline */}
      <div className="flex items-center justify-between mb-4">
        <div className="text-center">
          <div className="text-2xl font-bold">{formatTime(journey.departure)}</div>
          <div className="text-blue-200 text-sm">{journey.origin.city}</div>
        </div>

        <div className="flex flex-col items-center flex-1 mx-4">
          <div className="w-full flex items-center">
            <div className="w-2 h-2 rounded-full bg-white" />
            <div className="flex-1 h-0.5 bg-blue-400 relative">
              {!isDirect && (
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-amber-400" />
              )}
            </div>
            <div className="w-2 h-2 rounded-full bg-blue-300" />
          </div>
          <span className="text-blue-200 text-xs mt-1">
            {formatDuration(journey.durationMinutes)}
          </span>
          {!isDirect && (
            <span className="text-amber-300 text-xs">{segmentCount - 1} aktarma</span>
          )}
        </div>

        <div className="text-center">
          <div className="text-2xl font-bold">{formatTime(journey.arrival)}</div>
          <div className="text-blue-200 text-sm">{journey.destination.city}</div>
        </div>
      </div>

      {/* Date */}
      <div className="text-center text-blue-100 text-sm">
        {formatDateDisplay(journey.departure)}
      </div>

      {/* Quick Conditions */}
      <div className="flex items-center justify-center gap-4 mt-4 pt-4 border-t border-blue-500/30">
        <div className="flex items-center gap-1 text-sm">
          {journey.isExchangeable ? (
            <Check className="w-4 h-4 text-green-300" />
          ) : (
            <X className="w-4 h-4 text-red-300" />
          )}
          <span className="text-blue-100">Değiştirilebilir</span>
        </div>
        <div className="flex items-center gap-1 text-sm">
          {journey.isRefundable ? (
            <Check className="w-4 h-4 text-green-300" />
          ) : (
            <X className="w-4 h-4 text-red-300" />
          )}
          <span className="text-blue-100">İade Edilebilir</span>
        </div>
      </div>
    </div>
  );
}

export default JourneySummaryCard;
