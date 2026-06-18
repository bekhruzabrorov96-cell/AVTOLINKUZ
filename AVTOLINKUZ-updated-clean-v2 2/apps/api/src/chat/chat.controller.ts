import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { IsString } from "class-validator";
import { ChatService } from "./chat.service";

class StartChatDto {
  @IsString()
  listingId!: string;

  @IsString()
  buyerId!: string;

  @IsString()
  sellerId!: string;
}

class CreateChatMessageDto {
  @IsString()
  senderId!: string;

  @IsString()
  body!: string;
}

@Controller("chat")
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post("start")
  start(@Body() dto: StartChatDto) {
    return this.chatService.getOrCreateChat(dto);
  }

  @Get(":chatId/messages")
  messages(@Param("chatId") chatId: string) {
    return this.chatService.listMessages(chatId);
  }

  @Post(":chatId/messages")
  createMessage(@Param("chatId") chatId: string, @Body() dto: CreateChatMessageDto) {
    return this.chatService.createMessage({
      chatId,
      senderId: dto.senderId,
      body: dto.body
    });
  }
}
