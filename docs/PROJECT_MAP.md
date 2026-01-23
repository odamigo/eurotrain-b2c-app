# 🗺️ EUROTRAIN PROJECT MAP

**Son Güncelleme:** 24 Ocak 2026
**Durum:** %94 Tamamlandı
**Domain:** eurotrain.net

---

## 📁 PROJE YAPISI
```
eurotrain-b2c-app/
├── backend/                          # NestJS Backend API
│   ├── src/
│   │   ├── security/                 # Güvenlik Modülü
│   │   │   ├── entities/
│   │   │   │   └── admin-user.entity.ts
│   │   │   ├── auth.module.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── auth.controller.ts
│   │   │   ├── jwt.strategy.ts
│   │   │   ├── jwt-auth.guard.ts
│   │   │   ├── health.controller.ts
│   │   │   ├── logger.service.ts
│   │   │   ├── logs.controller.ts
│   │   │   ├── global-exception.filter.ts
│   │   │   └── security.module.ts
│   │   │
│   │   ├── bookings/                 # Rezervasyon
│   │   │   ├── dto/
│   │   │   ├── entities/
│   │   │   ├── bookings.controller.ts
│   │   │   ├── bookings.service.ts
│   │   │   └── bookings.module.ts
│   │   │
│   │   ├── my-trips/                 # Biletlerim
│   │   │   ├── my-trips.controller.ts
│   │   │   ├── my-trips.service.ts
│   │   │   └── my-trips.module.ts
│   │   │
│   │   ├── payment/                  # ✨ ÖDEME (GÜNCELLENDİ)
│   │   │   ├── dto/
│   │   │   │   └── payment.dto.ts          # InitiatePaymentDto, RefundPaymentDto
│   │   │   ├── entities/
│   │   │   │   └── payment.entity.ts       # Multi-currency, Refund, 3D Secure
│   │   │   ├── msu.config.ts               # EUR/USD/TRY config
│   │   │   ├── msu.service.ts              # Retry, Mock, Refund API
│   │   │   ├── payment.controller.ts       # Webhook, Callback, Refund
│   │   │   ├── payment.service.ts          # Mock callback, Refund
│   │   │   └── payment.module.ts
│   │   │
│   │   ├── email/                    # Email Servisi
│   │   │   ├── email.controller.ts
│   │   │   ├── email.service.ts
│   │   │   └── email.module.ts
│   │   │
│   │   ├── pdf/                      # PDF E-Bilet
│   │   │   ├── pdf.controller.ts
│   │   │   ├── pdf.service.ts
│   │   │   ├── qr.service.ts
│   │   │   └── pdf.module.ts
│   │   │
│   │   ├── era/                      # Rail Europe API
│   │   │   ├── dto/
│   │   │   ├── entities/
│   │   │   ├── era-mock.service.ts
│   │   │   ├── era.controller.ts
│   │   │   └── era.module.ts
│   │   │
│   │   ├── pricing/                  # Fiyatlandırma
│   │   │   ├── pricing.controller.ts
│   │   │   ├── pricing.service.ts
│   │   │   └── pricing.module.ts
│   │   │
│   │   ├── campaigns/                # Kampanyalar
│   │   │   ├── dto/
│   │   │   ├── entities/
│   │   │   ├── campaigns.controller.ts
│   │   │   ├── campaigns.service.ts
│   │   │   └── campaigns.module.ts
│   │   │
│   │   ├── app.module.ts
│   │   ├── app.controller.ts
│   │   ├── app.service.ts
│   │   └── main.ts
│   │
│   ├── logs/                         # Log dosyaları
│   ├── .env                          # Environment variables
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/                         # Next.js Frontend
│   ├── app/
│   │   ├── page.tsx                  # Ana sayfa
│   │   ├── layout.tsx
│   │   ├── globals.css
│   │   ├── search/
│   │   │   └── page.tsx
│   │   ├── booking/
│   │   │   └── page.tsx
│   │   ├── my-trips/
│   │   │   └── page.tsx
│   │   ├── payment/                  # ✨ GÜNCELLENDİ
│   │   │   ├── page.tsx              # Para birimi seçimi
│   │   │   ├── success/
│   │   │   │   └── page.tsx          # Konfeti, PDF indirme
│   │   │   └── error/
│   │   │       └── page.tsx          # Çözüm önerileri
│   │   └── admin/
│   │       ├── layout.tsx
│   │       ├── page.tsx
│   │       ├── login/
│   │       │   └── page.tsx
│   │       ├── bookings/
│   │       │   └── page.tsx
│   │       └── campaigns/
│   │           └── page.tsx
│   │
│   ├── components/
│   ├── lib/
│   ├── package.json
│   └── tsconfig.json
│
├── docker/
│   └── docker-compose.yml
│
└── docs/
    ├── WHERE_WE_LEFT.md
    ├── PROJECT_MAP.md
    ├── QUICK_START.md
    └── STRATEGIC_ROADMAP.md
```

---

## 🔌 API ENDPOİNTLERİ

### Authentication
| Method | Endpoint | Auth | Açıklama |
|--------|----------|------|----------|
| POST | `/auth/login` | ❌ | Admin girişi |
| GET | `/auth/profile` | ✅ | Mevcut kullanıcı |
| POST | `/auth/change-password` | ✅ | Şifre değiştir |

### Health Check
| Method | Endpoint | Auth | Açıklama |
|--------|----------|------|----------|
| GET | `/health` | ❌ | Basit durum |
| GET | `/health/detailed` | ❌ | Detaylı bilgi |

### Payment (GÜNCELLENDİ - 24 Ocak)
| Method | Endpoint | Auth | Açıklama |
|--------|----------|------|----------|
| POST | `/payment/initiate` | ❌ | Ödeme başlat |
| GET | `/payment/callback` | ❌ | Payten callback (redirect) |
| POST | `/payment/callback` | ❌ | Payten callback (POST) |
| POST | `/payment/webhook` | ❌ | Payten webhook |
| GET | `/payment/status/:paymentId` | ❌ | Ödeme durumu |
| GET | `/payment/order/:orderId` | ❌ | Order ID ile sorgula |
| GET | `/payment/booking/:bookingId` | ❌ | Booking ile sorgula |
| POST | `/payment/refund` | ✅ | İade işlemi |
| GET | `/payment/list` | ✅ | Ödeme listesi |

### Bookings
| Method | Endpoint | Auth | Açıklama |
|--------|----------|------|----------|
| GET | `/bookings` | ❌ | Tüm rezervasyonlar |
| GET | `/bookings/:id` | ❌ | Tek rezervasyon |
| POST | `/bookings` | ❌ | Yeni rezervasyon |

### My Trips
| Method | Endpoint | Auth | Açıklama |
|--------|----------|------|----------|
| POST | `/my-trips/request-link` | ❌ | Magic link talep |
| GET | `/my-trips/verify` | ❌ | Token doğrula |
| GET | `/my-trips/:id` | ❌ | Bilet detayı |

### PDF
| Method | Endpoint | Auth | Açıklama |
|--------|----------|------|----------|
| GET | `/pdf/ticket/:bookingId` | ❌ | PDF bilet indir |
| GET | `/pdf/ticket/pnr/:pnr` | ❌ | PNR ile PDF |

### ERA (Sefer Arama)
| Method | Endpoint | Auth | Açıklama |
|--------|----------|------|----------|
| GET | `/era/stations/search` | ❌ | İstasyon ara |
| POST | `/era/journeys/search` | ❌ | Sefer ara |

### Email
| Method | Endpoint | Auth | Açıklama |
|--------|----------|------|----------|
| POST | `/email/send-ticket` | ❌ | Bilet emaili |
| POST | `/email/test` | ✅ | Test email |

---

## 🗄️ DATABASE ŞEMASI

### payments (GÜNCELLENDİ)
```sql
id                    UUID PRIMARY KEY
orderId               VARCHAR UNIQUE
bookingId             INTEGER
amount                DECIMAL(10,2)
refundedAmount        DECIMAL(10,2) DEFAULT 0
currency              ENUM('EUR','USD','TRY')
status                ENUM('pending','processing','completed','failed','refunded','partially_refunded','cancelled')
paymentMethod         ENUM('credit_card','debit_card')
sessionToken          VARCHAR
pgTranId              VARCHAR
pgOrderId             VARCHAR
authCode              VARCHAR
rrn                   VARCHAR
errorCode             VARCHAR
errorMessage          VARCHAR
cardLastFour          VARCHAR
cardBrand             VARCHAR
cardBank              VARCHAR
customerEmail         VARCHAR
customerName          VARCHAR
customerIp            VARCHAR
is3DSecure            BOOLEAN DEFAULT false
threeDSecureResult    VARCHAR
installmentCount      INTEGER
refundTransactionId   VARCHAR
refundReason          VARCHAR
refundedBy            VARCHAR
refundedAt            TIMESTAMP
rawRequest            JSON
rawResponse           JSON
callbackData          JSON
retryCount            INTEGER DEFAULT 0
createdAt             TIMESTAMP
updatedAt             TIMESTAMP
completedAt           TIMESTAMP
```

### bookings
```sql
id                  SERIAL PRIMARY KEY
customerName        VARCHAR NOT NULL
customerEmail       VARCHAR NOT NULL
fromStation         VARCHAR NOT NULL
toStation           VARCHAR NOT NULL
price               DECIMAL NOT NULL
status              VARCHAR DEFAULT 'PENDING'
pnr                 VARCHAR(20)
train_number        VARCHAR(20)
departure_date      DATE
departure_time      TIME
arrival_time        TIME
magic_token         VARCHAR(64)
token_expires_at    TIMESTAMP
createdAt           TIMESTAMP
```

### admin_users
```sql
id              SERIAL PRIMARY KEY
email           VARCHAR UNIQUE NOT NULL
password        VARCHAR NOT NULL
name            VARCHAR NOT NULL
role            VARCHAR DEFAULT 'admin'
isActive        BOOLEAN DEFAULT true
lastLoginAt     TIMESTAMP
createdAt       TIMESTAMP
```

---

## 🛠️ TEKNOLOJİLER

### Backend
- NestJS 10
- TypeORM
- PostgreSQL 15
- Passport.js + JWT
- bcrypt
- @nestjs/throttler
- Resend (email)
- pdfkit + qrcode (PDF)

### Frontend
- Next.js 16 (App Router)
- React 19
- Tailwind CSS
- Lucide React icons
- canvas-confetti

### Altyapı
- Docker
- Payten MSU (Payment Gateway)

---

## 📊 MODÜL DURUMU

| Modül | Backend | Frontend | Test |
|-------|---------|----------|------|
| Auth/Security | ✅ | ✅ | ✅ |
| Bookings | ✅ | ✅ | ✅ |
| Payment | ✅ | ✅ | ⏳ |
| My Trips | ✅ | ✅ | ✅ |
| Email | ✅ | - | ✅ |
| PDF | ✅ | - | ✅ |
| ERA | ✅ (mock) | ✅ | ✅ |
| Campaigns | ✅ | ✅ | ✅ |
| Admin | ✅ | ✅ | ✅ |
| Settings | 🔜 | 🔜 | - |
| i18n | - | 🔜 | - |