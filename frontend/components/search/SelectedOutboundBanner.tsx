'use client';

import { Check } from 'lucide-react';
import { Journey, formatTime, formatPrice } from '@/lib/api/era-client';

interface SelectedOutboundBannerProps {
  journey: Journey;
  onChangeClick: () => void;
}

export function SelectedOutboundBanner({ journey, onChangeClick }: SelectedOutboundBannerProps) {
  return (
    <div className="sticky top-0 z-30 bg-green-500 text-white shadow-md">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Check className="w-5 h-5" />
              <span className="font-semibold">Gidiş Seçildi</span>
            </div>
            <div className="text-green-100 text-sm">
              {formatTime(journey.departure)} - {formatTime(journey.arrival)} • {journey.operator}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="font-bold">
              {formatPrice(journey.price.amount, journey.price.currency)}
            </span>
            <button
              onClick={onChangeClick}
              className="text-sm underline hover:no-underline"
            >
              Değiştir
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SelectedOutboundBanner;
