# 🚂 EUROTRAIN - YOL HARİTASI VE MEVCUT DURUM

**Son Güncelleme:** 24 Ocak 2026
**Versiyon:** 2.0 - ERA API Entegrasyonu Öncesi

---

## 📍 MEVCUT DURUM ÖZETİ

### ✅ Tamamlanan Modüller

| Modül | Backend | Frontend | Notlar |
|-------|---------|----------|--------|
| **Homepage** | - | ✅ | Arama formu çalışıyor |
| **Station Autocomplete** | ✅ Mock | ✅ | ERA formatına uyarlanacak |
| **Journey Search** | ✅ Mock | ✅ | ERA formatına uyarlanacak |
| **Booking Create** | ✅ | ✅ | ERA akışına göre yeniden yazılacak |
| **Payment (Payten/MSU)** | ✅ | ✅ | Mock mode çalışıyor |
| **My Trips** | ✅ | ✅ | Magic link çalışıyor |
| **Admin Panel** | ✅ | ✅ | JWT auth çalışıyor |
| **Campaigns** | ✅ | ✅ | Promo code sistemi |
| **Settings** | ✅ | ✅ | TCMB döviz kuru entegre |
| **PDF E-Ticket** | ✅ | - | pdfkit ile |
| **Email** | ⚠️ Skeleton | - | Henüz aktif değil |

### ⚠️ Kritik Eksikler

1. **ERA API Entegrasyonu YOK** - Tüm veriler mock
2. **Sandbox Credentials YOK** - Bekleniyor
3. **Gerçek Ödeme YOK** - MSU credentials bekleniyor
4. **i18n YOK** - Sadece Türkçe hardcoded
5. **Legal Sayfalar YOK** - Terms, Privacy, Cookies

---

## 🏗️ BACKEND YAPISAL ANALİZ

### Mevcut Modüller (`backend/src/`)

```
src/
├── app.module.ts          ← Ana modül
├── main.ts                ← Entry point
├── bookings/              ← Rezervasyon (yeniden yazılacak)
├── campaigns/             ← Kampanya yönetimi ✅
├── email/                 ← Email servisi (skeleton)
├── era/                   ← ERA entegrasyonu (mock) ⚠️
├── my-trips/              ← Bilet takip ✅
├── payment/               ← Ödeme (Payten) ✅
├── pdf/                   ← E-bilet PDF ✅
├── pricing/               ← Fiyat hesaplama ✅
├── security/              ← Auth, JWT, Guards ✅
├── settings/              ← Ayarlar, TCMB ✅
├── stations/              ← (boş klasör)
└── trains/                ← (kullanılmıyor)
```

### ERA Modülü Analizi (`src/era/`)

**Mevcut Dosyalar:**
- `era.controller.ts` - Custom endpoint'ler (ERA API'ye uymuyor!)
- `era-mock.service.ts` - Mock data üretici
- `era.module.ts` - Sadece mock service bağlı
- `dto/search-journey.dto.ts` - Custom format (ERA'ya uymuyor!)
- `entities/booking.entity.ts` - EraBooking entity (kısmen uyuyor)

**SORUN:** Mevcut yapı ERA API'ye uymuyor. Yeniden tasarım gerekli.

### Booking Entity Analizi (`src/bookings/`)

**Mevcut alanlar:**
- Temel: id, customerName, customerEmail, fromStation, toStation, price, status
- My Trips: magic_token, pnr, train_number, coach, seat, times
- ERA: era_booking_reference, era_pnr, era_carrier, era_amounts

**EKSİK:** ERA API'nin döndüğü tüm alanlar (offers, products, conditions, travelers)

---

## 🎨 FRONTEND YAPISAL ANALİZ

### Mevcut Sayfalar (`frontend/app/`)

```
app/
├── page.tsx               ← Homepage ✅
├── layout.tsx             ← Root layout
├── globals.css            ← Global styles
├── Header.tsx             ← Header component
├── search/                ← Arama sonuçları
│   ├── page.tsx           ← Sonuç listesi
│   ├── SearchForm.tsx     ← Arama formu
│   ├── StationAutocomplete.tsx ← İstasyon arama
│   ├── JourneyCard.tsx    ← Sefer kartı
│   └── PopularRoutes.tsx  ← Popüler rotalar
├── booking/
│   └── page.tsx           ← Rezervasyon formu
├── payment/
│   ├── page.tsx           ← Ödeme sayfası
│   ├── success/           ← Başarılı ödeme
│   └── error/             ← Hatalı ödeme
├── my-trips/
│   └── page.tsx           ← Biletlerim
├── admin/
│   ├── page.tsx           ← Dashboard
│   ├── login/             ← Admin giriş
│   ├── bookings/          ← Rezervasyonlar
│   ├── campaigns/         ← Kampanyalar
│   ├── settings/          ← Ayarlar
│   └── components/        ← Admin UI
└── ui/                    ← shadcn components
```

### Frontend Sorunları

1. **API Client** (`lib/api/client.ts`) - ERA formatına uymuyor
2. **Journey tipi** - ERA offers/products yapısına uymuyor
3. **Booking flow** - ERA 6 adımlı akışa uymuyor
4. **Hardcoded Türkçe** - i18n altyapısı yok

---

## 🎯 YENİDEN TASARIM PLANI

### Faz 1: ERA API Altyapısı (1-2 hafta)

#### 1.1 TypeScript Interfaces (Gün 1-2)
```typescript
// src/era/interfaces/
├── era-auth.interface.ts      // Token response
├── era-places.interface.ts    // Station/City types
├── era-search.interface.ts    // Offers, Products, Legs
├── era-booking.interface.ts   // Booking, Items, Travelers
├── era-checkout.interface.ts  // Prebook, Confirm
├── era-ticket.interface.ts    // Ticket, PDF
├── era-refund.interface.ts    // Refund quotation/confirm
└── era-common.interface.ts    // Shared types (Price, Condition)
```

#### 1.2 ERA Services (Gün 3-7)
```typescript
// src/era/services/
├── era-auth.service.ts        // Token yönetimi (60 dk cache)
├── era-places.service.ts      // Autocomplete + cache
├── era-search.service.ts      // P2P search + pagination
├── era-booking.service.ts     // Create, update travelers
├── era-checkout.service.ts    // Prebook, confirm, hold
├── era-ticket.service.ts      // Print tickets
└── era-refund.service.ts      // Quotation, confirm
```

#### 1.3 Provider Interface (Gün 7)
```typescript
// src/providers/
├── provider.interface.ts      // ITrainProvider
├── rail-europe.provider.ts    // ERA implementasyonu
└── provider.module.ts         // Provider registry
```

### Faz 2: Backend Refactoring (1 hafta)

#### 2.1 Yeni DTO'lar
- ERA API request/response formatında
- class-validator ile validation
- Swagger decorators

#### 2.2 Yeni Controller'lar
```
POST /api/search/journeys      → ERA search
GET  /api/places/autocomplete  → ERA places
POST /api/bookings             → ERA booking create
PUT  /api/bookings/:id/travelers
POST /api/bookings/:id/prebook
POST /api/bookings/:id/confirm
POST /api/bookings/:id/print
POST /api/bookings/:id/refund
```

#### 2.3 Database Schema Güncelleme
- Booking entity: ERA fields eklenmeli
- New entity: BookingItem (multi-leg support)
- New entity: Traveler (yolcu bilgileri)

### Faz 3: Frontend Refactoring (1-2 hafta)

#### 3.1 API Client Güncelleme
```typescript
// lib/api/
├── era-client.ts          // ERA endpoints
├── types/                 // TypeScript types
│   ├── search.types.ts
│   ├── booking.types.ts
│   └── common.types.ts
└── hooks/                 // React Query hooks
    ├── useSearch.ts
    ├── useBooking.ts
    └── usePlaces.ts
```

#### 3.2 Sayfa Güncellemeleri
- Search: Offers/Products gösterimi
- Booking: 6 adımlı flow (traveler → prebook → payment → confirm)
- Traveler form: Carrier'a göre zorunlu alanlar

#### 3.3 i18n Altyapısı
```
lib/i18n/
├── locales/
│   ├── tr.json
│   └── en.json
├── config.ts
└── useTranslation.ts
```

### Faz 4: Sandbox Entegrasyonu (1 hafta)

- Mock → Real API geçişi
- Environment variables
- Error handling
- Rate limiting
- Logging

### Faz 5: Production Hazırlık (1 hafta)

- Legal sayfalar (Terms, Privacy, Cookies)
- Cookie consent banner
- GDPR compliance
- Performance optimization
- Security audit

---

## 📋 HEMEN YAPILACAKLAR (ÖNCELİK SIRASI)

### 1. ERA Interfaces (BUGÜN)
OpenAPI spec'lerden TypeScript interface'leri oluştur.

### 2. ERA Auth Service
Token yönetimi - 60 dk cache, auto-refresh.

### 3. ERA Places Service
Autocomplete + tüm istasyonlar cache.

### 4. ERA Search Service
P2P search + pagination.

### 5. Provider Interface
Gelecekte multi-provider için altyapı.

---

## 🔧 TEKNİK BORÇ LİSTESİ

| Sorun | Öncelik | Çözüm |
|-------|---------|-------|
| Mock data everywhere | 🔴 Kritik | ERA API entegrasyonu |
| Hardcoded Türkçe | 🟡 Yüksek | i18n implementasyonu |
| No input validation | 🟡 Yüksek | class-validator + frontend |
| No error boundaries | 🟡 Yüksek | React error boundaries |
| No loading skeletons | 🟢 Orta | Skeleton components |
| No offline support | 🟢 Düşük | PWA / Service Worker |

---

## 📁 DOSYA REFERANSLARI

### Dokümantasyon
- `docs/raileurope-api/ERA_API_FLOWS.md` - Akış diyagramları + carrier bilgileri
- `docs/ERA_INTEGRATION_STRATEGY.md` - Entegrasyon stratejisi
- `docs/raileurope-api/openapi-specs/` - OpenAPI YAML dosyaları

### Önemli Kod Dosyaları
- `backend/src/era/` - ERA modülü (yeniden yazılacak)
- `backend/src/bookings/` - Booking modülü
- `backend/src/payment/` - Ödeme modülü
- `frontend/app/search/` - Arama sayfası
- `frontend/app/booking/` - Rezervasyon sayfası

---

## ⚠️ UNUTMA

1. **Her oturumda bu dosyayı oku**
2. **Kod yazmadan önce interface'leri tanımla**
3. **Mock mode'u koru, real mode için flag ekle**
4. **Teknik borç biriktirme**
5. **Commit mesajları anlamlı olsun**

---

## 🚀 SONRAKİ ADIM

**ERA TypeScript Interfaces oluştur** - OpenAPI spec'lerden otomatik generate et veya manuel yaz.

Başlamak için: `docs/raileurope-api/openapi-specs/` klasöründeki YAML dosyalarını incele.
