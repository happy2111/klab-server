import { IsString, IsOptional, IsNumber, IsBoolean } from 'class-validator';

export class CreateProductDto {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  price: number;

  @IsString()
  @IsOptional()
  photo?: string;

  @IsNumber()
  @IsOptional()
  stock?: number;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsString()
  categoryId: string;
}
