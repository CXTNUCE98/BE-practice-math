import { INestApplication, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Request, Response, Application } from 'express';

export function setupApp(app: INestApplication) {
  // Bật CORS
  app.enableCors();

  // Sử dụng ValidationPipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Cấu hình Swagger
  const config = new DocumentBuilder()
    .setTitle('Ứng dụng Luyện Thi Toán - API')
    .setDescription('Tài liệu API cho hệ thống luyện thi toán trực tuyến')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);

  // Setup Swagger UI với CDN để tránh lỗi 404 static files trên Vercel
  SwaggerModule.setup('api', app, document, {
    customSiteTitle: 'Practice Math API Docs',
    customJs: [
      'https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui-bundle.js',
      'https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui-standalone-preset.js',
    ],
    customCssUrl: ['https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui.css'],
  });

  // Endpoint Swagger JSON
  const expressApp = app.getHttpAdapter().getInstance() as Application;
  expressApp.get('/api-docs-json', (req: Request, res: Response) => {
    res.json(document);
  });
}
