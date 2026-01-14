import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { AppModule } from '../src/app.module';
import { setupApp } from '../src/setup';
import express, { Request, Response } from 'express';

const server = express();
let isBootstrapped = false;

const createNestServer = async (expressInstance: express.Express) => {
  try {
    console.log('🚀 [Vercel] Đang khởi tạo NestJS application...');
    const app = await NestFactory.create(
      AppModule,
      new ExpressAdapter(expressInstance),
      {
        logger: ['error', 'warn', 'log'],
      },
    );

    console.log('⚙️ [Vercel] Đang setup application...');
    setupApp(app);

    console.log('✅ [Vercel] Đang initialize app...');
    await app.init();

    console.log('✅ [Vercel] NestJS application đã sẵn sàng!');
    return app;
  } catch (error) {
    console.error('❌ [Vercel] Lỗi khi khởi tạo NestJS:', error);
    throw error;
  }
};

// Vercel Serverless Function Handler
export default async (req: Request, res: Response) => {
  try {
    if (!isBootstrapped) {
      console.log('📦 [Vercel] Lần đầu khởi động, đang bootstrap...');
      await createNestServer(server);
      isBootstrapped = true;
    }
    server(req, res);
  } catch (error: unknown) {
    console.error('❌ [Vercel] Serverless function error:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Internal Server Error';
    res.status(500).json({
      statusCode: 500,
      message: 'Internal Server Error',
      error:
        process.env.NODE_ENV === 'development'
          ? errorMessage
          : 'Internal Server Error',
      timestamp: new Date().toISOString(),
    });
  }
};
