# 🚀 EUROTRAIN PRODUCTION DEPLOYMENT PLAN

> **Hazırlayan:** C-Level Teknoloji Ekibi  
> **Tarih:** 27 Ocak 2026  
> **Durum:** Planlama Aşaması

---

## 📊 YÖNETİCİ ÖZETİ

### Karar: Railway.app + Vercel + Neon PostgreSQL

| Bileşen | Platform | Neden |
|---------|----------|-------|
| **Backend** | Railway.app | Free tier, kolay scaling, Docker desteği |
| **Frontend** | Vercel | Zaten kullanılıyor, Next.js optimizasyonu |
| **Database** | Neon PostgreSQL | Free tier 0.5GB, serverless, auto-scaling |
| **Monitoring** | Sentry.io | Free tier 5K events/ay, error tracking |
| **Uptime** | BetterUptime | Free tier 10 monitors |
| **Domain** | Natro | Mevcut, SSL hazır |

### Maliyet Analizi (Başlangıç)

| Platform | Free Tier | Pro (Gelecek) |
|----------|-----------|---------------|
| Railway | $5 kredi/ay | $20/ay |
| Vercel | Sınırsız | $20/ay |
| Neon | 0.5GB storage | $19/ay |
| Sentry | 5K events | $26/ay |
| BetterUptime | 10 monitors | $20/ay |
| **TOPLAM** | **$0/ay** | **~$105/ay** |

---

## 🏗️ MİMARİ KARARLARI

### CTO Perspektifi

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLOUDFLARE                               │
│                    (DNS, DDoS Protection, CDN)                   │
└─────────────────────────────────────────────────────────────────┘
                                │
        ┌───────────────────────┴───────────────────────┐
        │                                               │
        ▼                                               ▼
┌───────────────────┐                       ┌───────────────────┐
│     VERCEL        │                       │   RAILWAY.APP     │
│   (Frontend)      │                       │    (Backend)      │
│                   │                       │                   │
│ • Next.js 16      │    REST API          │ • NestJS 11       │
│ • React 19        │ ◄─────────────────►  │ • TypeORM         │
│ • Static + SSR    │                       │ • JWT Auth        │
│                   │                       │                   │
│ eurotrain.net     │                       │ api.eurotrain.net │
└───────────────────┘                       └─────────┬─────────┘
                                                      │
                                                      ▼
                                            ┌───────────────────┐
                                            │  NEON PostgreSQL  │
                                            │   (Database)      │
                                            │                   │
                                            │ • Serverless      │
                                            │ • Auto-scaling    │
                                            │ • 0.5GB free      │
                                            └───────────────────┘
                                                      │
        ┌─────────────────────────────────────────────┤
        │                                             │
        ▼                                             ▼
┌───────────────────┐                       ┌───────────────────┐
│    SENTRY.IO      │                       │   BETTERUPTIME    │
│  (Error Tracking) │                       │   (Monitoring)    │
└───────────────────┘                       └───────────────────┘
```

### Neden Bu Seçimler?

**Railway.app (Backend)**
- ✅ GitHub entegrasyonu (auto-deploy)
- ✅ Free tier $5/ay kredi (yeterli başlangıç için)
- ✅ Kolay environment variables
- ✅ Built-in logging
- ✅ Horizontal scaling hazır (gelecek için)
- ✅ Docker desteği (esneklik)
- ❌ Alternatif: Render.com (daha yavaş cold start)

**Neon PostgreSQL (Database)**
- ✅ Serverless (kullanmadığında uyur)
- ✅ 0.5GB free tier (başlangıç için yeterli)
- ✅ Connection pooling dahil
- ✅ Branching (test ortamları)
- ✅ Railway'den ayrı = bağımsızlık
- ❌ Alternatif: Railway PostgreSQL (aynı infra riski)

**Vercel (Frontend)**
- ✅ Zaten kullanılıyor
- ✅ Next.js için optimize
- ✅ Edge network (hızlı)
- ✅ Preview deployments
- ✅ Analytics dahil

---

## 🔐 GÜVENLİK MİMARİSİ (CISO Perspektifi)

### Environment Variables Stratejisi

```
┌─────────────────────────────────────────────────────────────────┐
│                    SECRETS YÖNETİMİ                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  PRODUCTION                    STAGING                           │
│  ──────────                    ───────                           │
│  Railway Secrets               Railway Secrets                   │
│  Vercel Env Vars               Vercel Preview Env               │
│                                                                  │
│  ⚠️ ASLA:                                                       │
│  • .env dosyası commit etme                                     │
│  • Credentials doküman yazma                                    │
│  • Log'lara hassas veri basma                                   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Güvenlik Checklist

| Kontrol | Durum | Aksiyon |
|---------|-------|---------|
| HTTPS zorunlu | ⏳ | Cloudflare + Railway |
| JWT httpOnly cookie | ⚠️ | main.ts güncelle |
| Rate limiting | ✅ | @nestjs/throttler var |
| CORS kısıtlama | ⚠️ | Production URL ekle |
| SQL injection | ✅ | TypeORM parameterized |
| XSS koruması | ⚠️ | Helmet.js ekle |
| Secrets rotation | ⏳ | 90 günde bir |
| Dependency audit | ⏳ | npm audit --fix |

### Kritik Güvenlik Güncellemeleri

```typescript
// main.ts - Production için güncellenecek
app.enableCors({
  origin: [
    'https://eurotrain.net',
    'https://www.eurotrain.net',
    'https://staging.eurotrain.net', // Staging için
  ],
  credentials: true,
});

// Helmet ekle
app.use(helmet());

// Trust proxy (Railway arkasında)
app.set('trust proxy', 1);
```

---

## 📋 DEPLOYMENT ADIMLARI

### AŞAMA 1: Hazırlık (Bugün)

#### 1.1 Neon PostgreSQL Kurulumu
```
1. https://neon.tech adresine git
2. GitHub ile kayıt ol
3. "Create Project" → "eurotrain-production"
4. Region: Frankfurt (eu-central-1) - Avrupa için
5. Connection string'i kopyala
```

#### 1.2 Railway.app Kurulumu
```
1. https://railway.app adresine git
2. GitHub ile kayıt ol
3. "New Project" → "Deploy from GitHub repo"
4. eurotrain-b2c-app seç
5. Backend klasörünü root olarak ayarla
```

#### 1.3 Sentry.io Kurulumu
```
1. https://sentry.io adresine git
2. Ücretsiz hesap oluştur
3. NestJS projesi ekle
4. DSN'i kopyala
```

---

### AŞAMA 2: Backend Deployment

#### 2.1 Gerekli Dosyalar

**Dockerfile (backend/Dockerfile)**
```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
EXPOSE 3001
CMD ["node", "dist/main.js"]
```

**railway.json**
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "DOCKERFILE",
    "dockerfilePath": "Dockerfile"
  },
  "deploy": {
    "startCommand": "node dist/main.js",
    "healthcheckPath": "/health",
    "healthcheckTimeout": 100,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 3
  }
}
```

#### 2.2 Environment Variables (Railway)

```env
# Database (Neon'dan al)
DATABASE_URL=postgresql://user:pass@ep-xxx.eu-central-1.aws.neon.tech/eurotrain?sslmode=require

# Ayrı DB değişkenleri (TypeORM için)
DB_HOST=ep-xxx.eu-central-1.aws.neon.tech
DB_PORT=5432
DB_USERNAME=user
DB_PASSWORD=xxx
DB_NAME=eurotrain
DB_SSL=true

# JWT
JWT_SECRET=<güçlü-rastgele-string-32-karakter>

# Email
RESEND_API_KEY=re_xxx

# Frontend
FRONTEND_URL=https://staging.eurotrain.net

# ERA API
ERA_AUTH_URL=https://authent-sandbox.era.raileurope.com
ERA_API_URL=https://api-sandbox.era.raileurope.com
ERA_CLIENT_ID=
ERA_CLIENT_SECRET=
ERA_POINT_OF_SALE=EUROTRAIN
ERA_MOCK_MODE=true

# Payten MSU
MSU_API_URL=https://test.merchantsafeunipay.com/msu/api/v2
MSU_HOSTED_PAGE_URL=https://test.merchantsafeunipay.com
MSU_MERCHANT=eurotrain
MSU_MERCHANT_USER=<secret>
MSU_MERCHANT_PASSWORD=<secret>
MSU_MERCHANT_SECRET_KEY=<secret>

# Sentry
SENTRY_DSN=https://xxx@sentry.io/xxx

# Node
NODE_ENV=production
PORT=3001
```

---

### AŞAMA 3: Frontend Deployment

#### 3.1 Vercel Güncellemeleri

**next.config.ts**
```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // API rewrites
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL}/:path*`,
      },
    ];
  },
  
  // Security headers
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
    ];
  },
  
  // Image optimization
  images: {
    domains: ['eurotrain.net'],
  },
};

export default nextConfig;
```

#### 3.2 Vercel Environment Variables

```env
NEXT_PUBLIC_API_URL=https://api.eurotrain.net
NEXT_PUBLIC_SITE_URL=https://eurotrain.net
```

---

### AŞAMA 4: DNS ve Domain Ayarları

#### 4.1 Cloudflare Kurulumu (Önerilen)

```
1. Cloudflare'e kayıt ol (ücretsiz)
2. eurotrain.net ekle
3. Natro'dan nameserver'ları Cloudflare'e yönlendir
4. SSL: Full (strict)
5. Always HTTPS: On
```

#### 4.2 DNS Kayıtları

| Tip | İsim | Değer | Proxy |
|-----|------|-------|-------|
| A | @ | Vercel IP | ✅ |
| CNAME | www | cname.vercel-dns.com | ✅ |
| CNAME | api | <railway-domain>.railway.app | ✅ |
| CNAME | staging | <vercel-preview> | ❌ |

---

### AŞAMA 5: Monitoring Kurulumu

#### 5.1 Sentry.io Entegrasyonu

**Backend (NestJS)**
```bash
npm install @sentry/nestjs @sentry/profiling-node
```

```typescript
// src/instrument.ts
import * as Sentry from "@sentry/nestjs";
import { nodeProfilingIntegration } from "@sentry/profiling-node";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  integrations: [nodeProfilingIntegration()],
  tracesSampleRate: 1.0,
  profilesSampleRate: 1.0,
  environment: process.env.NODE_ENV,
});
```

**Frontend (Next.js)**
```bash
npm install @sentry/nextjs
```

#### 5.2 BetterUptime Monitors

| Monitor | URL | Interval |
|---------|-----|----------|
| API Health | https://api.eurotrain.net/health | 1 min |
| Frontend | https://eurotrain.net | 1 min |
| Search API | https://api.eurotrain.net/era/search | 5 min |

---

## 🧪 STAGING ORTAMI

### Staging Stratejisi

```
Production: eurotrain.net + api.eurotrain.net
Staging:    staging.eurotrain.net + api-staging.eurotrain.net

Her PR → Vercel Preview URL
Main branch → Staging auto-deploy
Manual approval → Production deploy
```

### Staging Environment Variables

```env
# Staging için ayrı değerler
FRONTEND_URL=https://staging.eurotrain.net
NODE_ENV=staging
ERA_MOCK_MODE=true  # Staging'de mock
```

---

## 📅 DEPLOYMENT TAKVİMİ

### Hafta 1: Altyapı Kurulumu

| Gün | Görev | Sorumlu |
|-----|-------|---------|
| Pazartesi | Neon PostgreSQL kurulum | DevOps |
| Pazartesi | Railway.app kurulum | DevOps |
| Salı | Backend Dockerfile + deploy | Backend |
| Salı | Database migration | Backend |
| Çarşamba | Sentry.io entegrasyon | Backend |
| Çarşamba | Frontend env güncelleme | Frontend |
| Perşembe | Staging test | QA |
| Cuma | Cloudflare DNS | DevOps |

### Hafta 2: Production Go-Live

| Gün | Görev | Sorumlu |
|-----|-------|---------|
| Pazartesi | Son testler | Tüm ekip |
| Salı | DNS geçişi | DevOps |
| Salı | Production deploy | DevOps |
| Çarşamba | Monitoring kontrol | DevOps |
| Perşembe | Performance test | QA |
| Cuma | Soft launch | Product |

---

## ⚠️ RİSK ANALİZİ

| Risk | Olasılık | Etki | Önlem |
|------|----------|------|-------|
| Railway downtime | Düşük | Yüksek | Healthcheck + restart |
| Database connection | Orta | Yüksek | Connection pooling |
| Cold start gecikmesi | Orta | Orta | Keep-alive cron |
| Free tier limit | Orta | Orta | Usage monitoring |
| DNS propagation | Düşük | Orta | Cloudflare (hızlı) |

---

## 🔄 ROLLBACK PLANI

```
1. Railway'de önceki deployment'a dön
2. Vercel'de önceki commit'e dön
3. Database backup'tan restore (Neon point-in-time)
4. DNS cache flush (Cloudflare)
```

---

## ✅ GO-LIVE CHECKLIST

### Teknik
- [ ] Backend health endpoint çalışıyor
- [ ] Frontend build başarılı
- [ ] Database bağlantısı çalışıyor
- [ ] HTTPS aktif
- [ ] CORS doğru ayarlanmış
- [ ] Environment variables set
- [ ] Sentry error tracking aktif
- [ ] Uptime monitoring aktif

### İş
- [ ] Legal sayfalar hazır (Terms, Privacy)
- [ ] Contact email çalışıyor
- [ ] Payment gateway test edildi
- [ ] Müşteri destek planı hazır

### Güvenlik
- [ ] Secrets rotated (production değerler)
- [ ] npm audit clean
- [ ] OWASP top 10 kontrol
- [ ] Rate limiting aktif
- [ ] Backup stratejisi aktif

---

## 📞 EMERGENCY CONTACTS

| Servis | Destek |
|--------|--------|
| Railway | https://railway.app/help |
| Vercel | https://vercel.com/support |
| Neon | https://neon.tech/docs |
| Cloudflare | https://support.cloudflare.com |
| Payten | destek.gateway@payten.com |

---

**Sonraki Adım:** Bu planı onaylarsanız, Dockerfile ve gerekli konfigürasyon dosyalarını hazırlayalım.
