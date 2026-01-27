import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TrainsController } from './trains/trains.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BookingsModule } from './bookings/bookings.module';
import { PricingModule } from './pricing/pricing.module';
import { CampaignsModule } from './campaigns/campaigns.module';
import { EraModule } from './era/era.module';
import { PaymentModule } from './payment/payment.module';
import { MyTripsModule } from './my-trips/my-trips.module';
import { SecurityModule } from './security/security.module';
import { CalendarModule } from './calendar/calendar.module';
import { ShareModule } from './share/share.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      username: process.env.DB_USERNAME || 'eurotrain',
      password: process.env.DB_PASSWORD || 'dev123',
      database: process.env.DB_NAME || 'eurotrain_db',
      autoLoadEntities: true,
      synchronize: process.env.NODE_ENV !== 'production', // Production'da false olmalı
    }),
    SecurityModule,
    BookingsModule,
    PricingModule,
    CampaignsModule,
    EraModule,
    PaymentModule,
    MyTripsModule,
    CalendarModule,  // YENİ: iCal export
    ShareModule,     // YENİ: WhatsApp/SMS/Email share
  ],
  controllers: [AppController, TrainsController],
  providers: [AppService],
})
export class AppModule {}
