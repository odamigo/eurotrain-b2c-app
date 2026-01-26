export class CreateBookingDto {
  customerName: string;
  customerEmail: string;
  fromStation: string;
  toStation: string;
  price: number;
  promoCode?: string;
  
  // Journey details - camelCase
  departureDate?: string;
  departureTime?: string;
  arrivalTime?: string;
  trainNumber?: string;
  operator?: string;
}
