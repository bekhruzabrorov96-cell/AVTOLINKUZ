import { Body, Controller, Get, Post, Query } from "@nestjs/common";
import { IsOptional, IsString } from "class-validator";
import { AiSearchService } from "./ai-search.service";

class AiSearchDto {
  @IsString()
  query!: string;

  @IsOptional()
  @IsString()
  userId?: string;
}

@Controller("ai")
export class AiController {
  constructor(private readonly aiSearchService: AiSearchService) {}

  @Post("search")
  search(@Body() dto: AiSearchDto) {
    return this.aiSearchService.search(dto.query, dto.userId);
  }

  @Post("parse")
  parse(@Body() dto: AiSearchDto) {
    return this.aiSearchService.parseQuery(dto.query);
  }

  @Post("suggestions")
  suggestions(@Body() dto: AiSearchDto) {
    return this.aiSearchService.suggestQueries(dto.query);
  }

  @Get("history")
  history(@Query("userId") userId: string) {
    return this.aiSearchService.history(userId);
  }
}
