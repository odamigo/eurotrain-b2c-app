import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MyTripsController } from './my-trips.controller';
import { MyTripsService } from './my-trips.service';
import { Booking } from '../bookings/entities/booking.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Booking])],
  controllers: [MyTripsController],
  providers: [MyTripsService],
  exports: [MyTripsService],
})
export class MyTripsModule {}