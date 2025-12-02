import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';

interface AuthSocket extends Socket {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

@Injectable()
export class WsJwtGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    try {
      const client: AuthSocket = context.switchToWs().getClient();

      // Если пользователь уже аутентифицирован
      if (client.user) {
        return true;
      }

      // Получаем токен из handshake
      const token =
        client.handshake.auth.token ||
        client.handshake.headers.authorization?.split(' ')[1];

      if (!token) {
        throw new WsException('Unauthorized: No token provided');
      }

      // Верифицируем токен
      const payload = this.jwtService.verify(token);

      // Добавляем пользователя в socket
      client.user = {
        id: payload.sub,
        email: payload.email,
        role: payload.role,
      };

      return true;
    } catch (error) {
      throw new WsException('Unauthorized: Invalid token');
    }
  }
}