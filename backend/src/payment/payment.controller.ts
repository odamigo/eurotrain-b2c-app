import { Controller, Post, Body, Get, Param, Res, Query } from '@nestjs/common';
import type { Response } from 'express';
import { PaymentService } from './payment.service';
import { InitiatePaymentDto, PaymentResponseDto } from './dto/payment.dto';

@Controller('payment')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post('initiate')
  async initiatePayment(@Body() dto: InitiatePaymentDto): Promise<PaymentResponseDto> {
    return this.paymentService.initiatePayment(dto);
  }

  @Post('callback')
  async handleCallbackPost(@Body() callbackData: any, @Res() res: Response): Promise<void> {
    const result = await this.paymentService.handleCallback(callbackData);
    res.redirect(result.redirectUrl);
  }

  @Get('callback')
  async handleCallbackGet(@Query() callbackData: any, @Res() res: Response): Promise<void> {
    const result = await this.paymentService.handleCallback(callbackData);
    res.redirect(result.redirectUrl);
  }

  @Get('status/:orderId')
  async getPaymentStatus(@Param('orderId') orderId: string) {
    const payment = await this.paymentService.getPaymentByOrderId(orderId);
    if (!payment) {
      return { success: false, message: 'Ödeme bulunamadı' };
    }
    return {
      success: true,
      status: payment.status,
      orderId: payment.orderId,
      amount: payment.amount,
    };
  }
}