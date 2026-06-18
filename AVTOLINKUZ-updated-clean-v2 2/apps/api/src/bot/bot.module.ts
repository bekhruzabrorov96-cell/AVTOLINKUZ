import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { ListingsModule } from "../listings/listings.module";
import { AiModule } from "../ai/ai.module";
import { BotService } from "./bot.service";

@Module({
  imports: [AuthModule, ListingsModule, AiModule],
  providers: [BotService]
})
export class BotModule {}
