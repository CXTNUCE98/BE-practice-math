import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { Request, Response, Application } from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Bật CORS để Frontend có thể truy cập
  app.enableCors();

  // Sử dụng ValidationPipe để validate DTO tự động
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
    .addBearerAuth() // Thêm hỗ trợ JWT Token
    .build();

  const document = SwaggerModule.createDocument(app, config);

  // Endpoint Swagger UI tại /api
  SwaggerModule.setup('api', app, document);

  // Endpoint Swagger JSON tại /api-docs-json (Yêu cầu của người dùng)
  const expressApp = app.getHttpAdapter().getInstance() as Application;
  expressApp.get('/api-docs-json', (req: Request, res: Response) => {
    res.json(document);
  });

  const port = process.env.PORT ?? 3001;
  await app.listen(port);

  console.log(`Ứng dụng đang chạy tại: http://localhost:${port}`);
  console.log(`Tài liệu API Swagger: http://localhost:${port}/api`);
  console.log(`Tài liệu API JSON: http://localhost:${port}/api-docs-json`);
}

// eslint-disable-next-line @typescript-eslint/no-floating-promises
bootstrap();
