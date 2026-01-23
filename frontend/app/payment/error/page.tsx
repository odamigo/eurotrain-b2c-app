'use client';

import { Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  XCircle, Train, ArrowLeft, RefreshCw,
  AlertTriangle, Phone, Mail, Loader2
} from 'lucide-react';

function ErrorContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const orderId = searchParams.get('orderId') || '';
  const message = searchParams.get('message') || 'Ödeme işlemi sırasında bir hata oluştu';

  const errorMessages: Record<string, { title: string; description: string; action: string }> = {
    'Gecersiz+islem': {
      title: 'Geçersiz İşlem',
      description: 'Ödeme işlemi doğrulanamadı. Lütfen tekrar deneyin.',
      action: 'retry'
    },
    'Odeme+bulunamadi': {
      title: 'Ödeme Bulunamadı',
      description: 'Ödeme kaydı bulunamadı. Lütfen yeni bir işlem başlatın.',
      action: 'new'
    },
    'Kart+reddedildi': {
      title: 'Kart Reddedildi',
      description: 'Kartınız banka tarafından reddedildi. Lütfen farklı bir kart deneyin veya bankanızla iletişime geçin.',
      action: 'retry'
    },
    'Yetersiz+bakiye': {
      title: 'Yetersiz Bakiye',
      description: 'Kartınızda yeterli bakiye bulunmuyor. Lütfen farklı bir kart deneyin.',
      action: 'retry'
    },
    '3D+Secure+hatasi': {
      title: '3D Secure Doğrulama Hatası',
      description: '3D Secure doğrulaması başarısız oldu. Lütfen bankanızdan gelen SMS kodunu doğru girdiğinizden emin olun.',
      action: 'retry'
    },
  };

  const decodedMessage = decodeURIComponent(message);
  const errorInfo = errorMessages[message] || {
    title: 'Ödeme Başarısız',
    description: decodedMessage,
    action: 'retry'
  };

  const handleRetry = () => {
    router.back();
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50">
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
        {/* Error Card */}
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
          {/* Error Header */}
          <div className="bg-gradient-to-r from-red-500 to-orange-500 px-8 py-12 text-center">
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
              <XCircle className="w-12 h-12 text-red-500" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">
              {errorInfo.title}
            </h1>
            <p className="text-red-100">
              İşlem tamamlanamadı
            </p>
          </div>

          {/* Content */}
          <div className="p-8">
            {/* Error Details */}
            <div className="bg-red-50 border border-red-200 rounded-2xl p-6 mb-6">
              <div className="flex items-start gap-4">
                <AlertTriangle className="w-6 h-6 text-red-500 flex-shrink-0 mt-1" />
                <div>
                  <p className="font-semibold text-red-800 mb-2">Hata Detayı</p>
                  <p className="text-red-700">{errorInfo.description}</p>
                  {orderId && (
                    <p className="text-sm text-red-600 mt-3">
                      Sipariş No: <span className="font-mono">{orderId}</span>
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* What to do */}
            <div className="bg-slate-50 rounded-2xl p-6 mb-6">
              <h3 className="font-semibold text-slate-900 mb-4">Ne Yapabilirsiniz?</h3>
              <ul className="space-y-3 text-sm text-slate-600">
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold">1</span>
                  <span>Kart bilgilerinizi kontrol edin ve tekrar deneyin</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold">2</span>
                  <span>Farklı bir ödeme yöntemi veya kart kullanın</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold">3</span>
                  <span>Bankanızla iletişime geçerek kartınızın online ödemelere açık olduğundan emin olun</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold">4</span>
                  <span>Sorun devam ederse müşteri hizmetlerimizle iletişime geçin</span>
                </li>
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <button
                onClick={handleRetry}
                className="flex items-center justify-center gap-2 px-6 py-4 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors"
              >
                <RefreshCw className="w-5 h-5" />
                <span>Tekrar Dene</span>
              </button>
              <Link
                href="/"
                className="flex items-center justify-center gap-2 px-6 py-4 border border-slate-200 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Ana Sayfa</span>
              </Link>
            </div>

            {/* Support Contact */}
            <div className="border border-slate-200 rounded-2xl p-6">
              <h3 className="font-semibold text-slate-900 mb-4">Yardıma mı İhtiyacınız Var?</h3>
              <div className="space-y-3">
                
                  href="mailto:destek@eurotrain.net"
                  className="flex items-center gap-3 text-slate-600 hover:text-blue-600 transition-colors"
                >
                  <Mail className="w-5 h-5" />
                  <span>destek@eurotrain.net</span>
                </a>
                
                  href="tel:+902123456789"
                  className="flex items-center gap-3 text-slate-600 hover:text-blue-600 transition-colors"
                >
                  <Phone className="w-5 h-5" />
                  <span>+90 212 345 67 89</span>
                </a>
              </div>
              <p className="text-sm text-slate-500 mt-4">
                Müşteri hizmetlerimiz 7/24 hizmetinizdedir
              </p>
            </div>
          </div>
        </div>

        {/* Security Note */}
        <div className="text-center mt-8 text-sm text-slate-500">
          <p>
            Güvenliğiniz bizim için önemli. Kartınızdan herhangi bir ücret tahsil edilmemiştir.
          </p>
        </div>
      </div>
    </main>
  );
}

export default function PaymentErrorPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
      </div>
    }>
      <ErrorContent />
    </Suspense>
  );
}