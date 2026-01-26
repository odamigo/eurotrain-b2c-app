# 🚂 EUROTRAIN - NEREDE KALDIK

**Son Güncelleme:** 26 Ocak 2026, 18:45
**Git Branch:** main

---

## 🚨 ÖNCE YAPILACAK: REFACTORING (SONRAKİ OTURUM)

### Problem
Booking entity **camelCase** kullanıyor ama servisler **snake_case** gönderiyor. Bu 42 TypeScript hatası veriyor.

### Düzeltilecek Dosyalar (6 adet)

| Dosya | Yol |
|-------|-----|
| `bookings.service.ts` | `backend/src/bookings/bookings.service.ts` |
| `mcp-booking.controller.ts` | `backend/src/mcp/mcp-booking.controller.ts` |
| `checkout.service.ts` | `backend/src/mcp/services/checkout.service.ts` |
| `pdf.controller.ts` | `backend/src/pdf/pdf.controller.ts` |
| `my-trips.service.ts` | `backend/src/my-trips/my-trips.service.ts` |
| `my-trips.controller.ts` | `backend/src/my-trips/my-trips.controller.ts` |

### Field Mapping (snake_case → camelCase)

```
departure_date   → departureDate
departure_time   → departureTime
arrival_time     → arrivalTime
train_number     → trainNumber
ticket_class     → ticketClass
ticket_pdf_url   → ticketPdfUrl
price            → totalPrice (veya ticketPrice)
```

### Tahmini Süre
30-45 dakika (6 dosya × 5-7 dk)

---

## ✅ BU OTURUMDA TAMAMLANAN

### My Trips Sayfası v2.0 - Frontend
- [x] Trainline/Omio/Emirates tarzı profesyonel UI
- [x] 3 farklı erişim yöntemi (Email Magic Link, PNR, Rezervasyon No)
- [x] Yaklaşan/Geçmiş tab'ları
- [x] "BUGÜN" pulse animasyonu
- [x] Skeleton loading
- [x] Status badge'leri
- [x] Operator badge'leri
- [x] Expandable ticket cards
- [x] PNR kopyalama
- [x] Takvime ekleme (Google Calendar)
- [x] Paylaşma (Web Share API)
- [x] PDF indirme butonu (backend endpoint bekliyor)
- [x] Mobile responsive tasarım

### Tespit Edilen Teknik Borç
- [x] Booking entity snake_case/camelCase karışıklığı analiz edildi
- [x] 6 dosyada tutarsızlık tespit edildi
- [x] Refactoring planı hazırlandı

---

## 🔮 MY TRIPS PHASE 2 - GELECEK ÖZELLİKLER

| Özellik | Öncelik | Backend Endpoint |
|---------|---------|------------------|
| Apple/Google Wallet | YÜKSEK | `GET /my-trips/:id/pkpass` |
| iCal Export | ORTA | `GET /my-trips/:id/ical` |
| WhatsApp Paylaşım | DÜŞÜK | Frontend only (wa.me) |
| Canlı Tren Durumu | DÜŞÜK | ERA Real-time API |
| Değişiklik/İptal | YÜKSEK | `POST /my-trips/:id/cancel` |
| Email Yeniden Gönderme | ORTA | `POST /my-trips/:id/resend` |

---

## 🐛 BİLİNEN BUGLAR

| Bug | Durum | Öncelik |
|-----|-------|---------|
| **42 TypeScript hatası** | Refactoring bekliyor | 🔴 Kritik |
| Payten Invalid merchant | Destek bekleniyor | Yüksek |

---

## 🔧 SONRAKİ OTURUM PLANI

```
1. [30-45 dk] Refactoring - 6 dosyayı camelCase'e çevir
2. [15-20 dk] Backend PDF/QR endpoints ekle
3. [10 dk] qrcode paketi kur: npm install qrcode @types/qrcode
4. [15 dk] My Trips tam akış testi
5. [Opsiyonel] Legal sayfalar (/terms, /privacy)
```

---

## 🔑 PAYTEN MSU CREDENTIALS (TEST)

```env
MSU_API_URL=https://test.merchantsafeunipay.com/msu/api/v2
MSU_MERCHANT=eurotrain
MSU_MERCHANT_USER=management@odamigo.com
MSU_MERCHANT_PASSWORD=Odam1go@2026
MSU_MERCHANT_SECRET_KEY=NOwBkYotMtC5ImH6i5yZ
```

---

## 🧪 TEST KOMUTLARI

```powershell
# Backend başlat
cd C:\dev\eurotrain-b2c-app\backend
npm run start:dev

# Frontend başlat
cd C:\dev\eurotrain-b2c-app\frontend
npm run dev

# Test URLs
http://localhost:3000           # Ana sayfa
http://localhost:3000/my-trips  # Biletlerim
http://localhost:3000/search?origin=FRPAR&destination=GBLON&date=2026-02-15&adults=1
```

---

## 📝 HAFIZA NOTLARI

Claude'un hafızasına eklendi:
1. My Trips Phase 2 TODO listesi
2. Refactoring borcu (snake_case → camelCase)

---

## 🔗 SONRAKİ OTURUM BAŞLANGIÇ

```
1. "WHERE_WE_LEFT.md oku" de
2. "Refactoring'e başla" de
3. 6 dosyayı tek tek düzelteceğim
4. Her dosya sonunda test komutunu çalıştır
```
