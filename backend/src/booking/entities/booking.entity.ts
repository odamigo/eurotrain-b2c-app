import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum BookingStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  TICKETED = 'ticketed',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
  PARTIALLY_REFUNDED = 'partially_refunded',
  EXCHANGED = 'exchanged',
  EXPIRED = 'expired',
}

@Entity('bookings')
@Index(['bookingReference'], { unique: true })
@Index(['pnr'])
@Index(['customerEmail'])
@Index(['status'])
@Index(['departureDate'])
export class Booking {
  @PrimaryGeneratedColumn()
  id: number;

  // ============================================================
  // BOOKING IDENTIFIERS
  // ============================================================

  @Column({ unique: true })
  bookingReference: string;  // ET-XXXXXX (our reference)

  @Column({ nullable: true })
  pnr: string;  // Carrier PNR

  @Column({ nullable: true })
  eraBookingId: string;  // ERA API booking ID

  @Column({ nullable: true })
  eraPnr: string;  // ERA PNR

  // ============================================================
  // CUSTOMER INFO
  // ============================================================

  @Column()
  customerName: string;

  @Column()
  customerEmail: string;

  @Column({ nullable: true })
  customerPhone: string;

  // ============================================================
  // JOURNEY DETAILS
  // ============================================================

  @Column()
  fromStation: string;

  @Column()
  toStation: string;

  @Column({ nullable: true })
  fromStationCode: string;

  @Column({ nullable: true })
  toStationCode: string;

  @Column()
  departureDate: string;  // ISO datetime

  @Column()
  departureTime: string;  // HH:MM

  @Column()
  arrivalTime: string;  // HH:MM

  @Column()
  trainNumber: string;

  @Column()
  operator: string;

  @Column({ nullable: true })
  operatorCode: string;

  @Column()
  ticketClass: string;  // standard, comfort, premier

  // ============================================================
  // PASSENGERS
  // ============================================================

  @Column({ default: 1 })
  adults: number;

  @Column({ default: 0 })
  children: number;

  @Column('simple-json', { nullable: true })
  travelersData: Array<{
    title: string;
    first_name: string;
    last_name: string;
    email?: string;
    phone?: string;
    date_of_birth?: string;
    type: string;
    passport_number?: string;
    passport_expiry?: string;
    passport_country?: string;
  }>;

  // ============================================================
  // PRICING
  // ============================================================

  @Column('decimal', { precision: 10, scale: 2 })
  ticketPrice: number;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  serviceFee: number;

  @Column('decimal', { precision: 10, scale: 2 })
  totalPrice: number;

  @Column({ default: 'EUR' })
  currency: string;

  @Column({ nullable: true })
  promoCode: string;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  promoDiscount: number;

  // ============================================================
  // PAYMENT
  // ============================================================

  @Column({ nullable: true })
  paymentId: string;  // Reference to Payment entity

  @Column({ nullable: true })
  paymentMethod: string;  // credit_card, debit_card

  @Column({ nullable: true })
  paymentTransactionId: string;

  // ============================================================
  // REFUND
  // ============================================================

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  refundedAmount: number;

  @Column({ nullable: true })
  refundReason: string;

  @Column({ nullable: true })
  refundedAt: Date;

  @Column({ nullable: true })
  refundedBy: string;

  // ============================================================
  // TICKET
  // ============================================================

  @Column({ nullable: true })
  ticketPdfUrl: string;

  @Column({ nullable: true })
  ticketPkpassUrl: string;

  @Column('simple-json', { nullable: true })
  ticketData: {
    issued_at?: string;
    valid_from?: string;
    valid_until?: string;
    seat_numbers?: string[];
    coach_numbers?: string[];
    qr_code?: string;
  };

  // ============================================================
  // STATUS
  // ============================================================

  @Column({
    type: 'enum',
    enum: BookingStatus,
    default: BookingStatus.PENDING,
  })
  status: BookingStatus;

  @Column({ nullable: true })
  statusReason: string;

  @Column({ nullable: true })
  lastStatusChange: Date;

  // ============================================================
  // METADATA
  // ============================================================

  @Column({ nullable: true })
  locale: string;

  @Column({ nullable: true })
  userAgent: string;

  @Column({ nullable: true })
  ipAddress: string;

  @Column({ nullable: true })
  sessionToken: string;  // MCP session token used

  @Column({ nullable: true })
  traceId: string;  // For debugging

  @Column('simple-json', { nullable: true })
  metadata: Record<string, any>;

  // ============================================================
  // TIMESTAMPS
  // ============================================================

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ nullable: true })
  confirmedAt: Date;

  @Column({ nullable: true })
  cancelledAt: Date;
}
