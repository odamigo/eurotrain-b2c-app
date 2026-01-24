# 🗺️ EUROTRAIN PROJECT MAP

**Son Güncelleme:** 24 Ocak 2026
**Durum:** %96 Tamamlandı

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
├── settings/          # ✅ TCMB kur, markup, terms
├── trains/            # Tren controller
└── app.module.ts

frontend/app/
├── page.tsx           # Ana sayfa
├── search/            # Arama sonuçları
├── booking/           # Rezervasyon
├── my-trips/          # Biletlerim
├── payment/           # ✅ TCMB kur entegrasyonu
│   ├── page.tsx
│   ├── success/
│   └── error/
├── terms/             # 🔜 Kullanım koşulları
├── privacy/           # 🔜 Gizlilik politikası
└── admin/
    ├── login/         # ✅ JWT login
    ├── bookings/      # ✅ Rezervasyon listesi
    ├── campaigns/     # ✅ Kampanya yönetimi
    └── settings/      # ✅ Kur, markup, terms yönetimi
```

---

## 🔌 API ENDPOİNTLERİ

### Settings
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

### Auth
| Method | Endpoint | Auth | Açıklama |
|--------|----------|------|----------|
| POST | /auth/login | ❌ | Admin giriş |
| GET | /auth/profile | ✅ | Profil bilgisi |
| PUT | /auth/change-password | ✅ | Şifre değiştir |

### Diğer
- /bookings/* - Rezervasyon CRUD
- /my-trips/* - Magic link biletler
- /era/* - Sefer arama
- /email/* - Email gönderimi
- /pdf/* - PDF bilet
- /health/* - Sistem durumu

---

## 🗄️ DATABASE TABLOLARI

### settings
| Kolon | Tip | Açıklama |
|-------|-----|----------|
| id | SERIAL | Primary key |
| key | VARCHAR | Ayar anahtarı |
| value | TEXT | Ayar değeri |
| category | VARCHAR | Kategori (currency, legal) |
| language | VARCHAR | Dil (en, tr) |
| description | VARCHAR | Açıklama |
| createdAt | TIMESTAMP | Oluşturma tarihi |
| updatedAt | TIMESTAMP | Güncelleme tarihi |

### admin_users
| Kolon | Tip | Açıklama |
|-------|-----|----------|
| id | SERIAL | Primary key |
| email | VARCHAR | Email (unique) |
| password | VARCHAR | Hashlenmiş şifre |
| name | VARCHAR | Ad soyad |
| role | VARCHAR | Rol (superadmin, admin) |

### booking, campaign, payment
- Detaylar için entity dosyalarına bakın

---

## 🛠️ TEKNOLOJİLER

| Kategori | Teknoloji |
|----------|-----------|
| Backend | NestJS, TypeORM, PostgreSQL |
| Frontend | Next.js 16, React 19, Tailwind CSS |
| Auth | JWT, Passport.js |
| Email | Resend |
| PDF | pdfkit, qrcode, sharp |
| Kur | TCMB API |
| Ödeme | Payten MSU |
| Icons | Lucide React |

---

## 📊 MODÜL DURUMU

| Modül | Backend | Frontend | Durum |
|-------|---------|----------|-------|
| Auth | ✅ | ✅ | Tamamlandı |
| Bookings | ✅ | ✅ | Tamamlandı |
| Payment | ✅ | ✅ | MSU credentials bekliyor |
| Settings | ✅ | ✅ | Tamamlandı |
| Email | ✅ | - | Tamamlandı |
| PDF | ✅ | - | Tamamlandı |
| Terms/Privacy | ✅ | 🔜 | Frontend bekliyor |
