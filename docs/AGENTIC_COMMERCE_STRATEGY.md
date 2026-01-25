# 🤖 EUROTRAIN AGENTİC COMMERCE STRATEJİSİ

**Hazırlanma Tarihi:** 25 Ocak 2026
**Versiyon:** 1.0
**Durum:** Stratejik Planlama

---

## 📊 MEVCUT DURUM ANALİZİ

### Sektördeki Gelişmeler (Ocak 2026)

| Protokol | Sahip | Durum | Travel Desteği |
|----------|-------|-------|----------------|
| **MCP** (Model Context Protocol) | Anthropic | ✅ Aktif, endüstri standardı | Kiwi.com, Turkish Airlines, Amadeus |
| **UCP** (Universal Commerce Protocol) | Google | 🆕 Yeni duyuruldu | Retail odaklı, travel genişleyecek |
| **A2A** (Agent2Agent) | Google | ✅ Aktif | UCP ile uyumlu |
| **AP2** (Agent Payments Protocol) | Google/PayPal | ✅ Aktif | Ödeme katmanı |
| **Stripe Agentic Commerce** | OpenAI/Stripe | ✅ Aktif | ChatGPT checkout |

### Öncü Travel Şirketleri

| Şirket | Ne Yaptı | Sonuç |
|--------|----------|-------|
| **Kiwi.com** | MCP Server (Ağustos 2025) | İlk travel MCP, Claude/ChatGPT entegrasyonu |
| **Turkish Airlines** | MCP Server (Lab projesi) | Uçuş durumu, check-in, booking |
| **Amadeus** | Community MCP | GDS araçları |
| **Apaleo** | MCP Server | Otel PMS entegrasyonu |
| **Expedia** | MCP desteği | Planlama aşamasında |

---

## 🎯 EUROTRAIN İÇİN STRATEJİK KONUMLANDIRMA

### Neden Agentic Commerce?

1. **Yeni Dağıtım Kanalı:** AI asistanları (Claude, ChatGPT, Gemini) yeni "arama motoru" oluyor
2. **İlk Hareket Avantajı:** Tren sektöründe MCP server yok (Kiwi.com uçuş, biz tren)
3. **Doğrudan Müşteri İlişkisi:** OTA'lara bağımlılık azalır
4. **SEO'nun Ötesi:** AI "crawlability" yeni SEO

### EuroTrain'in Avantajları

- ✅ ERA API ile gerçek envanter erişimi
- ✅ Çoklu carrier desteği (EUROSTAR, TGV, ICE, vb.)
- ✅ Clean architecture (MCP'ye uyarlanabilir)
- ✅ Türkiye pazarında ilk olma şansı

---

## 🏗️ TEKNİK MİMARİ

### Katmanlı Yaklaşım

```
┌─────────────────────────────────────────────────────────────┐
│                     AI PLATFORMLARI                          │
│  Claude │ ChatGPT │ Gemini │ Copilot │ Perplexity           │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    PROTOKOL KATMANI                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │    MCP      │  │    UCP      │  │   REST API  │         │
│  │  (Öncelik)  │  │  (Gelecek)  │  │  (Mevcut)   │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   EUROTRAIN MCP SERVER                       │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                     TOOLS                             │   │
│  │  search-trains │ get-availability │ create-booking   │   │
│  │  get-booking   │ cancel-booking   │ get-stations     │   │
│  └─────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                   RESOURCES                           │   │
│  │  stations://  │  routes://  │  carriers://            │   │
│  └─────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                    PROMPTS                            │   │
│  │  trip-planner │ price-compare │ schedule-finder      │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   EUROTRAIN BACKEND                          │
│            (Mevcut NestJS + ERA API)                        │
└─────────────────────────────────────────────────────────────┘
```

### MCP Server Yapısı

```typescript
// eurotrain-mcp-server/
├── src/
│   ├── index.ts              // Entry point
│   ├── tools/
│   │   ├── search-trains.ts  // Sefer arama
│   │   ├── get-stations.ts   // İstasyon listesi
│   │   ├── get-availability.ts // Müsaitlik
│   │   ├── create-booking.ts // Rezervasyon
│   │   └── get-booking.ts    // Booking detay
│   ├── resources/
│   │   ├── stations.ts       // İstasyon verileri
│   │   ├── routes.ts         // Popüler rotalar
│   │   └── carriers.ts       // Carrier bilgileri
│   ├── prompts/
│   │   ├── trip-planner.ts   // Seyahat planlama
│   │   └── price-compare.ts  // Fiyat karşılaştırma
│   └── utils/
│       ├── era-client.ts     // ERA API bağlantısı
│       └── validators.ts     // Input validation
├── package.json
└── README.md
```

---

## 📋 UYGULAMA YOLU HARİTASI

### FAZ 1: Temel MCP Server (2-3 Hafta)

**Hedef:** Minimum viable MCP server - sadece arama

| Hafta | Görev | Çıktı |
|-------|-------|-------|
| 1 | MCP SDK kurulumu, temel yapı | Çalışan boş server |
| 1 | `search-trains` tool | Sefer arama çalışıyor |
| 2 | `get-stations` tool + resource | İstasyon listesi |
| 2 | Claude Desktop entegrasyonu | Local test |
| 3 | Hosting (Alpic veya self-hosted) | Public endpoint |
| 3 | Dokümantasyon | Kurulum kılavuzu |

**Teknik Gereksinimler:**
- Node.js/TypeScript
- @modelcontextprotocol/sdk
- Mevcut ERA API servisleri

**Kapsam (Faz 1):**
```
✅ search-trains(origin, destination, date, passengers)
✅ get-stations(query) - autocomplete
✅ stations:// resource - tüm istasyonlar
❌ Booking (Faz 2'de)
❌ Ödeme (Faz 3'te)
```

### FAZ 2: Booking Desteği (3-4 Hafta)

**Hedef:** Rezervasyon oluşturma (ödeme hariç)

| Hafta | Görev | Çıktı |
|-------|-------|-------|
| 4 | `get-availability` tool | Gerçek zamanlı müsaitlik |
| 4 | `create-booking` tool | Booking oluşturma |
| 5 | `get-booking` tool | Booking sorgulama |
| 5 | Traveler bilgi toplama | Form-free booking |
| 6 | `cancel-booking` tool | İptal desteği |
| 6 | Error handling, retry logic | Production-ready |

**Kapsam (Faz 2):**
```
✅ create-booking(offer_id, travelers)
✅ get-booking(booking_id veya PNR)
✅ cancel-booking(booking_id)
✅ Booking link oluşturma (Kiwi.com modeli)
❌ In-chat ödeme (Faz 3'te)
```

### FAZ 3: Ödeme ve UCP (4-6 Hafta)

**Hedef:** End-to-end booking + Google UCP desteği

| Hafta | Görev | Çıktı |
|-------|-------|-------|
| 7 | AP2 (Agent Payments Protocol) araştırma | Ödeme stratejisi |
| 8 | Stripe/Payten agentic entegrasyon | Ödeme desteği |
| 9 | UCP capability mapping | Google uyumu |
| 10 | UCP checkout flow | Gemini/AI Mode desteği |
| 11-12 | Multi-platform test | Tüm AI'larda çalışıyor |

**Kapsam (Faz 3):**
```
✅ In-chat payment (AP2 veya Stripe)
✅ Google UCP uyumluluğu
✅ Multi-item cart
✅ Loyalty/promo code desteği
```

### FAZ 4: Gelişmiş Özellikler (Ongoing)

| Özellik | Açıklama | Öncelik |
|---------|----------|---------|
| Multi-leg trips | Paris→Zürich→Milano | 🔴 Yüksek |
| Seat selection | Koltuk seçimi | 🟡 Orta |
| Real-time disruption | Gecikme/iptal bildirimi | 🟡 Orta |
| Personalization | Kullanıcı tercihleri | 🟢 Düşük |
| Interline booking | Farklı carrier kombine | 🟢 Düşük |

---

## 🔐 GÜVENLİK VE UYUMLULUK

### MCP Güvenlik Prensipleri

| Risk | Önlem |
|------|-------|
| Prompt injection | Input validation, parametre sınırlama |
| Over-privileged access | Minimum yetki, tool bazlı izinler |
| Data leakage | PII maskeleme, log sanitization |
| Rate limiting | Per-user ve per-tool limitler |
| Authentication | OAuth 2.0 (üye işlemleri için) |

### Uyumluluk

- **GDPR/KVKK:** Minimum veri toplama, açık rıza
- **PCI DSS:** Kart bilgisi MCP üzerinden geçmez
- **AI Platform Policies:** Her platformun kurallarına uyum

---

## 💰 İŞ MODELİ

### Gelir Kaynakları

| Kaynak | Açıklama | Tahmini Etki |
|--------|----------|--------------|
| Doğrudan satış | AI üzerinden booking | Ana gelir |
| Komisyon tasarrufu | OTA bypass | %10-15 tasarruf |
| Premium API | B2B MCP erişimi | Ek gelir |

### Maliyet Kalemleri

| Kalem | Tahmini | Not |
|-------|---------|-----|
| MCP Hosting (Alpic) | $50-200/ay | Trafik bazlı |
| Geliştirme | 2-3 ay | Mevcut ekip |
| Bakım | Ongoing | %10-20 zaman |

---

## 📊 BAŞARI METRİKLERİ

### Faz 1 KPI'ları
- [ ] MCP Server public erişime açık
- [ ] Claude Desktop'ta çalışıyor
- [ ] 100+ arama/gün
- [ ] <2 saniye response time

### Faz 2 KPI'ları
- [ ] 10+ booking/hafta (MCP üzerinden)
- [ ] %5 conversion rate (arama → booking link tıklama)
- [ ] 0 kritik hata

### Faz 3 KPI'ları
- [ ] %10 toplam satışın AI kanalından gelmesi
- [ ] Google UCP onayı
- [ ] 3+ AI platformunda aktif

---

## 🚨 RİSKLER VE AZALTMA

| Risk | Olasılık | Etki | Azaltma |
|------|----------|------|---------|
| Protokol değişikliği | Orta | Yüksek | Multi-protocol desteği |
| AI platform reddi | Düşük | Yüksek | Standartlara tam uyum |
| Düşük adoption | Orta | Orta | Pazarlama, SEO |
| Güvenlik açığı | Düşük | Yüksek | Security audit, penetration test |
| ERA API sorunları | Düşük | Yüksek | Fallback, mock mode |

---

## 🎯 REKABETÇİ AVANTAJ

### Neden EuroTrain Öne Çıkar?

1. **İlk Tren MCP:** Sektörde tek (şu an sadece Kiwi.com uçuş var)
2. **Avrupa Odaklı:** 30+ ülke, 35+ rota
3. **Çoklu Carrier:** EUROSTAR, TGV, ICE, Frecciarossa tek noktada
4. **Türkçe Destek:** TR pazarında ilk
5. **Clean Architecture:** Hızlı adaptasyon

### Rakip Analizi

| Rakip | MCP Durumu | Zayıf Nokta |
|-------|------------|-------------|
| Trainline | Yok (henüz) | Büyük şirket, yavaş hareket |
| Omio | Yok | Farklı öncelikler |
| Rail Europe | Yok | B2B odaklı |
| SNCF Connect | Yok | Sadece Fransa |

---

## 📝 SONUÇ VE TAVSİYE

### Strateji Özeti

**"MCP-First, UCP-Ready"** yaklaşımı:

1. **Hemen başla:** MCP server (Faz 1) 2-3 haftada hazır olabilir
2. **Kiwi.com modelini takip et:** Arama + booking link, sonra tam booking
3. **Google UCP'yi izle:** Travel vertical açıldığında hazır ol
4. **Güvenlik öncelikli:** Baştan doğru yap

### Öneri

Şu an yapılacak en değerli yatırım: **Basit bir MCP server ile başlamak.**

- Düşük maliyet (2-3 hafta geliştirme)
- Yüksek öğrenme (gerçek kullanıcı verisi)
- İlk hareket avantajı (tren sektöründe tek)
- UCP'ye geçiş kolay (aynı backend)

---

## 📚 KAYNAKLAR

### Resmi Dokümantasyon
- [MCP Specification](https://spec.modelcontextprotocol.io/)
- [MCP Python/TypeScript SDK](https://github.com/modelcontextprotocol)
- [Google UCP Guide](https://developers.google.com/merchant/ucp)
- [Anthropic MCP Courses](https://anthropic.skilljar.com/)

### Örnek Implementasyonlar
- [Kiwi.com MCP Server](https://github.com/alpic-ai/kiwi-mcp-server-public)
- [Turkish Airlines MCP](https://mcp.turkishtechlab.com/)

### Hosting Seçenekleri
- [Alpic.ai](https://alpic.ai/) - MCP-specific hosting
- [Cloudflare Workers](https://developers.cloudflare.com/workers/) - Serverless
- Self-hosted (Natro VPS)

---

**Hazırlayan:** Claude (Anthropic)
**Tarih:** 25 Ocak 2026
**Sonraki Adım:** Faz 1 implementasyonuna başla
