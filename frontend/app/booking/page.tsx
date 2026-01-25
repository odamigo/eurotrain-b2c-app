'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Train, ArrowLeft, User, Mail, Phone, Calendar, ChevronDown, ChevronUp,
  Check, X, Loader2, Shield, CreditCard, Clock, MapPin, ArrowRight,
  AlertCircle, Info, ChevronRight, RefreshCw, Ticket, Download, Send,
  CalendarPlus, Briefcase, FileText, Share2, Copy, CheckCircle2
} from 'lucide-react';
import { createBooking, updateTravelers, prebookBooking, Journey, formatPrice, formatTime, formatDuration } from '@/lib/api/era-client';

// ============================================================
// TYPES
// ============================================================

interface TravelerForm {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  type: 'adult' | 'child';
}

interface Passengers {
  adults: number;
  children: number;
}

// ============================================================
// CONSTANTS
// ============================================================

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

const SERVICE_FEE_PERCENT = 0.05; // %5 hizmet bedeli

// ============================================================
// COMPONENTS
// ============================================================

// Traveler Card Component
function TravelerCard({
  traveler,
  index,
  isExpanded,
  onToggle,
  onChange,
  isFirstAdult,
  isValid,
}: {
  traveler: TravelerForm;
  index: number;
  isExpanded: boolean;
  onToggle: () => void;
  onChange: (field: keyof TravelerForm, value: string) => void;
  isFirstAdult: boolean;
  isValid: boolean;
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
                ? `${traveler.firstName} ${traveler.lastName}`
                : `${index + 1}. Yolcu`
              }
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
            {/* Ad */}
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
                className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Email - sadece ilk yetişkin için zorunlu */}
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

            {/* Telefon - sadece ilk yetişkin için zorunlu */}
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
          </div>
        </div>
      )}
    </div>
  );
}

// Ticket Conditions Component - Sidebar'da görünen
function TicketConditions({ journey }: { journey: Journey }) {
  const [isExpanded, setIsExpanded] = useState(true);
  const comfortConfig = COMFORT_CONFIG[journey.comfortCategory] || COMFORT_CONFIG.standard;
  
  const flexibilityLabel = typeof journey.flexibility === 'string' 
    ? journey.flexibility 
    : (journey.flexibility as any)?.label || '';

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
              <div className={`font-medium ${journey.isRefundable ? 'text-green-700' : 'text-red-600'}`}>
                {journey.isRefundable ? 'İade Edilebilir' : 'İade Edilemez'}
              </div>
              <div className="text-sm text-slate-500">
                {journey.isRefundable 
                  ? 'Kalkıştan 24 saat öncesine kadar tam iade alabilirsiniz'
                  : 'Bu bilet için iade yapılamamaktadır'
                }
              </div>
            </div>
          </div>

          {/* Değişiklik Koşulu */}
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
              <div className={`font-medium ${journey.isExchangeable ? 'text-green-700' : 'text-red-600'}`}>
                {journey.isExchangeable ? 'Değiştirilebilir' : 'Değiştirilemez'}
              </div>
              <div className="text-sm text-slate-500">
                {journey.isExchangeable 
                  ? 'Kalkıştan önce ücretsiz tarih/saat değişikliği yapabilirsiniz'
                  : 'Bu bilet için değişiklik yapılamamaktadır'
                }
              </div>
            </div>
          </div>

          {/* Esneklik Seviyesi */}
          {flexibilityLabel && (
            <div className="pt-3 border-t border-slate-100">
              <div className="text-sm text-slate-600">
                Esneklik Seviyesi: <span className="font-semibold text-slate-800">{flexibilityLabel}</span>
              </div>
            </div>
          )}

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

// Price Breakdown Component - Omio/Trainline tarzı
function PriceBreakdown({ 
  journey, 
  passengers,
  promoDiscount = 0
}: { 
  journey: Journey;
  passengers: Passengers;
  promoDiscount?: number;
}) {
  const totalPassengers = passengers.adults + passengers.children;
  const ticketPrice = journey.price.amount * totalPassengers;
  const serviceFee = Math.round(ticketPrice * SERVICE_FEE_PERCENT * 100) / 100;
  const totalBeforeDiscount = ticketPrice + serviceFee;
  const finalTotal = totalBeforeDiscount - promoDiscount;

  return (
    <div className="space-y-3">
      {/* Bilet Ücreti */}
      <div className="flex justify-between items-center">
        <div className="text-slate-600">
          Bilet Ücreti ({totalPassengers} kişi)
        </div>
        <div className="font-medium text-slate-800">
          {formatPrice(ticketPrice, journey.price.currency)}
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
          {formatPrice(serviceFee, journey.price.currency)}
        </div>
      </div>

      {/* İndirim */}
      {promoDiscount > 0 && (
        <div className="flex justify-between items-center text-green-600">
          <div>İndirim</div>
          <div className="font-medium">-{formatPrice(promoDiscount, journey.price.currency)}</div>
        </div>
      )}

      {/* Ayırıcı */}
      <div className="border-t border-slate-200 pt-3" />

      {/* Toplam */}
      <div className="flex justify-between items-center">
        <div className="text-lg font-semibold text-slate-800">Toplam</div>
        <div className="text-xl font-bold text-slate-900">
          {formatPrice(finalTotal, journey.price.currency)}
        </div>
      </div>

      {/* Vergi notu */}
      <div className="text-xs text-slate-500 text-right">
        Tüm vergiler dahil
      </div>
    </div>
  );
}

// Terms Checkbox Component - Trainline/Omio tarzı
function TermsCheckbox({
  checked,
  onChange,
  journey,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  journey: Journey;
}) {
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

// Success Screen Component - Trainline/Omio tarzı
function BookingSuccess({
  bookingRef,
  journey,
  travelers,
  passengers,
}: {
  bookingRef: string;
  journey: Journey;
  travelers: TravelerForm[];
  passengers: Passengers;
}) {
  const [copied, setCopied] = useState(false);
  const [shareEmail, setShareEmail] = useState('');
  const [showShareForm, setShowShareForm] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);

  const handleCopyRef = () => {
    navigator.clipboard.writeText(bookingRef);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadPDF = () => {
    // TODO: Real PDF generation
    alert('PDF indirme özelliği yakında aktif olacak');
  };

  const handleAddToCalendar = () => {
    // Create ICS file content
    const startDate = new Date(journey.departure);
    const endDate = new Date(journey.arrival);
    
    const formatICSDate = (date: Date) => {
      return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };

    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//EuroTrain//Booking//TR
BEGIN:VEVENT
UID:${bookingRef}@eurotrain.net
DTSTAMP:${formatICSDate(new Date())}
DTSTART:${formatICSDate(startDate)}
DTEND:${formatICSDate(endDate)}
SUMMARY:Tren Yolculuğu - ${journey.origin.city} → ${journey.destination.city}
DESCRIPTION:Rezervasyon No: ${bookingRef}\\nOperatör: ${journey.operator}\\nTren: ${journey.trainNumber}
LOCATION:${journey.origin.name}
END:VEVENT
END:VCALENDAR`;

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `eurotrain-${bookingRef}.ics`;
    link.click();
  };

  const handleSendToEmail = async () => {
    if (!shareEmail || !shareEmail.includes('@')) {
      alert('Geçerli bir e-posta adresi girin');
      return;
    }

    setSendingEmail(true);
    
    // Simulate email sending
    setTimeout(() => {
      setSendingEmail(false);
      setEmailSent(true);
      setShareEmail('');
      setTimeout(() => {
        setEmailSent(false);
        setShowShareForm(false);
      }, 3000);
    }, 1500);
  };

  const primaryEmail = travelers[0]?.email || '';

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      {/* Success Header */}
      <div className="bg-gradient-to-r from-green-500 to-emerald-500 p-8 text-center text-white">
        <div className="w-20 h-20 bg-white/20 backdrop-blur rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-12 h-12 text-white" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Rezervasyonunuz Tamamlandı!</h2>
        <p className="text-green-100">
          E-biletiniz <strong>{primaryEmail}</strong> adresine gönderildi
        </p>
      </div>

      {/* Booking Reference */}
      <div className="p-6 border-b border-slate-200">
        <div className="bg-slate-50 rounded-xl p-5 text-center">
          <div className="text-sm text-slate-500 mb-1">Rezervasyon Numarası</div>
          <div className="flex items-center justify-center gap-3">
            <span className="text-3xl font-bold text-blue-600">{bookingRef}</span>
            <button
              onClick={handleCopyRef}
              className="p-2 hover:bg-slate-200 rounded-lg transition-colors"
              title="Kopyala"
            >
              {copied ? (
                <Check className="w-5 h-5 text-green-600" />
              ) : (
                <Copy className="w-5 h-5 text-slate-400" />
              )}
            </button>
          </div>
          <div className="text-xs text-slate-400 mt-2">
            Bu numarayı biletinizi görüntülemek için saklayın
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="p-6 space-y-4">
        {/* Primary Actions */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={handleDownloadPDF}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium"
          >
            <Download className="w-5 h-5" />
            <span>PDF İndir</span>
          </button>
          <button
            onClick={handleAddToCalendar}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-colors font-medium"
          >
            <CalendarPlus className="w-5 h-5" />
            <span>Takvime Ekle</span>
          </button>
        </div>

        {/* Secondary Actions */}
        <div className="grid grid-cols-2 gap-3">
          <Link
            href="/my-trips"
            className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors font-medium"
          >
            <Briefcase className="w-5 h-5" />
            <span>Biletlerim</span>
          </Link>
          <button
            onClick={() => setShowShareForm(!showShareForm)}
            className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors font-medium"
          >
            <Share2 className="w-5 h-5" />
            <span>Paylaş</span>
          </button>
        </div>

        {/* Share Form */}
        {showShareForm && (
          <div className="bg-slate-50 rounded-xl p-4 mt-4">
            <h4 className="font-medium text-slate-800 mb-3 flex items-center gap-2">
              <Send className="w-4 h-4" />
              Bileti Başka Birine Gönder
            </h4>
            {emailSent ? (
              <div className="flex items-center justify-center gap-2 py-3 text-green-600">
                <Check className="w-5 h-5" />
                <span>E-posta gönderildi!</span>
              </div>
            ) : (
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="email"
                    value={shareEmail}
                    onChange={(e) => setShareEmail(e.target.value)}
                    placeholder="E-posta adresi"
                    className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <button
                  onClick={handleSendToEmail}
                  disabled={sendingEmail}
                  className="px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
                >
                  {sendingEmail ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    'Gönder'
                  )}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Home Button */}
        <Link
          href="/"
          className="flex items-center justify-center gap-2 w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all font-semibold mt-4"
        >
          <Train className="w-5 h-5" />
          <span>Ana Sayfaya Dön</span>
        </Link>
      </div>

      {/* Trip Summary */}
      <div className="border-t border-slate-200 p-6 bg-slate-50">
        <h4 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
          <FileText className="w-4 h-4" />
          Yolculuk Özeti
        </h4>
        <div className="bg-white rounded-lg p-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-500">Güzergah</span>
            <span className="font-medium">{journey.origin.city} → {journey.destination.city}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Tarih</span>
            <span className="font-medium">
              {new Date(journey.departure).toLocaleDateString('tr-TR', { 
                day: 'numeric', 
                month: 'long', 
                year: 'numeric' 
              })}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Saat</span>
            <span className="font-medium">{formatTime(journey.departure)} - {formatTime(journey.arrival)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Operatör</span>
            <span className="font-medium">{journey.operator} • {journey.trainNumber}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Yolcular</span>
            <span className="font-medium">
              {passengers.adults} Yetişkin
              {passengers.children > 0 && `, ${passengers.children} Çocuk`}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// MAIN PAGE
// ============================================================

export default function BookingPage() {
  const router = useRouter();

  // State
  const [journey, setJourney] = useState<Journey | null>(null);
  const [passengers, setPassengers] = useState<Passengers>({ adults: 1, children: 0 });
  const [travelers, setTravelers] = useState<TravelerForm[]>([]);
  const [expandedTraveler, setExpandedTraveler] = useState<number>(0);
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [bookingRef, setBookingRef] = useState<string | null>(null);
  const [promoCode, setPromoCode] = useState('');
  const [promoDiscount, setPromoDiscount] = useState(0);
  const [termsAccepted, setTermsAccepted] = useState(false);

  // Load journey from sessionStorage
  useEffect(() => {
    const storedJourney = sessionStorage.getItem('selectedJourney');
    const storedPassengers = sessionStorage.getItem('passengers');

    if (!storedJourney) {
      router.push('/');
      return;
    }

    const parsedJourney = JSON.parse(storedJourney) as Journey;
    setJourney(parsedJourney);

    if (storedPassengers) {
      const parsedPassengers = JSON.parse(storedPassengers) as Passengers;
      setPassengers(parsedPassengers);

      // Initialize travelers
      const newTravelers: TravelerForm[] = [];
      
      for (let i = 0; i < parsedPassengers.adults; i++) {
        newTravelers.push({
          id: `adult-${i}`,
          firstName: '',
          lastName: '',
          email: '',
          phone: '',
          dateOfBirth: '',
          type: 'adult',
        });
      }
      
      for (let i = 0; i < parsedPassengers.children; i++) {
        newTravelers.push({
          id: `child-${i}`,
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
  }, [router]);

  // Validation
  const isTravelerValid = (traveler: TravelerForm, isFirstAdult: boolean): boolean => {
    if (!traveler.firstName || !traveler.lastName) return false;
    if (isFirstAdult && (!traveler.email || !traveler.phone)) return false;
    if (traveler.type === 'child' && !traveler.dateOfBirth) return false;
    return true;
  };

  const allTravelersValid = travelers.every((t, i) => isTravelerValid(t, i === 0 && t.type === 'adult'));

  // Handlers
  const handleTravelerChange = (index: number, field: keyof TravelerForm, value: string) => {
    setTravelers(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleApplyPromo = () => {
    // Mock promo code logic
    if (promoCode.toUpperCase() === 'EUROTRAIN10') {
      setPromoDiscount(10);
    } else if (promoCode.toUpperCase() === 'WELCOME20') {
      setPromoDiscount(20);
    } else {
      setPromoDiscount(0);
      alert('Geçersiz kampanya kodu');
    }
  };

  const handleContinue = async () => {
    if (!journey || !allTravelersValid) return;

    setLoading(true);
    setError(null);

    try {
      // Step 1: Create Booking
      const booking = await createBooking([journey.offerLocation]);
      setBookingId(booking.id);
      setBookingRef(booking.reference);

      // Step 2: Update Travelers
      const itemId = booking.items?.[0]?.id;
      if (itemId) {
        await updateTravelers(booking.id, itemId, travelers.map((t, i) => ({
          id: t.id,
          firstName: t.firstName,
          lastName: t.lastName,
          email: i === 0 ? t.email : undefined,
          phone: i === 0 ? t.phone : undefined,
          dateOfBirth: t.type === 'child' ? t.dateOfBirth : undefined,
        })));
      }

      // Step 3: Prebook
      await prebookBooking(booking.id);

      // Move to next step
      setCurrentStep(2);
    } catch (err: any) {
      console.error('Booking error:', err);
      setError(err.message || 'Rezervasyon oluşturulurken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    if (!termsAccepted) {
      alert('Lütfen koşulları kabul edin');
      return;
    }

    // For now, just simulate success
    setLoading(true);
    
    setTimeout(() => {
      setCurrentStep(3);
      setLoading(false);
    }, 2000);
  };

  // Format date
  const formatDateDisplay = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('tr-TR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        weekday: 'long'
      });
    } catch {
      return dateStr;
    }
  };

  if (!journey) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
      </div>
    );
  }

  const comfortConfig = COMFORT_CONFIG[journey.comfortCategory] || COMFORT_CONFIG.standard;

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200">
                <Train className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-slate-900">EuroTrain</span>
            </Link>
            
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-slate-600 hover:text-blue-600 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Geri</span>
            </button>
          </div>
        </div>
      </header>

      {/* Step Indicator */}
      <div className="bg-white border-b border-slate-200 py-4">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center gap-4">
            {[
              { step: 1, label: 'Yolcu Bilgileri' },
              { step: 2, label: 'Özet & Onay' },
              { step: 3, label: 'Ödeme' },
            ].map((item, index) => (
              <div key={item.step} className="flex items-center">
                <div className={`
                  flex items-center gap-2
                  ${currentStep >= item.step ? 'text-blue-600' : 'text-slate-400'}
                `}>
                  <div className={`
                    w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm
                    ${currentStep > item.step 
                      ? 'bg-green-500 text-white' 
                      : currentStep === item.step 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-slate-200 text-slate-500'
                    }
                  `}>
                    {currentStep > item.step ? <Check className="w-4 h-4" /> : item.step}
                  </div>
                  <span className="hidden sm:block font-medium">{item.label}</span>
                </div>
                {index < 2 && (
                  <div className={`w-8 sm:w-16 h-0.5 mx-2 ${currentStep > item.step ? 'bg-green-500' : 'bg-slate-200'}`} />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Forms */}
          <div className="lg:col-span-2 space-y-6">
            {/* Step 1: Traveler Info */}
            {currentStep === 1 && (
              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <h2 className="text-xl font-bold text-slate-800 mb-2">Yolcu Bilgileri</h2>
                <p className="text-slate-500 mb-6">Lütfen tüm yolcuların bilgilerini eksiksiz doldurun</p>
                
                <div className="space-y-4">
                  {travelers.map((traveler, index) => (
                    <TravelerCard
                      key={traveler.id}
                      traveler={traveler}
                      index={index}
                      isExpanded={expandedTraveler === index}
                      onToggle={() => setExpandedTraveler(expandedTraveler === index ? -1 : index)}
                      onChange={(field, value) => handleTravelerChange(index, field, value)}
                      isFirstAdult={index === 0 && traveler.type === 'adult'}
                      isValid={isTravelerValid(traveler, index === 0 && traveler.type === 'adult')}
                    />
                  ))}
                </div>

                {/* Continue Button */}
                <button
                  onClick={handleContinue}
                  disabled={!allTravelersValid || loading}
                  className={`
                    w-full mt-6 py-4 rounded-xl font-semibold text-white flex items-center justify-center gap-2 transition-all
                    ${allTravelersValid && !loading
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700'
                      : 'bg-slate-300 cursor-not-allowed'
                    }
                  `}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>İşleniyor...</span>
                    </>
                  ) : (
                    <>
                      <span>Devam Et</span>
                      <ChevronRight className="w-5 h-5" />
                    </>
                  )}
                </button>

                {error && (
                  <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                    <div className="text-red-700">{error}</div>
                  </div>
                )}
              </div>
            )}

            {/* Step 2: Summary */}
            {currentStep === 2 && (
              <div className="space-y-6">
                {/* Yolcu Özeti */}
                <div className="bg-white rounded-xl border border-slate-200 p-6">
                  <h2 className="text-xl font-bold text-slate-800 mb-4">Yolcu Özeti</h2>
                  <div className="space-y-3">
                    {travelers.map((t, i) => (
                      <div key={t.id} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <User className="w-4 h-4 text-blue-600" />
                          </div>
                          <div>
                            <div className="font-medium text-slate-800">{t.firstName} {t.lastName}</div>
                            <div className="text-sm text-slate-500">{t.type === 'adult' ? 'Yetişkin' : 'Çocuk'}</div>
                          </div>
                        </div>
                        <Check className="w-5 h-5 text-green-500" />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Kampanya Kodu */}
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

                {/* Terms Checkbox - EKLENEN */}
                <TermsCheckbox
                  checked={termsAccepted}
                  onChange={setTermsAccepted}
                  journey={journey}
                />

                {/* Payment Button */}
                <button
                  onClick={handlePayment}
                  disabled={loading || !termsAccepted}
                  className={`
                    w-full py-4 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all
                    ${termsAccepted && !loading
                      ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    }
                  `}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Ödeme İşleniyor...</span>
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-5 h-5" />
                      <span>Ödemeye Geç</span>
                    </>
                  )}
                </button>

                {!termsAccepted && (
                  <p className="text-center text-sm text-amber-600">
                    Devam etmek için koşulları kabul etmeniz gerekmektedir
                  </p>
                )}
              </div>
            )}

            {/* Step 3: Success - YENİ GELİŞMİŞ EKRAN */}
            {currentStep === 3 && (
              <BookingSuccess
                bookingRef={bookingRef || 'ET-XXXXXX'}
                journey={journey}
                travelers={travelers}
                passengers={passengers}
              />
            )}
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-4">
            {/* Journey Summary Card */}
            <div className="bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl p-5 text-white">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Train className="w-5 h-5" />
                  <span className="font-semibold">{journey.operatorName || journey.operator}</span>
                  <span className="text-blue-200 text-sm">{journey.trainNumber}</span>
                </div>
                <div className={`px-2.5 py-1 rounded-full text-xs font-bold ${comfortConfig.bgColor} ${comfortConfig.color}`}>
                  {comfortConfig.icon} {comfortConfig.labelTr}
                </div>
              </div>

              {/* Route */}
              <div className="flex items-center justify-between mb-4">
                <div className="text-center">
                  <div className="text-2xl font-bold">{formatTime(journey.departure)}</div>
                  <div className="text-blue-200 text-sm">{journey.origin.city}</div>
                </div>
                <div className="flex flex-col items-center flex-1 mx-4">
                  <div className="w-full flex items-center">
                    <div className="w-2 h-2 rounded-full bg-white" />
                    <div className="flex-1 h-0.5 bg-blue-400" />
                    <div className="w-2 h-2 rounded-full bg-blue-300" />
                  </div>
                  <span className="text-blue-200 text-xs mt-1">{formatDuration(journey.durationMinutes)}</span>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{formatTime(journey.arrival)}</div>
                  <div className="text-blue-200 text-sm">{journey.destination.city}</div>
                </div>
              </div>

              {/* Date */}
              <div className="text-center text-blue-100 text-sm">
                {formatDateDisplay(journey.departure)}
              </div>

              {/* Quick Conditions */}
              <div className="flex items-center justify-center gap-4 mt-4 pt-4 border-t border-blue-500/30">
                <div className="flex items-center gap-1 text-sm">
                  {journey.isExchangeable ? (
                    <Check className="w-4 h-4 text-green-300" />
                  ) : (
                    <X className="w-4 h-4 text-red-300" />
                  )}
                  <span className="text-blue-100">Değiştirilebilir</span>
                </div>
                <div className="flex items-center gap-1 text-sm">
                  {journey.isRefundable ? (
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
                journey={journey} 
                passengers={passengers}
                promoDiscount={promoDiscount}
              />
            </div>

            {/* Ticket Conditions - Detailed */}
            <TicketConditions journey={journey} />

            {/* Yolcu Sayısı */}
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <div className="flex items-center gap-3 text-slate-600">
                <User className="w-5 h-5" />
                <span>
                  {passengers.adults} Yetişkin
                  {passengers.children > 0 && `, ${passengers.children} Çocuk`}
                </span>
              </div>
            </div>

            {/* Trust Badge */}
            <div className="flex items-center gap-2 text-slate-500 text-sm justify-center">
              <Shield className="w-4 h-4 text-green-500" />
              <span>256-bit SSL ile güvenli ödeme</span>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
