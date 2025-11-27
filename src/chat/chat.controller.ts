import { Controller, Get, Post, Body, Query, Param, UseGuards } from '@nestjs/common';
import { ChatService } from './chat.service';
import { CreateChatDto } from './dto/create-chat.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import {JwtRefreshGuard} from "../auth/guards/jwt-refresh.guard";

@Controller('chats')
@UseGuards(JwtRefreshGuard)
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post()
  createChat(@Body() dto: CreateChatDto) {
    return this.chatService.createChat(dto);
  }

  @Get()
  getMyChats(@CurrentUser('id') userId: string) {
    return this.chatService.getChatsForUser(userId);
  }

  @Get(':chatId/messages')
  getMessages(@Param('chatId') chatId: string) {
    return this.chatService.getMessages(chatId);
  }
}
