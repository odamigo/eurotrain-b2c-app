import { Module, forwardRef } from '@nestjs/common';
import { McpController } from './mcp.controller';
import { OfferCacheService } from './services/offer-cache.service';
import { SessionCacheService } from './services/session-cache.service';
import { CheckoutService } from './services/checkout.service';
import { EraModule } from '../era/era.module';
import { PaymentModule } from '../payment/payment.module';
import { BookingsModule } from '../bookings/bookings.module';

@Module({
  imports: [
    EraModule,
    forwardRef(() => PaymentModule),
    forwardRef(() => BookingsModule),
  ],
  controllers: [McpController],
  providers: [
    OfferCacheService,
    SessionCacheService,
    CheckoutService,
  ],
  exports: [
    OfferCacheService,
    SessionCacheService,
    CheckoutService,
  ],
})
export class McpModule {}
