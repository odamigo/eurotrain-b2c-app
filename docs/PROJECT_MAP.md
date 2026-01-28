# 🗺️ EUROTRAIN PROJECT MAP

**Son Güncelleme:** 28 Ocak 2026  
**Durum:** %96 Tamamlandı

---

## 🌐 PRODUCTION URLs

| Bileşen | URL |
|---------|-----|
| Frontend | https://eurotrain-b2c-app.vercel.app |
| Backend | https://eurotrain-b2c-app-production.up.railway.app |
| Health Check | https://eurotrain-b2c-app-production.up.railway.app/health |

---

## 📁 PROJE YAPISI

```
backend/src/
├── security/          # JWT, Rate Limiting, Logging
├── bookings/          # Rezervasyon CRUD
├── my-trips/          # Biletlerim (magic link)
├── payment/           # MSU Hosted Page, Refund, 3D Secure
├── email/             # Resend entegrasyonu
├── pdf/               # QR kodlu e-bilet
├── era/               # Rail Europe API (mock)
├── pricing/           # Fiyatlandırma
├── campaigns/         # Promosyon kodları
├── settings/          # TCMB kur, markup, terms
├── calendar/          # ✅ iCal export
├── share/             # ✅ WhatsApp, SMS paylaşım
└── app.module.ts

frontend/app/
├── page.tsx           # Ana sayfa (Hero Search)
├── search/            # Arama sonuçları
├── booking/           # Rezervasyon formu
├── checkout/          # Ödeme sayfası
├── my-trips/          # ✅ Biletlerim (Phase 2 tamamlandı)
├── payment/           # Success/Error sayfaları
│   ├── success/
│   └── error/
├── terms/             # Kullanım koşulları
├── privacy/           # Gizlilik politikası
└── admin/
    ├── login/
    ├── bookings/
    ├── campaigns/
    └── settings/
```

---

## 🔌 API ENDPOİNTLERİ

### Core
| Method | Endpoint | Auth | Açıklama |
|--------|----------|------|----------|
| GET | /health | ❌ | Sistem durumu |
| GET | /era/search | ❌ | Sefer arama |
| GET | /era/places | ❌ | İstasyon arama |

### Bookings
| Method | Endpoint | Auth | Açıklama |
|--------|----------|------|----------|
| POST | /bookings | ❌ | Yeni rezervasyon |
| GET | /bookings/:id | ✅ | Rezervasyon detay |
| GET | /bookings | ✅ | Admin - tüm rezervasyonlar |

### My Trips
| Method | Endpoint | Auth | Açıklama |
|--------|----------|------|----------|
| GET | /my-trips?token=xxx | Token | Biletlerim |
| GET | /my-trips/:id?token=xxx | Token | Bilet detay |
| POST | /my-trips/:id/resend-email | Token | Email tekrar gönder |

### Calendar (Phase 2)
| Method | Endpoint | Auth | Açıklama |
|--------|----------|------|----------|
| GET | /calendar/:id/ics | Token | iCal dosyası |
| GET | /calendar/:id/google | Token | Google Calendar link |

### Share (Phase 2)
| Method | Endpoint | Auth | Açıklama |
|--------|----------|------|----------|
| GET | /share/:id/whatsapp | Token | WhatsApp link |
| GET | /share/:id/text | Token | Düz metin |

### Payment
| Method | Endpoint | Auth | Açıklama |
|--------|----------|------|----------|
| POST | /payment/initiate | ❌ | Ödeme başlat |
| GET/POST | /payment/callback | ❌ | Payten callback |
| GET | /payment/status/:id | ❌ | Durum sorgula |
| POST | /payment/refund | ✅ | İade işlemi |

### Settings
| Method | Endpoint | Auth | Açıklama |
|--------|----------|------|----------|
| GET | /settings/exchange-rates | ❌ | TCMB kurları |
| GET | /settings/convert | ❌ | Kur dönüşümü |
| PUT | /settings/admin/markup | ✅ | Markup güncelle |

### PDF
| Method | Endpoint | Auth | Açıklama |
|--------|----------|------|----------|
| GET | /pdf/:bookingId | Token | E-bilet PDF |

---

## 🗄️ DATABASE ŞEMASI

### Tablolar
| Tablo | Kolon Sayısı | Açıklama |
|-------|--------------|----------|
| bookings | ~25 | Rezervasyonlar |
| payments | 38 | Ödeme kayıtları |
| settings | 6 | Sistem ayarları |
| admins | 5 | Admin kullanıcılar |
| campaigns | 10 | Promosyon kodları |

### Payments Tablosu (Detay)
```sql
id, orderId, bookingId, amount, refundedAmount, currency, status,
paymentMethod, transactionId, sessionToken, pgTranId, pgOrderId,
authCode, rrn, errorCode, errorMessage, cardLastFour, cardBrand,
cardBank, customerEmail, customerName, customerIp, is3DSecure,
threeDSecureResult, installmentCount, installmentAmount,
refundTransactionId, refundReason, refundedBy, refundedAt,
rawRequest, rawResponse, callbackData, retryCount, lastRetryAt,
createdAt, updatedAt, completedAt
```

---

## 🛠️ TEKNOLOJİLER

### Backend
- NestJS 10+
- TypeORM
- PostgreSQL 15+ (Neon)
- JWT + Passport
- Resend (email)
- pdfkit (PDF)

### Frontend
- Next.js 14+ (App Router)
- React 18+
- Tailwind CSS
- shadcn/ui
- Lucide icons

### Altyapı
- Frontend: Vercel
- Backend: Railway
- Database: Neon PostgreSQL (Frankfurt)
- Monitoring: Sentry
- Email: Resend

### Entegrasyonlar
- Rail Europe ERA API (mock mode)
- Payten/MSU (hosted page)
- TCMB (döviz kuru)

---

## 📊 MODÜL DURUMU

| Modül | Backend | Frontend | Durum |
|-------|---------|----------|-------|
| Auth | ✅ | ✅ | Tamamlandı |
| Bookings | ✅ | ✅ | Tamamlandı |
| Payment | ✅ | ✅ | Local OK, Prod beklemede |
| My Trips | ✅ | ✅ | Phase 2 tamamlandı |
| Calendar | ✅ | ✅ | Tamamlandı |
| Share | ✅ | ✅ | Tamamlandı |
| Settings | ✅ | 🔜 | Admin panel bekliyor |
| Email | ✅ | - | Tamamlandı |
| PDF | ✅ | - | Tamamlandı |

---

## 📝 DOKÜMANLAR

| Dosya | Açıklama |
|-------|----------|
| `WHERE_WE_LEFT.md` | Günlük durum takibi |
| `STRATEGIC_ROADMAP.md` | Ana yol haritası |
| `PROJECT_MAP.md` | Bu dosya - teknik harita |
| `MY_TRIPS_PHASE2_TODO.md` | Bilet yönetimi özellikleri |
| `UX_CONVERSION_ROADMAP.md` | 🆕 UX iyileştirme önerileri |

---

## ✏️ DEĞİŞİKLİK GEÇMİŞİ

| Tarih | Değişiklik |
|-------|------------|
| 28 Ocak 2026 | Production URLs eklendi, UX dokümanı referansı |
| 27 Ocak 2026 | Calendar, Share modülleri eklendi |
| 24 Ocak 2026 | Settings modülü eklendi |
