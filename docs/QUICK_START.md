# 🚀 EUROTRAIN QUICK START

**Son Güncelleme:** 19 Ocak 2026
**Domain:** eurotrain.net

---

## ⚡ HIZLI BAŞLANGIÇ

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
cd C:\Users\odami\eurotrain-platform\backend
npm run start:dev
```

### 3. Frontend'i Başlat (yeni terminal)
```powershell
cd C:\Users\odami\eurotrain-platform\frontend
npm run dev
```

### 4. Tarayıcıda Aç
- **Ana Sayfa:** http://localhost:3000
- **Admin Panel:** http://localhost:3000/admin
- **My Trips:** http://localhost:3000/my-trips
- **API:** http://localhost:3001
- **Health Check:** http://localhost:3001/health

---

## 🔐 ADMIN GİRİŞ BİLGİLERİ

```
Email: admin@eurotrain.com
Şifre: admin123
```

⚠️ **Production'da mutlaka değiştir!**

---

## 🧪 TEST SENARYOLARI

### Senaryo 1: Health Check
```powershell
curl http://localhost:3001/health
```
Beklenen: `{"status":"ok","services":{"api":"ok","database":"ok"}}`

### Senaryo 2: Admin Login
```powershell
curl http://localhost:3001/auth/login -Method POST -Headers @{"Content-Type"="application/json"} -Body '{"email":"admin@eurotrain.com","password":"admin123"}'
```
Beklenen: `{"success":true,"access_token":"eyJ..."}`

### Senaryo 3: Rate Limiting Test
60'dan fazla istek at, 429 hatası almalısın.

### Senaryo 4: Tren Arama
1. http://localhost:3000 aç
2. "Paris" yaz → Autocomplete çalışmalı
3. Paris → Amsterdam seç, tarih gir
4. "Tren Ara" tıkla

### Senaryo 5: My Trips
```powershell
curl http://localhost:3001/my-trips/request-link -Method POST -Headers @{"Content-Type"="application/json"} -Body '{"email":"test@example.com"}'
```

### Senaryo 6: Ödeme Testi
```
http://localhost:3000/payment?orderId=TEST-123&amount=100&journey=Paris-Amsterdam
```

---

## 🔧 API TEST KOMUTLARI

### Authentication
```powershell
# Login
curl http://localhost:3001/auth/login -Method POST -Headers @{"Content-Type"="application/json"} -Body '{"email":"admin@eurotrain.com","password":"admin123"}'

# Profile (token gerekli)
curl http://localhost:3001/auth/profile -Headers @{"Authorization"="Bearer TOKEN_BURAYA"}

# Token Doğrula
curl http://localhost:3001/auth/verify -Method POST -Headers @{"Content-Type"="application/json"} -Body '{"token":"TOKEN_BURAYA"}'
```

### Health & Monitoring
```powershell
# Basit Health Check
curl http://localhost:3001/health

# Detaylı Health Check
curl http://localhost:3001/health/detailed

# Error Logs (token gerekli)
curl http://localhost:3001/admin/logs/errors -Headers @{"Authorization"="Bearer TOKEN"}

# Error Stats (token gerekli)
curl http://localhost:3001/admin/logs/stats -Headers @{"Authorization"="Bearer TOKEN"}
```

### My Trips
```powershell
# Magic Link Talep
curl http://localhost:3001/my-trips/request-link -Method POST -Headers @{"Content-Type"="application/json"} -Body '{"email":"test@example.com"}'

# Token ile Bilet Getir
curl "http://localhost:3001/my-trips/verify?token=TOKEN_BURAYA"
```

### ERA - Sefer Arama
```powershell
curl "http://localhost:3001/era/stations/search?query=paris"
curl "http://localhost:3001/era/popular-routes"
```

### Booking
```powershell
curl http://localhost:3001/bookings -Method POST -Headers @{"Content-Type"="application/json"} -Body '{"customerName":"Test User","customerEmail":"test@test.com","fromStation":"Paris","toStation":"Amsterdam","price":89}'
```

---

## 📊 DATABASE KOMUTLARI

### Tabloları Listele
```powershell
docker exec eurotrain-db psql -U eurotrain -d eurotrain_db -c "\dt"
```

### Admin Kullanıcıları Gör
```powershell
docker exec eurotrain-db psql -U eurotrain -d eurotrain_db -c "SELECT id, email, name, role FROM admin_users"
```

### Booking'leri Listele
```powershell
docker exec eurotrain-db psql -U eurotrain -d eurotrain_db -c "SELECT * FROM booking"
```

---

## 🆘 SORUN GİDERME

### "Cannot connect to database"
```powershell
docker start eurotrain-db
```

### "Port 3001 already in use"
```powershell
netstat -ano | findstr :3001
taskkill /PID <PID> /F
```

### "Unauthorized" hatası
Token süresi dolmuş olabilir. Yeniden login ol.

### Rate Limit aşıldı (429)
1 dakika bekle veya backend'i yeniden başlat.

### Log dosyaları nerede?
```
backend/logs/error.log
backend/logs/combined.log
```

---

## 📁 ÖNEMLİ DOSYALAR

| Dosya | Açıklama |
|-------|----------|
| `backend/src/app.module.ts` | Ana modül |
| `backend/src/security/` | Güvenlik modülü |
| `backend/src/security/auth.service.ts` | Login işlemleri |
| `backend/src/security/logger.service.ts` | Error logging |
| `backend/logs/` | Log dosyaları |
| `frontend/app/my-trips/page.tsx` | Biletlerim sayfası |
| `docs/WHERE_WE_LEFT.md` | Son durum özeti |

---

## 🔐 GÜVENLİK ÖZELLİKLERİ

| Özellik | Durum | Detay |
|---------|-------|-------|
| JWT Auth | ✅ | 24 saat geçerli token |
| Rate Limiting | ✅ | 60 istek/dakika |
| Password Hashing | ✅ | bcrypt |
| Error Logging | ✅ | logs/ klasörü |
| Health Check | ✅ | /health endpoint |
| CORS | ✅ | localhost:3000 izinli |

---

## ⚙️ ENVIRONMENT VARIABLES

### Backend (.env)
```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=eurotrain
DB_PASSWORD=dev123
DB_DATABASE=eurotrain_db

# JWT
JWT_SECRET=eurotrain-super-secret-key-change-in-production

# Frontend URL
FRONTEND_URL=http://localhost:3000

# MSU Payment (henüz eklenmedi)
MSU_MERCHANT_USER=
MSU_MERCHANT_PASSWORD=
MSU_MERCHANT=
```

---

## 📱 URL'LER

| Servis | URL |
|--------|-----|
| Domain | eurotrain.net |
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:3001 |
| Admin Panel | http://localhost:3000/admin |
| My Trips | http://localhost:3000/my-trips |
| Health Check | http://localhost:3001/health |
| Database | localhost:5432 |

---

**Versiyon:** 4.0