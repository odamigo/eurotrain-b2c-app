# 🚂 EUROTRAIN - RAIL EUROPE ERA API ENTEGRASYON STRATEJİSİ

**Oluşturulma:** 24 Ocak 2026
**Son Güncelleme:** 24 Ocak 2026
**Durum:** Planlama Aşaması

---

## 📋 GENEL BAKIŞ

### Proje Hedefi
EuroTrain platformunu Rail Europe ERA API ile entegre ederek, Avrupa genelinde gerçek tren bileti satışı yapabilen profesyonel bir B2C platformu oluşturmak.

### Mevcut Durum
- **Platform:** %92 tamamlandı (mock data ile)
- **ERA API:** OpenAPI spec dosyaları mevcut, sandbox erişimi YOK
- **Strateji:** Sandbox olmadan geliştirme, kontrat sonrası test

### Kritik Kısıtlamalar
1. ⚠️ Sandbox credentials henüz yok - kontrat sonrası gelecek
2. ⚠️ Geliştirme mock/simulation ile yapılacak
3. ⚠️ ERA API kısıtlamalarına %100 uyum şart
4. ⚠️ Para birimi: USD, EUR, TRY (başlangıç için)

---

## 🎯 KULLANICI DENEYİMİ HEDEFLERİ

### Sıfır Sürtünme İlkesi
| Alan | Hedef |
|------|-------|
| **Arama** | Anında sonuç, kullanıcıyı yormamalı |
| **Sonuçlar** | Uluslararası düzeyde açık, net, anlaşılır |
| **Satın Alma** | Satın almaya teşvik edici tasarım |
| **Hız** | Kusursuz performans |
| **Hata Sayfaları** | Kullanıcıyı sıkmayan, yapıcı mesajlar |

### Görsel Standartlar
- Profesyonel renk paleti
- Net ve çağrı yapıcı (CTA) butonlar
- Uluslararası standartlarda UI/UX
- Mobil uyumlu tasarım

### Yasal Gereklilikler
- Cookie politikası (GDPR uyumlu)
- Terms & Conditions
- Privacy Policy
- Kullanıcı bilgilendirmeleri

---

## 🔌 ERA API ENTEGRASYON HARİTASI

### API Endpoints (OpenAPI Spec'den)

#### 1. Authentication
```
POST /oauth2/token
- Server: https://authent-sandbox.era.raileurope.com
- Grant type: client_credentials
- Gerekli: client_id, client_secret
- Dönen: access_token (Bearer), expires_in (3600s)
```

#### 2. Places (İstasyonlar)
```
GET /places/autocomplete
- Server: https://api-sandbox.era.raileurope.com
- Params: query, type (city/station), size, boost
- Header: X-Point-Of-Sale (ZORUNLU)
- Auth: Bearer token

GET /places
- Tüm istasyonları getir
- ÖNERİ: Cache'le, haftalık/aylık güncelle
```

#### 3. Point-to-Point Search (Sefer Arama)
```
POST /offers/point-to-point/searches
- Request Body:
  - legs: [{departure, arrival, departureTime}]
  - travelers: [{type, dateOfBirth?, passengerCards?}]
  - productFilters: ["RIT"]
  - multiProviderEnabled: boolean

POST /offers/point-to-point/searches/{searchId}?page=next|previous
- Sayfalama için (daha sonraki/önceki trenler)
```

#### 4. Bookings (Rezervasyon)
```
POST /bookings
- offerLocations ile booking oluştur
- Header: X-CorrelationId (UUID)

GET /bookings/{bookingId}
- Booking detayı
- refresh=true ile güncel bilgi

GET /bookings?query=xxx
- Booking arama (sınırlı kullanım!)
```

#### 5. Checkout & Payment
```
POST /bookings/{bookingId}/travelers
- Yolcu bilgilerini ekle

POST /bookings/{bookingId}/contact
- İletişim bilgisi ekle

POST /bookings/{bookingId}/checkout
- Ödeme işlemi
```

#### 6. Tickets
```
GET /bookings/{bookingId}/tickets
- Bilet PDF'leri

POST /bookings/{bookingId}/tickets/distribution
- Bilet dağıtımı
```

#### 7. Refund & Exchange
```
POST /bookings/{bookingId}/refunds
- İade işlemi

POST /bookings/{bookingId}/exchanges
- Değişiklik işlemi
```

---

## 🚫 KESİNLİKLE YAPILMAMASI GEREKENLER

### API Kullanım Kuralları
1. ❌ `GET /bookings?query=` endpoint'ini yoğun kullanma (403 hatası verir)
2. ❌ Rate limit'leri aşma
3. ❌ Cache'siz places endpoint'i çağırma
4. ❌ Token süresini kontrol etmeden API çağrısı yapma
5. ❌ X-Point-Of-Sale header'ını unutma
6. ❌ Geçersiz place code kullanma

### Güvenlik Kuralları
1. ❌ Client credentials'ı frontend'de tutma
2. ❌ Access token'ı client'a gönderme
3. ❌ API hatalarını kullanıcıya raw gösterme
4. ❌ Yolcu verilerini loglama

---

## ✅ EN İYİ UYGULAMALAR

### Performans
1. ✅ Places verisini cache'le (haftalık güncelle)
2. ✅ Token'ı cache'le, expire'dan önce yenile
3. ✅ Frontend'de debounce/throttle kullan
4. ✅ Search sonuçlarını geçici cache'le

### Güvenilirlik
1. ✅ Retry mekanizması (exponential backoff)
2. ✅ Circuit breaker pattern
3. ✅ Graceful degradation
4. ✅ Health check monitoring

### Kullanıcı Deneyimi
1. ✅ Loading states göster
2. ✅ Anlamlı hata mesajları
3. ✅ Offline/timeout handling
4. ✅ Form validation (client + server)

---

## 📐 TEKNİK MİMARİ

### Backend Modülleri (NestJS)

```
backend/src/
├── era/                          # ERA API Entegrasyonu
│   ├── services/
│   │   ├── era-auth.service.ts       # Token yönetimi
│   │   ├── era-places.service.ts     # İstasyon servisi
│   │   ├── era-search.service.ts     # Sefer arama
│   │   ├── era-booking.service.ts    # Rezervasyon
│   │   ├── era-checkout.service.ts   # Ödeme
│   │   ├── era-tickets.service.ts    # Bilet
│   │   └── era-refund.service.ts     # İade
│   │
│   ├── dto/                          # Data Transfer Objects
│   │   ├── search-request.dto.ts
│   │   ├── search-response.dto.ts
│   │   ├── booking-request.dto.ts
│   │   ├── traveler.dto.ts
│   │   └── ...
│   │
│   ├── interfaces/                   # TypeScript interfaces
│   │   ├── era-offer.interface.ts
│   │   ├── era-booking.interface.ts
│   │   └── ...
│   │
│   ├── cache/                        # Cache stratejileri
│   │   ├── places-cache.service.ts
│   │   └── token-cache.service.ts
│   │
│   ├── era.controller.ts
│   ├── era.module.ts
│   └── era.config.ts                 # Environment config
│
├── pricing/                      # Fiyat hesaplama (GÜNCELLE)
│   ├── currency.service.ts           # TCMB + USD/EUR/TRY
│   └── markup.service.ts             # Servis ücreti
```

### Frontend Bileşenleri (Next.js)

```
frontend/
├── app/
│   ├── search/
│   │   └── page.tsx              # Arama sonuçları (GÜNCELLE)
│   ├── booking/
│   │   └── page.tsx              # Rezervasyon (GÜNCELLE)
│   ├── terms/
│   │   └── page.tsx              # YENİ: Terms & Conditions
│   ├── privacy/
│   │   └── page.tsx              # YENİ: Privacy Policy
│   └── cookies/
│       └── page.tsx              # YENİ: Cookie Policy
│
├── components/
│   ├── search/
│   │   ├── StationAutocomplete.tsx   # GÜNCELLE
│   │   ├── SearchResults.tsx         # GÜNCELLE
│   │   ├── JourneyCard.tsx           # GÜNCELLE
│   │   └── PriceDisplay.tsx          # YENİ
│   │
│   ├── booking/
│   │   ├── TravelerForm.tsx          # GÜNCELLE
│   │   ├── SeatSelection.tsx         # YENİ
│   │   └── PriceSummary.tsx          # GÜNCELLE
│   │
│   ├── common/
│   │   ├── CookieBanner.tsx          # YENİ
│   │   ├── LoadingSpinner.tsx
│   │   └── ErrorBoundary.tsx
│   │
│   └── ui/                           # Shadcn components
```

---

## 📊 PARA BİRİMİ STRATEJİSİ

### Desteklenen Para Birimleri
| Kod | Sembol | Kullanım |
|-----|--------|----------|
| EUR | € | Ana Avrupa para birimi |
| USD | $ | Uluslararası |
| TRY | ₺ | Türk kullanıcılar |

### Dönüşüm Akışı
```
ERA API (EUR) → TCMB Kuru → Markup → Son Fiyat (TRY/USD/EUR)
```

### Fiyat Gösterimi
- Tüm fiyatlar kullanıcının tercih ettiği para biriminde
- Alt not olarak orijinal para birimi gösterilebilir
- Anlık kur bilgisi "yaklaşık" olarak belirtilmeli

---

## 🔄 GELİŞTİRME AŞAMALARI

### Aşama 1: Temel Altyapı (Mock Mode)
**Süre:** 1-2 hafta

1. ERA Auth Service (mock token)
2. ERA Places Service (mock data + gerçek API yapısı)
3. ERA Search Service (mock offers + gerçek response yapısı)
4. TypeScript interfaces ve DTOs
5. Frontend güncelleme başlangıcı

### Aşama 2: Booking & Checkout (Mock Mode)
**Süre:** 1-2 hafta

1. ERA Booking Service
2. Traveler management
3. Contact management
4. Checkout flow (MSU entegrasyonu ile)
5. Frontend booking sayfası güncelleme

### Aşama 3: UI/UX İyileştirmeleri
**Süre:** 1 hafta

1. Hata sayfaları yeniden tasarım
2. Loading states
3. Cookie banner
4. Legal sayfalar (Terms, Privacy)
5. Renk ve buton iyileştirmeleri

### Aşama 4: Sandbox Entegrasyonu
**Süre:** Credentials sonrası 1-2 hafta

1. Mock'tan gerçek API'ye geçiş
2. Environment config
3. Uçtan uca test
4. Hata düzeltmeleri

### Aşama 5: Production Hazırlık
**Süre:** 1 hafta

1. Performance optimizasyon
2. Security audit
3. Monitoring setup
4. Documentation

---

## 🔧 MEVCUT KOD UYUMSUZLUKLARI

Mevcut kod ERA API spec'ine göre kontrol edilmeli:

### Kontrol Edilecekler
| Dosya | Durum | Not |
|-------|-------|-----|
| `era.controller.ts` | 🔍 Kontrol | Endpoint yapıları |
| `era-mock.service.ts` | 🔍 Kontrol | Response formatları |
| `booking.entity.ts` | 🔍 Kontrol | ERA booking fields |
| `search/page.tsx` | 🔍 Kontrol | UI alanları |
| `booking/page.tsx` | 🔍 Kontrol | Traveler fields |

### Bilinen Uyumsuzluklar
_(Kod incelemesi sonrası doldurulacak)_

---

## 📱 MOBİL UYUMLULUK

### Responsive Breakpoints
- Mobile: < 640px
- Tablet: 640px - 1024px
- Desktop: > 1024px

### Öncelikli Mobil Optimizasyonlar
1. Arama formu
2. Sonuç listesi
3. Booking flow
4. Payment sayfası

---

## 🍪 COOKIE & GDPR UYUMU

### Cookie Kategorileri
| Tip | Zorunlu | Açıklama |
|-----|---------|----------|
| Essential | ✅ | Session, auth, güvenlik |
| Functional | ❌ | Tercihler, dil |
| Analytics | ❌ | Google Analytics |
| Marketing | ❌ | Reklam |

### Gerekli Bileşenler
1. Cookie Banner (ilk ziyarette)
2. Cookie Settings sayfası
3. Privacy Policy (detaylı)
4. Consent logging

---

## 📞 İLETİŞİM & DESTEK

### Dokümantasyon
- ERA API Docs: https://docs.era.raileurope.com
- Stoplight: https://rail-europe.stoplight.io/

### Not
GitHub erişimi yok. Güncel kod her oturumda `/mnt/project/` içinde veya kullanıcı tarafından sağlanmalı.

---

## 📝 GÜNCELLİK NOTLARI

| Tarih | Değişiklik |
|-------|------------|
| 24 Ocak 2026 | İlk strateji belgesi oluşturuldu |

---

**Bu belge, geliştirme sürecinde güncel tutulmalıdır.**
