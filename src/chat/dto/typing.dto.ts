import {IsNotEmpty, IsUUID} from "class-validator";

export class TypingDto {
  @IsUUID()
  @IsNotEmpty()
  chatId: string;

  @IsNotEmpty()
  isTyping: boolean;
}