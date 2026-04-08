import { INestApplication, Module } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

export const SWAGGER_DOCS_PATH = 'docs';

@Module({})
export class ApiDocumentationModule {
  static setup(app: INestApplication): boolean {
    if (process.env.SWAGGER_ENABLED === 'false') {
      return false;
    }

    const config = new DocumentBuilder()
      .setTitle('UBI Backend API')
      .setDescription('API documentation for the UBI backend services')
      .setVersion('1.0.0')
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          in: 'header',
          name: 'Authorization',
          description: 'Paste JWT token',
        },
        'bearer',
      )
      .build();

    const document = SwaggerModule.createDocument(app, config, {
      operationIdFactory: (_, methodKey) => methodKey,
      deepScanRoutes: true,
    });

    SwaggerModule.setup(SWAGGER_DOCS_PATH, app, document, {
      useGlobalPrefix: true,
      jsonDocumentUrl: 'docs/docs.json',
      swaggerOptions: {
        persistAuthorization: true,
      },
    });

    return true;
  }
}
