import { ConnectedSocket, MessageBody, SubscribeMessage, WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import type { Server, Socket } from "socket.io";
import { ChatService } from "./chat.service";

@WebSocketGateway({
  cors: {
    origin: process.env.WEB_ORIGIN ?? "http://localhost:3000",
    credentials: true
  }
})
export class ChatGateway {
  @WebSocketServer()
  server!: Server;

  constructor(private readonly chatService: ChatService) {}

  @SubscribeMessage("chat:join")
  async join(
    @ConnectedSocket() socket: Socket,
    @MessageBody() body: { listingId: string; buyerId: string; sellerId: string }
  ) {
    const chat = await this.chatService.getOrCreateChat(body);
    await socket.join(`chat:${chat.id}`);
    return { event: "chat:joined", data: chat };
  }

  @SubscribeMessage("message:create")
  async createMessage(@MessageBody() body: { chatId: string; senderId: string; body: string }) {
    const message = await this.chatService.createMessage(body);
    this.server.to(`chat:${body.chatId}`).emit("message:new", message);
    return { event: "message:created", data: message };
  }
}
