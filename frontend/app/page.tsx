'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Train, MapPin, Calendar, Users, Search, ArrowRightLeft,
  ChevronDown, X, Loader2, Clock, Star, Shield, CreditCard,
  ArrowRight, RotateCcw, Check, Zap
} from 'lucide-react';
import { searchPlaces, EraPlace } from '@/lib/api/era-client';
import GoogleSignInButton from '@/components/GoogleSignInButton';

// Station type for backward compatibility
interface Station {
  code: string;
  name: string;
  city: string;
  country: string;
}

// Convert EraPlace to Station
function placeToStation(place: EraPlace): Station {
  return {
    code: place.code,
    name: place.label,
    city: place.localLabel || place.label,
    country: place.country?.label || '',
  };
}

// Trip Type Toggle Component
function TripTypeToggle({ 
  isRoundTrip, 
  onChange 
}: { 
  isRoundTrip: boolean; 
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <button
        type="button"
        onClick={() => onChange(false)}
        className={`
          flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all
          ${!isRoundTrip 
            ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25' 
            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }
        `}
      >
        <ArrowRight className="w-4 h-4" />
        <span>Tek Yön</span>
      </button>
      <button
        type="button"
        onClick={() => onChange(true)}
        className={`
          flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all
          ${isRoundTrip 
            ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25' 
            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }
        `}
      >
        <RotateCcw className="w-4 h-4" />
        <span>Gidiş-Dönüş</span>
      </button>
    </div>
  );
}

// ============================================================
// DATE PILLS COMPONENT - UX İYİLEŞTİRME
// ============================================================
function DatePills({ 
  onSelect, 
  selectedDate 
}: { 
  onSelect: (date: string) => void;
  selectedDate: string;
}) {
  const today = new Date();
  
  // Yarın
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  // Bu Hafta Sonu (Cumartesi)
  const daysUntilSaturday = (6 - today.getDay() + 7) % 7 || 7;
  const thisWeekend = new Date(today);
  thisWeekend.setDate(today.getDate() + daysUntilSaturday);
  
  // Gelecek Hafta Sonu
  const nextWeekend = new Date(thisWeekend);
  nextWeekend.setDate(thisWeekend.getDate() + 7);

  const pills = [
    { label: 'Bugün', date: today },
    { label: 'Yarın', date: tomorrow },
    { label: 'Bu Hafta Sonu', date: thisWeekend },
    { label: 'Gelecek Hafta Sonu', date: nextWeekend },
  ];

  const formatToISO = (d: Date) => d.toISOString().split('T')[0];

  return (
    <div className="flex flex-wrap gap-2 mb-3">
      {pills.map((pill) => {
        const dateStr = formatToISO(pill.date);
        const isSelected = selectedDate === dateStr;
        return (
          <button
            key={pill.label}
            type="button"
            onClick={() => onSelect(dateStr)}
            className={`
              px-3 py-1.5 rounded-full text-xs font-medium transition-all
              ${isSelected 
                ? 'bg-blue-600 text-white' 
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }
            `}
          >
            {pill.label}
          </button>
        );
      })}
    </div>
  );
}

export default function HomePage() {
  const router = useRouter();
  const departureDateInputRef = useRef<HTMLInputElement>(null);
  const returnDateInputRef = useRef<HTMLInputElement>(null);
  
  // Form state
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [departureDate, setDepartureDate] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [isRoundTrip, setIsRoundTrip] = useState(false);
  const [directOnly, setDirectOnly] = useState(false);
  const [passengers, setPassengers] = useState({ adults: 1, children: 0 });
  const [showPassengerDropdown, setShowPassengerDropdown] = useState(false);
  const [mounted, setMounted] = useState(false);
  
  // Autocomplete state
  const [originSuggestions, setOriginSuggestions] = useState<Station[]>([]);
  const [destinationSuggestions, setDestinationSuggestions] = useState<Station[]>([]);
  const [selectedOrigin, setSelectedOrigin] = useState<Station | null>(null);
  const [selectedDestination, setSelectedDestination] = useState<Station | null>(null);
  const [showOriginSuggestions, setShowOriginSuggestions] = useState(false);
  const [showDestinationSuggestions, setShowDestinationSuggestions] = useState(false);
  const [isSearchingOrigin, setIsSearchingOrigin] = useState(false);
  const [isSearchingDestination, setIsSearchingDestination] = useState(false);

  // Refs for click outside
  const originRef = useRef<HTMLDivElement>(null);
  const destinationRef = useRef<HTMLDivElement>(null);
  const passengerRef = useRef<HTMLDivElement>(null);

  // Set initial date only once on mount
  useEffect(() => {
    setMounted(true);
    const today = new Date();
    setDepartureDate(today.toISOString().split('T')[0]);
    
    // Set default return date to departure + 7 days
    const defaultReturn = new Date(today);
    defaultReturn.setDate(defaultReturn.getDate() + 7);
    setReturnDate(defaultReturn.toISOString().split('T')[0]);
  }, []);

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (originRef.current && !originRef.current.contains(event.target as Node)) {
        setShowOriginSuggestions(false);
      }
      if (destinationRef.current && !destinationRef.current.contains(event.target as Node)) {
        setShowDestinationSuggestions(false);
      }
      if (passengerRef.current && !passengerRef.current.contains(event.target as Node)) {
        setShowPassengerDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Ensure return date is after departure date
  useEffect(() => {
    if (departureDate && returnDate && new Date(returnDate) < new Date(departureDate)) {
      const newReturnDate = new Date(departureDate);
      newReturnDate.setDate(newReturnDate.getDate() + 1);
      setReturnDate(newReturnDate.toISOString().split('T')[0]);
    }
  }, [departureDate, returnDate]);

  // Search stations for autocomplete - UPDATED for ERA API
  const handleOriginSearch = async (query: string) => {
    setOrigin(query);
    setSelectedOrigin(null);
    
    if (query.length >= 2) {
      setIsSearchingOrigin(true);
      try {
        const places = await searchPlaces(query, { size: 8 });
        const stations = places.map(placeToStation);
        setOriginSuggestions(stations);
        setShowOriginSuggestions(true);
      } catch (error) {
        console.error('İstasyon arama hatası:', error);
        setOriginSuggestions([]);
      } finally {
        setIsSearchingOrigin(false);
      }
    } else {
      setOriginSuggestions([]);
      setShowOriginSuggestions(false);
    }
  };

  const handleDestinationSearch = async (query: string) => {
    setDestination(query);
    setSelectedDestination(null);
    
    if (query.length >= 2) {
      setIsSearchingDestination(true);
      try {
        const places = await searchPlaces(query, { size: 8 });
        const stations = places.map(placeToStation);
        setDestinationSuggestions(stations);
        setShowDestinationSuggestions(true);
      } catch (error) {
        console.error('İstasyon arama hatası:', error);
        setDestinationSuggestions([]);
      } finally {
        setIsSearchingDestination(false);
      }
    } else {
      setDestinationSuggestions([]);
      setShowDestinationSuggestions(false);
    }
  };

  // Select station
  const selectOrigin = (station: Station) => {
    setSelectedOrigin(station);
    setOrigin(`${station.name}, ${station.city}`);
    setShowOriginSuggestions(false);
  };

  const selectDestination = (station: Station) => {
    setSelectedDestination(station);
    setDestination(`${station.name}, ${station.city}`);
    setShowDestinationSuggestions(false);
  };

  // Swap stations
  const swapStations = () => {
    const tempOrigin = origin;
    const tempSelectedOrigin = selectedOrigin;
    
    setOrigin(destination);
    setSelectedOrigin(selectedDestination);
    setDestination(tempOrigin);
    setSelectedDestination(tempSelectedOrigin);
  };

  // Passenger count handlers
  const updatePassengers = (type: 'adults' | 'children', delta: number) => {
    setPassengers(prev => ({
      ...prev,
      [type]: Math.max(type === 'adults' ? 1 : 0, Math.min(9, prev[type] + delta))
    }));
  };

  // Open date picker programmatically
  const openDepartureDatePicker = () => {
    if (departureDateInputRef.current) {
      departureDateInputRef.current.showPicker?.();
      departureDateInputRef.current.focus();
    }
  };

  const openReturnDatePicker = () => {
    if (returnDateInputRef.current) {
      returnDateInputRef.current.showPicker?.();
      returnDateInputRef.current.focus();
    }
  };

  // Format date for display
  const formatDateDisplay = (dateStr: string) => {
    if (!dateStr) return 'Tarih Seçin';
    try {
      const date = new Date(dateStr + 'T00:00:00');
      return date.toLocaleDateString('tr-TR', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        weekday: 'short'
      });
    } catch {
      return dateStr;
    }
  };

  // Form submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedOrigin || !selectedDestination || !departureDate) {
      alert('Lütfen tüm alanları doldurun');
      return;
    }

    if (isRoundTrip && !returnDate) {
      alert('Lütfen dönüş tarihini seçin');
      return;
    }

    const searchParams = new URLSearchParams({
      origin: selectedOrigin.code,
      destination: selectedDestination.code,
      date: departureDate,
      adults: passengers.adults.toString(),
      children: passengers.children.toString(),
    });

    // Add round-trip params
    if (isRoundTrip && returnDate) {
      searchParams.set('returnDate', returnDate);
      searchParams.set('tripType', 'roundtrip');
    } else {
      searchParams.set('tripType', 'oneway');
    }

    // Add direct only filter
    if (directOnly) {
      searchParams.set('directOnly', 'true');
    }

    router.push(`/search?${searchParams.toString()}`);
  };

  // Popular routes
  const popularRoutes = [
    { from: 'Paris', to: 'Amsterdam', fromCode: 'FRPAR', toCode: 'NLAMS', price: '€39' },
    { from: 'Paris', to: 'London', fromCode: 'FRPAR', toCode: 'GBLON', price: '€49' },
    { from: 'Berlin', to: 'Prague', fromCode: 'DEBER', toCode: 'CZPRG', price: '€19' },
    { from: 'Milano', to: 'Rome', fromCode: 'ITMIL', toCode: 'ITROM', price: '€29' },
  ];

  const handlePopularRoute = (route: typeof popularRoutes[0]) => {
    setOrigin(route.from);
    setDestination(route.to);
    setSelectedOrigin({ code: route.fromCode, name: route.from, city: route.from, country: '' });
    setSelectedDestination({ code: route.toCode, name: route.to, city: route.to, country: '' });
  };

  // Don't render until mounted to avoid hydration mismatch
  if (!mounted) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-white animate-spin" />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700">
      {/* Header */}
      <header className="absolute top-0 left-0 right-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
                <Train className="w-5 h-5 text-white" />
              </div>
              <span className="text-2xl font-bold text-white">EuroTrain</span>
            </Link>
            
            <nav className="flex items-center gap-4">
              <Link href="/my-trips" className="text-white/80 hover:text-white transition-colors">
                Biletlerim
              </Link>
              <GoogleSignInButton />
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6">
            Avrupa&apos;yı Trenle Keşfedin
          </h1>
          <p className="text-xl text-white/80 mb-4">
            30+ ülke, binlerce destinasyon. En uygun fiyatlarla tren bileti alın.
          </p>
          
          {/* ============================================================ */}
          {/* TRUST BADGE - UX İYİLEŞTİRME */}
          {/* ============================================================ */}
          <div className="flex items-center justify-center gap-2 mb-8">
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 backdrop-blur-sm rounded-full">
              <Zap className="w-4 h-4 text-amber-400" />
              <span className="text-white/90 text-sm font-medium">230+ Taşıyıcı</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 backdrop-blur-sm rounded-full">
              <Shield className="w-4 h-4 text-green-400" />
              <span className="text-white/90 text-sm font-medium">Güvenli Ödeme</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 backdrop-blur-sm rounded-full">
              <Clock className="w-4 h-4 text-blue-300" />
              <span className="text-white/90 text-sm font-medium">Anında E-Bilet</span>
            </div>
          </div>

          {/* Search Form */}
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-2xl p-6 md:p-8">
            {/* Trip Type Toggle */}
            <TripTypeToggle isRoundTrip={isRoundTrip} onChange={setIsRoundTrip} />

            {/* Origin & Destination Row */}
            <div className="grid md:grid-cols-2 gap-4 mb-4">
              {/* Origin */}
              <div ref={originRef} className="relative">
                <label className="block text-sm font-medium text-slate-700 mb-2 text-left">
                  Nereden
                </label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    value={origin}
                    onChange={(e) => handleOriginSearch(e.target.value)}
                    placeholder="Şehir veya istasyon"
                    className="w-full pl-12 pr-10 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  {isSearchingOrigin && (
                    <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-500 animate-spin" />
                  )}
                  {origin && !isSearchingOrigin && (
                    <button
                      type="button"
                      onClick={() => {
                        setOrigin('');
                        setSelectedOrigin(null);
                        setOriginSuggestions([]);
                      }}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>
                
                {/* Suggestions Dropdown */}
                {showOriginSuggestions && originSuggestions.length > 0 && (
                  <div className="absolute z-50 w-full mt-1 bg-white rounded-xl shadow-lg border border-slate-200 max-h-60 overflow-y-auto">
                    {originSuggestions.map((station, index) => (
                      <button
                        key={`${station.code}-${index}`}
                        type="button"
                        onClick={() => selectOrigin(station)}
                        className="w-full px-4 py-3 text-left hover:bg-slate-50 flex items-center gap-3 border-b border-slate-100 last:border-0"
                      >
                        <Train className="w-5 h-5 text-slate-400" />
                        <div>
                          <div className="font-medium text-slate-900">{station.name}</div>
                          <div className="text-sm text-slate-500">{station.city}, {station.country}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Swap Button - Desktop */}
              <button
                type="button"
                onClick={swapStations}
                className="hidden md:flex absolute left-1/2 top-[168px] -translate-x-1/2 w-10 h-10 bg-white border-2 border-slate-200 rounded-full items-center justify-center hover:bg-slate-50 hover:border-blue-500 transition-colors z-10"
              >
                <ArrowRightLeft className="w-4 h-4 text-slate-600" />
              </button>

              {/* Destination */}
              <div ref={destinationRef} className="relative">
                <label className="block text-sm font-medium text-slate-700 mb-2 text-left">
                  Nereye
                </label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    value={destination}
                    onChange={(e) => handleDestinationSearch(e.target.value)}
                    placeholder="Şehir veya istasyon"
                    className="w-full pl-12 pr-10 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  {isSearchingDestination && (
                    <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-500 animate-spin" />
                  )}
                  {destination && !isSearchingDestination && (
                    <button
                      type="button"
                      onClick={() => {
                        setDestination('');
                        setSelectedDestination(null);
                        setDestinationSuggestions([]);
                      }}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>
                
                {/* Suggestions Dropdown */}
                {showDestinationSuggestions && destinationSuggestions.length > 0 && (
                  <div className="absolute z-50 w-full mt-1 bg-white rounded-xl shadow-lg border border-slate-200 max-h-60 overflow-y-auto">
                    {destinationSuggestions.map((station, index) => (
                      <button
                        key={`${station.code}-${index}`}
                        type="button"
                        onClick={() => selectDestination(station)}
                        className="w-full px-4 py-3 text-left hover:bg-slate-50 flex items-center gap-3 border-b border-slate-100 last:border-0"
                      >
                        <Train className="w-5 h-5 text-slate-400" />
                        <div>
                          <div className="font-medium text-slate-900">{station.name}</div>
                          <div className="text-sm text-slate-500">{station.city}, {station.country}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Mobile Swap Button */}
            <button
              type="button"
              onClick={swapStations}
              className="md:hidden w-full mb-4 py-2 flex items-center justify-center gap-2 text-sm text-slate-600 hover:text-blue-600 transition-colors"
            >
              <ArrowRightLeft className="w-4 h-4" />
              <span>İstasyonları Değiştir</span>
            </button>

            {/* ============================================================ */}
            {/* DATE PILLS - UX İYİLEŞTİRME */}
            {/* ============================================================ */}
            <DatePills selectedDate={departureDate} onSelect={setDepartureDate} />

            {/* Dates Row */}
            <div className={`grid ${isRoundTrip ? 'md:grid-cols-2' : 'md:grid-cols-1'} gap-4 mb-4`}>
              {/* Departure Date */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2 text-left">
                  {isRoundTrip ? 'Gidiş Tarihi' : 'Tarih'}
                </label>
                <button
                  type="button"
                  onClick={openDepartureDatePicker}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-left flex items-center gap-3 hover:border-slate-300 transition-colors"
                >
                  <Calendar className="w-5 h-5 text-slate-400" />
                  <span className={departureDate ? 'text-slate-900' : 'text-slate-400'}>
                    {formatDateDisplay(departureDate)}
                  </span>
                </button>
                <input
                  ref={departureDateInputRef}
                  type="date"
                  value={departureDate}
                  onChange={(e) => setDepartureDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="sr-only"
                />
              </div>

              {/* Return Date - Only shown for round-trip */}
              {isRoundTrip && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2 text-left">
                    Dönüş Tarihi
                  </label>
                  <button
                    type="button"
                    onClick={openReturnDatePicker}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-left flex items-center gap-3 hover:border-slate-300 transition-colors"
                  >
                    <Calendar className="w-5 h-5 text-slate-400" />
                    <span className={returnDate ? 'text-slate-900' : 'text-slate-400'}>
                      {formatDateDisplay(returnDate)}
                    </span>
                  </button>
                  <input
                    ref={returnDateInputRef}
                    type="date"
                    value={returnDate}
                    onChange={(e) => setReturnDate(e.target.value)}
                    min={departureDate || new Date().toISOString().split('T')[0]}
                    className="sr-only"
                  />
                </div>
              )}
            </div>

            {/* Passengers & Options Row */}
            <div className="grid md:grid-cols-2 gap-4 mb-6">
              {/* Passengers */}
              <div ref={passengerRef} className="relative">
                <label className="block text-sm font-medium text-slate-700 mb-2 text-left">
                  Yolcular
                </label>
                <button
                  type="button"
                  onClick={() => setShowPassengerDropdown(!showPassengerDropdown)}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-left flex items-center justify-between hover:border-slate-300 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Users className="w-5 h-5 text-slate-400" />
                    <span className="text-slate-900">
                      {passengers.adults} Yetişkin
                      {passengers.children > 0 && `, ${passengers.children} Çocuk`}
                    </span>
                  </div>
                  <ChevronDown className="w-5 h-5 text-slate-400" />
                </button>
                
                {/* Passenger Dropdown */}
                {showPassengerDropdown && (
                  <div className="absolute z-50 w-full mt-2 bg-white rounded-xl shadow-lg border border-slate-200 p-4">
                    {/* Adults */}
                    <div className="flex items-center justify-between py-3">
                      <div>
                        <div className="font-medium text-slate-900">Yetişkin</div>
                        <div className="text-sm text-slate-500">12+ yaş</div>
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => updatePassengers('adults', -1)}
                          disabled={passengers.adults <= 1}
                          className="w-8 h-8 rounded-full border border-slate-300 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50"
                        >
                          -
                        </button>
                        <span className="w-8 text-center font-medium">{passengers.adults}</span>
                        <button
                          type="button"
                          onClick={() => updatePassengers('adults', 1)}
                          disabled={passengers.adults >= 9}
                          className="w-8 h-8 rounded-full border border-slate-300 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    {/* Children */}
                    <div className="flex items-center justify-between py-3 border-t border-slate-100">
                      <div>
                        <div className="font-medium text-slate-900">Çocuk</div>
                        <div className="text-sm text-slate-500">4-11 yaş</div>
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => updatePassengers('children', -1)}
                          disabled={passengers.children <= 0}
                          className="w-8 h-8 rounded-full border border-slate-300 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50"
                        >
                          -
                        </button>
                        <span className="w-8 text-center font-medium">{passengers.children}</span>
                        <button
                          type="button"
                          onClick={() => updatePassengers('children', 1)}
                          disabled={passengers.children >= 9}
                          className="w-8 h-8 rounded-full border border-slate-300 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Direct Only Option */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2 text-left">
                  Seçenekler
                </label>
                <button
                  type="button"
                  onClick={() => setDirectOnly(!directOnly)}
                  className={`
                    w-full px-4 py-3 border rounded-xl text-left flex items-center gap-3 transition-all
                    ${directOnly 
                      ? 'border-blue-500 bg-blue-50 text-blue-700' 
                      : 'border-slate-200 hover:border-slate-300 text-slate-600'
                    }
                  `}
                >
                  <div className={`
                    w-5 h-5 rounded border-2 flex items-center justify-center transition-all
                    ${directOnly 
                      ? 'bg-blue-500 border-blue-500' 
                      : 'border-slate-300 bg-white'
                    }
                  `}>
                    {directOnly && <Check className="w-3 h-3 text-white" />}
                  </div>
                  <div>
                    <div className="font-medium">Sadece Direkt Seferler</div>
                    <div className="text-xs text-slate-500">Aktarmasız seyahat edin</div>
                  </div>
                </button>
              </div>
            </div>

            {/* Search Button */}
            <button
              type="submit"
              className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl text-lg"
            >
              <Search className="w-5 h-5" />
              <span>Sefer Ara</span>
            </button>
          </form>

          {/* Popular Routes */}
          <div className="mt-8">
            <h3 className="text-white/80 text-sm font-medium mb-4 text-center">Popüler Rotalar</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {popularRoutes.map((route, index) => (
                <button
                  key={index}
                  onClick={() => handlePopularRoute(route)}
                  className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-left hover:bg-white/20 transition-colors group"
                >
                  <div className="flex items-center gap-2 text-white mb-1">
                    <span className="font-medium">{route.from}</span>
                    <ArrowRightLeft className="w-3 h-3 text-white/60" />
                    <span className="font-medium">{route.to}</span>
                  </div>
                  <div className="text-white/60 text-sm">
                    {route.price}&apos;den başlayan fiyatlar
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-white py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-slate-900 text-center mb-12">
            Neden EuroTrain?
          </h2>
          
          <div className="grid md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Train className="w-7 h-7 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">230+ Taşıyıcı</h3>
              <p className="text-slate-600">Avrupa genelinde tüm tren operatörleri</p>
            </div>
            
            <div className="text-center">
              <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Shield className="w-7 h-7 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Güvenli Ödeme</h3>
              <p className="text-slate-600">256-bit SSL şifreleme ile korumalı</p>
            </div>
            
            <div className="text-center">
              <div className="w-14 h-14 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Clock className="w-7 h-7 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Anında Onay</h3>
              <p className="text-slate-600">E-biletiniz hemen email&apos;inize gelir</p>
            </div>
            
            <div className="text-center">
              <div className="w-14 h-14 bg-orange-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Star className="w-7 h-7 text-orange-600" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">7/24 Destek</h3>
              <p className="text-slate-600">Her zaman yanınızdayız</p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Train className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold">EuroTrain</span>
              </div>
              <p className="text-slate-400 text-sm">
                Avrupa&apos;nın en güvenilir tren bileti platformu.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Hızlı Linkler</h4>
              <ul className="space-y-2 text-slate-400 text-sm">
                <li><Link href="/my-trips" className="hover:text-white transition-colors">Biletlerim</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">SSS</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">İletişim</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Yasal</h4>
              <ul className="space-y-2 text-slate-400 text-sm">
                <li><Link href="#" className="hover:text-white transition-colors">Kullanım Koşulları</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Gizlilik Politikası</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">KVKK</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Ödeme Yöntemleri</h4>
              <div className="flex items-center gap-2">
                <CreditCard className="w-8 h-8 text-slate-400" />
                <span className="text-slate-400 text-sm">Visa, Mastercard, Troy</span>
              </div>
            </div>
          </div>
          
          <div className="border-t border-slate-800 pt-8 text-center text-slate-400 text-sm">
            <p>© 2026 EuroTrain. Tüm hakları saklıdır.</p>
          </div>
        </div>
      </footer>
    </main>
  );
}
