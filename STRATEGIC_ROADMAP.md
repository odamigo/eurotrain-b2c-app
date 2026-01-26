# EuroTrain Strategic Roadmap

> **Last Updated:** 2025-01-26  
> **Current Status:** Phase 1 Round-Trip UI Complete ✅  
> **Next Milestone:** ERA API Sandbox Integration

---

## 🎯 Vision

EuroTrain, Avrupa tren bileti pazarında **AI-first** yaklaşımıyla öncü olmayı hedefliyor. MCP (Model Context Protocol) entegrasyonu ile Claude, GPT ve diğer AI asistanları üzerinden doğrudan bilet araması ve rezervasyonu mümkün olacak.

---

## 📊 Current Progress: 90%

### Core Platform
| Feature | Status | Notes |
|---------|--------|-------|
| Homepage & Search | ✅ 100% | Round-trip, Direct filter, Highlights |
| Journey Results | ✅ 100% | World-class Trainline-level UI |
| Booking Flow | ✅ 100% | Round-trip destekli |
| Payment (Payten) | ✅ 90% | Test mode working |
| E-Ticket PDF | ✅ 90% | Generation working |
| Admin Panel | ✅ 100% | JWT auth, full CRUD |
| My Trips | ✅ 95% | Phase 1 tamamlandı |

### MCP Server
| Feature | Status | Notes |
|---------|--------|-------|
| Architecture Design | ✅ 100% | World-class design |
| Tool: search-trains | ✅ 100% | Offer caching |
| Tool: get-offer-details | ✅ 100% | Rules, pricing |
| Tool: create-booking-session | ✅ 100% | Idempotency |
| Tool: get-booking-status | 🟡 50% | Needs DB integration |
| PII Redaction | ✅ 100% | Log-safe |
| Rate Limiting | ✅ 100% | 30/min per IP |
| Trace ID Support | ✅ 100% | Full traceability |
| ERA API Integration | 🔴 0% | Awaiting sandbox |

### Search & Booking UI (NEW)
| Feature | Status | Notes |
|---------|--------|-------|
| Round-trip Toggle | ✅ 100% | Homepage |
| Return Date Picker | ✅ 100% | Conditional render |
| Direct Only Filter | ✅ 100% | With count |
| Progress Steps | ✅ 100% | Gidiş → Dönüş |
| Sticky Selection Summary | ✅ 100% | Trainline style |
| Highlight Badges | ✅ 100% | En Ucuz, En Hızlı |
| Time Slot Filters | ✅ 100% | 5 time ranges |
| Class Selection Cards | ✅ 100% | 3 classes |
| Booking Round-trip | ✅ 100% | 2 journey cards |

---

## 🚀 Roadmap

### Phase 1: UI/UX Excellence (COMPLETED ✅)
**Timeline:** Week 1-2 (January 2025)

- [x] Homepage round-trip toggle
- [x] Return date picker
- [x] Direct only filter
- [x] Search page v2 - Trainline/Google Flights quality
- [x] Progress steps for round-trip
- [x] Sticky selected journey summary
- [x] Highlight badges (cheapest/fastest)
- [x] Time slot filters
- [x] Class selection cards
- [x] Booking page round-trip support
- [x] Price breakdown for round-trip
- [x] Backend highlights tracking

### Phase 1.5: Remaining Items
**Timeline:** Week 2-3 (January 2025)

- [ ] Multi-segment route mock data (aktarmalı seferler)
- [ ] Backend round-trip search: legs[] array
- [ ] Refactoring: snake_case → camelCase (42 errors)
- [ ] End-to-end integration testing
- [ ] Mobile responsiveness polish

### Phase 2: ERA API Integration + Infrastructure
**Timeline:** Week 3-4 (February 2025)
**Blocker:** Sandbox credentials from Rail Europe

#### ERA Integration:
- [ ] Obtain ERA API sandbox credentials
- [ ] Real search integration
- [ ] Offer location mapping
- [ ] Prebook at payment initiation
- [ ] Confirm after payment success
- [ ] E-ticket from ERA print endpoint
- [ ] Error handling for ERA failures

#### Infrastructure Upgrades:
- [ ] **Redis cache** - Replace in-memory (offer/session TTL)
- [ ] **Timezone standardization** - All datetime ISO 8601 with timezone
  - Example: `2025-02-15T08:15:00+01:00` (Paris) → `2025-02-15T09:30:00+00:00` (London)
  - Critical for cross-border journeys (Eurostar, Thalys)

#### New MCP Tool:
- [ ] **search-stations** - Station disambiguation
  ```
  Input: { query: "londra", locale: "tr-TR" }
  Output: [
    { code: "GBLST", name: "London St Pancras", city: "London" },
    { code: "GBQQW", name: "London Waterloo", city: "London" }
  ]
  ```

### Phase 3: Production Launch
**Timeline:** Week 5-6 (February 2025)

- [ ] Redis cache (replace in-memory)
- [ ] Sentry error tracking
- [ ] BetterUptime monitoring
- [ ] Load testing (target: 100 req/sec)
- [ ] Prompt injection test suite (10 scenarios)
- [ ] Security audit
- [ ] Production deployment
- [ ] DNS & SSL setup

### Phase 4: AI Platform Integrations
**Timeline:** March 2025
**Prerequisite:** Phase 2 & 3 complete

#### Protocol Support:
- [x] **MCP (Anthropic Claude)** - Current implementation ✅
- [ ] **OpenAPI/Swagger export** - For GPT & Gemini compatibility
- [ ] **GPT Actions (OpenAI)** - Requires OpenAPI 3.0 format
- [ ] **Gemini Function Calling (Google)** - Requires OpenAPI 3.0 format

#### Authentication (for user-specific features):
- [ ] **OAuth 2.0 implementation**
  - Required for: "Biletlerimi göster", saved travelers
  - Google OAuth consent screen setup
  - Token refresh flow

#### Additional Tools (OAuth required):
- [ ] **get-user-bookings** - List user's tickets
- [ ] **cancel-booking** - Cancel with refund check
- [ ] **exchange-booking** - Date/time change

### Phase 5: Scaling & Features
**Timeline:** Q2 2025

- [ ] Multi-language support (EN, DE, FR)
- [ ] User accounts & saved travelers
- [ ] Booking management (cancel, exchange)
- [ ] Loyalty program
- [ ] Mobile app (React Native)

### Phase 6: Skill Publishing (Post-Production Stability)
**Timeline:** Q2-Q3 2025
**Prerequisite:** Production running stable for 2+ weeks

#### Pre-Conditions (All must be met):
- [ ] ERA API production credentials active & tested
- [ ] Payten live payments active & tested
- [ ] Terms of Service published on eurotrain.net
- [ ] Privacy Policy (GDPR/KVKK compliant) published
- [ ] API endpoints stable (no breaking changes for 2 weeks)
- [ ] Legal review completed

---

## 🗺️ Technical Architecture

### MCP Server Stack
```
┌─────────────────────────────────────────┐
│            MCP Tool Layer               │
│  search-trains | get-offer-details      │
│  create-booking-session | get-status    │
└─────────────────────────────────────────┘
                    │
┌─────────────────────────────────────────┐
│          Cache Layer (In-Memory)        │
│    Offer Cache (15min) | Session (30min)│
└─────────────────────────────────────────┘
                    │
┌─────────────────────────────────────────┐
│           Service Layer                 │
│   EraSearchService | BookingsService    │
│   PaymentService | TicketService        │
└─────────────────────────────────────────┘
                    │
┌─────────────────────────────────────────┐
│           External APIs                 │
│      ERA API | Payten | TCMB            │
└─────────────────────────────────────────┘
```

### Frontend Architecture (NEW)
```
┌─────────────────────────────────────────┐
│            Homepage                     │
│  Trip Type Toggle | Station Search      │
│  Date Picker | Passenger Count          │
└─────────────────────────────────────────┘
                    │
┌─────────────────────────────────────────┐
│          Search Page v2                 │
│  Progress Steps | Filter Pills          │
│  Journey Cards | Class Selection        │
│  Highlights Badges | Sticky Summary     │
└─────────────────────────────────────────┘
                    │
┌─────────────────────────────────────────┐
│          Booking Page                   │
│  Traveler Forms | Journey Summary       │
│  Price Breakdown | Round-trip Support   │
└─────────────────────────────────────────┘
                    │
┌─────────────────────────────────────────┐
│          Payment & Success              │
│  Payten Integration | E-Ticket          │
└─────────────────────────────────────────┘
```

### Security Model
- **PII Never in AI Context** - Names, emails, passports masked
- **Offer Reference Hashing** - ERA locations never exposed
- **Rate Limiting** - 30 req/min per IP
- **Idempotency** - Duplicate calls return same result
- **Trace ID** - Every request traceable

### Booking Flow (ERA Ready)
```
1. AI: search-trains → Cache offers (15 min TTL)
2. AI: create-booking-session → Cache session (30 min TTL)
3. User: Opens checkout URL
4. User: Fills traveler form
5. User: Clicks "Pay"
6. Backend: ERA POST /bookings
7. Backend: ERA PUT /travelers  
8. Backend: ERA POST /prebook
9. Backend: Payten payment
10. Backend: ERA POST /confirm
11. Backend: ERA POST /print → E-ticket
```

---

## 🎯 Success Metrics

### Phase 1 KPIs (ACHIEVED ✅)
- [x] World-class UI comparable to Trainline
- [x] Round-trip booking flow working
- [x] Highlights (cheapest/fastest) displayed
- [x] Filter system functional

### Production KPIs
- [ ] MCP response time < 500ms p95
- [ ] Error rate < 1%
- [ ] Offer cache hit rate > 80%
- [ ] Zero PII leaks in logs
- [ ] Booking conversion > 15%
- [ ] AI-originated bookings > 30% of total
- [ ] Customer satisfaction > 4.5/5
- [ ] System uptime > 99.9%

---

## ⚠️ Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| ERA sandbox delay | High | Continue with mock, design for easy switch |
| Price changes during checkout | Medium | Re-verify at payment, show delta |
| Prompt injection attacks | High | Strict input validation, no dynamic queries |
| Rate limit abuse | Medium | Per-IP + per-session limits |
| Session expiry mid-checkout | Low | Extend on activity, clear messaging |

---

## 📝 Decision Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2025-01-26 | **Phase 1 Round-trip UI complete** | Trainline-level UX achieved |
| 2025-01-26 | Progress steps for round-trip | Google Flights pattern |
| 2025-01-26 | Sticky selection summary | Trainline pattern |
| 2025-01-26 | Highlight badges in search | Industry standard |
| 2025-01-26 | In-memory cache, not Redis | Simpler for MVP, Redis in Phase 2 |
| 2025-01-26 | Prebook at payment, not checkout | Avoid ghost reservations |
| 2025-01-26 | 4 tools only (initial) | Minimal surface, easier onboarding |
| 2025-01-26 | Hash offer references | Never expose ERA internals to AI |
| 2025-01-26 | MCP-first, OpenAPI later | Anthropic Claude priority |
| 2025-01-25 | Service fee 5% | Industry standard |

---

## 📚 Documentation

- [MCP Architecture](./docs/MCP_ARCHITECTURE.md)
- [ERA API Integration](./docs/raileurope-api/)
- [Project Map](./PROJECT_MAP.md)
- [Quick Start](./QUICK_START.md)

---

## 👥 Contacts

- **Project Lead:** Levent
- **Development:** Claude (AI Assistant)
- **ERA API Support:** Rail Europe Partner Team
- **Payment:** Payten/MSU Support
