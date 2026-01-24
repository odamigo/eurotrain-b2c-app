import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('era_bookings')
export class EraBooking {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  pnr: string; // Passenger Name Record - ERA booking reference

  @Column({ nullable: true })
  eraBookingId: string; // ERA API'den dönen booking ID

  @Column('json')
  journey: {
    origin: string;
    originName: string;
    destination: string;
    destinationName: string;
    departureTime: string;
    arrivalTime: string;
    trainNumber: string;
    trainType: string;
    operator: string;
  };

  @Column('json')
  passengers: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    dateOfBirth?: string;
    passportNumber?: string;
    type: 'ADULT' | 'CHILD' | 'YOUTH' | 'SENIOR';
  }[];

  @Column('json')
  ticketDetails: {
    class: 'FIRST' | 'SECOND';
    flexibility: string;
    fareType: string;
  };

  @Column('decimal', { precision: 10, scale: 2 })
  basePrice: number;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  serviceFee: number;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  discountAmount: number;

  @Column({ nullable: true })
  campaignCode: string;

  @Column('decimal', { precision: 10, scale: 2 })
  totalPrice: number;

  @Column({ default: 'EUR' })
  currency: string;

  @Column({ nullable: true })
  tryAmount: number; // TRY equivalent at booking time

  @Column('decimal', { precision: 10, scale: 6, nullable: true })
  exchangeRate: number; // EUR/TRY rate at booking time

  @Column({ 
    type: 'enum', 
    enum: ['PENDING', 'CONFIRMED', 'TICKETED', 'CANCELLED', 'REFUNDED', 'FAILED'],
    default: 'PENDING' 
  })
  status: 'PENDING' | 'CONFIRMED' | 'TICKETED' | 'CANCELLED' | 'REFUNDED' | 'FAILED';

  @Column({ nullable: true })
  paymentIntentId: string; // Stripe payment intent

  @Column({ nullable: true })
  paytenTransactionId: string; // Payten transaction

  @Column({ 
    type: 'enum', 
    enum: ['STRIPE', 'PAYTEN', 'NONE'],
    default: 'NONE' 
  })
  paymentProvider: 'STRIPE' | 'PAYTEN' | 'NONE';

  @Column({ nullable: true })
  ticketUrl: string; // PDF ticket URL

  @Column({ nullable: true })
  ticketPdf: string; // Base64 encoded PDF or file path

  @Column({ unique: true })
  magicLinkToken: string; // For guest access to booking

  @Column({ type: 'timestamp', nullable: true })
  magicLinkExpiry: Date;

  @Column({ nullable: true })
  customerEmail: string;

  @Column({ nullable: true })
  customerPhone: string;

  @Column({ default: 'en' })
  language: string;

  @Column('json', { nullable: true })
  refundInfo: {
    refundable: boolean;
    refundDeadline?: string;
    refundFee?: number;
    refundedAmount?: number;
    refundedAt?: string;
    refundReason?: string;
  };

  @Column('json', { nullable: true })
  cancellationInfo: {
    cancelledAt?: string;
    cancelledBy?: string;
    reason?: string;
    eraCancellationId?: string;
  };

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}