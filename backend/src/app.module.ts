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
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';

// Synchronize ayarını belirle
// DB_SYNCHRONIZE=true ise tablo oluştur (ilk deployment için)
// Aksi halde production'da false, development'ta true
const shouldSynchronize = 
  process.env.DB_SYNCHRONIZE === 'true' || 
  (process.env.NODE_ENV !== 'production' && process.env.DB_SYNCHRONIZE !== 'false');

@Module({
  imports: [
    // ============================================
    // RATE LIMITING - DDoS koruması
    // ============================================
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 1000, // 1 saniye
        limit: 10, // 10 istek
      },
      {
        name: 'medium',
        ttl: 10000, // 10 saniye
        limit: 50, // 50 istek
      },
      {
        name: 'long',
        ttl: 60000, // 1 dakika
        limit: 100, // 100 istek
      },
    ]),

    // ============================================
    // DATABASE - PostgreSQL
    // ============================================
    TypeOrmModule.forRoot({
      type: 'postgres',
      
      // Neon PostgreSQL için DATABASE_URL kullan
      url: process.env.DATABASE_URL,
      
      // Fallback: ayrı değişkenler
      host: process.env.DATABASE_URL ? undefined : (process.env.DB_HOST || 'localhost'),
      port: process.env.DATABASE_URL ? undefined : parseInt(process.env.DB_PORT || '5432'),
      username: process.env.DATABASE_URL ? undefined : (process.env.DB_USERNAME || 'eurotrain'),
      password: process.env.DATABASE_URL ? undefined : (process.env.DB_PASSWORD || 'dev123'),
      database: process.env.DATABASE_URL ? undefined : (process.env.DB_NAME || 'eurotrain_db'),
      
      // SSL - Neon ve production için zorunlu
      ssl: process.env.NODE_ENV === 'production' || process.env.DB_SSL === 'true'
        ? { rejectUnauthorized: false }
        : false,
      
      // Entity ayarları
      autoLoadEntities: true,
      
      // Synchronize: DB_SYNCHRONIZE=true ile override edilebilir
      // İlk deployment sonrası DB_SYNCHRONIZE=false yapılmalı!
      synchronize: shouldSynchronize,
      
      // Connection pool
      extra: {
        max: 10, // Maksimum bağlantı
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 10000,
      },
      
      // Logging (production'da kapat)
      logging: process.env.NODE_ENV !== 'production',
    }),

    // ============================================
    // MODULES
    // ============================================
    SecurityModule,
    BookingsModule,
    PricingModule,
    CampaignsModule,
    EraModule,
    PaymentModule,
    MyTripsModule,
    CalendarModule,
    ShareModule,
  ],
  controllers: [AppController, TrainsController],
  providers: [
    AppService,
    // Global rate limiting guard
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
