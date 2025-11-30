import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import cookieParser from "cookie-parser";
import { ValidationPipe } from "@nestjs/common";
import { join } from 'path';

import { NestExpressApplication } from '@nestjs/platform-express';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.enableCors({
    origin: ['http://localhost:3000', 'https://osmon.vercel.app', 'https://oosmon.netlify.app/'],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposedHeaders: ['Content-Type', 'Authorization'],
  });

  // Serve uploaded files statically at /upload
  app.useStaticAssets(join(process.cwd(), 'upload'), { prefix: '/upload' });

  app.use(cookieParser());

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true, // автоматически преобразует типы
      whitelist: true, // убирает лишние поля
    }),
  );

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
