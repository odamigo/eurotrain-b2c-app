# 🚂 EUROTRAIN - NEREDE KALDIK?

**Son Güncelleme:** 24 Ocak 2026 - 03:00
**Durum:** %96 Tamamlandı
**Domain:** eurotrain.net
**GitHub:** https://github.com/odamigo/eurotrain-b2c-app

---

## ✅ TAMAMLANAN MODÜLLER

### Backend (NestJS)
- ✅ Bookings, Pricing, Campaigns, ERA, My Trips
- ✅ Payment (MSU Hosted Page, Refund, 3D Secure)
- ✅ Security (JWT, Rate Limiting, Logging)
- ✅ Email (Resend), PDF (QR kodlu e-bilet)
- ✅ Settings - TCMB kur, markup, terms/privacy

### Frontend (Next.js)
- ✅ Ana sayfa, Arama, Booking, My Trips
- ✅ Admin panel (login, dashboard, kampanyalar, rezervasyonlar)
- ✅ Payment sayfası - TCMB kur, para birimi seçimi
- ✅ **Admin Settings sayfası** - Kur güncelleme, markup, kullanım koşulları

---

## 🔧 SON YAPILAN İŞLER (24 Ocak 2026)

### Admin Settings Sayfası (Tamamlandı!)
- ✅ TCMB döviz kurları görüntüleme (EUR/TRY, USD/EUR)
- ✅ "Kurları Güncelle" butonu (TCMB'den anlık çekme)
- ✅ Markup oranı ayarlama ve kaydetme
- ✅ Kullanım Koşulları (Markdown) düzenleme
- ✅ Gizlilik Politikası (Markdown) düzenleme
- ✅ JWT token hatası düzeltildi (.env secret uyumsuzluğu)

### Düzeltilen Sorun
- `.env` dosyasındaki JWT_SECRET ile kod içindeki fallback secret farklıydı
- `eurotrain-super-secret-key-change-in-production` → `eurotrain-secret-key-2026` olarak düzeltildi

---

## 🔌 API ENDPOİNTLERİ

### Settings (Public)
| Method | Endpoint | Açıklama |
|--------|----------|----------|
| GET | /settings/exchange-rates | TCMB kurları |
| GET | /settings/convert | Kur dönüşümü |
| GET | /settings/terms | Kullanım koşulları |
| GET | /settings/privacy | Gizlilik politikası |

### Settings (Admin - JWT Gerekli)
| Method | Endpoint | Açıklama |
|--------|----------|----------|
| GET | /settings/admin/all | Tüm ayarlar |
| PUT | /settings/admin/markup | Markup güncelle |
| PUT | /settings/admin/terms | Terms güncelle |
| PUT | /settings/admin/privacy | Privacy güncelle |
| POST | /settings/admin/exchange-rates/refresh | Kurları yenile |

---

## 🔜 SIRADA NE VAR?

### Öncelik 1 (Bu Hafta)
- [ ] Terms & Privacy frontend sayfaları (/terms, /privacy)
- [ ] MSU credentials (Payten'den test bilgileri alma)
- [ ] Mobile responsive iyileştirmeler

### Öncelik 2 (Gelecek Hafta)
- [ ] Çoklu dil (i18n) - TR/EN
- [ ] Resend domain doğrulama (eurotrain.net)
- [ ] Real ERA API entegrasyonu

### Öncelik 3 (Gelecek Ay)
- [ ] MCP Server (AI agent entegrasyonu)
- [ ] Natro VPS deployment
- [ ] HTTPS sertifikası

---

## 🧪 TEST LİNKLERİ

| Sayfa | URL |
|-------|-----|
| Ana Sayfa | http://localhost:3000 |
| Admin Panel | http://localhost:3000/admin |
| Admin Login | http://localhost:3000/admin/login |
| **Admin Settings** | http://localhost:3000/admin/settings |
| Kur API | http://localhost:3001/settings/exchange-rates |
| Health Check | http://localhost:3001/health |

### Admin Giriş
```
Email: admin@eurotrain.com
Şifre: admin123
```

---

## ⚙️ ÖNEMLİ NOTLAR

### JWT Secret
`.env` dosyasında ve kodda aynı olmalı:
```
JWT_SECRET=eurotrain-secret-key-2026
```

### TCMB Kur Bilgisi
- Kaynak: TCMB Efektif Satış Kuru
- Cache: 1 saat
- Fallback: Son bilinen kur veya sabit değer

### Markup
- EUR: %0 (orijinal fiyat)
- USD/TRY: %2.5 (admin'den değiştirilebilir)

---

**Sonraki hedef:** Terms & Privacy sayfaları
