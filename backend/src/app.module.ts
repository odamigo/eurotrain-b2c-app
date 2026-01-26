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
import { McpModule } from './mcp/mcp.module';

@Module({
  imports: [
    // Load .env file first
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      username: process.env.DB_USERNAME || 'eurotrain',
      password: process.env.DB_PASSWORD || 'dev123',
      database: process.env.DB_DATABASE || 'eurotrain_db',
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
    McpModule,
  ],
  controllers: [AppController, TrainsController],
  providers: [AppService],
})
export class AppModule {}
