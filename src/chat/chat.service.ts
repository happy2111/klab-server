// chat.service.ts
import {ForbiddenException, Injectable} from "@nestjs/common";
import {PrismaService} from "../prisma/prisma.service";

@Injectable()
export class ChatService {
  constructor(private prisma: PrismaService) {}

  // Получить все чаты текущего пользователя
  async getUserChats(userId: string) {
    const chatsAsClient = await this.prisma.chat.findMany({
      where: { clientId: userId },
      include: {
        seller: { select: { id: true, name: true, email: true } },
        client: { select: { id: true, name: true, email: true } },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    const chatsAsSeller = await this.prisma.chat.findMany({
      where: { sellerId: userId },
      include: {
        seller: { select: { id: true, name: true, email: true } },
        client: { select: { id: true, name: true, email: true } },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    return [...chatsAsClient, ...chatsAsSeller].sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    );
  }

  // Создать чат или вернуть существующий
  async createOrGetChat(clientId: string, sellerId: string) {
    const existing = await this.prisma.chat.findFirst({
      where: { clientId, sellerId },
    });

    if (existing) return existing;

    return this.prisma.chat.create({
      data: { clientId, sellerId },
    });
  }

  // Получить чат + все сообщения (для истории при первом входе)
  async getChatWithMessages(chatId: string, userId: string) {
    const chat = await this.prisma.chat.findUnique({
      where: { id: chatId },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
          include: {
            sender: { select: { id: true, name: true } },
          },
        },
        client: { select: { id: true, name: true } },
        seller: { select: { id: true, name: true } },
      },
    });

    if (!chat || (chat.clientId !== userId && chat.sellerId !== userId)) {
      throw new ForbiddenException('Доступ запрещён');
    }

    return chat;
  }
}