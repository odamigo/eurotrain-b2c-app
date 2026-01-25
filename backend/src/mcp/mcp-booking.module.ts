import { Module } from '@nestjs/common';
import { McpBookingController } from './mcp-booking.controller';
import { BookingsModule } from '../bookings/bookings.module';
import { PaymentModule } from '../payment/payment.module';
import { EraModule } from '../era/era.module';

@Module({
  imports: [
    BookingsModule,
    PaymentModule,
    EraModule,
  ],
  controllers: [McpBookingController],
  exports: [],
})
export class McpBookingModule {}
