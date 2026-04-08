import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { resolve, join } from 'path';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ValidationPipe } from '@nestjs/common';
import { AllExceptionsFilter } from './helpers';

async function bootstrap() {
  // 🔥 Global crash-proof handlers (Node-level)
  process.on('uncaughtException', (err) => {
    console.error('❗ UNCAUGHT EXCEPTION — App is still running:', err);
  });

  process.on('unhandledRejection', (reason) => {
    console.error('❗ UNHANDLED REJECTION — App is still running:', reason);
  });

  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.useGlobalFilters(new AllExceptionsFilter());

  // Detect environment paths (src in dev, dist in docker)
  const isProd = process.env.NODE_ENV === 'production';
  const baseDir = isProd ? 'dist' : 'src';

  // Static files
  app.useStaticAssets(resolve(baseDir, 'public'));

  // View templates (express rendering)
  app.setBaseViewsDir(resolve(baseDir, 'templates'));
  app.setViewEngine('hbs');

  // Global prefix & validation
  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe());

  // CORS
  app.enableCors({
    origin: [
      'http://localhost:3000',
      'http://localhost:3001',
      'https://natty-pay.vercel.app',
      'https://www.ubi.com',
      'https://ubi.com',
      'https://valar-pay.vercel.app',
    ],
    credentials: true,
  });

  await app.listen(process.env.PORT ?? 3000, '0.0.0.0');
  console.log(`🚀 Server started on port ${process.env.PORT}`);
}

bootstrap();
