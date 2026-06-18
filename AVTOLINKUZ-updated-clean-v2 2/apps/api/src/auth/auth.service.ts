import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { createHmac } from "crypto";
import { PrismaService } from "../prisma/prisma.service";

export interface PhoneLoginInput {
  phone: string;
  name?: string;
}

interface PhoneVerifyInput extends PhoneLoginInput {
  code: string;
}

export interface TelegramLoginInput {
  telegramId: string;
  name: string;
  username?: string;
  hash?: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService
  ) {}

  async loginWithPhone(input: PhoneLoginInput) {
    const user = await this.prisma.user.upsert({
      where: { phone: input.phone },
      update: { name: input.name ?? "Foydalanuvchi" },
      create: { phone: input.phone, name: input.name ?? "Foydalanuvchi" }
    });

    return this.session(user.id);
  }

  requestPhoneOtp(input: PhoneLoginInput) {
    return {
      phone: input.phone,
      expiresInSeconds: 300,
      message: "Tasdiqlash kodi yuborildi. MVP rejimida test koddan foydalaning."
    };
  }

  async verifyPhoneOtp(input: PhoneVerifyInput) {
    const expectedCode = this.config.get<string>("OTP_MOCK_CODE") ?? "111111";
    if (input.code !== expectedCode) throw new UnauthorizedException("Tasdiqlash kodi noto'g'ri");
    return this.loginWithPhone(input);
  }

  async loginWithTelegram(input: TelegramLoginInput) {
    this.verifyTelegramHash(input);

    const user = await this.prisma.user.upsert({
      where: { telegramId: input.telegramId },
      update: { name: input.name, telegramUsername: input.username },
      create: { telegramId: input.telegramId, telegramUsername: input.username, name: input.name }
    });

    return this.session(user.id);
  }

  async loginTelegramBotUser(input: TelegramLoginInput) {
    const user = await this.prisma.user.upsert({
      where: { telegramId: input.telegramId },
      update: { name: input.name, telegramUsername: input.username },
      create: { telegramId: input.telegramId, telegramUsername: input.username, name: input.name }
    });

    return this.session(user.id);
  }

  private session(userId: string) {
    return {
      userId,
      accessToken: this.jwt.sign({ sub: userId })
    };
  }

  private verifyTelegramHash(input: TelegramLoginInput) {
    const token = this.config.get<string>("TELEGRAM_BOT_TOKEN");
    if (!token || !input.hash) return;

    const payload = Object.entries(input)
      .filter(([key]) => key !== "hash")
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${value}`)
      .join("\n");

    const secret = createHmac("sha256", "WebAppData").update(token).digest();
    const expected = createHmac("sha256", secret).update(payload).digest("hex");
    if (expected !== input.hash) throw new UnauthorizedException("Invalid Telegram login hash");
  }
}
