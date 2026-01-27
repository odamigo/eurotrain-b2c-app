# 🎫 MY TRIPS PHASE 2 - İMPLEMENTASYON PLANI

> **Başlangıç:** 27 Ocak 2026  
> **Hedef:** Trainline/Omio seviyesinde bilet yönetimi  
> **Durum:** 🟡 Devam Ediyor

---

## 📊 MEVCUT DURUM ANALİZİ

### ✅ Çalışan Özellikler (DOKUNMA!)
| Özellik | Dosya | Durum |
|---------|-------|-------|
| PDF Bilet İndirme | `pdf.service.ts`, `pdf.controller.ts` | ✅ Çalışıyor |
| QR Kod Oluşturma | `qr.service.ts` | ✅ Çalışıyor |
| Magic Link Sistemi | `my-trips.service.ts` | ✅ Çalışıyor |
| Email Gönderimi | `email.service.ts` | ✅ Çalışıyor |
| My Trips Frontend | `app/my-trips/page.tsx` | ✅ Çalışıyor |

### ❌ Eksik Özellikler (YAPILACAK)
| Özellik | Öncelik | Tahmini Süre |
|---------|---------|--------------|
| 1. iCal Export (.ics) | P0 | 2 saat |
| 2. Email Resend Endpoint | P0 | 1 saat |
| 3. Google Wallet | P1 | 4 saat |
| 4. Apple Wallet (.pkpass) | P2 | Sertifika gerekli |
| 5. WhatsApp Share | P1 | 1 saat |
| 6. Frontend Entegrasyonu | P0 | 2 saat |

---

## 🏗️ DOSYA YAPISI

### Yeni Oluşturulacak Dosyalar
```
backend/src/
├── calendar/                        # YENİ MODÜL
│   ├── calendar.module.ts
│   ├── calendar.service.ts          # .ics generation (ical-generator)
│   └── calendar.controller.ts
├── wallet/                          # YENİ MODÜL
│   ├── wallet.module.ts
│   ├── wallet.service.ts            # Google Wallet JWT
│   └── wallet.controller.ts
├── share/                           # YENİ MODÜL
│   ├── share.module.ts
│   ├── share.service.ts             # Share link generation
│   └── share.controller.ts
```

### Güncellenecek Dosyalar
```
backend/src/
├── my-trips/
│   └── my-trips.controller.ts       # + resend-email endpoint
├── email/
│   ├── email.service.ts             # + resendConfirmation method
│   └── email.controller.ts          # YENİ - API endpoint
├── app.module.ts                    # + yeni modüller import
```

---

## 📋 DETAYLI GÖREV LİSTESİ

### GÖREV 1: iCal Export (.ics) ⏱️ 2 saat
**Amaç:** Kullanıcılar biletlerini takvimlerine ekleyebilsin

**Backend:**
- [ ] `npm install ical-generator` 
- [ ] `calendar.module.ts` oluştur
- [ ] `calendar.service.ts` oluştur
  - [ ] `generateIcs(booking)` metodu
  - [ ] Timezone desteği (Europe/Paris, etc.)
  - [ ] Alarm/hatırlatıcı (1 gün önce, 2 saat önce)
- [ ] `calendar.controller.ts` oluştur
  - [ ] `GET /calendar/:bookingId/ics?token=xxx`
- [ ] `app.module.ts`'e CalendarModule ekle

**Frontend:**
- [ ] TripCard'a "Takvime Ekle" butonu
- [ ] Download trigger

**Test:**
- [ ] Google Calendar'da test
- [ ] Apple Calendar'da test
- [ ] Outlook'ta test

---

### GÖREV 2: Email Resend Endpoint ⏱️ 1 saat
**Amaç:** Kullanıcı onay emailini tekrar alabilsin

**Backend:**
- [ ] `email.service.ts`'e `resendBookingConfirmation(bookingId)` ekle
- [ ] `my-trips.controller.ts`'e endpoint ekle:
  - [ ] `POST /my-trips/:id/resend-email?token=xxx`
  - [ ] Rate limiting (5 dakikada 1)
  - [ ] Cooldown kontrolü

**Frontend:**
- [ ] TripCard'a "Email Gönder" butonu
- [ ] Loading state
- [ ] Success/error toast

**Test:**
- [ ] Email alındığını doğrula
- [ ] Rate limit test

---

### GÖREV 3: Google Wallet ⏱️ 4 saat
**Amaç:** Android kullanıcıları biletlerini Google Wallet'a ekleyebilsin

**Backend:**
- [ ] Google Cloud Console'da API aktifle (kullanıcı yapacak)
- [ ] `wallet.module.ts` oluştur
- [ ] `wallet.service.ts` oluştur
  - [ ] Google Wallet API JWT oluşturma
  - [ ] Transit ticket class tanımı
  - [ ] Transit ticket object oluşturma
- [ ] `wallet.controller.ts` oluştur
  - [ ] `GET /wallet/:bookingId/google?token=xxx` → Add to Wallet URL

**Frontend:**
- [ ] "Google Wallet'a Ekle" butonu (resmi logo)
- [ ] Redirect to Google

**Gerekli ENV:**
```env
GOOGLE_WALLET_ISSUER_ID=
GOOGLE_WALLET_SERVICE_ACCOUNT_EMAIL=
GOOGLE_WALLET_PRIVATE_KEY=
```

---

### GÖREV 4: Apple Wallet (.pkpass) ⏱️ Beklemede
**Durum:** ⏸️ Apple Developer Account gerekli ($99/yıl)

**Gereksinimler:**
- Apple Developer Program üyeliği
- Pass Type ID oluşturma
- Signing certificate (.p12)

**Alternatif:** PassSlot veya PassKit gibi 3rd party servisler

---

### GÖREV 5: WhatsApp/SMS Share ⏱️ 1 saat
**Amaç:** Kullanıcılar bilet bilgilerini paylaşabilsin

**Backend:**
- [ ] `share.service.ts` oluştur
  - [ ] `generateShareText(booking)` - formatlanmış metin
  - [ ] `generateShareUrl(booking)` - deep link
- [ ] `share.controller.ts` oluştur
  - [ ] `GET /share/:bookingId/data?token=xxx`

**Frontend:**
- [ ] Share butonu (native share API veya WhatsApp direct)
- [ ] Copy to clipboard fallback

---

### GÖREV 6: Frontend Entegrasyonu ⏱️ 2 saat
**Amaç:** Tüm yeni özellikleri UI'a entegre et

**Güncellemeler:**
- [ ] TripCard component'ına butonlar ekle:
  - [ ] 📅 Takvime Ekle (iCal)
  - [ ] 📧 Email Gönder (resend)
  - [ ] 💳 Google Wallet'a Ekle
  - [ ] 📤 Paylaş (WhatsApp/Copy)
- [ ] Action menu dropdown (mobil için)
- [ ] Loading states
- [ ] Toast notifications

---

## 🔌 API ENDPOİNTLERİ

### Yeni Endpoint'ler
```
GET  /calendar/:bookingId/ics?token=xxx     → .ics dosyası indir
POST /my-trips/:id/resend-email?token=xxx   → Onay emaili tekrar gönder
GET  /wallet/:bookingId/google?token=xxx    → Google Wallet URL
GET  /share/:bookingId/data?token=xxx       → Paylaşım verisi
```

### Mevcut Endpoint'ler (DOKUNMA!)
```
GET  /my-trips/verify?token=xxx             → Biletleri listele
GET  /my-trips/:id?token=xxx                → Bilet detayı
GET  /my-trips/:id/pdf?token=xxx            → PDF indir
GET  /my-trips/:id/qr?token=xxx             → QR kod
POST /my-trips/request-link                 → Magic link iste
GET  /my-trips/order/:orderId               → PNR ile bul
```

---

## 📦 GEREKLİ PAKETLER

```bash
# Backend
npm install ical-generator           # iCal oluşturma
npm install google-auth-library      # Google Wallet API (opsiyonel)

# Zaten yüklü (DOKUNMA!)
# pdfkit, qrcode, resend, sharp
```

---

## 🔐 ENV DEĞİŞKENLERİ

### Mevcut (Doğrula)
```env
# Database
DATABASE_URL=postgresql://...

# Frontend
FRONTEND_URL=http://localhost:3000

# Email (Resend)
RESEND_API_KEY=re_xxxxx

# Genel
NODE_ENV=development
```

### Yeni (Eklenecek)
```env
# Google Wallet (Opsiyonel - Görev 3 için)
GOOGLE_WALLET_ISSUER_ID=
GOOGLE_WALLET_SERVICE_ACCOUNT_EMAIL=
GOOGLE_WALLET_PRIVATE_KEY=

# Apple Wallet (Gelecek - Görev 4 için)
# APPLE_PASS_TYPE_ID=pass.com.eurotrain.ticket
# APPLE_TEAM_ID=
# APPLE_PASS_CERTIFICATE_PATH=
# APPLE_PASS_KEY_PATH=
```

---

## ✅ TAMAMLANMA DURUMU

| Görev | Durum | Tarih |
|-------|-------|-------|
| Görev 1: iCal Export | ⬜ Bekliyor | - |
| Görev 2: Email Resend | ⬜ Bekliyor | - |
| Görev 3: Google Wallet | ⬜ Bekliyor | - |
| Görev 4: Apple Wallet | ⏸️ Beklemede | - |
| Görev 5: WhatsApp Share | ⬜ Bekliyor | - |
| Görev 6: Frontend | ⬜ Bekliyor | - |

---

## 📝 NOTLAR

1. **Sıralama:** 1 → 2 → 5 → 6 → 3 (Apple Wallet beklemede)
2. **Test:** Her görev sonrası manuel test yapılacak
3. **Mevcut kod:** Çalışan hiçbir şeye dokunulmayacak
4. **Güvenlik:** Token validasyonu tüm endpoint'lerde zorunlu

---

## 🚀 BAŞLANGIÇ KOMUTU

```bash
# Backend dizinine git
cd backend

# Yeni paketleri yükle
npm install ical-generator

# Dev server başlat
npm run start:dev
```
