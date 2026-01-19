import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity()
export class Campaign {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true, nullable: true })
  code: string; // null ise otomatik kampanya

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column({ default: 'PROMO_CODE' })
  type: string; // PROMO_CODE | AUTO

  @Column({ default: 'PERCENTAGE' })
  discountType: string; // PERCENTAGE | FIXED | MIXED

  @Column('decimal', { precision: 10, scale: 2 })
  discountValue: number;

  @Column({ default: 'EUR' })
  discountCurrency: string; // EUR | TRY

  @Column({ default: 'TOTAL' })
  discountTarget: string; // BASE_PRICE | SERVICE_FEE | TOTAL

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  maxDiscountAmount: number;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  minOrderAmount: number;

  @Column({ default: false })
  stackable: boolean;

  @Column({ default: 1 })
  priority: number;

  @Column({ nullable: true })
  usageLimit: number; // null = unlimited

  @Column({ default: 1 })
  usagePerUser: number;

  @Column({ default: 0 })
  currentUsageCount: number;

  @Column({ default: true })
  refundable: boolean;

  @Column({ type: 'timestamp', nullable: true })
  startDate: Date;

  @Column({ type: 'timestamp', nullable: true })
  endDate: Date;

  @Column({ default: true })
  active: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}