/**
 * My Trips API Helper Functions
 * 
 * Bu dosya iCal, Share ve Email Resend işlemleri için
 * frontend helper fonksiyonlarını içerir.
 * 
 * Kullanım:
 * import { downloadIcal, shareViaWhatsApp, resendEmail } from '@/lib/my-trips-api';
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// ============================================================
// iCal / CALENDAR
// ============================================================

/**
 * Tek bilet için iCal dosyası indir
 */
export async function downloadIcal(bookingId: number, token: string): Promise<void> {
  const url = `${API_URL}/calendar/${bookingId}/ics?token=${token}`;
  
  // Dosyayı indir
  const link = document.createElement('a');
  link.href = url;
  link.download = `eurotrain-ticket-${bookingId}.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Tüm biletler için iCal dosyası indir
 */
export async function downloadAllIcal(token: string): Promise<void> {
  const url = `${API_URL}/calendar/all?token=${token}`;
  
  const link = document.createElement('a');
  link.href = url;
  link.download = 'eurotrain-tickets.ics';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Takvim seçeneklerini getir (Google, Apple, Outlook linkleri)
 */
export async function getCalendarLinks(bookingId: number, token: string): Promise<{
  googleCalendarUrl: string;
  appleCalendarUrl: string;
  outlookUrl: string;
  downloadUrl: string;
}> {
  const res = await fetch(`${API_URL}/calendar/${bookingId}/google?token=${token}`);
  const data = await res.json();
  
  if (!data.success) {
    throw new Error('Takvim linkleri alınamadı');
  }
  
  return {
    googleCalendarUrl: data.googleCalendarUrl,
    appleCalendarUrl: data.appleCalendarUrl,
    outlookUrl: data.outlookUrl,
    downloadUrl: data.downloadUrl,
  };
}

// ============================================================
// SHARE
// ============================================================

/**
 * Paylaşım verilerini getir
 */
export async function getShareData(bookingId: number, token: string): Promise<{
  whatsapp: string;
  sms: string;
  email: string;
  text: string;
  shortText: string;
}> {
  const res = await fetch(`${API_URL}/share/${bookingId}?token=${token}`);
  const data = await res.json();
  
  if (!data.success) {
    throw new Error('Paylaşım verileri alınamadı');
  }
  
  return data.data;
}

/**
 * WhatsApp ile paylaş
 */
export async function shareViaWhatsApp(bookingId: number, token: string): Promise<void> {
  const shareData = await getShareData(bookingId, token);
  window.open(shareData.whatsapp, '_blank');
}

/**
 * SMS ile paylaş
 */
export async function shareViaSms(bookingId: number, token: string): Promise<void> {
  const shareData = await getShareData(bookingId, token);
  window.location.href = shareData.sms;
}

/**
 * Email ile paylaş
 */
export async function shareViaEmail(bookingId: number, token: string): Promise<void> {
  const shareData = await getShareData(bookingId, token);
  window.location.href = shareData.email;
}

/**
 * Metni panoya kopyala
 */
export async function copyShareText(bookingId: number, token: string): Promise<string> {
  const shareData = await getShareData(bookingId, token);
  await navigator.clipboard.writeText(shareData.text);
  return shareData.text;
}

/**
 * Native Share API ile paylaş
 */
export async function nativeShare(bookingId: number, token: string): Promise<boolean> {
  if (!navigator.share) {
    return false;
  }
  
  const shareData = await getShareData(bookingId, token);
  
  try {
    await navigator.share({
      title: 'Tren Bileti',
      text: shareData.shortText,
      url: 'https://eurotrain.net/my-trips',
    });
    return true;
  } catch (err) {
    // Kullanıcı iptal etti
    return false;
  }
}

// ============================================================
// EMAIL RESEND
// ============================================================

/**
 * Onay emailini tekrar gönder
 */
export async function resendEmail(bookingId: number, token: string): Promise<{
  success: boolean;
  message: string;
  cooldownSeconds?: number;
}> {
  const res = await fetch(`${API_URL}/my-trips/${bookingId}/resend-email?token=${token}`, {
    method: 'POST',
  });
  
  const data = await res.json();
  
  return {
    success: data.success,
    message: data.message,
    cooldownSeconds: data.cooldownSeconds,
  };
}

// ============================================================
// TYPES
// ============================================================

export interface CalendarOption {
  name: string;
  icon: string;
  action: () => void;
}

export interface ShareOption {
  name: string;
  icon: string;
  action: () => void;
}
