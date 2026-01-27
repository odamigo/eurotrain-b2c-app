'use client';

import { User, Mail, Phone, Calendar, ChevronDown, Check } from 'lucide-react';
import { SeatPreferenceSelector } from './SeatPreferenceSelector';
import { DiscountCardSelector } from './DiscountCardSelector';
import { SEAT_PREFERENCES } from '@/lib/constants/booking.constants';
import { getDiscountCard } from '@/lib/constants/discount-cards.constants';
import type { TravelerForm } from '@/lib/types/booking.types';

interface TravelerCardProps {
  traveler: TravelerForm;
  index: number;
  isExpanded: boolean;
  onToggle: () => void;
  onChange: (field: keyof TravelerForm, value: any) => void;
  isFirstAdult: boolean;
  isValid: boolean;
  showSeatPreference?: boolean;
  showDiscountCard?: boolean;
}

export function TravelerCard({
  traveler,
  index,
  isExpanded,
  onToggle,
  onChange,
  isFirstAdult,
  isValid,
  showSeatPreference = true,
  showDiscountCard = true,
}: TravelerCardProps) {
  const seatLabel = SEAT_PREFERENCES.find(
    (p) => p.id === traveler.seatPreference
  )?.label;

  const discountCardInfo = traveler.discountCard?.code 
    ? getDiscountCard(traveler.discountCard.code) 
    : null;

  return (
    <div
      className={`
        border-2 rounded-xl overflow-hidden transition-all duration-200
        ${isValid ? 'border-green-300 bg-green-50/30' : 'border-slate-200 bg-white'}
      `}
    >
      {/* Header */}
      <button
        onClick={onToggle}
        className="w-full p-4 flex items-center justify-between text-left"
      >
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center ${
              isValid ? 'bg-green-100' : 'bg-slate-100'
            }`}
          >
            {isValid ? (
              <Check className="w-5 h-5 text-green-600" />
            ) : (
              <User className="w-5 h-5 text-slate-400" />
            )}
          </div>
          <div>
            <div className="font-medium text-slate-800">
              {traveler.firstName && traveler.lastName
                ? `${traveler.firstName} ${traveler.lastName}`
                : `${index + 1}. Yolcu`}
            </div>
            <div className="text-sm text-slate-500 flex items-center gap-2 flex-wrap">
              <span>{traveler.type === 'adult' ? 'Yetişkin' : 'Çocuk'}</span>
              {traveler.seatPreference && traveler.seatPreference !== 'any' && (
                <span className="text-blue-600">• {seatLabel}</span>
              )}
              {discountCardInfo && (
                <span className="text-amber-600">• {discountCardInfo.name}</span>
              )}
            </div>
          </div>
        </div>
        <ChevronDown
          className={`w-5 h-5 text-slate-400 transition-transform ${
            isExpanded ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Form */}
      {isExpanded && (
        <div className="p-4 pt-0 border-t border-slate-100">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* First Name */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Ad <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={traveler.firstName}
                onChange={(e) => onChange('firstName', e.target.value)}
                placeholder="Adınız"
                className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Last Name */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Soyad <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={traveler.lastName}
                onChange={(e) => onChange('lastName', e.target.value)}
                placeholder="Soyadınız"
                className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Email - only for first adult */}
            {isFirstAdult && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  E-posta <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="email"
                    value={traveler.email}
                    onChange={(e) => onChange('email', e.target.value)}
                    placeholder="ornek@email.com"
                    className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            )}

            {/* Phone - only for first adult */}
            {isFirstAdult && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Telefon <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="tel"
                    value={traveler.phone}
                    onChange={(e) => onChange('phone', e.target.value)}
                    placeholder="+90 5XX XXX XX XX"
                    className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            )}

            {/* Date of Birth - for discount card age verification or children */}
            <div className={traveler.type === 'child' ? 'sm:col-span-2' : ''}>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Doğum Tarihi {traveler.type === 'child' && <span className="text-red-500">*</span>}
                {traveler.type === 'adult' && <span className="text-slate-400 text-xs ml-1">(indirim kartı için)</span>}
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="date"
                  value={traveler.dateOfBirth}
                  onChange={(e) => onChange('dateOfBirth', e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Seat Preference */}
            {showSeatPreference && (
              <div className="sm:col-span-2">
                <SeatPreferenceSelector
                  value={traveler.seatPreference || 'any'}
                  onChange={(val) => onChange('seatPreference', val)}
                />
              </div>
            )}

            {/* Discount Card - NEW */}
            {showDiscountCard && traveler.type === 'adult' && (
              <div className="sm:col-span-2 pt-2 border-t border-slate-100 mt-2">
                <DiscountCardSelector
                  value={traveler.discountCard}
                  onChange={(card) => onChange('discountCard', card)}
                  dateOfBirth={traveler.dateOfBirth}
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default TravelerCard;
