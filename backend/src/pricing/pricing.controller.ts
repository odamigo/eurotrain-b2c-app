import { Controller, Get, Query } from '@nestjs/common';
import { PricingService } from './pricing.service';

@Controller('pricing')
export class PricingController {
  constructor(private readonly pricingService: PricingService) {}

  @Get('calculate')
  calculatePrice(
    @Query('basePrice') basePrice: string,
    @Query('currency') currency: string = 'EUR',
  ) {
    const price = parseFloat(basePrice);
    return this.pricingService.calculateFullPrice(price, currency);
  }

  @Get('convert')
  convertCurrency(
    @Query('amount') amount: string,
    @Query('from') from: string,
    @Query('to') to: string,
  ) {
    const amountNum = parseFloat(amount);
    
    if (from === 'EUR' && to === 'TRY') {
      return {
        from: 'EUR',
        to: 'TRY',
        amount: amountNum,
        converted: this.pricingService.convertToTRY(amountNum),
      };
    } else if (from === 'TRY' && to === 'EUR') {
      return {
        from: 'TRY',
        to: 'EUR',
        amount: amountNum,
        converted: this.pricingService.convertToEUR(amountNum),
      };
    }
    
    return { error: 'Invalid currency pair' };
  }
}