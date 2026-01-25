'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { 
  Train, 
  Calendar, 
  Clock, 
  User, 
  Mail, 
  CreditCard, 
  AlertCircle,
  CheckCircle,
  Loader2,
  ArrowRight,
  Shield,
  Timer
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

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
}

interface VerifyResponse {
  valid: boolean;
  booking?: BookingData;
  expiresAt?: string;
  remainingMinutes?: number;
  error?: string;
}

export default function McpCheckoutPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [booking, setBooking] = useState<BookingData | null>(null);
  const [remainingTime, setRemainingTime] = useState<number>(0);
  const [expiresAt, setExpiresAt] = useState<Date | null>(null);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [agreed, setAgreed] = useState(false);

  // Token doğrula ve booking bilgilerini getir
  useEffect(() => {
    if (!token) {
      setError('Geçersiz bağlantı. Lütfen rezervasyon linkini kontrol edin.');
      setLoading(false);
      return;
    }

    async function verifyToken() {
      try {
        const response = await fetch(`${API_URL}/mcp/booking/verify/${token}`);
        const data: VerifyResponse = await response.json();

        if (!data.valid || !data.booking) {
          setError(data.error || 'Rezervasyon bulunamadı veya süresi dolmuş.');
          setLoading(false);
          return;
        }

        setBooking(data.booking);
        
        if (data.expiresAt) {
          setExpiresAt(new Date(data.expiresAt));
        }
        
        if (data.remainingMinutes) {
          setRemainingTime(data.remainingMinutes * 60);
        }

        setLoading(false);
      } catch (err) {
        setError('Sunucuya bağlanılamadı. Lütfen tekrar deneyin.');
        setLoading(false);
      }
    }

    verifyToken();
  }, [token]);

  // Countdown timer
  useEffect(() => {
    if (remainingTime <= 0) return;

    const interval = setInterval(() => {
      setRemainingTime((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setError('Rezervasyon süresi doldu. Lütfen yeni bir rezervasyon oluşturun.');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [remainingTime]);

  // Format remaining time
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Ödeme başlat
  const handlePayment = async () => {
    if (!token || !agreed) return;

    setProcessingPayment(true);

    try {
      const response = await fetch(`${API_URL}/mcp/booking/initiate-payment/${token}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });

      const data = await response.json();

      if (data.success && data.redirectUrl) {
        // Ödeme sayfasına yönlendir
        window.location.href = data.redirectUrl;
      } else {
        setError(data.message || 'Ödeme başlatılamadı. Lütfen tekrar deneyin.');
        setProcessingPayment(false);
      }
    } catch (err) {
      setError('Ödeme işlemi başlatılamadı. Lütfen tekrar deneyin.');
      setProcessingPayment(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Rezervasyon bilgileri yükleniyor...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !booking) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Rezervasyon Hatası</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => router.push('/')}
            className="bg-blue-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-blue-700 transition"
          >
            Ana Sayfaya Dön
          </button>
        </div>
      </div>
    );
  }

  if (!booking) return null;

  const isExpired = remainingTime <= 0;
  const isUrgent = remainingTime > 0 && remainingTime < 300; // 5 dakikadan az

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-full text-sm font-medium mb-4">
            <Shield className="w-4 h-4" />
            Güvenli Ödeme
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Rezervasyonunuzu Tamamlayın</h1>
          <p className="text-gray-600">AI asistan tarafından oluşturuldu</p>
        </div>

        {/* Countdown Timer */}
        {!isExpired && (
          <div className={`mb-6 p-4 rounded-xl flex items-center justify-between ${
            isUrgent ? 'bg-red-50 border border-red-200' : 'bg-amber-50 border border-amber-200'
          }`}>
            <div className="flex items-center gap-3">
              <Timer className={`w-5 h-5 ${isUrgent ? 'text-red-600' : 'text-amber-600'}`} />
              <span className={`font-medium ${isUrgent ? 'text-red-800' : 'text-amber-800'}`}>
                Rezervasyon süresi:
              </span>
            </div>
            <span className={`text-2xl font-mono font-bold ${isUrgent ? 'text-red-600' : 'text-amber-600'}`}>
              {formatTime(remainingTime)}
            </span>
          </div>
        )}

        {/* Booking Details Card */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-6">
          {/* Route Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-200 text-sm mb-1">Kalkış</p>
                <p className="text-2xl font-bold">{booking.fromStation}</p>
              </div>
              <div className="flex flex-col items-center px-4">
                <ArrowRight className="w-6 h-6 mb-1" />
                <span className="text-xs text-blue-200">{booking.operator}</span>
              </div>
              <div className="text-right">
                <p className="text-blue-200 text-sm mb-1">Varış</p>
                <p className="text-2xl font-bold">{booking.toStation}</p>
              </div>
            </div>
          </div>

          {/* Details */}
          <div className="p-6 space-y-4">
            {/* Date & Time */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <Calendar className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">Tarih</p>
                  <p className="font-medium text-gray-900">
                    {booking.departureDate ? new Date(booking.departureDate).toLocaleDateString('tr-TR', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    }) : '-'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <Clock className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">Saat</p>
                  <p className="font-medium text-gray-900">
                    {booking.departureTime} - {booking.arrivalTime}
                  </p>
                </div>
              </div>
            </div>

            {/* Train & Class */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <Train className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">Tren</p>
                  <p className="font-medium text-gray-900">
                    {booking.operator} {booking.trainNumber}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <CreditCard className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">Sınıf</p>
                  <p className="font-medium text-gray-900 capitalize">
                    {booking.ticketClass || 'Standard'}
                  </p>
                </div>
              </div>
            </div>

            {/* Passenger */}
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
              <User className="w-5 h-5 text-gray-400" />
              <div className="flex-1">
                <p className="text-xs text-gray-500">Yolcu</p>
                <p className="font-medium text-gray-900">{booking.customerName}</p>
              </div>
              <div className="flex items-center gap-2 text-gray-500">
                <Mail className="w-4 h-4" />
                <span className="text-sm">{booking.customerEmail}</span>
              </div>
            </div>

            {/* Price */}
            <div className="border-t pt-4 mt-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Toplam Tutar</span>
                <span className="text-3xl font-bold text-gray-900">€{Number(booking.price).toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Terms Checkbox */}
        <div className="bg-white rounded-xl p-4 mb-6 border">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-1 w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-600">
              <a href="/terms" className="text-blue-600 hover:underline">Satış Koşulları</a>,{' '}
              <a href="/privacy" className="text-blue-600 hover:underline">Gizlilik Politikası</a> ve{' '}
              <a href="/cancellation" className="text-blue-600 hover:underline">İptal/İade Koşulları</a>'nı 
              okudum ve kabul ediyorum.
            </span>
          </label>
        </div>

        {/* Error Message */}
        {error && booking && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Payment Button */}
        <button
          onClick={handlePayment}
          disabled={!agreed || processingPayment || isExpired}
          className={`w-full py-4 rounded-xl font-semibold text-lg flex items-center justify-center gap-3 transition ${
            !agreed || processingPayment || isExpired
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-green-600 text-white hover:bg-green-700 shadow-lg hover:shadow-xl'
          }`}
        >
          {processingPayment ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Ödeme sayfasına yönlendiriliyor...
            </>
          ) : isExpired ? (
            <>
              <AlertCircle className="w-5 h-5" />
              Süre Doldu
            </>
          ) : (
            <>
              <CreditCard className="w-5 h-5" />
              Ödemeye Geç - €{Number(booking.price).toFixed(2)}
            </>
          )}
        </button>

        {/* Security Note */}
        <div className="mt-6 flex items-center justify-center gap-2 text-sm text-gray-500">
          <Shield className="w-4 h-4" />
          <span>256-bit SSL şifreleme ile güvenli ödeme</span>
        </div>

        {/* Powered by */}
        <div className="mt-8 text-center">
          <p className="text-xs text-gray-400">
            Bu rezervasyon EuroTrain AI Asistan tarafından oluşturulmuştur.
          </p>
        </div>
      </div>
    </div>
  );
}
