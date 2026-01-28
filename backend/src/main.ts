import './instrument'; // Sentry - must be first import!
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as Sentry from '@sentry/nestjs';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Sentry error handler
  app.useGlobalFilters(new Sentry.SentryGlobalFilter());
  
  // CORS'u etkinleştir
  app.enableCors({
    origin: [
      'http://localhost:3000',
      'https://eurotrain-b2c-app.vercel.app',
      process.env.FRONTEND_URL,
    ].filter(Boolean),
    credentials: true,
  });
  
  await app.listen(process.env.PORT ?? 3001);
}
bootstrap();
