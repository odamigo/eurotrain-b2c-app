# 🚀 EUROTRAIN STRATEGIC ROADMAP

**Son Güncelleme:** 25 Ocak 2026
**Durum:** Search Results v2 Tamamlandı

---

## 📊 MEVCUT DURUM

| Kategori | Durum | Not |
|----------|-------|-----|
| ERA API Altyapısı | ✅ | Interfaces, Services, Mock |
| Backend API | %98 | Tüm modüller hazır |
| Frontend Search | ✅ | v2 Accordion UI |
| Frontend Booking | %80 | Güncellenmeli |
| Database | %98 | Settings tablosu aktif |
| Payment | %90 | MSU credentials bekliyor |
| TCMB Kur | ✅ | Efektif satış, dinamik markup |
| **TOPLAM** | **%95** | |

---

## ✅ TAMAMLANAN

### 25 Ocak 2026 - Search Results v2
- ✅ Accordion/Expandable Cards
- ✅ 3 Class karşılaştırma (Standart/Business/First)
- ✅ "En Popüler" badge
- ✅ Saat filtreleri (Sabah/Öğle/Akşam)
- ✅ Kalkış/Varış saat aralığı seçimi
- ✅ Sıralama (Fiyat/Süre/Kalkış)
- ✅ Feature tags (Yüksek Hız, WiFi, Restoran)
- ✅ Rakip analizi: Trainline, Omio, FlixBus, Rail Europe

### 24 Ocak 2026 - ERA API & Mock v2
- ✅ `era-api.types.ts` - 700+ satır TypeScript interface
- ✅ ERA Services: Auth, Places, Search, Booking, Refund
- ✅ Mock Service v2: 3 class, 35+ rota, 32 şehir
- ✅ Frontend ERA entegrasyonu
- ✅ Agentic Commerce stratejisi belgesi

---

## 📅 FAZ PLANI

### FAZ 1: MVP Tamamlama (Bu Hafta)
| Görev | Durum | Öncelik |
|-------|-------|---------|
| ERA API Altyapısı | ✅ | - |
| Mock Service v2 | ✅ | - |
| Search Results v2 UI | ✅ | - |
| **Booking sayfası güncelleme** | ⏳ | 🔴 Yüksek |
| Terms/Privacy sayfaları | 🔜 | 🟡 Orta |
| MSU credentials test | ⏳ | 🔴 Yüksek |

### FAZ 2: Production Ready (2 Hafta)
| Görev | Durum | Not |
|-------|-------|-----|
| Çoklu dil (i18n) | 🔜 | TR, EN başlangıç |
| Mobile responsive | 🔜 | Tüm sayfalar |
| HTTPS sertifikası | 🔜 | Natro VPS |
| Performance optimizasyonu | 🔜 | Lighthouse >90 |
| Error boundaries | 🔜 | React |
| Loading skeletons | 🔜 | UX |

### FAZ 3: Real API (3-4 Hafta)
| Görev | Durum | Not |
|-------|-------|-----|
| ERA Sandbox credentials | ⏳ | Bekleniyor |
| Mock → Real geçişi | 🔜 | Sadece .env değişikliği |
| Error handling | 🔜 | API hataları |
| Rate limiting | 🔜 | ERA limitleri |
| Logging & monitoring | 🔜 | Production |

### FAZ 4: AI Agent (1-2 Ay)
| Görev | Durum | Not |
|-------|-------|-----|
| MCP Server | 🔜 | search-trains tool |
| Claude Desktop entegrasyonu | 🔜 | Test |
| ChatGPT Actions | 🔜 | Alternatif |
| UCP uyumu | 🔜 | Google |

---

## 🎯 SONRAKİ ADIMLAR (Öncelik Sırasına Göre)

### 1. Booking Sayfası (Bu Hafta) 🔴
- ERA booking flow
- Traveler formu (Ad, Soyad, Email, Telefon)
- Prebook → Payment → Confirm
- Seçilen class bilgilerinin aktarılması

### 2. UI/UX İyileştirmeler (Bu Hafta) 🟡
- Mobile responsive kontrol
- Homepage form iyileştirme
- Loading states

### 3. Legal Sayfalar (Bu Hafta) 🟡
- Terms of Service
- Privacy Policy
- Admin'den düzenlenebilir

### 4. Production Hazırlık (Gelecek Hafta) 🟢
- MSU gerçek credentials
- ERA sandbox test
- HTTPS aktifleştirme

---

## 💱 KUR YÖNETİMİ

### Mevcut Yapı
- Kaynak: TCMB Efektif Satış
- Cache: 1 saat
- Fallback: Son bilinen kur

### Markup Stratejisi
| Para Birimi | Markup | Not |
|-------------|--------|-----|
| EUR | %0 | Orijinal fiyat |
| USD | Dinamik | Admin'den |
| TRY | Dinamik | Admin'den |

---

## 🚂 ERA API DURUMU

### Mock Mode (Şu an)
```env
ERA_MOCK_MODE=true
```

### Real Mode (Gelecek)
```env
ERA_MOCK_MODE=false
ERA_CLIENT_ID=xxx
ERA_CLIENT_SECRET=xxx
ERA_POINT_OF_SALE=EUROTRAIN
```

### Desteklenen İşlemler
| İşlem | Mock | Real |
|-------|------|------|
| Places Autocomplete | ✅ | 🔜 |
| Journey Search | ✅ | 🔜 |
| Booking Create | ✅ | 🔜 |
| Prebook/Confirm | ✅ | 🔜 |
| Print Ticket | ✅ | 🔜 |
| Refund | ✅ | 🔜 |

---

## 🤖 AGENTIC COMMERCE STRATEJİSİ

### Yaklaşım: MCP-First, UCP-Ready

**Neden MCP?**
- Anthropic standardı, de-facto
- Kiwi.com örneği başarılı
- Tren sektöründe MCP server YOK - ilk olma fırsatı

**Faz 1 (2-3 hafta):**
- `search-trains` tool
- `get-stations` tool + resource
- Claude Desktop entegrasyonu

**Faz 2 (3-4 hafta):**
- `create-booking` tool
- Booking link oluşturma (Kiwi.com modeli)

**Faz 3 (4-6 hafta):**
- AP2 (Agent Payments Protocol)
- Google UCP uyumluluğu

Detaylar: `docs/AGENTIC_COMMERCE_STRATEGY.md`

---

## 📞 İLETİŞİM

### Payten
- destek.gateway@payten.com
- 0212 319 0 678

### Rail Europe
- Sandbox credentials bekleniyor

### Linkler
- Frontend: http://localhost:3000
- Backend: http://localhost:3001
- Admin: http://localhost:3000/admin
- GitHub: https://github.com/odamigo/eurotrain-b2c-app

---

## 📋 KALİTE KONTROL

### Her Değişiklik Sonrası
```
□ API doğru veri dönüyor mu?
□ Frontend doğru gösteriyor mu?
□ Mobile'da düzgün görünüyor mu?
□ Edge case'ler çalışıyor mu?
□ Screenshot ile doğrulandı mı?
```

### Production Öncesi
```
□ Tüm sayfalar mobile responsive
□ Lighthouse skoru >90
□ Error handling tamamlandı
□ Loading states eklendi
□ Legal sayfalar hazır
□ HTTPS aktif
```
