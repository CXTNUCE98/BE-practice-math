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

  const expressApp = app.getHttpAdapter().getInstance() as Application;

  // Setup Swagger UI sử dụng CDN (cdnjs) để đảm bảo load resources ổn định trên Vercel
  SwaggerModule.setup('api', app, document, {
    customSiteTitle: 'Practice Math API Docs',
    customJs: [
      'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.11.0/swagger-ui-bundle.min.js',
      'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.11.0/swagger-ui-standalone-preset.min.js',
    ],
    customCssUrl: [
      'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.11.0/swagger-ui.min.css',
    ],
  });

  // Endpoint Swagger JSON
  expressApp.get('/api-docs-json', (req: Request, res: Response) => {
    res.json(document);
  });
}
