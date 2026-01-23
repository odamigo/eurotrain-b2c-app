import { Controller, Post, Get, Body, Param, Query, Res, Req, UseGuards, Logger, HttpCode } from '@nestjs/common';
import type { Response, Request } from 'express';
import { PaymentService } from './payment.service';
import { InitiatePaymentDto, RefundPaymentDto, PaymentCallbackDto } from './dto/payment.dto';
import { JwtAuthGuard } from '../security/jwt-auth.guard';

@Controller('payment')
export class PaymentController {
  private readonly logger = new Logger(PaymentController.name);

  constructor(private readonly paymentService: PaymentService) {}

  @Post('initiate')
  async initiatePayment(
    @Body() dto: InitiatePaymentDto,
    @Req() req: any,
  ) {
    const customerIp = req.ip || req.headers['x-forwarded-for'] || 'unknown';
    return this.paymentService.initiatePayment(dto, customerIp);
  }

  @Get('callback')
  async handleCallbackGet(
    @Query() query: PaymentCallbackDto,
    @Res() res: any,
  ) {
    this.logger.log('Payment callback GET received');

    if ((query as any)['mockPayment'] === 'true') {
      const result = await this.paymentService.handleMockCallback(
        (query as any)['orderId'],
        (query as any)['amount'],
        (query as any)['currency'],
      );
      return res.redirect(result.redirectUrl);
    }

    const result = await this.paymentService.handleCallback(query);
    return res.redirect(result.redirectUrl);
  }

  @Post('callback')
  @HttpCode(200)
  async handleCallbackPost(
    @Body() body: PaymentCallbackDto,
    @Query() query: any,
    @Res() res: any,
  ) {
    this.logger.log('Payment callback POST received');

    const callbackData = { ...body, ...query };

    if (callbackData['mockPayment'] === 'true') {
      const result = await this.paymentService.handleMockCallback(
        callbackData['orderId'],
        callbackData['amount'],
        callbackData['currency'],
      );
      return res.redirect(result.redirectUrl);
    }

    const result = await this.paymentService.handleCallback(callbackData);
    return res.redirect(result.redirectUrl);
  }

  @Post('webhook')
  @HttpCode(200)
  async handleWebhook(
    @Body() body: any,
    @Req() req: any,
  ) {
    this.logger.log('Payment webhook received: ' + JSON.stringify(body));

    const result = await this.paymentService.handleCallback(body);

    return {
      success: result.success,
      message: result.success ? 'Webhook processed' : 'Webhook processing failed',
    };
  }

  @Get('status/:paymentId')
  async getPaymentStatus(@Param('paymentId') paymentId: string) {
    return this.paymentService.getPaymentStatus(paymentId);
  }

  @Get('order/:orderId')
  async getPaymentByOrderId(@Param('orderId') orderId: string) {
    const payment = await this.paymentService.getPaymentByOrderId(orderId);
    if (!payment) {
      return { success: false, message: 'Odeme bulunamadi' };
    }
    return { success: true, payment };
  }

  @Get('booking/:bookingId')
  async getPaymentsByBookingId(@Param('bookingId') bookingId: string) {
    const payments = await this.paymentService.getPaymentsByBookingId(parseInt(bookingId));
    return { success: true, payments };
  }

  @Post('refund')
  @UseGuards(JwtAuthGuard)
  async refundPayment(
    @Body() dto: RefundPaymentDto,
    @Req() req: any,
  ) {
    const adminEmail = req.user?.email || 'admin@eurotrain.com';
    return this.paymentService.refundPayment(dto, adminEmail);
  }

  @Get('list')
  @UseGuards(JwtAuthGuard)
  async getAllPayments(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
  ) {
    const result = await this.paymentService.getAllPayments(
      parseInt(page) || 1,
      parseInt(limit) || 20,
    );
    return {
      success: true,
      ...result,
    };
  }
}
