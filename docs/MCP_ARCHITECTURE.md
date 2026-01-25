# EuroTrain MCP Architecture

> **Version:** 2.0  
> **Last Updated:** 2025-01-26  
> **Status:** Production-Ready Design

---

## 1. Overview

EuroTrain MCP (Model Context Protocol) Server, AI asistanlarının (Claude, GPT, vb.) Avrupa tren bileti araması ve rezervasyonu yapmasını sağlayan güvenli bir API katmanıdır.

### Design Principles

1. **Minimal Data Exposure** - AI'a sadece gerekli veriler döndürülür
2. **PII Protection** - Kişisel veriler asla AI context'ine girmez
3. **Fail-Safe Behavior** - Hata durumlarında güvenli fallback
4. **Idempotency** - Tekrarlanan çağrılar aynı sonucu verir
5. **Traceability** - Her işlem trace_id ile izlenebilir

---

## 2. Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           AI ASSISTANT                                   │
│                    (Claude, GPT, Custom Agent)                          │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ MCP Protocol
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         MCP SERVER (NestJS)                             │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                        TOOL ENDPOINTS                             │  │
│  │  POST /mcp/tools/search-trains                                    │  │
│  │  POST /mcp/tools/get-offer-details                                │  │
│  │  POST /mcp/tools/create-booking-session                           │  │
│  │  POST /mcp/tools/get-booking-status                               │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                    │                                     │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                     IN-MEMORY CACHES                              │  │
│  │  ┌────────────────┐    ┌────────────────┐                        │  │
│  │  │  Offer Cache   │    │ Session Cache  │                        │  │
│  │  │  TTL: 15 min   │    │  TTL: 30 min   │                        │  │
│  │  └────────────────┘    └────────────────┘                        │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        EUROTRAIN BACKEND                                │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐            │
│  │ ERA Search Svc │  │ Bookings Svc   │  │ Payment Svc    │            │
│  └────────────────┘  └────────────────┘  └────────────────┘            │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                          EXTERNAL APIS                                  │
│  ┌────────────────┐  ┌────────────────┐                                │
│  │   ERA API      │  │  Payten/MSU    │                                │
│  │ (Rail Europe)  │  │  (Payment)     │                                │
│  └────────────────┘  └────────────────┘                                │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Tool Specifications

### 3.1 search-trains

**Purpose:** Tren seferlerini arar ve offer referansları döndürür.

**Input:**
```json
{
  "origin": "FRPAR",
  "destination": "GBLST",
  "date": "2025-02-15",
  "passengers": {
    "adults": 2,
    "children": 1
  },
  "class_preference": "any",
  "trace_id": "tr_abc123"
}
```

**Output:**
```json
{
  "success": true,
  "search_id": "search_abc123def456",
  "route": {
    "origin": "Paris Gare du Nord",
    "destination": "London St Pancras"
  },
  "date": "2025-02-15",
  "passengers": { "adults": 2, "children": 1 },
  "offers": [
    {
      "offer_ref": "offer_1a2b3c4d5e6f7890",
      "departure": "08:15",
      "arrival": "10:30",
      "duration_minutes": 135,
      "operator": "EUROSTAR",
      "train_number": "ES9012",
      "price": { "amount": 89.00, "currency": "EUR" },
      "comfort_class": "standard",
      "seats_available": true,
      "is_refundable": false,
      "is_exchangeable": true,
      "offer_expires_at": "2025-01-26T22:30:00Z"
    }
  ],
  "offers_count": 5,
  "search_expires_at": "2025-01-26T22:30:00Z",
  "trace_id": "tr_abc123"
}
```

**Security Notes:**
- `offer_ref` is a hashed reference, not the actual ERA offer_location
- No PII in request or response
- Results cached for 15 minutes
- Rate limited: 30 req/min per IP

---

### 3.2 get-offer-details

**Purpose:** Belirli bir teklifin detaylı kurallarını ve fiyat dökümünü döndürür.

**Input:**
```json
{
  "offer_ref": "offer_1a2b3c4d5e6f7890",
  "search_id": "search_abc123def456",
  "trace_id": "tr_abc123"
}
```

**Output:**
```json
{
  "success": true,
  "offer_ref": "offer_1a2b3c4d5e6f7890",
  "journey": {
    "origin": "Paris Gare du Nord",
    "destination": "London St Pancras",
    "date": "2025-02-15",
    "departure": "08:15",
    "arrival": "10:30",
    "duration_minutes": 135
  },
  "train": {
    "operator": "EUROSTAR",
    "train_number": "ES9012",
    "train_type": "Yüksek Hızlı Tren"
  },
  "class_info": {
    "name": "Standart",
    "code": "standard",
    "amenities": ["WiFi", "Elektrik prizi", "Klima"]
  },
  "refund_policy": {
    "refundable": false,
    "conditions": "Bu bilet iade edilemez."
  },
  "exchange_policy": {
    "exchangeable": true,
    "conditions": "Kalkıştan önce değiştirilebilir.",
    "fee": { "amount": 10, "currency": "EUR" }
  },
  "baggage": {
    "included": "2 büyük bavul + 1 el bagajı",
    "max_weight_kg": 30
  },
  "boarding": {
    "check_in_minutes": 45,
    "documents_required": ["Pasaport veya Kimlik Kartı", "E-Bilet"]
  },
  "price_breakdown": {
    "ticket_price": 267.00,
    "service_fee": 13.35,
    "total": 280.35,
    "currency": "EUR",
    "per_passenger": 89.00,
    "passengers": 3
  },
  "offer_valid_until": "2025-01-26T22:30:00Z",
  "trace_id": "tr_abc123"
}
```

---

### 3.3 create-booking-session

**Purpose:** Checkout için oturum oluşturur ve URL döndürür.

**Input:**
```json
{
  "offer_ref": "offer_1a2b3c4d5e6f7890",
  "search_id": "search_abc123def456",
  "passengers": { "adults": 2, "children": 1 },
  "locale": "tr-TR",
  "currency": "EUR",
  "trace_id": "tr_abc123",
  "idempotency_key": "idem_xyz789"
}
```

**Output:**
```json
{
  "success": true,
  "session_token": "sess_abc123xyz789",
  "checkout_url": "https://eurotrain.net/checkout/sess_abc123xyz789",
  "price_summary": {
    "ticket_total": 267.00,
    "service_fee": 13.35,
    "grand_total": 280.35,
    "currency": "EUR",
    "passengers": 3
  },
  "journey_summary": {
    "route": "Paris Gare du Nord → London St Pancras",
    "date": "15 Şubat 2025 Cumartesi",
    "time": "08:15 - 10:30",
    "operator": "EUROSTAR",
    "train_number": "ES9012",
    "class": "Standart"
  },
  "session_expires_at": "2025-01-26T23:00:00Z",
  "remaining_seconds": 1800,
  "next_steps": [
    "Checkout sayfasında yolcu bilgilerini doldurun",
    "Koşulları kabul edin",
    "Güvenli ödeme ile biletinizi alın",
    "E-bilet e-posta adresinize gönderilecek"
  ],
  "trace_id": "tr_abc123"
}
```

**Important Notes:**
- **NO ERA API call at this stage** - ERA booking happens at payment
- Session valid for 30 minutes
- Idempotency key prevents duplicate sessions
- Checkout URL is single-use

---

### 3.4 get-booking-status

**Purpose:** Mevcut rezervasyonun durumunu sorgular.

**Input:**
```json
{
  "booking_reference": "ET-ABC123",
  "trace_id": "tr_abc123"
}
```

**Output:**
```json
{
  "success": true,
  "booking_reference": "ET-ABC123",
  "status": "CONFIRMED",
  "journey": {
    "route": "Paris → London",
    "date": "2025-02-15",
    "departure_time": "08:15"
  },
  "tickets_available": true,
  "download_url": "https://eurotrain.net/tickets/ET-ABC123",
  "next_action": null,
  "trace_id": "tr_abc123"
}
```

---

## 4. Security Implementation

### 4.1 PII Protection

**Never exposed to AI:**
- Full names (only initials: "J*** D***")
- Email addresses (masked: "j***@g***.com")
- Phone numbers
- Passport/ID numbers
- Payment card details
- PNR/carrier references

**Log Redaction:**
```typescript
// ❌ Wrong
logger.info(`Booking for john.doe@email.com`);

// ✅ Correct
logger.info(`Booking for j***@e***.com`, { trace_id: "tr_abc" });
```

### 4.2 Input Validation

All inputs validated with:
- Type checking
- Max length limits
- Regex patterns for IDs
- Enum validation for options

```typescript
@IsString()
@Matches(/^offer_[a-f0-9]{16}$/)
offer_ref: string;
```

### 4.3 Rate Limiting

| Endpoint | Limit | Window |
|----------|-------|--------|
| search-trains | 30 | 1 min |
| get-offer-details | 60 | 1 min |
| create-booking-session | 10 | 1 min |
| get-booking-status | 20 | 1 min |

### 4.4 Idempotency

`create-booking-session` supports idempotency:
```json
{
  "idempotency_key": "idem_xyz789",
  ...
}
```

Same key within TTL returns existing session, not new one.

---

## 5. Error Handling

### Error Codes

| Code | User Message | Retry? |
|------|--------------|--------|
| OFFER_NOT_FOUND | Teklif bulunamadı | No |
| OFFER_EXPIRED | Teklif süresi dolmuş | No, search again |
| SESSION_EXPIRED | Oturum süresi dolmuş | No, create new |
| RATE_LIMIT_EXCEEDED | Çok fazla istek | Yes, wait 1 min |
| SERVICE_UNAVAILABLE | Servis kullanılamıyor | Yes, wait |
| INVALID_INPUT | Geçersiz giriş | No, fix input |

### Fail-Safe Behavior

AI assistants MUST:
1. Never say "rezervasyon yapıldı" until `status: CONFIRMED`
2. Show checkout URL, not claim booking is complete
3. On error, suggest retry or new search
4. Never fabricate booking references

---

## 6. Data Flow

### Search → Checkout Flow

```
User: "Paris-London bilet bak"
           │
           ▼
┌─────────────────────────────────────┐
│ AI: search-trains tool              │
│ → Offers cached (15 min TTL)        │
│ → Returns offer_refs to AI          │
└─────────────────────────────────────┘
           │
           ▼
User: "İlk seçeneği al"
           │
           ▼
┌─────────────────────────────────────┐
│ AI: create-booking-session tool     │
│ → Session created (30 min TTL)      │
│ → Returns checkout_url to user      │
│ → NO ERA API call yet               │
└─────────────────────────────────────┘
           │
           ▼
User: Opens checkout URL in browser
           │
           ▼
┌─────────────────────────────────────┐
│ Checkout Page (Frontend)            │
│ → Fill traveler info                │
│ → Accept terms                      │
│ → Click "Pay"                       │
└─────────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────┐
│ Payment Flow (Backend)              │
│ 1. ERA: POST /bookings              │
│ 2. ERA: PUT /travelers              │
│ 3. ERA: POST /prebook               │
│ 4. Payten: Process payment          │
│ 5. ERA: POST /confirm               │
│ 6. ERA: POST /print → E-ticket      │
└─────────────────────────────────────┘
```

---

## 7. Production Checklist

### Phase 1: Current (Mock Mode)
- [x] Tool endpoints implemented
- [x] In-memory caching
- [x] PII redaction in logs
- [x] Rate limiting
- [x] Idempotency support
- [x] Error handling
- [x] Trace ID support

### Phase 2: ERA Integration (When Sandbox Available)
- [ ] Real ERA search integration
- [ ] Offer location mapping
- [ ] Prebook at payment initiation
- [ ] Confirm after payment success
- [ ] E-ticket generation

### Phase 3: Production Hardening
- [ ] Redis cache (replace in-memory)
- [ ] Prometheus metrics
- [ ] Sentry error tracking
- [ ] Load testing
- [ ] Prompt injection test suite

---

## 8. MCP Server Manifest

```json
{
  "name": "eurotrain-mcp",
  "version": "2.0.0",
  "description": "European train booking via EuroTrain",
  "tools": [
    {
      "name": "search-trains",
      "description": "Search for train journeys between European cities",
      "input_schema": { "$ref": "#/definitions/SearchTrainsInput" }
    },
    {
      "name": "get-offer-details",
      "description": "Get detailed information about a specific offer",
      "input_schema": { "$ref": "#/definitions/GetOfferDetailsInput" }
    },
    {
      "name": "create-booking-session",
      "description": "Create a checkout session for booking",
      "input_schema": { "$ref": "#/definitions/CreateSessionInput" }
    },
    {
      "name": "get-booking-status",
      "description": "Check status of an existing booking",
      "input_schema": { "$ref": "#/definitions/GetBookingStatusInput" }
    }
  ],
  "capabilities": [
    "Search train journeys",
    "Show prices and schedules",
    "Create checkout links",
    "Check booking status"
  ],
  "limitations": [
    "Cannot process payments directly",
    "Cannot modify existing bookings",
    "Cannot access user personal data"
  ]
}
```

---

## 9. Contact & Support

- **Technical Issues:** dev@eurotrain.net
- **API Status:** status.eurotrain.net
- **Documentation:** docs.eurotrain.net/mcp
