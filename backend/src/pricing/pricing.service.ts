import { Injectable } from '@nestjs/common';

@Injectable()
export class PricingService {
  // Sabit döviz kuru (normalde TCMB API'den alınır)
  private readonly EUR_TO_TRY = 36.50;

  calculateServiceFee(basePrice: number, feePercent: number = 5): number {
    // Yüzde 5 service fee (varsayılan)
    return basePrice * (feePercent / 100);
  }

  calculateTotal(basePrice: number, serviceFee: number): number {
    return basePrice + serviceFee;
  }

  convertToTRY(amountEUR: number): number {
    return Math.round(amountEUR * this.EUR_TO_TRY * 100) / 100;
  }

  convertToEUR(amountTRY: number): number {
    return Math.round((amountTRY / this.EUR_TO_TRY) * 100) / 100;
  }

  calculateFullPrice(basePrice: number, currency: string = 'EUR') {
    const serviceFee = this.calculateServiceFee(basePrice);
    const total = this.calculateTotal(basePrice, serviceFee);

    return {
      basePrice,
      serviceFee,
      total,
      currency,
      totalInTRY: currency === 'EUR' ? this.convertToTRY(total) : total,
      totalInEUR: currency === 'TRY' ? this.convertToEUR(total) : total,
    };
  }
}