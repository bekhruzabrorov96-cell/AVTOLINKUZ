import { Module } from "@nestjs/common";
import { AiController } from "./ai.controller";
import { AiSearchService } from "./ai-search.service";
import { ListingsModule } from "../listings/listings.module";

@Module({
  imports: [ListingsModule],
  controllers: [AiController],
  providers: [AiSearchService],
  exports: [AiSearchService]
})
export class AiModule {}
