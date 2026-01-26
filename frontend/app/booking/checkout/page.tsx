'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Train, 
  Calendar, 
  Clock, 
  User, 
  Mail, 
  Phone,
  CreditCard, 
  AlertCircle,
  CheckCircle,
  Loader2,
  ArrowRight,
  Shield,
  Timer,
  ChevronDown,
  ChevronUp,
  Info,
  XCircle,
  RefreshCw,
  Check,
  X,
  Ticket,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Sparkles,
  Globe
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// ============================================================
// CONSTANTS - Normal akışla aynı
// ============================================================

const SERVICE_FEE_PERCENT = 0.05; // %5 hizmet bedeli

const COMFORT_CONFIG: Record<string, { 
  label: string; 
  labelTr: string; 
  color: string;
  bgColor: string;
  icon: string;
}> = {
  standard: { label: 'Standard', labelTr: 'Standart', color: 'text-slate-700', bgColor: 'bg-slate-100', icon: '🎫' },
  comfort: { label: 'Business', labelTr: 'Business', color: 'text-amber-700', bgColor: 'bg-amber-100', icon: '💼' },
  premier: { label: 'First Class', labelTr: 'Birinci Sınıf', color: 'text-purple-700', bgColor: 'bg-purple-100', icon: '👑' },
};

const TITLE_OPTIONS = [
  { value: 'MR', label: 'Bay' },
  { value: 'MS', label: 'Bayan' },
];

// ============================================================
// TYPES
// ============================================================

interface BookingData {
  id: number;
  customerName: string;
  customerEmail: string;
  fromStation: string;
  toStation: string;
  departureDate: string;
  departureTime: string;
  arrivalTime: string;
  trainNumber: string;
  operator: string;
  ticketClass: string;
  price: number;
  status: string;
  adults?: number;
  children?: number;
}

interface TravelerForm {
  id: string;
  title: 'MR' | 'MS';
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  type: 'adult' | 'child';
  // Passport fields (for international routes like Eurostar)
  passportRequired?: boolean;
  passportNumber?: string;
  passportExpiry?: string;
  passportCountry?: string;
}

interface PriceVerification {
  valid: boolean;
  priceStatus: 'same' | 'increased' | 'decreased' | 'unavailable';
  originalPrice: number;
  currentPrice?: number;
  priceDifference?: number;
  percentageChange?: number;
  journeyAvailable: boolean;
  alternatives?: Array<{
    trainNumber: string;
    departureTime: string;
    arrivalTime: string;
    price: number;
    operator: string;
  }>;
  message?: string;
  error?: string;
}

// ============================================================
// HELPER FUNCTIONS
// ============================================================

function formatPrice(amount: number, currency: string = 'EUR'): string {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: currency,
  }).format(amount);
}

function isInternationalRoute(operator: string): boolean {
  const internationalOperators = ['EUROSTAR', 'THALYS', 'TGV LYRIA'];
  return internationalOperators.some(op => operator?.toUpperCase().includes(op));
}

// ============================================================
// TRAVELER CARD COMPONENT
// ============================================================

function TravelerCard({
  traveler,
  index,
  isExpanded,
  onToggle,
  onChange,
  isLeadTraveler,
  isValid,
  requiresPassport,
}: {
  traveler: TravelerForm;
  index: number;
  isExpanded: boolean;
  onToggle: () => void;
  onChange: (field: keyof TravelerForm, value: string) => void;
  isLeadTraveler: boolean;
  isValid: boolean;
  requiresPassport: boolean;
}) {
  return (
    <div className={`
      border-2 rounded-xl overflow-hidden transition-all duration-200
      ${isValid ? 'border-green-300 bg-green-50/30' : 'border-slate-200 bg-white'}
    `}>
      {/* Header */}
      <button
        onClick={onToggle}
        className="w-full p-4 flex items-center justify-between text-left"
      >
        <div className="flex items-center gap-3">
          <div className={`
            w-10 h-10 rounded-full flex items-center justify-center
            ${isValid ? 'bg-green-100' : 'bg-slate-100'}
          `}>
            {isValid ? (
              <Check className="w-5 h-5 text-green-600" />
            ) : (
              <User className="w-5 h-5 text-slate-400" />
            )}
          </div>
          <div>
            <div className="font-medium text-slate-800">
              {traveler.firstName && traveler.lastName 
                ? `${traveler.title === 'MR' ? 'Bay' : 'Bayan'} ${traveler.firstName} ${traveler.lastName}`
                : `${index + 1}. Yolcu`
              }
              {isLeadTraveler && <span className="ml-2 text-xs text-blue-600">(Ana Yolcu)</span>}
            </div>
            <div className="text-sm text-slate-500">
              {traveler.type === 'adult' ? 'Yetişkin' : 'Çocuk'}
            </div>
          </div>
        </div>
        <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
      </button>

      {/* Form */}
      {isExpanded && (
        <div className="p-4 pt-0 border-t border-slate-100">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Ünvan <span className="text-red-500">*</span>
              </label>
              <select
                value={traveler.title}
                onChange={(e) => onChange('title', e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                {TITLE_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            {/* Placeholder for grid alignment */}
            <div className="hidden sm:block" />

            {/* Ad */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Ad <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={traveler.firstName}
                onChange={(e) => onChange('firstName', e.target.value)}
                placeholder="Adınız (bilet üzerinde görünecek)"
                maxLength={15}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Soyad */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Soyad <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={traveler.lastName}
                onChange={(e) => onChange('lastName', e.target.value)}
                placeholder="Soyadınız"
                maxLength={20}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Email - sadece lead traveler için */}
            {isLeadTraveler && (
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

            {/* Telefon - sadece lead traveler için */}
            {isLeadTraveler && (
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

            {/* Doğum Tarihi - çocuklar için zorunlu */}
            {traveler.type === 'child' && (
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Doğum Tarihi <span className="text-red-500">*</span>
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
            )}

            {/* Passport fields - for international routes */}
            {requiresPassport && (
              <>
                <div className="sm:col-span-2 mt-4 pt-4 border-t border-slate-200">
                  <div className="flex items-center gap-2 text-amber-600 mb-4">
                    <Globe className="w-5 h-5" />
                    <span className="font-medium">Sınır Geçişi için Gerekli Bilgiler</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Pasaport/Kimlik No <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={traveler.passportNumber || ''}
                    onChange={(e) => onChange('passportNumber', e.target.value)}
                    placeholder="Pasaport veya kimlik numarası"
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Geçerlilik Tarihi <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={traveler.passportExpiry || ''}
                    onChange={(e) => onChange('passportExpiry', e.target.value)}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Ülke <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={traveler.passportCountry || ''}
                    onChange={(e) => onChange('passportCountry', e.target.value)}
                    placeholder="Türkiye"
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// TICKET CONDITIONS COMPONENT
// ============================================================

function TicketConditions({
  comfortClass,
  operator,
  isRefundable,
  isExchangeable,
}: {
  comfortClass: string;
  operator: string;
  isRefundable: boolean;
  isExchangeable: boolean;
}) {
  const [isExpanded, setIsExpanded] = useState(true);
  const comfortConfig = COMFORT_CONFIG[comfortClass] || COMFORT_CONFIG.standard;

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 flex items-center justify-between text-left bg-slate-50"
      >
        <div className="flex items-center gap-2">
          <Info className="w-5 h-5 text-blue-600" />
          <span className="font-semibold text-slate-800">Bilet Koşulları</span>
        </div>
        <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
      </button>
      
      {isExpanded && (
        <div className="p-4 space-y-4">
          {/* Sınıf Badge */}
          <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full ${comfortConfig.bgColor} ${comfortConfig.color}`}>
            <span>{comfortConfig.icon}</span>
            <span className="font-medium">{comfortConfig.labelTr}</span>
          </div>

          {/* İade Koşulu */}
          <div className="flex items-start gap-3">
            {isRefundable ? (
              <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                <Check className="w-4 h-4 text-green-600" />
              </div>
            ) : (
              <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                <X className="w-4 h-4 text-red-500" />
              </div>
            )}
            <div>
              <div className={`font-medium ${isRefundable ? 'text-green-700' : 'text-red-600'}`}>
                {isRefundable ? 'İade Edilebilir' : 'İade Edilemez'}
              </div>
              <div className="text-sm text-slate-500">
                {isRefundable 
                  ? 'Kalkıştan 24 saat öncesine kadar tam iade alabilirsiniz'
                  : 'Bu bilet için iade yapılamamaktadır'
                }
              </div>
            </div>
          </div>

          {/* Değişiklik Koşulu */}
          <div className="flex items-start gap-3">
            {isExchangeable ? (
              <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                <RefreshCw className="w-4 h-4 text-green-600" />
              </div>
            ) : (
              <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                <X className="w-4 h-4 text-red-500" />
              </div>
            )}
            <div>
              <div className={`font-medium ${isExchangeable ? 'text-green-700' : 'text-red-600'}`}>
                {isExchangeable ? 'Değiştirilebilir' : 'Değiştirilemez'}
              </div>
              <div className="text-sm text-slate-500">
                {isExchangeable 
                  ? 'Kalkıştan önce ücretsiz tarih/saat değişikliği yapabilirsiniz'
                  : 'Bu bilet için değişiklik yapılamamaktadır'
                }
              </div>
            </div>
          </div>

          {/* E-bilet Bilgisi */}
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

// ============================================================
// PRICE BREAKDOWN COMPONENT
// ============================================================

function PriceBreakdown({ 
  basePrice, 
  passengerCount,
  promoDiscount = 0
}: { 
  basePrice: number;
  passengerCount: number;
  promoDiscount?: number;
}) {
  const ticketPrice = basePrice * passengerCount;
  const serviceFee = Math.round(ticketPrice * SERVICE_FEE_PERCENT * 100) / 100;
  const totalBeforeDiscount = ticketPrice + serviceFee;
  const finalTotal = totalBeforeDiscount - promoDiscount;

  return (
    <div className="space-y-3">
      {/* Bilet Ücreti */}
      <div className="flex justify-between items-center">
        <div className="text-slate-600">
          Bilet Ücreti ({passengerCount} kişi)
        </div>
        <div className="font-medium text-slate-800">
          {formatPrice(ticketPrice)}
        </div>
      </div>

      {/* Hizmet Bedeli */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-1.5 text-slate-600">
          <span>Hizmet Bedeli</span>
          <div className="group relative">
            <Info className="w-4 h-4 text-slate-400 cursor-help" />
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-slate-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
              Platform ve müşteri hizmetleri bedeli
            </div>
          </div>
        </div>
        <div className="font-medium text-slate-800">
          {formatPrice(serviceFee)}
        </div>
      </div>

      {/* İndirim */}
      {promoDiscount > 0 && (
        <div className="flex justify-between items-center text-green-600">
          <div>İndirim</div>
          <div className="font-medium">-{formatPrice(promoDiscount)}</div>
        </div>
      )}

      {/* Ayırıcı */}
      <div className="border-t border-slate-200 pt-3" />

      {/* Toplam */}
      <div className="flex justify-between items-center">
        <div className="text-lg font-semibold text-slate-800">Toplam</div>
        <div className="text-xl font-bold text-slate-900">
          {formatPrice(finalTotal)}
        </div>
      </div>

      {/* Vergi notu */}
      <div className="text-xs text-slate-500 text-right">
        Tüm vergiler dahil
      </div>
    </div>
  );
}

// ============================================================
// TERMS CHECKBOX COMPONENT
// ============================================================

function TermsCheckbox({
  checked,
  onChange,
  comfortClass,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  comfortClass: string;
}) {
  const isRefundable = comfortClass === 'comfort' || comfortClass === 'premier';
  const isExchangeable = true;

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
            <Link href="/terms" className="text-blue-600 hover:underline font-medium" target="_blank" onClick={(e) => e.stopPropagation()}>
              Satış Koşulları
            </Link>
            {', '}
            <Link href="/privacy" className="text-blue-600 hover:underline font-medium" target="_blank" onClick={(e) => e.stopPropagation()}>
              Gizlilik Politikası
            </Link>
            {' ve '}
            <Link href="/cancellation" className="text-blue-600 hover:underline font-medium" target="_blank" onClick={(e) => e.stopPropagation()}>
              İptal/İade Koşulları
            </Link>
            'nı okudum ve kabul ediyorum.
          </div>
          <div className="text-xs text-slate-500 mt-1.5">
            {isRefundable 
              ? '✓ Bu bilet iade edilebilir' 
              : '⚠ Bu bilet iade edilemez'}
            {' • '}
            {isExchangeable 
              ? '✓ Değişiklik yapılabilir' 
              : '⚠ Değişiklik yapılamaz'}
          </div>
        </div>
      </label>
    </div>
  );
}

// ============================================================
// PRICE UPDATE MODAL
// ============================================================

function PriceUpdateModal({
  priceVerification,
  passengerCount,
  onAccept,
  onReject,
  onSearchAlternatives,
}: {
  priceVerification: PriceVerification;
  passengerCount: number;
  onAccept: () => void;
  onReject: () => void;
  onSearchAlternatives: () => void;
}) {
  const { priceStatus, originalPrice, currentPrice, priceDifference, percentageChange, journeyAvailable, alternatives } = priceVerification;

  // Calculate with service fee
  const originalWithFee = originalPrice + (originalPrice * SERVICE_FEE_PERCENT);
  const currentWithFee = currentPrice ? currentPrice + (currentPrice * SERVICE_FEE_PERCENT) : 0;
  const totalOriginal = originalWithFee * passengerCount;
  const totalCurrent = currentWithFee * passengerCount;

  if (!journeyAvailable) {
    return (
      <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-2xl max-w-md w-full overflow-hidden shadow-2xl">
          <div className="bg-red-500 p-6 text-white text-center">
            <XCircle className="w-16 h-16 mx-auto mb-4" />
            <h2 className="text-2xl font-bold">Sefer Mevcut Değil</h2>
          </div>
          <div className="p-6">
            <p className="text-gray-600 text-center mb-6">
              Maalesef bu sefer artık müsait değil. Yoğun talep nedeniyle koltuklar tükenmiş olabilir.
            </p>
            
            {alternatives && alternatives.length > 0 && (
              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 mb-3">Alternatif Seferler:</h3>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {alternatives.map((alt, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <span className="font-medium">{alt.operator} {alt.trainNumber}</span>
                        <span className="text-gray-500 text-sm ml-2">
                          {alt.departureTime} → {alt.arrivalTime}
                        </span>
                      </div>
                      <span className="font-bold text-blue-600">{formatPrice(alt.price)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <div className="flex gap-3">
              <button
                onClick={onSearchAlternatives}
                className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700"
              >
                Yeni Sefer Ara
              </button>
              <button
                onClick={onReject}
                className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50"
              >
                Ana Sayfa
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (priceStatus === 'increased') {
    return (
      <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-2xl max-w-md w-full overflow-hidden shadow-2xl">
          <div className="bg-amber-500 p-6 text-white text-center">
            <AlertTriangle className="w-16 h-16 mx-auto mb-4" />
            <h2 className="text-2xl font-bold">Fiyat Güncellemesi</h2>
          </div>
          <div className="p-6">
            <p className="text-gray-600 text-center mb-6">
              Rezervasyon oluşturulduğundan bu yana fiyat değişikliği oldu.
            </p>
            
            <div className="bg-gray-50 rounded-xl p-4 mb-6">
              <div className="flex items-center justify-between mb-3">
                <span className="text-gray-500">Önceki toplam:</span>
                <span className="text-lg line-through text-gray-400">{formatPrice(totalOriginal)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-700 font-medium">Güncel toplam:</span>
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-red-500" />
                  <span className="text-2xl font-bold text-gray-900">{formatPrice(totalCurrent)}</span>
                </div>
              </div>
              <div className="mt-2 text-right">
                <span className="text-sm text-red-600">
                  +{formatPrice(totalCurrent - totalOriginal)} ({percentageChange?.toFixed(1)}% artış)
                </span>
              </div>
            </div>
            
            <p className="text-sm text-gray-500 text-center mb-6">
              Hizmet bedeli dahil toplam tutar gösterilmektedir.
            </p>
            
            <div className="flex gap-3">
              <button
                onClick={onAccept}
                className="flex-1 py-3 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700"
              >
                Kabul Et
              </button>
              <button
                onClick={onSearchAlternatives}
                className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50"
              >
                Yeni Ara
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (priceStatus === 'decreased') {
    return (
      <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-2xl max-w-md w-full overflow-hidden shadow-2xl">
          <div className="bg-green-500 p-6 text-white text-center">
            <Sparkles className="w-16 h-16 mx-auto mb-4" />
            <h2 className="text-2xl font-bold">İyi Haber! 🎉</h2>
          </div>
          <div className="p-6">
            <p className="text-gray-600 text-center mb-6">
              Fiyat düştü! Şanslısınız.
            </p>
            
            <div className="bg-green-50 rounded-xl p-4 mb-6">
              <div className="flex items-center justify-between mb-3">
                <span className="text-gray-500">Önceki toplam:</span>
                <span className="text-lg line-through text-gray-400">{formatPrice(totalOriginal)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-700 font-medium">Güncel toplam:</span>
                <div className="flex items-center gap-2">
                  <TrendingDown className="w-5 h-5 text-green-500" />
                  <span className="text-2xl font-bold text-green-600">{formatPrice(totalCurrent)}</span>
                </div>
              </div>
              <div className="mt-2 text-right">
                <span className="text-sm text-green-600">
                  {formatPrice(totalOriginal - totalCurrent)} tasarruf!
                </span>
              </div>
            </div>
            
            <button
              onClick={onAccept}
              className="w-full py-3 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700"
            >
              Harika! Devam Et
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

// ============================================================
// LOADING COMPONENT
// ============================================================

function CheckoutLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
        </div>
        <h1 className="text-xl font-semibold text-slate-800 mb-2">Yükleniyor...</h1>
        <p className="text-slate-500">Rezervasyon bilgileri alınıyor</p>
      </div>
    </div>
  );
}

// ============================================================
// MAIN CHECKOUT CONTENT (useSearchParams kullanıyor)
// ============================================================

function McpCheckoutContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');

  // Loading states
  const [loading, setLoading] = useState(true);
  const [verifyingPrice, setVerifyingPrice] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);
  
  // Data states
  const [error, setError] = useState<string | null>(null);
  const [booking, setBooking] = useState<BookingData | null>(null);
  const [remainingTime, setRemainingTime] = useState<number>(0);
  
  // Price verification
  const [priceVerification, setPriceVerification] = useState<PriceVerification | null>(null);
  const [showPriceModal, setShowPriceModal] = useState(false);
  const [acceptedPrice, setAcceptedPrice] = useState<number | null>(null);
  
  // Traveler states
  const [travelers, setTravelers] = useState<TravelerForm[]>([]);
  const [expandedTraveler, setExpandedTraveler] = useState<number>(0);
  
  // Form states
  const [promoCode, setPromoCode] = useState('');
  const [promoDiscount, setPromoDiscount] = useState(0);
  const [termsAccepted, setTermsAccepted] = useState(false);
  
  // Derived
  const passengerCount = (booking?.adults || 1) + (booking?.children || 0);
  const comfortClass = booking?.ticketClass?.toLowerCase() || 'standard';
  const requiresPassport = isInternationalRoute(booking?.operator || '');
  const isRefundable = comfortClass === 'comfort' || comfortClass === 'premier';
  const isExchangeable = comfortClass !== 'standard' || true; // Most tickets are exchangeable

  // Initialize travelers when booking loads
  useEffect(() => {
    if (booking) {
      const adults = booking.adults || 1;
      const children = booking.children || 0;
      const newTravelers: TravelerForm[] = [];
      
      // Parse name from booking (MCP sends full name)
      const nameParts = booking.customerName?.split(' ') || [];
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';
      
      for (let i = 0; i < adults; i++) {
        newTravelers.push({
          id: `adult-${i}`,
          title: 'MR',
          firstName: i === 0 ? firstName : '',
          lastName: i === 0 ? lastName : '',
          email: i === 0 ? booking.customerEmail || '' : '',
          phone: '',
          dateOfBirth: '',
          type: 'adult',
        });
      }
      
      for (let i = 0; i < children; i++) {
        newTravelers.push({
          id: `child-${i}`,
          title: 'MR',
          firstName: '',
          lastName: '',
          email: '',
          phone: '',
          dateOfBirth: '',
          type: 'child',
        });
      }
      
      setTravelers(newTravelers);
    }
  }, [booking]);

  // Verify token and check price
  useEffect(() => {
    if (!token) {
      setError('Geçersiz bağlantı.');
      setLoading(false);
      return;
    }

    async function verifyAndCheckPrice() {
      try {
        const verifyRes = await fetch(`${API_URL}/mcp/booking/verify/${token}`);
        const verifyData = await verifyRes.json();

        if (!verifyData.valid || !verifyData.booking) {
          setError(verifyData.error || 'Rezervasyon bulunamadı.');
          setLoading(false);
          return;
        }

        setBooking(verifyData.booking);
        setRemainingTime(verifyData.remainingMinutes * 60);
        setLoading(false);
        
        // Price verification (background)
        setVerifyingPrice(true);
        try {
          const priceRes = await fetch(`${API_URL}/mcp/booking/verify-price/${token}`);
          const priceData: PriceVerification = await priceRes.json();
          
          setPriceVerification(priceData);
          
          if (priceData.priceStatus !== 'same') {
            setShowPriceModal(true);
          }
        } catch (e) {
          console.warn('Price verification failed');
        }
        setVerifyingPrice(false);

      } catch (err) {
        setError('Sunucuya bağlanılamadı.');
        setLoading(false);
      }
    }

    verifyAndCheckPrice();
  }, [token]);

  // Countdown timer
  useEffect(() => {
    if (remainingTime <= 0) return;

    const interval = setInterval(() => {
      setRemainingTime(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [remainingTime]);

  // Format time for display
  const formatTimeDisplay = useCallback((seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);

  // Validation
  const isTravelerValid = useCallback((traveler: TravelerForm, isLeadTraveler: boolean): boolean => {
    if (!traveler.firstName || !traveler.lastName) return false;
    if (isLeadTraveler && (!traveler.email || !traveler.phone)) return false;
    if (traveler.type === 'child' && !traveler.dateOfBirth) return false;
    if (requiresPassport && (!traveler.passportNumber || !traveler.passportExpiry || !traveler.passportCountry)) return false;
    return true;
  }, [requiresPassport]);

  const allTravelersValid = travelers.every((t, i) => isTravelerValid(t, i === 0 && t.type === 'adult'));

  // Handlers
  const handleTravelerChange = useCallback((index: number, field: keyof TravelerForm, value: string) => {
    setTravelers(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  }, []);

  const handleApplyPromo = useCallback(() => {
    if (promoCode.toUpperCase() === 'EUROTRAIN10') {
      setPromoDiscount(10);
    } else if (promoCode.toUpperCase() === 'WELCOME20') {
      setPromoDiscount(20);
    } else {
      setPromoDiscount(0);
      alert('Geçersiz kampanya kodu');
    }
  }, [promoCode]);

  const handleAcceptPrice = useCallback(() => {
    if (priceVerification?.currentPrice) {
      setAcceptedPrice(priceVerification.currentPrice);
    }
    setShowPriceModal(false);
  }, [priceVerification]);

  const handleRejectPrice = useCallback(() => {
    router.push('/');
  }, [router]);

  const handleSearchAlternatives = useCallback(() => {
    // Redirect to search with same route
    if (booking) {
      router.push(`/search?from=${encodeURIComponent(booking.fromStation)}&to=${encodeURIComponent(booking.toStation)}&date=${booking.departureDate}`);
    } else {
      router.push('/');
    }
  }, [router, booking]);

  const handlePayment = useCallback(async () => {
    if (!booking || !termsAccepted || !allTravelersValid) return;
    
    setProcessingPayment(true);
    setError(null);

    try {
      // Update travelers first
      const travelersRes = await fetch(`${API_URL}/mcp/booking/${booking.id}/travelers`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ travelers }),
      });

      if (!travelersRes.ok) {
        throw new Error('Yolcu bilgileri kaydedilemedi');
      }

      // Initiate payment
      const paymentRes = await fetch(`${API_URL}/mcp/booking/${booking.id}/payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          returnUrl: `${window.location.origin}/payment/success`,
          cancelUrl: `${window.location.origin}/payment/error`,
          acceptedPrice: acceptedPrice,
        }),
      });

      const paymentData = await paymentRes.json();

      if (paymentData.redirectUrl) {
        window.location.href = paymentData.redirectUrl;
      } else {
        throw new Error('Ödeme başlatılamadı');
      }
    } catch (err: any) {
      setError(err.message || 'Bir hata oluştu');
      setProcessingPayment(false);
    }
  }, [booking, termsAccepted, allTravelersValid, travelers, acceptedPrice]);

  // Calculated values
  const basePrice = acceptedPrice || priceVerification?.currentPrice || booking?.price || 0;
  const ticketPrice = basePrice * passengerCount;
  const serviceFee = Math.round(ticketPrice * SERVICE_FEE_PERCENT * 100) / 100;
  const finalTotal = ticketPrice + serviceFee - promoDiscount;
  const isExpired = remainingTime <= 0;
  const comfortConfig = COMFORT_CONFIG[comfortClass] || COMFORT_CONFIG.standard;

  // Loading state
  if (loading) {
    return <CheckoutLoading />;
  }

  // Error state
  if (error && !booking) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <h1 className="text-xl font-bold text-slate-800 mb-2">Bir Sorun Oluştu</h1>
          <p className="text-slate-600 mb-6">{error}</p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium"
          >
            Ana Sayfaya Dön
          </Link>
        </div>
      </div>
    );
  }

  if (!booking) {
    return <CheckoutLoading />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
                <Train className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-slate-900">EuroTrain</span>
            </Link>

            {/* Timer */}
            {!isExpired ? (
              <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${
                remainingTime < 300 ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
              }`}>
                <Timer className="w-4 h-4" />
                <span className="font-mono font-semibold">{formatTimeDisplay(remainingTime)}</span>
                <span className="text-sm">kaldı</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-red-100 text-red-700">
                <XCircle className="w-4 h-4" />
                <span className="font-semibold">Süre Doldu</span>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Title */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-800 mb-2">Yolcu Bilgileri</h1>
          <p className="text-slate-500">
            Lütfen tüm yolcuların bilgilerini eksiksiz doldurunuz.
            {requiresPassport && (
              <span className="text-amber-600 font-medium ml-1">
                Bu uluslararası bir sefer olduğu için kimlik bilgileri zorunludur.
              </span>
            )}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Forms */}
          <div className="lg:col-span-2 space-y-6">
            {/* Traveler Forms */}
            <div className="space-y-4">
              {travelers.map((traveler, index) => (
                <TravelerCard
                  key={traveler.id}
                  traveler={traveler}
                  index={index}
                  isExpanded={expandedTraveler === index}
                  onToggle={() => setExpandedTraveler(expandedTraveler === index ? -1 : index)}
                  onChange={(field, value) => handleTravelerChange(index, field, value)}
                  isLeadTraveler={index === 0 && traveler.type === 'adult'}
                  isValid={isTravelerValid(traveler, index === 0 && traveler.type === 'adult')}
                  requiresPassport={requiresPassport}
                />
              ))}
            </div>

            {/* Promo Code */}
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h3 className="font-semibold text-slate-800 mb-4">Kampanya Kodu</h3>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value)}
                  placeholder="Kampanya kodunuz"
                  className="flex-1 px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={handleApplyPromo}
                  className="px-6 py-2.5 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors font-medium"
                >
                  Uygula
                </button>
              </div>
              {promoDiscount > 0 && (
                <div className="mt-2 text-green-600 text-sm flex items-center gap-1">
                  <Check className="w-4 h-4" />
                  {promoDiscount}€ indirim uygulandı!
                </div>
              )}
            </div>

            {/* Terms */}
            <TermsCheckbox
              checked={termsAccepted}
              onChange={setTermsAccepted}
              comfortClass={comfortClass}
            />

            {/* Error */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-600" />
                <p className="text-red-800">{error}</p>
              </div>
            )}

            {/* Payment Button */}
            <button
              onClick={handlePayment}
              disabled={!termsAccepted || !allTravelersValid || processingPayment || isExpired}
              className={`
                w-full py-4 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all
                ${termsAccepted && allTravelersValid && !processingPayment && !isExpired
                  ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700 shadow-lg'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }
              `}
            >
              {processingPayment ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Ödeme İşleniyor...</span>
                </>
              ) : isExpired ? (
                <span>Süre Doldu</span>
              ) : (
                <>
                  <CreditCard className="w-5 h-5" />
                  <span>Ödemeye Geç - {formatPrice(finalTotal)}</span>
                </>
              )}
            </button>

            {!allTravelersValid && !isExpired && (
              <p className="text-center text-sm text-amber-600">
                Lütfen tüm yolcu bilgilerini eksiksiz doldurunuz
              </p>
            )}
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-4">
            {/* Journey Card */}
            <div className="bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl p-5 text-white">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Train className="w-5 h-5" />
                  <span className="font-semibold">{booking.operator}</span>
                  <span className="text-blue-200 text-sm">{booking.trainNumber}</span>
                </div>
                <div className={`px-2.5 py-1 rounded-full text-xs font-bold ${comfortConfig.bgColor} ${comfortConfig.color}`}>
                  {comfortConfig.icon} {comfortConfig.labelTr}
                </div>
              </div>

              <div className="flex items-center justify-between mb-4">
                <div className="text-center">
                  <div className="text-2xl font-bold">{booking.departureTime}</div>
                  <div className="text-blue-200 text-sm">{booking.fromStation}</div>
                </div>
                <div className="flex flex-col items-center flex-1 mx-4">
                  <ArrowRight className="w-5 h-5" />
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{booking.arrivalTime}</div>
                  <div className="text-blue-200 text-sm">{booking.toStation}</div>
                </div>
              </div>

              <div className="text-center text-blue-100 text-sm">
                {booking.departureDate ? new Date(booking.departureDate).toLocaleDateString('tr-TR', {
                  weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
                }) : ''}
              </div>

              <div className="flex items-center justify-center gap-4 mt-4 pt-4 border-t border-blue-500/30">
                <div className="flex items-center gap-1 text-sm">
                  {isExchangeable ? (
                    <Check className="w-4 h-4 text-green-300" />
                  ) : (
                    <X className="w-4 h-4 text-red-300" />
                  )}
                  <span className="text-blue-100">Değiştirilebilir</span>
                </div>
                <div className="flex items-center gap-1 text-sm">
                  {isRefundable ? (
                    <Check className="w-4 h-4 text-green-300" />
                  ) : (
                    <X className="w-4 h-4 text-red-300" />
                  )}
                  <span className="text-blue-100">İade Edilebilir</span>
                </div>
              </div>
            </div>

            {/* Price Breakdown */}
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <h3 className="font-semibold text-slate-800 mb-4">Fiyat Detayı</h3>
              <PriceBreakdown 
                basePrice={basePrice}
                passengerCount={passengerCount}
                promoDiscount={promoDiscount}
              />
            </div>

            {/* Ticket Conditions */}
            <TicketConditions 
              comfortClass={comfortClass}
              operator={booking.operator}
              isRefundable={isRefundable}
              isExchangeable={isExchangeable}
            />

            {/* Passenger Count */}
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <div className="flex items-center gap-3 text-slate-600">
                <User className="w-5 h-5" />
                <span>
                  {booking.adults || 1} Yetişkin
                  {(booking.children || 0) > 0 && `, ${booking.children} Çocuk`}
                </span>
              </div>
            </div>

            {/* Trust Badge */}
            <div className="flex items-center gap-2 text-slate-500 text-sm justify-center">
              <Shield className="w-4 h-4 text-green-500" />
              <span>256-bit SSL ile güvenli ödeme</span>
            </div>

            {verifyingPrice && (
              <div className="flex items-center justify-center gap-2 text-sm text-slate-500">
                <Loader2 className="w-4 h-4 animate-spin" />
                Fiyat doğrulanıyor...
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Price Update Modal */}
      {showPriceModal && priceVerification && (
        <PriceUpdateModal
          priceVerification={priceVerification}
          passengerCount={passengerCount}
          onAccept={handleAcceptPrice}
          onReject={handleRejectPrice}
          onSearchAlternatives={handleSearchAlternatives}
        />
      )}
    </div>
  );
}

// ============================================================
// MAIN PAGE EXPORT - Suspense ile sarılmış
// ============================================================

export default function McpCheckoutPage() {
  return (
    <Suspense fallback={<CheckoutLoading />}>
      <McpCheckoutContent />
    </Suspense>
  );
}
