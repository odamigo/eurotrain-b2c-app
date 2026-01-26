# 🔍 EUROTRAIN AUDIT CHECKLIST

> **Amaç:** Dünya çapında B2C travel sitesi standartlarında kod kalitesi değerlendirmesi  
> **Son Güncelleme:** 27 Ocak 2026  
> **Durum:** İlk Değerlendirme Tamamlandı

---

## 📊 ÖZET SKOR

| Alan | Skor | Öncelik |
|------|------|---------|
| Kod Organizasyonu | 🟡 6/10 | YÜKSEK |
| Güvenlik | 🟡 7/10 | KRİTİK |
| Performans | 🟡 6/10 | ORTA |
| Test Coverage | 🔴 2/10 | YÜKSEK |
| Design System | 🔴 3/10 | ORTA |
| Accessibility | 🔴 2/10 | ORTA |
| Documentation | 🟢 8/10 | DÜŞÜK |
| Scalability | 🟡 6/10 | ORTA |

---

## 🏗️ CTO & ENGINEERING LEAD PERSPEKTİFİ

### 1. Kod Organizasyonu

#### 🔴 KRİTİK SORUNLAR

**A. Duplicate Modül İsimlendirmesi**
```
backend/src/
├── booking/           ← TEK booking işlemleri
│   ├── booking.controller.ts
│   ├── booking.service.ts
│   └── entities/booking.entity.ts
│
└── bookings/          ← ÇOĞUL bookings işlemleri (AYNI İŞ!)
    ├── bookings.controller.ts
    ├── bookings.service.ts
    └── entities/booking.entity.ts  ← AYNI ENTITY DUPLICATE!
```
**Etki:** Hangi modül kullanılacak belirsiz, entity duplicate, bakım kabusu  
**Çözüm:** Birini sil, diğerini standartlaştır (önerilen: `bookings/`)

**B. Backup Dosyaları Git'te**
```
frontend/app/
├── page.tsx.backup
├── search/
│   ├── page.backup.tsx
│   └── page.tsx.bak
```
**Etki:** Repository kirliliği, karışıklık  
**Çözüm:** `.gitignore`'a ekle, mevcut olanları sil

**C. Orphan Backup Klasörü**
```
backend/src/era-backup-20260124-212353/  ← Neden production'da?
```
**Etki:** Kod kirliliği, gereksiz bundle size  
**Çözüm:** Sil veya `.gitignore`'a ekle

#### 🟡 ORTA SORUNLAR

**D. Dosya Boyutları**
| Dosya | Tahmini Satır | Durum |
|-------|---------------|-------|
| `frontend/app/search/page.tsx` | ~800-1000 | 🟡 Sınırda |
| `frontend/app/booking/page.tsx` | ~1200 | 🔴 Çok büyük |
| `frontend/app/booking/checkout/page.tsx` | ~1300 | 🔴 Çok büyük |
| `backend/src/era/mock/era-mock.service.ts` | ~700 | 🟡 Kabul edilebilir |

**Öneri:** 500+ satır dosyaları component'lere ayır

**E. Component Eksikliği**
```
frontend/
├── app/           ← Tüm UI burada (YANLIŞ)
└── components/    ← BOŞ veya YOK
```
**Olması Gereken:**
```
frontend/
├── app/                    ← Sadece page routing
├── components/
│   ├── ui/                 ← Button, Input, Card
│   ├── booking/            ← BookingCard, TravelerForm
│   ├── search/             ← JourneyCard, FilterPills
│   └── layout/             ← Header, Footer, Sidebar
└── lib/
    ├── hooks/              ← useBooking, useSearch
    └── utils/              ← formatPrice, formatDate
```

---

### 2. Type Safety & Consistency

#### 🔴 KRİTİK

**A. snake_case vs camelCase Karışıklığı**
```typescript
// booking.entity.ts (camelCase)
departureDate: string;
trainNumber: string;

// bookings.service.ts (snake_case gönderim)
departure_date: dto.departureDate,
train_number: dto.trainNumber,
```
**Etki:** 42 TypeScript hatası, runtime bug riski  
**Çözüm:** Tüm entity'lerde camelCase, DTO'larda transform decorator

**B. Loose Typing**
```typescript
// Kötü
const journey: any = response.data;
comfortConfig[comfortClass] || COMFORT_CONFIG.standard;

// İyi
const journey: Journey = response.data;
COMFORT_CONFIG[comfortClass as ComfortClass] ?? COMFORT_CONFIG.standard;
```

---

### 3. Error Handling

#### 🟡 ORTA SORUNLAR

**A. Tutarsız Try-Catch**
```typescript
// Bazı yerlerde var
try {
  await fetch(...);
} catch (e) {
  console.error(e);  // Sadece log, kullanıcıya bilgi yok
}

// Bazı yerlerde yok
const response = await fetch(...);  // Hata yakalanmaz
```

**Standart Olması Gereken:**
```typescript
try {
  const response = await fetch(...);
  if (!response.ok) throw new ApiError(response.status);
  return await response.json();
} catch (error) {
  if (error instanceof ApiError) {
    showUserError(getErrorMessage(error.status));
  } else {
    showUserError('Beklenmeyen bir hata oluştu');
    logToSentry(error);
  }
}
```

---

### 4. Security

#### 🟢 İYİ DURUMDA
- [x] JWT authentication
- [x] Helmet.js kullanımı
- [x] Rate limiting (@nestjs/throttler)
- [x] CORS yapılandırması
- [x] bcrypt ile password hashing
- [x] class-validator ile input validation

#### 🟡 İYİLEŞTİRME GEREKLİ
- [ ] **PII Logging:** Hassas veriler loglarda maskelenmeli
- [ ] **JWT Refresh Token:** Mevcut değil, sadece access token
- [ ] **API Key Rotation:** ERA API key değişim stratejisi yok
- [ ] **SQL Injection:** TypeORM kullanılıyor (güvenli) ama raw query var mı kontrol edilmeli

#### 🔴 EKSİK
- [ ] **Rate Limiting per Endpoint:** Genel limit var, endpoint bazlı yok
- [ ] **Request Signing:** Özellikle ödeme için gerekli
- [ ] **Audit Logging:** Kim ne zaman ne yaptı kaydı yok

---

### 5. Performance

#### 🟡 DEĞERLENDİRME GEREKLİ

**A. Frontend Bundle Size**
```json
// frontend-package.json - Potansiyel sorunlar
"lucide-react": "^0.562.0"  // 1000+ icon, tree-shaking var mı?
"canvas-confetti": "^1.9.4" // Sadece success page için mi?
```

**B. Backend Query Optimization**
- [ ] N+1 query kontrolü
- [ ] Index kullanımı
- [ ] Connection pooling

**C. Caching Strategy**
```
Mevcut:
- ERA token cache (60dk) ✅
- Places cache (7 gün) ✅
- Search cache (15dk) ✅
- Session cache (30dk) ✅

Eksik:
- Redis (production için şart)
- CDN static assets
- API response cache headers
```

---

### 6. Test Coverage

#### 🔴 KRİTİK EKSİK

**Mevcut Testler:**
```
backend/src/
├── app.controller.spec.ts      ← Sadece boilerplate
├── bookings/
│   ├── bookings.controller.spec.ts  ← Var mı içi dolu?
│   └── bookings.service.spec.ts
├── campaigns/
│   ├── campaigns.controller.spec.ts
│   └── campaigns.service.spec.ts
└── pricing/
    ├── pricing.controller.spec.ts
    └── pricing.service.spec.ts
```

**Eksik Kritik Testler:**
- [ ] ERA API integration tests
- [ ] Payment flow tests
- [ ] Booking lifecycle tests
- [ ] Frontend component tests
- [ ] E2E tests (Cypress/Playwright)

**Hedef Coverage:** %80 minimum

---

## 🎨 CHIEF DESIGN OFFICER PERSPEKTİFİ

### 1. Design System

#### 🔴 MEVCUT DEĞİL

**Sorun:** Her component kendi style'ını tanımlıyor
```typescript
// search/page.tsx
className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-5"

// booking/page.tsx
className="bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl p-5"
// ↑ from-blue-600 vs from-blue-600 tutarlı mı? Her seferinde kontrol gerekli
```

**Olması Gereken:**
```typescript
// design-tokens.ts
export const colors = {
  primary: {
    gradient: 'from-blue-600 to-indigo-600',
    solid: 'bg-blue-600',
    hover: 'hover:bg-blue-700',
  },
  // ...
};

// Card.tsx
<div className={cn(tokens.card.base, tokens.colors.primary.gradient)}>
```

### 2. Component Library

#### 🔴 EKSİK

**Radix UI Kullanımı:** Var ama sarmalanmamış
```json
"@radix-ui/react-dialog": "^1.1.15",
"@radix-ui/react-dropdown-menu": "^2.1.16",
// ... daha fazla
```

**Öneri:** shadcn/ui pattern'i ile sarmalama
```
frontend/components/ui/
├── button.tsx
├── card.tsx
├── input.tsx
├── dialog.tsx
└── index.ts
```

### 3. Spacing & Typography

#### 🟡 TUTARSIZ

**Sorun:** Hardcoded değerler
```typescript
// Farklı dosyalarda
className="p-4"    // 16px
className="p-5"    // 20px
className="p-6"    // 24px
className="px-4 py-3"  // Neden farklı?
```

**Öneri:** Spacing scale tanımla
```typescript
// spacing.ts
export const spacing = {
  card: 'p-5',        // Tüm card'lar
  section: 'p-6',     // Section container
  input: 'px-4 py-2.5', // Tüm input'lar
};
```

### 4. Color Palette

#### 🟡 TANIMLI AMA DAĞINIK

**Project Rules'da Tanımlı:**
```
Primary: #1a365d (Derin Lacivert)
Secondary: #f59e0b (Altın/Amber)
Accent: #0891b2 (Turkuaz)
```

**Kodda Kullanım:**
```typescript
// Tutarsız - rules'dan farklı
className="from-blue-600"     // #2563eb, rules'daki değil
className="text-amber-700"    // #b45309, rules'daki değil
```

**Çözüm:** Tailwind config'de custom colors
```javascript
// tailwind.config.js
colors: {
  eurotrain: {
    primary: '#1a365d',
    secondary: '#f59e0b',
    accent: '#0891b2',
  }
}
```

### 5. Responsive Design

#### 🟡 MEVCUT AMA TUTARSIZ

**İyi:**
```typescript
className="grid grid-cols-1 lg:grid-cols-3 gap-8"
className="hidden sm:block"
```

**Sorunlu:**
```typescript
// Bazı yerlerde mobile-first değil
className="text-2xl"  // Desktop varsayılan
// vs
className="text-lg sm:text-xl lg:text-2xl"  // Mobile-first (doğru)
```

### 6. Accessibility (a11y)

#### 🔴 CİDDİ EKSİKLER

**Eksik:**
- [ ] ARIA labels
- [ ] Keyboard navigation
- [ ] Focus management
- [ ] Screen reader support
- [ ] Color contrast check
- [ ] Alt text for images

**Örnek Sorun:**
```typescript
// Kötü
<button onClick={handleClick}>
  <Train className="w-5 h-5" />
</button>

// İyi
<button 
  onClick={handleClick}
  aria-label="Ana sayfaya git"
  title="Ana Sayfa"
>
  <Train className="w-5 h-5" aria-hidden="true" />
</button>
```

---

## 📦 CPO (PRODUCT) PERSPEKTİFİ

### 1. User Flow Analysis

#### Booking Completion Funnel
```
Homepage → Search → Select Journey → Booking → Payment → Success
   ↓         ↓           ↓             ↓         ↓         ↓
  1 tık    1 tık      1-2 tık       3-5 dk    ext.     done

Toplam: 5 adım, ~5-7 dakika
Benchmark (Trainline): 4 adım, ~3-4 dakika
```

**İyileştirme Fırsatları:**
- [ ] Guest checkout (kayıt zorunlu değil) ✅ Var
- [ ] Saved travelers (tekrar bilgi girme yok) ❌ Yok
- [ ] Apple/Google Pay (tek tık ödeme) ❌ Yok
- [ ] Auto-fill from browser ❌ Kontrol edilmeli

### 2. Error Recovery

#### 🟡 KISMI MEVCUT

**Mevcut:**
- Session timeout warning ✅
- Price change modal ✅
- Alternative journey suggestion ✅

**Eksik:**
- [ ] Form auto-save (sayfa yenilemede kayıp)
- [ ] Offline mode handling
- [ ] Network error retry

### 3. Analytics & Tracking

#### 🔴 EKSİK

**Olması Gereken:**
```typescript
// Her kritik aksiyonda
analytics.track('journey_selected', {
  origin: 'Paris',
  destination: 'London',
  price: 89,
  class: 'standard',
});

analytics.track('booking_started', { ... });
analytics.track('payment_initiated', { ... });
analytics.track('booking_completed', { ... });
```

**Araçlar:** Google Analytics 4, Mixpanel, Amplitude

---

## 🔐 CISO (SECURITY) PERSPEKTİFİ

### 1. PII Handling (GDPR/KVKK)

#### 🟡 KISMI UYUMLU

**İyi:**
- Minimum veri toplama ✅
- HTTPS everywhere ✅

**Eksik:**
- [ ] Veri silme endpoint'i (right to erasure)
- [ ] Data export endpoint (right to portability)
- [ ] Consent management
- [ ] Cookie banner
- [ ] Privacy policy page (frontend eksik)

### 2. Authentication

#### 🟡 İYİLEŞTİRME GEREKLİ

**Mevcut:**
```
JWT Access Token → 1 saat expiry (varsayım)
```

**Eksik:**
```
Refresh Token → Yok
Token Blacklist → Yok (logout sonrası token hala geçerli)
MFA → Yok (admin için şart)
```

### 3. API Security

#### 🟢 İYİ DURUMDA

```typescript
// main.ts
app.use(helmet());
app.enableCors({ origin: [...] });

// Throttler
@UseGuards(ThrottlerGuard)
```

**Öneri:** Endpoint bazlı rate limiting
```typescript
// Ödeme için daha sıkı
@Throttle({ default: { limit: 5, ttl: 60000 } })
async initiatePayment() {}

// Search için daha gevşek
@Throttle({ default: { limit: 30, ttl: 60000 } })
async searchJourneys() {}
```

### 4. Dependency Security

#### 🟡 KONTROL GEREKLİ

```bash
# Çalıştırılmalı
npm audit --audit-level=high
npx snyk test
```

**Bilinen Riskli Paketler:**
- `sharp` → Native binding, CVE geçmişi var
- `pdfkit` → Low-risk ama güncel mi?

---

## 📋 ÖNCELİKLİ EYLEM PLANI

### 🔴 HEMEN (Bu Hafta)

1. **Duplicate modül temizliği**
   - `booking/` veya `bookings/` - birini sil
   - Entity duplicate'ı kaldır
   
2. **Backup dosyaları temizle**
   - `.gitignore` güncelle
   - Mevcut backup'ları sil

3. **snake_case/camelCase düzelt**
   - 6 dosyada refactoring
   - 42 TypeScript hatası düzelt

### 🟡 KISA VADE (2 Hafta)

4. **Component library başlat**
   - `frontend/components/ui/` oluştur
   - Button, Card, Input sarmalama
   
5. **Design tokens tanımla**
   - Colors, spacing, typography
   - Tailwind config güncelle

6. **Test coverage artır**
   - Kritik flow'lar için unit test
   - %50 coverage hedefi

### 🟢 ORTA VADE (1 Ay)

7. **Accessibility audit**
   - ARIA labels ekle
   - Keyboard navigation
   - Lighthouse a11y skoru >90

8. **Security hardening**
   - Refresh token implementasyonu
   - Admin MFA
   - Audit logging

9. **Performance optimization**
   - Bundle size analizi
   - Code splitting
   - Redis cache

---

## 📊 HAFTALIK TAKİP METRİKLERİ

| Metrik | Mevcut | Hedef | Tarih |
|--------|--------|-------|-------|
| TypeScript Errors | 42 | 0 | 1 Şubat |
| Test Coverage | ~5% | 50% | 15 Şubat |
| Lighthouse Performance | ? | >90 | 1 Mart |
| Lighthouse Accessibility | ? | >90 | 1 Mart |
| Duplicate Code | Var | Yok | 1 Şubat |
| Security Audit Score | ? | A | 15 Şubat |

---

## 🔗 İLGİLİ DOKÜMANLAR

- [WHERE_WE_LEFT.md](./WHERE_WE_LEFT.md) - Günlük progress
- [PROJECT_MAP.md](./PROJECT_MAP.md) - Proje yapısı
- [STRATEGIC_ROADMAP.md](./STRATEGIC_ROADMAP.md) - Uzun vadeli plan
- [docs/MCP_ARCHITECTURE.md](./docs/MCP_ARCHITECTURE.md) - MCP tasarımı

---

> **Not:** Bu doküman her sprint sonunda güncellenmelidir.
