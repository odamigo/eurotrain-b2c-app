import { Module } from '@nestjs/common';
import { McpBookingController } from './mcp-booking.controller';
import { BookingsModule } from '../bookings/bookings.module';
import { PaymentModule } from '../payment/payment.module';

@Module({
  imports: [
    BookingsModule,
    PaymentModule,
  ],
  controllers: [McpBookingController],
  exports: [],
})
export class McpBookingModule {}
