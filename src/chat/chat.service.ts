import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateChatDto } from './dto/create-chat.dto';
import { CreateMessageDto } from './dto/create-message.dto';

@Injectable()
export class ChatService {
  constructor(private prisma: PrismaService) {}

  async createChat(dto: CreateChatDto) {
    // Проверяем, существует ли уже чат между этими пользователями
    const existing = await this.prisma.chat.findFirst({
      where: { clientId: dto.clientId, sellerId: dto.sellerId },
    });
    if (existing) return existing;

    return this.prisma.chat.create({
      data: {
        clientId: dto.clientId,
        sellerId: dto.sellerId,
      },
    });
  }

  async getChatsForUser(userId: string) {
    return this.prisma.chat.findMany({
      where: {
        OR: [{ clientId: userId }, { sellerId: userId }],
      },
      include: {
        client: {
          select: { id: true, name: true, email: true } // Выбираем только нужные поля
        },
        seller: {
          select: { id: true, name: true, email: true } // Выбираем только нужные поля
        },
        messages: {
          include: { sender: true },
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { updatedAt: 'desc' },

    });
  }

  async getMessages(chatId: string) {
    return this.prisma.message.findMany({
      where: { chatId },
      include: { sender: true },
      orderBy: { createdAt: 'asc' },
    });
  }

  async createMessage(dto: CreateMessageDto) {
    const chat = await this.prisma.chat.findUnique({ where: { id: dto.chatId } });
    if (!chat) throw new NotFoundException('Chat not found');

    // Проверка: только участники чата могут писать
    if (![chat.clientId, chat.sellerId].includes(dto.senderId)) {
      throw new ForbiddenException('Not participant of chat');
    }

    return this.prisma.message.create({
      data: {
        chatId: dto.chatId,
        senderId: dto.senderId,
        content: dto.content,
      },
      include: { sender: true },
    });
  }
}
