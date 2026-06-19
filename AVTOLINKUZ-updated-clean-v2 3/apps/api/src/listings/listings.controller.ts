import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from "@nestjs/common";
import { IsArray, IsEnum, IsInt, IsOptional, IsString, Max, Min } from "class-validator";
import { Type } from "class-transformer";
import { DriveType, PowertrainType, RangeStandard } from "@prisma/client";
import { ListingsService } from "./listings.service";

export class ListingQueryDto {
  @IsOptional() @IsString() q?: string;
  @IsOptional() @IsString() make?: string;
  @IsOptional() @IsString() region?: string;
  @IsOptional() @IsEnum(PowertrainType) powertrainType?: PowertrainType;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) minPrice?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) maxPrice?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1900) minYear?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Max(2100) maxYear?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) maxMileageKm?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) minRangeKm?: number;
}

export class CreateListingDto {
  @IsString() sellerId!: string;
  @IsOptional() @IsString() title?: string;
  @IsString() make!: string;
  @IsString() model!: string;
  @Type(() => Number) @IsInt() @Min(1900) @Max(2100) year!: number;
  @IsEnum(PowertrainType) powertrainType!: PowertrainType;
  @IsOptional() @IsString() trim?: string;
  @IsOptional() @Type(() => Number) @Min(0) batteryKwh?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) rangeKm?: number;
  @IsOptional() @IsEnum(RangeStandard) rangeStandard?: RangeStandard;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) motorPowerKw?: number;
  @IsOptional() @IsEnum(DriveType) driveType?: DriveType;
  @IsOptional() @IsString() condition?: string;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) @Max(100) batteryHealthPercent?: number;
  @IsOptional() @IsString() customsStatus?: string;
  @IsOptional() @IsString() bodyColor?: string;
  @IsOptional() @IsString() vin?: string;
  @Type(() => Number) @IsInt() @Min(0) priceUsd!: number;
  @Type(() => Number) @IsInt() @Min(0) mileageKm!: number;
  @IsString() region!: string;
  @IsOptional() @IsString() exactLocation?: string;
  @IsOptional() @Type(() => Number) latitude?: number;
  @IsOptional() @Type(() => Number) longitude?: number;
  @IsOptional() @IsString() yandexMapUrl?: string;
  @IsOptional() @IsString() sellerPhone?: string;
  @IsOptional() @IsString() sellerTelegramUsername?: string;
  @IsString() description!: string;
  @IsArray() @IsString({ each: true }) photoUrls!: string[];
}

@Controller("listings")
export class ListingsController {
  constructor(private readonly listingsService: ListingsService) {}

  @Get()
  list(@Query() query: ListingQueryDto) {
    return this.listingsService.list(query);
  }

  @Get(":id/private")
  getPrivate(@Param("id") id: string, @Query("userId") userId?: string) {
    return this.listingsService.getPrivate(id, userId);
  }

  @Get(":id")
  get(@Param("id") id: string) {
    return this.listingsService.get(id);
  }

  @Post()
  create(@Body() dto: CreateListingDto) {
    return this.listingsService.create(dto);
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() dto: Partial<CreateListingDto>) {
    return this.listingsService.update(id, dto);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.listingsService.remove(id);
  }
}
