'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Train, Ticket, Mail, Search, Calendar, Download, Share2, 
  ChevronDown, ChevronRight, Clock, MapPin, User, CreditCard,
  AlertCircle, CheckCircle, XCircle, RefreshCw, Smartphone,
  FileText, ExternalLink, Copy, Check, Loader2, ArrowLeft,
  QrCode, Wallet, CalendarPlus, MessageCircle, MoreHorizontal
} from 'lucide-react';
import { 
  downloadIcal, 
  getCalendarLinks, 
  shareViaWhatsApp, 
  copyShareText,
  resendEmail 
} from '@/lib/my-trips-api';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// ============================================================
// TYPES
// ============================================================

interface Trip {
  id: number;
  orderId: string;
  pnr: string;
  bookingReference: string;
  
  // Journey
  fromStation: string;
  toStation: string;
  fromStationCode: string;
  toStationCode: string;
  departureDate: string;
  departureTime: string;
  arrivalTime: string;
  
  // Train
  trainNumber: string;
  operator: string;
  operatorCode: string;
  ticketClass: string;
  
  // Passenger
  passengerName: string;
  passengerEmail: string;
  adults: number;
  children: number;
  
  // Seat
  coach: string;
  seat: string;
  
  // Price
  price: number;
  currency: string;
  
  // Status
  status: 'pending' | 'confirmed' | 'ticketed' | 'cancelled' | 'refunded' | 'completed';
  
  // URLs
  ticketPdfUrl?: string;
  ticketPkpassUrl?: string;
  
  // Timestamps
  createdAt: string;
}

type AccessMethod = 'email' | 'pnr' | 'reference';

// ============================================================
// CONSTANTS
// ============================================================

const STATUS_CONFIG: Record<string, { 
  label: string; 
  color: string; 
  bgColor: string;
  icon: React.ReactNode;
}> = {
  pending: { 
    label: 'Beklemede', 
    color: 'text-amber-700', 
    bgColor: 'bg-amber-50',
    icon: <Clock className="w-4 h-4" />
  },
  confirmed: { 
    label: 'Onaylandı', 
    color: 'text-emerald-700', 
    bgColor: 'bg-emerald-50',
    icon: <CheckCircle className="w-4 h-4" />
  },
  ticketed: { 
    label: 'Bilet Hazır', 
    color: 'text-blue-700', 
    bgColor: 'bg-blue-50',
    icon: <Ticket className="w-4 h-4" />
  },
  cancelled: { 
    label: 'İptal Edildi', 
    color: 'text-red-700', 
    bgColor: 'bg-red-50',
    icon: <XCircle className="w-4 h-4" />
  },
  refunded: { 
    label: 'İade Edildi', 
    color: 'text-orange-700', 
    bgColor: 'bg-orange-50',
    icon: <RefreshCw className="w-4 h-4" />
  },
  completed: { 
    label: 'Tamamlandı', 
    color: 'text-slate-600', 
    bgColor: 'bg-slate-100',
    icon: <Check className="w-4 h-4" />
  },
};

const OPERATOR_CONFIG: Record<string, { color: string; textColor: string }> = {
  'EUROSTAR': { color: 'bg-yellow-400', textColor: 'text-slate-900' },
  'Eurostar': { color: 'bg-yellow-400', textColor: 'text-slate-900' },
  'SNCF': { color: 'bg-red-600', textColor: 'text-white' },
  'TGV': { color: 'bg-red-600', textColor: 'text-white' },
  'Thalys': { color: 'bg-red-700', textColor: 'text-white' },
  'ICE': { color: 'bg-red-600', textColor: 'text-white' },
  'Trenitalia': { color: 'bg-green-600', textColor: 'text-white' },
  'Frecciarossa': { color: 'bg-red-500', textColor: 'text-white' },
  'Renfe': { color: 'bg-purple-600', textColor: 'text-white' },
  'AVE': { color: 'bg-purple-600', textColor: 'text-white' },
  'DEFAULT': { color: 'bg-blue-600', textColor: 'text-white' },
};

// ============================================================
// HELPER FUNCTIONS
// ============================================================

function getOperatorConfig(operator: string) {
  return OPERATOR_CONFIG[operator] || OPERATOR_CONFIG.DEFAULT;
}

function formatDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('tr-TR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

function formatShortDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'short',
    });
  } catch {
    return dateStr;
  }
}

function formatTime(timeStr: string): string {
  if (!timeStr) return '--:--';
  // Handle both HH:MM and ISO datetime formats
  if (timeStr.includes('T')) {
    return new Date(timeStr).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
  }
  return timeStr.substring(0, 5);
}

function isToday(dateStr: string): boolean {
  const today = new Date();
  const date = new Date(dateStr);
  return today.toDateString() === date.toDateString();
}

function isUpcoming(dateStr: string): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const date = new Date(dateStr);
  return date >= today;
}

function getDaysUntil(dateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const date = new Date(dateStr);
  date.setHours(0, 0, 0, 0);
  return Math.ceil((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

// ============================================================
// COMPONENTS
// ============================================================

// Access Method Selector
function AccessMethodCard({
  method,
  icon,
  title,
  description,
  isSelected,
  onClick,
}: {
  method: AccessMethod;
  icon: React.ReactNode;
  title: string;
  description: string;
  isSelected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`
        w-full p-4 rounded-xl border-2 text-left transition-all
        ${isSelected 
          ? 'border-blue-500 bg-blue-50' 
          : 'border-slate-200 bg-white hover:border-slate-300'
        }
      `}
    >
      <div className="flex items-start gap-3">
        <div className={`
          p-2 rounded-lg
          ${isSelected ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-600'}
        `}>
          {icon}
        </div>
        <div>
          <h3 className={`font-semibold ${isSelected ? 'text-blue-900' : 'text-slate-900'}`}>
            {title}
          </h3>
          <p className="text-sm text-slate-500 mt-0.5">{description}</p>
        </div>
      </div>
    </button>
  );
}

// Skeleton Loading
function TripCardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 animate-pulse">
      <div className="flex items-center justify-between mb-4">
        <div className="h-6 w-32 bg-slate-200 rounded-lg"></div>
        <div className="h-6 w-24 bg-slate-200 rounded-full"></div>
      </div>
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <div className="h-8 w-20 bg-slate-200 rounded mb-2"></div>
          <div className="h-4 w-32 bg-slate-100 rounded"></div>
        </div>
        <div className="flex-shrink-0 flex flex-col items-center gap-2">
          <div className="w-3 h-3 bg-slate-200 rounded-full"></div>
          <div className="w-px h-12 bg-slate-200"></div>
          <div className="w-3 h-3 bg-slate-200 rounded-full"></div>
        </div>
        <div className="flex-1 text-right">
          <div className="h-8 w-20 bg-slate-200 rounded mb-2 ml-auto"></div>
          <div className="h-4 w-32 bg-slate-100 rounded ml-auto"></div>
        </div>
      </div>
    </div>
  );
}

// Operator Badge
function OperatorBadge({ operator }: { operator: string }) {
  const config = getOperatorConfig(operator);
  return (
    <span className={`
      inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold
      ${config.color} ${config.textColor}
    `}>
      <Train className="w-3 h-3" />
      {operator}
    </span>
  );
}

// Status Badge
function StatusBadge({ status }: { status: string }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  return (
    <span className={`
      inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium
      ${config.color} ${config.bgColor}
    `}>
      {config.icon}
      {config.label}
    </span>
  );
}

// Today Badge (Pulse animation)
function TodayBadge() {
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-600 text-white">
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
      </span>
      BUGÜN
    </span>
  );
}

// Trip Card
function TripCard({ 
  trip, 
  token,
  onDownloadPdf 
}: { 
  trip: Trip; 
  token?: string;
  onDownloadPdf: (tripId: number) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  
  const tripIsToday = isToday(trip.departureDate);
  const tripIsUpcoming = isUpcoming(trip.departureDate);
  const daysUntil = getDaysUntil(trip.departureDate);
  const statusConfig = STATUS_CONFIG[trip.status] || STATUS_CONFIG.pending;

  const handleCopyPnr = async () => {
    const textToCopy = trip.pnr || trip.orderId;
    await navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAddToCalendar = async () => {
    if (!token) { alert('Takvime eklemek için giriş yapmalısınız'); return; }
    try {
      const links = await getCalendarLinks(trip.id, token);
      window.open(links.googleCalendarUrl, '_blank');
    } catch (err) {
      const startDate = new Date(`${trip.departureDate}T${trip.departureTime || '00:00'}`);
      const endDate = new Date(`${trip.departureDate}T${trip.arrivalTime || '00:00'}`);
      const googleUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent('🚂 ' + trip.fromStation + ' → ' + trip.toStation)}&dates=${startDate.toISOString().replace(/[-:]/g, '').split('.')[0]}Z/${endDate.toISOString().replace(/[-:]/g, '').split('.')[0]}Z`;
      window.open(googleUrl, '_blank');
    }
  };

  const handleDownloadIcal = async () => {
    if (!token) { alert('iCal indirmek için giriş yapmalısınız'); return; }
    try { await downloadIcal(trip.id, token); } catch (err) { alert('iCal dosyası indirilemedi'); }
  };

  const handleWhatsAppShare = async () => {
    if (!token) { alert('Paylaşmak için giriş yapmalısınız'); return; }
    try { await shareViaWhatsApp(trip.id, token); } catch (err) { alert('WhatsApp paylaşımı başarısız'); }
  };

  const handleResendEmail = async () => {
    if (!token) { alert('Email göndermek için giriş yapmalısınız'); return; }
    try { const result = await resendEmail(trip.id, token); alert(result.message); } catch (err) { alert('Email gönderilemedi'); }
  };

  const handleShare = async () => {
    const shareData = {
      title: `${trip.fromStation} → ${trip.toStation}`,
      text: `🚂 Tren Bileti\n${formatDate(trip.departureDate)}\n${trip.fromStation} ${formatTime(trip.departureTime)} → ${trip.toStation} ${formatTime(trip.arrivalTime)}\nPNR: ${trip.pnr || trip.orderId}`,
    };
    
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.log('Share cancelled');
      }
    } else {
      await navigator.clipboard.writeText(shareData.text);
      alert('Bilet bilgileri kopyalandı!');
    }
  };

  return (
    <div className={`
      bg-white rounded-xl border-2 transition-all duration-300 overflow-hidden
      ${tripIsToday ? 'border-blue-400 shadow-lg shadow-blue-100' : 'border-slate-200 hover:border-slate-300'}
    `}>
      {/* Card Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-4 sm:p-6 text-left"
      >
        {/* Top Row: Date + Status */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-slate-600">
              {formatDate(trip.departureDate)}
            </span>
            {tripIsToday && <TodayBadge />}
            {!tripIsToday && tripIsUpcoming && daysUntil <= 7 && (
              <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                {daysUntil} gün kaldı
              </span>
            )}
          </div>
          <StatusBadge status={trip.status} />
        </div>

        {/* Journey Info */}
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Departure */}
          <div className="flex-1 min-w-0">
            <div className="text-2xl sm:text-3xl font-bold text-slate-900">
              {formatTime(trip.departureTime)}
            </div>
            <div className="text-sm text-slate-600 truncate mt-1">{trip.fromStation}</div>
          </div>

          {/* Timeline */}
          <div className="flex-shrink-0 flex flex-col items-center px-2">
            <div className="w-2.5 h-2.5 rounded-full bg-blue-500 ring-4 ring-blue-100"></div>
            <div className="w-0.5 h-10 sm:h-12 bg-gradient-to-b from-blue-500 via-blue-300 to-blue-500"></div>
            <div className="w-2.5 h-2.5 rounded-full bg-blue-500 ring-4 ring-blue-100"></div>
          </div>

          {/* Arrival */}
          <div className="flex-1 min-w-0 text-right">
            <div className="text-2xl sm:text-3xl font-bold text-slate-900">
              {formatTime(trip.arrivalTime)}
            </div>
            <div className="text-sm text-slate-600 truncate mt-1">{trip.toStation}</div>
          </div>
        </div>

        {/* Bottom Row: Operator + Train + Expand */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100">
          <div className="flex items-center gap-3">
            <OperatorBadge operator={trip.operator} />
            {trip.trainNumber && (
              <span className="text-sm text-slate-500">{trip.trainNumber}</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {trip.ticketClass && (
              <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded">
                {trip.ticketClass === 'standard' ? 'Standart' : 
                 trip.ticketClass === 'comfort' ? 'Business' : 
                 trip.ticketClass === 'premier' ? 'Birinci Sınıf' : trip.ticketClass}
              </span>
            )}
            <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${expanded ? 'rotate-180' : ''}`} />
          </div>
        </div>
      </button>

      {/* Expanded Details */}
      {expanded && (
        <div className="border-t border-slate-100">
          {/* Ticket Info Grid */}
          <div className="p-4 sm:p-6 bg-slate-50">
            <div className="flex flex-col lg:flex-row gap-6">
              {/* QR Code */}
              <div className="flex-shrink-0">
                <div className="w-32 h-32 bg-white rounded-xl border border-slate-200 flex items-center justify-center mx-auto lg:mx-0 overflow-hidden">
                  {token ? (
                    <img 
                      src={`${API_URL}/my-trips/${trip.id}/qr?token=${token}`}
                      alt="QR Kod"
                      className="w-full h-full object-contain p-1"
                      onError={(e) => {
                        // QR yüklenemezse placeholder göster
                        (e.target as HTMLImageElement).style.display = 'none';
                        (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                      }}
                    />
                  ) : null}
                  <div className={`text-center ${token ? 'hidden' : ''}`}>
                    <QrCode className="w-12 h-12 text-slate-400 mx-auto" />
                    <span className="text-xs text-slate-500 mt-2 block">QR Kod</span>
                  </div>
                </div>
              </div>

              {/* Ticket Details */}
              <div className="flex-1">
                <h4 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Bilet Bilgileri
                </h4>
                
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
                  {/* PNR */}
                  <div>
                    <span className="text-slate-500 block mb-1">PNR / Rezervasyon</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-900">
                        {trip.pnr || trip.orderId}
                      </span>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleCopyPnr(); }}
                        className="p-1 hover:bg-slate-200 rounded transition-colors"
                        title="Kopyala"
                      >
                        {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4 text-slate-400" />}
                      </button>
                    </div>
                  </div>

                  {/* Passenger */}
                  <div>
                    <span className="text-slate-500 block mb-1">Yolcu</span>
                    <span className="font-medium text-slate-900">{trip.passengerName}</span>
                  </div>

                  {/* Class */}
                  <div>
                    <span className="text-slate-500 block mb-1">Sınıf</span>
                    <span className="font-medium text-slate-900">
                      {trip.ticketClass === 'standard' ? 'Standart' : 
                       trip.ticketClass === 'comfort' ? 'Business' : 
                       trip.ticketClass === 'premier' ? 'Birinci Sınıf' : trip.ticketClass || '-'}
                    </span>
                  </div>

                  {/* Seat */}
                  <div>
                    <span className="text-slate-500 block mb-1">Vagon / Koltuk</span>
                    <span className="font-medium text-slate-900">
                      {trip.coach && trip.seat ? `${trip.coach} / ${trip.seat}` : 'Belirlenmedi'}
                    </span>
                  </div>

                  {/* Operator */}
                  <div>
                    <span className="text-slate-500 block mb-1">Operatör</span>
                    <span className="font-medium text-slate-900">{trip.operator}</span>
                  </div>

                  {/* Price */}
                  <div>
                    <span className="text-slate-500 block mb-1">Ödenen Tutar</span>
                    <span className="font-bold text-slate-900">
                      €{Number(trip.price || 0).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="p-4 flex flex-wrap gap-2 border-t border-slate-100 bg-white">
            {/* PDF Download */}
            <button 
              onClick={(e) => { e.stopPropagation(); onDownloadPdf(trip.id); }}
              className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              PDF İndir
            </button>

            {/* iCal Download */}
            <button 
              onClick={(e) => { e.stopPropagation(); handleDownloadIcal(); }}
              className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors"
            >
              <Calendar className="w-4 h-4" />
              iCal İndir
            </button>

            {/* Google Calendar */}
            <button 
              onClick={(e) => { e.stopPropagation(); handleAddToCalendar(); }}
              className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <CalendarPlus className="w-4 h-4" />
              Takvime Ekle
            </button>

            {/* Email Resend */}
            <button 
              onClick={(e) => { e.stopPropagation(); handleResendEmail(); }}
              className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <Mail className="w-4 h-4" />
              Email Gönder
            </button>

            {/* WhatsApp Share */}
            <button 
              onClick={(e) => { e.stopPropagation(); handleWhatsAppShare(); }}
              className="flex items-center gap-2 px-3 py-2 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600 transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              WhatsApp
            </button>

            {/* Share */}
            <button 
              onClick={(e) => { e.stopPropagation(); handleShare(); }}
              className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <Share2 className="w-4 h-4" />
              Paylaş
            </button>

            {/* More Actions */}
            {tripIsUpcoming && trip.status !== 'cancelled' && (
              <div className="ml-auto flex gap-2">
                {/* Change */}
                <button 
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    window.location.href = `/my-trips/exchange?bookingId=${trip.id}&token=${token}`;
                  }}
                  className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                  Değiştir
                </button>

                {/* Cancel */}
                <button 
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    window.location.href = `/my-trips/refund?bookingId=${trip.id}&token=${token}`;
                  }}
                  className="flex items-center gap-2 px-4 py-2.5 bg-red-50 border border-red-200 rounded-lg text-sm font-medium text-red-600 hover:bg-red-100 transition-colors"
                >
                  <XCircle className="w-4 h-4" />
                  İptal Et
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// MAIN COMPONENT
// ============================================================

function MyTripsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  // State
  const [trips, setTrips] = useState<{ upcoming: Trip[]; past: Trip[] }>({ upcoming: [], past: [] });
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  // Access form state
  const [showAccessForm, setShowAccessForm] = useState(true);
  const [accessMethod, setAccessMethod] = useState<AccessMethod>('email');
  const [email, setEmail] = useState('');
  const [pnr, setPnr] = useState('');
  const [lastName, setLastName] = useState('');
  
  // Token from URL
  const token = searchParams.get('token');

  // Load trips if token present
  useEffect(() => {
    if (token) {
      setShowAccessForm(false);
      fetchTrips(token);
    }
  }, [token]);

  // Fetch trips with token
  const fetchTrips = async (authToken: string) => {
    setLoading(true);
    setError('');
    
    try {
      const res = await fetch(`${API_URL}/my-trips/verify?token=${authToken}`);
      const data = await res.json();
      
      if (data.success) {
        setTrips({
          upcoming: data.data.upcoming || [],
          past: data.data.past || [],
        });
      } else {
        setError(data.message || 'Biletler yüklenirken bir hata oluştu');
        setShowAccessForm(true);
      }
    } catch (err) {
      setError('Bağlantı hatası. Lütfen tekrar deneyin.');
      setShowAccessForm(true);
    }
    
    setLoading(false);
  };

  // Handle email submit (Magic Link)
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMessage('');
    
    try {
      const res = await fetch(`${API_URL}/my-trips/request-link`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      
      if (data.success) {
        setSuccessMessage('Bilet bilgileriniz e-posta adresinize gönderildi! Lütfen gelen kutunuzu kontrol edin.');
        // Dev modda direkt token ile yönlendir
        if (data.token) {
          setTimeout(() => {
            router.push(`/my-trips?token=${data.token}`);
          }, 1500);
        }
      } else {
        setError(data.message || 'Bu e-posta adresiyle kayıtlı bilet bulunamadı.');
      }
    } catch (err) {
      setError('Bağlantı hatası. Lütfen tekrar deneyin.');
    }
    
    setLoading(false);
  };

  // Handle PNR search
  const handlePnrSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const res = await fetch(`${API_URL}/my-trips/order/${pnr}`);
      const data = await res.json();
      
      if (data.success && data.data) {
        // Tek bilet bulundu
        setTrips({
          upcoming: isUpcoming(data.data.departureDate) ? [data.data] : [],
          past: !isUpcoming(data.data.departureDate) ? [data.data] : [],
        });
        setShowAccessForm(false);
      } else {
        setError('Bu PNR numarasıyla kayıtlı bilet bulunamadı.');
      }
    } catch (err) {
      setError('Bilet bulunamadı. PNR numarasını kontrol edin.');
    }
    
    setLoading(false);
  };

  // Handle PDF download
  const handleDownloadPdf = async (tripId: number) => {
    if (!token) {
      setError('PDF indirmek için geçerli bir oturum gerekli');
      return;
    }
    // Yeni sekmede aç - tarayıcı otomatik indirecek
    window.open(`${API_URL}/my-trips/${tripId}/pdf?token=${token}`, '_blank');
  };

  // Count totals
  const totalUpcoming = trips.upcoming.length;
  const totalPast = trips.past.length;
  const currentTrips = activeTab === 'upcoming' ? trips.upcoming : trips.past;

  // ============================================================
  // RENDER: Access Form
  // ============================================================
  if (showAccessForm) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
        {/* Header */}
        <header className="bg-white border-b border-slate-200">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <Link href="/" className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200">
                  <Train className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold text-slate-900">EuroTrain</span>
              </Link>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="max-w-lg mx-auto px-4 py-12">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-8 text-center text-white">
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Ticket className="w-8 h-8" />
              </div>
              <h1 className="text-2xl font-bold">Biletlerim</h1>
              <p className="text-blue-100 mt-2">
                Tren biletlerinize erişmek için bir yöntem seçin
              </p>
            </div>

            {/* Access Methods */}
            <div className="p-6">
              <div className="space-y-3 mb-6">
                <AccessMethodCard
                  method="email"
                  icon={<Mail className="w-5 h-5" />}
                  title="E-posta ile Erişim"
                  description="Size bir erişim linki göndereceğiz"
                  isSelected={accessMethod === 'email'}
                  onClick={() => setAccessMethod('email')}
                />
                <AccessMethodCard
                  method="pnr"
                  icon={<Search className="w-5 h-5" />}
                  title="PNR / Rezervasyon No"
                  description="Biletinizi PNR numarası ile bulun"
                  isSelected={accessMethod === 'pnr'}
                  onClick={() => setAccessMethod('pnr')}
                />
              </div>

              {/* Error/Success Messages */}
              {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {successMessage && (
                <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <span>{successMessage}</span>
                </div>
              )}

              {/* Email Form */}
              {accessMethod === 'email' && (
                <form onSubmit={handleEmailSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      E-posta Adresi
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="ornek@email.com"
                      required
                      disabled={loading}
                    />
                    <p className="text-xs text-slate-500 mt-2">
                      Rezervasyon sırasında kullandığınız e-posta adresini girin
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3.5 rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Gönderiliyor...
                      </>
                    ) : (
                      <>
                        <Mail className="w-5 h-5" />
                        Erişim Linki Gönder
                      </>
                    )}
                  </button>
                </form>
              )}

              {/* PNR Form */}
              {accessMethod === 'pnr' && (
                <form onSubmit={handlePnrSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      PNR / Rezervasyon Numarası
                    </label>
                    <input
                      type="text"
                      value={pnr}
                      onChange={(e) => setPnr(e.target.value.toUpperCase())}
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all font-mono text-lg tracking-wider"
                      placeholder="ET-XXXXXX"
                      required
                      disabled={loading}
                    />
                    <p className="text-xs text-slate-500 mt-2">
                      Onay e-postanızda bulunan rezervasyon numarasını girin
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3.5 rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Aranıyor...
                      </>
                    ) : (
                      <>
                        <Search className="w-5 h-5" />
                        Biletimi Bul
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100">
              <p className="text-xs text-slate-500 text-center">
                Yardıma mı ihtiyacınız var?{' '}
                <Link href="/contact" className="text-blue-600 hover:underline">
                  Müşteri hizmetlerimizle iletişime geçin
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ============================================================
  // RENDER: Trips List
  // ============================================================
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link href="/" className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200">
                  <Train className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold text-slate-900 hidden sm:block">EuroTrain</span>
              </Link>
            </div>
            
            <Link
              href="/"
              className="flex items-center gap-2 text-slate-600 hover:text-blue-600 transition-colors text-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Ana Sayfa</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Page Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Page Title */}
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Biletlerim</h1>
          <p className="text-slate-600 mt-1">Tüm tren biletlerinizi buradan yönetin</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('upcoming')}
            className={`
              flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2
              ${activeTab === 'upcoming' 
                ? 'bg-white text-blue-600 shadow-sm' 
                : 'text-slate-600 hover:text-slate-900'
              }
            `}
          >
            <Calendar className="w-4 h-4" />
            Yaklaşan
            {totalUpcoming > 0 && (
              <span className={`
                px-2 py-0.5 rounded-full text-xs
                ${activeTab === 'upcoming' ? 'bg-blue-100 text-blue-600' : 'bg-slate-200 text-slate-600'}
              `}>
                {totalUpcoming}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('past')}
            className={`
              flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2
              ${activeTab === 'past' 
                ? 'bg-white text-blue-600 shadow-sm' 
                : 'text-slate-600 hover:text-slate-900'
              }
            `}
          >
            <Clock className="w-4 h-4" />
            Geçmiş
            {totalPast > 0 && (
              <span className={`
                px-2 py-0.5 rounded-full text-xs
                ${activeTab === 'past' ? 'bg-blue-100 text-blue-600' : 'bg-slate-200 text-slate-600'}
              `}>
                {totalPast}
              </span>
            )}
          </button>
        </div>

        {/* Loading */}
        {loading && (
          <div className="space-y-4">
            <TripCardSkeleton />
            <TripCardSkeleton />
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div className="p-6 bg-red-50 border border-red-200 rounded-xl text-red-700 flex items-start gap-3">
            <AlertCircle className="w-6 h-6 flex-shrink-0" />
            <div>
              <h3 className="font-semibold">Bir hata oluştu</h3>
              <p className="text-sm mt-1">{error}</p>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && currentTrips.length === 0 && (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Ticket className="w-10 h-10 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              {activeTab === 'upcoming' ? 'Yaklaşan seyahatiniz yok' : 'Geçmiş seyahatiniz yok'}
            </h3>
            <p className="text-slate-600 mb-6">
              {activeTab === 'upcoming' 
                ? 'Yeni bir seyahat planlamaya ne dersiniz?' 
                : 'Henüz tamamlanmış seyahatiniz bulunmuyor.'
              }
            </p>
            {activeTab === 'upcoming' && (
              <Link
                href="/"
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors"
              >
                <Search className="w-5 h-5" />
                Bilet Ara
              </Link>
            )}
          </div>
        )}

        {/* Trips List */}
        {!loading && !error && currentTrips.length > 0 && (
          <div className="space-y-4">
            {currentTrips.map((trip) => (
              <TripCard 
                key={trip.id} 
                trip={trip} 
                token={token || undefined}
                onDownloadPdf={handleDownloadPdf}
              />
            ))}
          </div>
        )}

        {/* Bottom CTA */}
        {!loading && currentTrips.length > 0 && activeTab === 'upcoming' && (
          <div className="mt-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h3 className="font-semibold text-slate-900">Yeni bir seyahat mi planlıyorsunuz?</h3>
                <p className="text-sm text-slate-600 mt-1">Avrupa'nın dört bir yanına uygun fiyatlı biletler</p>
              </div>
              <Link
                href="/"
                className="flex-shrink-0 px-5 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <Search className="w-4 h-4" />
                Bilet Ara
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================
// EXPORT
// ============================================================

export default function MyTripsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Yükleniyor...</p>
        </div>
      </div>
    }>
      <MyTripsContent />
    </Suspense>
  );
}
