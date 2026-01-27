'use client';

import Link from 'next/link';
import { Check } from 'lucide-react';
import type { Journey } from '@/lib/api/era-client';

interface TermsCheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  journey: Journey;
}

export function TermsCheckbox({ checked, onChange, journey }: TermsCheckboxProps) {
  return (
    <div className="bg-slate-50 rounded-xl border border-slate-200 p-4">
      <label className="flex items-start gap-3 cursor-pointer group">
        <div className="pt-0.5">
          <div
            className={`
              w-5 h-5 rounded border-2 flex items-center justify-center transition-all
              ${checked
                ? 'bg-blue-600 border-blue-600'
                : 'bg-white border-slate-300 group-hover:border-blue-400'
              }
            `}
            onClick={() => onChange(!checked)}
          >
            {checked && <Check className="w-3.5 h-3.5 text-white" />}
          </div>
        </div>
        <div className="flex-1" onClick={() => onChange(!checked)}>
          <div className="text-sm text-slate-700">
            <Link
              href="/terms"
              className="text-blue-600 hover:underline font-medium"
              target="_blank"
              onClick={(e) => e.stopPropagation()}
            >
              Satış Koşulları
            </Link>
            ,{' '}
            <Link
              href="/privacy"
              className="text-blue-600 hover:underline font-medium"
              target="_blank"
              onClick={(e) => e.stopPropagation()}
            >
              Gizlilik Politikası
            </Link>
            {' ve '}
            <Link
              href="/cancellation"
              className="text-blue-600 hover:underline font-medium"
              target="_blank"
              onClick={(e) => e.stopPropagation()}
            >
              İptal/İade Koşulları
            </Link>
            'nı okudum ve kabul ediyorum.
          </div>
          <div className="text-xs text-slate-500 mt-1.5">
            {journey.isRefundable
              ? '✓ Bu bilet iade edilebilir'
              : '⚠ Bu bilet iade edilemez'}
            {' • '}
            {journey.isExchangeable
              ? '✓ Değişiklik yapılabilir'
              : '⚠ Değişiklik yapılamaz'}
          </div>
        </div>
      </label>
    </div>
  );
}

export default TermsCheckbox;
