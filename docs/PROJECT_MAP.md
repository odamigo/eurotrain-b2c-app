# EUROTRAIN PROJECT MAP

**Son Guncelleme:** 19 Ocak 2026
**Versiyon:** 1.4.0

---

## PROJE YAPISI
```
eurotrain-b2c-app/
│
├── backend/                          # NestJS Backend API
│   ├── src/
│   │   ├── app.module.ts             # Ana modul
│   │   ├── app.controller.ts
│   │   ├── app.service.ts
│   │   ├── main.ts                   # Entry point
│   │   │
│   │   ├── bookings/                 # Rezervasyon modulu
│   │   │   ├── bookings.module.ts
│   │   │   ├── bookings.service.ts
│   │   │   ├── bookings.controller.ts
│   │   │   ├── entities/
│   │   │   │   └── booking.entity.ts
│   │   │   └── dto/
│   │   │       └── create-booking.dto.ts
│   │   │
│   │   ├── security/                 # Guvenlik modulu
│   │   │   ├── security.module.ts
│   │   │   ├── auth.module.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── auth.controller.ts
│   │   │   ├── jwt.strategy.ts
│   │   │   ├── jwt-auth.guard.ts
│   │   │   ├── health.controller.ts
│   │   │   ├── logger.service.ts
│   │   │   ├── logs.controller.ts
│   │   │   ├── global-exception.filter.ts
│   │   │   └── entities/
│   │   │       └── admin-user.entity.ts
│   │   │
│   │   ├── email/                    # Email modulu (YENI)
│   │   │   ├── email.module.ts
│   │   │   ├── email.service.ts
│   │   │   └── email.controller.ts
│   │   │
│   │   ├── pdf/                      # PDF modulu
│   │   │   ├── pdf.module.ts
│   │   │   ├── pdf.service.ts
│   │   │   └── pdf.controller.ts
│   │   │
│   │   ├── payment/                  # Odeme modulu
│   │   │   ├── payment.module.ts
│   │   │   ├── payment.service.ts
│   │   │   └── payment.controller.ts
│   │   │
│   │   ├── my-trips/                 # Biletlerim modulu
│   │   │   ├── my-trips.module.ts
│   │   │   ├── my-trips.service.ts
│   │   │   └── my-trips.controller.ts
│   │   │
│   │   ├── era/                      # Tren arama modulu
│   │   │   ├── era.module.ts
│   │   │   ├── era.service.ts
│   │   │   └── era.controller.ts
│   │   │
│   │   ├── campaigns/                # Kampanya modulu
│   │   │   ├── campaigns.module.ts
│   │   │   ├── campaigns.service.ts
│   │   │   └── campaigns.controller.ts
│   │   │
│   │   ├── pricing/                  # Fiyatlandirma modulu
│   │   │   ├── pricing.module.ts
│   │   │   ├── pricing.service.ts
│   │   │   └── pricing.controller.ts
│   │   │
│   │   └── trains/                   # Tren controller
│   │       └── trains.controller.ts
│   │
│   ├── .env                          # Environment variables (YENI)
│   ├── package.json
│   ├── tsconfig.json
│   └── nest-cli.json
│
├── frontend/                         # Next.js Frontend
│   ├── app/
│   │   ├── page.tsx                  # Ana sayfa
│   │   ├── layout.tsx
│   │   │
│   │   ├── search/                   # Arama sonuclari
│   │   │   └── page.tsx
│   │   │
│   │   ├── booking/                  # Rezervasyon sayfasi
│   │   │   └── page.tsx
│   │   │
│   │   ├── payment/                  # Odeme sayfalari
│   │   │   ├── page.tsx
│   │   │   ├── success/
│   │   │   │   └── page.tsx
│   │   │   └── error/
│   │   │       └── page.tsx
│   │   │
│   │   ├── my-trips/                 # Biletlerim
│   │   │   └── page.tsx
│   │   │
│   │   └── admin/                    # Admin panel
│   │       ├── page.tsx              # Dashboard
│   │       ├── layout.tsx            # JWT koruma
│   │       ├── login/
│   │       │   └── page.tsx
│   │       ├── bookings/
│   │       │   └── page.tsx
│   │       └── campaigns/
│   │           └── page.tsx
│   │
│   ├── lib/
│   │   └── api/
│   │       └── client.ts             # API client
│   │
│   ├── components/                   # UI componentleri
│   ├── package.json
│   └── tailwind.config.js
│
├── docs/                             # Dokumantasyon
│   ├── WHERE_WE_LEFT.md
│   ├── QUICK_START.md
│   └── PROJECT_MAP.md
│
└── logs/                             # Log dosyalari (otomatik olusur)
    ├── error.log
    └── combined.log
```

---

## API ENDPOINTLERI

### Auth (Kimlik Dogrulama)
| Method | Endpoint | Aciklama |
|--------|----------|----------|
| POST | /auth/login | Admin girisi |
| GET | /auth/profile | Profil bilgisi (JWT gerekli) |
| POST | /auth/verify | Token dogrulama |
| POST | /auth/change-password | Sifre degistirme |

### Bookings (Rezervasyonlar)
| Method | Endpoint | Aciklama |
|--------|----------|----------|
| GET | /bookings | Tum rezervasyonlar |
| GET | /bookings/:id | Tek rezervasyon |
| POST | /bookings | Yeni rezervasyon |
| PATCH | /bookings/:id | Guncelleme |
| DELETE | /bookings/:id | Silme |

### ERA (Tren Arama)
| Method | Endpoint | Aciklama |
|--------|----------|----------|
| GET | /era/stations/search | Istasyon arama |
| GET | /era/popular-routes | Populer rotalar |
| POST | /era/search | Sefer arama |

### Payment (Odeme)
| Method | Endpoint | Aciklama |
|--------|----------|----------|
| POST | /payment/create | Odeme baslat |
| POST | /payment/callback | MSU callback |
| GET | /payment/status/:id | Odeme durumu |

### My Trips (Biletlerim)
| Method | Endpoint | Aciklama |
|--------|----------|----------|
| POST | /my-trips/request-link | Magic link talep |
| GET | /my-trips/verify | Token ile bilet getir |

### Email (YENI)
| Method | Endpoint | Aciklama |
|--------|----------|----------|
| POST | /email/test | Test email gonder |

### PDF
| Method | Endpoint | Aciklama |
|--------|----------|----------|
| GET | /pdf/ticket/:bookingId | PDF bilet indir |
| GET | /pdf/ticket/pnr/:pnr | PNR ile PDF indir |

### Health
| Method | Endpoint | Aciklama |
|--------|----------|----------|
| GET | /health | Basit durum |
| GET | /health/detailed | Detayli durum |

### Campaigns
| Method | Endpoint | Aciklama |
|--------|----------|----------|
| GET | /campaigns | Tum kampanyalar |
| POST | /campaigns | Yeni kampanya |
| POST | /campaigns/validate | Kod dogrulama |

---

## DATABASE SEMASI

### booking
| Kolon | Tip | Aciklama |
|-------|-----|----------|
| id | SERIAL | Primary key |
| pnr | VARCHAR | Benzersiz PNR |
| customerName | VARCHAR | Musteri adi |
| customerEmail | VARCHAR | Email |
| fromStation | VARCHAR | Kalkis |
| toStation | VARCHAR | Varis |
| departureDate | VARCHAR | Tarih |
| price | DECIMAL | Fiyat |
| status | VARCHAR | PENDING/CONFIRMED/CANCELLED |
| createdAt | TIMESTAMP | Olusturma |

### admin_users
| Kolon | Tip | Aciklama |
|-------|-----|----------|
| id | SERIAL | Primary key |
| email | VARCHAR | Email (unique) |
| password | VARCHAR | Hashed sifre |
| name | VARCHAR | Isim |
| role | VARCHAR | admin/user |

### campaign
| Kolon | Tip | Aciklama |
|-------|-----|----------|
| id | SERIAL | Primary key |
| code | VARCHAR | Kampanya kodu |
| discountPercent | INT | Indirim yuzdesi |
| validFrom | DATE | Baslangic |
| validTo | DATE | Bitis |
| isActive | BOOLEAN | Aktif mi |

---

## TEKNOLOJI STACK

### Backend
- NestJS 10
- TypeORM
- PostgreSQL 15
- JWT (Passport)
- Resend (Email)
- PDFKit

### Frontend
- Next.js 14
- React 18
- Tailwind CSS
- TypeScript

### Altyapi
- Docker (PostgreSQL)
- Node.js 18+

---

## ENTEGRASYONLAR

| Servis | Durum | Aciklama |
|--------|-------|----------|
| Resend | AKTIF | Email gonderimi |
| MSU/Payten | BEKLIYOR | Odeme (credentials gerekli) |
| ERA/Rail Europe | MOCK | Tren arama (gercek API bekliyor) |

---

**Detayli bilgi:** WHERE_WE_LEFT.md
