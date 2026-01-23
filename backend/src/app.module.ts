import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
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
import { EmailModule } from './email/email.module';
import { PdfModule } from './pdf/pdf.module';
import { SettingsModule } from './settings/settings.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'eurotrain',
      password: 'dev123',
      database: 'eurotrain_db',
      autoLoadEntities: true,
      synchronize: true,
    }),
    SecurityModule,
    BookingsModule,
    PricingModule,
    CampaignsModule,
    EraModule,
    PaymentModule,
    MyTripsModule,
    EmailModule,
    PdfModule,
    SettingsModule,
  ],
  controllers: [AppController, TrainsController],
  providers: [AppService],
})
export class AppModule {}