import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { resolve, join } from 'path';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ValidationPipe } from '@nestjs/common';
import { AllExceptionsFilter } from './helpers';
import {
  ApiDocumentationModule,
  SWAGGER_DOCS_PATH,
} from './swagger/swagger.module';

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
  const swaggerEnabled = ApiDocumentationModule.setup(app);

  // CORS
  app.enableCors({
    origin: [
      'http://localhost:3000',
      'http://localhost:3001',
      'https://natty-pay.vercel.app',
      'https://www.ubi.com',
      'https://ubi.com',
      'https://ubi-pay.vercel.app',
    ],
    credentials: true,
  });

  await app.listen(process.env.PORT ?? 3000, '0.0.0.0');
  const baseUrl = await app.getUrl();

  console.log(`🚀 Server started at ${baseUrl}`);
  if (swaggerEnabled) {
    console.log(`📚 Swagger docs enabled at ${baseUrl}/api/${SWAGGER_DOCS_PATH}`);
  }
}

bootstrap();
