# 🚀 MY TRIPS PHASE 2 - KURULUM REHBERİ

## 📦 Dosya Yapısı

```
my-trips-phase2/
├── MY_TRIPS_PHASE2_TODO.md          # Ana TODO ve takip dosyası
├── backend/src/
│   ├── app.module.ts                # Güncellenmiş (CalendarModule, ShareModule eklendi)
│   ├── calendar/
│   │   ├── calendar.module.ts       # YENİ
│   │   ├── calendar.service.ts      # YENİ - iCal oluşturma
│   │   └── calendar.controller.ts   # YENİ - /calendar/* endpoints
│   ├── share/
│   │   ├── share.module.ts          # YENİ
│   │   ├── share.service.ts         # YENİ - WhatsApp/SMS/Email share
│   │   └── share.controller.ts      # YENİ - /share/* endpoints
│   └── my-trips/
│       └── my-trips.controller.ts   # GÜNCELLENDİ - email resend eklendi
└── frontend/
    ├── lib/
    │   └── my-trips-api.ts          # YENİ - API helper fonksiyonları
    └── MY_TRIPS_PAGE_CHANGES.md     # page.tsx için değişiklik rehberi
```

---

## ⚡ HIZLI KURULUM

### 1. Backend Dosyalarını Kopyala

```powershell
# Proje dizinine git
cd C:\dev\eurotrain-b2c-app

# Calendar modülü
Copy-Item -Path ".\my-trips-phase2\backend\src\calendar" -Destination ".\backend\src\" -Recurse

# Share modülü  
Copy-Item -Path ".\my-trips-phase2\backend\src\share" -Destination ".\backend\src\" -Recurse

# app.module.ts güncelle
Copy-Item -Path ".\my-trips-phase2\backend\src\app.module.ts" -Destination ".\backend\src\" -Force

# my-trips.controller.ts güncelle
Copy-Item -Path ".\my-trips-phase2\backend\src\my-trips\my-trips.controller.ts" -Destination ".\backend\src\my-trips\" -Force
```

### 2. Frontend Dosyalarını Kopyala

```powershell
# API helper'ı kopyala
Copy-Item -Path ".\my-trips-phase2\frontend\lib\my-trips-api.ts" -Destination ".\frontend\lib\"

# page.tsx değişikliklerini uygula (MY_TRIPS_PAGE_CHANGES.md'ye bakarak manuel)
```

### 3. Backend'i Başlat ve Test Et

```powershell
cd C:\dev\eurotrain-b2c-app\backend
npm run start:dev
```

---

## 🧪 TEST KOMUTLARI

### iCal Endpoint Testi

```powershell
# Önce bir booking'in token'ını al
$body = @{ email = "test@example.com" } | ConvertTo-Json
$response = Invoke-RestMethod -Uri "http://localhost:3001/my-trips/request-link" -Method POST -Body $body -ContentType "application/json"
$token = $response.token

# iCal indir
Invoke-WebRequest -Uri "http://localhost:3001/calendar/1/ics?token=$token" -OutFile "test-ticket.ics"

# Takvim linklerini al
Invoke-RestMethod -Uri "http://localhost:3001/calendar/1/google?token=$token" | ConvertTo-Json
```

### Share Endpoint Testi

```powershell
# Paylaşım verilerini al
Invoke-RestMethod -Uri "http://localhost:3001/share/1?token=$token" | ConvertTo-Json

# WhatsApp URL'i al
Invoke-RestMethod -Uri "http://localhost:3001/share/1/whatsapp?token=$token" | ConvertTo-Json
```

### Email Resend Testi

```powershell
# Email tekrar gönder
Invoke-RestMethod -Uri "http://localhost:3001/my-trips/1/resend-email?token=$token" -Method POST | ConvertTo-Json
```

---

## 📋 YENİ API ENDPOINTLERİ

| Endpoint | Method | Açıklama |
|----------|--------|----------|
| `/calendar/:id/ics?token=xxx` | GET | iCal dosyası indir |
| `/calendar/all?token=xxx` | GET | Tüm biletler için iCal |
| `/calendar/:id/google?token=xxx` | GET | Google/Apple/Outlook linkleri |
| `/share/:id?token=xxx` | GET | Tüm paylaşım verileri |
| `/share/:id/whatsapp?token=xxx` | GET | WhatsApp URL |
| `/share/:id/sms?token=xxx` | GET | SMS URL |
| `/share/:id/email?token=xxx` | GET | Email URL |
| `/share/:id/text?token=xxx` | GET | Düz metin |
| `/my-trips/:id/resend-email?token=xxx` | POST | Email tekrar gönder |

---

## ✅ CHECKLIST

### Backend
- [ ] `calendar/` klasörü kopyalandı
- [ ] `share/` klasörü kopyalandı
- [ ] `app.module.ts` güncellendi
- [ ] `my-trips.controller.ts` güncellendi
- [ ] Backend başarıyla derlendi (`npm run build`)
- [ ] Endpoint'ler test edildi

### Frontend
- [ ] `lib/my-trips-api.ts` eklendi
- [ ] `page.tsx` değişiklikleri yapıldı
- [ ] Import'lar eklendi
- [ ] TripCard action butonları güncellendi
- [ ] Toast component eklendi
- [ ] Frontend başarıyla derlendi (`npm run build`)

### Test
- [ ] iCal indirme çalışıyor
- [ ] Google Calendar linki açılıyor
- [ ] WhatsApp paylaşım çalışıyor
- [ ] Email resend çalışıyor (rate limit test edildi)
- [ ] Mobil responsive test edildi

---

## ⚠️ ÖNEMLİ NOTLAR

1. **Mevcut koda dokunma!** Sadece belirtilen dosyaları güncelle
2. **Token validasyonu** tüm endpoint'lerde zorunlu
3. **Rate limiting** email resend'de 5 dakika cooldown var
4. **Apple Wallet** sertifika gerektirdiği için devre dışı

---

## 🐛 OLASI HATALAR VE ÇÖZÜMLER

### "Module not found: calendar.module"
```
app.module.ts'de import path'i kontrol et:
import { CalendarModule } from './calendar/calendar.module';
```

### "MoreThan is not defined"
```
calendar.controller.ts ve share.controller.ts'de TypeORM import'u:
import { Repository, MoreThan } from 'typeorm';
```

### "Token gerekli" hatası
```
Frontend'de token'ı URL'den alıp API çağrılarına ekle
```

---

## 📞 DESTEK

Sorun yaşarsan:
1. Backend loglarını kontrol et
2. Network tab'dan API response'u incele
3. Token'ın geçerli olduğundan emin ol
