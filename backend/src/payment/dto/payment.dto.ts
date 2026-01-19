import { IsString, IsNumber, IsEmail, IsNotEmpty } from 'class-validator';

export class InitiatePaymentDto {
  @IsString()
  @IsNotEmpty()
  orderId: string;

  @IsNumber()
  amount: number;

  @IsEmail()
  customerEmail: string;

  @IsString()
  @IsNotEmpty()
  customerName: string;
}

export class PaymentResponseDto {
  success: boolean;
  paymentId?: string;
  redirectUrl?: string;
  message: string;
}