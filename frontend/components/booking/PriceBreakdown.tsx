'use client';

import { useState } from 'react';
import { ChevronDown, Info, Check } from 'lucide-react';
import { formatPrice } from '@/components/common/PriceDisplay';
import { SERVICE_FEE_PERCENT, SEAT_RESERVATION_FEE } from '@/lib/constants/booking.constants';
import type { Journey } from '@/lib/api/era-client';

interface PriceBreakdownProps {
  journey: Journey;
  returnJourney?: Journey | null;
  passengers: { adults: number; children: number };
  promoDiscount?: number;
  seatReservation?: boolean;
  showDetails?: boolean;
}

export function PriceBreakdown({
  journey,
  returnJourney,
  passengers,
  promoDiscount = 0,
  seatReservation = false,
  showDetails = false,
}: PriceBreakdownProps) {
  const [isExpanded, setIsExpanded] = useState(showDetails);

  const totalPassengers = passengers.adults + passengers.children;

  // Base prices
  const outboundBasePrice = journey.price.amount * totalPassengers;
  const returnBasePrice = returnJourney
    ? returnJourney.price.amount * totalPassengers
    : 0;
  const ticketPrice = outboundBasePrice + returnBasePrice;

  // Fees
  const serviceFee = Math.round(ticketPrice * SERVICE_FEE_PERCENT * 100) / 100;
  const seatFee = seatReservation
    ? SEAT_RESERVATION_FEE * totalPassengers * (returnJourney ? 2 : 1)
    : 0;

  // Totals
  const subtotal = ticketPrice + serviceFee + seatFee;
  const finalTotal = subtotal - promoDiscount;

  return (
    <div className="space-y-3">
      {/* Expandable Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between text-left"
      >
        <span className="text-sm text-blue-600 font-medium">
          {isExpanded ? 'Detayları Gizle' : 'Fiyat Detaylarını Göster'}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-blue-600 transition-transform ${
            isExpanded ? 'rotate-180' : ''
          }`}
        />
      </button>

      {isExpanded && (
        <>
          {/* Outbound Ticket */}
          <div className="flex justify-between items-center">
            <div className="text-slate-600">
              <div>{returnJourney ? 'Gidiş Bileti' : 'Bilet Ücreti'}</div>
              <div className="text-xs text-slate-400">
                {formatPrice(journey.price.amount, journey.price.currency)} ×{' '}
                {totalPassengers} kişi
              </div>
            </div>
            <div className="font-medium text-slate-800">
              {formatPrice(outboundBasePrice, journey.price.currency)}
            </div>
          </div>

          {/* Return Ticket */}
          {returnJourney && (
            <div className="flex justify-between items-center">
              <div className="text-slate-600">
                <div>Dönüş Bileti</div>
                <div className="text-xs text-slate-400">
                  {formatPrice(returnJourney.price.amount, returnJourney.price.currency)} ×{' '}
                  {totalPassengers} kişi
                </div>
              </div>
              <div className="font-medium text-slate-800">
                {formatPrice(returnBasePrice, returnJourney.price.currency)}
              </div>
            </div>
          )}

          {/* Seat Reservation */}
          {seatFee > 0 && (
            <div className="flex justify-between items-center">
              <div className="text-slate-600">
                <div>Koltuk Rezervasyonu</div>
                <div className="text-xs text-slate-400">
                  {formatPrice(SEAT_RESERVATION_FEE, 'EUR')} × {totalPassengers} kişi
                  {returnJourney ? ' × 2 yolculuk' : ''}
                </div>
              </div>
              <div className="font-medium text-slate-800">
                {formatPrice(seatFee, journey.price.currency)}
              </div>
            </div>
          )}

          {/* Service Fee */}
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-1.5 text-slate-600">
              <span>Hizmet Bedeli</span>
              <div className="group relative">
                <Info className="w-4 h-4 text-slate-400 cursor-help" />
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-slate-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                  Platform ve müşteri hizmetleri bedeli (%5)
                </div>
              </div>
            </div>
            <div className="font-medium text-slate-800">
              {formatPrice(serviceFee, journey.price.currency)}
            </div>
          </div>

          {/* Promo Discount */}
          {promoDiscount > 0 && (
            <div className="flex justify-between items-center text-green-600">
              <div className="flex items-center gap-1.5">
                <Check className="w-4 h-4" />
                <span>Kampanya İndirimi</span>
              </div>
              <div className="font-medium">
                -{formatPrice(promoDiscount, journey.price.currency)}
              </div>
            </div>
          )}

          {/* Divider */}
          <div className="border-t border-slate-200 pt-3" />
        </>
      )}

      {/* Total - Always visible */}
      <div className="flex justify-between items-center">
        <div className="text-lg font-semibold text-slate-800">Toplam</div>
        <div className="text-right">
          <div className="text-xl font-bold text-slate-900">
            {formatPrice(finalTotal, journey.price.currency)}
          </div>
          {promoDiscount > 0 && (
            <div className="text-sm text-slate-400 line-through">
              {formatPrice(subtotal, journey.price.currency)}
            </div>
          )}
        </div>
      </div>

      {/* Tax note */}
      <div className="text-xs text-slate-500 text-right">Tüm vergiler dahil</div>
    </div>
  );
}

export default PriceBreakdown;
