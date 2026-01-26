# 🗺️ EUROTRAIN PROJECT MAP

**Son Güncelleme:** 26 Ocak 2026
**Durum:** Phase 1 Round-Trip UI Tamamlandı ✅

---

## 📁 PROJE YAPISI

```
backend/src/
├── app.module.ts          # Ana modül
├── main.ts                # Entry point
├── era/                   # ✅ ERA API Entegrasyonu
│   ├── interfaces/
│   │   └── era-api.types.ts    # 750+ satır TypeScript interface
│   │                           # SearchHighlights, isDirect, segmentCount (YENİ)
│   ├── services/
│   │   ├── era-auth.service.ts     # Token yönetimi (60dk cache)
│   │   ├── era-places.service.ts   # İstasyon arama (7gün cache)
│   │   ├── era-search.service.ts   # Sefer arama (15dk cache)
│   │   ├── era-booking.service.ts  # Rezervasyon işlemleri
│   │   └── era-refund.service.ts   # İade/değişiklik
│   ├── mock/
│   │   └── era-mock.service.ts     # 3 class, 35+ rota, 32 şehir
│   │                               # Highlights tracking (cheapest/fastest)
│   ├── dto/
│   │   ├── search-journeys.dto.ts  # TripType enum, returnDate (YENİ)
│   │   ├── create-booking.dto.ts
│   │   └── update-travelers.dto.ts
│   ├── era.controller.ts
│   └── era.module.ts
├── bookings/              # Rezervasyon CRUD
├── campaigns/             # Kampanya yönetimi
├── email/                 # Resend entegrasyonu
├── mcp/                   # MCP Server (4 tool)
├── my-trips/              # Biletlerim (magic link)
├── payment/               # MSU Hosted Page
├── pdf/                   # QR kodlu e-bilet
├── pricing/               # Fiyatlandırma
├── security/              # JWT, Rate Limiting
└── settings/              # TCMB kur, markup, terms

frontend/
├── app/
│   ├── page.tsx           # ✅ Homepage (Round-trip toggle, Direct filter)
│   ├── search/
│   │   └── page.tsx       # ✅ v2 World-Class UI (YENİ)
│   │                      # Progress steps, Filter pills, Highlights
│   ├── booking/
│   │   └── page.tsx       # ✅ Round-trip destekli (YENİ)
│   ├── payment/
│   │   ├── page.tsx
│   │   ├── success/
│   │   └── error/
│   ├── my-trips/
│   │   └── page.tsx       # ✅ Trainline tarzı UI
│   ├── terms/             # 🔜 Kullanım koşulları
│   ├── privacy/           # 🔜 Gizlilik politikası
│   └── admin/
│       ├── login/
│       ├── bookings/
│       ├── campaigns/
│       └── settings/
├── components/
│   └── search/
│       └── StationAutocomplete.tsx  # ✅ ERA entegre
└── lib/
    └── api/
        ├── era-client.ts  # ✅ ERA API client (Journey type)
        └── client.ts      # Eski (kaldırılacak)

docs/
├── AGENTIC_COMMERCE_STRATEGY.md  # ✅ MCP-First stratejisi
├── MCP_ARCHITECTURE.md           # MCP v2.0 tasarımı
└── raileurope-api/               # ERA API dokümanları
```

---

## 🎨 SEARCH PAGE v2 ÖZELLİKLERİ (YENİ)

### Trainline/Google Flights/Kiwi.com İlhamlı UI

| Bileşen | Açıklama | İlham |
|---------|----------|-------|
| Progress Steps | Round-trip'te 1-Gidiş, 2-Dönüş göstergesi | Google Flights |
| Sticky Summary | Gidiş seçildiğinde yeşil özet bar | Trainline |
| Filter Pills | Tek tıkla toggle filtreler | Kiwi.com |
| Time Slots | 🌅🌤️🌆🌙 saat dilimleri | Trainline |
| Direct Only | "Sadece Direkt" toggle + sefer sayısı | Omio |
| Highlight Badges | "En Ucuz" yeşil, "En Hızlı" mavi | Trainline |
| Class Cards | Bilet sınıfı seçim kartları | Trainline |
| "En Popüler" | Business class badge | Omio |

### Round-Trip Flow
```
1. Homepage: Gidiş-Dönüş seç → returnDate picker açılır
2. Search: Progress Steps görünür (1-Gidiş aktif)
3. Gidiş seç → Phase otomatik "return"a geçer
4. Sticky bar: "Gidiş Seçildi" + özet + "Değiştir" butonu
5. Dönüş seç → Booking sayfasına redirect
6. Booking: Sidebar'da 2 kart (Gidiş + Dönüş)
```

### SessionStorage Keys
| Key | Kullanım |
|-----|----------|
| `tripType` | "oneway" veya "roundtrip" |
| `selectedJourney` | Tek yön için seçili sefer |
| `selectedOutbound` | Round-trip gidiş |
| `selectedReturn` | Round-trip dönüş |
| `passengers` | { adults, children } |

---

## 🔌 ERA API ENDPOİNTLERİ

### Places
| Method | Endpoint | Açıklama |
|--------|----------|----------|
| GET | /era/places/autocomplete?query=paris | İstasyon arama |
| GET | /era/places | Tüm istasyonlar |
| GET | /era/places/:code | Kod ile istasyon |

### Search
| Method | Endpoint | Açıklama |
|--------|----------|----------|
| POST | /era/search | Sefer arama |
| GET | /era/search/:searchId | Arama sonuçları |
| POST | /era/search/:searchId?page=next | Pagination |
| GET | /era/search/:searchId/offers/:offerId | Offer detay |

### Booking
| Method | Endpoint | Açıklama |
|--------|----------|----------|
| POST | /era/bookings | Booking oluştur |
| GET | /era/bookings/:bookingId | Booking detay |
| PUT | /era/bookings/:bookingId/items/:itemId/travelers | Yolcu güncelle |
| POST | /era/bookings/:bookingId/prebook | Ön rezervasyon |
| POST | /era/bookings/:bookingId/confirm | Onay |
| POST | /era/bookings/:bookingId/print | Bilet yazdır |
| DELETE | /era/bookings/:bookingId/items/:itemId | Item sil |

### Refund
| Method | Endpoint | Açıklama |
|--------|----------|----------|
| POST | /era/bookings/:bookingId/refund/quotation | İade teklifi |
| POST | /era/bookings/:bookingId/refund/confirm | İade onayla |

### Status
| Method | Endpoint | Açıklama |
|--------|----------|----------|
| GET | /era/status | Mock/Live mode durumu |
| POST | /era/cache/clear | Cache temizle |

---

## 🚂 MOCK DATA ÖZELLİKLERİ

### Desteklenen Carrier'lar
| Carrier | Tren Tipi | Prefix | Rotalar |
|---------|-----------|--------|---------|
| EUROSTAR | High-Speed | ES | Paris↔London, London↔Brussels |
| THALYS | High-Speed | THA | Paris↔Amsterdam, Paris↔Brussels |
| SNCF/TGV | High-Speed | TGV | Paris↔Lyon, Paris↔Marseille |
| TRENITALIA | High-Speed | FR | Roma↔Milano, Roma↔Firenze |
| DBAHN/ICE | High-Speed | ICE | Berlin↔Munich, Frankfurt↔Köln |
| RENFE/AVE | High-Speed | AVE | Madrid↔Barcelona |
| SBB | Inter-City | IC | Zurich↔Geneva |
| ÖBB/Railjet | High-Speed | RJ | Vienna↔Salzburg |
| TGV Lyria | High-Speed | TGV | Paris↔Geneva, Paris↔Zurich |

### Class Seçenekleri
| Class | Comfort | Fiyat Çarpanı | İade | Değişiklik | Flexibility |
|-------|---------|---------------|------|------------|-------------|
| Standard | standard | 1.0x | ❌ | ✅ | Semi-Flexible |
| Business | comfort | 1.6x | ✅ | ✅ | Flexible |
| First | premier | 2.2x | ✅ | ✅ | Fully Flexible |

### Şehirler (32 adet)
Fransa, İngiltere, Almanya, İtalya, İspanya, Hollanda, Belçika, İsviçre, Avusturya, Çekya

### Highlights Tracking (YENİ)
- `cheapestOfferId` - Standard class en ucuz offer
- `fastestOfferId` - En kısa süre offer
- Response'da `highlights` objesi olarak döner

---

## 🗄️ DATABASE TABLOLARI

### Mevcut
- booking
- campaign  
- admin_users
- settings
- payment (implicit)

### Gelecek (ERA tam entegrasyon için)
- era_booking_item
- era_traveler
- era_ticket

---

## 📊 MODÜL DURUMU

| Modül | Backend | Frontend | Durum |
|-------|---------|----------|-------|
| ERA Places | ✅ | ✅ | Mock çalışıyor |
| ERA Search | ✅ | ✅ | v2 UI + Round-trip ✅ |
| ERA Booking | ✅ | ✅ | Round-trip destekli ✅ |
| ERA Refund | ✅ | - | Backend hazır |
| Auth | ✅ | ✅ | JWT çalışıyor |
| Bookings | ✅ | ✅ | Tamamlandı |
| Payment | ✅ | ✅ | MSU credentials bekliyor |
| Settings | ✅ | ✅ | TCMB entegre |
| Email | ✅ | - | Resend entegre |
| PDF | ✅ | - | QR kod çalışıyor |
| MCP Server | ✅ | - | 4 tool hazır |
| My Trips | ✅ | ✅ | Phase 1 tamamlandı |
| Terms/Privacy | ✅ | 🔜 | Frontend bekliyor |

---

## 🛠️ TEKNOLOJİLER

| Kategori | Teknoloji |
|----------|-----------|
| Backend | NestJS 10+, TypeORM, PostgreSQL 15+ |
| Frontend | Next.js 14+, React 18+, Tailwind CSS |
| Auth | JWT, Passport.js |
| Email | Resend |
| PDF | pdfkit, qrcode, sharp |
| Kur | TCMB API |
| Ödeme | Payten MSU |
| Icons | Lucide React |
| Tren API | Rail Europe ERA (mock mode) |

---

## 🚀 AGENTIC COMMERCE STRATEJİSİ

### Yaklaşım: MCP-First, UCP-Ready

| Faz | Süre | Hedef | Durum |
|-----|------|-------|-------|
| Faz 1 | 2-3 hafta | Temel MCP Server (search-trains) | ✅ Tamamlandı |
| Faz 2 | 3-4 hafta | Booking desteği | ✅ Tamamlandı |
| Faz 3 | 4-6 hafta | Ödeme + UCP uyumu | ⏳ Bekliyor |

Detaylar: `docs/AGENTIC_COMMERCE_STRATEGY.md`

---

## 📱 UI/UX REFERANSLARİ

### İlham Alınan Platformlar
| Platform | Özellik | Kullanıldığı Yer |
|----------|---------|------------------|
| Trainline | Butter-smooth UX, Class cards | Search page v2 |
| Google Flights | Progress steps, Clean design | Round-trip flow |
| Kiwi.com | Filter pills, Anywhere search | Filter UI |
| Omio | Direct filter, Highlight badges | Search filters |
| Emirates | My Trips UI | My Trips page |

### Tasarım Sistemi
| Element | Değer |
|---------|-------|
| Primary | #1a365d (Derin Lacivert) |
| Secondary | #f59e0b (Altın/Amber) |
| Accent | #0891b2 (Turkuaz) |
| Success | #059669 (Yeşil) |
| Error | #dc2626 (Kırmızı) |
| Border Radius | rounded-xl, rounded-2xl |
| Shadow | shadow-sm, shadow-md |
| Font | Inter |
