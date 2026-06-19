import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class ChatService {
  constructor(private readonly prisma: PrismaService) {}

  getOrCreateChat(input: { listingId: string; buyerId: string; sellerId: string }) {
    return this.prisma.chat.upsert({
      where: {
        listingId_buyerId_sellerId: input
      },
      update: {},
      create: input
    });
  }

  listMessages(chatId: string) {
    return this.prisma.message.findMany({
      where: { chatId },
      include: { sender: true },
      orderBy: { createdAt: "asc" },
      take: 100
    });
  }

  createMessage(input: { chatId: string; senderId: string; body: string }) {
    return this.prisma.message.create({
      data: input,
      include: { sender: true }
    });
  }
}
