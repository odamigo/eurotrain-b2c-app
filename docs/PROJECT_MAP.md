# 🗺️ EUROTRAIN PROJECT MAP

**Son Güncelleme:** 24 Ocak 2026
**Durum:** %95 Tamamlandı

---

## 📁 PROJE YAPISI

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
├── settings/          # ✨ YENİ - TCMB kur, markup, terms
└── app.module.ts

frontend/app/
├── page.tsx           # Ana sayfa
├── search/            # Arama sonuçları
├── booking/           # Rezervasyon
├── my-trips/          # Biletlerim
├── payment/           # ✨ GÜNCELLENDİ - TCMB kur entegrasyonu
│   ├── page.tsx       # Para birimi seçimi, tooltip
│   ├── success/       # Konfeti, PDF indirme
│   └── error/         # Çözüm önerileri
├── terms/             # 🔜 Kullanım koşulları
├── privacy/           # 🔜 Gizlilik politikası
└── admin/
    ├── login/
    ├── bookings/
    ├── campaigns/
    └── settings/      # 🔜 Kur, markup, terms yönetimi

---

## 🔌 API ENDPOİNTLERİ

### Settings (YENİ)
| Method | Endpoint | Auth | Açıklama |
|--------|----------|------|----------|
| GET | /settings/exchange-rates | ❌ | TCMB kurları |
| GET | /settings/convert | ❌ | Kur dönüşümü |
| GET | /settings/terms | ❌ | Kullanım koşulları |
| GET | /settings/privacy | ❌ | Gizlilik politikası |
| GET | /settings/admin/all | ✅ | Tüm ayarlar |
| PUT | /settings/admin/markup | ✅ | Markup güncelle |
| PUT | /settings/admin/terms | ✅ | Terms güncelle |
| PUT | /settings/admin/privacy | ✅ | Privacy güncelle |
| POST | /settings/admin/exchange-rates/refresh | ✅ | Kurları yenile |

### Payment
| Method | Endpoint | Auth | Açıklama |
|--------|----------|------|----------|
| POST | /payment/initiate | ❌ | Ödeme başlat |
| GET/POST | /payment/callback | ❌ | Payten callback |
| POST | /payment/webhook | ❌ | Webhook |
| GET | /payment/status/:id | ❌ | Durum sorgula |
| POST | /payment/refund | ✅ | İade işlemi |
| GET | /payment/list | ✅ | Ödeme listesi |

### Diğer
- /auth/* - JWT authentication
- /bookings/* - Rezervasyon CRUD
- /my-trips/* - Magic link biletler
- /era/* - Sefer arama
- /email/* - Email gönderimi
- /pdf/* - PDF bilet

---

## 🗄️ DATABASE

### settings (YENİ)
| Kolon | Tip | Açıklama |
|-------|-----|----------|
| id | SERIAL | Primary key |
| key | VARCHAR | Ayar anahtarı |
| value | TEXT | Ayar değeri |
| category | VARCHAR | Kategori (currency, legal) |
| language | VARCHAR | Dil (en, tr) |
| description | VARCHAR | Açıklama |

### payments (GÜNCELLENDİ)
- Çoklu para birimi (EUR, USD, TRY)
- Refund alanları
- 3D Secure alanları
- Audit trail

---

## 🛠️ TEKNOLOJİLER

Backend: NestJS, TypeORM, PostgreSQL, JWT, Resend, pdfkit
Frontend: Next.js 16, React 19, Tailwind CSS, Lucide icons
Altyapı: Docker, Payten MSU, TCMB API

---

## 📊 MODÜL DURUMU

| Modül | Backend | Frontend |
|-------|---------|----------|
| Auth | ✅ | ✅ |
| Bookings | ✅ | ✅ |
| Payment | ✅ | ✅ |
| Settings | ✅ | 🔜 |
| Email | ✅ | - |
| PDF | ✅ | - |
