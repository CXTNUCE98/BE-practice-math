import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { setupApp } from './setup';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Setup chung (CORS, Validation, Swagger)
  setupApp(app);

  const port = process.env.PORT ?? 3001;
  await app.listen(port);

  console.log(`Ứng dụng đang chạy tại: http://localhost:${port}`);
  console.log(`Tài liệu API Swagger: http://localhost:${port}/api`);
  console.log(`Tài liệu API JSON: http://localhost:${port}/api-docs-json`);
}

// eslint-disable-next-line @typescript-eslint/no-floating-promises
bootstrap();
