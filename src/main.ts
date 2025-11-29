import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import cookieParser from "cookie-parser";
import { ValidationPipe } from "@nestjs/common";
import { join } from 'path';

import { NestExpressApplication } from '@nestjs/platform-express';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.enableCors({
    origin: ['http://localhost:3000', 'https://osmon.vercel.app'],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
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

  app.useStaticAssets(join(process.cwd(), 'upload'), { prefix: '/upload' });

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
