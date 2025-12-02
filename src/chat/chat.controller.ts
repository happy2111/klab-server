// chat.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtRefreshGuard } from '../auth/guards/jwt-refresh.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ChatService } from './chat.service';

@UseGuards(JwtRefreshGuard, RolesGuard)
@Controller('chats')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  // 1. Получить все мои чаты (и для клиента, и для продавца)
  @Get('me')
  async getMyChats(@CurrentUser('id') userId: string) {
    return this.chatService.getUserChats(userId);
  }

  // 2. Создать чат (если его ещё нет) — возвращает уже существующий или новый
  @Post()
  async createOrGetChat(
    @Body() dto: { sellerId: string },
    @CurrentUser('id') clientId: string,
  ) {
    return this.chatService.createOrGetChat(clientId, dto.sellerId);
  }

  // 3. Получить историю сообщений конкретного чата + метаданные чата
  @Get(':chatId/messages')
  async getChatMessages(@Param('chatId') chatId: string, @CurrentUser('id') userId: string) {
    return this.chatService.getChatWithMessages(chatId, userId);
  }
}