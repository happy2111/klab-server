import { IsString } from 'class-validator';

export class CreateChatDto {
  @IsString()
  clientId: string;

  @IsString()
  sellerId: string;
}
