import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { jwtConstants } from './constants';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService, private jwtService: JwtService) {}

  async register(dto: RegisterDto) {
    const hashed = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        password: hashed,
        name: dto.name,
        role: dto.role || 'CLIENT',
      },
    });
    return this.getTokens(user.id, user.email, user.role);
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const match = await bcrypt.compare(dto.password, user.password);
    if (!match) throw new UnauthorizedException('Invalid credentials');

    return this.getTokens(user.id, user.email, user.role);
  }

  async logout() {
    return { message: 'Logged out' };
  }

  async refresh(userId: string, role: string, email: string) {
    return this.getTokens(userId, email, role);
  }

  private async getTokens(userId: string, email: string, role: string) {
    const payload = { sub: userId, email, role };
    const accessToken = this.jwtService.sign(payload, {
      secret: jwtConstants.secret,
      expiresIn: jwtConstants.accessExpiresIn as import('@nestjs/jwt').JwtSignOptions['expiresIn'],
    });
    const refreshToken = this.jwtService.sign(payload, {
      secret: jwtConstants.refreshSecret,
      expiresIn: jwtConstants.refreshExpiresIn as import('@nestjs/jwt').JwtSignOptions['expiresIn'],
    });
    return { accessToken, refreshToken };
  }
}
