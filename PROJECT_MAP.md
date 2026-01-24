# 🗺️ EUROTRAIN PROJECT MAP

**Son Güncelleme:** 24 Ocak 2026
**Durum:** ERA API Altyapısı Tamamlandı

---

## 📁 PROJE YAPISI

```
backend/src/
├── app.module.ts          # Ana modül
├── main.ts                # Entry point
├── era/                   # ✅ ERA API Entegrasyonu (YENİ)
│   ├── interfaces/
│   │   └── era-api.types.ts    # 700+ satır TypeScript interface
│   ├── services/
│   │   ├── era-auth.service.ts     # Token yönetimi (60dk cache)
│   │   ├── era-places.service.ts   # İstasyon arama (7gün cache)
│   │   ├── era-search.service.ts   # Sefer arama (15dk cache)
│   │   ├── era-booking.service.ts  # Rezervasyon işlemleri
│   │   └── era-refund.service.ts   # İade/değişiklik
│   ├── mock/
│   │   └── era-mock.service.ts     # 3 class, 35+ rota, 32 şehir
│   ├── dto/
│   │   ├── search-journeys.dto.ts
│   │   ├── create-booking.dto.ts
│   │   └── update-travelers.dto.ts
│   ├── era.controller.ts
│   └── era.module.ts
├── bookings/              # Rezervasyon CRUD
├── campaigns/             # Kampanya yönetimi
├── email/                 # Resend entegrasyonu
├── my-trips/              # Biletlerim (magic link)
├── payment/               # MSU Hosted Page
├── pdf/                   # QR kodlu e-bilet
├── pricing/               # Fiyatlandırma
├── security/              # JWT, Rate Limiting
└── settings/              # TCMB kur, markup, terms

frontend/
├── app/
│   ├── page.tsx           # ✅ Homepage (ERA entegre)
│   ├── search/
│   │   └── page.tsx       # ✅ Arama sonuçları (ERA entegre)
│   ├── booking/
│   │   └── page.tsx       # ⏳ Güncellenmeli
│   ├── payment/
│   │   ├── page.tsx
│   │   ├── success/
│   │   └── error/
│   ├── my-trips/
│   │   └── page.tsx
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
        ├── era-client.ts  # ✅ Yeni ERA API client
        └── client.ts      # Eski (kaldırılacak)
```

---

## 🔌 ERA API ENDPOİNTLERİ (YENİ)

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
| Class | Comfort | Fiyat Çarpanı | İade | Değişiklik |
|-------|---------|---------------|------|------------|
| Standard | standard | 1.0x | ❌ | ✅ |
| Business | comfort | 1.6x | ✅ | ✅ |
| First | premier | 2.2x | ✅ | ✅ |

### Şehirler (32 adet)
Fransa, İngiltere, Almanya, İtalya, İspanya, Hollanda, Belçika, İsviçre, Avusturya, Çekya

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
| ERA Search | ✅ | ✅ | 3 class, 35+ rota |
| ERA Booking | ✅ | ⏳ | Backend hazır |
| ERA Refund | ✅ | - | Backend hazır |
| Auth | ✅ | ✅ | JWT çalışıyor |
| Bookings | ✅ | ✅ | Tamamlandı |
| Payment | ✅ | ✅ | MSU credentials bekliyor |
| Settings | ✅ | ✅ | TCMB entegre |
| Email | ✅ | - | Resend entegre |
| PDF | ✅ | - | QR kod çalışıyor |
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
