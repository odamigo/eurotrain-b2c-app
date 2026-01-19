'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { campaignApi, CreateCampaignDto } from '@/lib/api/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, Save } from 'lucide-react';

export default function NewCampaignPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<CreateCampaignDto>({
    name: '',
    code: '',
    description: '',
    type: 'PROMO_CODE',
    discountType: 'PERCENTAGE',
    discountValue: 10,
    discountCurrency: 'EUR',
    discountTarget: 'TOTAL',
    maxDiscountAmount: undefined,
    minOrderAmount: undefined,
    stackable: false,
    priority: 1,
    usageLimit: undefined,
    usagePerUser: 1,
    refundable: true,
    startDate: '',
    endDate: '',
    active: true,
  });

  function handleChange(field: keyof CreateCampaignDto, value: unknown) {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const submitData = {
        ...formData,
        code: formData.code || undefined,
        startDate: formData.startDate || undefined,
        endDate: formData.endDate || undefined,
        maxDiscountAmount: formData.maxDiscountAmount || undefined,
        minOrderAmount: formData.minOrderAmount || undefined,
        usageLimit: formData.usageLimit || undefined,
      };
      
      await campaignApi.create(submitData);
      router.push('/admin/campaigns');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bir hata oluştu');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft size={20} />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Yeni Kampanya</h1>
          <p className="text-slate-500">Yeni bir promosyon veya indirim oluşturun</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Temel Bilgiler */}
          <Card>
            <CardHeader>
              <CardTitle>Temel Bilgiler</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Kampanya Adı *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  placeholder="Örn: Yaz İndirimi"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="code">Promosyon Kodu</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => handleChange('code', e.target.value.toUpperCase())}
                  placeholder="Örn: SUMMER2026"
                />
                <p className="text-xs text-slate-500">Boş bırakılırsa otomatik kampanya olur</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Açıklama</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  placeholder="Kampanya hakkında kısa açıklama..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Kampanya Tipi</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => handleChange('type', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PROMO_CODE">Promosyon Kodu</SelectItem>
                    <SelectItem value="AUTO">Otomatik İndirim</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* İndirim Ayarları */}
          <Card>
            <CardHeader>
              <CardTitle>İndirim Ayarları</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="discountType">İndirim Tipi</Label>
                  <Select
                    value={formData.discountType}
                    onValueChange={(value) => handleChange('discountType', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PERCENTAGE">Yüzde (%)</SelectItem>
                      <SelectItem value="FIXED">Sabit Tutar</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="discountValue">İndirim Değeri *</Label>
                  <Input
                    id="discountValue"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.discountValue}
                    onChange={(e) => handleChange('discountValue', parseFloat(e.target.value))}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="discountCurrency">Para Birimi</Label>
                  <Select
                    value={formData.discountCurrency}
                    onValueChange={(value) => handleChange('discountCurrency', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="EUR">EUR (€)</SelectItem>
                      <SelectItem value="TRY">TRY (₺)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="discountTarget">Uygulama Alanı</Label>
                  <Select
                    value={formData.discountTarget}
                    onValueChange={(value) => handleChange('discountTarget', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TOTAL">Toplam Tutar</SelectItem>
                      <SelectItem value="BASE_PRICE">Bilet Fiyatı</SelectItem>
                      <SelectItem value="SERVICE_FEE">Hizmet Bedeli</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="maxDiscountAmount">Max İndirim Tutarı</Label>
                  <Input
                    id="maxDiscountAmount"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.maxDiscountAmount || ''}
                    onChange={(e) => handleChange('maxDiscountAmount', e.target.value ? parseFloat(e.target.value) : undefined)}
                    placeholder="Sınırsız"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="minOrderAmount">Min Sipariş Tutarı</Label>
                  <Input
                    id="minOrderAmount"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.minOrderAmount || ''}
                    onChange={(e) => handleChange('minOrderAmount', e.target.value ? parseFloat(e.target.value) : undefined)}
                    placeholder="Sınırsız"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Kullanım Limitleri */}
          <Card>
            <CardHeader>
              <CardTitle>Kullanım Limitleri</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="usageLimit">Toplam Kullanım Limiti</Label>
                  <Input
                    id="usageLimit"
                    type="number"
                    min="0"
                    value={formData.usageLimit || ''}
                    onChange={(e) => handleChange('usageLimit', e.target.value ? parseInt(e.target.value) : undefined)}
                    placeholder="Sınırsız"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="usagePerUser">Kullanıcı Başına Limit</Label>
                  <Input
                    id="usagePerUser"
                    type="number"
                    min="1"
                    value={formData.usagePerUser}
                    onChange={(e) => handleChange('usagePerUser', parseInt(e.target.value))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority">Öncelik Sırası</Label>
                <Input
                  id="priority"
                  type="number"
                  min="1"
                  value={formData.priority}
                  onChange={(e) => handleChange('priority', parseInt(e.target.value))}
                />
                <p className="text-xs text-slate-500">Düşük sayı = yüksek öncelik</p>
              </div>
            </CardContent>
          </Card>

          {/* Tarih ve Durum */}
          <Card>
            <CardHeader>
              <CardTitle>Tarih ve Durum</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Başlangıç Tarihi</Label>
                  <Input
                    id="startDate"
                    type="datetime-local"
                    value={formData.startDate}
                    onChange={(e) => handleChange('startDate', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="endDate">Bitiş Tarihi</Label>
                  <Input
                    id="endDate"
                    type="datetime-local"
                    value={formData.endDate}
                    onChange={(e) => handleChange('endDate', e.target.value)}
                  />
                </div>
              </div>

              <div className="flex items-center gap-6 pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.active}
                    onChange={(e) => handleChange('active', e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300"
                  />
                  <span className="text-sm">Aktif</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.stackable}
                    onChange={(e) => handleChange('stackable', e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300"
                  />
                  <span className="text-sm">Birleştirilebilir</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.refundable}
                    onChange={(e) => handleChange('refundable', e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300"
                  />
                  <span className="text-sm">İade Edilebilir</span>
                </label>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Submit Buttons */}
        <div className="flex items-center justify-end gap-4">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            İptal
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            <Save size={20} className="mr-2" />
            {isSubmitting ? 'Kaydediliyor...' : 'Kaydet'}
          </Button>
        </div>
      </form>
    </div>
  );
}