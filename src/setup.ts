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

  // Cấu hình thủ công để serve static files cho Swagger UI (Fix 404 on Vercel)
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const swaggerUiAssetPath = require('swagger-ui-dist').getAbsoluteFSPath();
  const expressApp = app.getHttpAdapter().getInstance() as Application;
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const express = require('express');

  // Mount assets tại đường dẫn riêng biệt (root level) để tránh lỗi relative path (/api/api/...)
  expressApp.use('/swagger-static', express.static(swaggerUiAssetPath));

  // Setup Swagger UI sử dụng các file từ đường dẫn static vừa tạo
  SwaggerModule.setup('api', app, document, {
    customSiteTitle: 'Practice Math API Docs',
    customJs: [
      '/swagger-static/swagger-ui-bundle.js',
      '/swagger-static/swagger-ui-standalone-preset.js',
    ],
    customCssUrl: ['/swagger-static/swagger-ui.css'],
  });

  // Endpoint Swagger JSON
  expressApp.get('/api-docs-json', (req: Request, res: Response) => {
    res.json(document);
  });
}
