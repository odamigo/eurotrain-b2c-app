'use client';

import { useState, useEffect } from 'react';
import { 
  RefreshCw, Save, DollarSign, FileText, Shield, 
  Loader2, CheckCircle, AlertCircle, TrendingUp
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

export default function AdminSettingsPage() {
  const [rates, setRates] = useState<ExchangeRates | null>(null);
  const [markup, setMarkup] = useState(2.5);
  const [terms, setTerms] = useState('');
  const [privacy, setPrivacy] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const getToken = () => localStorage.getItem('admin_token');

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      // Fetch rates
      const ratesRes = await fetch('http://localhost:3001/settings/exchange-rates');
      const ratesData = await ratesRes.json();
      if (ratesData.success) {
        setRates(ratesData.rates);
        setMarkup(ratesData.rates.markup);
      }

      // Fetch terms
      const termsRes = await fetch('http://localhost:3001/settings/terms?lang=tr');
      const termsData = await termsRes.json();
      if (termsData.success) {
        setTerms(termsData.content);
      }

      // Fetch privacy
      const privacyRes = await fetch('http://localhost:3001/settings/privacy?lang=tr');
      const privacyData = await privacyRes.json();
      if (privacyData.success) {
        setPrivacy(privacyData.content);
      }
    } catch (error) {
      showMessage('error', 'Veriler yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  const refreshRates = async () => {
    setRefreshing(true);
    try {
      const token = getToken();
      const res = await fetch('http://localhost:3001/settings/admin/exchange-rates/refresh', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (data.success) {
        setRates(data.rates);
        showMessage('success', 'Kurlar TCMB\'den güncellendi');
      } else {
        showMessage('error', data.message || 'Kurlar güncellenemedi');
      }
    } catch (error) {
      showMessage('error', 'Bağlantı hatası');
    } finally {
      setRefreshing(false);
    }
  };

  const saveMarkup = async () => {
    setSaving('markup');
    try {
      const token = getToken();
      const res = await fetch('http://localhost:3001/settings/admin/markup', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ markup }),
      });
      const data = await res.json();
      if (data.success) {
        showMessage('success', 'Markup güncellendi');
        // Refresh rates to see new values
        await refreshRates();
      } else {
        showMessage('error', data.message || 'Markup güncellenemedi');
      }
    } catch (error) {
      showMessage('error', 'Bağlantı hatası');
    } finally {
      setSaving(null);
    }
  };

  const saveTerms = async () => {
    setSaving('terms');
    try {
      const token = getToken();
      const res = await fetch('http://localhost:3001/settings/admin/terms', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ content: terms, language: 'tr' }),
      });
      const data = await res.json();
      if (data.success) {
        showMessage('success', 'Kullanım koşulları güncellendi');
      } else {
        showMessage('error', data.message || 'Güncellenemedi');
      }
    } catch (error) {
      showMessage('error', 'Bağlantı hatası');
    } finally {
      setSaving(null);
    }
  };

  const savePrivacy = async () => {
    setSaving('privacy');
    try {
      const token = getToken();
      const res = await fetch('http://localhost:3001/settings/admin/privacy', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ content: privacy, language: 'tr' }),
      });
      const data = await res.json();
      if (data.success) {
        showMessage('success', 'Gizlilik politikası güncellendi');
      } else {
        showMessage('error', data.message || 'Güncellenemedi');
      }
    } catch (error) {
      showMessage('error', 'Bağlantı hatası');
    } finally {
      setSaving(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Ayarlar</h1>
      </div>

      {/* Message */}
      {message && (
        <div className={`p-4 rounded-lg flex items-center gap-3 ${
          message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
        }`}>
          {message.type === 'success' ? (
            <CheckCircle className="w-5 h-5" />
          ) : (
            <AlertCircle className="w-5 h-5" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Exchange Rates Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Döviz Kurları</h2>
              <p className="text-sm text-slate-500">TCMB Efektif Satış Kuru</p>
            </div>
          </div>
          <button
            onClick={refreshRates}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span>{refreshing ? 'Güncelleniyor...' : 'Kurları Güncelle'}</span>
          </button>
        </div>

        {rates && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-slate-50 rounded-lg p-4">
                <p className="text-sm text-slate-500 mb-1">EUR/TRY</p>
                <p className="text-2xl font-bold text-slate-900">₺{rates.TRY_TO_EUR.toFixed(4)}</p>
              </div>
              <div className="bg-slate-50 rounded-lg p-4">
                <p className="text-sm text-slate-500 mb-1">USD/EUR</p>
                <p className="text-2xl font-bold text-slate-900">{rates.USD_TO_EUR.toFixed(4)}</p>
              </div>
              <div className="bg-slate-50 rounded-lg p-4">
                <p className="text-sm text-slate-500 mb-1">Son Güncelleme</p>
                <p className="text-lg font-medium text-slate-900">
                  {new Date(rates.lastUpdated).toLocaleString('tr-TR')}
                </p>
                <p className="text-xs text-slate-400">{rates.source}</p>
              </div>
            </div>

            {/* Markup Setting */}
            <div className="border-t border-slate-200 pt-6">
              <div className="flex items-center gap-3 mb-4">
                <DollarSign className="w-5 h-5 text-slate-600" />
                <h3 className="font-semibold text-slate-900">Kur Farkı (Markup)</h3>
              </div>
              <p className="text-sm text-slate-500 mb-4">
                EUR dışındaki para birimlerinde uygulanacak kur farkı oranı
              </p>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={markup}
                    onChange={(e) => setMarkup(parseFloat(e.target.value) || 0)}
                    min="0"
                    max="20"
                    step="0.1"
                    className="w-24 px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-slate-600">%</span>
                </div>
                <button
                  onClick={saveMarkup}
                  disabled={saving === 'markup'}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                >
                  {saving === 'markup' ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  <span>Kaydet</span>
                </button>
              </div>
              <p className="text-xs text-slate-400 mt-2">
                Örnek: €100 = ₺{(100 * rates.TRY_TO_EUR * (1 + markup / 100)).toFixed(2)} (markup dahil)
              </p>
            </div>
          </>
        )}
      </div>

      {/* Terms & Conditions */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
            <FileText className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Kullanım Koşulları</h2>
            <p className="text-sm text-slate-500">Markdown formatında yazabilirsiniz</p>
          </div>
        </div>
        <textarea
          value={terms}
          onChange={(e) => setTerms(e.target.value)}
          rows={10}
          className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono text-sm"
          placeholder="# Kullanım Koşulları&#10;&#10;İçerik buraya..."
        />
        <div className="flex justify-end mt-4">
          <button
            onClick={saveTerms}
            disabled={saving === 'terms'}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
          >
            {saving === 'terms' ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>Kaydet</span>
          </button>
        </div>
      </div>

      {/* Privacy Policy */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
            <Shield className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Gizlilik Politikası</h2>
            <p className="text-sm text-slate-500">Markdown formatında yazabilirsiniz</p>
          </div>
        </div>
        <textarea
          value={privacy}
          onChange={(e) => setPrivacy(e.target.value)}
          rows={10}
          className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono text-sm"
          placeholder="# Gizlilik Politikası&#10;&#10;İçerik buraya..."
        />
        <div className="flex justify-end mt-4">
          <button
            onClick={savePrivacy}
            disabled={saving === 'privacy'}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
          >
            {saving === 'privacy' ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>Kaydet</span>
          </button>
        </div>
      </div>
    </div>
  );
}
