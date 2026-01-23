import { IsString, IsNumber, IsEmail, IsOptional, IsEnum, Min, Max } from 'class-validator';
import { PaymentCurrency } from '../entities/payment.entity';

export class InitiatePaymentDto {
  @IsString()
  orderId: string;

  @IsNumber()
  bookingId: number;

  @IsNumber()
  @Min(0.01)
  amount: number;

  @IsEnum(PaymentCurrency)
  currency: PaymentCurrency;

  @IsEmail()
  customerEmail: string;

  @IsString()
  customerName: string;

  @IsOptional()
  @IsString()
  customerIp?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(12)
  installmentCount?: number;
}

export class PaymentCallbackDto {
  @IsOptional()
  @IsString()
  responseCode?: string;

  @IsOptional()
  @IsString()
  RESPONSECODE?: string;

  @IsOptional()
  @IsString()
  responseMsg?: string;

  @IsOptional()
  @IsString()
  RESPONSEMSG?: string;

  @IsOptional()
  @IsString()
  merchantPaymentId?: string;

  @IsOptional()
  @IsString()
  MERCHANTPAYMENTID?: string;

  @IsOptional()
  @IsString()
  pgTranId?: string;

  @IsOptional()
  @IsString()
  PGTRANID?: string;

  @IsOptional()
  @IsString()
  panLast4?: string;

  @IsOptional()
  @IsString()
  PANLAST4?: string;

  @IsOptional()
  @IsString()
  cardBrand?: string;

  @IsOptional()
  @IsString()
  authCode?: string;

  @IsOptional()
  @IsString()
  rrn?: string;

  @IsOptional()
  @IsString()
  is3D?: string;

  @IsOptional()
  @IsString()
  sessionToken?: string;
}

export class RefundPaymentDto {
  @IsString()
  paymentId: string;

  @IsNumber()
  @Min(0.01)
  amount: number;

  @IsOptional()
  @IsString()
  reason?: string;
}

export class PaymentResponseDto {
  success: boolean;
  paymentId?: string;
  redirectUrl?: string;
  message: string;
  currency?: string;
  amount?: number;
}

export class RefundResponseDto {
  success: boolean;
  refundTransactionId?: string;
  message: string;
  refundedAmount?: number;
}

export class PaymentStatusDto {
  id: string;
  orderId: string;
  bookingId?: number;
  amount: number;
  currency: string;
  status: string;
  cardLastFour?: string;
  cardBrand?: string;
  is3DSecure: boolean;
  createdAt: Date;
  completedAt?: Date;
  refundedAmount?: number;
}
