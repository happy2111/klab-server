import { WebSocketGateway, SubscribeMessage, MessageBody, ConnectedSocket, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';
import { CreateMessageDto } from './dto/create-message.dto';

@WebSocketGateway({ cors: true })
export class ChatGateway {
  @WebSocketServer()
  server: Server;

  constructor(private chatService: ChatService) {}

  @SubscribeMessage('join_chat')
  async handleJoin(@MessageBody() chatId: string, @ConnectedSocket() client: Socket) {
    client.join(`chat_${chatId}`);
  }

  @SubscribeMessage('send_message')
  async handleMessage(@MessageBody() dto: CreateMessageDto) {
    const message = await this.chatService.createMessage(dto);
    this.server.to(`chat_${dto.chatId}`).emit('new_message', message);
  }
}
