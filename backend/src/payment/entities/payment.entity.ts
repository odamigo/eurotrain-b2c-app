import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

export enum PaymentStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REFUNDED = 'refunded',
  PARTIALLY_REFUNDED = 'partially_refunded',
  CANCELLED = 'cancelled',
}

export enum PaymentCurrency {
  EUR = 'EUR',
  USD = 'USD',
  TRY = 'TRY',
}

export enum PaymentMethod {
  CREDIT_CARD = 'credit_card',
  DEBIT_CARD = 'debit_card',
}

@Entity('payments')
@Index(['orderId'])
@Index(['status'])
@Index(['customerEmail'])
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  orderId: string;

  @Column({ nullable: true })
  bookingId?: number;

  @Column('decimal', { precision: 10, scale: 2 })
  amount: number;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  refundedAmount: number;

  @Column({ type: 'enum', enum: PaymentCurrency, default: PaymentCurrency.EUR })
  currency: PaymentCurrency;

  @Column({ type: 'enum', enum: PaymentStatus, default: PaymentStatus.PENDING })
  status: PaymentStatus;

  @Column({ type: 'enum', enum: PaymentMethod, nullable: true })
  paymentMethod?: PaymentMethod;

  @Column({ nullable: true })
  transactionId?: string;

  @Column({ nullable: true })
  sessionToken?: string;

  @Column({ nullable: true })
  pgTranId?: string;

  @Column({ nullable: true })
  pgOrderId?: string;

  @Column({ nullable: true })
  authCode?: string;

  @Column({ nullable: true })
  rrn?: string;

  @Column({ nullable: true })
  errorCode?: string;

  @Column({ nullable: true })
  errorMessage?: string;

  @Column({ nullable: true })
  cardLastFour?: string;

  @Column({ nullable: true })
  cardBrand?: string;

  @Column({ nullable: true })
  cardBank?: string;

  @Column({ nullable: true })
  customerEmail?: string;

  @Column({ nullable: true })
  customerName?: string;

  @Column({ nullable: true })
  customerIp?: string;

  @Column({ default: false })
  is3DSecure: boolean;

  @Column({ nullable: true })
  threeDSecureResult?: string;

  @Column({ nullable: true })
  installmentCount?: number;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  installmentAmount?: number;

  @Column({ nullable: true })
  refundTransactionId?: string;

  @Column({ nullable: true })
  refundReason?: string;

  @Column({ nullable: true })
  refundedBy?: string;

  @Column({ nullable: true })
  refundedAt?: Date;

  @Column('simple-json', { nullable: true })
  rawRequest?: any;

  @Column('simple-json', { nullable: true })
  rawResponse?: any;

  @Column('simple-json', { nullable: true })
  callbackData?: any;

  @Column({ default: 0 })
  retryCount: number;

  @Column({ nullable: true })
  lastRetryAt?: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ nullable: true })
  completedAt?: Date;
}