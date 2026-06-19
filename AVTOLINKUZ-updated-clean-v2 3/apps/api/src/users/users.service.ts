import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async profile(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        listings: { orderBy: { createdAt: "desc" } },
        favorites: { include: { listing: true } }
      }
    });
    if (!user) throw new NotFoundException("User not found");
    return user;
  }
}
