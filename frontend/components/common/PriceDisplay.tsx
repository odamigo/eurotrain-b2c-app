'use client';

interface PriceDisplayProps {
  amount: number;
  currency?: string;
  originalAmount?: number; // For showing discounts
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showCurrency?: boolean;
  className?: string;
}

const CURRENCY_SYMBOLS: Record<string, string> = {
  EUR: '€',
  USD: '$',
  GBP: '£',
  TRY: '₺',
  CHF: 'CHF',
};

const sizeClasses = {
  sm: 'text-sm',
  md: 'text-base font-medium',
  lg: 'text-xl font-bold',
  xl: 'text-2xl font-bold',
};

export function formatPrice(amount: number, currency: string = 'EUR'): string {
  const symbol = CURRENCY_SYMBOLS[currency] || currency;
  return `${symbol}${amount.toFixed(2)}`;
}

export function PriceDisplay({
  amount,
  currency = 'EUR',
  originalAmount,
  size = 'lg',
  showCurrency = true,
  className = '',
}: PriceDisplayProps) {
  const symbol = showCurrency ? (CURRENCY_SYMBOLS[currency] || currency) : '';
  const hasDiscount = originalAmount && originalAmount > amount;

  return (
    <div className={`${className}`}>
      <div className={`text-slate-900 ${sizeClasses[size]}`}>
        {symbol}{amount.toFixed(2)}
      </div>
      {hasDiscount && (
        <div className="text-sm text-slate-400 line-through">
          {symbol}{originalAmount.toFixed(2)}
        </div>
      )}
    </div>
  );
}

export default PriceDisplay;
