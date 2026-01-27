# 🗺️ EUROTRAIN PROJECT MAP

**Son Güncelleme:** 27 Ocak 2026, 21:30  
**Durum:** Refund/Exchange + Discount Cards Tamamlandı ✅

---

## 📁 PROJE YAPISI

```
backend/src/
├── app.module.ts              # Ana modül
├── main.ts                    # Entry point
├── era/                       # ✅ ERA API Entegrasyonu
│   ├── interfaces/
│   │   └── era-api.types.ts   # 750+ satır TypeScript interface
│   ├── services/
│   │   ├── era-auth.service.ts
│   │   ├── era-places.service.ts
│   │   ├── era-search.service.ts
│   │   ├── era-booking.service.ts
│   │   └── era-refund.service.ts
│   ├── mock/
│   │   ├── era-mock.service.ts
│   │   ├── era-class-configs.ts
│   │   ├── era-places-data.ts
│   │   └── era-route-configs.ts
│   └── era.module.ts
├── bookings/                  # ✅ Rezervasyon CRUD + Refund/Exchange
│   ├── dto/
│   │   ├── create-booking.dto.ts    # ✅ PassengerCardDto eklendi
│   │   └── update-booking.dto.ts
│   ├── entities/
│   │   └── booking.entity.ts        # ✅ cardDiscount alanı eklendi
│   ├── bookings.controller.ts       # ✅ Refund/Exchange endpoints
│   └── bookings.service.ts          # ✅ Refund/Exchange metodları
├── calendar/                  # ✅ iCal Export (YENİ)
│   ├── calendar.module.ts
│   ├── calendar.service.ts
│   └── calendar.controller.ts
├── share/                     # ✅ Paylaşım (YENİ)
│   ├── share.module.ts
│   ├── share.service.ts
│   └── share.controller.ts
├── campaigns/                 # Kampanya yönetimi
├── email/                     # Resend entegrasyonu
├── mcp/                       # MCP Server (4 tool)
├── my-trips/                  # ✅ Biletlerim + Email Resend
├── payment/                   # MSU Hosted Page
├── pdf/                       # QR kodlu e-bilet
├── pricing/                   # Fiyatlandırma
├── security/                  # JWT, Rate Limiting
└── settings/                  # TCMB kur, markup

frontend/
├── app/
│   ├── page.tsx               # Homepage
│   ├── search/
│   │   └── page.tsx           # ✅ Round-trip, Filters, Highlights
│   ├── booking/
│   │   └── page.tsx           # ✅ Discount Cards entegreli
│   ├── payment/
│   │   ├── page.tsx
│   │   ├── success/
│   │   └── error/
│   ├── my-trips/
│   │   ├── page.tsx           # ✅ Değiştir/İptal butonları aktif
│   │   ├── refund/
│   │   │   └── page.tsx       # ✅ İade sayfası (YENİ)
│   │   └── exchange/
│   │       └── page.tsx       # ✅ Değişiklik sayfası (YENİ)
│   └── admin/
│       ├── login/
│       ├── bookings/
│       ├── campaigns/
│       └── settings/
├── components/
│   ├── booking/
│   │   ├── DiscountCardSelector.tsx  # ✅ YENİ
│   │   ├── TravelerCard.tsx          # ✅ Discount Cards entegreli
│   │   ├── JourneySummaryCard.tsx
│   │   ├── PriceBreakdown.tsx
│   │   ├── SeatPreferenceSelector.tsx
│   │   ├── TermsCheckbox.tsx
│   │   ├── TicketConditions.tsx
│   │   ├── TicketingOptionsSelector.tsx
│   │   └── index.ts
│   ├── search/
│   │   ├── ConditionsModal.tsx
│   │   ├── FilterBar.tsx
│   │   ├── JourneyCard.tsx
│   │   ├── MultiSegmentTimeline.tsx
│   │   ├── SearchHeader.tsx
│   │   ├── SelectedOutboundBanner.tsx
│   │   └── index.ts
│   └── common/
│       ├── AlertBanner.tsx
│       ├── PriceDisplay.tsx
│       ├── TimeDisplay.tsx
│       └── index.ts
└── lib/
    ├── api/
    │   └── era-client.ts
    ├── constants/
    │   ├── booking.constants.ts
    │   ├── search.constants.ts
    │   └── discount-cards.constants.ts  # ✅ YENİ - 25+ kart
    ├── types/
    │   ├── booking.types.ts             # ✅ discountCard type
    │   └── common.types.ts
    └── my-trips-api.ts
```

---

## 🔌 API ENDPOİNTLERİ

### Bookings - Refund & Exchange (YENİ)
| Method | Endpoint | Açıklama |
|--------|----------|----------|
| POST | /bookings/:id/refund/quotation | İade teklifi al |
| POST | /bookings/:id/refund/confirm | İadeyi onayla |
| POST | /bookings/:id/cancel | Hızlı iptal |
| POST | /bookings/:id/exchange/search | Yeni seferler ara |
| POST | /bookings/:id/exchange/quotation | Değişiklik teklifi al |
| POST | /bookings/:id/exchange/confirm | Değişikliği onayla |
| GET | /bookings/:id/conditions | İade/değişiklik koşulları |

### Calendar & Share
| Method | Endpoint | Açıklama |
|--------|----------|----------|
| GET | /calendar/:id/ics?token=xxx | iCal dosyası |
| GET | /calendar/:id/google?token=xxx | Takvim linkleri |
| GET | /share/:id?token=xxx | Paylaşım verileri |
| GET | /share/:id/whatsapp?token=xxx | WhatsApp link |
| POST | /my-trips/:id/resend-email | Email tekrar gönder |

### ERA API
| Method | Endpoint | Açıklama |
|--------|----------|----------|
| GET | /era/places/autocomplete | İstasyon arama |
| POST | /era/search | Sefer arama |
| POST | /era/bookings | Booking oluştur |
| POST | /era/bookings/:id/confirm | Onay |

---

## 🎫 PASSENGER DISCOUNT CARDS

### Desteklenen Kartlar (25+)
| Ülke | Kartlar |
|------|---------|
| 🇩🇪 DE | BahnCard 25, BahnCard 50, BahnCard 100 |
| 🇫🇷 FR | Carte Avantage, Carte Jeune, Carte Senior, Carte Weekend |
| 🇮🇹 IT | CartaFRECCIA, CartaFRECCIA Young, CartaFRECCIA Senior |
| 🇨🇭 CH | Halbtax, GA Travelcard |
| 🇦🇹 AT | Vorteilscard, Vorteilscard Jugend, Vorteilscard Senior |
| 🇪🇸 ES | Tarjeta Dorada, Tarjeta Joven |
| 🇬🇧 GB | 16-25 Railcard, 26-30 Railcard, Senior Railcard, Family Railcard |
| 🇪🇺 EU | Interrail Pass, Eurail Pass, Eurostar Frequent Traveller |

### Özellikler
- Yaş bazlı filtreleme (dateOfBirth'e göre)
- Ülkelere göre gruplama
- Kart numarası validasyonu
- ERA API'ye passengerCards olarak gönderim

---

## 📊 MODÜL DURUMU

| Modül | Backend | Frontend | Durum |
|-------|---------|----------|-------|
| ERA Places | ✅ | ✅ | Mock çalışıyor |
| ERA Search | ✅ | ✅ | Round-trip + Filters ✅ |
| ERA Booking | ✅ | ✅ | Discount Cards ✅ |
| Refund | ✅ | ✅ | **YENİ** ✅ |
| Exchange | ✅ | ✅ | **YENİ** ✅ |
| Calendar/iCal | ✅ | ✅ | Çalışıyor |
| Share | ✅ | ✅ | WhatsApp/SMS/Email |
| Auth | ✅ | ✅ | JWT çalışıyor |
| Payment | ✅ | ✅ | MSU credentials bekliyor |
| Settings | ✅ | ✅ | TCMB entegre |
| Email | ✅ | - | Resend entegre |
| PDF | ✅ | - | QR kod çalışıyor |
| MCP Server | ✅ | - | 4 tool hazır |

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

## 🎨 UI/UX REFERANSLARI

| Platform | Özellik | Kullanıldığı Yer |
|----------|---------|------------------|
| Trainline | Butter-smooth UX, Class cards | Search, Booking |
| Google Flights | Progress steps, Clean design | Round-trip flow |
| Kiwi.com | Filter pills | Search filters |
| Omio | Direct filter, Badges | Search page |
| Emirates | My Trips UI | My Trips |

---

## 📋 SONRAKİ ADIMLAR

1. **Seat Selection** - Koltuk seçimi UI
2. **Exchange Ödeme** - Fiyat farkı için Payten
3. **Refund Hizmet Bedeli** - serviceFee ayrımı
4. **Production Deployment** - Railway + Vercel
