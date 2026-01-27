import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // ============================================
  // GÜVENLİK AYARLARI
  // ============================================

  // Helmet - HTTP güvenlik başlıkları
  app.use(helmet());

  // Trust proxy (Railway, Vercel arkasında çalışırken gerekli)
  app.getHttpAdapter().getInstance().set('trust proxy', 1);

  // CORS ayarları
  const allowedOrigins = process.env.NODE_ENV === 'production'
    ? [
        'https://eurotrain.net',
        'https://www.eurotrain.net',
        'https://staging.eurotrain.net',
        process.env.FRONTEND_URL,
      ].filter(Boolean)
    : ['http://localhost:3000', 'http://127.0.0.1:3000'];

  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  });

  // ============================================
  // VALİDASYON
  // ============================================
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // DTO'da olmayan alanları kaldır
      forbidNonWhitelisted: true, // Bilinmeyen alanlar hata versin
      transform: true, // Otomatik tip dönüşümü
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // ============================================
  // GLOBAL PREFIX (opsiyonel - /api/v1 gibi)
  // ============================================
  // app.setGlobalPrefix('api/v1');

  // ============================================
  // PORT
  // ============================================
  const port = process.env.PORT || 3001;
  await app.listen(port);

  console.log(`🚀 EuroTrain Backend running on port ${port}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Health check: http://localhost:${port}/health`);
}

bootstrap();
