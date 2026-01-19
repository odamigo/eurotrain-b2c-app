# EUROTRAIN QUICK START

**Son Guncelleme:** 19 Ocak 2026
**Domain:** eurotrain.net

---

## HIZLI BASLANGIC

### 1. Database'i Baslat
```powershell
docker start eurotrain-db
```

Eger container yoksa:
```powershell
docker run --name eurotrain-db -e POSTGRES_PASSWORD=dev123 -e POSTGRES_USER=eurotrain -e POSTGRES_DB=eurotrain_db -p 5432:5432 -d postgres:15
```

### 2. Backend'i Baslat
```powershell
cd C:\dev\eurotrain-b2c-app\backend
npm run start:dev
```

### 3. Frontend'i Baslat (yeni terminal)
```powershell
cd C:\dev\eurotrain-b2c-app\frontend
npm run dev
```

### 4. Tarayicida Ac
- **Ana Sayfa:** http://localhost:3000
- **Admin Panel:** http://localhost:3000/admin
- **My Trips:** http://localhost:3000/my-trips
- **API:** http://localhost:3001
- **Health Check:** http://localhost:3001/health

---

## ADMIN GIRIS BILGILERI
```
Email: admin@eurotrain.com
Sifre: admin123
```

---

## API TEST KOMUTLARI

### Email Gonderimi (YENI)
```powershell
curl http://localhost:3001/email/test -Method POST -Headers @{"Content-Type"="application/json"} -Body '{"email":"levent@duck.com"}'
```

### Health Check
```powershell
curl http://localhost:3001/health
curl http://localhost:3001/health/detailed
```

### Admin Login
```powershell
curl http://localhost:3001/auth/login -Method POST -Headers @{"Content-Type"="application/json"} -Body '{"email":"admin@eurotrain.com","password":"admin123"}'
```

### Token ile Korumali Endpoint
```powershell
curl http://localhost:3001/auth/profile -Headers @{"Authorization"="Bearer TOKEN_BURAYA"}
```

### My Trips Magic Link
```powershell
curl http://localhost:3001/my-trips/request-link -Method POST -Headers @{"Content-Type"="application/json"} -Body '{"email":"test@example.com"}'
```

### Tren Arama
```powershell
curl "http://localhost:3001/era/stations/search?query=paris"
curl "http://localhost:3001/era/popular-routes"
```

### Booking Olustur
```powershell
curl http://localhost:3001/bookings -Method POST -Headers @{"Content-Type"="application/json"} -Body '{"customerName":"Test User","customerEmail":"test@test.com","fromStation":"Paris","toStation":"Amsterdam","price":89}'
```

---

## DATABASE KOMUTLARI

### Tablolari Listele
```powershell
docker exec eurotrain-db psql -U eurotrain -d eurotrain_db -c "\dt"
```

### Admin Kullanicilari Gor
```powershell
docker exec eurotrain-db psql -U eurotrain -d eurotrain_db -c "SELECT id, email, name, role FROM admin_users"
```

### Booking'leri Listele
```powershell
docker exec eurotrain-db psql -U eurotrain -d eurotrain_db -c "SELECT * FROM booking"
```

---

## SORUN GIDERME

### "Cannot connect to database"
```powershell
docker start eurotrain-db
```

### "Port 3001 already in use"
```powershell
netstat -ano | findstr :3001
taskkill /PID <PID> /F
```

### "Unauthorized" hatasi
Token suresi dolmus olabilir. Yeniden login ol.

### Rate Limit asildi (429)
1 dakika bekle veya backend'i yeniden baslat.

### Email gonderilemiyor
- Resend API key kontrol et (.env dosyasi)
- Sadece levent@duck.com adresine gonderilebilir (domain dogrulama yapilmadi)

---

## ENVIRONMENT VARIABLES (.env)

Backend klasorunde .env dosyasi olmali:
```
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=eurotrain
DB_PASSWORD=dev123
DB_DATABASE=eurotrain_db
JWT_SECRET=eurotrain-super-secret-key-change-in-production
RESEND_API_KEY=re_xxxxxxxxxxxxx
FRONTEND_URL=http://localhost:3000
```

---

## MODULLER

| Modul | Endpoint | Aciklama |
|-------|----------|----------|
| Auth | /auth/* | Admin login, JWT |
| Bookings | /bookings/* | Rezervasyon CRUD |
| ERA | /era/* | Tren arama |
| Payment | /payment/* | MSU odeme |
| My Trips | /my-trips/* | Bilet goruntuleme |
| Email | /email/* | Email gonderimi |
| PDF | /pdf/* | E-bilet PDF |
| Health | /health/* | Sistem durumu |

---

**Sorun mu var?** WHERE_WE_LEFT.md dosyasina bak.
