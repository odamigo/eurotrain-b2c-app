import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EraController } from './era.controller';
import { EraMockService } from './era-mock.service';
import { EraBooking } from './entities/booking.entity';

@Module({
  imports: [TypeOrmModule.forFeature([EraBooking])],
  controllers: [EraController],
  providers: [EraMockService],
  exports: [EraMockService],
})
export class EraModule {}