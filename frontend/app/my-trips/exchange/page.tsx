'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, AlertCircle, CheckCircle, Loader2, 
  Clock, Info, RefreshCw, Train, Calendar, ArrowRight
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface ExchangeOption {
  offerId: string;
  departureDate: string;
  departureTime: string;
  arrivalTime: string;
  trainNumber: string;
  operator: string;
  price: number;
  priceDifference: number;
  available: boolean;
}

interface ExchangeQuotation {
  id: string;
  bookingId: number;
  newOfferId: string;
  originalPrice: number;
  newPrice: number;
  priceDifference: number;
  exchangeFee: number;
  totalDue: number;
  currency: string;
  expiresAt: string;
  conditions: string[];
}

interface Booking {
  id: number;
  bookingReference: string;
  fromStation: string;
  toStation: string;
  departureDate: string;
  departureTime: string;
  arrivalTime: string;
  trainNumber: string;
  operator: string;
  totalPrice: number;
  currency: string;
  status: string;
}

function ExchangePage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const bookingId = searchParams.get('bookingId');
  const token = searchParams.get('token');

  const [booking, setBooking] = useState<Booking | null>(null);
  const [newDate, setNewDate] = useState('');
  const [options, setOptions] = useState<ExchangeOption[]>([]);
  const [selectedOption, setSelectedOption] = useState<ExchangeOption | null>(null);
  const [quotation, setQuotation] = useState<ExchangeQuotation | null>(null);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<'select-date' | 'select-train' | 'confirm' | 'success'>('select-date');

  // Booking yükle
  useEffect(() => {
    const loadBooking = async () => {
      if (!bookingId || !token) {
        setError('Geçersiz bağlantı');
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`${API_URL}/my-trips/${bookingId}?token=${token}`);
        const data = await res.json();
        
        if (!data.success) {
          throw new Error(data.message || 'Rezervasyon bulunamadı');
        }
        
        setBooking(data.data || data.booking);
        
        // Varsayılan tarih: mevcut tarihten 1 gün sonra
        const currentDate = new Date(data.booking.departureDate);
        currentDate.setDate(currentDate.getDate() + 1);
        setNewDate(currentDate.toISOString().split('T')[0]);
      } catch (err: any) {
        setError(err.message || 'Bir hata oluştu');
      } finally {
        setLoading(false);
      }
    };

    loadBooking();
  }, [bookingId, token]);

  // Sefer ara
  const handleSearchTrains = async () => {
    if (!newDate || !booking) return;

    setSearching(true);
    setError(null);

    try {
      const res = await fetch(`${API_URL}/bookings/${bookingId}/exchange/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newDepartureDate: newDate }),
      });

      const data = await res.json();

      if (data.success) {
        setOptions(data.options);
        setStep('select-train');
      } else {
        throw new Error(data.message || 'Sefer bulunamadı');
      }
    } catch (err: any) {
      setError(err.message || 'Sefer arama sırasında bir hata oluştu');
    } finally {
      setSearching(false);
    }
  };

  // Sefer seç ve teklif al
  const handleSelectOption = async (option: ExchangeOption) => {
    setSelectedOption(option);
    setProcessing(true);
    setError(null);

    try {
      const res = await fetch(`${API_URL}/bookings/${bookingId}/exchange/quotation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newOfferId: option.offerId }),
      });

      const data = await res.json();

      if (data.success) {
        setQuotation(data.quotation);
        setStep('confirm');
      } else {
        throw new Error(data.message || 'Teklif alınamadı');
      }
    } catch (err: any) {
      setError(err.message || 'Teklif alınırken bir hata oluştu');
    } finally {
      setProcessing(false);
    }
  };

  // Değişikliği onayla
  const handleConfirmExchange = async () => {
    if (!quotation || !selectedOption) return;

    setProcessing(true);
    setError(null);

    try {
      const res = await fetch(`${API_URL}/bookings/${bookingId}/exchange/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quotationId: quotation.id,
          newOfferId: selectedOption.offerId,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setStep('success');
      } else {
        throw new Error(data.message || 'Değişiklik işlemi başarısız');
      }
    } catch (err: any) {
      setError(err.message || 'Değişiklik işlemi sırasında bir hata oluştu');
    } finally {
      setProcessing(false);
    }
  };

  // Format helpers
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('tr-TR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (error && !booking) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl border border-red-200 p-8 max-w-md text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-slate-800 mb-2">Hata</h1>
          <p className="text-slate-600 mb-6">{error}</p>
          <Link
            href="/my-trips"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <ArrowLeft className="w-4 h-4" />
            Biletlerime Dön
          </Link>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <Link
            href={`/my-trips?token=${token}`}
            className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-800"
          >
            <ArrowLeft className="w-4 h-4" />
            Biletlerime Dön
          </Link>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Success State */}
        {step === 'success' && (
          <div className="bg-white rounded-xl border border-green-200 overflow-hidden">
            <div className="bg-gradient-to-r from-green-500 to-emerald-500 p-8 text-center text-white">
              <CheckCircle className="w-20 h-20 mx-auto mb-4" />
              <h1 className="text-2xl font-bold mb-2">Değişiklik Tamamlandı!</h1>
              <p className="text-green-100">Biletiniz başarıyla değiştirildi</p>
            </div>
            <div className="p-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex items-center gap-3">
                  <Train className="w-8 h-8 text-blue-600" />
                  <div>
                    <div className="font-semibold text-slate-800">
                      {booking?.fromStation} → {booking?.toStation}
                    </div>
                    <div className="text-slate-600">
                      {selectedOption?.departureDate} • {selectedOption?.departureTime} - {selectedOption?.arrivalTime}
                    </div>
                  </div>
                </div>
              </div>
              <p className="text-slate-600 text-center mb-6">
                Yeni biletiniz e-posta adresinize gönderildi.
              </p>
              <Link
                href={`/my-trips?token=${token}`}
                className="block w-full py-4 bg-blue-600 text-white text-center rounded-xl font-semibold hover:bg-blue-700"
              >
                Biletlerime Dön
              </Link>
            </div>
          </div>
        )}

        {/* Step 1: Select Date */}
        {step === 'select-date' && booking && (
          <>
            <h1 className="text-2xl font-bold text-slate-800 mb-6">Bilet Değişikliği</h1>

            {/* Current Booking */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
              <h2 className="font-semibold text-slate-800 mb-4">Mevcut Rezervasyon</h2>
              <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-lg">
                <Train className="w-10 h-10 text-blue-600" />
                <div className="flex-1">
                  <div className="font-semibold text-slate-800">
                    {booking.fromStation} → {booking.toStation}
                  </div>
                  <div className="text-slate-600">
                    {formatDate(booking.departureDate)} • {booking.departureTime}
                  </div>
                  <div className="text-sm text-slate-500">
                    {booking.trainNumber} • {booking.operator}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-slate-800">€{Number(booking.totalPrice || booking.price).toFixed(2)}</div>
                </div>
              </div>
            </div>

            {/* Select New Date */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
              <h2 className="font-semibold text-slate-800 mb-4">Yeni Tarih Seçin</h2>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Yeni Kalkış Tarihi
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="date"
                      value={newDate}
                      onChange={(e) => setNewDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <button
                  onClick={handleSearchTrains}
                  disabled={searching || !newDate}
                  className={`self-end px-6 py-3 rounded-lg font-semibold flex items-center gap-2 ${
                    searching || !newDate
                      ? 'bg-slate-200 text-slate-400'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {searching ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <RefreshCw className="w-5 h-5" />
                  )}
                  Sefer Ara
                </button>
              </div>
            </div>

            {/* Info */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <Info className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-amber-700">
                  <p className="font-medium mb-1">Değişiklik Koşulları</p>
                  <ul className="space-y-1">
                    <li>• €10 değişiklik ücreti uygulanacaktır.</li>
                    <li>• Fiyat farkı varsa ek ödeme gerekebilir.</li>
                    <li>• Değişiklik işlemi geri alınamaz.</li>
                  </ul>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Step 2: Select Train */}
        {step === 'select-train' && booking && (
          <>
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold text-slate-800">Yeni Sefer Seçin</h1>
              <button
                onClick={() => setStep('select-date')}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Tarihi Değiştir
              </button>
            </div>

            <div className="text-slate-600 mb-4">
              {formatDate(newDate)} • {booking.fromStation} → {booking.toStation}
            </div>

            {/* Options */}
            <div className="space-y-3">
              {options.map((option) => (
                <div
                  key={option.offerId}
                  onClick={() => option.available && handleSelectOption(option)}
                  className={`bg-white rounded-xl border-2 p-4 transition-all ${
                    option.available
                      ? 'border-slate-200 hover:border-blue-400 cursor-pointer'
                      : 'border-slate-100 opacity-50 cursor-not-allowed'
                  } ${selectedOption?.offerId === option.offerId ? 'border-blue-500' : ''}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="text-center">
                        <div className="text-xl font-bold text-slate-800">{option.departureTime}</div>
                        <div className="text-sm text-slate-500">{booking.fromStation}</div>
                      </div>
                      <ArrowRight className="w-5 h-5 text-slate-400" />
                      <div className="text-center">
                        <div className="text-xl font-bold text-slate-800">{option.arrivalTime}</div>
                        <div className="text-sm text-slate-500">{booking.toStation}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold text-slate-800">€{option.price.toFixed(2)}</div>
                      {option.priceDifference !== 0 && (
                        <div className={`text-sm font-medium ${
                          option.priceDifference > 0 ? 'text-red-600' : 'text-green-600'
                        }`}>
                          {option.priceDifference > 0 ? '+' : ''}€{option.priceDifference.toFixed(2)}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="mt-2 text-sm text-slate-500">
                    {option.trainNumber} • {option.operator}
                  </div>
                </div>
              ))}
            </div>

            {processing && (
              <div className="mt-6 text-center">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto" />
                <p className="text-slate-600 mt-2">Teklif alınıyor...</p>
              </div>
            )}
          </>
        )}

        {/* Step 3: Confirm */}
        {step === 'confirm' && booking && quotation && selectedOption && (
          <>
            <h1 className="text-2xl font-bold text-slate-800 mb-6">Değişikliği Onayla</h1>

            {/* Old vs New */}
            <div className="grid md:grid-cols-2 gap-4 mb-6">
              <div className="bg-slate-100 rounded-xl p-4">
                <div className="text-sm text-slate-500 mb-2">Mevcut Bilet</div>
                <div className="font-semibold">{booking.departureDate}</div>
                <div>{booking.departureTime} - {booking.arrivalTime}</div>
                <div className="text-slate-600">{booking.trainNumber}</div>
              </div>
              <div className="bg-blue-50 rounded-xl p-4 border-2 border-blue-200">
                <div className="text-sm text-blue-600 mb-2">Yeni Bilet</div>
                <div className="font-semibold">{selectedOption.departureDate}</div>
                <div>{selectedOption.departureTime} - {selectedOption.arrivalTime}</div>
                <div className="text-slate-600">{selectedOption.trainNumber}</div>
              </div>
            </div>

            {/* Price Summary */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
              <h2 className="font-semibold text-slate-800 mb-4">Ödeme Özeti</h2>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-slate-500">Mevcut Bilet</span>
                  <span>€{quotation.originalPrice.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Yeni Bilet</span>
                  <span>€{quotation.newPrice.toFixed(2)}</span>
                </div>
                {quotation.priceDifference !== 0 && (
                  <div className={`flex justify-between ${
                    quotation.priceDifference > 0 ? 'text-red-600' : 'text-green-600'
                  }`}>
                    <span>Fiyat Farkı</span>
                    <span>{quotation.priceDifference > 0 ? '+' : ''}€{quotation.priceDifference.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-amber-600">
                  <span>Değişiklik Ücreti</span>
                  <span>+€{quotation.exchangeFee.toFixed(2)}</span>
                </div>
                <div className="flex justify-between pt-3 border-t border-slate-200">
                  <span className="font-semibold text-slate-800">Toplam Ödenecek</span>
                  <span className="text-xl font-bold text-blue-600">
                    €{quotation.totalDue.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                <p className="text-red-700">{error}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-4">
              <button
                onClick={() => setStep('select-train')}
                className="flex-1 py-4 bg-slate-100 text-slate-700 rounded-xl font-semibold hover:bg-slate-200"
              >
                Geri
              </button>
              <button
                onClick={handleConfirmExchange}
                disabled={processing}
                className={`flex-1 py-4 rounded-xl font-semibold flex items-center justify-center gap-2 ${
                  processing
                    ? 'bg-slate-200 text-slate-400'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {processing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    İşleniyor...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    Değişikliği Onayla
                  </>
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </main>
  );
}

// Default export with Suspense
export default function ExchangePageWrapper() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
      </div>
    }>
      <ExchangePage />
    </Suspense>
  );
}
