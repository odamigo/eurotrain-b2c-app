'use client';

import { useEffect, useState } from 'react';
import { bookingApi, Booking } from '@/lib/api/client';
import { DataTable } from '../components';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  useEffect(() => {
    async function fetchBookings() {
      try {
        const data = await bookingApi.getAll();
        setBookings(data);
      } catch (error) {
        console.error('Rezervasyonlar yÃ¼klenirken hata:', error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchBookings();
  }, []);

  const statusMap = {
    PENDING: { label: 'Bekliyor', variant: 'secondary' as const },
    CONFIRMED: { label: 'OnaylandÄ±', variant: 'default' as const },
    CANCELLED: { label: 'Ä°ptal', variant: 'destructive' as const },
  };

  const columns = [
    {
      key: 'id',
      header: 'ID',
      render: (booking: Booking) => (
        <span className="font-mono text-sm">#{booking.id}</span>
      ),
    },
    {
      key: 'customerName',
      header: 'MÃ¼ÅŸteri',
      render: (booking: Booking) => (
        <div>
          <p className="font-medium text-slate-900">{booking.customerName}</p>
          <p className="text-sm text-slate-500">{booking.customerEmail}</p>
        </div>
      ),
    },
    {
      key: 'route',
      header: 'GÃ¼zergah',
      render: (booking: Booking) => (
        <span>
          {booking.fromStation} â†’ {booking.toStation}
        </span>
      ),
    },
    {
      key: 'departureDate',
      header: 'Seyahat Tarihi',
      render: (booking: Booking) => (
        <span className="text-sm">
          {booking.departureDate 
            ? new Date(booking.departureDate).toLocaleDateString('tr-TR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
              })
            : '-'}
          {booking.departure_time && (
            <span className="text-slate-500 ml-1">{booking.departure_time.slice(0, 5)}</span>
          )}
        </span>
      ),
    },
    {
      key: 'price',
      header: 'Tutar',
      render: (booking: Booking) => (
        <span className="font-semibold">â‚¬{Number(booking.price).toFixed(2)}</span>
      ),
    },
    {
      key: 'status',
      header: 'Durum',
      render: (booking: Booking) => {
        const status = statusMap[booking.status] || statusMap.PENDING;
        return <Badge variant={status.variant}>{status.label}</Badge>;
      },
    },
    {
      key: 'createdAt',
      header: 'OluÅŸturulma',
      render: (booking: Booking) => (
        <span className="text-sm text-slate-500">
          {new Date(booking.createdAt).toLocaleDateString('tr-TR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Rezervasyonlar</h1>
        <p className="text-slate-500">TÃ¼m bilet rezervasyonlarÄ±nÄ± gÃ¶rÃ¼ntÃ¼leyin</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-slate-200">
          <p className="text-sm text-slate-500">Toplam</p>
          <p className="text-2xl font-bold text-slate-900">{bookings.length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-slate-200">
          <p className="text-sm text-slate-500">Bekleyen</p>
          <p className="text-2xl font-bold text-yellow-600">
            {bookings.filter((b) => b.status === 'PENDING').length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-slate-200">
          <p className="text-sm text-slate-500">Onaylanan</p>
          <p className="text-2xl font-bold text-green-600">
            {bookings.filter((b) => b.status === 'CONFIRMED').length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-slate-200">
          <p className="text-sm text-slate-500">Toplam Gelir</p>
          <p className="text-2xl font-bold text-blue-600">
            â‚¬{bookings.reduce((sum, b) => sum + Number(b.price), 0).toFixed(2)}
          </p>
        </div>
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={bookings}
        isLoading={isLoading}
        onRowClick={(booking) => setSelectedBooking(booking)}
      />

      {/* Detail Dialog */}
      <Dialog open={!!selectedBooking} onOpenChange={() => setSelectedBooking(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Rezervasyon DetayÄ±</DialogTitle>
          </DialogHeader>
          {selectedBooking && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Rezervasyon ID</span>
                <span className="font-mono font-medium">#{selectedBooking.id}</span>
              </div>
              <Separator />

              <div className="space-y-3">
                <h4 className="font-semibold text-slate-900">MÃ¼ÅŸteri Bilgileri</h4>
                <div className="flex justify-between">
                  <span className="text-slate-500">Ad Soyad</span>
                  <span>{selectedBooking.customerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">E-posta</span>
                  <span>{selectedBooking.customerEmail}</span>
                </div>
              </div>
              <Separator />

              <div className="space-y-3">
                <h4 className="font-semibold text-slate-900">Seyahat Bilgileri</h4>
                <div className="flex justify-between">
                  <span className="text-slate-500">KalkÄ±ÅŸ</span>
                  <span>{selectedBooking.fromStation}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">VarÄ±ÅŸ</span>
                  <span>{selectedBooking.toStation}</span>
                </div>
                {selectedBooking.departureDate && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Tarih</span>
                    <span>{new Date(selectedBooking.departureDate).toLocaleDateString('tr-TR')}</span>
                  </div>
                )}
                {selectedBooking.departure_time && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">KalkÄ±ÅŸ Saati</span>
                    <span>{selectedBooking.departure_time.slice(0, 5)}</span>
                  </div>
                )}
                {selectedBooking.arrival_time && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">VarÄ±ÅŸ Saati</span>
                    <span>{selectedBooking.arrival_time.slice(0, 5)}</span>
                  </div>
                )}
                {selectedBooking.train_number && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Tren No</span>
                    <span>{selectedBooking.train_number}</span>
                  </div>
                )}
                {selectedBooking.operator && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">OperatÃ¶r</span>
                    <span>{selectedBooking.operator}</span>
                  </div>
                )}
              </div>
              <Separator />

              <div className="space-y-3">
                <h4 className="font-semibold text-slate-900">Ã–deme</h4>
                <div className="flex justify-between">
                  <span className="text-slate-500">Tutar</span>
                  <span className="font-semibold text-lg">â‚¬{Number(selectedBooking.price).toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Durum</span>
                  <Badge variant={statusMap[selectedBooking.status]?.variant || 'secondary'}>
                    {statusMap[selectedBooking.status]?.label || selectedBooking.status}
                  </Badge>
                </div>
              </div>
              <Separator />

              <div className="flex justify-between">
                <span className="text-slate-500">OluÅŸturulma</span>
                <span className="text-sm">
                  {new Date(selectedBooking.createdAt).toLocaleDateString('tr-TR', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
