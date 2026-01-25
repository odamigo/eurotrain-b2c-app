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
        console.error('Rezervasyonlar yüklenirken hata:', error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchBookings();
  }, []);

  const statusMap: Record<string, { label: string; variant: 'secondary' | 'default' | 'destructive' }> = {
    PENDING: { label: 'Bekliyor', variant: 'secondary' },
    CONFIRMED: { label: 'Onaylandı', variant: 'default' },
    CANCELLED: { label: 'İptal', variant: 'destructive' },
    PAID: { label: 'Ödendi', variant: 'default' },
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
      header: 'Müşteri',
      render: (booking: Booking) => (
        <div>
          <p className="font-medium text-slate-900">{booking.customerName}</p>
          <p className="text-sm text-slate-500">{booking.customerEmail}</p>
        </div>
      ),
    },
    {
      key: 'route',
      header: 'Güzergah',
      render: (booking: Booking) => (
        <span>
          {booking.fromStation} → {booking.toStation}
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
          {booking.departureTime && (
            <span className="text-slate-500 ml-1">{booking.departureTime.slice(0, 5)}</span>
          )}
        </span>
      ),
    },
    {
      key: 'price',
      header: 'Tutar',
      render: (booking: Booking) => (
        <span className="font-semibold">€{Number(booking.price).toFixed(2)}</span>
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
      header: 'Oluşturulma',
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
        <p className="text-slate-500">Tüm bilet rezervasyonlarını görüntüleyin</p>
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
            €{bookings.reduce((sum, b) => sum + Number(b.price), 0).toFixed(2)}
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
            <DialogTitle>Rezervasyon Detayı</DialogTitle>
          </DialogHeader>
          {selectedBooking && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Rezervasyon ID</span>
                <span className="font-mono font-medium">#{selectedBooking.id}</span>
              </div>
              <Separator />

              <div className="space-y-3">
                <h4 className="font-semibold text-slate-900">Müşteri Bilgileri</h4>
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
                  <span className="text-slate-500">Kalkış</span>
                  <span>{selectedBooking.fromStation}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Varış</span>
                  <span>{selectedBooking.toStation}</span>
                </div>
                {selectedBooking.departureDate && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Tarih</span>
                    <span>{new Date(selectedBooking.departureDate).toLocaleDateString('tr-TR')}</span>
                  </div>
                )}
                {selectedBooking.departureTime && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Kalkış Saati</span>
                    <span>{selectedBooking.departureTime.slice(0, 5)}</span>
                  </div>
                )}
                {selectedBooking.arrivalTime && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Varış Saati</span>
                    <span>{selectedBooking.arrivalTime.slice(0, 5)}</span>
                  </div>
                )}
                {selectedBooking.trainNumber && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Tren No</span>
                    <span>{selectedBooking.trainNumber}</span>
                  </div>
                )}
                {selectedBooking.operator && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Operatör</span>
                    <span>{selectedBooking.operator}</span>
                  </div>
                )}
              </div>
              <Separator />

              <div className="space-y-3">
                <h4 className="font-semibold text-slate-900">Ödeme</h4>
                <div className="flex justify-between">
                  <span className="text-slate-500">Tutar</span>
                  <span className="font-semibold text-lg">€{Number(selectedBooking.price).toFixed(2)}</span>
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
                <span className="text-slate-500">Oluşturulma</span>
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
