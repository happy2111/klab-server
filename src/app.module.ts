import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import {ConfigModule} from "@nestjs/config";
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { ChatModule } from './chat/chat.module';
import { ProductModule } from './product/product.module';
import { CategoryModule } from './category/category.module';
import { ProfileModule } from './profile/profile.module';
import { Chat2Module } from './chat2/chat2.module';
import {ScheduleModule} from "@nestjs/schedule";
import { PingModule } from './ping/ping.module';
import {PingService} from "./ping/ping.service";

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    AuthModule,
    CategoryModule,
    ProductModule,
    ChatModule,
    ProfileModule,
    Chat2Module,
    PingModule,
  ],
  controllers: [AppController],
  providers: [AppService, PingService],
})
export class AppModule {}
