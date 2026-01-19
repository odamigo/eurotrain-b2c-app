export class CreateEraBookingDto {
  journeyId: string; // Selected journey ID from search
  searchId: string; // Search session ID
  
  passengers: PassengerDto[];
  
  ticketOptions: {
    class: 'FIRST' | 'SECOND';
    flexibility: 'NON_FLEXIBLE' | 'SEMI_FLEXIBLE' | 'FLEXIBLE';
    fareId: string; // Selected fare ID
  };
  
  contact: {
    email: string;
    phone?: string;
    language?: string; // 'en' | 'tr'
  };
  
  campaignCode?: string;
  
  paymentMethod: 'STRIPE' | 'PAYTEN';
  
  acceptedTerms: boolean;
}

export class PassengerDto {
  type: 'ADULT' | 'CHILD' | 'YOUTH' | 'SENIOR';
  firstName: string;
  lastName: string;
  email?: string;
  dateOfBirth?: string; // YYYY-MM-DD
  passportNumber?: string; // Required for Eurostar
  nationality?: string; // ISO country code
}

export class ConfirmBookingDto {
  bookingId: string;
  paymentIntentId?: string; // Stripe
  paytenTransactionId?: string; // Payten
}

export class CancelBookingDto {
  bookingId: string;
  reason?: string;
  refundRequested: boolean;
}

export class BookingResponseDto {
  id: string;
  pnr: string;
  status: string;
  journey: {
    origin: string;
    originName: string;
    destination: string;
    destinationName: string;
    departureTime: string;
    arrivalTime: string;
    trainNumber: string;
    trainType: string;
  };
  passengers: {
    firstName: string;
    lastName: string;
    type: string;
  }[];
  pricing: {
    basePrice: number;
    serviceFee: number;
    discountAmount: number;
    totalPrice: number;
    currency: string;
    tryEquivalent?: number;
  };
  ticketDetails: {
    class: string;
    flexibility: string;
  };
  magicLink: string; // URL for guest access
  createdAt: string;
}

export class RefundResponseDto {
  bookingId: string;
  pnr: string;
  refundable: boolean;
  refundAmount: number;
  refundFee: number;
  currency: string;
  deadline?: string;
  status: 'PENDING' | 'PROCESSED' | 'REJECTED';
  message: string;
}