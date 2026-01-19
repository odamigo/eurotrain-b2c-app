# 🗺️ EUROTRAIN PROJECT MAP

**Son Güncelleme:** 19 Ocak 2026
**Durum:** %92 Tamamlandı
**Domain:** eurotrain.net

---

## 📁 PROJE YAPISI

```
eurotrain-platform/
├── backend/                          # NestJS Backend API
│   ├── src/
│   │   ├── security/                 # ✨ GÜVENLİK MODÜLÜ
│   │   │   ├── entities/
│   │   │   │   └── admin-user.entity.ts   # Admin kullanıcı tablosu
│   │   │   ├── auth.module.ts             # Auth modül
│   │   │   ├── auth.service.ts            # Login, token işlemleri
│   │   │   ├── auth.controller.ts         # /auth/* endpoints
│   │   │   ├── jwt.strategy.ts            # JWT doğrulama
│   │   │   ├── jwt-auth.guard.ts          # Route koruması
│   │   │   ├── health.controller.ts       # /health endpoints
│   │   │   ├── logger.service.ts          # Error logging
│   │   │   ├── logs.controller.ts         # /admin/logs endpoints
│   │   │   ├── global-exception.filter.ts # Hata yakalama
│   │   │   ├── security.module.ts         # Ana modül
│   │   │   └── index.ts
│   │   │
│   │   ├── bookings/                 # Rezervasyon modülü
│   │   │   ├── dto/
│   │   │   │   └── create-booking.dto.ts
│   │   │   ├── entities/
│   │   │   │   └── booking.entity.ts
│   │   │   ├── bookings.controller.ts
│   │   │   ├── bookings.service.ts
│   │   │   └── bookings.module.ts
│   │   │
│   │   ├── my-trips/                 # Biletlerim modülü
│   │   │   ├── my-trips.controller.ts
│   │   │   ├── my-trips.service.ts
│   │   │   └── my-trips.module.ts
│   │   │
│   │   ├── payment/                  # Ödeme modülü (MSU)
│   │   │   ├── dto/
│   │   │   │   └── payment.dto.ts
│   │   │   ├── entities/
│   │   │   │   └── payment.entity.ts
│   │   │   ├── msu.config.ts
│   │   │   ├── msu.service.ts
│   │   │   ├── payment.controller.ts
│   │   │   ├── payment.service.ts
│   │   │   └── payment.module.ts
│   │   │
│   │   ├── era/                      # ERA API modülü
│   │   │   ├── dto/
│   │   │   ├── entities/
│   │   │   ├── era-mock.service.ts
│   │   │   ├── era.controller.ts
│   │   │   └── era.module.ts
│   │   │
│   │   ├── pricing/                  # Fiyatlandırma modülü
│   │   │   ├── pricing.controller.ts
│   │   │   ├── pricing.service.ts
│   │   │   └── pricing.module.ts
│   │   │
│   │   ├── campaigns/                # Kampanya modülü
│   │   │   ├── dto/
│   │   │   ├── entities/
│   │   │   ├── campaigns.controller.ts
│   │   │   ├── campaigns.service.ts
│   │   │   └── campaigns.module.ts
│   │   │
│   │   ├── trains/
│   │   │   └── trains.controller.ts
│   │   │
│   │   ├── app.module.ts
│   │   ├── app.controller.ts
│   │   ├── app.service.ts
│   │   └── main.ts
│   │
│   ├── logs/                         # Log dosyaları (otomatik)
│   │   ├── error.log
│   │   └── combined.log
│   │
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/                         # Next.js Frontend
│   ├── app/
│   │   ├── page.tsx
│   │   ├── layout.tsx
│   │   ├── globals.css
│   │   ├── search/
│   │   │   └── page.tsx
│   │   ├── booking/
│   │   │   └── page.tsx
│   │   ├── my-trips/
│   │   │   └── page.tsx
│   │   ├── payment/
│   │   │   ├── page.tsx
│   │   │   ├── success/
│   │   │   │   └── page.tsx
│   │   │   └── error/
│   │   │       └── page.tsx
│   │   └── admin/
│   │       ├── layout.tsx
│   │       ├── page.tsx
│   │       ├── bookings/
│   │       │   └── page.tsx
│   │       ├── campaigns/
│   │       │   ├── page.tsx
│   │       │   ├── new/
│   │       │   │   └── page.tsx
│   │       │   └── [id]/
│   │       │       └── page.tsx
│   │       └── components/
│   │           ├── Sidebar.tsx
│   │           ├── Header.tsx
│   │           ├── StatsCard.tsx
│   │           └── DataTable.tsx
│   │
│   ├── components/
│   │   ├── ui/
│   │   └── search/
│   │
│   ├── lib/
│   │   ├── api/
│   │   │   └── client.ts
│   │   └── utils.ts
│   │
│   ├── package.json
│   └── tsconfig.json
│
├── docker/
│   └── docker-compose.yml
│
└── docs/
    ├── WHERE_WE_LEFT.md
    ├── PROJECT_MAP.md
    └── QUICK_START.md
```

---

## 🔌 API ENDPOİNTLERİ

### Authentication (YENİ!)
| Method | Endpoint | Auth | Açıklama |
|--------|----------|------|----------|
| POST | `/auth/login` | ❌ | Admin girişi |
| GET | `/auth/profile` | ✅ | Mevcut kullanıcı |
| POST | `/auth/change-password` | ✅ | Şifre değiştir |
| GET | `/auth/admins` | ✅ | Admin listesi (superadmin) |
| POST | `/auth/admins` | ✅ | Yeni admin oluştur |
| POST | `/auth/verify` | ❌ | Token doğrula |

### Health Check (YENİ!)
| Method | Endpoint | Auth | Açıklama |
|--------|----------|------|----------|
| GET | `/health` | ❌ | Basit durum kontrolü |
| GET | `/health/detailed` | ❌ | Detaylı sistem bilgisi |

### Admin Logs (YENİ!)
| Method | Endpoint | Auth | Açıklama |
|--------|----------|------|----------|
| GET | `/admin/logs/errors` | ✅ | Son hatalar |
| GET | `/admin/logs/stats` | ✅ | Hata istatistikleri |

### Bookings
| Method | Endpoint | Auth | Açıklama |
|--------|----------|------|----------|
| GET | `/bookings` | ❌ | Tüm rezervasyonlar |
| GET | `/bookings/:id` | ❌ | Tek rezervasyon |
| POST | `/bookings` | ❌ | Yeni rezervasyon |

### My Trips
| Method | Endpoint | Auth | Açıklama |
|--------|----------|------|----------|
| POST | `/my-trips/request-link` | ❌ | Magic link talep et |
| GET | `/my-trips/verify?token=xxx` | ❌ | Token ile biletleri getir |
| GET | `/my-trips/:id` | ❌ | Tek bilet detayı |
| GET | `/my-trips/order/:orderId` | ❌ | PNR ile bilet getir |

### Payment
| Method | Endpoint | Auth | Açıklama |
|--------|----------|------|----------|
| POST | `/payment/initiate` | ❌ | Ödeme başlat |
| GET/POST | `/payment/callback` | ❌ | MSU callback |
| GET | `/payment/status/:orderId` | ❌ | Ödeme durumu |

### ERA (Sefer Arama)
| Method | Endpoint | Auth | Açıklama |
|--------|----------|------|----------|
| GET | `/era/stations/search` | ❌ | İstasyon ara |
| POST | `/era/journeys/search` | ❌ | Sefer ara |
| GET | `/era/popular-routes` | ❌ | Popüler rotalar |

### Pricing
| Method | Endpoint | Auth | Açıklama |
|--------|----------|------|----------|
| GET | `/pricing/calculate` | ❌ | Servis ücreti hesapla |
| GET | `/pricing/convert` | ❌ | Döviz çevir |

### Campaigns
| Method | Endpoint | Auth | Açıklama |
|--------|----------|------|----------|
| GET | `/campaigns` | ❌ | Tüm kampanyalar |
| POST | `/campaigns` | ❌ | Yeni kampanya |
| GET | `/campaigns/validate/:code` | ❌ | Kod doğrula |

---

## 🗄️ DATABASE ŞEMASI

### admin_users tablosu (YENİ!)
```sql
id              SERIAL PRIMARY KEY
email           VARCHAR UNIQUE NOT NULL
password        VARCHAR NOT NULL (bcrypt hash)
name            VARCHAR NOT NULL
role            VARCHAR DEFAULT 'admin'
isActive        BOOLEAN DEFAULT true
lastLoginAt     TIMESTAMP
lastLoginIp     VARCHAR
createdAt       TIMESTAMP
updatedAt       TIMESTAMP
```

### booking tablosu
```sql
id                  SERIAL PRIMARY KEY
customerName        VARCHAR NOT NULL
customerEmail       VARCHAR NOT NULL
fromStation         VARCHAR NOT NULL
toStation           VARCHAR NOT NULL
price               DECIMAL NOT NULL
status              VARCHAR DEFAULT 'PENDING'
createdAt           TIMESTAMP DEFAULT NOW()
-- My Trips kolonları
magic_token         VARCHAR(64)
token_expires_at    TIMESTAMP
pnr                 VARCHAR(20)
train_number        VARCHAR(20)
coach               VARCHAR(10)
seat                VARCHAR(10)
departure_date      DATE
departure_time      TIME
arrival_time        TIME
operator            VARCHAR(50)
ticket_class        VARCHAR(20) DEFAULT 'Standard'
ticket_pdf_url      TEXT
```

### payments tablosu
```sql
id                  UUID PRIMARY KEY
order_id            VARCHAR(255)
amount              DECIMAL(10,2)
currency            VARCHAR(10) DEFAULT 'TL'
status              VARCHAR(50) DEFAULT 'pending'
transaction_id      VARCHAR(255)
error_message       TEXT
card_last_four      VARCHAR(4)
customer_email      VARCHAR(255)
customer_name       VARCHAR(255)
created_at          TIMESTAMP
updated_at          TIMESTAMP
```

### campaign tablosu
```sql
id                  SERIAL PRIMARY KEY
code                VARCHAR UNIQUE
name                VARCHAR
discountType        VARCHAR (FIXED/PERCENT)
discountValue       DECIMAL
usageLimit          INTEGER
usedCount           INTEGER
startDate           TIMESTAMP
endDate             TIMESTAMP
isActive            BOOLEAN
```

---

## 🛠️ TEKNOLOJİLER

### Backend
- NestJS 10
- TypeORM
- PostgreSQL 15
- Passport.js + JWT
- bcrypt
- Helmet
- @nestjs/throttler

### Frontend
- Next.js 14 (App Router)
- React 18
- Tailwind CSS
- Shadcn/ui
- Lucide React icons

### Altyapı
- Docker
- MSU (Moka) Payment Gateway

---

## 🎯 FRONTEND ROUTES

| Route | Açıklama | Auth |
|-------|----------|------|
| `/` | Ana sayfa (arama formu) | ❌ |
| `/search` | Arama sonuçları | ❌ |
| `/booking` | Rezervasyon formu | ❌ |
| `/my-trips` | Biletlerim (magic link) | ❌ |
| `/payment` | Ödeme sayfası | ❌ |
| `/payment/success` | Başarılı ödeme | ❌ |
| `/payment/error` | Hatalı ödeme | ❌ |
| `/admin` | Admin dashboard | 🔜 |
| `/admin/bookings` | Rezervasyon yönetimi | 🔜 |
| `/admin/campaigns` | Kampanya yönetimi | 🔜 |

---

## 📊 DURUM

| Modül | Backend | Frontend | Auth | Test |
|-------|---------|----------|------|------|
| Arama | ✅ | ✅ | ❌ | ✅ |
| Rezervasyon | ✅ | ✅ | ❌ | ✅ |
| Ödeme | ✅ | ✅ | ❌ | ⏳ |
| My Trips | ✅ | ✅ | ❌ | ✅ |
| Admin | ✅ | ✅ | 🔜 | ⏳ |
| Kampanya | ✅ | ✅ | ❌ | ✅ |
| Auth | ✅ | 🔜 | ✅ | ✅ |
| Health | ✅ | - | ❌ | ✅ |
| Logging | ✅ | - | ✅ | ✅ |