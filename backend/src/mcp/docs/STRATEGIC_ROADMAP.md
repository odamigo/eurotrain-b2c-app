# EuroTrain Strategic Roadmap

> **Last Updated:** 2025-01-26  
> **Current Status:** MCP v2.0 Architecture Complete  
> **Next Milestone:** ERA API Sandbox Integration

---

## 🎯 Vision

EuroTrain, Avrupa tren bileti pazarında **AI-first** yaklaşımıyla öncü olmayı hedefliyor. MCP (Model Context Protocol) entegrasyonu ile Claude, GPT ve diğer AI asistanları üzerinden doğrudan bilet araması ve rezervasyonu mümkün olacak.

---

## 📊 Current Progress: 85%

### Core Platform
| Feature | Status | Notes |
|---------|--------|-------|
| Homepage & Search | ✅ 100% | Station autocomplete, date picker |
| Journey Results | ✅ 100% | ERA API mock integration |
| Booking Flow | ✅ 95% | Traveler form, checkout |
| Payment (Payten) | ✅ 90% | Test mode working |
| E-Ticket PDF | ✅ 90% | Generation working |
| Admin Panel | ✅ 100% | JWT auth, full CRUD |

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

---

## 🚀 Roadmap

### Phase 1: MCP Production-Ready (Current)
**Timeline:** Week 1-2 (January 2025)

- [x] MCP v2.0 Architecture design
- [x] Offer cache with TTL (15 min)
- [x] Session cache with TTL (30 min)
- [x] 4 core tools implemented
- [x] PII protection & redaction
- [x] Idempotency support
- [x] Documentation complete
- [ ] Checkout page v4 (session-based)
- [ ] Integration testing
- [ ] Deploy to staging

### Phase 2: ERA API Integration
**Timeline:** Week 3-4 (February 2025)
**Blocker:** Sandbox credentials from Rail Europe

- [ ] Obtain ERA API sandbox credentials
- [ ] Real search integration
- [ ] Offer location mapping
- [ ] Prebook at payment initiation
- [ ] Confirm after payment success
- [ ] E-ticket from ERA print endpoint
- [ ] Error handling for ERA failures

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

- [ ] Claude.ai MCP integration (Anthropic)
- [ ] GPT Actions (OpenAI) - requires different format
- [ ] Documentation for agent developers
- [ ] Public API launch

### Phase 5: Scaling & Features
**Timeline:** Q2 2025

- [ ] Multi-language support (EN, DE, FR)
- [ ] User accounts & saved travelers
- [ ] Booking management (cancel, exchange)
- [ ] Loyalty program
- [ ] Mobile app (React Native)

---

## 🏗️ Technical Architecture

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

### Phase 1 KPIs
- [ ] MCP response time < 500ms p95
- [ ] Error rate < 1%
- [ ] Offer cache hit rate > 80%
- [ ] Zero PII leaks in logs

### Production KPIs
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
| 2025-01-26 | In-memory cache, not Redis | Simpler for MVP, Redis later |
| 2025-01-26 | Prebook at payment, not checkout | Avoid ghost reservations |
| 2025-01-26 | 4 tools only | Minimal surface, easier onboarding |
| 2025-01-26 | Hash offer references | Never expose ERA internals to AI |
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
