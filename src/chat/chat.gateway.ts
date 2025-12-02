import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WsException,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { CreateChatDto } from './dto/create-chat.dto';
import { JoinChatDto } from './dto/join-chat.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { TypingDto } from './dto/typing.dto';
import { jwtConstants } from '../auth/constants';

interface AuthenticatedSocket extends Socket {
  user: { id: string; email: string; role: string };
}

@WebSocketGateway({
  cors: true,
  namespace: 'chat',
})
@UsePipes(new ValidationPipe({ whitelist: true }))
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private chatMembers = new Map<string, Set<string>>();

  constructor(
    private jwtService: JwtService,
    private prisma: PrismaService,
  ) {}

  async handleConnection(client: AuthenticatedSocket) {
    try {
      const token = client.handshake.auth.token || client.handshake.headers['authorization']?.split(' ')[1];

      if (!token) {
        client.emit('error', { message: 'Токен не предоставлен' });
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify(token, {
        secret: jwtConstants.secret,
      });

      client.user = { id: payload.sub, email: payload.email, role: payload.role };
      client.emit('connected', { message: 'Успешно подключено к чату' });
      console.log(`Client connected: ${client.user.id} (${client.id})`);
    } catch (error) {
      client.emit('error', { message: 'Невалидный токен' });
      client.disconnect();
    }
  }

  handleDisconnect(client: AuthenticatedSocket) {
    if (client.user) {
      console.log(`Client disconnected: ${client.user.id} (${client.id})`);
      this.leaveAllChats(client);
    }
  }

  @SubscribeMessage('createChat')
  async handleCreateChat(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() dto: CreateChatDto,
  ) {
    if (!client.user) throw new WsException('Не авторизован');

    const isParticipant = dto.clientId === client.user.id || dto.sellerId === client.user.id;
    if (!isParticipant) {
      throw new WsException('Вы не можете создать этот чат');
    }

    const [clientUser, sellerUser] = await Promise.all([
      this.prisma.user.findUnique({ where: { id: dto.clientId } }),
      this.prisma.user.findUnique({ where: { id: dto.sellerId } }),
    ]);

    if (!clientUser || !sellerUser) {
      throw new WsException('Пользователь не найден');
    }

    const existingChat = await this.prisma.chat.findFirst({
      where: {
        clientId: dto.clientId,
        sellerId: dto.sellerId,
      },
    });

    let chat: any;
    if (existingChat) {
      chat = existingChat;
    } else {
      chat = await this.prisma.chat.create({
        data: {
          clientId: dto.clientId,
          sellerId: dto.sellerId,
        },
      });
    }

    client.emit('chatCreated', chat);
    return chat;
  }

  @SubscribeMessage('joinChat')
  async handleJoinChat(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() dto: JoinChatDto,
  ) {
    const chat = await this.prisma.chat.findUnique({ where: { id: dto.chatId } });
    if (!chat || (chat.clientId !== client.user.id && chat.sellerId !== client.user.id)) {
      throw new WsException('Доступ запрещён');
    }

    client.join(dto.chatId);

    this.server.to(dto.chatId).emit('userOnline', { userId: client.user.id });
  }

  @SubscribeMessage('sendMessage')
  async handleSendMessage(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() dto: SendMessageDto & { chatId: string },
  ) {
    console.log(dto)
    const message = await this.prisma.message.create({
      data: {
        chatId: dto.chatId,
        senderId: client.user.id,
        content: dto.content,
      },
      include: { sender: { select: { id: true, name: true } } },
    });

    this.server.to(dto.chatId).emit('newMessage', message);
  }

  @SubscribeMessage('typing')
  handleTyping(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() dto: TypingDto,
  ) {
    if (!client.user) return;

    const chat = this.prisma.chat.findUnique({ where: { id: dto.chatId } });
    if (!chat) return;

    client.to(dto.chatId).emit('typing', {
      userId: client.user.id,
      isTyping: dto.isTyping,
    });
  }

  @SubscribeMessage('leaveChat')
  handleLeaveChat(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() dto: JoinChatDto,
  ) {
    client.leave(dto.chatId);
    this.chatMembers.get(dto.chatId)?.delete(client.user.id);
    client.to(dto.chatId).emit('userLeft', { userId: client.user.id });
  }

  private leaveAllChats(client: AuthenticatedSocket) {
    client.rooms.forEach((room) => {
      if (room !== client.id) {
        client.leave(room);
        this.chatMembers.get(room)?.delete(client.user.id);
        client.to(room).emit('userLeft', { userId: client.user.id });
      }
    });
  }
}