# 🚀 EUROTRAIN QUICK START

**Son Güncelleme:** 24 Ocak 2026
**Domain:** eurotrain.net

---

## HIZLI BAŞLANGIÇ

### 1. Database'i Başlat
```powershell
docker start eurotrain-db
```

Eğer container yoksa:
```powershell
docker run --name eurotrain-db -e POSTGRES_PASSWORD=dev123 -e POSTGRES_USER=eurotrain -e POSTGRES_DB=eurotrain_db -p 5432:5432 -d postgres:15
```

### 2. Backend'i Başlat
```powershell
cd C:\dev\eurotrain-b2c-app\backend
npm run start:dev
```

### 3. Frontend'i Başlat (yeni terminal)
```powershell
cd C:\dev\eurotrain-b2c-app\frontend
npm run dev
```

### 4. Tarayıcıda Aç
| Sayfa | URL |
|-------|-----|
| Ana Sayfa | http://localhost:3000 |
| Admin Panel | http://localhost:3000/admin |
| Admin Settings | http://localhost:3000/admin/settings |
| Biletlerim | http://localhost:3000/my-trips |
| API | http://localhost:3001 |
| ERA Status | http://localhost:3001/era/status |

---

## ADMIN GİRİŞ BİLGİLERİ
```
Email: admin@eurotrain.com
Şifre: admin123
```

---

## 🚂 ERA API TEST KOMUTLARI

### İstasyon Arama
```powershell
Invoke-RestMethod -Uri "http://localhost:3001/era/places/autocomplete?query=paris" | ConvertTo-Json
```

### Sefer Arama
```powershell
$body = @{
    origin = "FRPAR"
    destination = "GBLON"
    departureDate = "2025-02-15T09:00:00"
    adults = 1
} | ConvertTo-Json
Invoke-RestMethod -Uri "http://localhost:3001/era/search" -Method POST -Body $body -ContentType "application/json" | ConvertTo-Json -Depth 5
```

### ERA Status (Mock/Live)
```powershell
Invoke-RestMethod -Uri "http://localhost:3001/era/status" | ConvertTo-Json
```

### Tüm İstasyonlar
```powershell
Invoke-RestMethod -Uri "http://localhost:3001/era/places" | ConvertTo-Json -Depth 3
```

---

## 💱 SETTINGS API TEST KOMUTLARI

### Döviz Kurları
```powershell
Invoke-RestMethod -Uri "http://localhost:3001/settings/exchange-rates" | ConvertTo-Json
```

### Kur Dönüşümü
```powershell
Invoke-RestMethod -Uri "http://localhost:3001/settings/convert?amount=100&from=EUR&to=TRY"
```

---

## 🔐 ADMIN API TEST KOMUTLARI

### Login & Token Al
```powershell
$login = Invoke-RestMethod -Uri "http://localhost:3001/auth/login" -Method POST -ContentType "application/json" -Body '{"email":"admin@eurotrain.com","password":"admin123"}'
$token = $login.access_token
$headers = @{ "Authorization" = "Bearer $token"; "Content-Type" = "application/json" }
```

### Markup Güncelle
```powershell
Invoke-RestMethod -Uri "http://localhost:3001/settings/admin/markup" -Method PUT -Headers $headers -Body '{"markup": 3}'
```

---

## ENVIRONMENT VARIABLES

### Backend `.env`
```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=eurotrain
DB_PASSWORD=dev123
DB_DATABASE=eurotrain_db

# Auth
JWT_SECRET=eurotrain-secret-key-2026

# Email
RESEND_API_KEY=re_xxxxxxxxxxxxx

# Frontend
FRONTEND_URL=http://localhost:3000

# ERA API (Mock Mode)
ERA_AUTH_URL=https://authent-sandbox.era.raileurope.com
ERA_API_URL=https://api-sandbox.era.raileurope.com
ERA_CLIENT_ID=
ERA_CLIENT_SECRET=
ERA_POINT_OF_SALE=EUROTRAIN
ERA_MOCK_MODE=true
```

---

## 🚂 DESTEKLENEN ROTALAR (Mock)

| Rota | Carrier | Süre | Fiyat |
|------|---------|------|-------|
| Paris → London | EUROSTAR | 2s 16dk | €89+ |
| Paris → Amsterdam | THALYS | 3s 15dk | €89+ |
| Paris → Brussels | THALYS | 1s 22dk | €69+ |
| Roma → Milano | TRENITALIA | 2s 55dk | €69+ |
| Berlin → Munich | ICE | 4s | €89+ |
| Madrid → Barcelona | AVE | 2s 35dk | €69+ |
| Zurich → Geneva | SBB | 2s 50dk | €79+ |

---

## SORUN GİDERME

### "Cannot connect to database"
```powershell
docker start eurotrain-db
```

### "Port already in use"
```powershell
taskkill /F /IM node.exe
```

### "UNKNOWN" carrier görünüyor
Mock service güncel değil. En son `era-mock.service.ts` dosyasını kontrol et.

### "Unauthorized" hatası (401)
1. JWT_SECRET'ın .env'de doğru olduğundan emin ol
2. Backend'i yeniden başlat
3. Admin'den çıkış yap, tekrar giriş yap

---

## 📋 TEST CHECKLIST

```
□ Backend çalışıyor mu? (http://localhost:3001/health)
□ ERA status mock mu? (http://localhost:3001/era/status)
□ İstasyon arama çalışıyor mu?
□ Sefer arama sonuç dönüyor mu?
□ Carrier isimleri doğru mu? (EUROSTAR, TGV, vb.)
□ Frontend açılıyor mu? (http://localhost:3000)
```

---

**Sorun mu var?** WHERE_WE_LEFT.md dosyasına bak.
