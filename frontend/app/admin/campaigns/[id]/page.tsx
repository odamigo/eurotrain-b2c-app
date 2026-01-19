'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { campaignApi, Campaign, UpdateCampaignDto } from '@/lib/api/client';
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
import { ArrowLeft, Save, Trash2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export default function EditCampaignPage() {
  const router = useRouter();
  const params = useParams();
  const id = Number(params.id);

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<UpdateCampaignDto>({});

  useEffect(() => {
    async function fetchCampaign() {
      try {
        const campaign = await campaignApi.getById(id);
        setFormData({
          name: campaign.name,
          code: campaign.code || '',
          description: campaign.description || '',
          type: campaign.type,
          discountType: campaign.discountType,
          discountValue: campaign.discountValue,
          discountCurrency: campaign.discountCurrency,
          discountTarget: campaign.discountTarget,
          maxDiscountAmount: campaign.maxDiscountAmount || undefined,
          minOrderAmount: campaign.minOrderAmount || undefined,
          stackable: campaign.stackable,
          priority: campaign.priority,
          usageLimit: campaign.usageLimit || undefined,
          usagePerUser: campaign.usagePerUser,
          refundable: campaign.refundable,
          startDate: campaign.startDate ? campaign.startDate.slice(0, 16) : '',
          endDate: campaign.endDate ? campaign.endDate.slice(0, 16) : '',
          active: campaign.active,
        });
      } catch (err) {
        setError('Kampanya yüklenirken hata oluştu');
      } finally {
        setIsLoading(false);
      }
    }
    fetchCampaign();
  }, [id]);

  function handleChange(field: keyof UpdateCampaignDto, value: unknown) {
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
      
      await campaignApi.update(id, submitData);
      router.push('/admin/campaigns');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bir hata oluştu');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete() {
    setIsDeleting(true);
    try {
      await campaignApi.delete(id);
      router.push('/admin/campaigns');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Silme hatası');
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft size={20} />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Kampanya Düzenle</h1>
            <p className="text-slate-500">{formData.name}</p>
          </div>
        </div>
        <Button
          variant="destructive"
          onClick={() => setDeleteDialogOpen(true)}
        >
          <Trash2 size={20} className="mr-2" />
          Sil
        </Button>
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
                  value={formData.name || ''}
                  onChange={(e) => handleChange('name', e.target.value)}
                  placeholder="Örn: Yaz İndirimi"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="code">Promosyon Kodu</Label>
                <Input
                  id="code"
                  value={formData.code || ''}
                  onChange={(e) => handleChange('code', e.target.value.toUpperCase())}
                  placeholder="Örn: SUMMER2026"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Açıklama</Label>
                <Textarea
                  id="description"
                  value={formData.description || ''}
                  onChange={(e) => handleChange('description', e.target.value)}
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
                    value={formData.discountValue || ''}
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
                    value={formData.usagePerUser || ''}
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
                  value={formData.priority || ''}
                  onChange={(e) => handleChange('priority', parseInt(e.target.value))}
                />
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
                    value={formData.startDate || ''}
                    onChange={(e) => handleChange('startDate', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="endDate">Bitiş Tarihi</Label>
                  <Input
                    id="endDate"
                    type="datetime-local"
                    value={formData.endDate || ''}
                    onChange={(e) => handleChange('endDate', e.target.value)}
                  />
                </div>
              </div>

              <div className="flex items-center gap-6 pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.active || false}
                    onChange={(e) => handleChange('active', e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300"
                  />
                  <span className="text-sm">Aktif</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.stackable || false}
                    onChange={(e) => handleChange('stackable', e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300"
                  />
                  <span className="text-sm">Birleştirilebilir</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.refundable || false}
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
            {isSubmitting ? 'Kaydediliyor...' : 'Güncelle'}
          </Button>
        </div>
      </form>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Kampanyayı Sil</DialogTitle>
            <DialogDescription>
              <strong>{formData.name}</strong> kampanyasını silmek istediğinize emin misiniz? 
              Bu işlem geri alınamaz.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              İptal
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? 'Siliniyor...' : 'Sil'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}