# 🚂 EUROTRAIN - NEREDE KALDIK

**Son Güncelleme:** 28 Ocak 2026, 20:35  
**Git Branch:** main  
**Durum:** 🟡 **PRODUCTION LIVE - PAYTEN DESTEK BEKLİYOR**

---

## ⚠️ MEVCUT DURUM

### Production
- ✅ Frontend: Vercel LIVE
- ✅ Backend: Railway LIVE
- ✅ Database: Neon LIVE
- ✅ Monitoring: Sentry LIVE
- 🟡 **Payment: Payten - LOCAL OK, PRODUCTION "DECLINED"**

### Payten Sorunu (BEKLEMEDE)
**Hata:** `99 - Declined` - Payten API session token isteğini reddediyor

**Log:**
```
[MsuService] Session token failed: 99 - Declined
[PaymentService] Payment initiation failed: Declined
```

**Muhtemel Sebepler:**
1. Return URL Payten panelinde tanımlı değil
2. Railway IP'si Payten whitelist'inde değil
3. Test ortamı domain kısıtlaması var

**Yapılacak:**
- [ ] Payten destek ile iletişim
- [ ] Return URL: `https://eurotrain-b2c-app-production.up.railway.app/payment/callback`
- [ ] Merchant: `eurotrain`

---

## 💳 PAYTEN ENTEGRASYONU ÖZETİ

### Çalışan (Local)
- ✅ Session token oluşturma
- ✅ Hosted payment page redirect
- ✅ Callback handling
- ✅ Mock payment (test kart 4242)
- ✅ Payment success sayfası

### Production'da Sorun
- ❌ `99 - Declined` hatası
- Payten test ortamı production URL'i kabul etmiyor olabilir

---

## 🗄️ DATABASE ŞEMASI

### Payments Tablosu (Neon'da GÜNCELLEME GEREKTİ!)

Entity'deki kolonlar ile Neon'daki kolonlar uyuşmuyor. Aşağıdaki SQL çalıştırılmalı:

```sql
-- Eski tabloyu sil (test verisi kaybı)
DROP TABLE IF EXISTS payments;

-- Yeni tabloyu oluştur
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "orderId" VARCHAR(255) UNIQUE NOT NULL,
  "bookingId" INTEGER,
  amount DECIMAL(10,2) NOT NULL,
  "refundedAmount" DECIMAL(10,2) DEFAULT 0,
  currency VARCHAR(10) DEFAULT 'EUR',
  status VARCHAR(50) DEFAULT 'pending',
  "paymentMethod" VARCHAR(50),
  "transactionId" VARCHAR(255),
  "sessionToken" TEXT,
  "pgTranId" VARCHAR(255),
  "pgOrderId" VARCHAR(255),
  "authCode" VARCHAR(255),
  rrn VARCHAR(255),
  "errorCode" VARCHAR(255),
  "errorMessage" TEXT,
  "cardLastFour" VARCHAR(4),
  "cardBrand" VARCHAR(50),
  "cardBank" VARCHAR(255),
  "customerEmail" VARCHAR(255),
  "customerName" VARCHAR(255),
  "customerIp" VARCHAR(50),
  "is3DSecure" BOOLEAN DEFAULT false,
  "threeDSecureResult" VARCHAR(255),
  "installmentCount" INTEGER,
  "installmentAmount" DECIMAL(10,2),
  "refundTransactionId" VARCHAR(255),
  "refundReason" TEXT,
  "refundedBy" VARCHAR(255),
  "refundedAt" TIMESTAMP,
  "rawRequest" JSONB,
  "rawResponse" JSONB,
  "callbackData" JSONB,
  "retryCount" INTEGER DEFAULT 0,
  "lastRetryAt" TIMESTAMP,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "completedAt" TIMESTAMP
);

CREATE INDEX idx_payments_order_id ON payments("orderId");
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_customer_email ON payments("customerEmail");
```

---

## 📊 YAPILANDIRMA

### Railway Environment Variables
```
DATABASE_URL = postgresql://...
JWT_SECRET = eurotrain-super-secret-key-2026-production
RESEND_API_KEY = re_***
FRONTEND_URL = https://eurotrain-b2c-app.vercel.app
BACKEND_URL = https://eurotrain-b2c-app-production.up.railway.app
ERA_MOCK_MODE = true
ERA_POINT_OF_SALE = EUROTRAIN
NODE_ENV = production
PORT = 3001
DB_SYNCHRONIZE = false
SENTRY_DSN = https://...@sentry.io/...
# PAYTEN MSU
MSU_API_URL = https://test.merchantsafeunipay.com/msu/api/v2
MSU_HOSTED_PAGE_URL = https://test.merchantsafeunipay.com
MSU_MERCHANT = eurotrain
MSU_MERCHANT_USER = ***
MSU_MERCHANT_PASSWORD = ***
MSU_MERCHANT_SECRET_KEY = ***
```

### Vercel Environment Variables
```
NEXT_PUBLIC_API_URL = https://eurotrain-b2c-app-production.up.railway.app
NEXT_PUBLIC_SITE_URL = https://eurotrain-b2c-app.vercel.app
SENTRY_AUTH_TOKEN = sntrys_***
```

---

## 🎯 SONRAKİ ADIMLAR

### 🔴 Beklemede (Payten Destek Gerekli)
- [ ] Payten ile iletişim - "99 Declined" hatası
- [ ] Return URL whitelist: `https://eurotrain-b2c-app-production.up.railway.app/payment/callback`
- [ ] Railway IP whitelist kontrolü

### 🟡 Neon Güncelleme Gerekli
- [ ] Payments tablosu yeniden oluştur (yukarıdaki SQL)

### 🟢 Sonraki Geliştirmeler
- [ ] BetterUptime monitoring
- [ ] Custom domain (eurotrain.net)
- [ ] Round-trip desteği
- [ ] My Trips Phase 2 (Wallet)
- [ ] Mobile responsive
- [ ] i18n (TR/EN)

---

## 🔗 PANEL BAĞLANTILARI

| Panel | URL |
|-------|-----|
| Vercel | https://vercel.com/odamigos-projects/eurotrain-b2c-app |
| Railway | https://railway.app/project/6c5b6994-9f2f-4c85-a8c2-adfd9d9b0dae |
| Neon | https://console.neon.tech |
| Sentry | https://odamigo.sentry.io |
| Resend | https://resend.com/api-keys |
| **Payten** | https://merchant.payten.com.tr |

---

## 🚀 HIZLI TEST

```bash
# Health Check
curl https://eurotrain-b2c-app-production.up.railway.app/health

# Frontend
open https://eurotrain-b2c-app.vercel.app

# Local Test (Payten çalışır)
cd C:\dev\eurotrain-b2c-app\backend && npm run start:dev
cd C:\dev\eurotrain-b2c-app\frontend && npm run dev
```

---

## 📁 BUGÜNKİ DEĞİŞİKLİKLER

### Düzeltilen Dosyalar
```
backend/.env                           - Duplicate MSU satırları temizlendi
backend/src/main.ts                    - Sentry hatası düzeltildi
backend/src/payment/msu.config.ts      - Return URL düzeltildi
backend/src/payment/payment.service.ts - Frontend redirect URL'leri
frontend/app/booking/page.tsx          - Gerçek Payten entegrasyonu + Station.label → Station.name fix
```

### Commit
```
fc66c04 feat: Payten MSU payment integration - end-to-end working
```

---

## ⚠️ ÖNEMLİ NOTLAR

1. **Payten LOCAL'de çalışıyor, PRODUCTION'da "Declined"** - Payten destek gerekli
2. **Neon payments tablosu** - Entity ile uyumsuz, SQL ile yeniden oluşturulmalı
3. **ERA API** - Mock modda, gerçek bilet kesmiyor
4. **Güvenlik** - Credentials asla GitHub'a push edilmemeli!

---

## 📞 PAYTEN DESTEK İÇİN

**Sorulacak:**
> "Test ortamında SESSIONTOKEN isteği yapıyoruz, responseCode 99 - Declined alıyoruz.
> - Return URL: `https://eurotrain-b2c-app-production.up.railway.app/payment/callback`
> - Merchant: `eurotrain`
> - Local (localhost:3001) çalışıyor, production URL reddediliyor
> - Sorun ne olabilir? IP whitelist veya domain kısıtlaması var mı?"

---

**Son Durum:** Local ödeme çalışıyor ✅ | Production Payten beklemede 🟡
