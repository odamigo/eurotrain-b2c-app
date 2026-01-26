'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
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
  Check,
  X,
  Ticket,
  Download,
  CalendarPlus,
  Share2,
  Copy,
  ExternalLink,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';

import {
  getSession,
  updateTravelers,
  applyPromoCode,
  SessionData,
  TravelerData,
  getComfortConfig,
  getOperatorName,
  isInternationalRoute,
  formatPrice,
  formatTime,
  formatDate,
  formatRemainingTime,
} from '@/lib/api/mcp-client';

// ============================================================
// CONSTANTS
// ============================================================

const TITLE_OPTIONS = [
  { value: 'MR', label: 'Bay' },
  { value: 'MS', label: 'Bayan' },
];

// ============================================================
// TYPES
// ============================================================

interface TravelerForm {
  id: string;
  title: 'MR' | 'MS';
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  type: 'adult' | 'child';
  passportNumber: string;
  passportExpiry: string;
  passportCountry: string;
}

interface BookingResult {
  booking_reference: string;
  pnr: string;
  journey: {
    origin: string;
    destination: string;
    departure: string;
    arrival: string;
    date: string;
    operator: string;
    train_number: string;
  };
  passengers: TravelerForm[];
  total_paid: number;
  currency: string;
}

// ============================================================
// HELPER FUNCTIONS
// ============================================================

function generateId(): string {
  return `trav_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function createEmptyTraveler(type: 'adult' | 'child', index: number): TravelerForm {
  return {
    id: generateId(),
    title: 'MR',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    type,
    passportNumber: '',
    passportExpiry: '',
    passportCountry: '',
  };
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

            <div className="hidden sm:block" />

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

            {/* Email (only for lead traveler) */}
            {isLeadTraveler && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  E-posta <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={traveler.email}
                  onChange={(e) => onChange('email', e.target.value)}
                  placeholder="ornek@email.com"
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}

            {/* Phone (only for lead traveler) */}
            {isLeadTraveler && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Telefon <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  value={traveler.phone}
                  onChange={(e) => onChange('phone', e.target.value)}
                  placeholder="+90 5XX XXX XX XX"
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}

            {/* Date of Birth */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Doğum Tarihi {traveler.type === 'child' && <span className="text-red-500">*</span>}
              </label>
              <input
                type="date"
                value={traveler.dateOfBirth}
                onChange={(e) => onChange('dateOfBirth', e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Passport Fields (for international routes) */}
            {requiresPassport && (
              <>
                <div className="col-span-2 mt-2">
                  <div className="text-sm font-medium text-amber-700 bg-amber-50 p-3 rounded-lg">
                    ⚠️ Bu uluslararası bir seferdir. Kimlik bilgileri zorunludur.
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Pasaport/Kimlik No <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={traveler.passportNumber}
                    onChange={(e) => onChange('passportNumber', e.target.value)}
                    placeholder="Pasaport veya TC Kimlik No"
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Geçerlilik Tarihi <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={traveler.passportExpiry}
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
                    value={traveler.passportCountry}
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
// PRICE BREAKDOWN COMPONENT
// ============================================================

function PriceBreakdown({
  basePrice,
  passengerCount,
  serviceFee,
  promoDiscount,
  currency,
}: {
  basePrice: number;
  passengerCount: number;
  serviceFee: number;
  promoDiscount: number;
  currency: string;
}) {
  const ticketTotal = basePrice * passengerCount;
  const finalTotal = ticketTotal + serviceFee - promoDiscount;

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-slate-600">
        <span>Bilet ({passengerCount} yolcu × {formatPrice(basePrice, currency)})</span>
        <span>{formatPrice(ticketTotal, currency)}</span>
      </div>
      <div className="flex justify-between text-slate-600">
        <span>Hizmet Bedeli</span>
        <span>{formatPrice(serviceFee, currency)}</span>
      </div>
      {promoDiscount > 0 && (
        <div className="flex justify-between text-green-600">
          <span>İndirim</span>
          <span>-{formatPrice(promoDiscount, currency)}</span>
        </div>
      )}
      <div className="border-t pt-2 mt-2">
        <div className="flex justify-between font-bold text-lg text-slate-800">
          <span>Toplam</span>
          <span>{formatPrice(finalTotal, currency)}</span>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// SUCCESS SCREEN COMPONENT
// ============================================================

function SuccessScreen({ booking, onDownloadPdf, onAddToCalendar }: {
  booking: BookingResult;
  onDownloadPdf: () => void;
  onAddToCalendar: () => void;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopyReference = () => {
    navigator.clipboard.writeText(booking.booking_reference);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-500 to-emerald-600">
      {/* Success Header */}
      <div className="pt-12 pb-8 px-4 text-center text-white">
        <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-12 h-12" />
        </div>
        <h1 className="text-3xl font-bold mb-2">Rezervasyon Tamamlandı!</h1>
        <p className="text-green-100">E-biletiniz e-posta adresinize gönderildi.</p>
      </div>

      {/* Booking Details Card */}
      <div className="max-w-2xl mx-auto px-4 pb-8">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Reference Number */}
          <div className="bg-slate-50 p-4 border-b">
            <div className="text-sm text-slate-500 mb-1">Rezervasyon Numarası</div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-slate-800 font-mono">
                {booking.booking_reference}
              </span>
              <button
                onClick={handleCopyReference}
                className="p-1.5 hover:bg-slate-200 rounded transition-colors"
                title="Kopyala"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-green-600" />
                ) : (
                  <Copy className="w-4 h-4 text-slate-400" />
                )}
              </button>
            </div>
            {booking.pnr && (
              <div className="text-sm text-slate-500 mt-1">PNR: {booking.pnr}</div>
            )}
          </div>

          {/* Journey Details */}
          <div className="p-6">
            <div className="flex items-center gap-2 text-slate-500 text-sm mb-4">
              <Train className="w-4 h-4" />
              <span>{booking.journey.operator}</span>
              <span className="text-slate-300">•</span>
              <span>{booking.journey.train_number}</span>
            </div>

            <div className="flex items-center justify-between mb-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-slate-800">{formatTime(booking.journey.departure)}</div>
                <div className="text-slate-600">{booking.journey.origin}</div>
              </div>
              <div className="flex-1 flex flex-col items-center mx-4">
                <ArrowRight className="w-6 h-6 text-slate-400" />
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-slate-800">{formatTime(booking.journey.arrival)}</div>
                <div className="text-slate-600">{booking.journey.destination}</div>
              </div>
            </div>

            <div className="text-center text-slate-500">
              <Calendar className="w-4 h-4 inline mr-1" />
              {formatDate(booking.journey.date)}
            </div>
          </div>

          {/* Passengers */}
          <div className="border-t p-4">
            <div className="text-sm font-medium text-slate-700 mb-2">Yolcular</div>
            <div className="space-y-1">
              {booking.passengers.map((p, i) => (
                <div key={i} className="text-sm text-slate-600">
                  {p.title === 'MR' ? 'Bay' : 'Bayan'} {p.firstName} {p.lastName}
                </div>
              ))}
            </div>
          </div>

          {/* Total Paid */}
          <div className="border-t bg-slate-50 p-4">
            <div className="flex justify-between items-center">
              <span className="text-slate-600">Ödenen Tutar</span>
              <span className="text-2xl font-bold text-green-600">
                {formatPrice(booking.total_paid, booking.currency)}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="p-4 grid grid-cols-2 gap-3">
            <button
              onClick={onDownloadPdf}
              className="flex items-center justify-center gap-2 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
            >
              <Download className="w-5 h-5" />
              PDF İndir
            </button>
            <button
              onClick={onAddToCalendar}
              className="flex items-center justify-center gap-2 py-3 bg-slate-100 text-slate-700 rounded-xl font-medium hover:bg-slate-200 transition-colors"
            >
              <CalendarPlus className="w-5 h-5" />
              Takvime Ekle
            </button>
          </div>

          {/* Links */}
          <div className="p-4 pt-0 flex justify-center gap-6 text-sm">
            <Link href="/my-trips" className="text-blue-600 hover:underline flex items-center gap-1">
              <Ticket className="w-4 h-4" />
              Biletlerim
            </Link>
            <Link href="/" className="text-blue-600 hover:underline flex items-center gap-1">
              <ExternalLink className="w-4 h-4" />
              Yeni Arama
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// MAIN CHECKOUT PAGE
// ============================================================

export default function SessionCheckoutPage() {
  const params = useParams();
  const router = useRouter();
  const sessionToken = params.session as string;

  // State
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [session, setSession] = useState<SessionData | null>(null);
  const [travelers, setTravelers] = useState<TravelerForm[]>([]);
  const [expandedTraveler, setExpandedTraveler] = useState(0);
  const [promoCode, setPromoCode] = useState('');
  const [promoDiscount, setPromoDiscount] = useState(0);
  const [promoError, setPromoError] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [bookingComplete, setBookingComplete] = useState(false);
  const [bookingResult, setBookingResult] = useState<BookingResult | null>(null);
  const [remainingTime, setRemainingTime] = useState(0);
  
  // Timer ref
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Load session
  useEffect(() => {
    async function loadSession() {
      if (!sessionToken) {
        setError('Geçersiz oturum');
        setLoading(false);
        return;
      }

      try {
        const data = await getSession(sessionToken);
        setSession(data);
        setRemainingTime(data.remaining_seconds);

        // Initialize travelers
        const totalPassengers = data.passengers.adults + data.passengers.children;
        const initialTravelers: TravelerForm[] = [];
        
        for (let i = 0; i < data.passengers.adults; i++) {
          initialTravelers.push(createEmptyTraveler('adult', i));
        }
        for (let i = 0; i < data.passengers.children; i++) {
          initialTravelers.push(createEmptyTraveler('child', data.passengers.adults + i));
        }

        // If session already has travelers, restore them
        if (data.travelers && data.travelers.length > 0) {
          data.travelers.forEach((t, i) => {
            if (initialTravelers[i]) {
              initialTravelers[i] = {
                ...initialTravelers[i],
                title: t.title,
                firstName: t.first_name,
                lastName: t.last_name,
                email: t.email || '',
                phone: t.phone || '',
                dateOfBirth: t.date_of_birth || '',
                passportNumber: t.passport_number || '',
                passportExpiry: t.passport_expiry || '',
                passportCountry: t.passport_country || '',
              };
            }
          });
        }

        setTravelers(initialTravelers);
        setPromoDiscount(data.pricing.promo_discount || 0);

      } catch (err: any) {
        if (err.message === 'SESSION_NOT_FOUND') {
          setError('Oturum bulunamadı veya süresi dolmuş. Lütfen yeni bir arama yapın.');
        } else {
          setError('Bir hata oluştu. Lütfen tekrar deneyin.');
        }
      } finally {
        setLoading(false);
      }
    }

    loadSession();
  }, [sessionToken]);

  // Countdown timer
  useEffect(() => {
    if (remainingTime <= 0 || bookingComplete) return;

    timerRef.current = setInterval(() => {
      setRemainingTime(prev => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [remainingTime, bookingComplete]);

  // Validation
  const requiresPassport = session ? isInternationalRoute(session.journey.operator) : false;

  const isTravelerValid = useCallback((t: TravelerForm, isLead: boolean): boolean => {
    if (!t.firstName || !t.lastName) return false;
    if (isLead && (!t.email || !t.phone)) return false;
    if (t.type === 'child' && !t.dateOfBirth) return false;
    if (requiresPassport && (!t.passportNumber || !t.passportExpiry || !t.passportCountry)) return false;
    return true;
  }, [requiresPassport]);

  const allTravelersValid = travelers.every((t, i) => 
    isTravelerValid(t, i === 0 && t.type === 'adult')
  );

  // Handlers
  const handleTravelerChange = (index: number, field: keyof TravelerForm, value: string) => {
    setTravelers(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleApplyPromo = async () => {
    if (!promoCode.trim() || !session) return;

    try {
      setPromoError('');
      const result = await applyPromoCode(sessionToken, promoCode);
      setPromoDiscount(result.discount);
      setSession(prev => prev ? {
        ...prev,
        pricing: { ...prev.pricing, total_price: result.new_total, promo_discount: result.discount }
      } : null);
    } catch (err: any) {
      if (err.message === 'INVALID_PROMO') {
        setPromoError('Geçersiz kampanya kodu');
      } else {
        setPromoError('Kod uygulanamadı');
      }
    }
  };

  const handlePayment = async () => {
    if (!session || !allTravelersValid || !termsAccepted || processingPayment) return;

    setProcessingPayment(true);
    setError(null);

    try {
      // 1. Update travelers in session
      const travelerData: TravelerData[] = travelers.map(t => ({
        title: t.title,
        first_name: t.firstName,
        last_name: t.lastName,
        email: t.email || undefined,
        phone: t.phone || undefined,
        date_of_birth: t.dateOfBirth || undefined,
        type: t.type,
        passport_number: t.passportNumber || undefined,
        passport_expiry: t.passportExpiry || undefined,
        passport_country: t.passportCountry || undefined,
      }));

      await updateTravelers(sessionToken, travelerData);

      // 2. Simulate payment (in production, redirect to Payten)
      await new Promise(resolve => setTimeout(resolve, 2000));

      // 3. Set booking result (mock)
      const result: BookingResult = {
        booking_reference: `ET-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
        pnr: `PNR${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
        journey: {
          origin: session.journey.origin,
          destination: session.journey.destination,
          departure: session.journey.departure,
          arrival: session.journey.arrival,
          date: session.journey.departure,
          operator: session.journey.operator,
          train_number: session.journey.train_number,
        },
        passengers: travelers,
        total_paid: session.pricing.total_price,
        currency: session.pricing.currency,
      };

      setBookingResult(result);
      setBookingComplete(true);

    } catch (err: any) {
      setError('Ödeme işlemi başarısız oldu. Lütfen tekrar deneyin.');
    } finally {
      setProcessingPayment(false);
    }
  };

  const handleDownloadPdf = () => {
    // TODO: Implement actual PDF download
    alert('PDF indirme özelliği yakında eklenecek');
  };

  const handleAddToCalendar = () => {
    if (!bookingResult) return;

    const startDate = new Date(bookingResult.journey.departure);
    const endDate = new Date(bookingResult.journey.arrival);

    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
DTSTART:${startDate.toISOString().replace(/[-:]/g, '').split('.')[0]}Z
DTEND:${endDate.toISOString().replace(/[-:]/g, '').split('.')[0]}Z
SUMMARY:Tren Yolculuğu - ${bookingResult.journey.origin} → ${bookingResult.journey.destination}
DESCRIPTION:${bookingResult.journey.operator} ${bookingResult.journey.train_number}\\nRezervasyon: ${bookingResult.booking_reference}
LOCATION:${bookingResult.journey.origin}
END:VEVENT
END:VCALENDAR`;

    const blob = new Blob([icsContent], { type: 'text/calendar' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `eurotrain-${bookingResult.booking_reference}.ics`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-slate-600">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-xl font-bold text-slate-800 mb-2">Oturum Hatası</h1>
          <p className="text-slate-600 mb-6">{error || 'Oturum bulunamadı'}</p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
          >
            <RefreshCw className="w-5 h-5" />
            Yeni Arama Yap
          </Link>
        </div>
      </div>
    );
  }

  // Session expired
  if (remainingTime <= 0 && !bookingComplete) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Timer className="w-8 h-8 text-amber-600" />
          </div>
          <h1 className="text-xl font-bold text-slate-800 mb-2">Süre Doldu</h1>
          <p className="text-slate-600 mb-6">
            Rezervasyon süresi doldu. Lütfen yeni bir arama yapın.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
          >
            <RefreshCw className="w-5 h-5" />
            Yeni Arama Yap
          </Link>
        </div>
      </div>
    );
  }

  // Success state
  if (bookingComplete && bookingResult) {
    return (
      <SuccessScreen
        booking={bookingResult}
        onDownloadPdf={handleDownloadPdf}
        onAddToCalendar={handleAddToCalendar}
      />
    );
  }

  // Main checkout form
  const comfortConfig = getComfortConfig(session.journey.comfort_class);
  const passengerCount = session.passengers.adults + session.passengers.children;
  const finalTotal = session.pricing.total_price;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-blue-600">
            🚂 EuroTrain
          </Link>
          
          {/* Timer */}
          <div className={`
            flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium
            ${remainingTime < 300 ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}
          `}>
            <Timer className="w-4 h-4" />
            <span>Kalan Süre: {formatRemainingTime(remainingTime)}</span>
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
              {promoError && (
                <div className="mt-2 text-red-600 text-sm">{promoError}</div>
              )}
            </div>

            {/* Terms */}
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 mt-0.5"
                />
                <span className="text-sm text-slate-600">
                  <Link href="/terms" className="text-blue-600 hover:underline">Satış Koşulları</Link>,{' '}
                  <Link href="/privacy" className="text-blue-600 hover:underline">Gizlilik Politikası</Link> ve{' '}
                  <Link href="/cancellation" className="text-blue-600 hover:underline">İptal/İade Koşulları</Link>'nı
                  okudum ve kabul ediyorum.
                </span>
              </label>
            </div>

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
              disabled={!termsAccepted || !allTravelersValid || processingPayment}
              className={`
                w-full py-4 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all
                ${termsAccepted && allTravelersValid && !processingPayment
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
              ) : (
                <>
                  <CreditCard className="w-5 h-5" />
                  <span>Ödemeye Geç - {formatPrice(finalTotal, session.pricing.currency)}</span>
                </>
              )}
            </button>

            {!allTravelersValid && (
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
                  <span className="font-semibold">{getOperatorName(session.journey.operator)}</span>
                  <span className="text-blue-200 text-sm">{session.journey.train_number}</span>
                </div>
                <div className={`px-2.5 py-1 rounded-full text-xs font-bold ${comfortConfig.bgColor} ${comfortConfig.color}`}>
                  {comfortConfig.icon} {comfortConfig.labelTr}
                </div>
              </div>

              <div className="flex items-center justify-between mb-4">
                <div className="text-center">
                  <div className="text-2xl font-bold">{formatTime(session.journey.departure)}</div>
                  <div className="text-blue-200 text-sm">{session.journey.origin}</div>
                </div>
                <div className="flex flex-col items-center flex-1 mx-4">
                  <ArrowRight className="w-5 h-5" />
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{formatTime(session.journey.arrival)}</div>
                  <div className="text-blue-200 text-sm">{session.journey.destination}</div>
                </div>
              </div>

              <div className="text-center text-blue-100 text-sm">
                {formatDate(session.journey.departure)}
              </div>
            </div>

            {/* Price Breakdown */}
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <h3 className="font-semibold text-slate-800 mb-4">Fiyat Detayı</h3>
              <PriceBreakdown
                basePrice={session.pricing.base_price}
                passengerCount={passengerCount}
                serviceFee={session.pricing.service_fee}
                promoDiscount={promoDiscount}
                currency={session.pricing.currency}
              />
            </div>

            {/* Passenger Count */}
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <div className="flex items-center gap-3 text-slate-600">
                <User className="w-5 h-5" />
                <span>
                  {session.passengers.adults} Yetişkin
                  {session.passengers.children > 0 && `, ${session.passengers.children} Çocuk`}
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
      </main>
    </div>
  );
}
