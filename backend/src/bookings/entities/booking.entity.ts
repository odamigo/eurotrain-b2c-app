import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity()
export class Booking {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  customerName: string;

  @Column()
  customerEmail: string;

  @Column()
  fromStation: string;

  @Column()
  toStation: string;

  @Column('decimal')
  price: number;

  @Column({ default: 'PENDING' })
  status: string;

  @CreateDateColumn()
  createdAt: Date;

  // ===== MY TRIPS ICIN KOLONLAR =====
  
  // Magic Link
  @Column({ nullable: true, length: 64 })
  magic_token: string;

  @Column({ type: 'timestamp', nullable: true })
  token_expires_at: Date;

  // Bilet Bilgileri
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

  @Column({ nullable: true, length: 20, default: 'Standard' })
  ticket_class: string;

  @Column({ type: 'text', nullable: true })
  ticket_pdf_url: string;

  // ===== ERA (RAIL EUROPE) ENTEGRASYONU =====

  // ERA Referans Bilgileri
  @Column({ nullable: true, length: 50 })
  era_booking_reference: string;  // S716889052 - ERA'nin booking ref

  @Column({ nullable: true, length: 50 })
  era_pnr: string;  // 993079404558 - Tasiyici PNR

  @Column({ nullable: true, length: 100 })
  era_ticket_number: string;  // Bilet numarasi

  @Column({ nullable: true, length: 50 })
  era_carrier: string;  // DBAHN, SBB, SNCF, RDG_PTP vb.

  // ERA Finansal Bilgiler
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  era_gross_amount: number;  // Brut tutar (musteriye satis)

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  era_net_amount: number;  // Net tutar (ERA'ya odeme)

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  era_commission: number;  // Komisyon (gross - net)

  @Column({ nullable: true, length: 3, default: 'EUR' })
  era_currency: string;  // Para birimi

  // ERA Durum Bilgileri
  @Column({ nullable: true, length: 20, default: 'Sale' })
  era_transaction_type: string;  // Sale, After-Sale (iade)

  @Column({ type: 'timestamp', nullable: true })
  era_synced_at: Date;  // Son senkronizasyon zamani
}
