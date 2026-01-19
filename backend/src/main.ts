import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // CORS'u etkinleştir
  app.enableCors({
    origin: 'http://localhost:3000', // Frontend URL'i
    credentials: true,
  });
  
  await app.listen(process.env.PORT ?? 3001);
}
bootstrap();