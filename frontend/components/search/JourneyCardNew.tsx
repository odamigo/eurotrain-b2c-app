'use client';

import { Train, ChevronDown, Check, RefreshCw, Globe, FileText } from 'lucide-react';
import { Journey, formatPrice, formatDuration } from '@/lib/api/era-client';
import { COMFORT_CONFIG } from '@/lib/constants/booking.constants';

interface JourneyCardProps {
  journey: Journey;
  isExpanded: boolean;
  onToggle: () => void;
  onSelect: (comfortCategory: string) => void;
  isCheapest: boolean;
  isFastest: boolean;
  onShowConditions: (journey: Journey) => void;
}

// Timezone helper
function formatTimeWithTimezone(dateStr: string, timezone?: string): { time: string; tz: string; offset: string } {
  try {
    const date = new Date(dateStr);
    const time = date.toLocaleTimeString('tr-TR', { 
      hour: '2-digit', 
      minute: '2-digit',
      timeZone: timezone || 'Europe/Istanbul'
    });
    
    const tzAbbr = timezone ? timezone.split('/')[1]?.substring(0, 3).toUpperCase() || 'UTC' : 'TR';
    const offsetMinutes = date.getTimezoneOffset();
    const offsetHours = Math.abs(Math.floor(offsetMinutes / 60));
    const offsetSign = offsetMinutes <= 0 ? '+' : '-';
    const offset = `UTC${offsetSign}${offsetHours}`;
    
    return { time, tz: tzAbbr, offset };
  } catch {
    return { time: dateStr.substring(11, 16), tz: '', offset: '' };
  }
}

export function JourneyCard({
  journey,
  isExpanded,
  onToggle,
  onSelect,
  isCheapest,
  isFastest,
  onShowConditions,
}: JourneyCardProps) {
  // Multi-segment detection
  const segmentCount = journey.segmentCount || 1;
  const isDirect = journey.isDirect !== false && segmentCount === 1;
  const transferStations = journey.transferStations;
  const totalTransferTime = journey.totalTransferTime;

  // Timezone handling
  const departureInfo = formatTimeWithTimezone(journey.departure, journey.origin.timezone);
  const arrivalInfo = formatTimeWithTimezone(journey.arrival, journey.destination.timezone);
  const showTimezoneWarning = departureInfo.offset !== arrivalInfo.offset;

  // Available classes
  const availableClasses = journey.availableClasses || [
    { 
      comfortCategory: journey.comfortCategory, 
      price: journey.price, 
      isRefundable: journey.isRefundable, 
      isExchangeable: journey.isExchangeable 
    }
  ];

  return (
    <div className={`bg-white rounded-xl border-2 transition-all duration-200 overflow-hidden ${
      isExpanded ? 'border-blue-300 shadow-lg' : 'border-slate-200 hover:border-slate-300'
    }`}>
      {/* Main Row - Clickable */}
      <button
        onClick={onToggle}
        className="w-full p-4 text-left"
      >
        <div className="flex items-center justify-between">
          {/* Left: Time & Route */}
          <div className="flex items-center gap-6">
            {/* Times with Timezone */}
            <div className="flex items-center gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-slate-800">{departureInfo.time}</div>
                <div className="text-xs text-slate-400">{journey.origin.city}</div>
                {showTimezoneWarning && (
                  <div className="text-[10px] text-blue-500 flex items-center gap-0.5 justify-center mt-0.5">
                    <Globe className="w-3 h-3" />
                    <span>{departureInfo.offset}</span>
                  </div>
                )}
              </div>
              
              {/* Duration & Stops */}
              <div className="flex flex-col items-center min-w-[100px]">
                <div className="text-sm text-slate-500">{formatDuration(journey.durationMinutes)}</div>
                <div className="w-full flex items-center my-1">
                  <div className="w-2 h-2 rounded-full bg-blue-600" />
                  <div className="flex-1 h-0.5 bg-slate-300 relative">
                    {!isDirect && (
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-amber-500" />
                    )}
                  </div>
                  <div className="w-2 h-2 rounded-full bg-blue-400" />
                </div>
                {/* Direct or Transfer Badge */}
                {isDirect ? (
                  <div className="text-xs text-green-600 font-medium">Direkt</div>
                ) : (
                  <div className="text-xs text-amber-600 font-medium">
                    {segmentCount - 1} Aktarma
                    {transferStations?.[0] && (
                      <span className="text-slate-400 ml-1">({transferStations[0].city})</span>
                    )}
                  </div>
                )}
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-slate-800">{arrivalInfo.time}</div>
                <div className="text-xs text-slate-400">{journey.destination.city}</div>
                {showTimezoneWarning && (
                  <div className="text-[10px] text-blue-500 flex items-center gap-0.5 justify-center mt-0.5">
                    <Globe className="w-3 h-3" />
                    <span>{arrivalInfo.offset}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Operator */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-lg">
              <Train className="w-4 h-4 text-slate-600" />
              <span className="text-sm font-medium text-slate-700">{journey.operatorName || journey.operator}</span>
              <span className="text-xs text-slate-500">{journey.trainNumber}</span>
            </div>
          </div>

          {/* Right: Price & Badges */}
          <div className="flex items-center gap-4">
            {/* Highlight Badges */}
            <div className="hidden sm:flex flex-col gap-1">
              {isCheapest && (
                <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                  En Ucuz
                </span>
              )}
              {isFastest && (
                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">
                  En Hızlı
                </span>
              )}
            </div>

            {/* Price */}
            <div className="text-right">
              <div className="text-2xl font-bold text-slate-800">
                {formatPrice(journey.price.amount, journey.price.currency)}
              </div>
              <div className="text-xs text-slate-500">kişi başı</div>
            </div>

            {/* Expand Icon */}
            <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
          </div>
        </div>

        {/* Mobile: Operator & Badges */}
        <div className="flex items-center justify-between mt-3 sm:hidden">
          <div className="flex items-center gap-2">
            <Train className="w-4 h-4 text-slate-500" />
            <span className="text-sm text-slate-600">{journey.operator} {journey.trainNumber}</span>
          </div>
          <div className="flex gap-1">
            {isCheapest && (
              <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                En Ucuz
              </span>
            )}
            {isFastest && (
              <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">
                En Hızlı
              </span>
            )}
          </div>
        </div>
      </button>

      {/* Expanded: Class Selection */}
      {isExpanded && (
        <div className="border-t border-slate-100 p-4 bg-slate-50">
          {/* Multi-segment detail if not direct */}
          {!isDirect && (
            <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-center gap-2 text-amber-700 text-sm font-medium mb-2">
                <RefreshCw className="w-4 h-4" />
                <span>Aktarmalı Sefer</span>
              </div>
              <div className="text-sm text-amber-600">
                {transferStations?.[0]?.city && `${transferStations[0].city} istasyonunda`}{' '}
                {totalTransferTime && `${totalTransferTime} dakika`} aktarma süresi
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {Object.entries(COMFORT_CONFIG).map(([key, config]) => {
              const classData = availableClasses.find((c) => c.comfortCategory === key) || {
                price: { 
                  amount: Math.round(journey.price.amount * (key === 'comfort' ? 1.6 : key === 'premier' ? 2.2 : 1)), 
                  currency: journey.price.currency 
                },
                isRefundable: key !== 'standard',
                isExchangeable: true,
              };
              const isPopular = key === 'comfort';
              
              return (
                <div 
                  key={key}
                  className={`relative p-4 rounded-xl border-2 cursor-pointer transition-all hover:shadow-md ${config.bgColor} ${config.borderColor}`}
                  onClick={() => onSelect(key)}
                >
                  {isPopular && (
                    <div className="absolute -top-2 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-amber-500 text-white text-xs font-bold rounded-full">
                      En Popüler
                    </div>
                  )}
                  
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xl">{config.icon}</span>
                    <span className={`font-semibold ${config.color}`}>{config.labelTr}</span>
                  </div>
                  
                  <div className="text-2xl font-bold text-slate-800 mb-3">
                    {formatPrice(classData.price.amount, classData.price.currency)}
                  </div>
                  
                  <div className="space-y-1.5 mb-3">
                    {config.features.slice(0, 3).map((feature, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm text-slate-600">
                        <Check className="w-4 h-4 text-green-500" />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                  
                  <div className="flex items-center gap-3 text-xs pt-2 border-t border-slate-200/50">
                    <span className={classData.isRefundable ? 'text-green-600' : 'text-slate-400'}>
                      {classData.isRefundable ? '✓ İade' : '✗ İade yok'}
                    </span>
                    <span className={classData.isExchangeable ? 'text-green-600' : 'text-slate-400'}>
                      {classData.isExchangeable ? '✓ Değişiklik' : '✗ Değişiklik yok'}
                    </span>
                  </div>
                  
                  <button className="w-full mt-3 py-2.5 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors">
                    Seç
                  </button>
                </div>
              );
            })}
          </div>

          {/* Conditions Link */}
          <div className="mt-4 flex justify-center">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onShowConditions(journey);
              }}
              className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              <FileText className="w-4 h-4" />
              <span>Bilet Koşullarını Görüntüle</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default JourneyCard;
