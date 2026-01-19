export interface CreateBookingParams {
  customerName: string;
  customerEmail: string;
  fromStation: string;
  toStation: string;
  price: number;
  promoCode?: string;
  journeyId?: string;
  departure_date?: string;
  departure_time?: string;
  arrival_time?: string;
  train_number?: string;
  operator?: string;
  passengers?: {
    adults: number;
    children?: number;
  };
}