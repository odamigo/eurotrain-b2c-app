# MY TRIPS PAGE.TSX - GÜNCELLİKLER

Bu dosya `frontend/app/my-trips/page.tsx` için yapılması gereken değişiklikleri içerir.

---

## 1. Import'lara ekle (satır ~1-12 civarı)

```typescript
// Mevcut importların altına ekle:
import { 
  downloadIcal, 
  getCalendarLinks, 
  shareViaWhatsApp, 
  nativeShare, 
  copyShareText,
  resendEmail 
} from '@/lib/my-trips-api';
```

---

## 2. TripCard component'ındaki action butonları bölümünü değiştir (satır ~536-597)

Eski:
```tsx
{/* Actions */}
<div className="p-4 flex flex-wrap gap-2 border-t border-slate-100 bg-white">
  {/* PDF Download */}
  <button 
    onClick={(e) => { e.stopPropagation(); onDownloadPdf(trip.id); }}
    ...
```

Yeni:
```tsx
{/* Actions */}
<div className="p-4 border-t border-slate-100 bg-white">
  {/* Primary Actions */}
  <div className="flex flex-wrap gap-2 mb-3">
    {/* PDF Download */}
    <button 
      onClick={(e) => { e.stopPropagation(); onDownloadPdf(trip.id); }}
      className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
    >
      <Download className="w-4 h-4" />
      PDF İndir
    </button>

    {/* iCal Download - YENİ */}
    <button 
      onClick={(e) => { 
        e.stopPropagation(); 
        if (token) downloadIcal(trip.id, token);
      }}
      className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors"
    >
      <CalendarPlus className="w-4 h-4" />
      Takvime Ekle
    </button>

    {/* Email Resend - YENİ */}
    <button 
      onClick={async (e) => { 
        e.stopPropagation();
        if (!token) return;
        const result = await resendEmail(trip.id, token);
        if (result.success) {
          alert('Email gönderildi!');
        } else {
          alert(result.message);
        }
      }}
      className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
    >
      <Send className="w-4 h-4" />
      Email Gönder
    </button>
  </div>

  {/* Secondary Actions */}
  <div className="flex flex-wrap gap-2">
    {/* WhatsApp Share - YENİ */}
    <button 
      onClick={(e) => { 
        e.stopPropagation(); 
        if (token) shareViaWhatsApp(trip.id, token);
      }}
      className="flex items-center gap-2 px-3 py-2 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600 transition-colors"
    >
      <MessageCircle className="w-4 h-4" />
      WhatsApp
    </button>

    {/* Copy Share Text - YENİ */}
    <button 
      onClick={async (e) => { 
        e.stopPropagation();
        if (!token) return;
        await copyShareText(trip.id, token);
        alert('Bilet bilgileri kopyalandı!');
      }}
      className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
    >
      <Copy className="w-4 h-4" />
      Kopyala
    </button>

    {/* Native Share (Mobile) */}
    <button 
      onClick={async (e) => { 
        e.stopPropagation();
        if (!token) return;
        const shared = await nativeShare(trip.id, token);
        if (!shared) {
          // Native share desteklenmiyorsa clipboard'a kopyala
          await copyShareText(trip.id, token);
          alert('Bilet bilgileri kopyalandı!');
        }
      }}
      className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors sm:hidden"
    >
      <Share2 className="w-4 h-4" />
      Paylaş
    </button>

    {/* Apple Wallet - Devre Dışı (Sertifika gerekli) */}
    <button 
      className="flex items-center gap-2 px-3 py-2 bg-slate-100 text-slate-400 rounded-lg text-sm font-medium cursor-not-allowed"
      title="Yakında aktif olacak"
      disabled
    >
      <Wallet className="w-4 h-4" />
      Wallet
    </button>
  </div>

  {/* Management Actions (Upcoming only) */}
  {tripIsUpcoming && trip.status !== 'cancelled' && (
    <div className="flex gap-2 mt-3 pt-3 border-t border-slate-100">
      {/* Change - Phase 2 */}
      <button 
        className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-400 cursor-not-allowed"
        disabled
        title="Yakında aktif olacak"
      >
        <RefreshCw className="w-4 h-4" />
        Değiştir
      </button>

      {/* Cancel */}
      <button 
        className="flex items-center gap-2 px-4 py-2.5 bg-red-50 border border-red-200 rounded-lg text-sm font-medium text-red-600 hover:bg-red-100 transition-colors"
      >
        <XCircle className="w-4 h-4" />
        İptal Et
      </button>
    </div>
  )}
</div>
```

---

## 3. TripCard props'una ekle (satır ~312)

```typescript
function TripCard({ 
  trip, 
  token,
  onDownloadPdf,
  onShowToast,  // YENİ - Toast göstermek için
}: { 
  trip: Trip; 
  token?: string;
  onDownloadPdf: (tripId: number) => void;
  onShowToast?: (message: string, type: 'success' | 'error') => void;  // YENİ
}) {
```

---

## 4. Toast Component ekle (component'lar bölümüne)

```tsx
// Toast Notification Component
function Toast({ 
  message, 
  type = 'success',
  onClose 
}: { 
  message: string; 
  type?: 'success' | 'error' | 'info';
  onClose: () => void;
}) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const bgColor = type === 'success' ? 'bg-emerald-500' : 
                  type === 'error' ? 'bg-red-500' : 'bg-blue-500';

  return (
    <div className={`fixed bottom-4 right-4 ${bgColor} text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 z-50 animate-slide-up`}>
      {type === 'success' && <CheckCircle className="w-5 h-5" />}
      {type === 'error' && <AlertCircle className="w-5 h-5" />}
      <span>{message}</span>
      <button onClick={onClose} className="ml-2 hover:opacity-80">
        <XCircle className="w-4 h-4" />
      </button>
    </div>
  );
}
```

---

## 5. Main component'a toast state ekle (MyTripsContent içinde)

```typescript
// Toast state
const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

const showToast = (message: string, type: 'success' | 'error' = 'success') => {
  setToast({ message, type });
};
```

---

## 6. Return içinde Toast render et

```tsx
// Trips List'in altına ekle (return içinde, </div> kapanışından önce)
{toast && (
  <Toast 
    message={toast.message} 
    type={toast.type} 
    onClose={() => setToast(null)} 
  />
)}
```

---

## 7. TripCard çağrısını güncelle

```tsx
<TripCard 
  key={trip.id} 
  trip={trip} 
  token={token || undefined}
  onDownloadPdf={handleDownloadPdf}
  onShowToast={showToast}  // YENİ
/>
```

---

## ÖZET

Yapılan değişiklikler:
1. ✅ iCal indirme butonu eklendi
2. ✅ Email resend butonu eklendi  
3. ✅ WhatsApp paylaşım butonu eklendi
4. ✅ Kopyala butonu eklendi
5. ✅ Native Share (mobil) butonu eklendi
6. ✅ Toast notification sistemi eklendi
7. ✅ Wallet butonu devre dışı bırakıldı (sertifika gerekli)

Test için:
1. Backend'de `CalendarModule` ve `ShareModule` aktif olmalı
2. Token ile my-trips sayfasına erişilmeli
3. Her buton tıklandığında ilgili işlem yapılmalı
