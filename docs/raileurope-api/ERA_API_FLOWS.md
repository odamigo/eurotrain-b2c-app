# 🚂 ERA API - AKIŞ DİYAGRAMLARI VE DETAYLI DOKÜMANTASYON

**Son Güncelleme:** 24 Ocak 2026
**Kaynak:** Rail Europe ERA API Resmi Dokümantasyonu

---

## 📊 1. ANA BOOKING AKIŞI (Temel)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              BOOKING FLOW                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────────────┐                                                   │
│  │ SEARCH FOR P2P/PASS  │         Status: -                                 │
│  │       OFFERS         │                                                   │
│  │ POST /offers/{type}/ │                                                   │
│  │      searches        │                                                   │
│  └──────────┬───────────┘                                                   │
│             │                                                                │
│             ▼                                                                │
│  ┌──────────────────────┐                                                   │
│  │   CREATE BOOKING     │         Status: CREATED                           │
│  │   POST /bookings     │                                                   │
│  └──────────┬───────────┘                                                   │
│             │                                                                │
│             ▼                                                                │
│  ┌──────────────────────┐                                                   │
│  │ UPDATE TRAVELERS     │         Status: CREATED                           │
│  │      DETAILS         │                                                   │
│  │ PUT /bookings/{id}/  │                                                   │
│  │ items/{itemId}/      │                                                   │
│  │     travelers        │                                                   │
│  └──────────┬───────────┘                                                   │
│             │                                                                │
│             ▼                                                                │
│  ┌──────────────────────┐                                                   │
│  │  PREBOOK THE BOOKING │         Status: PREBOOKED                         │
│  │ POST /bookings/{id}/ │                                                   │
│  │   checkout/prebook   │                                                   │
│  └──────────┬───────────┘                                                   │
│             │                                                                │
│             ▼                                                                │
│  ┌──────────────────────┐                                                   │
│  │   CONFIRM BOOKING    │         Status: INVOICED                          │
│  │ POST /bookings/{id}/ │                                                   │
│  │   checkout/confirm   │                                                   │
│  └──────────┬───────────┘                                                   │
│             │                                                                │
│             ▼                                                                │
│  ┌──────────────────────┐                                                   │
│  │   RETRIEVE TICKET    │         Status: INVOICED                          │
│  │ POST /bookings/{id}/ │                                                   │
│  │       print          │                                                   │
│  └──────────────────────┘                                                   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Booking Status Geçişleri
| Adım | API Endpoint | Önceki Status | Sonraki Status |
|------|--------------|---------------|----------------|
| 1. Search | `POST /offers/point-to-point/searches` | - | - |
| 2. Create | `POST /bookings` | - | **CREATED** |
| 3. Travelers | `PUT /bookings/{id}/items/{itemId}/travelers` | CREATED | **CREATED** |
| 4. Prebook | `POST /bookings/{id}/checkout/prebook` | CREATED | **PREBOOKED** |
| 5. Confirm | `POST /bookings/{id}/checkout/confirm` | PREBOOKED | **INVOICED** |
| 6. Print | `POST /bookings/{id}/print` | INVOICED | **INVOICED** |

---

## 📊 2. DETAYLI BOOKING AKIŞI (Tüm Opsiyonlar)

```
Search Offers
     │
     ▼
┌─────────────┐    ┌─────────────────────┐    ┌─────────────────┐
│   Create    │───▶│  Update travelers   │───▶│   (optional)    │
│   booking   │    │      details        │    │  Update agency  │
└─────────────┘    │                     │    │     details     │
                   │  ◆ for each         │    └────────┬────────┘
                   │    booking item     │             │
                   └─────────────────────┘             ▼
                                              ┌─────────────────┐
                                              │   (optional)    │
                                              │ Update services │
                                              └────────┬────────┘
                                                       │
                                                       ▼
                                              ┌─────────────────┐
                                              │    Prebook      │
                                              └────────┬────────┘
                                                       │
                                                       ▼
                                              ┌─────────────────┐
                                              │   (optional)    │
                                              │  Claim billing  │
                                              │      docs       │
                                              └────────┬────────┘
                                                       │
                              ┌─────────────────────────┴─────────────────────────┐
                              │                                                    │
                              ▼                                                    ▼
                     ┌─────────────────┐                              ┌─────────────────┐
                     │ Confirm booking │                              │   (optional)    │
                     └────────┬────────┘                              │  Hold booking   │
                              │                                       └─────────────────┘
                              ▼
                     ┌─────────────────┐
                     │  Print booking  │
                     └─────────────────┘
```

---

## 📊 3. AUTHENTICATION AKIŞI

```
┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│  API Client │         │ Auth Server │         │API Endpoint │
│    </>      │         │     🔐      │         │    <->      │
└──────┬──────┘         └──────┬──────┘         └──────┬──────┘
       │                       │                       │
       │ Authentication request│                       │
       │──────────────────────▶│                       │
       │                       │                       │
       │ Access Token X1 issued│                       │
       │◀──────────────────────│                       │
       │                       │                       │
       │                       │                       │
   ┌───┴───────────────────────┴───────────────────────┴───┐
   │                      60 mins                           │
   └───┬───────────────────────┬───────────────────────┬───┘
       │                       │                       │
       │ API call #1 with Token X1                     │
       │──────────────────────────────────────────────▶│
       │                       │          API response │
       │◀──────────────────────────────────────────────│
       │                       │                       │
       │ API call #2 with Token X1                     │
       │──────────────────────────────────────────────▶│
       │                       │          API response │
       │◀──────────────────────────────────────────────│
       │                       │                       │
   ════╪═══════════════════════╪═══════════════════════╪════
       │ Token expires (60 min)│                       │
   ════╪═══════════════════════╪═══════════════════════╪════
       │                       │                       │
       │ Authentication request│                       │
       │──────────────────────▶│                       │
       │                       │                       │
       │ Access Token X2 issued│                       │
       │◀──────────────────────│                       │
       │                       │                       │
   ┌───┴───────────────────────┴───────────────────────┴───┐
   │                      60 mins                           │
   └───┬───────────────────────┬───────────────────────┬───┘
       │                       │                       │
       │ API call #3 with Token X2                     │
       │──────────────────────────────────────────────▶│
       │                       │          API response │
       │◀──────────────────────────────────────────────│
```

### Token Yönetimi Kuralları
- ⏱️ Token süresi: **60 dakika**
- 🔄 Token expire olmadan önce yenile
- 💾 Token'ı cache'le, her istekte yeniden alma
- ⚠️ 401 hatası alırsan token'ı yenile

---

## 📊 4. SEQUENCE DİYAGRAMI (Tam Akış)

```
┌─────────┐          ┌───────────────────┐    ┌──────────┐
│   API   │          │  Point to Point   │    │ Bookings │     Booking
│  Client │          │      Offers       │    │          │     Status
└────┬────┘          └─────────┬─────────┘    └────┬─────┘
     │                         │                   │
     │ POST /offers/point-to-point/searches        │
     │────────────────────────▶│                   │          Searching
     │                         │                   │          for Offers
     │    returns search results                   │
     │◀────────────────────────│                   │
     │                         │                   │
     │                         │                   │
     │ POST /bookings          │                   │          Creating
     │─────────────────────────────────────────────▶          Booking
     │                         │                   │
     │    returns ${BookingId} │                   │          ┌─────────┐
     │◀─────────────────────────────────────────────          │ CREATED │
     │                         │                   │          └────┬────┘
     │                         │                   │               │
     │ PUT /bookings/${BookingId}/items/${itemId}/travelers       │
     │─────────────────────────────────────────────▶  Adding      │
     │                         │                   │  Passenger   │
     │    returns ${BookingId} │                   │  Details     │
     │◀─────────────────────────────────────────────               │
     │                         │                   │               │
     │ POST /bookings/${BookingId}/checkout/prebook│               │
     │─────────────────────────────────────────────▶  Prebooking  │
     │                         │                   │  Attempt     ▼
     │    returns ${BookingId} │                   │          ┌──────────┐
     │◀─────────────────────────────────────────────          │PREBOOKED │
     │                         │                   │          └────┬─────┘
     │                         │                   │               │
     │ POST /bookings/${BookingId}/checkout/confirm│               │
     │─────────────────────────────────────────────▶  Confirming  │
     │                         │                   │  Booking     ▼
     │    returns ${BookingId} │                   │          ┌──────────┐
     │◀─────────────────────────────────────────────          │CONFIRMED │
     │                         │                   │          └──────────┘
```

---

## 📊 5. ÇOKLU OFFER BOOKING (Gidiş-Dönüş veya Çoklu Sefer)

```
┌────────────────────────┐         ┌────────────────────────┐
│ SEARCH FOR P2P/PASS    │         │ SEARCH FOR P2P/PASS    │
│     OFFERS #1          │         │     OFFERS #2          │
│ POST /offers/{type}/   │         │ POST /offers/{type}/   │
│       searches         │         │       searches         │
└───────────┬────────────┘         └───────────┬────────────┘
            │                                  │
            ▼                                  ▼
      ┌───────────┐                      ┌───────────┐
      │ Selected  │                      │ Selected  │
      │  Offer    │         +            │  Offer    │
      │ Location  │                      │ Location  │
      └─────┬─────┘                      └─────┬─────┘
            │                                  │
            └──────────────┬───────────────────┘
                           │
                           ▼
            ┌──────────────────────────────┐
            │ CREATE BOOKING - ADD ALL     │
            │    SELECTED OFFERS           │
            │      POST /bookings          │
            │                              │
            │  Body: {                     │
            │    items: [                  │
            │      { offerLocations: [...] │  ◀── Offer #1
            │      },                      │
            │      { offerLocations: [...] │  ◀── Offer #2
            │      }                       │
            │    ]                         │
            │  }                           │
            └──────────────┬───────────────┘
                           │
                           ▼
            ┌──────────────────────────────┐
            │    UPDATE TRAVELERS DETAILS  │    Call this once for
            │ PUT /bookings/{bookingId}/   │◀── every basket item
            │   items/{itemId}/travelers   │
            └──────────────┬───────────────┘
                           │
                           ▼
            ┌──────────────────────────────┐
            │     PREBOOK THE BOOKING      │
            │ POST /bookings/{bookingId}/  │
            │       checkout/prebook       │
            └──────────────────────────────┘
                           │
                           ▼
                          ...
```

### Çoklu Offer Kuralları
- 🎫 Gidiş-dönüş: 2 ayrı search, 2 offer location
- 👥 Her item için ayrı traveler update gerekli
- 📦 Tek booking'de birden fazla sefer birleştirilebilir

---

## 📊 6. BOOKING ITEM SİLME AKIŞI

```
            ┌──────────────────────────────────┐
            │        RETRIEVE BOOKING          │
            │  Booking must be in CREATED or   │
            │       PREBOOKED status           │
            │    GET /bookings/{bookingId}     │
            └───────────────┬──────────────────┘
                            │
                            ▼
            ┌──────────────────────────────────┐
            │      DELETE A BOOKING ITEM       │
            │ DELETE /bookings/{bookingId}/    │
            │        items/{itemId}            │
            └───────────────┬──────────────────┘
                            │
                            ▼
                    ┌───────────────┐
                    │  Booking in   │
                    │   CREATED /   │────── No ────▶ ❌ Operation
                    │  PREBOOKED    │                  will fail
                    │      ?        │
                    └───────┬───────┘
                            │
                           Yes
                            │
                            ▼
                    ┌───────────────┐
                    │Will operation │
                    │ result in at  │────── No ────▶ ❌ Operation
                    │  least one    │                  will fail
                    │item in booking│
                    │      ?        │
                    └───────┬───────┘
                            │
                           Yes
                            │
                            ▼
                   ✅ Proceed with deletion
```

### Silme Kuralları
- ⚠️ Sadece **CREATED** veya **PREBOOKED** durumunda silinebilir
- ⚠️ En az 1 item kalmalı (boş booking olamaz)
- ❌ INVOICED durumunda silme yapılamaz

---

## 📊 7. İADE (REFUND) AKIŞI

```
    ┌─────────┐
    │ booking │
    │invoiced │
    └────┬────┘
         │
         ▼
    ┌────────────────┐     ┌───────────────────┐
    │     Refund     │────▶│      Refund       │
    │   quotation    │     │   confirmation    │
    │                │     │                   │
    │ POST /bookings/│     │ POST /bookings/   │
    │ {id}/refunds/  │     │ {id}/refunds/     │
    │   quotation    │     │    confirm        │
    └────────────────┘     └─────────┬─────────┘
                                     │
                                     ▼
                            ┌────────────────┐
                            │  no more items │
                            │  to refund?    │
                            └───────┬────────┘
                                    │
                    ┌───────────────┼───────────────┐
                    │               │               │
                   Yes              │              No
                    │               │               │
                    ▼               │               ▼
             ┌───────────┐         │        ┌─────────────┐
             │  booking  │         │        │   booking   │
             │ refunded  │         │        │  partially  │
             └───────────┘         │        │  refunded   │
                                   │        └──────┬──────┘
                                   │               │
                                   └───────────────┘
                                          │
                                    (loop back)
```

### İade Kuralları
- 📋 Önce **quotation** (fiyat teklifi) al
- ✅ Sonra **confirm** (onay) ile iade tamamla
- 🔄 Kısmi iade yapılabilir
- 💰 İade tutarı quotation'da belirtilir

---

## 📊 8. DEĞİŞİKLİK (EXCHANGE) AKIŞI

```
    ┌─────────┐
    │ booking │
    │invoiced │
    └────┬────┘
         │
         ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│     Search      │────▶│    Exchange     │────▶│    Exchange     │
│    exchange     │     │   quotation     │     │  confirmation   │
│     offers      │     │                 │     │                 │
│                 │     │ POST /bookings/ │     │ POST /bookings/ │
│ POST /bookings/ │     │ {id}/exchanges/ │     │ {id}/exchanges/ │
│ {id}/exchanges/ │     │   quotation     │     │    confirm      │
│    search       │     │                 │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

### Değişiklik Kuralları
- 🔍 Önce yeni sefer için **search** yap
- 📋 **Quotation** ile fiyat farkını öğren
- ✅ **Confirm** ile değişikliği onayla
- 💰 Fiyat farkı ödeme/iade gerekebilir

---

## 📊 9. KOŞULLAR HİYERARŞİSİ (Conditions)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      RailEurope data for all products                       │
│   Conditions described here will be applicable to all RailEurope products   │
│                        (passes, PTP, all carriers...)                       │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                        Passes product range                            │  │
│  │     Conditions applicable to all passes, whatever the supplier.        │  │
│  │  ┌─────────────────────────────────────────────────────────────────┐  │  │
│  │  │                     Supplier conditions                          │  │  │
│  │  │   Conditions applied to all marketing carriers of this supplier  │  │  │
│  │  │        (e.g. SNCF supplier → TGV, TER, Intercité, etc.)         │  │  │
│  │  │  ┌───────────────────────────────────────────────────────────┐  │  │  │
│  │  │  │               Marketing carrier conditions                 │  │  │  │
│  │  │  │    Conditions applied to all products of the carrier       │  │  │  │
│  │  │  │  ┌────────────────────┐  ┌────────────────────┐           │  │  │  │
│  │  │  │  │   Pass product     │  │   Card product     │           │  │  │  │
│  │  │  │  │    conditions      │  │    conditions      │           │  │  │  │
│  │  │  │  │                    │  │                    │           │  │  │  │
│  │  │  │  │ Applied only to    │  │ Displayed as info  │           │  │  │  │
│  │  │  │  │ this specific      │  │ related to the     │           │  │  │  │
│  │  │  │  │ product            │  │ card option        │           │  │  │  │
│  │  │  │  └────────────────────┘  └────────────────────┘           │  │  │  │
│  │  │  └───────────────────────────────────────────────────────────┘  │  │  │
│  │  └─────────────────────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────┐
│  Pax type conditions│  (Ayrı - Booking'deki yolcu tipine göre)
│                     │
│ Conditions displayed│
│ on offer if such a  │
│ passenger type in   │
│ the booking         │
└─────────────────────┘
```

### Koşul Hiyerarşisi (Yukarıdan Aşağıya)
1. **RailEurope Global** → Tüm ürünlere uygulanır
2. **Passes Range** → Tüm pass'lara uygulanır
3. **Supplier** → O tedarikçinin tüm taşıyıcılarına (SNCF → TGV, TER, etc.)
4. **Marketing Carrier** → O taşıyıcının tüm ürünlerine
5. **Product Specific** → Sadece o ürüne
6. **Pax Type** → Yolcu tipine göre (çocuk, yetişkin, vs.)

---

## 🔧 BACKEND SERVİS MİMARİSİ (Güncellenmiş)

```typescript
// era/services/era-booking.service.ts

export class EraBookingService {
  
  // 1. Booking oluştur
  async createBooking(offerLocations: string[]): Promise<Booking>
  
  // 2. Yolcu bilgilerini güncelle (her item için)
  async updateTravelers(bookingId: string, itemId: string, travelers: Traveler[]): Promise<Booking>
  
  // 3. (Opsiyonel) Acente bilgisi
  async updateAgencyDetails(bookingId: string, agency: AgencyDetails): Promise<Booking>
  
  // 4. (Opsiyonel) Ek hizmetler
  async updateServices(bookingId: string, services: Service[]): Promise<Booking>
  
  // 5. Ön rezervasyon
  async prebook(bookingId: string): Promise<Booking>
  
  // 6. (Opsiyonel) Fatura belgeleri
  async claimBillingDocs(bookingId: string): Promise<BillingDocs>
  
  // 7a. Onaylama
  async confirmBooking(bookingId: string): Promise<Booking>
  
  // 7b. (Alternatif) Bekletme
  async holdBooking(bookingId: string): Promise<Booking>
  
  // 8. Bilet yazdırma
  async printTicket(bookingId: string): Promise<Ticket>
  
  // Silme
  async deleteItem(bookingId: string, itemId: string): Promise<void>
}

// era/services/era-refund.service.ts
export class EraRefundService {
  async getQuotation(bookingId: string, items: string[]): Promise<RefundQuotation>
  async confirmRefund(bookingId: string, quotationId: string): Promise<Refund>
}

// era/services/era-exchange.service.ts  
export class EraExchangeService {
  async searchExchangeOffers(bookingId: string, newSearch: SearchRequest): Promise<ExchangeOffers>
  async getQuotation(bookingId: string, newOfferId: string): Promise<ExchangeQuotation>
  async confirmExchange(bookingId: string, quotationId: string): Promise<Exchange>
}
```

---

## 📋 API ENDPOINT ÖZET TABLOSU

| Kategori | Method | Endpoint | Açıklama |
|----------|--------|----------|----------|
| **Auth** | POST | `/oauth2/token` | Token al (60 dk) |
| **Places** | GET | `/places/autocomplete` | İstasyon ara |
| **Places** | GET | `/places` | Tüm istasyonlar |
| **Search** | POST | `/offers/point-to-point/searches` | Sefer ara |
| **Search** | POST | `/offers/point-to-point/searches/{id}?page=next` | Sonraki sayfа |
| **Booking** | POST | `/bookings` | Booking oluştur |
| **Booking** | GET | `/bookings/{id}` | Booking getir |
| **Booking** | PUT | `/bookings/{id}/items/{itemId}/travelers` | Yolcu güncelle |
| **Booking** | DELETE | `/bookings/{id}/items/{itemId}` | Item sil |
| **Checkout** | POST | `/bookings/{id}/checkout/prebook` | Ön rezervasyon |
| **Checkout** | POST | `/bookings/{id}/checkout/confirm` | Onaylama |
| **Checkout** | POST | `/bookings/{id}/checkout/hold` | Bekletme |
| **Ticket** | POST | `/bookings/{id}/print` | Bilet yazdır |
| **Refund** | POST | `/bookings/{id}/refunds/quotation` | İade teklifi |
| **Refund** | POST | `/bookings/{id}/refunds/confirm` | İade onayla |
| **Exchange** | POST | `/bookings/{id}/exchanges/search` | Değişiklik ara |
| **Exchange** | POST | `/bookings/{id}/exchanges/quotation` | Değişiklik teklifi |
| **Exchange** | POST | `/bookings/{id}/exchanges/confirm` | Değişiklik onayla |

---

## ⚠️ KRİTİK NOTLAR

### Status Geçişleri
```
(yok) → CREATED → PREBOOKED → INVOICED → (REFUNDED/EXCHANGED)
```

### Silme Kuralları
- ✅ CREATED veya PREBOOKED → silinebilir
- ❌ INVOICED → silinemez (refund kullan)
- ❌ Tek item kaldıysa → silinemez

### Token Yönetimi
- ⏱️ 60 dakika geçerli
- 🔄 Expire'dan önce yenile
- 💾 Cache'le

---

## 🚃 10. DESTEKLENEN TAŞIYICILAR (CARRIERS)

### Özet Tablo

| Carrier | Ülke | Tren Tipi | Koltuk Rez. | İade | Değişim |
|---------|------|-----------|-------------|------|---------|
| **RDG** | 🇬🇧 UK | Mainline, Regional | Yok | ✅ | ✅ |
| **RegioJet** | 🇨🇿 Çekya+ | Day/Night | Dahil | ✅ | ✅ |
| **RENFE** | 🇪🇸 İspanya | AVE, Alvia | Zorunlu | ✅ | ✅ |
| **RHB** | 🇨🇭 İsviçre | Panoramik | Dahil | ✅ | ✅ |
| **SBB** | 🇨🇭 İsviçre | IC, IR | Yok/Harici | ✅ | ❌ |
| **STS** | 🇨🇭 İsviçre | Pass | - | ✅ | ✅ |
| **Trenitalia** | 🇮🇹 İtalya | Frecce, IC | Zorunlu | ✅ | ✅ |
| **Trenitalia Pass** | 🇮🇹 İtalya | Pass | Ücretsiz | ✅ | ✅ |

---

### 🇬🇧 RDG (Rail Delivery Group) - UK

**Genel Bilgi:**
- 20+ UK tren operatörünü temsil eder
- İngiltere, İskoçya, Galler genelinde
- Havalimanı bağlantıları: Heathrow Express, Gatwick Express

**Kabin Sınıfları:**
| Standard | Comfort | Premier |
|----------|---------|---------|
| 2nd Class | 1st Class | - |

**Yolcu Tipleri:** Adult, Senior, Youth

**Bilet Türleri:**
| Tür | İade | Değişim | Not |
|-----|------|---------|-----|
| Advance | ❌ | Kalkıştan önce | En ucuz, trene özel |
| Off-Peak | £5 ücret | ✅ | Esnek, off-peak saatler |
| Anytime | £5 ücret | ✅ | Tam esnek, tüm gün |

**Zaman Limitleri:**
- Offer expiration: 15 dk
- Hold TTL: 30 dk
- Grace period: YOK

**Biletleme:**
- PAH (Print At Home) varsayılan
- TOD (Ticket On Departure) otomatik seçilir (PAH yoksa)

**Örnek Rotalar:**
```
London King Cross → Edinburgh (GB:london_kings_cross → GB:edinburgh)
London Euston → Manchester (GB:london_euston → GB:manchester_piccadilly)
London Paddington → Oxford (GB:london_paddington → GB:oxford)
```

---

### 🇨🇿 RegioJet - Orta/Doğu Avrupa

**Genel Bilgi:**
- Çek özel tren operatörü (sarı trenler)
- Çekya, Avusturya, Slovakya, Macaristan, Polonya, Hırvatistan
- Gece trenleri dahil

**Kabin Sınıfları (Uluslararası):**
| Standard | Comfort | Premier |
|----------|---------|---------|
| Regular, Low Cost | Relax | Business, 1st Class |

**Gece Treni Sınıfları:**
- Standard Couchette (6 kişilik)
- Relax Couchette (4 kişilik)
- Relax Couchette Women (kadınlara özel)
- Private Compartment

**Yolcu Tipleri:**
- Infant: 0-5 yaş
- Child: 6-12 yaş
- Youth: 13-17 yaş
- Adult: 18-64 yaş
- Senior: 65+ yaş

**Zaman Limitleri:**
- Offer expiration: 15 dk
- Hold TTL: 15 dk
- Grace period: **24 saat** ✨

**Özellikler:**
- ✅ Koltuk rezervasyonu fiyata dahil
- ✅ E-bilet (PDF + QR kod)
- ⚠️ Gece treni: 20 dk önce istasyonda olun

**Örnek Rotalar:**
```
Prague → Brno (CZ:prague → CZ:brno_hl_n)
Vienna → Prague (AT:vienna → CZ:prague)
Prague → Krakow (CZ:prague → PL:krakow)
```

---

### 🇪🇸 RENFE - İspanya

**Genel Bilgi:**
- İspanya devlet demiryolları
- Avrupa'nın en büyük yüksek hızlı ağı
- 80,000+ şehir çifti

**Tren Tipleri:**
- **AVE** - Yüksek hız (300 km/h)
- **Alvia** - Yüksek hız + konvansiyonel
- **Euromed** - Akdeniz hattı
- **Avant** - Bölgesel yüksek hız

**Kabin Sınıfları:**
| Standard | Comfort | Premier |
|----------|---------|---------|
| Estandar | Confort | - |

**Yolcu Tipleri:**
- Infant: 0-3 yaş
- Child: 4-13 yaş
- Youth: 14-25 yaş
- Adult: 26-59 yaş
- Senior: 60+ yaş

**Bilet Türleri:**
| Tür | Sınıf | Açıklama |
|-----|-------|----------|
| Básico | Estandar | En düşük fiyat |
| Elige | Estandar/Confort | Esnek seçim |
| Premium | Confort | Yemek + lounge |

**Zaman Limitleri:**
- Offer expiration: 30 dk
- Hold TTL: 30 dk
- Grace period: Günün sonuna kadar (CET)

**⚠️ ZORUNLU BİLGİLER:**
```typescript
// RENFE için tüm yolcularda zorunlu:
{
  phone: string;           // Telefon numarası
  documentNumber: string;  // Pasaport/kimlik no
  documentExpiry: string;  // Belge son kullanma
  documentCountry: string; // Belge ülkesi
}
```

**Özellikler:**
- ✅ Cercanías (banliyö) ücretsiz dahil
- ⚠️ AVE: Biniş kapısı 2 dk önce kapanır
- ⚠️ Aktarma: Aynı istasyon 60 dk, farklı istasyon 90 dk

**Örnek Rotalar:**
```
Barcelona Sants → Madrid Atocha (ES:barcelona_sants → ES:madrid_atocha)
Madrid → Sevilla (ES:madrid_atocha → ES:sevilla_santa_justa)
Granada → Barcelona (ES:granada → ES:barcelona_sants)
```

---

### 🇨🇭 RHB (Rhätische Bahn) - İsviçre Panoramik

**Genel Bilgi:**
- Glacier Express ve Bernina Express
- Premium panoramik trenler
- Yıl boyu (kışın azaltılmış sefer)

**Rotalar:**
- **Glacier Express:** St. Moritz ↔ Zermatt
- **Bernina Express:** Chur ↔ Tirano

**Kabin Sınıfları:**
| Standard | Comfort | Premier |
|----------|---------|---------|
| 2nd Class | 1st Class | Excellence |

**Yolcu Tipleri:**
- Free children: 0-5 yaş
- Youth: 6-15 yaş
- Adult: 16+ yaş

**Zaman Limitleri:**
- Offer expiration: 30 dk
- Hold TTL: 15 dk
- Grace period: YOK
- Booking horizon: 6 ay (Glacier Express: 100 gün)

**Özellikler:**
- ✅ Koltuk rezervasyonu fiyata DAHİL
- ✅ `externalReservation: false` → "Koltuk rezervasyonu dahil" göster

**Örnek Rotalar:**
```
Tirano → Zermatt (IT:tirano → CH:zermatt)
St. Moritz → Zermatt (CH:st_moritz → CH:zermatt)
Chur → Tirano (CH:chur → IT:tirano)
```

---

### 🇨🇭 SBB (Swiss Federal Railways) - İsviçre

**Genel Bilgi:**
- İsviçre'nin en büyük demiryolu
- Ulusal trafik %40'ı
- Bölgesel operatörler dahil

**Kabin Sınıfları:**
| Standard | Comfort | Premier |
|----------|---------|---------|
| 2nd Class | 1st Class | - |

**Yolcu Tipleri:**
- Free children: 0-5 yaş (yetişkinle)
- Youth: 6-15 yaş (%50 indirim)
- Adult: 16+ yaş

**Özel Kural:** 12-15 yaş biletli genç → 4 çocuk (0-5) ücretsiz
Adult (16+) → 8 çocuk (0-5) ücretsiz

**Bilet Türleri:**
| Tür | İade | Değişim | Not |
|-----|------|---------|-----|
| Point-to-Point | ✅ | ✅ | Tam esnek |
| Supersaver | ❌ | ❌ | İndirimli, trene özel |
| Saver Day Pass | ❌ | ❌ | Dinamik fiyat, tüm gün |
| Day Pass | ✅ | ✅ | Half-Fare Card gerekli |

**Zaman Limitleri:**
- Offer expiration: 1 saat
- Hold TTL: 30 dk
- Grace period: **20 dakika** ✨

**⚠️ Koltuk Rezervasyonu:**
- SBB'de koltuk rezervasyonu YOK
- Panoramik trenlerde ZORUNLU ama harici
- `externalReservation: true` → "Koltuk rezervasyonu zorunlu, yerinde alın" göster

**Örnek Rotalar:**
```
Zurich → Lucerne (CH:zurich_hb → CH:lucerne)
Zurich → Bern (CH:zurich_hb → CH:bern)
Zurich → Interlaken (CH:zurich_hb → CH:interlaken_ost)
```

---

### 🇨🇭 STS (Swiss Travel System) - İsviçre Pass'ları

**Genel Bilgi:**
- Tren, otobüs, tekne - hepsi bir arada
- Kişisel, devredilemez
- Geçerlilik süresi boyunca sınırsız seyahat

**Kabin Sınıfları:**
| Standard | Comfort | Premier |
|----------|---------|---------|
| 2nd Class | 1st Class | - |

**Yolcu Tipleri:**
- Children: 0-15 yaş
- Youth: 16-24 yaş
- Adults: 25-59 yaş
- Seniors: 60+ yaş

**Ürünler:**
| Ürün | Geçerlilik |
|------|------------|
| Swiss Travel Pass | 3, 4, 6, 8, 15 gün ardışık |
| Swiss Travel Pass Flex | 1 ay içinde 3, 4, 6, 8, 15 gün |
| Swiss Half Fare Card | 1 ay, %50 indirim |
| Swiss Family Card | Ücretsiz (6-15 yaş çocuklar için) |

**İndirimli Ürünler:**
- Regional Pass Berner Oberland
- Swiss Mountain Excursion (Jungfraujoch, Matterhorn, vb.)

---

### 🇮🇹 Trenitalia - İtalya

**Genel Bilgi:**
- İtalya devlet demiryolları
- Yurtiçi + Avusturya, Fransa, Almanya, İsviçre
- Yüksek hız + bölgesel

**Tren Tipleri:**
- **Frecciarossa (FR)** - 300 km/h, premium
- **Frecciargento (FA)** - Yüksek hız, eğimli
- **Frecciabianca (FB)** - Uzun mesafe
- **Intercity (IC)** - Orta/uzun mesafe
- **Intercity Notte (ICN)** - Gece treni
- **Regionale** - Bölgesel

**Kabin Sınıfları:**
| Standard | Comfort | Premier |
|----------|---------|---------|
| 2a Classe, Standard | 1a Classe, Business | Executive |

**Yolcu Tipleri:**
- Infant: 0-3 yaş
- Child: 4-14 yaş
- Adult: 15+ yaş

**Zaman Limitleri:**
- Offer expiration: 30 dk
- Hold TTL: 30 dk
- Grace period: **30 dakika** ✨

**Aftersales:**
- ✅ Refund
- ✅ Exchange
- ✅ Edit travelers (Trenitalia özel!)
- ✅ Exchange with route change (Trenitalia özel!)

**⚠️ ZORUNLU CHECK-IN:**
```
Bölgesel trenlerde CHECK-IN ZORUNLU!
Lead traveler email'ine Trenitalia direkt mail atar.
```

**⚠️ İtalyan Pazarı İçin:**
- Fatura (fattura) talebi: PREBOOKED durumda
- Yolcu bilgisi değişikliği: Onay sonrası mümkün

**Örnek Rotalar:**
```
Roma Termini → Firenze (IT:roma_termini → IT:firenze_s_m_n)
Milano → Venezia (IT:milano_centrale → IT:venezia_s_lucia)
Napoli → Roma (IT:napoli_centrale → IT:roma_termini)
```

---

### 🇮🇹 Trenitalia Pass - Yabancı Turistler

**Genel Bilgi:**
- Sadece İtalya dışında ikamet edenler için
- Belirli sayıda yolculuk hakkı
- Koltuk rezervasyonu ücretsiz ama zorunlu

**Kabin Sınıfları:**
| Standard | Comfort |
|----------|---------|
| Easy (2nd) | 1st/2nd |

**Yolcu Tipleri:**
- Youth: 12-27 yaş
- Adult: 28-59 yaş
- Senior: 60+ yaş
- Children 0-3: Ücretsiz (koltuk yok)
- Children 4-11: Yetişkin başına 2 ücretsiz

**Pass Seçenekleri:**
| Yolculuk | Geçerlilik |
|----------|------------|
| 3 | 7 gün |
| 4 | 7 gün |
| 7 | 15 gün |
| 10 | 30 gün |

**Zaman Limitleri:**
- Aktivasyon: Satın almadan 11 ay içinde
- Grace period: YOK
- İade: İlk yolculuk rezervasyonuna kadar (%20 kesinti)

**⚠️ Pasaport Zorunlu:**
```typescript
{
  documentType: "PASSPORT",
  documentNumber: string,
  // ...
}
```

**Geçerli Trenler:**
- Frecce (tümü)
- Frecce + Freccialink
- Intercity
- Intercity Notte
- Eurocity (İtalya-İsviçre iç)

**⚠️ Koltuk Rezervasyonu:**
Şu an API üzerinden yapılamıyor - müşteriyi Trenitalia istasyonu veya web sitesine yönlendir.

---

## 🎯 CARRIER'A GÖRE FRONTEND GÖSTERİMLERİ

### Koltuk Rezervasyonu Mesajları:
```typescript
if (product.externalReservation === false) {
  // RHB (Glacier/Bernina)
  showMessage("✅ Koltuk rezervasyonu dahildir");
}

if (product.externalReservation === true) {
  // SBB Panoramik
  showMessage("⚠️ Koltuk rezervasyonu zorunludur, istasyonda veya operatör sitesinde alınız");
}
```

### Check-in Uyarısı (Trenitalia):
```typescript
if (carrier === "TRENITALIA") {
  showMessage("📧 Bazı trenlerde check-in zorunludur. Lead yolcu email adresinin doğru olduğundan emin olun.");
}
```

### RENFE Zorunlu Alanlar:
```typescript
if (carrier === "RENFE") {
  requiredFields = ["phone", "documentNumber", "documentExpiry", "documentCountry"];
}
```

---

**Bu doküman ERA API resmi dokümantasyonundan derlenmiştir.**
