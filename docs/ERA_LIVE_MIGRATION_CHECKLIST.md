# ERA Live API Migration Checklist

> **Amaç:** Mock modundan Production ERA API'ya geçiş için yapılması gereken tüm işler
> **Durum:** BEKLEMEDE - Sandbox credentials bekleniyor
> **Son Güncelleme:** 27 Ocak 2026

---

## 📋 Pre-Migration Checklist

### 1. Credentials & Environment
- [ ] Rail Europe'dan sandbox credentials al (client_id, client_secret)
- [ ] `.env.production` dosyasına ekle:
  ```env
  ERA_MOCK_MODE=false
  ERA_CLIENT_ID=xxx
  ERA_CLIENT_SECRET=xxx
  ERA_API_URL=https://api.staging.silverrail.io  # veya production URL
  ```
- [ ] Secrets'ı Railway.app'e ekle
- [ ] GitHub Secrets'a ekle (CI/CD için)

### 2. Authentication Flow
- [ ] `era-auth.service.ts` - Token refresh logic test et
- [ ] Token expiry handling (60dk expire, 55dk'da refresh)
- [ ] Token cache (memory veya Redis)
- [ ] Auth failure retry (max 3 attempt)
- [ ] Logging: Token request/refresh events

### 3. API Response Mapping
> Mock ve Live API arasındaki farklar

| Alan | Mock | Live API | Aksiyon |
|------|------|----------|---------|
| `offer.id` | UUID | ERA format | ✅ Uyumlu |
| `legSolution.id` | UUID | ERA format | ✅ Uyumlu |
| `price.amount` | number | number (cent?) | ⚠️ Kontrol et |
| `duration` | ISO 8601 | ISO 8601 | ✅ Uyumlu |
| `segments` | Basit | Detaylı | ⚠️ Mapping gerekebilir |
| `flexibility` | Object | Object | ⚠️ Field isimleri kontrol |
| `comfortCategory` | string | string/enum | ⚠️ Mapping gerekebilir |

**Kritik:** `getJourneyFromOffer()` fonksiyonunu Live API response ile test et!

### 4. Error Handling
- [ ] Rate limiting (429) → Retry with backoff
- [ ] Auth error (401) → Token refresh → Retry
- [ ] Server error (5xx) → Circuit breaker
- [ ] Not found (404) → Graceful handling
- [ ] Timeout → User-friendly message
- [ ] Network error → Offline/retry UI

**Gerekli Kodlar:**
```typescript
// backend/src/common/interceptors/retry.interceptor.ts
// backend/src/common/interceptors/circuit-breaker.interceptor.ts
```

### 5. Booking Flow Validation
Mock'ta basit, Live'da kompleks:

```
MOCK:                          LIVE:
createBooking() ────────────► createBooking()
     │                              │
updateTravelers() ──────────► updateTravelers()
     │                              │
prebook() ──────────────────► prebook() → HOLD süresi başlar (15-30dk)
     │                              │
[SKIP] ────────────────────── validatePrices() → Fiyat değişmiş mi?
     │                              │
confirm() → Anında OK ──────► confirm() → Carrier onayı bekle
     │                              │
[SKIP] ────────────────────── printTickets() → PDF/PKPASS üret
```

- [ ] Hold timeout handling (15-30 dk)
- [ ] Price change alert UI
- [ ] Booking expiry countdown UI
- [ ] Carrier confirmation polling

### 6. Carrier-Specific Rules
Her carrier'ın kendine özgü kuralları var:

| Carrier | Özel Kurallar | Aksiyon |
|---------|---------------|---------|
| Eurostar | Passport required | [ ] Passport field ekle |
| SNCF | Carte Voyageur | [ ] Discount card UI |
| Trenitalia | CartaFreccia | [ ] Discount card UI |
| DB | BahnCard | [ ] Discount card UI |
| Renfe | Tarjeta Dorada | [ ] Discount card UI |

- [ ] Carrier rules API endpoint
- [ ] Dynamic form fields based on carrier
- [ ] Validation rules per carrier

### 7. Ticketing
- [ ] PDF ticket generation (Live API'dan URL veya binary)
- [ ] PKPASS (Apple Wallet) generation
- [ ] Email delivery integration
- [ ] Ticket resend functionality

---

## 🔧 Code Changes Required

### Backend

#### 1. `era-auth.service.ts`
```typescript
// TODO: Token refresh logic
private async refreshToken(): Promise<void> {
  // Implement token refresh before expiry
}
```

#### 2. `era-search.service.ts`
```typescript
// TODO: Live API response mapping
private mapLiveResponse(response: any): EraSearchResponse {
  // Map live API response to internal format
}
```

#### 3. New: `era-validation.service.ts`
```typescript
// TODO: Carrier-specific validation
validateBookingForCarrier(booking: any, carrier: string): ValidationResult
```

#### 4. New: `era-circuit-breaker.ts`
```typescript
// TODO: Circuit breaker pattern
class CircuitBreaker {
  private failures = 0;
  private lastFailure: Date;
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
}
```

### Frontend

#### 1. `era-client.ts`
```typescript
// TODO: Error handling enhancement
async function handleApiError(error: any): Promise<never> {
  if (error.status === 429) {
    // Rate limited - show retry UI
  }
  // ...
}
```

#### 2. New: `components/common/PriceChangeAlert.tsx`
Fiyat değişikliği uyarısı için component

#### 3. New: `components/booking/SessionTimer.tsx`
Booking hold süresi countdown

---

## 🧪 Testing Checklist

### API Tests
- [ ] Search → Valid results
- [ ] Search → No results (empty route)
- [ ] Search → Invalid params (400)
- [ ] Booking → Full flow
- [ ] Booking → Expired hold
- [ ] Booking → Price changed
- [ ] Refund → Full refund
- [ ] Refund → Partial refund

### Integration Tests
- [ ] Frontend ↔ Backend communication
- [ ] Payment ↔ Booking integration
- [ ] Email delivery
- [ ] PDF generation

### Load Tests
- [ ] 100 concurrent searches
- [ ] 50 concurrent bookings
- [ ] Rate limit handling

---

## 📊 Monitoring Setup

### Metrics to Track
- [ ] API response time (p50, p95, p99)
- [ ] Error rate by endpoint
- [ ] Token refresh frequency
- [ ] Cache hit ratio
- [ ] Booking conversion rate

### Alerts
- [ ] API error rate > 5%
- [ ] Response time > 5s
- [ ] Circuit breaker OPEN
- [ ] Token refresh failure

### Tools
- [ ] Sentry.io - Error tracking
- [ ] BetterUptime - Uptime monitoring
- [ ] Railway logs - API logs

---

## 🚀 Migration Steps

### Phase 1: Sandbox Testing (1 hafta)
1. Credentials al
2. Sandbox environment'ta test et
3. Response mapping validate et
4. Booking flow'u end-to-end test et

### Phase 2: Staging Deployment (3 gün)
1. Staging environment kur
2. Real API ile test et
3. Payment integration test (test mode)
4. Load testing

### Phase 3: Production (1 gün)
1. Feature flag ile gradual rollout
2. %10 → %50 → %100 traffic
3. Monitor and rollback if needed

---

## ⚠️ Risk Mitigation

| Risk | Olasılık | Etki | Önlem |
|------|----------|------|-------|
| API format değişikliği | Orta | Yüksek | Version pinning, adapter pattern |
| Rate limiting | Yüksek | Orta | Cache, request coalescing |
| Downtime | Düşük | Yüksek | Circuit breaker, cached results |
| Price mismatch | Orta | Yüksek | Real-time price validation |
| Booking failure | Düşük | Yüksek | Transaction rollback, refund |

---

## 📝 Notes

- Mock service'i KALDIRMA - fallback olarak tut
- Feature flag: `ERA_USE_LIVE_API=true/false`
- Gradual rollout: IP bazlı veya user bazlı
- Her zaman cached search results göster (stale ama available)
