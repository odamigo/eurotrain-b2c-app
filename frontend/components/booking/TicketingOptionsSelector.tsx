'use client';

import { Ticket, Check } from 'lucide-react';
import { TICKETING_OPTIONS } from '@/lib/constants/booking.constants';

interface TicketingOptionsSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

export function TicketingOptionsSelector({
  value,
  onChange,
}: TicketingOptionsSelectorProps) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <div className="flex items-center gap-2 mb-4">
        <Ticket className="w-5 h-5 text-blue-600" />
        <h3 className="font-semibold text-slate-800">Bilet Teslim Şekli</h3>
      </div>
      <div className="space-y-2">
        {TICKETING_OPTIONS.map((option) => {
          const Icon = option.icon;
          const isSelected = value === option.id;

          return (
            <button
              key={option.id}
              type="button"
              onClick={() => onChange(option.id)}
              className={`
                w-full p-4 rounded-xl border-2 text-left transition-all flex items-center gap-4
                ${isSelected
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-slate-200 hover:border-slate-300'
                }
              `}
            >
              <div
                className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  isSelected ? 'bg-blue-100' : 'bg-slate-100'
                }`}
              >
                <Icon
                  className={`w-5 h-5 ${
                    isSelected ? 'text-blue-600' : 'text-slate-500'
                  }`}
                />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span
                    className={`font-medium ${
                      isSelected ? 'text-blue-700' : 'text-slate-800'
                    }`}
                  >
                    {option.label}
                  </span>
                  {option.recommended && (
                    <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                      Önerilen
                    </span>
                  )}
                </div>
                <div className="text-sm text-slate-500">{option.description}</div>
              </div>
              <div
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  isSelected
                    ? 'border-blue-500 bg-blue-500'
                    : 'border-slate-300'
                }`}
              >
                {isSelected && <Check className="w-3 h-3 text-white" />}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default TicketingOptionsSelector;
