import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma, type Listing, type User } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import type { CreateListingDto, ListingQueryDto } from "./listings.controller";

type ListingWithSeller = Listing & { seller: User };

@Injectable()
export class ListingsService {
  constructor(private readonly prisma: PrismaService) {}

  list(query: ListingQueryDto) {
    const where: Prisma.ListingWhereInput = {
      status: "ACTIVE",
      make: query.make ? { equals: query.make, mode: "insensitive" } : undefined,
      region: query.region ? { equals: query.region, mode: "insensitive" } : undefined,
      powertrainType: query.powertrainType,
      priceUsd: {
        gte: query.minPrice,
        lte: query.maxPrice
      },
      year: {
        gte: query.minYear,
        lte: query.maxYear
      },
      mileageKm: {
        lte: query.maxMileageKm
      },
      rangeKm: {
        gte: query.minRangeKm
      },
      OR: query.q
        ? [
            { title: { contains: query.q, mode: "insensitive" } },
            { make: { contains: query.q, mode: "insensitive" } },
            { model: { contains: query.q, mode: "insensitive" } },
            { trim: { contains: query.q, mode: "insensitive" } },
            { description: { contains: query.q, mode: "insensitive" } }
          ]
        : undefined
    };

    return this.prisma.listing.findMany({
      where,
      include: { seller: true },
      orderBy: { createdAt: "desc" },
      take: 50
    }).then((listings) => listings.map((listing) => this.toPublicListing(listing)));
  }

  async get(id: string) {
    const listing = await this.prisma.listing.findUnique({
      where: { id },
      include: { seller: true }
    });
    if (!listing) throw new NotFoundException("Listing not found");
    return this.toPublicListing(listing);
  }

  async getPrivate(id: string, userId?: string) {
    if (!userId) throw new ForbiddenException("Kontaktlarni ko'rish uchun telefon raqam bilan kiring");
    const listing = await this.prisma.listing.findUnique({
      where: { id },
      include: { seller: true }
    });
    if (!listing) throw new NotFoundException("Listing not found");
    return this.toPrivateListing(listing);
  }

  create(dto: CreateListingDto) {
    return this.prisma.listing.create({
      data: {
        ...dto,
        title: dto.title || `${dto.make} ${dto.model} ${dto.year}`,
        rangeStandard: dto.rangeStandard ?? "UNKNOWN",
        driveType: dto.driveType ?? "UNKNOWN"
      },
      include: { seller: true }
    }).then((listing) => this.toPrivateListing(listing));
  }

  update(id: string, dto: Partial<CreateListingDto>) {
    return this.prisma.listing.update({
      where: { id },
      data: dto,
      include: { seller: true }
    }).then((listing) => this.toPrivateListing(listing));
  }

  remove(id: string) {
    return this.prisma.listing.update({
      where: { id },
      data: { status: "ARCHIVED" }
    });
  }

  async listBySeller(sellerId: string) {
    const listings = await this.prisma.listing.findMany({
      where: { sellerId },
      include: { seller: true },
      orderBy: { createdAt: "desc" }
    });

    return listings.map((listing) => this.toPrivateListing(listing));
  }

  markSold(id: string, sellerId: string) {
    return this.prisma.listing.updateMany({
      where: { id, sellerId },
      data: { status: "SOLD" }
    });
  }

  archiveBySeller(id: string, sellerId: string) {
    return this.prisma.listing.updateMany({
      where: { id, sellerId },
      data: { status: "ARCHIVED" }
    });
  }

  toPublicListing(listing: ListingWithSeller) {
    const { exactLocation, latitude, longitude, yandexMapUrl, sellerPhone, sellerTelegramUsername, seller, ...publicListing } = listing;
    void exactLocation;
    void latitude;
    void longitude;
    void yandexMapUrl;
    void sellerPhone;
    void sellerTelegramUsername;

    return {
      ...publicListing,
      seller: {
        id: seller.id,
        name: seller.name,
        region: seller.region ?? undefined,
        createdAt: seller.createdAt
      }
    };
  }

  toPrivateListing(listing: ListingWithSeller) {
    return {
      ...this.toPublicListing(listing),
      exactLocation: listing.exactLocation ?? undefined,
      latitude: listing.latitude ?? undefined,
      longitude: listing.longitude ?? undefined,
      yandexMapUrl: listing.yandexMapUrl ?? this.buildYandexMapUrl(listing.latitude, listing.longitude),
      sellerPhone: listing.sellerPhone ?? listing.seller.phone ?? undefined,
      sellerTelegramUsername: listing.sellerTelegramUsername ?? listing.seller.telegramUsername ?? undefined,
      seller: {
        id: listing.seller.id,
        phone: listing.seller.phone ?? listing.sellerPhone ?? undefined,
        telegramId: listing.seller.telegramId ?? undefined,
        telegramUsername: listing.seller.telegramUsername ?? listing.sellerTelegramUsername ?? undefined,
        name: listing.seller.name,
        region: listing.seller.region ?? undefined,
        createdAt: listing.seller.createdAt
      }
    };
  }

  private buildYandexMapUrl(latitude: number | null, longitude: number | null) {
    if (latitude === null || longitude === null) return undefined;
    return `https://yandex.com/maps/?ll=${longitude},${latitude}&z=16&pt=${longitude},${latitude},pm2rdm`;
  }
}
