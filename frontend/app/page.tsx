'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Train, MapPin, Calendar, Users, Search, ArrowRightLeft,
  ChevronDown, X, Loader2, Clock, Star, Shield, CreditCard
} from 'lucide-react';
import { searchStations, Station } from '@/lib/api/client';

export default function HomePage() {
  const router = useRouter();
  
  // Form state
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [departureDate, setDepartureDate] = useState('');
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
    const today = new Date().toISOString().split('T')[0];
    setDepartureDate(today);
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

  // Search stations for autocomplete
  const handleOriginSearch = async (query: string) => {
    setOrigin(query);
    setSelectedOrigin(null);
    
    if (query.length >= 2) {
      setIsSearchingOrigin(true);
      try {
        const stations = await searchStations(query);
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
        const stations = await searchStations(query);
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

  // Form submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedOrigin || !selectedDestination || !departureDate) {
      alert('Lütfen tüm alanları doldurun');
      return;
    }

    const searchParams = new URLSearchParams({
      origin: selectedOrigin.code,
      destination: selectedDestination.code,
      date: departureDate,
      adults: passengers.adults.toString(),
      children: passengers.children.toString(),
    });

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
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <Train className="w-7 h-7 text-white" />
              </div>
              <span className="text-2xl font-bold text-white">EuroTrain</span>
            </Link>

            {/* Navigation */}
            <nav className="hidden md:flex items-center gap-6">
              <Link href="/my-trips" className="text-white/80 hover:text-white transition-colors">
                Biletlerim
              </Link>
              <Link href="/admin" className="text-white/80 hover:text-white transition-colors">
                Yönetim
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center mb-12">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6">
            Avrupa&apos;yı Trenle Keşfedin
          </h1>
          <p className="text-xl text-white/80 max-w-2xl mx-auto">
            30+ ülke, 10.000+ destinasyon. En uygun fiyatlarla tren bileti alın.
          </p>
        </div>

        {/* Search Form */}
        <div className="max-w-4xl mx-auto">
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-2xl p-6 md:p-8">
            {/* Station Inputs */}
            <div className="grid md:grid-cols-2 gap-4 mb-4 relative">
              {/* Origin */}
              <div ref={originRef} className="relative">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Nereden
                </label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    value={origin}
                    onChange={(e) => handleOriginSearch(e.target.value)}
                    onFocus={() => originSuggestions.length > 0 && setShowOriginSuggestions(true)}
                    placeholder="Şehir veya istasyon"
                    className="w-full pl-12 pr-10 py-4 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-slate-900 placeholder-slate-400"
                  />
                  {isSearchingOrigin && (
                    <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-500 animate-spin" />
                  )}
                  {origin && !isSearchingOrigin && (
                    <button
                      type="button"
                      onClick={() => { setOrigin(''); setSelectedOrigin(null); }}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>
                
                {/* Origin Suggestions */}
                {showOriginSuggestions && originSuggestions.length > 0 && (
                  <div className="absolute z-50 w-full mt-2 bg-white border border-slate-200 rounded-xl shadow-lg max-h-60 overflow-auto">
                    {originSuggestions.map((station) => (
                      <button
                        key={station.code}
                        type="button"
                        onClick={() => selectOrigin(station)}
                        className="w-full px-4 py-3 text-left hover:bg-slate-50 flex items-center gap-3 transition-colors"
                      >
                        <MapPin className="w-4 h-4 text-slate-400" />
                        <div>
                          <div className="font-medium text-slate-900">{station.name}</div>
                          <div className="text-sm text-slate-500">{station.city}, {station.country}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Swap Button */}
              <button
                type="button"
                onClick={swapStations}
                className="absolute left-1/2 top-[52px] -translate-x-1/2 z-10 w-10 h-10 bg-white border-2 border-slate-200 rounded-full flex items-center justify-center hover:bg-slate-50 hover:border-blue-300 transition-all shadow-sm hidden md:flex"
              >
                <ArrowRightLeft className="w-4 h-4 text-slate-600" />
              </button>

              {/* Destination */}
              <div ref={destinationRef} className="relative">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Nereye
                </label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    value={destination}
                    onChange={(e) => handleDestinationSearch(e.target.value)}
                    onFocus={() => destinationSuggestions.length > 0 && setShowDestinationSuggestions(true)}
                    placeholder="Şehir veya istasyon"
                    className="w-full pl-12 pr-10 py-4 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-slate-900 placeholder-slate-400"
                  />
                  {isSearchingDestination && (
                    <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-500 animate-spin" />
                  )}
                  {destination && !isSearchingDestination && (
                    <button
                      type="button"
                      onClick={() => { setDestination(''); setSelectedDestination(null); }}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>
                
                {/* Destination Suggestions */}
                {showDestinationSuggestions && destinationSuggestions.length > 0 && (
                  <div className="absolute z-50 w-full mt-2 bg-white border border-slate-200 rounded-xl shadow-lg max-h-60 overflow-auto">
                    {destinationSuggestions.map((station) => (
                      <button
                        key={station.code}
                        type="button"
                        onClick={() => selectDestination(station)}
                        className="w-full px-4 py-3 text-left hover:bg-slate-50 flex items-center gap-3 transition-colors"
                      >
                        <MapPin className="w-4 h-4 text-slate-400" />
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

            {/* Date and Passengers */}
            <div className="grid md:grid-cols-2 gap-4 mb-6">
              {/* Date */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Gidiş Tarihi
                </label>
                <div className="relative">
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="date"
                    value={departureDate}
                    onChange={(e) => setDepartureDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full pl-12 pr-4 py-4 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-slate-900"
                  />
                </div>
              </div>

              {/* Passengers */}
              <div ref={passengerRef} className="relative">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Yolcular
                </label>
                <button
                  type="button"
                  onClick={() => setShowPassengerDropdown(!showPassengerDropdown)}
                  className="w-full pl-12 pr-4 py-4 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-slate-900 text-left flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <Users className="absolute left-4 w-5 h-5 text-slate-400" />
                    <span className="ml-6">
                      {passengers.adults} Yetişkin{passengers.children > 0 && `, ${passengers.children} Çocuk`}
                    </span>
                  </div>
                  <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${showPassengerDropdown ? 'rotate-180' : ''}`} />
                </button>

                {/* Passenger Dropdown */}
                {showPassengerDropdown && (
                  <div className="absolute z-50 w-full mt-2 bg-white border border-slate-200 rounded-xl shadow-lg p-4">
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
              <h3 className="text-lg font-semibold text-slate-900 mb-2">30+ Ülke</h3>
              <p className="text-slate-600">Avrupa genelinde binlerce destinasyon</p>
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