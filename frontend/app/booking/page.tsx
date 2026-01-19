'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Train, ArrowLeft, User, Mail, Tag, CreditCard,
  Clock, ArrowRight, CheckCircle, Loader2, AlertCircle
} from 'lucide-react';
import { Journey, createBooking, validateCampaign, calculatePrice } from '@/lib/api/client';

function BookingContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const journeyId = searchParams.get('journeyId');

  // Form state
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [promoCode, setPromoCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [bookingId, setBookingId] = useState<number | null>(null);

  // Journey and pricing state
  const [journey, setJourney] = useState<Journey | null>(null);
  const [passengers, setPassengers] = useState({ adults: 1, children: 0 });
  const [priceBreakdown, setPriceBreakdown] = useState<{
    basePrice: number;
    serviceFee: number;
    subtotal: number;
    discount: number;
    campaignApplied: string | null;
    finalPrice: number;
  } | null>(null);

  // Promo code state
  const [isValidatingPromo, setIsValidatingPromo] = useState(false);
  const [promoValid, setPromoValid] = useState<boolean | null>(null);
  const [promoMessage, setPromoMessage] = useState('');

  // Load journey from sessionStorage
  useEffect(() => {
    const storedJourney = sessionStorage.getItem('selectedJourney');
    const storedPassengers = sessionStorage.getItem('passengers');
    
    if (storedJourney) {
      const parsedJourney = JSON.parse(storedJourney);
      setJourney(parsedJourney);
      
      if (storedPassengers) {
        setPassengers(JSON.parse(storedPassengers));
      }

      // Calculate initial price
      const totalPassengers = storedPassengers 
        ? JSON.parse(storedPassengers).adults + JSON.parse(storedPassengers).children
        : 1;
      const basePrice = parsedJourney.price?.amount || 0;
      const totalBasePrice = basePrice * totalPassengers;
      const serviceFee = totalBasePrice * 0.05;
      const subtotal = totalBasePrice + serviceFee;
      
      setPriceBreakdown({
        basePrice: totalBasePrice,
        serviceFee: serviceFee,
        subtotal: subtotal,
        discount: 0,
        campaignApplied: null,
        finalPrice: subtotal,
      });
    }
  }, []);

  // Validate promo code
  const handleValidatePromo = async () => {
    if (!promoCode.trim()) return;
    
    setIsValidatingPromo(true);
    setPromoValid(null);
    setPromoMessage('');
    
    try {
      const result = await validateCampaign(promoCode);
      setPromoValid(result.valid);
      
      if (result.valid && result.campaign && priceBreakdown) {
        // Apply discount
        let discountAmount = 0;
        if (result.campaign.discountType === 'PERCENTAGE') {
          discountAmount = (priceBreakdown.subtotal * result.campaign.discountValue) / 100;
        } else {
          discountAmount = result.campaign.discountValue;
        }
        
        setPriceBreakdown({
          ...priceBreakdown,
          discount: discountAmount,
          campaignApplied: result.campaign.name,
          finalPrice: priceBreakdown.subtotal - discountAmount,
        });
        setPromoMessage(`${result.campaign.name} uygulandı!`);
      } else {
        setPromoMessage(result.message || 'Geçersiz kampanya kodu');
      }
    } catch (err) {
      setPromoValid(false);
      setPromoMessage('Kampanya kodu doğrulanamadı');
    } finally {
      setIsValidatingPromo(false);
    }
  };

  // Extract date from ISO string (YYYY-MM-DD format)
  const extractDate = (isoString: string) => {
    if (!isoString) return undefined;
    try {
      const date = new Date(isoString);
      return date.toISOString().split('T')[0]; // Returns YYYY-MM-DD
    } catch {
      return undefined;
    }
  };

  // Extract time from ISO string (HH:MM:SS format)
  const extractTime = (isoString: string) => {
    if (!isoString) return undefined;
    try {
      const date = new Date(isoString);
      return date.toTimeString().split(' ')[0]; // Returns HH:MM:SS
    } catch {
      return undefined;
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!journey || !priceBreakdown) return;
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      const booking = await createBooking({
        customerName,
        customerEmail,
        fromStation: journey.origin?.name || journey.origin?.city || 'Unknown',
        toStation: journey.destination?.name || journey.destination?.city || 'Unknown',
        price: journey.price?.amount ? journey.price.amount * (passengers.adults + passengers.children) : 0,
        promoCode: promoValid ? promoCode : undefined,
        journeyId: journey.id,
        passengers,
        // YENİ: Seyahat bilgilerini gönder
        departure_date: extractDate(journey.departure),
        departure_time: extractTime(journey.departure),
        arrival_time: extractTime(journey.arrival),
        train_number: journey.trainNumber,
        operator: journey.operator,
      });
      
      setSuccess(true);
      setBookingId(booking.id);
      
      // Clear sessionStorage
      sessionStorage.removeItem('selectedJourney');
      sessionStorage.removeItem('passengers');
    } catch (err) {
      setError('Rezervasyon oluşturulurken bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Format time
  const formatTime = (isoString: string) => {
    if (!isoString) return '--:--';
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString('tr-TR', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      });
    } catch {
      return '--:--';
    }
  };

  // Format date
  const formatDate = (isoString: string) => {
    if (!isoString) return '';
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString('tr-TR', { 
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    } catch {
      return '';
    }
  };

  // No journey selected
  if (!journey) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-slate-900 mb-2">Sefer Seçilmedi</h2>
          <p className="text-slate-600 mb-6">Lütfen önce bir sefer seçin.</p>
          <Link
            href="/"
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors inline-block"
          >
            Ana Sayfaya Dön
          </Link>
        </div>
      </main>
    );
  }

  // Success state
  if (success) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-8 h-8 text-emerald-500" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">
            Rezervasyon Tamamlandı!
          </h2>
          <p className="text-slate-600 mb-6">
            Rezervasyon numaranız: <strong>#{bookingId}</strong>
            <br />
            Bilet detayları e-posta adresinize gönderilecektir.
          </p>
          
          <div className="bg-slate-50 rounded-xl p-4 mb-6 text-left">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-600">{journey.origin?.city || 'Kalkış'}</span>
              <ArrowRight className="w-4 h-4 text-slate-400" />
              <span className="text-slate-600">{journey.destination?.city || 'Varış'}</span>
            </div>
            <div className="text-sm text-slate-500">
              {formatDate(journey.departure)} • {formatTime(journey.departure)}
            </div>
          </div>
          
          <Link
            href="/"
            className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors inline-block"
          >
            Ana Sayfaya Dön
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <Train className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-slate-900">EuroTrain</span>
            </Link>
            
            <button 
              onClick={() => router.back()}
              className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Geri</span>
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Booking Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-6">
                Yolcu Bilgileri
              </h2>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Customer Name */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Ad Soyad
                  </label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      required
                      placeholder="John Doe"
                      className="w-full pl-12 pr-4 py-3 border border-slate-200 rounded-xl
                                 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Customer Email */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    E-posta Adresi
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="email"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      required
                      placeholder="john@example.com"
                      className="w-full pl-12 pr-4 py-3 border border-slate-200 rounded-xl
                                 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Promo Code */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Kampanya Kodu (Opsiyonel)
                  </label>
                  <div className="flex gap-3">
                    <div className="relative flex-1">
                      <Tag className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input
                        type="text"
                        value={promoCode}
                        onChange={(e) => {
                          setPromoCode(e.target.value.toUpperCase());
                          setPromoValid(null);
                          setPromoMessage('');
                        }}
                        placeholder="YILBASI20"
                        className="w-full pl-12 pr-4 py-3 border border-slate-200 rounded-xl
                                   focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleValidatePromo}
                      disabled={!promoCode.trim() || isValidatingPromo}
                      className="px-6 py-3 border border-slate-200 rounded-xl text-slate-700
                                 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed
                                 transition-colors"
                    >
                      {isValidatingPromo ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        'Uygula'
                      )}
                    </button>
                  </div>
                  {promoMessage && (
                    <p className={`mt-2 text-sm ${promoValid ? 'text-emerald-600' : 'text-red-600'}`}>
                      {promoMessage}
                    </p>
                  )}
                </div>

                {/* Error Message */}
                {error && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
                    {error}
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting || !customerName || !customerEmail}
                  className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white 
                             font-semibold rounded-xl hover:from-blue-700 hover:to-indigo-700
                             disabled:opacity-50 disabled:cursor-not-allowed
                             transition-all duration-200 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>İşleniyor...</span>
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-5 h-5" />
                      <span>Ödemeye Geç</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sticky top-24">
              <h3 className="text-lg font-bold text-slate-900 mb-4">
                Rezervasyon Özeti
              </h3>
              
              {/* Journey Info */}
              <div className="bg-slate-50 rounded-xl p-4 mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-sm font-medium">
                    {journey.trainType || 'Tren'}
                  </span>
                  <span className="text-sm text-slate-500">{journey.trainNumber || ''}</span>
                </div>
                
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <div className="font-semibold text-slate-900">
                      {formatTime(journey.departure)}
                    </div>
                    <div className="text-sm text-slate-600">{journey.origin?.city || 'Kalkış'}</div>
                  </div>
                  <div className="flex flex-col items-center px-4">
                    <Clock className="w-4 h-4 text-slate-400 mb-1" />
                    <span className="text-xs text-slate-500">{journey.duration || '-'}</span>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-slate-900">
                      {formatTime(journey.arrival)}
                    </div>
                    <div className="text-sm text-slate-600">{journey.destination?.city || 'Varış'}</div>
                  </div>
                </div>
                
                <div className="text-sm text-slate-500 border-t border-slate-200 pt-2 mt-2">
                  {formatDate(journey.departure)}
                </div>
              </div>

              {/* Price Breakdown */}
              {priceBreakdown && (
                <div className="space-y-3">
                  <div className="flex justify-between text-slate-600">
                    <span>Bilet Ücreti</span>
                    <span>€{priceBreakdown.basePrice?.toFixed(2) || '0.00'}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Hizmet Bedeli</span>
                    <span>€{priceBreakdown.serviceFee?.toFixed(2) || '0.00'}</span>
                  </div>
                  {priceBreakdown.discount > 0 && (
                    <div className="flex justify-between text-emerald-600">
                      <span>İndirim ({priceBreakdown.campaignApplied})</span>
                      <span>-€{priceBreakdown.discount?.toFixed(2) || '0.00'}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-lg font-bold text-slate-900 border-t border-slate-200 pt-3">
                    <span>Toplam</span>
                    <span>€{priceBreakdown.finalPrice?.toFixed(2) || '0.00'}</span>
                  </div>
                  
                  <div className="text-sm text-slate-500">
                    {passengers.adults} Yetişkin
                    {passengers.children > 0 && `, ${passengers.children} Çocuk`}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function BookingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
      </div>
    }>
      <BookingContent />
    </Suspense>
  );
}