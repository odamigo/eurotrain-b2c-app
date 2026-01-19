export class CreateBookingDto {
  customerName: string;
  customerEmail: string;
  fromStation: string;
  toStation: string;
  price: number;
  promoCode?: string;
  
  // YENİ ALANLAR
  departure_date?: string;
  departure_time?: string;
  arrival_time?: string;
  train_number?: string;
  operator?: string;
}