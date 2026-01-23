'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Train, Shield, Lock, CreditCard, ArrowLeft,
  CheckCircle, AlertCircle, Loader2, Globe, ChevronDown, Info
} from 'lucide-react';

interface ExchangeRates {
  EUR: number;
  USD: number;
  TRY: number;
  USD_TO_EUR: number;
  TRY_TO_EUR: number;
  markup: number;
  lastUpdated: string;
  source: string;
}

interface Currency {
  code: string;
  symbol: string;
  name: string;
  flag: string;
}

const CURRENCIES: Currency[] = [
  { code: 'EUR', symbol: '€', name: 'Euro', flag: 'EU' },
  { code: 'USD', symbol: '$', name: 'US Dollar', flag: 'US' },
  { code: 'TRY', symbol: '₺', name: 'Türk Lirası', flag: 'TR' },
];

function PaymentContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // URL params
  const bookingId = searchParams.get('bookingId') || '';
  const amount = parseFloat(searchParams.get('amount') || '0');
  const fromStation = searchParams.get('from') || '';
  const toStation = searchParams.get('to') || '';
  const date = searchParams.get('date') || '';
  const time = searchParams.get('time') || '';
  const passengers = searchParams.get('passengers') || '1';

  // State
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [selectedCurrency, setSelectedCurrency] = useState('EUR');
  const [showCurrencyDropdown, setShowCurrencyDropdown] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showMarkupTooltip, setShowMarkupTooltip] = useState(false);
  
  // Exchange rates
  const [rates, setRates] = useState<ExchangeRates | null>(null);
  const [ratesLoading, setRatesLoading] = useState(true);

  // Load exchange rates
  useEffect(() => {
    const fetchRates = async () => {
      try {
        const response = await fetch('http://localhost:3001/settings/exchange-rates');
        const data = await response.json();
        if (data.success) {
          setRates(data.rates);
        }
      } catch (error) {
        console.error('Failed to fetch exchange rates:', error);
      } finally {
        setRatesLoading(false);
      }
    };
    fetchRates();
  }, []);

  // Load from sessionStorage
  useEffect(() => {
    const storedName = sessionStorage.getItem('customerName');
    const storedEmail = sessionStorage.getItem('customerEmail');
    if (storedName) setCustomerName(storedName);
    if (storedEmail) setCustomerEmail(storedEmail);

    // Detect locale for default currency
    const locale = navigator.language;
    if (locale.startsWith('tr')) {
      setSelectedCurrency('TRY');
    }
  }, []);

  // Currency conversion using real rates
  const getConvertedAmount = (currency: string): number => {
    if (!rates) return amount;
    
    if (currency === 'EUR') return amount;
    
    if (currency === 'USD') {
      // EUR fiyatı USD'ye çevir (markup dahil)
      const baseUsdRate = 1 / rates.USD_TO_EUR;
      const withMarkup = baseUsdRate * (1 + rates.markup / 100);
      return Number((amount * withMarkup).toFixed(2));
    }
    
    if (currency === 'TRY') {
      // rates.TRY zaten markup dahil
      return Number((amount * rates.TRY).toFixed(2));
    }
    
    return amount;
  };

  // Get base amount without markup (for display)
  const getBaseAmount = (currency: string): number => {
    if (!rates) return amount;
    
    if (currency === 'EUR') return amount;
    if (currency === 'USD') return Number((amount / rates.USD_TO_EUR).toFixed(2));
    if (currency === 'TRY') return Number((amount * rates.TRY_TO_EUR).toFixed(2));
    
    return amount;
  };

  const getCurrencySymbol = (code: string): string => {
    return CURRENCIES.find(c => c.code === code)?.symbol || '€';
  };

  const formatPrice = (value: number): string => {
    return new Intl.NumberFormat('tr-TR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!agreedToTerms) {
      setError('Lütfen kullanım koşullarını kabul edin');
      return;
    }

    setLoading(true);
    setError('');

    sessionStorage.setItem('customerName', customerName);
    sessionStorage.setItem('customerEmail', customerEmail);

    try {
      const orderId = 'ORD-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
      const convertedAmount = getConvertedAmount(selectedCurrency);

      const response = await fetch('http://localhost:3001/payment/initiate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId,
          bookingId: parseInt(bookingId) || 0,
          amount: convertedAmount,
          currency: selectedCurrency,
          customerEmail,
          customerName,
        }),
      });

      const data = await response.json();

      if (data.success && data.redirectUrl) {
        window.location.href = data.redirectUrl;
      } else {
        setError(data.message || 'Ödeme başlatılamadı. Lütfen tekrar deneyin.');
      }
    } catch (err) {
      setError('Bağlantı hatası. Lütfen internet bağlantınızı kontrol edin.');
    } finally {
      setLoading(false);
    }
  };

  const convertedAmount = getConvertedAmount(selectedCurrency);
  const currencySymbol = getCurrencySymbol(selectedCurrency);
  const selectedCurrencyData = CURRENCIES.find(c => c.code === selectedCurrency);
  const hasMarkup = selectedCurrency !== 'EUR';

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
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

            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Lock className="w-4 h-4" />
              <span>Güvenli Ödeme</span>
            </div>
          </div>
        </div>
      </header>

      {/* Progress Bar */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-white" />
              </div>
              <span className="text-sm font-medium text-slate-900 hidden sm:inline">Sefer Seçimi</span>
            </div>
            <div className="flex-1 h-1 bg-green-500 mx-2 sm:mx-4" />
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-white" />
              </div>
              <span className="text-sm font-medium text-slate-900 hidden sm:inline">Yolcu Bilgileri</span>
            </div>
            <div className="flex-1 h-1 bg-green-500 mx-2 sm:mx-4" />
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-bold">3</span>
              </div>
              <span className="text-sm font-medium text-blue-600 hidden sm:inline">Ödeme</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-5 gap-8">
          {/* Sol - Form */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8">
              <h1 className="text-2xl font-bold text-slate-900 mb-6">Ödeme Bilgileri</h1>

              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-red-800 font-medium">Hata</p>
                    <p className="text-red-600 text-sm">{error}</p>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Kişisel Bilgiler */}
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">Kişisel Bilgiler</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Ad Soyad
                      </label>
                      <input
                        type="text"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        placeholder="Adınız Soyadınız"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        E-posta Adresi
                      </label>
                      <input
                        type="email"
                        value={customerEmail}
                        onChange={(e) => setCustomerEmail(e.target.value)}
                        className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        placeholder="ornek@email.com"
                        required
                      />
                      <p className="mt-1 text-xs text-slate-500">Biletiniz bu adrese gönderilecek</p>
                    </div>
                  </div>
                </div>

                {/* Para Birimi Seçimi */}
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">Para Birimi</h3>
                  
                  {ratesLoading ? (
                    <div className="flex items-center gap-2 text-slate-500">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Kurlar yükleniyor...</span>
                    </div>
                  ) : (
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setShowCurrencyDropdown(!showCurrencyDropdown)}
                        className="w-full px-4 py-3 border border-slate-200 rounded-xl flex items-center justify-between hover:border-slate-300 transition-colors bg-white"
                      >
                        <div className="flex items-center gap-3">
                          <Globe className="w-5 h-5 text-slate-400" />
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded">{selectedCurrencyData?.flag}</span>
                            <span className="font-semibold text-slate-900">{selectedCurrency}</span>
                            <span className="text-slate-500">{selectedCurrencyData?.name}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-semibold text-slate-900">
                            {currencySymbol}{formatPrice(convertedAmount)}
                          </span>
                          <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${showCurrencyDropdown ? 'rotate-180' : ''}`} />
                        </div>
                      </button>

                      {showCurrencyDropdown && (
                        <div className="absolute z-10 w-full mt-2 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden">
                          {CURRENCIES.map((currency) => (
                            <button
                              key={currency.code}
                              type="button"
                              onClick={() => {
                                setSelectedCurrency(currency.code);
                                setShowCurrencyDropdown(false);
                              }}
                              className={`w-full px-4 py-3 flex items-center justify-between hover:bg-slate-50 transition-colors ${
                                selectedCurrency === currency.code ? 'bg-blue-50' : ''
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <span className="text-xs font-bold bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded">{currency.flag}</span>
                                <span className="font-medium text-slate-900">{currency.code}</span>
                                <span className="text-slate-500">{currency.name}</span>
                              </div>
                              <span className="font-semibold text-slate-900">
                                {currency.symbol}{formatPrice(getConvertedAmount(currency.code))}
                              </span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Ödeme Yöntemi Bilgisi */}
                <div className="bg-slate-50 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <CreditCard className="w-5 h-5 text-slate-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-slate-900">Güvenli Ödeme Sayfası</p>
                      <p className="text-sm text-slate-600 mt-1">
                        Kart bilgilerinizi güvenli ödeme sayfasında gireceksiniz. 
                        Tüm ödemeler 3D Secure ile korunmaktadır.
                      </p>
                      <div className="flex items-center gap-2 mt-3">
                        <div className="bg-white border border-slate-200 rounded-md px-3 py-1.5 shadow-sm">
                          <span className="text-blue-800 font-bold text-sm tracking-wide">VISA</span>
                        </div>
                        <div className="bg-white border border-slate-200 rounded-md px-3 py-1.5 shadow-sm">
                          <span className="text-orange-600 font-bold text-sm">mastercard</span>
                        </div>
                        <div className="bg-white border border-slate-200 rounded-md px-3 py-1.5 shadow-sm">
                          <span className="text-blue-600 font-bold text-sm">TROY</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Koşullar */}
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="terms"
                    checked={agreedToTerms}
                    onChange={(e) => setAgreedToTerms(e.target.checked)}
                    className="mt-1 w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="terms" className="text-sm text-slate-600">
                    <Link href="/terms" className="text-blue-600 hover:underline">Kullanım Koşulları</Link>
                    {' '}ve{' '}
                    <Link href="/privacy" className="text-blue-600 hover:underline">Gizlilik Politikası</Link>
                    &apos;nı okudum ve kabul ediyorum.
                  </label>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading || !agreedToTerms || ratesLoading}
                  className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Yönlendiriliyor...</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-5 h-5" />
                      <span>{currencySymbol}{formatPrice(convertedAmount)} Öde</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Sağ - Özet */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sticky top-8">
              <h3 className="text-lg font-bold text-slate-900 mb-4">Rezervasyon Özeti</h3>

              {/* Journey Info */}
              <div className="bg-slate-50 rounded-xl p-4 mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <Train className="w-5 h-5 text-blue-600" />
                  <span className="font-medium text-slate-900">Yolculuk Detayları</span>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Güzergah</span>
                    <span className="font-medium text-slate-900">{fromStation} → {toStation}</span>
                  </div>
                  {date && (
                    <div className="flex justify-between">
                      <span className="text-slate-600">Tarih</span>
                      <span className="font-medium text-slate-900">{date}</span>
                    </div>
                  )}
                  {time && (
                    <div className="flex justify-between">
                      <span className="text-slate-600">Saat</span>
                      <span className="font-medium text-slate-900">{time}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-slate-600">Yolcu</span>
                    <span className="font-medium text-slate-900">{passengers} Kişi</span>
                  </div>
                </div>
              </div>

              {/* Price Breakdown */}
              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-slate-600">
                  <span>Bilet Ücreti</span>
                  <span>€{formatPrice(amount * 0.95)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Hizmet Bedeli</span>
                  <span>€{formatPrice(amount * 0.05)}</span>
                </div>
                <div className="border-t border-slate-200 pt-3 flex justify-between items-start">
                  <div className="flex items-center gap-1">
                    <span className="text-lg font-bold text-slate-900">Toplam</span>
                    {hasMarkup && rates && (
                      <div className="relative">
                        <button
                          type="button"
                          onMouseEnter={() => setShowMarkupTooltip(true)}
                          onMouseLeave={() => setShowMarkupTooltip(false)}
                          onClick={() => setShowMarkupTooltip(!showMarkupTooltip)}
                          className="text-slate-400 hover:text-slate-600 transition-colors"
                        >
                          <Info className="w-4 h-4" />
                        </button>
                        {showMarkupTooltip && (
                          <div className="absolute left-0 bottom-full mb-2 w-64 p-3 bg-slate-800 text-white text-xs rounded-lg shadow-lg z-20">
                            <p className="mb-2">
                              <strong>Orijinal fiyat:</strong> €{formatPrice(amount)}
                            </p>
                            <p className="mb-2">
                              <strong>TCMB Kuru:</strong> 1 EUR = {selectedCurrency === 'TRY' ? `₺${formatPrice(rates.TRY_TO_EUR)}` : `$${formatPrice(1/rates.USD_TO_EUR)}`}
                            </p>
                            <p className="text-slate-300">
                              Orijinal para birimi (EUR) dışında yapılan ödemelerde TCMB efektif satış kuru üzerine %{rates.markup} kur farkı uygulanmaktadır.
                            </p>
                            <div className="absolute left-3 top-full w-0 h-0 border-l-8 border-r-8 border-t-8 border-transparent border-t-slate-800"></div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <span className="text-xl font-bold text-blue-600">
                      {currencySymbol}{formatPrice(convertedAmount)}
                    </span>
                    {hasMarkup && (
                      <p className="text-xs text-slate-400">≈ €{formatPrice(amount)}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Security Badges */}
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm text-slate-600">
                  <Shield className="w-5 h-5 text-green-500" />
                  <span>256-bit SSL Şifreleme</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-slate-600">
                  <Lock className="w-5 h-5 text-green-500" />
                  <span>3D Secure Koruması</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-slate-600">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span>PCI DSS Uyumlu</span>
                </div>
              </div>

              {/* Back Button */}
              <button
                onClick={() => router.back()}
                className="w-full mt-6 py-3 border border-slate-200 text-slate-600 font-medium rounded-xl hover:bg-slate-50 transition-colors flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Geri Dön</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 mt-12">
        <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Lock className="w-4 h-4" />
            <span>Tüm işlemler güvenli şekilde şifrelenmektedir</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-slate-500">
            <Link href="/terms" className="hover:text-slate-700">Kullanım Koşulları</Link>
            <Link href="/privacy" className="hover:text-slate-700">Gizlilik</Link>
            <Link href="/help" className="hover:text-slate-700">Yardım</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}

export default function PaymentPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
      </div>
    }>
      <PaymentContent />
    </Suspense>
  );
}