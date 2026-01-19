'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function PaymentErrorPage() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId') || '';
  const message = searchParams.get('message') || 'Ödeme işlemi başarısız oldu.';

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12">
      <div className="max-w-md mx-auto px-4 text-center">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          {/* Hata İkonu */}
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Ödeme Başarısız
          </h1>
          
          <p className="text-gray-600 mb-6">
            {message}
          </p>

          {orderId && (
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-500">Sipariş Numarası</p>
              <p className="text-lg font-mono font-semibold text-gray-900">{orderId}</p>
            </div>
          )}

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 text-left">
            <p className="text-sm text-yellow-800">
              <strong>Olası nedenler:</strong>
            </p>
            <ul className="text-sm text-yellow-700 mt-2 list-disc list-inside space-y-1">
              <li>Yetersiz bakiye</li>
              <li>Kart bilgileri hatalı</li>
              <li>3D Secure doğrulama başarısız</li>
              <li>Banka tarafından reddedildi</li>
            </ul>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => window.history.back()}
              className="block w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Tekrar Dene
            </button>
            
            <Link
              href="/"
              className="block w-full bg-gray-100 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
            >
              Ana Sayfaya Dön
            </Link>
          </div>

          {/* Destek */}
          <p className="mt-6 text-sm text-gray-500">
            Sorun devam ederse{' '}
            <a href="mailto:destek@eurotrain.com" className="text-blue-600 hover:underline">
              destek@eurotrain.com
            </a>
            {' '}adresinden bize ulaşın.
          </p>
        </div>
      </div>
    </div>
  );
}
