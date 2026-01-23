# 🚀 EUROTRAIN STRATEGIC ROADMAP

**Son Güncelleme:** 24 Ocak 2026
**Domain:** eurotrain.net
**GitHub:** https://github.com/odamigo/eurotrain-b2c-app

---

## 📊 MEVCUT DURUM

| Kategori | Tamamlanma | Not |
|----------|------------|-----|
| Backend API | %95 | Payment güncellendi |
| Frontend | %90 | Payment sayfaları güncellendi |
| Database | %95 | Payments tablosu genişletildi |
| Güvenlik | %90 | JWT, Rate Limiting, 3D Secure |
| Email | %80 | Resend aktif, domain doğrulama bekliyor |
| Payment | %85 | Kod hazır, MSU credentials bekliyor |
| **TOPLAM** | **%94** | |

---

## 🏆 RAKİP ANALİZİ

### Trainline (Sektör Lideri)
- Real-time tren takibi
- Apple Wallet entegrasyonu
- Fiyat uyarıları (price alerts)
- "Bu bilet şu trenlerde de geçerli" özelliği

### Omio
- Çoklu ulaşım karşılaştırma
- Öğrenci indirimleri
- Çevrimdışı bilet erişimi
- Sadakat programı

### Rail Europe
- Split ticketing (%50 tasarruf)
- Orijinal taşıyıcı PDF biletleri
- Via station seçimi
- 250+ operatör

### EuroTrain Avantajları
- Türkiye/Kıbrıs/Azerbaycan pazarı odaklı
- TRY ile ödeme imkanı (TCMB kuru)
- MCP Server ile AI agent desteği (yakında)
- Hızlı ve modern UI/UX

---

## 📅 FAZ PLANI

### FAZ 1: MVP TAMAMLAMA (Bu Hafta)

| # | Görev | Süre | Durum |
|---|-------|------|-------|
| 1 | Email servisi | 4 saat | ✅ TAMAMLANDI |
| 2 | QR kodlu PDF bilet | 3 saat | ✅ TAMAMLANDI |
| 3 | Payment gateway güncelleme | 4 saat | ✅ TAMAMLANDI |
| 4 | Mobile responsive | 2 saat | ✅ TAMAMLANDI |
| 5 | MSU credentials | - | ⏳ Payten'den bekleniyor |
| 6 | TCMB kur entegrasyonu | 2 saat | 🔜 Sırada |
| 7 | Settings modülü | 3 saat | 🔜 Sırada |

### FAZ 2: PRODUCTION HAZIRLIK (2 Hafta)

| # | Görev | Açıklama |
|---|-------|----------|
| 8 | Admin Settings sayfası | Kur, markup, terms yönetimi |
| 9 | Terms & Privacy sayfaları | Yasal metinler |
| 10 | Çoklu dil (i18n) | TR/EN desteği |
| 11 | Resend domain doğrulama | eurotrain.net |
| 12 | HTTPS sertifikası | Let's Encrypt |
| 13 | Performance optimizasyonu | Core Web Vitals |
| 14 | Error boundaries | Hata yönetimi |

### FAZ 3: AI AGENT ENTEGRASYONU (1 Ay)

| # | Görev | Açıklama |
|---|-------|----------|
| 15 | MCP Server v1 | AI booking protokolü |
| 16 | searchTrains tool | Tren arama |
| 17 | createBooking tool | Rezervasyon |
| 18 | Direct Post API | AI için redirect-free ödeme |
| 19 | Claude/ChatGPT test | Entegrasyon testi |

### FAZ 4: GROWTH FEATURES (Backlog)

- Price alerts (fiyat bildirimleri)
- Saved searches (favori rotalar)
- Loyalty program (EuroTrain Points)
- Split ticketing
- Dark mode
- PWA support
- 2FA
- Refund self-service

---

## 💳 PAYMENT GATEWAY DETAYLARI

### Mevcut Durum (24 Ocak 2026)
- ✅ Hosted Page entegrasyonu
- ✅ 3D Secure zorunlu
- ✅ Çoklu para birimi (EUR/USD/TRY)
- ✅ Refund API (tam/kısmi iade)
- ✅ Mock mode (test için)
- ✅ Retry mekanizması (3 deneme)
- ⏳ MSU credentials bekleniyor

### Payten İletişim
```
Email: destek.gateway@payten.com
Tel: 0212 319 0 678
Talep: "MSU Hosted Page test ortamı için merchant credentials"
```

### MCP Uyumluluğu
Hosted Page redirect kullanıyor - AI agent'lar redirect takip edemez.
**Çözüm:** FAZ 3'te Direct Post API eklenecek.

---

## 💱 KUR YÖNETİMİ (PLANLI)

### TCMB Entegrasyonu
- Kaynak: TCMB Efektif Satış Kuru
- URL: https://www.tcmb.gov.tr/kurlar/today.xml
- Güncelleme: Saatlik cache
- Fallback: Son bilinen kur

### Markup Stratejisi
- EUR: Orijinal fiyat (markup yok)
- USD: TCMB kuru + %2.5 markup
- TRY: TCMB kuru + %2.5 markup
- Admin panelden düzenlenebilir

### Kullanıcı Bildirimi
"Orijinal para birimi dışında ödeme yapıldığında kur farkı uygulanmaktadır."

---

## 🌍 ÇOKLU DİL (PLANLI)

### Desteklenecek Diller
- 🇹🇷 Türkçe (varsayılan)
- 🇬🇧 English
- 🇩🇪 Deutsch (gelecekte)
- 🇫🇷 Français (gelecekte)

### Çevirilecek İçerikler
- UI metinleri
- Hata mesajları
- Email şablonları
- Terms & Conditions
- Privacy Policy

---

## 📈 BAŞARI METRİKLERİ

### Teknik
- Sayfa yükleme < 3 saniye
- API response < 500ms
- Uptime > 99.5%
- Error rate < 1%

### İş
- Conversion rate > 3%
- Cart abandonment < 70%
- Customer satisfaction > 4.5/5
- Return customer rate > 40%

---

## ⚠️ RİSK FAKTÖRLERİ

| Risk | Olasılık | Etki | Çözüm |
|------|----------|------|-------|
| MSU credentials gecikme | Orta | Kritik | Mock mode ile devam |
| TCMB API erişim sorunu | Düşük | Orta | Fallback kurlar |
| ERA API gecikmesi | Yüksek | Yüksek | Mock data ile devam |
| Domain doğrulama | Düşük | Orta | Resend support |

---

## 📞 ÖNEMLİ İLETİŞİM

### Payten
- destek.gateway@payten.com
- 0212 319 0 678

### Rail Europe
- Partner portal üzerinden

### Resend
- https://resend.com/support

### Natro (Hosting)
- destek@natro.com

---

## 🎯 SONRAKİ ADIMLAR

1. **Bugün:** TCMB kur entegrasyonu
2. **Bugün:** Settings modülü (backend)
3. **Yarın:** Admin Settings sayfası
4. **Yarın:** Terms & Privacy sayfaları
5. **Bu hafta:** MSU credentials ile gerçek test
6. **Gelecek hafta:** i18n altyapısı

---

**Son Güncelleme:** 24 Ocak 2026 - 02:15
**Hazırlayan:** Claude + Levent