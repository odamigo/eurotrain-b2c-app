'use client';

import { useState } from 'react';
import { Info, ChevronDown, Check, X, RefreshCw, Ticket } from 'lucide-react';
import { COMFORT_CONFIG } from '@/lib/constants/booking.constants';
import type { Journey } from '@/lib/api/era-client';

interface TicketConditionsProps {
  journey: Journey;
  defaultExpanded?: boolean;
}

export function TicketConditions({
  journey,
  defaultExpanded = true,
}: TicketConditionsProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const comfortConfig =
    COMFORT_CONFIG[journey.comfortCategory] || COMFORT_CONFIG.standard;

  const flexibilityLabel =
    typeof journey.flexibility === 'string'
      ? journey.flexibility
      : (journey.flexibility as any)?.label || '';

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 flex items-center justify-between text-left bg-slate-50"
      >
        <div className="flex items-center gap-2">
          <Info className="w-5 h-5 text-blue-600" />
          <span className="font-semibold text-slate-800">Bilet Koşulları</span>
        </div>
        <ChevronDown
          className={`w-5 h-5 text-slate-400 transition-transform ${
            isExpanded ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Content */}
      {isExpanded && (
        <div className="p-4 space-y-4">
          {/* Class Badge */}
          <div
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full ${comfortConfig.bgColor} ${comfortConfig.color}`}
          >
            <span>{comfortConfig.icon}</span>
            <span className="font-medium">{comfortConfig.labelTr}</span>
          </div>

          {/* Refund Condition */}
          <div className="flex items-start gap-3">
            {journey.isRefundable ? (
              <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                <Check className="w-4 h-4 text-green-600" />
              </div>
            ) : (
              <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                <X className="w-4 h-4 text-red-500" />
              </div>
            )}
            <div>
              <div
                className={`font-medium ${
                  journey.isRefundable ? 'text-green-700' : 'text-red-600'
                }`}
              >
                {journey.isRefundable ? 'İade Edilebilir' : 'İade Edilemez'}
              </div>
              <div className="text-sm text-slate-500">
                {journey.isRefundable
                  ? 'Kalkıştan 24 saat öncesine kadar tam iade alabilirsiniz'
                  : 'Bu bilet için iade yapılamamaktadır'}
              </div>
            </div>
          </div>

          {/* Exchange Condition */}
          <div className="flex items-start gap-3">
            {journey.isExchangeable ? (
              <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                <RefreshCw className="w-4 h-4 text-green-600" />
              </div>
            ) : (
              <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                <X className="w-4 h-4 text-red-500" />
              </div>
            )}
            <div>
              <div
                className={`font-medium ${
                  journey.isExchangeable ? 'text-green-700' : 'text-red-600'
                }`}
              >
                {journey.isExchangeable ? 'Değiştirilebilir' : 'Değiştirilemez'}
              </div>
              <div className="text-sm text-slate-500">
                {journey.isExchangeable
                  ? 'Kalkıştan önce ücretsiz tarih/saat değişikliği yapabilirsiniz'
                  : 'Bu bilet için değişiklik yapılamamaktadır'}
              </div>
            </div>
          </div>

          {/* Flexibility Level */}
          {flexibilityLabel && (
            <div className="pt-3 border-t border-slate-100">
              <div className="text-sm text-slate-600">
                Esneklik Seviyesi:{' '}
                <span className="font-semibold text-slate-800">
                  {flexibilityLabel}
                </span>
              </div>
            </div>
          )}

          {/* E-ticket Info */}
          <div className="flex items-start gap-3 pt-3 border-t border-slate-100">
            <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
              <Ticket className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <div className="font-medium text-blue-700">E-Bilet</div>
              <div className="text-sm text-slate-500">
                Biletiniz e-posta adresinize gönderilecektir
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TicketConditions;
