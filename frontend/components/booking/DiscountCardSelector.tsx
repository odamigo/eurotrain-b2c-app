'use client';

import { useState, useEffect, useMemo } from 'react';
import { 
  CreditCard, ChevronDown, ChevronUp, X, Search, 
  Check, Info, Tag, Globe
} from 'lucide-react';
import { 
  DISCOUNT_CARDS, 
  DISCOUNT_CARDS_BY_COUNTRY,
  COUNTRY_NAMES,
  type DiscountCard,
  getEligibleCards 
} from '@/lib/constants/discount-cards.constants';

interface DiscountCardSelectorProps {
  value?: { code: string; number?: string } | null;
  onChange: (card: { code: string; number?: string } | null) => void;
  dateOfBirth?: string;
  onValidationChange?: (isValid: boolean) => void;
}

export function DiscountCardSelector({
  value,
  onChange,
  dateOfBirth,
  onValidationChange,
}: DiscountCardSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [cardNumber, setCardNumber] = useState(value?.number || '');
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);

  // Yaşı hesapla
  const age = useMemo(() => {
    if (!dateOfBirth) return null;
    const birth = new Date(dateOfBirth);
    const today = new Date();
    let years = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      years--;
    }
    return years;
  }, [dateOfBirth]);

  // Uygun kartları filtrele
  const eligibleCards = useMemo(() => {
    let cards = age !== null ? getEligibleCards(age) : DISCOUNT_CARDS;
    
    // Arama filtresi
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      cards = cards.filter(
        c => c.name.toLowerCase().includes(query) ||
             c.description.toLowerCase().includes(query) ||
             c.country.toLowerCase().includes(query)
      );
    }

    // Ülke filtresi
    if (selectedCountry) {
      cards = cards.filter(c => c.country === selectedCountry);
    }

    return cards;
  }, [age, searchQuery, selectedCountry]);

  // Ülkelere göre grupla
  const groupedCards = useMemo(() => {
    const groups: Record<string, DiscountCard[]> = {};
    eligibleCards.forEach(card => {
      if (!groups[card.country]) groups[card.country] = [];
      groups[card.country].push(card);
    });
    return groups;
  }, [eligibleCards]);

  // Seçili kart
  const selectedCard = useMemo(() => {
    if (!value?.code) return null;
    return DISCOUNT_CARDS.find(c => c.code === value.code);
  }, [value?.code]);

  // Validation
  useEffect(() => {
    if (onValidationChange) {
      const isValid = !value?.code || (selectedCard?.requiresNumber ? !!cardNumber : true);
      onValidationChange(isValid);
    }
  }, [value, cardNumber, selectedCard, onValidationChange]);

  // Kart seç
  const handleSelectCard = (card: DiscountCard) => {
    onChange({ code: card.code, number: cardNumber || undefined });
    setIsOpen(false);
  };

  // Kartı kaldır
  const handleRemoveCard = () => {
    onChange(null);
    setCardNumber('');
  };

  // Numara güncelle
  const handleNumberChange = (num: string) => {
    setCardNumber(num);
    if (value?.code) {
      onChange({ code: value.code, number: num || undefined });
    }
  };

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
          <Tag className="w-4 h-4 text-amber-500" />
          İndirim Kartı (Opsiyonel)
        </label>
        {age !== null && (
          <span className="text-xs text-slate-500">
            Yaşınız: {age}
          </span>
        )}
      </div>

      {/* Selected Card Display */}
      {selectedCard ? (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <div className="font-semibold text-slate-800">{selectedCard.name}</div>
                <div className="text-sm text-slate-500">{selectedCard.description}</div>
                {selectedCard.discountPercent && (
                  <div className="text-sm font-medium text-green-600 mt-1">
                    %{selectedCard.discountPercent} indirim
                  </div>
                )}
              </div>
            </div>
            <button
              onClick={handleRemoveCard}
              className="p-1 hover:bg-amber-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>

          {/* Card Number Input */}
          {selectedCard.requiresNumber && (
            <div className="mt-4">
              <label className="block text-sm font-medium text-slate-600 mb-1">
                Kart Numarası {selectedCard.requiresNumber && <span className="text-red-500">*</span>}
              </label>
              <input
                type="text"
                value={cardNumber}
                onChange={(e) => handleNumberChange(e.target.value)}
                placeholder="Kart numaranızı girin"
                className="w-full px-4 py-2.5 border border-amber-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
              />
            </div>
          )}
        </div>
      ) : (
        /* Card Selector Button */
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100 transition-colors"
        >
          <div className="flex items-center gap-3">
            <CreditCard className="w-5 h-5 text-slate-400" />
            <span className="text-slate-600">İndirim kartı ekle</span>
          </div>
          {isOpen ? (
            <ChevronUp className="w-5 h-5 text-slate-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-slate-400" />
          )}
        </button>
      )}

      {/* Dropdown */}
      {isOpen && !selectedCard && (
        <div className="bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden">
          {/* Search */}
          <div className="p-3 border-b border-slate-100">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Kart ara..."
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Country Tabs */}
          <div className="flex gap-1 p-2 border-b border-slate-100 overflow-x-auto">
            <button
              onClick={() => setSelectedCountry(null)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                !selectedCountry
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Globe className="w-4 h-4 inline mr-1" />
              Tümü
            </button>
            {Object.keys(DISCOUNT_CARDS_BY_COUNTRY).map(country => (
              <button
                key={country}
                onClick={() => setSelectedCountry(country)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                  selectedCountry === country
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                {COUNTRY_NAMES[country] || country}
              </button>
            ))}
          </div>

          {/* Card List */}
          <div className="max-h-64 overflow-y-auto">
            {Object.entries(groupedCards).map(([country, cards]) => (
              <div key={country}>
                <div className="px-4 py-2 bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wider sticky top-0">
                  {COUNTRY_NAMES[country] || country}
                </div>
                {cards.map(card => (
                  <button
                    key={card.code}
                    onClick={() => handleSelectCard(card)}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors text-left"
                  >
                    <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <CreditCard className="w-4 h-4 text-amber-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-slate-800 truncate">{card.name}</div>
                      <div className="text-sm text-slate-500 truncate">{card.description}</div>
                    </div>
                    {card.discountPercent && (
                      <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                        %{card.discountPercent}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            ))}

            {eligibleCards.length === 0 && (
              <div className="p-6 text-center text-slate-500">
                <Info className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                <p>Uygun kart bulunamadı</p>
              </div>
            )}
          </div>

          {/* Info */}
          <div className="p-3 bg-blue-50 border-t border-blue-100">
            <div className="flex items-start gap-2 text-sm text-blue-700">
              <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>
                İndirim kartı eklerseniz, uygun tarifelerde otomatik indirim uygulanır.
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DiscountCardSelector;
