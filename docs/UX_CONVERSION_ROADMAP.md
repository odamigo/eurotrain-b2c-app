# 🎯 EUROTRAIN UX & CONVERSION ROADMAP

**Oluşturulma:** 28 Ocak 2026  
**Durum:** 📋 PLANLANMIŞ - HENÜZ NETLEŞTİRİLMEDİ  
**Kaynak:** Stratejik dönüşüm optimizasyonu analizi

---

## ⚠️ UYARI

Bu dokümandaki öneriler **henüz netleştirilmemiştir**. Uygulama öncesi her madde için:
1. Teknik fizibilite kontrolü
2. Tasarım onayı
3. Öncelik belirleme

yapılmalıdır.

---

## 📊 ANALİZ ÖZETİ

Farklı sektörlerden (Lemonade, Hopper, Uber, Booking.com) alınan best practice'ler EuroTrain'e uyarlandı. Mevcut ERA API yapısına ve tek domain (`eurotrain.net`) mimarisine göre filtrelendi.

### ❌ Elenen Öneriler
| Öneri | Eleme Sebebi |
|-------|--------------|
| Subdomain handoff | Tek domain kullanıyoruz |
| Price Freeze | ERA API desteklemiyor |
| "Rail Europe Partner" ibaresi | Kendi markamızı öne çıkarıyoruz |
| Full NLP Chat | MVP sonrası, MCP stratejisi ile |

---

## ✅ UYGULANABILIR ÖNERİLER

### Kategori A: Düşük Efor / Yüksek Etki (Hızlı Kazanımlar)

| # | Öneri | Dosya | Efor | Etki |
|---|-------|-------|------|------|
| A1 | **Mobile Sticky CTA** - Floating "Book" butonu | checkout/page.tsx | 2 saat | Yüksek |
| A2 | **Trust Badge** - "Official Reseller of 230+ European Rail Carriers" | Header.tsx | 30 dk | Orta |
| A3 | **Carrier Logoları** - SNCF, DB, Trenitalia, Eurostar | Footer.tsx | 1 saat | Orta |
| A4 | **CTA Text** - "Buy Now" → "Secure My Seat" | checkout/page.tsx | 15 dk | Orta |
| A5 | **Input Types** - `type="email"`, `type="tel"` düzeltmeleri | Tüm formlar | 1 saat | Orta |
| A6 | **Loading Animation** - Spinner yerine tren animasyonu | search/page.tsx | 2-3 saat | Orta |

**Toplam Tahmini Süre:** ~1 gün

---

### Kategori B: Orta Efor / Yüksek Etki

| # | Öneri | Dosya | Efor | Etki |
|---|-------|-------|------|------|
| B1 | **Date Pills** - "Yarın", "Bu Hafta Sonu" hızlı seçim | page.tsx (homepage) | 3-4 saat | Yüksek |
| B2 | **Exchangeable Badge** - Yeşil "Değiştirilebilir" etiketi | search/page.tsx | 2 saat | Orta |
| B3 | **Highlights Tabs** - "En Ucuz" / "En Hızlı" | search/page.tsx | 4-5 saat | Yüksek |
| B4 | **Payment Security Badge** - "Secured by Payten" | checkout/page.tsx | 30 dk | Orta |
| B5 | **Accordion Checkout** - Adım adım form (collapse/expand) | checkout/page.tsx | 1 gün | Yüksek |

**Toplam Tahmini Süre:** ~2-3 gün

---

### Kategori C: Araştırma Gerektiren

| # | Öneri | Bağımlılık | Araştırılacak |
|---|-------|------------|---------------|
| C1 | **Apple Pay / Google Pay** | Payten | Payten bu gateway'leri destekliyor mu? |
| C2 | **Route Popularity** | Analytics | Gerçek veri var mı yoksa statik badge mi? |
| C3 | **Abandoned Cart Email** | Resend | Email capture hangi adımda? |

---

## 🎨 TASARIM REHBERİ

### Trust Badge Önerileri
```
✓ "Official Reseller of 230+ European Rail Carriers"
✓ "Trusted by 50,000+ Travelers"
✓ "Secure Booking • Instant Confirmation"
```

### CTA Text Alternatifleri
| Mevcut | Önerilen |
|--------|----------|
| Buy Now | Secure My Seat |
| Book | Reserve Now |
| Continue | Continue to Payment |
| Pay | Complete Booking |

### Carrier Logoları (Footer)
```
Gösterilecek: SNCF, Deutsche Bahn, Trenitalia, Eurostar, ÖBB, Renfe, NS, SBB
Format: Gri tonlu, hover'da renkli
Boyut: 60-80px genişlik
```

### Loading Animation Konsepti
```
[Şehir A] ----🚂---- [Şehir B]
          "Paris → London"
    "Checking 230+ carriers..."
```

---

## 📱 MOBILE-FIRST PRENSİPLERİ

### Thumb Zone Kuralları
- Ana CTA butonları ekranın alt %25'inde
- Sticky footer her zaman görünür
- Hamburger menü yerine bottom navigation (gelecekte)

### Progressive Disclosure
- Mevcut tek sayfa form yerine adım adım yaklaşım (Kategori B5)
- Her adımda tek fokus: Nereden? → Nereye? → Ne zaman? → Kim?

### Input Optimizasyonları
```html
<!-- Email için -->
<input type="email" inputmode="email" autocomplete="email" />

<!-- Telefon için -->
<input type="tel" inputmode="tel" autocomplete="tel" />

<!-- Tarih için -->
<input type="date" /> veya custom picker
```

---

## 🧠 PSİKOLOJİ & TRUST

### Kullanılacak Prensipler
| Prensip | Uygulama |
|---------|----------|
| **Loss Aversion** | "Fiyatlar 3 gün önce artma eğiliminde" (opsiyonel, dikkatli) |
| **Social Proof** | Carrier logoları, "230+ carrier" ibaresi |
| **Cognitive Ease** | Basit formlar, tek fokus ekranlar |
| **Ownership** | "Secure MY Seat" - sahiplik hissi |

### Kullanılmayacak (Etik Dışı)
- ❌ Sahte "X kişi bakıyor" sayaçları
- ❌ Sahte stok uyarıları
- ❌ Manipülatif countdown timer'lar

---

## 📅 ÖNERİLEN UYGULAMA SIRASI

### Hafta 1: Hızlı Kazanımlar (Kategori A)
```
Gün 1: A2 (Trust Badge) + A3 (Carrier Logos) + A4 (CTA Text)
Gün 2: A1 (Sticky CTA) + A5 (Input Types)
Gün 3: A6 (Loading Animation)
```

### Hafta 2: Orta Efor (Kategori B)
```
Gün 1-2: B1 (Date Pills) + B2 (Exchangeable Badge)
Gün 3-4: B3 (Highlights Tabs) - P1'de zaten planlandı
Gün 5: B4 (Payment Badge)
```

### Hafta 3+: Büyük İyileştirmeler
```
B5 (Accordion Checkout) - 1 gün
C1 (Apple/Google Pay) - Payten araştırması sonrası
```

---

## 🔗 İLGİLİ DOKÜMANLAR

| Doküman | İlişki |
|---------|--------|
| STRATEGIC_ROADMAP.md | Ana roadmap - bu öneriler entegre edilmeli |
| PROJECT_MAP.md | Dosya yapısı referansı |
| MY_TRIPS_PHASE2_TODO.md | Wallet entegrasyonu ile örtüşme |

---

## 📝 NOTLAR

1. **Mevcut API Uyumu:** Tüm öneriler ERA API'nin mevcut yapısına uygun
2. **Tek Domain:** `eurotrain.net` - subdomain yönlendirmesi yok
3. **Brand First:** Rail Europe yerine kendi markamızı öne çıkarıyoruz
4. **Etik Urgency:** Sadece gerçek veriye dayalı bilgiler gösterilecek

---

## ✏️ DEĞİŞİKLİK GEÇMİŞİ

| Tarih | Değişiklik |
|-------|------------|
| 28 Ocak 2026 | İlk versiyon oluşturuldu |

---

**Durum:** 📋 Bu öneriler henüz netleştirilmemiştir. Uygulama öncesi Levent ile birlikte gözden geçirilmelidir.
