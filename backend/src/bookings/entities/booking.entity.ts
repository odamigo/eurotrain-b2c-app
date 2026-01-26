import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

export enum BookingStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  TICKETED = 'TICKETED',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED',
  PARTIALLY_REFUNDED = 'PARTIALLY_REFUNDED',
  EXPIRED = 'EXPIRED',
}

@Entity()
@Index(['pnr'])
@Index(['customerEmail'])
@Index(['status'])
@Index(['bookingReference'], { unique: true, where: '"bookingReference" IS NOT NULL' })
export class Booking {
  @PrimaryGeneratedColumn()
  id: number;

  // ===== TEMEL MUSTERI BILGILERI =====
  @Column()
  customerName: string;

  @Column()
  customerEmail: string;

  @Column({ nullable: true })
  customerPhone: string;

  // ===== GUZERGAH BILGILERI =====
  @Column()
  fromStation: string;

  @Column()
  toStation: string;

  @Column({ nullable: true })
  fromStationCode: string;

  @Column({ nullable: true })
  toStationCode: string;

  // ===== FIYAT BILGILERI =====
  @Column('decimal', { precision: 10, scale: 2 })
  price: number;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  serviceFee: number;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  totalPrice: number;

  @Column({ nullable: true, length: 3, default: 'EUR' })
  currency: string;

  @Column({ nullable: true })
  promoCode: string;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  promoDiscount: number;

  // ===== DURUM =====
  @Column({ default: 'PENDING' })
  status: string;

  @Column({ nullable: true })
  statusReason: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ nullable: true })
  confirmedAt: Date;

  @Column({ nullable: true })
  cancelledAt: Date;

  // ===== EUROTRAIN REFERANS =====
  @Column({ nullable: true, unique: true })
  bookingReference: string;  // ET-XXXXXX (bizim referansımız)

  // ===== MY TRIPS ICIN KOLONLAR =====
  @Column({ nullable: true, length: 64 })
  magic_token: string;

  @Column({ type: 'timestamp', nullable: true })
  token_expires_at: Date;

  // ===== BILET BILGILERI =====
  @Column({ nullable: true, length: 20 })
  pnr: string;

  @Column({ nullable: true, length: 20 })
  train_number: string;

  @Column({ nullable: true, length: 10 })
  coach: string;

  @Column({ nullable: true, length: 10 })
  seat: string;

  @Column({ type: 'time', nullable: true })
  departure_time: string;

  @Column({ type: 'time', nullable: true })
  arrival_time: string;

  @Column({ type: 'date', nullable: true })
  departure_date: Date;

  @Column({ nullable: true, length: 50 })
  operator: string;

  @Column({ nullable: true, length: 50 })
  operatorCode: string;

  @Column({ nullable: true, length: 20, default: 'Standard' })
  ticket_class: string;

  @Column({ type: 'text', nullable: true })
  ticket_pdf_url: string;

  @Column({ type: 'text', nullable: true })
  ticket_pkpass_url: string;

  // ===== YOLCU BILGILERI =====
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

  // ===== ODEME BILGILERI =====
  @Column({ nullable: true })
  paymentId: string;

  @Column({ nullable: true })
  paymentMethod: string;

  @Column({ nullable: true })
  paymentTransactionId: string;

  // ===== IADE BILGILERI =====
  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  refundedAmount: number;

  @Column({ nullable: true })
  refundReason: string;

  @Column({ nullable: true })
  refundedAt: Date;

  @Column({ nullable: true })
  refundedBy: string;

  // ===== ERA (RAIL EUROPE) ENTEGRASYONU =====
  @Column({ nullable: true, length: 50 })
  era_booking_reference: string;

  @Column({ nullable: true, length: 50 })
  era_pnr: string;

  @Column({ nullable: true, length: 100 })
  era_ticket_number: string;

  @Column({ nullable: true, length: 50 })
  era_carrier: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  era_gross_amount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  era_net_amount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  era_commission: number;

  @Column({ nullable: true, length: 3, default: 'EUR' })
  era_currency: string;

  @Column({ nullable: true, length: 20, default: 'Sale' })
  era_transaction_type: string;

  @Column({ type: 'timestamp', nullable: true })
  era_synced_at: Date;

  // ===== MCP SESSION BILGILERI =====
  @Column({ nullable: true })
  sessionToken: string;

  @Column({ nullable: true })
  traceId: string;

  // ===== METADATA =====
  @Column({ nullable: true })
  locale: string;

  @Column({ nullable: true })
  userAgent: string;

  @Column({ nullable: true })
  ipAddress: string;

  @Column('simple-json', { nullable: true })
  metadata: Record<string, any>;
}
