import { CreateMessageDto } from "./dto/create-message.dto";
import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage, WebSocketGateway, WebSocketServer
} from "@nestjs/websockets";
import {Server, Socket} from "socket.io";
import {WsJwtGuard} from "./guards/ws-jwt.guard";
import {UseGuards} from "@nestjs/common";
import {ChatService} from "./chat.service";

@WebSocketGateway({ cors: { origin: '*', credentials: true } })
@UseGuards(WsJwtGuard)
export class ChatGateway {
  @WebSocketServer()
  server: Server;

  constructor(private chatService: ChatService) {}

  async handleConnection(@ConnectedSocket() client: Socket) {
    console.log('WS Connected:', client.id, client.data.user?.sub);
  }

  async handleDisconnect(@ConnectedSocket() client: Socket) {
    console.log('WS Disconnected:', client.id);
  }

  @SubscribeMessage('join_chat')
  handleJoin(@MessageBody() chatId: string, @ConnectedSocket() client: Socket) {
    client.join(`chat_${chatId}`);
  }

  @SubscribeMessage('leave_chat')
  handleLeave(@MessageBody() chatId: string, @ConnectedSocket() client: Socket) {
    client.leave(`chat_${chatId}`);
  }

  @SubscribeMessage('send_message')
  async handleMessage(
    @MessageBody() dto: CreateMessageDto,
    @ConnectedSocket() client: Socket,
  ) {
    // Дополнительная проверка (на всякий случай)
    const userId = client.data.user.sub;
    if (dto.senderId !== userId) {
      client.emit('error', 'Unauthorized sender');
      return;
    }

    const message = await this.chatService.createMessage(dto);
    this.server.to(`chat_${dto.chatId}`).emit('new_message', {
      ...message,
      tempId: dto.tempId,
    });


    this.server.to(`chat_${dto.chatId}`).emit('new_message', message);
  }
}