import { Module, Global } from '@nestjs/common';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { AuthModule } from './auth.module';
import { HealthController } from './health.controller';
import { LogsController } from './logs.controller';
import { LoggerService } from './logger.service';
import { GlobalExceptionFilter } from './global-exception.filter';

@Global()
@Module({
  imports: [
    AuthModule,
    // Rate Limiting: 1 dakikada max 60 istek
    ThrottlerModule.forRoot([{
      ttl: 60000, // 1 dakika (milisaniye)
      limit: 60,  // max 60 istek
    }]),
  ],
  controllers: [HealthController, LogsController],
  providers: [
    LoggerService,
    // Global Rate Limiting
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    // Global Exception Filter
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
  ],
  exports: [LoggerService, AuthModule],
})
export class SecurityModule {}
