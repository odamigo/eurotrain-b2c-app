'use client';

import { useEffect, useState } from 'react';
import { StatsCard } from './components';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { campaignApi, bookingApi, Campaign, Booking } from '@/lib/api/client';
import { Tag, CalendarCheck, TrendingUp, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function AdminDashboard() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [campaignsData, bookingsData] = await Promise.all([
          campaignApi.getAll().catch(() => []),
          bookingApi.getAll().catch(() => []),
        ]);
        setCampaigns(campaignsData);
        setBookings(bookingsData);
      } catch (error) {
        console.error('Veri yüklenirken hata:', error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, []);

  const activeCampaigns = campaigns.filter((c) => c.active).length;
  const totalRevenue = bookings.reduce((sum, b) => sum + Number(b.price), 0);
  const confirmedBookings = bookings.filter((b) => b.status === 'CONFIRMED').length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-500">Eurotrain yönetim paneline hoş geldiniz</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Toplam Rezervasyon"
          value={bookings.length}
          change="+12% bu hafta"
          changeType="positive"
          icon={CalendarCheck}
          iconColor="text-blue-600"
          iconBgColor="bg-blue-100"
        />
        <StatsCard
          title="Aktif Kampanya"
          value={activeCampaigns}
          change={`${campaigns.length} toplam`}
          changeType="neutral"
          icon={Tag}
          iconColor="text-green-600"
          iconBgColor="bg-green-100"
        />
        <StatsCard
          title="Toplam Gelir"
          value={`€${totalRevenue.toLocaleString()}`}
          change="+8% bu ay"
          changeType="positive"
          icon={TrendingUp}
          iconColor="text-purple-600"
          iconBgColor="bg-purple-100"
        />
        <StatsCard
          title="Onaylanan"
          value={confirmedBookings}
          change={`${bookings.length > 0 ? Math.round((confirmedBookings / bookings.length) * 100) : 0}% oran`}
          changeType="neutral"
          icon={Users}
          iconColor="text-orange-600"
          iconBgColor="bg-orange-100"
        />
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Bookings */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Son Rezervasyonlar</CardTitle>
          </CardHeader>
          <CardContent>
            {bookings.length === 0 ? (
              <p className="text-slate-500 text-center py-8">Henüz rezervasyon yok</p>
            ) : (
              <div className="space-y-4">
                {bookings.slice(0, 5).map((booking) => (
                  <div
                    key={booking.id}
                    className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-slate-900">{booking.customerName}</p>
                      <p className="text-sm text-slate-500">
                        {booking.fromStation} → {booking.toStation}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-slate-900">€{booking.price}</p>
                      <Badge
                        variant={
                          booking.status === 'CONFIRMED'
                            ? 'default'
                            : booking.status === 'PENDING'
                            ? 'secondary'
                            : 'destructive'
                        }
                      >
                        {booking.status === 'CONFIRMED' && 'Onaylandı'}
                        {booking.status === 'PENDING' && 'Bekliyor'}
                        {booking.status === 'CANCELLED' && 'İptal'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Active Campaigns */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Aktif Kampanyalar</CardTitle>
          </CardHeader>
          <CardContent>
            {campaigns.filter((c) => c.active).length === 0 ? (
              <p className="text-slate-500 text-center py-8">Aktif kampanya yok</p>
            ) : (
              <div className="space-y-4">
                {campaigns
                  .filter((c) => c.active)
                  .slice(0, 5)
                  .map((campaign) => (
                    <div
                      key={campaign.id}
                      className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                    >
                      <div>
                        <p className="font-medium text-slate-900">{campaign.name}</p>
                        <p className="text-sm text-slate-500">
                          Kod: {campaign.code || 'Otomatik'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-green-600">
                          {campaign.discountType === 'PERCENTAGE'
                            ? `%${campaign.discountValue}`
                            : `€${campaign.discountValue}`}
                        </p>
                        <p className="text-xs text-slate-500">
                          {campaign.currentUsageCount} kullanım
                        </p>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}