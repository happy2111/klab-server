import { Controller, Post, Body, UseGuards, Req, Res } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import type { Response, Request } from 'express';
import {JwtRefreshGuard} from "./guards/jwt-refresh.guard";

const isProd = process.env.NODE_ENV === 'production';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  async register(@Body() dto: RegisterDto, @Res({ passthrough: true }) res: Response) {
    const tokens = await this.authService.register(dto);
    res.cookie('Refresh', tokens.refreshToken, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000,
      sameSite: isProd ? 'none' : 'lax',
      secure: isProd,
      path: '/',
    });
    return { accessToken: tokens.accessToken };
  }

  @Post('login')
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
    const tokens = await this.authService.login(dto);
    res.cookie('Refresh', tokens.refreshToken, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000,
      sameSite: isProd ? 'none' : 'lax',
      secure: isProd,
      path: '/',
    });
    return { accessToken: tokens.accessToken };
  }

  @UseGuards(JwtRefreshGuard)
  @Post('refresh')
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const user: any = req.user;
    const tokens = await this.authService.refresh(user.id, user.role, user.email);
    res.cookie('Refresh', tokens.refreshToken, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000,
      sameSite: isProd ? 'none' : 'lax',
      secure: isProd,
      path: '/',
    });
    return { accessToken: tokens.accessToken };
  }

  @Post('logout')
  async logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('Refresh', { sameSite: isProd ? 'none' : 'lax', secure: isProd, path: '/' });
    return this.authService.logout();
  }
}
