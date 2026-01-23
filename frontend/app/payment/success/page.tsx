'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  CheckCircle, Train, Download, Mail, Calendar,
  MapPin, Clock, Loader2, ArrowRight, Printer
} from 'lucide-react';
import confetti from 'canvas-confetti';

function SuccessContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId') || '';
  const paymentId = searchParams.get('paymentId') || '';

  const [paymentDetails, setPaymentDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Konfeti efekti
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });

    // Ödeme detaylarını al
    const fetchPaymentDetails = async () => {
      try {
        if (paymentId) {
          const response = await fetch(`http://localhost:3001/payment/status/${paymentId}`);
          const data = await response.json();
          setPaymentDetails(data);
        }
      } catch (error) {
        console.error('Payment details fetch error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPaymentDetails();
  }, [paymentId]);

  const handleDownloadTicket = () => {
    if (paymentDetails?.bookingId) {
      window.open(`http://localhost:3001/pdf/ticket/${paymentDetails.bookingId}`, '_blank');
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50">
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
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-12">
        {/* Success Card */}
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
          {/* Success Header */}
          <div className="bg-gradient-to-r from-green-500 to-emerald-500 px-8 py-12 text-center">
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
              <CheckCircle className="w-12 h-12 text-green-500" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Ödeme Başarılı!
            </h1>
            <p className="text-green-100">
              Biletiniz başarıyla oluşturuldu
            </p>
          </div>

          {/* Content */}
          <div className="p-8">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
              </div>
            ) : (
              <>
                {/* Order Info */}
                <div className="bg-slate-50 rounded-2xl p-6 mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-slate-600">Sipariş Numarası</span>
                    <span className="font-mono font-bold text-slate-900">{orderId}</span>
                  </div>
                  {paymentDetails && (
                    <>
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-slate-600">Ödeme Tutarı</span>
                        <span className="font-bold text-green-600">
                          {paymentDetails.currency === 'TRY' ? '₺' : paymentDetails.currency === 'USD' ? '$' : '€'}
                          {Number(paymentDetails.amount).toFixed(2)}
                        </span>
                      </div>
                      {paymentDetails.cardLastFour && (
                        <div className="flex items-center justify-between">
                          <span className="text-slate-600">Kart</span>
                          <span className="font-medium text-slate-900">
                            {paymentDetails.cardBrand} •••• {paymentDetails.cardLastFour}
                          </span>
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* Email Notice */}
                <div className="flex items-start gap-4 bg-blue-50 rounded-2xl p-6 mb-6">
                  <Mail className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
                  <div>
                    <p className="font-semibold text-slate-900">E-Biletiniz Gönderildi</p>
                    <p className="text-sm text-slate-600 mt-1">
                      Biletiniz ve tüm seyahat detayları e-posta adresinize gönderildi. 
                      Spam klasörünüzü de kontrol etmeyi unutmayın.
                    </p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <button
                    onClick={handleDownloadTicket}
                    className="flex items-center justify-center gap-2 px-6 py-4 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors"
                  >
                    <Download className="w-5 h-5" />
                    <span>Bileti İndir</span>
                  </button>
                  <button
                    onClick={() => window.print()}
                    className="flex items-center justify-center gap-2 px-6 py-4 border border-slate-200 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 transition-colors"
                  >
                    <Printer className="w-5 h-5" />
                    <span>Yazdır</span>
                  </button>
                </div>

                {/* Important Info */}
                <div className="border border-amber-200 bg-amber-50 rounded-2xl p-6 mb-6">
                  <h3 className="font-semibold text-amber-800 mb-3">Önemli Bilgiler</h3>
                  <ul className="space-y-2 text-sm text-amber-700">
                    <li className="flex items-start gap-2">
                      <span className="mt-1">•</span>
                      <span>Seyahat sırasında kimlik belgenizi yanınızda bulundurun</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-1">•</span>
                      <span>Kalkıştan en az 15 dakika önce istasyonda olun</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-1">•</span>
                      <span>E-biletinizi telefonunuzda veya çıktı olarak gösterebilirsiniz</span>
                    </li>
                  </ul>
                </div>

                {/* Navigation */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <Link
                    href="/my-trips"
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-slate-900 text-white font-semibold rounded-xl hover:bg-slate-800 transition-colors"
                  >
                    <span>Biletlerime Git</span>
                    <ArrowRight className="w-5 h-5" />
                  </Link>
                  <Link
                    href="/"
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-4 border border-slate-200 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 transition-colors"
                  >
                    <span>Ana Sayfaya Dön</span>
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Support */}
        <div className="text-center mt-8">
          <p className="text-slate-600">
            Yardıma mı ihtiyacınız var?{' '}
            <Link href="/help" className="text-blue-600 hover:underline font-medium">
              Destek Ekibimize Ulaşın
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
      </div>
    }>
      <SuccessContent />
    </Suspense>
  );
}