'use client';

import { RefreshCw } from 'lucide-react';
import type { Journey } from '@/lib/api/era-client';

interface MultiSegmentTimelineProps {
  journey: Journey;
}

export function MultiSegmentTimeline({ journey }: MultiSegmentTimelineProps) {
  const segmentCount = journey.segmentCount || journey.segments?.length || 1;
  const isDirect = journey.isDirect !== false && segmentCount === 1;
  const transferStations = journey.transferStations;
  const totalTransferTime = journey.totalTransferTime;

  if (isDirect || segmentCount <= 1) {
    // Direct journey - simple timeline
    return (
      <div className="flex items-center gap-3">
        <div className="flex flex-col items-center">
          <div className="w-3 h-3 rounded-full bg-blue-600 border-2 border-white shadow" />
          <div className="w-0.5 h-8 bg-gradient-to-b from-blue-600 to-blue-400" />
          <div className="w-3 h-3 rounded-full bg-blue-400 border-2 border-white shadow" />
        </div>
        <div className="flex flex-col justify-between h-14">
          <div className="text-sm text-slate-600">{journey.origin.city}</div>
          <div className="text-sm text-slate-600">{journey.destination.city}</div>
        </div>
      </div>
    );
  }

  // Multi-segment journey - show transfer
  const transferStation = transferStations?.[0]?.city || 'Aktarma';
  
  return (
    <div className="flex items-center gap-3">
      <div className="flex flex-col items-center">
        {/* Origin */}
        <div className="w-3 h-3 rounded-full bg-blue-600 border-2 border-white shadow" />
        <div className="w-0.5 h-6 bg-gradient-to-b from-blue-600 to-amber-500" />
        {/* Transfer */}
        <div className="w-4 h-4 rounded-full bg-amber-500 border-2 border-white shadow flex items-center justify-center">
          <RefreshCw className="w-2 h-2 text-white" />
        </div>
        <div className="w-0.5 h-6 bg-gradient-to-b from-amber-500 to-blue-400" />
        {/* Destination */}
        <div className="w-3 h-3 rounded-full bg-blue-400 border-2 border-white shadow" />
      </div>
      <div className="flex flex-col justify-between h-[72px]">
        <div className="text-sm text-slate-600">{journey.origin.city}</div>
        <div className="text-xs text-amber-600 font-medium flex items-center gap-1">
          <span>{transferStation}</span>
          {totalTransferTime && <span className="text-slate-400">({totalTransferTime} dk)</span>}
        </div>
        <div className="text-sm text-slate-600">{journey.destination.city}</div>
      </div>
    </div>
  );
}

export default MultiSegmentTimeline;
