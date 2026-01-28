'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Train, ArrowLeft, User, Check, Loader2, Shield, CreditCard,
  AlertCircle, ChevronRight
} from 'lucide-react';
import {
  createBooking,
  updateTravelers,
  prebookBooking,
  Journey,
} from '@/lib/api/era-client';

// Import extracted components
import { AlertBanner } from '@/components/common';
import {
  TravelerCard,
  TicketingOptionsSelector,
  PriceBreakdown,
  TicketConditions,
  TermsCheckbox,
  JourneySummaryCard,
} from '@/components/booking';

// Import types and constants
import type { Alert } from '@/lib/types/common.types';
import type { TravelerForm } from '@/lib/types/booking.types';
import { COMFORT_CONFIG, PROMO_CODES } from '@/lib/constants/booking.constants';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// ============================================================
// MAIN BOOKING PAGE
// ============================================================

export default function BookingPage() {
  const router = useRouter();

  // Journey state
  const [journey, setJourney] = useState<Journey | null>(null);
  const [returnJourney, setReturnJourney] = useState<Journey | null>(null);
  const [isRoundTrip, setIsRoundTrip] = useState(false);
  const [passengers, setPassengers] = useState({ adults: 1, children: 0 });

  // Traveler state
  const [travelers, setTravelers] = useState<TravelerForm[]>([]);
  const [expandedTraveler, setExpandedTraveler] = useState(0);

  // Booking state
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [bookingRef, setBookingRef] = useState<string | null>(null);
  const [internalBookingId, setInternalBookingId] = useState<number | null>(null);

  // Options state
  const [ticketingOption, setTicketingOption] = useState('eticket');
  const [promoCode, setPromoCode] = useState('');
  const [promoDiscount, setPromoDiscount] = useState(0);
  const [termsAccepted, setTermsAccepted] = useState(false);

  // Alerts
  const [alerts, setAlerts] = useState<Alert[]>([]);

  // Load journey from sessionStorage
  useEffect(() => {
    const tripType = sessionStorage.getItem('tripType');
    const storedPassengers = sessionStorage.getItem('passengers');

    if (tripType === 'roundtrip') {
      const storedOutbound = sessionStorage.getItem('selectedOutbound');
      const storedReturn = sessionStorage.getItem('selectedReturn');
      if (!storedOutbound || !storedReturn) {
        router.push('/');
        return;
      }
      setJourney(JSON.parse(storedOutbound));
      setReturnJourney(JSON.parse(storedReturn));
      setIsRoundTrip(true);
    } else {
      const storedJourney = sessionStorage.getItem('selectedJourney');
      if (!storedJourney) {
        router.push('/');
        return;
      }
      setJourney(JSON.parse(storedJourney));
    }

   if (storedPassengers) {
      const parsed = JSON.parse(storedPassengers);
      setPassengers(parsed);
      initializeTravelers(parsed.adults || 1, parsed.children || 0);
    } else {
      // URL'den passengers al veya varsayılan 1 yetişkin
      const urlParams = new URLSearchParams(window.location.search);
      const passengersFromUrl = parseInt(urlParams.get('passengers') || '1');
      setPassengers({ adults: passengersFromUrl, children: 0 });
      initializeTravelers(passengersFromUrl, 0);
    }

    // Initial alert
    setAlerts([{
      id: 'session-info',
      type: 'info',
      message: 'Fiyatlar 15 dakika süreyle sabitlenir.',
      dismissible: true,
    }]);
  }, [router]);

  // Initialize travelers
  const initializeTravelers = (adults: number, children: number) => {
    const newTravelers: TravelerForm[] = [];
    for (let i = 0; i < adults; i++) {
      newTravelers.push({
        id: `adult-${i}`,
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        dateOfBirth: '',
        type: 'adult',
        seatPreference: 'any',
      });
    }
    for (let i = 0; i < children; i++) {
      newTravelers.push({
        id: `child-${i}`,
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        dateOfBirth: '',
        type: 'child',
        seatPreference: 'any',
      });
    }
    setTravelers(newTravelers);
  };

  // Validation
  const isTravelerValid = (t: TravelerForm, isFirstAdult: boolean) => {
    if (!t.firstName || !t.lastName) return false;
    if (isFirstAdult && (!t.email || !t.phone)) return false;
    if (t.type === 'child' && !t.dateOfBirth) return false;
    return true;
  };

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

  const handleApplyPromo = () => {
    const discount = PROMO_CODES[promoCode.toUpperCase()];
    if (discount) {
      setPromoDiscount(discount);
      addAlert('success', `${discount}€ indirim uygulandı!`);
    } else {
      setPromoDiscount(0);
      addAlert('error', 'Geçersiz kampanya kodu');
    }
  };

  const addAlert = (type: Alert['type'], message: string) => {
    setAlerts(prev => [...prev, {
      id: `alert-${Date.now()}`,
      type,
      message,
      dismissible: true,
    }]);
  };

  const dismissAlert = (id: string) => {
    setAlerts(prev => prev.filter(a => a.id !== id));
  };

  // Calculate total price
  const calculateTotal = () => {
    if (!journey) return 0;
    const journeyPrice = journey.price?.amount || 0;
    const returnPrice = returnJourney?.price?.amount || 0;
    const passengerCount = passengers.adults + passengers.children;
    const subtotal = (journeyPrice + returnPrice) * passengerCount;
    const serviceFee = Math.round(subtotal * 0.05 * 100) / 100; // %5 hizmet bedeli
    return subtotal + serviceFee - promoDiscount;
  };

  const handleContinue = async () => {
    if (!journey || !allTravelersValid) return;
    setLoading(true);
    setError(null);

    try {
      const offerLocations = [journey.offerLocation];
      if (returnJourney) offerLocations.push(returnJourney.offerLocation);

      const booking = await createBooking(offerLocations);
      setBookingId(booking.id);
      setBookingRef(booking.reference ?? null);

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

      await prebookBooking(booking.id);
      
      // Internal booking oluştur (Payten için)
      const leadTraveler = travelers[0];
      const internalBookingRes = await fetch(`${API_URL}/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eraBookingId: booking.id,
          eraReference: booking.reference,
          customerName: `${leadTraveler.firstName} ${leadTraveler.lastName}`,
          customerEmail: leadTraveler.email,
          customerPhone: leadTraveler.phone,
          fromStation: journey.origin?.name || journey.origin?.code || '',
          toStation: journey.destination?.name || journey.destination?.code || '',
          departureDate: journey.departure?.split('T')[0] || '',
          departureTime: journey.departure?.split('T')[1]?.substring(0, 5) || '',
          arrivalTime: journey.arrival?.split('T')[1]?.substring(0, 5) || '',
          trainNumber: journey.trainNumber || 'TGV',
          operator: journey.operator || 'SNCF',
          ticketClass: journey.comfortCategory || 'standard',
          price: calculateTotal(),
          currency: journey.price?.currency || 'EUR',
          adults: passengers.adults,
          children: passengers.children,
          status: 'pending',
        }),
      });

      if (internalBookingRes.ok) {
        const internalBooking = await internalBookingRes.json();
        setInternalBookingId(internalBooking.id);
      }

      setCurrentStep(2);
    } catch (err: any) {
      setError(err.message || 'Rezervasyon oluşturulurken bir hata oluştu');
      addAlert('error', 'Rezervasyon oluşturulamadı. Lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // PAYMENT HANDLER - PAYTEN ENTEGRASYONU
  // ============================================================
  const handlePayment = async () => {
    if (!termsAccepted) {
      addAlert('warning', 'Lütfen koşulları kabul edin');
      return;
    }

    if (!journey) {
      addAlert('error', 'Sefer bilgisi bulunamadı');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const leadTraveler = travelers[0];
      const totalAmount = calculateTotal();
      const currency = journey.price?.currency || 'EUR';
      const orderId = `ET-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

      // Payten ödeme başlat
      const paymentRes = await fetch(`${API_URL}/payment/initiate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          bookingId: internalBookingId || 0,
          amount: totalAmount,
          currency,
          customerEmail: leadTraveler.email,
          customerName: `${leadTraveler.firstName} ${leadTraveler.lastName}`,
        }),
      });

      const paymentData = await paymentRes.json();

      if (paymentData.success && paymentData.redirectUrl) {
        // Payten ödeme sayfasına yönlendir
        window.location.href = paymentData.redirectUrl;
      } else {
        throw new Error(paymentData.message || 'Ödeme başlatılamadı');
      }
    } catch (err: any) {
      setError(err.message || 'Ödeme işlemi başlatılırken bir hata oluştu');
      addAlert('error', err.message || 'Ödeme başlatılamadı');
      setLoading(false);
    }
  };

  // Loading state
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
            <button onClick={() => router.back()} className="flex items-center gap-2 text-slate-600 hover:text-blue-600">
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
              { step: 3, label: 'Tamamlandı' },
            ].map((item, index) => (
              <div key={item.step} className="flex items-center">
                <div className={`flex items-center gap-2 ${currentStep >= item.step ? 'text-blue-600' : 'text-slate-400'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm ${
                    currentStep > item.step ? 'bg-green-500 text-white' :
                    currentStep === item.step ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-500'
                  }`}>
                    {currentStep > item.step ? <Check className="w-4 h-4" /> : item.step}
                  </div>
                  <span className="hidden sm:block font-medium">{item.label}</span>
                </div>
                {index < 2 && <div className={`w-8 sm:w-16 h-0.5 mx-2 ${currentStep > item.step ? 'bg-green-500' : 'bg-slate-200'}`} />}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <AlertBanner alerts={alerts} onDismiss={dismissAlert} />

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Forms */}
          <div className="lg:col-span-2 space-y-6">
            {/* Step 1: Traveler Info */}
            {currentStep === 1 && (
              <>
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

                  <button
                    onClick={handleContinue}
                    disabled={!allTravelersValid || loading}
                    className={`w-full mt-6 py-4 rounded-xl font-semibold text-white flex items-center justify-center gap-2 transition-all ${
                      allTravelersValid && !loading
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700'
                        : 'bg-slate-300 cursor-not-allowed'
                    }`}
                  >
                    {loading ? (
                      <><Loader2 className="w-5 h-5 animate-spin" /><span>İşleniyor...</span></>
                    ) : (
                      <><span>Devam Et</span><ChevronRight className="w-5 h-5" /></>
                    )}
                  </button>

                  {error && (
                    <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                      <div className="text-red-700">{error}</div>
                    </div>
                  )}
                </div>

                <TicketingOptionsSelector value={ticketingOption} onChange={setTicketingOption} />
              </>
            )}

            {/* Step 2: Summary & Payment */}
            {currentStep === 2 && (
              <div className="space-y-6">
                {/* Traveler Summary */}
                <div className="bg-white rounded-xl border border-slate-200 p-6">
                  <h2 className="text-xl font-bold text-slate-800 mb-4">Yolcu Özeti</h2>
                  <div className="space-y-3">
                    {travelers.map((t) => (
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
                    <button onClick={handleApplyPromo} className="px-6 py-2.5 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 font-medium">
                      Uygula
                    </button>
                  </div>
                  {promoDiscount > 0 && (
                    <div className="mt-2 text-green-600 text-sm flex items-center gap-1">
                      <Check className="w-4 h-4" />{promoDiscount}€ indirim uygulandı!
                    </div>
                  )}
                </div>

                <TermsCheckbox checked={termsAccepted} onChange={setTermsAccepted} journey={journey} />

                {error && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                    <div className="text-red-700">{error}</div>
                  </div>
                )}

                <button
                  onClick={handlePayment}
                  disabled={loading || !termsAccepted}
                  className={`w-full py-4 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all ${
                    termsAccepted && !loading
                      ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  {loading ? (
                    <><Loader2 className="w-5 h-5 animate-spin" /><span>Ödeme Sayfasına Yönlendiriliyor...</span></>
                  ) : (
                    <><CreditCard className="w-5 h-5" /><span>Ödemeye Geç - €{calculateTotal().toFixed(2)}</span></>
                  )}
                </button>
              </div>
            )}

            {/* Step 3: Success */}
            {currentStep === 3 && (
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="bg-gradient-to-r from-green-500 to-emerald-500 p-8 text-center text-white">
                  <div className="w-20 h-20 bg-white/20 backdrop-blur rounded-full flex items-center justify-center mx-auto mb-4">
                    <Check className="w-12 h-12 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold mb-2">Rezervasyonunuz Tamamlandı!</h2>
                  <p className="text-green-100">Rezervasyon No: <strong>{bookingRef || 'ET-XXXXXX'}</strong></p>
                </div>
                <div className="p-6">
                  <Link href="/" className="flex items-center justify-center gap-2 w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 font-semibold">
                    <Train className="w-5 h-5" /><span>Ana Sayfaya Dön</span>
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-4">
            {isRoundTrip ? (
              <>
                <JourneySummaryCard journey={journey} label="Gidiş" comfortCategory={journey.comfortCategory} />
                {returnJourney && (
                  <JourneySummaryCard journey={returnJourney} label="Dönüş" comfortCategory={returnJourney.comfortCategory} />
                )}
              </>
            ) : (
              <JourneySummaryCard journey={journey} comfortCategory={journey.comfortCategory} />
            )}

            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <h3 className="font-semibold text-slate-800 mb-4">Fiyat Detayı</h3>
              <PriceBreakdown
                journey={journey}
                returnJourney={returnJourney}
                passengers={passengers}
                promoDiscount={promoDiscount}
                seatReservation={travelers.some(t => t.seatPreference && t.seatPreference !== 'any')}
                showDetails={currentStep >= 2}
              />
            </div>

            <TicketConditions journey={journey} />

            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <div className="flex items-center gap-3 text-slate-600">
                <User className="w-5 h-5" />
                <span>{passengers.adults} Yetişkin{passengers.children > 0 && `, ${passengers.children} Çocuk`}</span>
              </div>
            </div>

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
