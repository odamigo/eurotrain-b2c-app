'use client';

import { useState, useEffect, useRef } from 'react';
import { MapPin, Loader2 } from 'lucide-react';
import { searchPlaces, EraPlace } from '@/lib/api/era-client';

interface StationAutocompleteProps {
  value: string;
  onChange: (value: string, place?: EraPlace) => void;
  placeholder?: string;
  label?: string;
  icon?: React.ReactNode;
  className?: string;
}

export function StationAutocomplete({
  value,
  onChange,
  placeholder = 'Şehir veya istasyon ara...',
  label,
  icon,
  className = '',
}: StationAutocompleteProps) {
  const [query, setQuery] = useState(value);
  const [suggestions, setSuggestions] = useState<EraPlace[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState<EraPlace | null>(null);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>();

  // Update query when value prop changes
  useEffect(() => {
    if (value !== query && !selectedPlace) {
      setQuery(value);
    }
  }, [value]);

  // Search places with debounce
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (query.length < 2) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    // Don't search if we just selected a place
    if (selectedPlace && query === selectedPlace.label) {
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setIsLoading(true);
      try {
        const places = await searchPlaces(query, { size: 8 });
        setSuggestions(places);
        setIsOpen(places.length > 0);
      } catch (error) {
        console.error('Search error:', error);
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setQuery(newValue);
    setSelectedPlace(null);
    
    // Clear the selected code if user is typing
    if (newValue !== selectedPlace?.label) {
      onChange('', undefined);
    }
  };

  const handleSelect = (place: EraPlace) => {
    setQuery(place.label);
    setSelectedPlace(place);
    setSuggestions([]);
    setIsOpen(false);
    onChange(place.code, place);
  };

  const handleFocus = () => {
    if (suggestions.length > 0) {
      setIsOpen(true);
    }
  };

  const getPlaceIcon = (type: string) => {
    if (type === 'city') {
      return (
        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
          <MapPin className="w-4 h-4 text-blue-600" />
        </div>
      );
    }
    return (
      <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center">
        <svg className="w-4 h-4 text-slate-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="4" y="4" width="16" height="16" rx="2" />
          <path d="M4 10h16" />
          <path d="M10 4v16" />
        </svg>
      </div>
    );
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-slate-700 mb-2">
          {label}
        </label>
      )}
      
      <div className="relative">
        {icon && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
            {icon}
          </div>
        )}
        
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={handleFocus}
          placeholder={placeholder}
          className={`
            w-full py-3 border border-slate-200 rounded-xl
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
            transition-all duration-200
            ${icon ? 'pl-12 pr-10' : 'pl-4 pr-10'}
          `}
          autoComplete="off"
        />
        
        {isLoading && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2">
            <Loader2 className="w-5 h-5 text-slate-400 animate-spin" />
          </div>
        )}
        
        {selectedPlace && !isLoading && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2">
            <div className="w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center">
              <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
        )}
      </div>

      {/* Dropdown */}
      {isOpen && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-2 bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
          <ul className="max-h-80 overflow-y-auto">
            {suggestions.map((place, index) => (
              <li key={place.id || index}>
                <button
                  type="button"
                  onClick={() => handleSelect(place)}
                  className="w-full px-4 py-3 flex items-center gap-3 hover:bg-slate-50 transition-colors text-left"
                >
                  {getPlaceIcon(place.type)}
                  
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-slate-900 truncate">
                      {place.label}
                    </div>
                    <div className="text-sm text-slate-500 truncate">
                      {place.type === 'city' ? 'Şehir' : 'İstasyon'}
                      {place.country?.label && ` • ${place.country.label}`}
                    </div>
                  </div>
                  
                  <div className="text-xs text-slate-400 uppercase">
                    {place.code}
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default StationAutocomplete;
