# EUROTRAIN QUICK START

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
| Health Check | http://localhost:3001/health |

---

## ADMIN GİRİŞ BİLGİLERİ
```
Email: admin@eurotrain.com
Şifre: admin123
```

---

## API TEST KOMUTLARI

### Döviz Kurları (YENİ)
```powershell
Invoke-RestMethod -Uri "http://localhost:3001/settings/exchange-rates" | ConvertTo-Json
```

### Kur Dönüşümü
```powershell
Invoke-RestMethod -Uri "http://localhost:3001/settings/convert?amount=100&from=EUR&to=TRY"
```

### Email Gönderimi
```powershell
Invoke-RestMethod -Uri "http://localhost:3001/email/test" -Method POST -ContentType "application/json" -Body '{"email":"levent@duck.com"}'
```

### Health Check
```powershell
Invoke-RestMethod -Uri "http://localhost:3001/health"
Invoke-RestMethod -Uri "http://localhost:3001/health/detailed"
```

### Admin Login
```powershell
$login = Invoke-RestMethod -Uri "http://localhost:3001/auth/login" -Method POST -ContentType "application/json" -Body '{"email":"admin@eurotrain.com","password":"admin123"}'
$token = $login.access_token
```

### Admin ile Markup Güncelle
```powershell
$headers = @{ "Authorization" = "Bearer $token"; "Content-Type" = "application/json" }
Invoke-RestMethod -Uri "http://localhost:3001/settings/admin/markup" -Method PUT -Headers $headers -Body '{"markup": 3}'
```

---

## ENVIRONMENT VARIABLES (.env)

Backend klasöründe `.env` dosyası:
```
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=eurotrain
DB_PASSWORD=dev123
DB_DATABASE=eurotrain_db
JWT_SECRET=eurotrain-secret-key-2026
RESEND_API_KEY=re_xxxxxxxxxxxxx
FRONTEND_URL=http://localhost:3000
```

⚠️ **ÖNEMLİ:** JWT_SECRET değeri kod ile aynı olmalı!

---

## SORUN GİDERME

### "Cannot connect to database"
```powershell
docker start eurotrain-db
```

### "Port already in use"
```powershell
Get-Process -Id (Get-NetTCPConnection -LocalPort 3001).OwningProcess | Stop-Process -Force
```

### "Unauthorized" hatası (401)
1. JWT_SECRET'ın .env'de `eurotrain-secret-key-2026` olduğundan emin ol
2. Backend'i yeniden başlat
3. Admin'den çıkış yap, tekrar giriş yap

### Rate Limit aşıldı (429)
1 dakika bekle veya backend'i yeniden başlat.

### Email gönderilemiyor
- Resend API key kontrol et (.env dosyası)
- Domain doğrulanmadan sadece levent@duck.com'a gönderilebilir

---

## MODÜLLER

| Modül | Endpoint | Açıklama |
|-------|----------|----------|
| Auth | /auth/* | Admin login, JWT |
| Bookings | /bookings/* | Rezervasyon CRUD |
| ERA | /era/* | Tren arama |
| Payment | /payment/* | MSU ödeme |
| My Trips | /my-trips/* | Bilet görüntüleme |
| Email | /email/* | Email gönderimi |
| PDF | /pdf/* | E-bilet PDF |
| Settings | /settings/* | Kur, markup, terms |
| Health | /health/* | Sistem durumu |

---

**Sorun mu var?** WHERE_WE_LEFT.md dosyasına bak.
