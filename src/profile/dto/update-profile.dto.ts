import { IsOptional, IsString, IsEmail, IsNotEmpty } from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
    // Предполагаем, что телефон - это строка
  phone?: string;

  @IsOptional()
  @IsEmail()
  @IsNotEmpty()
  email?: string;
}