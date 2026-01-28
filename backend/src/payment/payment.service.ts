import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment, PaymentStatus } from './entities/payment.entity';
import { MsuService } from './msu.service';
import { InitiatePaymentDto, PaymentResponseDto, RefundPaymentDto, RefundResponseDto, PaymentStatusDto } from './dto/payment.dto';

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);
  private readonly frontendUrl: string;

  constructor(
    @InjectRepository(Payment)
    private paymentRepository: Repository<Payment>,
    private msuService: MsuService,
  ) {
    // Frontend URL - callback sonrası yönlendirme için
    this.frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    this.logger.log('Frontend URL for redirects: ' + this.frontendUrl);
  }

  async initiatePayment(dto: InitiatePaymentDto, customerIp?: string): Promise<PaymentResponseDto> {
    this.logger.log('Initiating payment for order: ' + dto.orderId);

    const existingPayment = await this.paymentRepository.findOne({
      where: { orderId: dto.orderId, status: PaymentStatus.COMPLETED },
    });

    if (existingPayment) {
      throw new BadRequestException('Bu siparis icin odeme zaten tamamlanmis');
    }

    const payment = new Payment();
    payment.orderId = dto.orderId;
    payment.bookingId = dto.bookingId;
    payment.amount = dto.amount;
    payment.currency = dto.currency;
    payment.customerEmail = dto.customerEmail;
    payment.customerName = dto.customerName;
    payment.customerIp = customerIp || dto.customerIp;
    payment.status = PaymentStatus.PENDING;
    payment.installmentCount = dto.installmentCount;

    await this.paymentRepository.save(payment);

    const msuResponse = await this.msuService.createSessionToken({
      amount: dto.amount,
      currency: dto.currency,
      orderId: dto.orderId,
      customerEmail: dto.customerEmail,
      customerName: dto.customerName,
      customerIp: customerIp || dto.customerIp,
      installmentCount: dto.installmentCount,
    });

    if (msuResponse.success && msuResponse.redirectUrl) {
      payment.sessionToken = msuResponse.sessionToken;
      payment.status = PaymentStatus.PROCESSING;
      payment.rawRequest = { dto, msuResponse: msuResponse.rawResponse };
      await this.paymentRepository.save(payment);

      this.logger.log('Payment initiated successfully: ' + payment.id);

      return {
        success: true,
        paymentId: payment.id,
        redirectUrl: msuResponse.redirectUrl,
        message: 'Odeme sayfasina yonlendiriliyorsunuz',
        currency: dto.currency,
        amount: dto.amount,
      };
    } else {
      payment.status = PaymentStatus.FAILED;
      payment.errorCode = msuResponse.errorCode;
      payment.errorMessage = msuResponse.errorMessage || 'Odeme baslatilamadi';
      payment.rawResponse = msuResponse.rawResponse;
      await this.paymentRepository.save(payment);

      this.logger.error('Payment initiation failed: ' + msuResponse.errorMessage);

      return {
        success: false,
        paymentId: payment.id,
        message: msuResponse.errorMessage || 'Odeme baslatilamadi',
      };
    }
  }

  async handleCallback(callbackData: any): Promise<{ success: boolean; redirectUrl: string; payment?: Payment }> {
    this.logger.log('Payment callback received: ' + JSON.stringify(callbackData));

    const orderId = callbackData.merchantPaymentId || callbackData.MERCHANTPAYMENTID;

    if (!orderId) {
      this.logger.error('Callback missing orderId');
      return { success: false, redirectUrl: this.frontendUrl + '/payment/error?message=Gecersiz+islem' };
    }

    const payment = await this.paymentRepository.findOne({
      where: { orderId },
    });

    if (!payment) {
      this.logger.error('Payment not found for order: ' + orderId);
      return { success: false, redirectUrl: this.frontendUrl + '/payment/error?message=Odeme+bulunamadi' };
    }

    payment.callbackData = callbackData;

    const responseCode = callbackData.responseCode || callbackData.RESPONSECODE;

    if (responseCode === '00') {
      payment.status = PaymentStatus.COMPLETED;
      payment.pgTranId = callbackData.pgTranId || callbackData.PGTRANID;
      payment.pgOrderId = callbackData.pgOrderId || callbackData.PGORDERID;
      payment.authCode = callbackData.authCode || callbackData.AUTHCODE;
      payment.rrn = callbackData.rrn || callbackData.RRN;
      payment.cardLastFour = callbackData.panLast4 || callbackData.PANLAST4;
      payment.cardBrand = callbackData.cardBrand || callbackData.CARDBRAND;
      payment.is3DSecure = (callbackData.is3D || callbackData.IS3D) === 'YES';
      payment.threeDSecureResult = callbackData.mdStatus || callbackData.MDSTATUS;
      payment.completedAt = new Date();

      await this.paymentRepository.save(payment);

      this.logger.log('Payment completed successfully: ' + payment.id);

      return {
        success: true,
        redirectUrl: this.frontendUrl + '/payment/success?orderId=' + payment.orderId + '&paymentId=' + payment.id,
        payment,
      };
    } else {
      payment.status = PaymentStatus.FAILED;
      payment.errorCode = responseCode;
      payment.errorMessage = callbackData.responseMsg || callbackData.RESPONSEMSG || 'Odeme basarisiz';

      await this.paymentRepository.save(payment);

      this.logger.error('Payment failed: ' + payment.errorMessage);

      return {
        success: false,
        redirectUrl: this.frontendUrl + '/payment/error?orderId=' + payment.orderId + '&message=' + encodeURIComponent(payment.errorMessage || 'Odeme basarisiz'),
        payment,
      };
    }
  }

  async handleMockCallback(orderId: string, amount: string, currency: string): Promise<{ success: boolean; redirectUrl: string; payment?: Payment }> {
    this.logger.warn('Processing MOCK payment callback for order: ' + orderId);

    const payment = await this.paymentRepository.findOne({
      where: { orderId },
    });

    if (!payment) {
      return { success: false, redirectUrl: this.frontendUrl + '/payment/error?message=Odeme+bulunamadi' };
    }

    payment.status = PaymentStatus.COMPLETED;
    payment.pgTranId = 'MOCK_' + Date.now();
    payment.cardLastFour = '4242';
    payment.cardBrand = 'VISA';
    payment.is3DSecure = true;
    payment.completedAt = new Date();
    payment.callbackData = { mock: true, orderId, amount, currency };

    await this.paymentRepository.save(payment);

    this.logger.log('MOCK Payment completed: ' + payment.id);

    return {
      success: true,
      redirectUrl: this.frontendUrl + '/payment/success?orderId=' + payment.orderId + '&paymentId=' + payment.id,
      payment,
    };
  }

  async refundPayment(dto: RefundPaymentDto, adminEmail: string): Promise<RefundResponseDto> {
    const payment = await this.paymentRepository.findOne({
      where: { id: dto.paymentId },
    });

    if (!payment) {
      throw new NotFoundException('Odeme bulunamadi');
    }

    if (payment.status !== PaymentStatus.COMPLETED && payment.status !== PaymentStatus.PARTIALLY_REFUNDED) {
      throw new BadRequestException('Sadece tamamlanmis odemeler iade edilebilir');
    }

    const remainingAmount = Number(payment.amount) - Number(payment.refundedAmount || 0);
    if (dto.amount > remainingAmount) {
      throw new BadRequestException('Iade tutari kalan tutardan fazla olamaz. Kalan: ' + remainingAmount);
    }

    if (!this.msuService.isConfigured()) {
      this.logger.warn('MSU not configured - processing mock refund');
      return this.processMockRefund(payment, dto, adminEmail);
    }

    const refundResponse = await this.msuService.refundPayment({
      pgTranId: payment.pgTranId || '',
      amount: dto.amount,
      currency: payment.currency,
      reason: dto.reason,
    });

    if (refundResponse.success) {
      const newRefundedAmount = Number(payment.refundedAmount || 0) + dto.amount;
      payment.refundedAmount = newRefundedAmount;
      payment.refundTransactionId = refundResponse.refundTransactionId;
      payment.refundReason = dto.reason;
      payment.refundedBy = adminEmail;
      payment.refundedAt = new Date();

      if (newRefundedAmount >= Number(payment.amount)) {
        payment.status = PaymentStatus.REFUNDED;
      } else {
        payment.status = PaymentStatus.PARTIALLY_REFUNDED;
      }

      await this.paymentRepository.save(payment);

      this.logger.log('Refund completed: ' + payment.id + ' Amount: ' + dto.amount);

      return {
        success: true,
        refundTransactionId: refundResponse.refundTransactionId,
        message: 'Iade basariyla gerceklestirildi',
        refundedAmount: dto.amount,
      };
    } else {
      this.logger.error('Refund failed: ' + refundResponse.errorMessage);

      return {
        success: false,
        message: refundResponse.errorMessage || 'Iade islemi basarisiz',
      };
    }
  }

  private async processMockRefund(payment: Payment, dto: RefundPaymentDto, adminEmail: string): Promise<RefundResponseDto> {
    const newRefundedAmount = Number(payment.refundedAmount || 0) + dto.amount;
    payment.refundedAmount = newRefundedAmount;
    payment.refundTransactionId = 'MOCK_REFUND_' + Date.now();
    payment.refundReason = dto.reason;
    payment.refundedBy = adminEmail;
    payment.refundedAt = new Date();

    if (newRefundedAmount >= Number(payment.amount)) {
      payment.status = PaymentStatus.REFUNDED;
    } else {
      payment.status = PaymentStatus.PARTIALLY_REFUNDED;
    }

    await this.paymentRepository.save(payment);

    return {
      success: true,
      refundTransactionId: payment.refundTransactionId,
      message: 'Iade basariyla gerceklestirildi (Mock)',
      refundedAmount: dto.amount,
    };
  }

  async getPaymentByOrderId(orderId: string): Promise<Payment | null> {
    return this.paymentRepository.findOne({ where: { orderId } });
  }

  async getPaymentById(id: string): Promise<Payment | null> {
    return this.paymentRepository.findOne({ where: { id } });
  }

  async getPaymentsByBookingId(bookingId: number): Promise<Payment[]> {
    return this.paymentRepository.find({ where: { bookingId } });
  }

  async getPaymentStatus(paymentId: string): Promise<PaymentStatusDto> {
    const payment = await this.paymentRepository.findOne({ where: { id: paymentId } });

    if (!payment) {
      throw new NotFoundException('Odeme bulunamadi');
    }

    return {
      id: payment.id,
      orderId: payment.orderId,
      bookingId: payment.bookingId,
      amount: Number(payment.amount),
      currency: payment.currency,
      status: payment.status,
      cardLastFour: payment.cardLastFour,
      cardBrand: payment.cardBrand,
      is3DSecure: payment.is3DSecure,
      createdAt: payment.createdAt,
      completedAt: payment.completedAt,
      refundedAmount: Number(payment.refundedAmount || 0),
    };
  }

  async getAllPayments(page: number = 1, limit: number = 20): Promise<{ payments: Payment[]; total: number }> {
    const [payments, total] = await this.paymentRepository.findAndCount({
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { payments, total };
  }
}
