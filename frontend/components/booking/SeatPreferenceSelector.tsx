'use client';

import { SEAT_PREFERENCES } from '@/lib/constants/booking.constants';

interface SeatPreferenceSelectorProps {
  value: string;
  onChange: (value: 'window' | 'aisle' | 'any') => void;
  disabled?: boolean;
}

export function SeatPreferenceSelector({
  value,
  onChange,
  disabled = false,
}: SeatPreferenceSelectorProps) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-slate-700">
        Koltuk Tercihi
      </label>
      <div className="grid grid-cols-3 gap-2">
        {SEAT_PREFERENCES.map((pref) => (
          <button
            key={pref.id}
            type="button"
            disabled={disabled}
            onClick={() => onChange(pref.id)}
            className={`
              p-3 rounded-lg border-2 text-center transition-all
              ${value === pref.id
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-slate-200 hover:border-slate-300 text-slate-600'
              }
              ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            `}
          >
            <div className="text-xl mb-1">{pref.icon}</div>
            <div className="text-xs font-medium">{pref.label}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

export default SeatPreferenceSelector;
