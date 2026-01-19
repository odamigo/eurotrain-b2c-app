'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface Trip {
  id: number;
  orderId: string;
  fromStation: string;
  toStation: string;
  departureDate: string;
  departureTime: string;
  arrivalTime: string;
  trainType: string;
  trainNumber: string;
  operator: string;
  passengerName: string;
  passengerEmail: string;
  coach: string;
  seat: string;
  ticketClass: string;
  price: number;
  currency: string;
  status: string;
  pnr: string;
}

function MyTripsContent() {
  const searchParams = useSearchParams();
  const [trips, setTrips] = useState<{ upcoming: Trip[]; past: Trip[] }>({ upcoming: [], past: [] });
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [showEmailForm, setShowEmailForm] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const token = searchParams.get('token');

  useEffect(() => {
    if (token) {
      setShowEmailForm(false);
      fetchTrips(token);
    }
  }, [token]);

  const fetchTrips = async (authToken: string) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/my-trips/verify?token=${authToken}`);
      const data = await res.json();
      
      if (data.success) {
        setTrips({
          upcoming: data.data.upcoming || [],
          past: data.data.past || []
        });
      } else {
        setError('Biletler yüklenirken bir hata oluştu');
        setShowEmailForm(true);
      }
    } catch (err) {
      setError('Bağlantı hatası. Lütfen tekrar deneyin.');
      setShowEmailForm(true);
    }
    setLoading(false);
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMessage('');
    
    try {
      const res = await fetch(`${API_URL}/my-trips/request-link`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      
      if (data.success) {
        setSuccessMessage('Bilet bilgileriniz e-posta adresinize gönderildi!');
        // Dev modda direkt token ile yönlendir
        if (data.token) {
          setTimeout(() => {
            window.location.href = `/my-trips?token=${data.token}`;
          }, 1000);
        }
      } else {
        setError(data.message || 'Bir hata oluştu');
      }
    } catch (err) {
      setError('Bağlantı hatası. Lütfen tekrar deneyin.');
    }
    setLoading(false);
  };

  if (showEmailForm) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12">
        <div className="max-w-md mx-auto px-4">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Biletlerim</h1>
              <p className="text-gray-600 mt-2">
                Biletlerinize erişmek için rezervasyon sırasında kullandığınız e-posta adresini girin
              </p>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                {error}
              </div>
            )}

            {successMessage && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-600 text-sm">
                {successMessage}
              </div>
            )}

            <form onSubmit={handleEmailSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  E-posta Adresi
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="ornek@email.com"
                  required
                  disabled={loading}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {loading ? 'Yükleniyor...' : 'Biletlerimi Gönder'}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Biletleriniz yükleniyor...</p>
        </div>
      </div>
    );
  }

  const currentTrips = activeTab === 'upcoming' ? trips.upcoming : trips.past;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Biletlerim</h1>
              <p className="text-gray-600 text-sm mt-1">Tüm seyahatlerinizi buradan yönetin</p>
            </div>
            <Link href="/" className="text-blue-600 hover:text-blue-700 font-medium">
              Yeni Rezervasyon
            </Link>
          </div>

          <div className="flex gap-4 mt-6">
            <button
              onClick={() => setActiveTab('upcoming')}
              className={`px-4 py-2 rounded-full font-medium transition-colors ${
                activeTab === 'upcoming'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Yaklaşan ({trips.upcoming.length})
            </button>
            <button
              onClick={() => setActiveTab('past')}
              className={`px-4 py-2 rounded-full font-medium transition-colors ${
                activeTab === 'past'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Geçmiş ({trips.past.length})
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {currentTrips.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900">
              {activeTab === 'upcoming' ? 'Yaklaşan seyahatiniz yok' : 'Geçmiş seyahatiniz yok'}
            </h3>
            {activeTab === 'upcoming' && (
              <Link href="/" className="text-blue-600 hover:underline mt-2 inline-block">
                Hemen bir seyahat planlayın
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {currentTrips.map((trip) => (
              <TripCard key={trip.id} trip={trip} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function TripCard({ trip }: { trip: Trip }) {
  const [expanded, setExpanded] = useState(false);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('tr-TR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const formatTime = (timeStr: string) => {
    if (!timeStr) return '--:--';
    return timeStr.substring(0, 5);
  };

  const addToCalendar = () => {
    const startDate = new Date(`${trip.departureDate}T${trip.departureTime || '00:00'}`);
    const endDate = new Date(`${trip.departureDate}T${trip.arrivalTime || '00:00'}`);
    
    const event = {
      title: `🚂 ${trip.fromStation} → ${trip.toStation}`,
      start: startDate.toISOString(),
      end: endDate.toISOString(),
      description: `Tren: ${trip.trainNumber || ''}\nVagon: ${trip.coach || '-'}, Koltuk: ${trip.seat || '-'}\nPNR: ${trip.pnr || trip.orderId}`,
    };

    const googleUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(event.title)}&dates=${startDate.toISOString().replace(/[-:]/g, '').split('.')[0]}Z/${endDate.toISOString().replace(/[-:]/g, '').split('.')[0]}Z&details=${encodeURIComponent(event.description)}`;
    
    window.open(googleUrl, '_blank');
  };

  const isUpcoming = trip.status === 'CONFIRMED' || trip.status === 'PENDING';

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div 
        className="p-6 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-medium text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
            {formatDate(trip.departureDate)}
          </span>
          <span className={`text-sm font-medium px-3 py-1 rounded-full ${
            trip.status === 'CONFIRMED' ? 'bg-green-50 text-green-600' :
            trip.status === 'PENDING' ? 'bg-yellow-50 text-yellow-600' :
            trip.status === 'COMPLETED' ? 'bg-gray-50 text-gray-600' :
            'bg-red-50 text-red-600'
          }`}>
            {trip.status === 'CONFIRMED' ? 'Onaylandı' : 
             trip.status === 'PENDING' ? 'Beklemede' :
             trip.status === 'COMPLETED' ? 'Tamamlandı' : 'İptal'}
          </span>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex-1">
            <div className="text-2xl font-bold text-gray-900">{formatTime(trip.departureTime)}</div>
            <div className="text-gray-600 mt-1">{trip.fromStation}</div>
          </div>

          <div className="flex-shrink-0 flex flex-col items-center">
            <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
            <div className="w-px h-8 bg-gradient-to-b from-blue-600 to-blue-300"></div>
            <div className="text-xs text-gray-500 my-1">{trip.operator || 'Tren'}</div>
            <div className="w-px h-8 bg-gradient-to-b from-blue-300 to-blue-600"></div>
            <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
          </div>

          <div className="flex-1 text-right">
            <div className="text-2xl font-bold text-gray-900">{formatTime(trip.arrivalTime)}</div>
            <div className="text-gray-600 mt-1">{trip.toStation}</div>
          </div>
        </div>

        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
          <div className="flex items-center gap-4 text-sm text-gray-600">
            {trip.trainNumber && (
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                </svg>
                {trip.trainNumber}
              </span>
            )}
            {trip.coach && <span>Vagon {trip.coach}</span>}
            {trip.seat && <span>Koltuk {trip.seat}</span>}
          </div>
          <svg 
            className={`w-5 h-5 text-gray-400 transition-transform ${expanded ? 'rotate-180' : ''}`}
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-gray-100">
          <div className="p-6 bg-gray-50">
            <div className="flex items-start gap-6">
              <div className="flex-shrink-0">
                <div className="w-32 h-32 bg-white rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center">
                  <div className="text-center">
                    <svg className="w-12 h-12 text-gray-400 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                    </svg>
                    <span className="text-xs text-gray-500 mt-1 block">QR Kod</span>
                  </div>
                </div>
              </div>

              <div className="flex-1">
                <h4 className="font-semibold text-gray-900 mb-3">Bilet Bilgileri</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-500">PNR:</span>
                    <span className="ml-2 font-mono font-medium">{trip.pnr || '-'}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Sipariş No:</span>
                    <span className="ml-2 font-mono font-medium">{trip.orderId}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Yolcu:</span>
                    <span className="ml-2 font-medium">{trip.passengerName}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Sınıf:</span>
                    <span className="ml-2 font-medium">{trip.ticketClass || 'Standard'}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Operatör:</span>
                    <span className="ml-2 font-medium">{trip.operator || '-'}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Fiyat:</span>
                    <span className="ml-2 font-medium">€{trip.price}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 flex flex-wrap gap-2 border-t border-gray-100">
            <button 
              onClick={addToCalendar}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Takvime Ekle
            </button>
            
            <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              PDF İndir
            </button>

            <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
              Paylaş
            </button>

            {isUpcoming && (
              <button className="flex items-center gap-2 px-4 py-2 bg-red-50 border border-red-200 rounded-lg text-sm font-medium text-red-600 hover:bg-red-100 transition-colors ml-auto">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                İptal Et
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function MyTripsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    }>
      <MyTripsContent />
    </Suspense>
  );
}