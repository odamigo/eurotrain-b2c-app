'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, AlertCircle, CheckCircle, Loader2, 
  CreditCard, Clock, Info, XCircle
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface RefundQuotation {
  id: string;
  bookingId: number;
  refundableAmount: number;
  refundFee: number;
  netRefundAmount: number;
  currency: string;
  reason?: string;
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
  totalPrice: number;
  currency: string;
  status: string;
}

function RefundPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const bookingId = searchParams.get('bookingId');
  const token = searchParams.get('token');

  const [booking, setBooking] = useState<Booking | null>(null);
  const [quotation, setQuotation] = useState<RefundQuotation | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [reason, setReason] = useState('');
  const [step, setStep] = useState<'info' | 'confirm' | 'success'>('info');

  // Booking ve quotation yükle
  useEffect(() => {
    const loadData = async () => {
      if (!bookingId || !token) {
        setError('Geçersiz bağlantı');
        setLoading(false);
        return;
      }

      try {
        // Booking bilgilerini al
        const bookingRes = await fetch(`${API_URL}/my-trips/${bookingId}?token=${token}`);
        const bookingData = await bookingRes.json();
        
        if (!bookingData.success) {
          throw new Error(bookingData.message || 'Rezervasyon bulunamadı');
        }
        
        setBooking(bookingData.data || bookingData.booking);

        // İade teklifi al
        const quotationRes = await fetch(`${API_URL}/bookings/${bookingId}/refund/quotation`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reason: '' }),
        });
        const quotationData = await quotationRes.json();
        
        if (quotationData.success) {
          setQuotation(quotationData.quotation);
        }
      } catch (err: any) {
        setError(err.message || 'Bir hata oluştu');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [bookingId, token]);

  // İadeyi onayla
  const handleConfirmRefund = async () => {
    if (!quotation || !booking) return;

    setProcessing(true);
    setError(null);

    try {
      const res = await fetch(`${API_URL}/bookings/${bookingId}/refund/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quotationId: quotation.id,
          reason: reason || 'Müşteri tarafından iptal edildi',
          refundedBy: 'customer',
        }),
      });

      const data = await res.json();

      if (data.success) {
        setSuccess(true);
        setStep('success');
      } else {
        throw new Error(data.message || 'İade işlemi başarısız');
      }
    } catch (err: any) {
      setError(err.message || 'İade işlemi sırasında bir hata oluştu');
    } finally {
      setProcessing(false);
    }
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
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
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
              <h1 className="text-2xl font-bold mb-2">İade Talebi Alındı!</h1>
              <p className="text-green-100">Rezervasyon başarıyla iptal edildi</p>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">İade Tutarı</span>
                  <span className="text-2xl font-bold text-green-600">
                    €{quotation?.netRefundAmount.toFixed(2)}
                  </span>
                </div>
              </div>
              <p className="text-slate-600 text-center">
                İade tutarı 5-10 iş günü içinde ödeme yönteminize aktarılacaktır.
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

        {/* Info & Confirm State */}
        {step !== 'success' && booking && (
          <>
            <h1 className="text-2xl font-bold text-slate-800 mb-6">Bilet İptali ve İade</h1>

            {/* Booking Summary */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
              <h2 className="font-semibold text-slate-800 mb-4">Rezervasyon Bilgileri</h2>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-slate-500">Rezervasyon No</span>
                  <span className="font-medium">{booking.bookingReference}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Güzergah</span>
                  <span className="font-medium">{booking.fromStation} → {booking.toStation}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Tarih</span>
                  <span className="font-medium">{booking.departureDate} {booking.departureTime}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Ödenen Tutar</span>
                  <span className="font-medium">€{Number(booking.totalPrice || booking.price).toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Refund Quotation */}
            {quotation ? (
              <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
                <h2 className="font-semibold text-slate-800 mb-4">İade Detayları</h2>
                
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Bilet Tutarı</span>
                    <span>€{quotation.refundableAmount.toFixed(2)}</span>
                  </div>
                  {quotation.refundFee > 0 && (
                    <div className="flex justify-between text-red-600">
                      <span>İşlem Ücreti</span>
                      <span>-€{quotation.refundFee.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between pt-3 border-t border-slate-200">
                    <span className="font-semibold text-slate-800">İade Edilecek Tutar</span>
                    <span className="text-xl font-bold text-green-600">
                      €{quotation.netRefundAmount.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Conditions */}
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
                  <div className="flex items-start gap-2">
                    <Info className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-amber-800 mb-2">İade Koşulları</p>
                      <ul className="text-sm text-amber-700 space-y-1">
                        {quotation.conditions.map((condition, i) => (
                          <li key={i}>• {condition}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Reason */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    İptal Sebebi (Opsiyonel)
                  </label>
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="İptal sebebinizi yazabilirsiniz..."
                    rows={3}
                    className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Error */}
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                    <p className="text-red-700">{error}</p>
                  </div>
                )}

                {/* Confirm Button */}
                <button
                  onClick={handleConfirmRefund}
                  disabled={processing || quotation.netRefundAmount === 0}
                  className={`w-full py-4 rounded-xl font-semibold flex items-center justify-center gap-2 ${
                    processing || quotation.netRefundAmount === 0
                      ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                      : 'bg-red-600 text-white hover:bg-red-700'
                  }`}
                >
                  {processing ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      İşleniyor...
                    </>
                  ) : (
                    <>
                      <XCircle className="w-5 h-5" />
                      İptal Et ve İade Al
                    </>
                  )}
                </button>
              </div>
            ) : (
              <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
                <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <p className="text-red-700 font-medium">Bu bilet için iade yapılamamaktadır.</p>
                <p className="text-red-600 text-sm mt-2">Kalkış saati geçmiş veya iade süresi dolmuş olabilir.</p>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}

// Default export with Suspense
export default function RefundPageWrapper() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
      </div>
    }>
      <RefundPage />
    </Suspense>
  );
}
