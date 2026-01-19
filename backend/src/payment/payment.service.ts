import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment, PaymentStatus } from './entities/payment.entity';
import { MsuService } from './msu.service';

interface InitiatePaymentDto {
  orderId: string;
  amount: number;
  customerEmail: string;
  customerName: string;
}

interface PaymentResponseDto {
  success: boolean;
  paymentId?: string;
  redirectUrl?: string;
  message: string;
}

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);

  constructor(
    @InjectRepository(Payment)
    private paymentRepository: Repository<Payment>,
    private msuService: MsuService,
  ) {}

  async initiatePayment(dto: InitiatePaymentDto): Promise<PaymentResponseDto> {
    // Ödeme kaydı oluştur
    const payment = this.paymentRepository.create({
      orderId: dto.orderId,
      amount: dto.amount,
      customerEmail: dto.customerEmail,
      customerName: dto.customerName,
      status: PaymentStatus.PENDING,
    });

    await this.paymentRepository.save(payment);

    // MSU Session Token al
    const msuResponse = await this.msuService.createSessionToken({
      amount: dto.amount,
      orderId: dto.orderId,
      customerEmail: dto.customerEmail,
      customerName: dto.customerName,
    });

    if (msuResponse.success && msuResponse.redirectUrl) {
payment.transactionId = msuResponse.sessionToken || '';      await this.paymentRepository.save(payment);

      return {
        success: true,
        paymentId: payment.id,
        redirectUrl: msuResponse.redirectUrl,
        message: 'Ödeme sayfasına yönlendiriliyorsunuz',
      };
    } else {
      payment.status = PaymentStatus.FAILED;
payment.errorMessage = msuResponse.errorMessage || 'Ödeme başlatılamadı';      await this.paymentRepository.save(payment);

      return {
        success: false,
        paymentId: payment.id,
        message: msuResponse.errorMessage || 'Ödeme başlatılamadı',
      };
    }
  }

  async handleCallback(callbackData: any): Promise<{ success: boolean; redirectUrl: string }> {
    this.logger.log(`Payment callback received: ${JSON.stringify(callbackData)}`);

    const orderId = callbackData.merchantPaymentId || callbackData.MERCHANTPAYMENTID;
    
    const payment = await this.paymentRepository.findOne({
      where: { orderId },
    });

    if (!payment) {
      this.logger.error(`Payment not found for order: ${orderId}`);
      return { success: false, redirectUrl: '/payment/error?message=Ödeme bulunamadı' };
    }

    const responseCode = callbackData.responseCode || callbackData.RESPONSECODE;

    if (responseCode === '00') {
      payment.status = PaymentStatus.COMPLETED;
      payment.transactionId = callbackData.pgTranId || callbackData.PGTRANID || payment.transactionId;
      payment.cardLastFour = callbackData.panLast4 || callbackData.PANLAST4;
      await this.paymentRepository.save(payment);
      
      return { 
        success: true, 
        redirectUrl: `/payment/success?orderId=${payment.orderId}` 
      };
    } else {
      payment.status = PaymentStatus.FAILED;
      payment.errorMessage = callbackData.responseMsg || callbackData.RESPONSEMSG || 'Ödeme başarısız';
      await this.paymentRepository.save(payment);
      
      return { 
        success: false, 
        redirectUrl: `/payment/error?orderId=${payment.orderId}&message=${encodeURIComponent(payment.errorMessage)}` 
      };
    }
  }

  async getPaymentByOrderId(orderId: string): Promise<Payment | null> {
    return this.paymentRepository.findOne({ where: { orderId } });
  }

  async getPaymentById(id: string): Promise<Payment | null> {
    return this.paymentRepository.findOne({ where: { id } });
  }
}