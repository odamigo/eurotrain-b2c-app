'use client';

import { X, Train, Check, RefreshCw, Info, FileText, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import type { Journey } from '@/lib/api/era-client';
import { COMFORT_CONFIG } from '@/lib/constants/booking.constants';

interface ConditionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  journey: Journey | null;
}

export function ConditionsModal({ isOpen, onClose, journey }: ConditionsModalProps) {
  if (!isOpen || !journey) return null;

  const comfortConfig = COMFORT_CONFIG[journey.comfortCategory] || COMFORT_CONFIG.standard;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" 
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl max-w-lg w-full max-h-[80vh] overflow-y-auto shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-slate-200 p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-bold text-slate-800">Bilet Koşulları</h2>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            aria-label="Kapat"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-5">
          {/* Journey Info */}
          <div className="bg-slate-50 rounded-xl p-4">
            <div className="flex items-center gap-2 text-sm text-slate-600 mb-2">
              <Train className="w-4 h-4" />
              <span>{journey.operatorName || journey.operator} {journey.trainNumber}</span>
            </div>
            <div className="font-semibold text-slate-800">
              {journey.origin.city} → {journey.destination.city}
            </div>
          </div>

          {/* Class Badge */}
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${comfortConfig.bgColor} ${comfortConfig.color}`}>
            <span className="text-lg">{comfortConfig.icon}</span>
            <span className="font-semibold">{comfortConfig.labelTr}</span>
          </div>

          {/* Conditions List */}
          <div className="space-y-4">
            {/* İade Koşulu */}
            <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-xl">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                journey.isRefundable ? 'bg-green-100' : 'bg-red-100'
              }`}>
                {journey.isRefundable ? (
                  <Check className="w-4 h-4 text-green-600" />
                ) : (
                  <X className="w-4 h-4 text-red-500" />
                )}
              </div>
              <div>
                <div className={`font-semibold ${journey.isRefundable ? 'text-green-700' : 'text-red-600'}`}>
                  {journey.isRefundable ? 'İade Edilebilir' : 'İade Edilemez'}
                </div>
                <div className="text-sm text-slate-600 mt-1">
                  {journey.isRefundable 
                    ? 'Kalkıştan 24 saat öncesine kadar tam iade alabilirsiniz. İade işlemi 5-7 iş günü içinde gerçekleşir.'
                    : 'Bu bilet için iade yapılamamaktadır. Satın almadan önce tarih ve saatinizi kontrol edin.'
                  }
                </div>
              </div>
            </div>

            {/* Değişiklik Koşulu */}
            <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-xl">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                journey.isExchangeable ? 'bg-green-100' : 'bg-red-100'
              }`}>
                {journey.isExchangeable ? (
                  <RefreshCw className="w-4 h-4 text-green-600" />
                ) : (
                  <X className="w-4 h-4 text-red-500" />
                )}
              </div>
              <div>
                <div className={`font-semibold ${journey.isExchangeable ? 'text-green-700' : 'text-red-600'}`}>
                  {journey.isExchangeable ? 'Değiştirilebilir' : 'Değiştirilemez'}
                </div>
                <div className="text-sm text-slate-600 mt-1">
                  {journey.isExchangeable 
                    ? 'Kalkıştan önce ücretsiz tarih/saat değişikliği yapabilirsiniz. Fiyat farkı uygulanabilir.'
                    : 'Bu bilet için değişiklik yapılamamaktadır.'
                  }
                </div>
              </div>
            </div>

            {/* Bagaj */}
            <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-xl">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                <Info className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <div className="font-semibold text-slate-800">Bagaj Hakkı</div>
                <div className="text-sm text-slate-600 mt-1">
                  {comfortConfig.labelTr} sınıfı için: {
                    comfortConfig.features.filter(f => f.toLowerCase().includes('bagaj')).join(', ') || '1 el bagajı'
                  }
                </div>
              </div>
            </div>

            {/* Genel Koşullar */}
            <div className="border-t border-slate-200 pt-4 mt-4">
              <h4 className="font-semibold text-slate-800 mb-2">Genel Koşullar</h4>
              <ul className="text-sm text-slate-600 space-y-1">
                <li>• Bilet, satın alan kişiye özeldir ve devredilemez</li>
                <li>• Kimlik belgesi ile birlikte geçerlidir</li>
                <li>• Kalkıştan en az 30 dakika önce istasyonda olunmalıdır</li>
                <li>• Geç kalma durumunda bilet geçerliliğini kaybeder</li>
              </ul>
            </div>
          </div>

          {/* Full Terms Link */}
          <div className="pt-4 border-t border-slate-200">
            <Link 
              href="/terms" 
              target="_blank"
              className="flex items-center justify-center gap-2 text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              <span>Tüm Satış Koşullarını Görüntüle</span>
              <ExternalLink className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t border-slate-200 p-4">
          <button
            onClick={onClose}
            className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors"
          >
            Anladım
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConditionsModal;
