import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { setupApp } from './setup';
import express from 'express';

const server = express();

const createNestServer = async (expressInstance: express.Express) => {
  const app = await NestFactory.create(
    AppModule,
    new ExpressAdapter(expressInstance),
  );
  setupApp(app);
  await app.init();
  return app;
};

// Vercel Serverless Function Handler
export default async (req: any, res: any) => {
  if (!(server as any)._bootstrapped) {
    await createNestServer(server);
    (server as any)._bootstrapped = true;
  }
  server(req, res);
};
