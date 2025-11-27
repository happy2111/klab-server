import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { Role } from '@prisma/client';

export class RegisterDto {
  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  password: string;

  @IsString()
  name?: string;

  role?: Role;
}
