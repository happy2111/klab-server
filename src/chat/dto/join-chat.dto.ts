import {IsNotEmpty, IsUUID} from "class-validator";

export class JoinChatDto {
  @IsUUID()
  @IsNotEmpty()
  chatId: string;
}