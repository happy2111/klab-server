import {IsString, IsUUID} from 'class-validator';

export class CreateChatDto {
  @IsUUID()
  clientId: string;

  @IsUUID()
  sellerId: string;
}
