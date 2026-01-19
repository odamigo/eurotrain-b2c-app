'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { campaignApi, Campaign } from '@/lib/api/client';
import { DataTable } from '../components';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export default function CampaignsPage() {
  const router = useRouter();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; campaign: Campaign | null }>({
    open: false,
    campaign: null,
  });
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchCampaigns();
  }, []);

  async function fetchCampaigns() {
    try {
      const data = await campaignApi.getAll();
      setCampaigns(data);
    } catch (error) {
      console.error('Kampanyalar yüklenirken hata:', error);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleDelete() {
    if (!deleteDialog.campaign) return;
    
    setIsDeleting(true);
    try {
      await campaignApi.delete(deleteDialog.campaign.id);
      setCampaigns(campaigns.filter((c) => c.id !== deleteDialog.campaign!.id));
      setDeleteDialog({ open: false, campaign: null });
    } catch (error) {
      console.error('Silme hatası:', error);
    } finally {
      setIsDeleting(false);
    }
  }

  const columns = [
    {
      key: 'name',
      header: 'Kampanya Adı',
      render: (campaign: Campaign) => (
        <div>
          <p className="font-medium text-slate-900">{campaign.name}</p>
          {campaign.description && (
            <p className="text-sm text-slate-500 truncate max-w-xs">{campaign.description}</p>
          )}
        </div>
      ),
    },
    {
      key: 'code',
      header: 'Kod',
      render: (campaign: Campaign) => (
        <code className="px-2 py-1 bg-slate-100 rounded text-sm">
          {campaign.code || 'OTOMATİK'}
        </code>
      ),
    },
    {
      key: 'discount',
      header: 'İndirim',
      render: (campaign: Campaign) => (
        <span className="font-semibold text-green-600">
          {campaign.discountType === 'PERCENTAGE'
            ? `%${campaign.discountValue}`
            : `€${campaign.discountValue}`}
        </span>
      ),
    },
    {
      key: 'usage',
      header: 'Kullanım',
      render: (campaign: Campaign) => (
        <span>
          {campaign.currentUsageCount}
          {campaign.usageLimit ? ` / ${campaign.usageLimit}` : ' / ∞'}
        </span>
      ),
    },
    {
      key: 'active',
      header: 'Durum',
      render: (campaign: Campaign) => (
        <Badge variant={campaign.active ? 'default' : 'secondary'}>
          {campaign.active ? 'Aktif' : 'Pasif'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: 'İşlemler',
      render: (campaign: Campaign) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/admin/campaigns/${campaign.id}`);
            }}
          >
            <Pencil size={16} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
            onClick={(e) => {
              e.stopPropagation();
              setDeleteDialog({ open: true, campaign });
            }}
          >
            <Trash2 size={16} />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Kampanyalar</h1>
          <p className="text-slate-500">Promosyon kodları ve otomatik indirimleri yönetin</p>
        </div>
        <Button onClick={() => router.push('/admin/campaigns/new')}>
          <Plus size={20} className="mr-2" />
          Yeni Kampanya
        </Button>
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={campaigns}
        isLoading={isLoading}
        onRowClick={(campaign) => router.push(`/admin/campaigns/${campaign.id}`)}
      />

      {/* Delete Dialog */}
      <Dialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ open, campaign: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Kampanyayı Sil</DialogTitle>
            <DialogDescription>
              <strong>{deleteDialog.campaign?.name}</strong> kampanyasını silmek istediğinize emin misiniz? 
              Bu işlem geri alınamaz.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialog({ open: false, campaign: null })}
            >
              İptal
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? 'Siliniyor...' : 'Sil'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}