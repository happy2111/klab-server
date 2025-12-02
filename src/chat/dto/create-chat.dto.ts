  import { IsString, IsUUID, IsNotEmpty } from 'class-validator';

  export class CreateChatDto {
    @IsUUID()
    @IsNotEmpty()
    clientId: string;

    @IsUUID()
    @IsNotEmpty()
    sellerId: string;
  }
