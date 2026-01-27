# Component Architecture

> **Amaç:** Search ve Booking sayfalarını modüler, test edilebilir, sürdürülebilir hale getirmek
> **Son Güncelleme:** 27 Ocak 2026

---

## 📁 Yeni Klasör Yapısı

```
frontend/
├── components/
│   ├── common/                    # Shared components
│   │   ├── AlertBanner.tsx        # Info/Warning/Error/Success alerts
│   │   ├── LoadingSpinner.tsx     # Loading states
│   │   ├── PriceDisplay.tsx       # Formatted price with currency
│   │   ├── TimeDisplay.tsx        # Time with timezone support
│   │   └── Modal.tsx              # Reusable modal wrapper
│   │
│   ├── search/                    # Search page components
│   │   ├── index.ts               # Barrel export
│   │   ├── SearchForm.tsx         # ✅ Mevcut
│   │   ├── StationAutocomplete.tsx # ✅ Mevcut
│   │   ├── JourneyCard.tsx        # ✅ Mevcut (güncellencek)
│   │   ├── JourneyList.tsx        # NEW: Journey card listesi
│   │   ├── FilterPills.tsx        # NEW: Time filters, direct only
│   │   ├── SortDropdown.tsx       # NEW: Sort options
│   │   ├── MultiSegmentTimeline.tsx # NEW: Transfer gösterimi
│   │   ├── ClassSelectionCards.tsx # NEW: Standard/Business/First
│   │   ├── ConditionsModal.tsx    # NEW: Fare rules modal
│   │   ├── SelectedJourneySummary.tsx # NEW: Sticky bar (round-trip)
│   │   ├── ProgressSteps.tsx      # NEW: Gidiş/Dönüş indicator
│   │   └── PopularRoutes.tsx      # ✅ Mevcut
│   │
│   ├── booking/                   # Booking page components
│   │   ├── index.ts               # Barrel export
│   │   ├── TravelerCard.tsx       # Yolcu bilgi kartı
│   │   ├── TravelerForm.tsx       # Yolcu form alanları
│   │   ├── SeatPreferenceSelector.tsx # Koltuk tercihi
│   │   ├── TicketingOptionsSelector.tsx # E-bilet/Print/QR
│   │   ├── PriceBreakdown.tsx     # Fiyat detayı
│   │   ├── TicketConditions.tsx   # İade/Değişiklik koşulları
│   │   ├── TermsCheckbox.tsx      # Koşullar onayı
│   │   ├── JourneySummaryCard.tsx # Sefer özet kartı
│   │   ├── BookingSuccess.tsx     # Başarılı rezervasyon
│   │   ├── PromoCodeInput.tsx     # Kampanya kodu
│   │   ├── SessionTimer.tsx       # Hold süresi countdown
│   │   └── StepIndicator.tsx      # Adım göstergesi
│   │
│   └── ui/                        # shadcn/ui components
│       ├── button.tsx             # ✅ Mevcut
│       ├── input.tsx              # ✅ Mevcut
│       └── ...
│
├── lib/
│   ├── api/
│   │   └── era-client.ts          # ✅ Mevcut (güncellencek)
│   │
│   ├── types/
│   │   ├── booking.types.ts       # Booking ile ilgili types
│   │   ├── search.types.ts        # Search ile ilgili types
│   │   └── common.types.ts        # Shared types
│   │
│   ├── constants/
│   │   ├── booking.constants.ts   # COMFORT_CONFIG, SEAT_PREFS, etc.
│   │   ├── search.constants.ts    # TIME_FILTERS, SORT_OPTIONS, etc.
│   │   └── ui.constants.ts        # Colors, icons mapping
│   │
│   ├── hooks/
│   │   ├── useBooking.ts          # Booking state management
│   │   ├── useSearch.ts           # Search state management
│   │   ├── useAlerts.ts           # Alert management
│   │   └── useSessionTimer.ts     # Hold timeout countdown
│   │
│   └── utils/
│       ├── price.utils.ts         # Price formatting, calculations
│       ├── date.utils.ts          # Date/time formatting
│       └── validation.utils.ts    # Form validation
│
└── app/
    ├── search/
    │   └── page.tsx               # ~200 satır (sadece orchestration)
    └── booking/
        └── page.tsx               # ~300 satır (sadece orchestration)
```

---

## 🧩 Component Specifications

### Common Components

#### `AlertBanner.tsx`
```typescript
interface Alert {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  message: string;
  dismissible?: boolean;
  action?: { label: string; onClick: () => void };
}

interface AlertBannerProps {
  alerts: Alert[];
  onDismiss: (id: string) => void;
}
```

#### `TimeDisplay.tsx`
```typescript
interface TimeDisplayProps {
  time: string;              // ISO 8601
  timezone?: string;         // e.g., 'Europe/Paris'
  showTimezone?: boolean;    // Show UTC offset
  format?: 'short' | 'full'; // 14:30 vs 14:30 (UTC+1)
}
```

#### `PriceDisplay.tsx`
```typescript
interface PriceDisplayProps {
  amount: number;
  currency: string;
  originalAmount?: number;   // For showing discounts
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showCurrency?: boolean;
}
```

---

### Search Components

#### `JourneyCard.tsx` (Updated)
```typescript
interface JourneyCardProps {
  journey: Journey;
  isExpanded: boolean;
  onToggle: () => void;
  onSelect: (comfortCategory: string) => void;
  isCheapest?: boolean;
  isFastest?: boolean;
  onShowConditions?: (journey: Journey) => void;
}

// Features:
// - Multi-segment timeline (if not direct)
// - Timezone display
// - Highlight badges (En Ucuz, En Hızlı)
// - Expandable class selection
// - Conditions link
```

#### `FilterPills.tsx`
```typescript
interface FilterPillsProps {
  timeFilters: string[];        // Selected time filter IDs
  onTimeFilterChange: (id: string) => void;
  directOnly: boolean;
  onDirectOnlyChange: (value: boolean) => void;
  directCount: number;          // "Sadece Direkt (12)"
}
```

#### `ProgressSteps.tsx`
```typescript
interface ProgressStepsProps {
  currentPhase: 'outbound' | 'return';
  isRoundTrip: boolean;
}
```

---

### Booking Components

#### `TravelerCard.tsx`
```typescript
interface TravelerCardProps {
  traveler: TravelerForm;
  index: number;
  isExpanded: boolean;
  onToggle: () => void;
  onChange: (field: keyof TravelerForm, value: string) => void;
  isFirstAdult: boolean;
  isValid: boolean;
  showSeatPreference?: boolean;
  carrierRequirements?: CarrierRequirement[];
}
```

#### `PriceBreakdown.tsx`
```typescript
interface PriceBreakdownProps {
  journey: Journey;
  returnJourney?: Journey | null;
  passengers: { adults: number; children: number };
  promoDiscount?: number;
  seatReservationFee?: number;
  serviceFeePercent?: number;
  showDetails?: boolean;        // Expandable
  onExpand?: () => void;
}
```

#### `SessionTimer.tsx`
```typescript
interface SessionTimerProps {
  expiresAt: string;           // ISO 8601
  onExpire: () => void;
  warningThreshold?: number;   // Minutes before warning (default: 5)
}

// Display: "Kalan süre: 14:32"
// Warning state when < 5 minutes
// Calls onExpire when time's up
```

---

## 📦 Constants Files

### `booking.constants.ts`
```typescript
export const COMFORT_CONFIG = {
  standard: { label: 'Standard', labelTr: 'Standart', ... },
  comfort: { label: 'Business', labelTr: 'Business', ... },
  premier: { label: 'First Class', labelTr: 'Birinci Sınıf', ... },
};

export const SEAT_PREFERENCES = [
  { id: 'window', label: 'Pencere Kenarı', icon: '🪟' },
  { id: 'aisle', label: 'Koridor Kenarı', icon: '🚶' },
  { id: 'any', label: 'Fark Etmez', icon: '💺' },
];

export const TICKETING_OPTIONS = [
  { id: 'eticket', label: 'E-Bilet', ... },
  { id: 'print', label: 'Yazdır', ... },
  { id: 'qr', label: 'QR Kod', ... },
];

export const SERVICE_FEE_PERCENT = 0.05;
export const SEAT_RESERVATION_FEE = 3;
```

### `search.constants.ts`
```typescript
export const TIME_FILTERS = [
  { id: 'early', label: 'Erken', shortLabel: '00-08', icon: '🌅', start: 0, end: 8 },
  { id: 'morning', label: 'Sabah', shortLabel: '08-12', icon: '☀️', start: 8, end: 12 },
  // ...
];

export const SORT_OPTIONS = [
  { id: 'departure', label: 'Kalkış Saati' },
  { id: 'price', label: 'Fiyat (En Ucuz)' },
  { id: 'duration', label: 'Süre (En Kısa)' },
];
```

---

## 🎣 Custom Hooks

### `useAlerts.ts`
```typescript
function useAlerts() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  
  const addAlert = (alert: Omit<Alert, 'id'>) => { ... };
  const dismissAlert = (id: string) => { ... };
  const clearAlerts = () => { ... };
  
  return { alerts, addAlert, dismissAlert, clearAlerts };
}
```

### `useBooking.ts`
```typescript
function useBooking() {
  const [travelers, setTravelers] = useState<TravelerForm[]>([]);
  const [ticketingOption, setTicketingOption] = useState('eticket');
  const [promoDiscount, setPromoDiscount] = useState(0);
  const [termsAccepted, setTermsAccepted] = useState(false);
  
  const isTravelerValid = (traveler: TravelerForm, isFirstAdult: boolean) => { ... };
  const allTravelersValid = useMemo(() => { ... }, [travelers]);
  
  return {
    travelers, setTravelers,
    ticketingOption, setTicketingOption,
    promoDiscount, setPromoDiscount,
    termsAccepted, setTermsAccepted,
    isTravelerValid, allTravelersValid,
  };
}
```

---

## 📋 Implementation Order

### Phase 1: Types & Constants (30 dk)
1. `lib/types/common.types.ts`
2. `lib/types/booking.types.ts`
3. `lib/constants/booking.constants.ts`
4. `lib/constants/search.constants.ts`

### Phase 2: Common Components (1 saat)
1. `components/common/AlertBanner.tsx`
2. `components/common/TimeDisplay.tsx`
3. `components/common/PriceDisplay.tsx`
4. `components/common/Modal.tsx`

### Phase 3: Booking Components (2 saat)
1. `components/booking/TravelerCard.tsx`
2. `components/booking/SeatPreferenceSelector.tsx`
3. `components/booking/TicketingOptionsSelector.tsx`
4. `components/booking/PriceBreakdown.tsx`
5. `components/booking/TicketConditions.tsx`
6. `components/booking/TermsCheckbox.tsx`
7. `components/booking/JourneySummaryCard.tsx`
8. `components/booking/BookingSuccess.tsx`
9. `components/booking/index.ts`

### Phase 4: Search Components (1.5 saat)
1. `components/search/FilterPills.tsx`
2. `components/search/MultiSegmentTimeline.tsx`
3. `components/search/ClassSelectionCards.tsx`
4. `components/search/ConditionsModal.tsx`
5. `components/search/ProgressSteps.tsx`
6. Update `components/search/JourneyCard.tsx`
7. `components/search/index.ts`

### Phase 5: Custom Hooks (30 dk)
1. `lib/hooks/useAlerts.ts`
2. `lib/hooks/useBooking.ts`

### Phase 6: Page Refactoring (1 saat)
1. `app/booking/page.tsx` - Use extracted components
2. `app/search/page.tsx` - Use extracted components

**Toplam Tahmini Süre:** ~6-7 saat

---

## ✅ Done Criteria

- [ ] Her component < 150 satır
- [ ] Her component tek bir iş yapıyor
- [ ] Props interface'leri tanımlı
- [ ] Constants ayrı dosyalarda
- [ ] Types ayrı dosyalarda
- [ ] Barrel exports (index.ts) var
- [ ] Page dosyaları < 300 satır
- [ ] npm run build hatasız geçiyor
