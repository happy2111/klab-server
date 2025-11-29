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

  private cleanUser(user: any) {
    const { password, ...rest } = user;
    return rest;
  }

  async register(dto: RegisterDto) {
    const hashed = await bcrypt.hash(dto.password, 10);
    const user = this.cleanUser(
      await this.prisma.user.create({
        data: {
          email: dto.email,
          password: hashed,
          name: dto.name,
          role: dto.role || 'CLIENT',
        },
      })
    );
    const  tokens = this.getTokens(user.id, user.email, user.role)
    return {user, tokens };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      include: { products: true }
    });

    if (!user) throw new UnauthorizedException('Invalid credentials');

    const match = await bcrypt.compare(dto.password, user.password);
    if (!match) throw new UnauthorizedException('Invalid credentials');

    const clean = this.cleanUser(user);
    const tokens = this.getTokens(clean.id, clean.email, clean.role);

    return { user: clean, tokens };
  }

  async logout() {
    return { message: 'Logged out' };
  }

  async refresh(userId: string, role: string, email: string) {
    return this.getTokens(userId, email, role);
  }

  private getTokens(userId: string, email: string, role: string) {
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
