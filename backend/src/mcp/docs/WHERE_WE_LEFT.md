# EuroTrain - Where We Left Off

> **Last Session:** 2025-01-26  
> **Status:** MCP v2.0 Architecture Complete

---

## 🎯 Bu Oturumda Yapılanlar

### MCP Server v2.0 - Dünya Standartlarında Yeniden Tasarım

1. **Mimari Kararlar**
   - In-memory cache (Redis yerine, MVP için yeterli)
   - Prebook at payment (checkout'ta değil, hayalet rezervasyon riski yok)
   - 4 tool only (minimal surface area)
   - Offer reference hashing (ERA internals gizli)

2. **Yeni Dosya Yapısı**
   ```
   backend/src/mcp/
   ├── mcp.module.ts
   ├── mcp.controller.ts
   ├── services/
   │   ├── offer-cache.service.ts    # 15 dk TTL
   │   └── session-cache.service.ts  # 30 dk TTL
   └── dto/
       └── mcp.dto.ts                # Type-safe I/O
   ```

3. **4 Tool Implementasyonu**
   - `search-trains` - Sefer arama, offer caching
   - `get-offer-details` - Kurallar, fiyat dökümü, bagaj, biniş bilgisi
   - `create-booking-session` - Checkout URL, idempotency desteği
   - `get-booking-status` - Rezervasyon durumu sorgulama

4. **Güvenlik Önlemleri**
   - PII redaction (log'larda maskeleme)
   - Rate limiting (30 req/min per IP)
   - Trace ID her istekte zorunlu
   - Input validation (regex patterns)
   - Idempotency key desteği

5. **Dokümantasyon**
   - `MCP_ARCHITECTURE.md` - Tam mimari dokümantasyonu
   - `STRATEGIC_ROADMAP.md` - Güncellenmiş yol haritası

---

## 📁 Oluşturulan Dosyalar

| Dosya | Açıklama | Durum |
|-------|----------|-------|
| `mcp.module.ts` | NestJS modül tanımı | ✅ Hazır |
| `mcp.controller.ts` | 4 tool endpoint | ✅ Hazır |
| `offer-cache.service.ts` | Offer caching (15 dk TTL) | ✅ Hazır |
| `session-cache.service.ts` | Session caching (30 dk TTL) | ✅ Hazır |
| `mcp.dto.ts` | Type-safe DTO'lar | ✅ Hazır |
| `MCP_ARCHITECTURE.md` | Mimari dokümantasyonu | ✅ Hazır |
| `STRATEGIC_ROADMAP.md` | Yol haritası | ✅ Hazır |

---

## ⏳ Bekleyen İşler

### Hemen Yapılacak
1. **Dosyaları projeye kopyala** - `/home/claude/mcp-v4/` → proje
2. **TypeScript derlemesi test et**
3. **Endpoint'leri Postman/curl ile test et**

### Sonraki Adımlar
1. **Checkout Page v4** - Session-based (`/checkout/[session]`)
2. **ERA Sandbox Credentials** - Rail Europe'dan talep et
3. **Production deployment** - Railway.app + Sentry

---

## 🔧 Kurulum Talimatları

```powershell
# 1. MCP modülünü kopyala
New-Item -ItemType Directory -Force -Path "C:\dev\eurotrain-b2c-app\backend\src\mcp\services"
New-Item -ItemType Directory -Force -Path "C:\dev\eurotrain-b2c-app\backend\src\mcp\dto"

# 2. Dosyaları indir ve kopyala (Downloads klasöründen)
Copy-Item "$env:USERPROFILE\Downloads\mcp.module.ts" "C:\dev\eurotrain-b2c-app\backend\src\mcp\" -Force
Copy-Item "$env:USERPROFILE\Downloads\mcp.controller.ts" "C:\dev\eurotrain-b2c-app\backend\src\mcp\" -Force
Copy-Item "$env:USERPROFILE\Downloads\offer-cache.service.ts" "C:\dev\eurotrain-b2c-app\backend\src\mcp\services\" -Force
Copy-Item "$env:USERPROFILE\Downloads\session-cache.service.ts" "C:\dev\eurotrain-b2c-app\backend\src\mcp\services\" -Force
Copy-Item "$env:USERPROFILE\Downloads\mcp.dto.ts" "C:\dev\eurotrain-b2c-app\backend\src\mcp\dto\" -Force

# 3. app.module.ts'de McpModule'ü import et
# imports: [..., McpModule]

# 4. Test et
cd C:\dev\eurotrain-b2c-app\backend
npm run start:dev
```

---

## 🧪 Test Komutları

```bash
# 1. Search Trains
curl -X POST http://localhost:3001/mcp/tools/search-trains \
  -H "Content-Type: application/json" \
  -d '{
    "origin": "FRPAR",
    "destination": "GBLST",
    "date": "2025-02-15",
    "passengers": { "adults": 2, "children": 0 },
    "trace_id": "test_001"
  }'

# 2. Get Offer Details (offer_ref'i search'ten al)
curl -X POST http://localhost:3001/mcp/tools/get-offer-details \
  -H "Content-Type: application/json" \
  -d '{
    "offer_ref": "offer_xxx",
    "search_id": "search_xxx",
    "trace_id": "test_002"
  }'

# 3. Create Booking Session
curl -X POST http://localhost:3001/mcp/tools/create-booking-session \
  -H "Content-Type: application/json" \
  -d '{
    "offer_ref": "offer_xxx",
    "search_id": "search_xxx",
    "passengers": { "adults": 2, "children": 0 },
    "trace_id": "test_003"
  }'
```

---

## 📊 MCP Tool Özeti

| Tool | Input | Output | TTL |
|------|-------|--------|-----|
| search-trains | origin, destination, date, passengers | offer_refs, prices | 15 dk |
| get-offer-details | offer_ref, search_id | rules, baggage, pricing | - |
| create-booking-session | offer_ref, passengers | checkout_url, session_token | 30 dk |
| get-booking-status | booking_reference | status, tickets_available | - |

---

## ⚠️ Önemli Notlar

1. **ERA API Sandbox Yok** - Mock mode ile çalışıyoruz
2. **Prebook Zamanlaması** - Ödeme butonuna tıklandığında yapılacak
3. **PII Güvenliği** - Log'larda asla tam isim/email görünmemeli
4. **Idempotency** - Aynı istek tekrarında aynı session dönmeli

---

## 📝 Instructions'a Eklenenler

```markdown
## MCP GÜVENLİK KURALLARI

### PII Politikası:
- Log'larda email maskelenmeli: `j***@email.com`
- Pasaport numarası asla log'lanmaz
- Tool output'larında minimum veri prensibi

### Tool Çağrı Kuralları:
- Her çağrıda trace_id zorunlu
- Timeout: 30 saniye
- Retry: Max 2 kez, exponential backoff
- Rate limit aşımında: "Lütfen biraz bekleyin" mesajı

### Fail-Safe Davranış:
- Tool hata verirse: Asla "rezervasyon yapıldı" deme
- API down ise: "Şu an sorgulama yapamıyorum, lütfen tekrar deneyin"
- Fiyat tutarsızlığında: "Fiyatlar değişmiş olabilir, checkout'ta güncel fiyatı göreceksiniz"
```

---

## 🔗 Sonraki Oturum İçin

1. Dosyaları projeye kopyala ve test et
2. Checkout page v4 (session-based) oluştur
3. Git commit + push
4. ERA sandbox credentials takibi
