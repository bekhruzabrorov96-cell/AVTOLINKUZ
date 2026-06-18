import { Injectable } from "@nestjs/common";
import { DriveType, PowertrainType, Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { ListingsService } from "../listings/listings.service";

export interface ParsedAiQuery {
  q: string;
  make?: string;
  model?: string;
  region?: string;
  powertrainType?: PowertrainType;
  driveType?: DriveType;
  minPrice?: number;
  maxPrice?: number;
  minYear?: number;
  maxYear?: number;
  maxMileageKm?: number;
  minRangeKm?: number;
  minBatteryHealthPercent?: number;
  customsStatus?: string;
  familyUse?: boolean;
  premiumUse?: boolean;
  cityUse?: boolean;
  cheapIntent?: boolean;
  longRangeIntent?: boolean;
  lowMileageIntent?: boolean;
  importedIntent?: boolean;
  tokens: string[];
}

type AiListing = {
  id: string;
  title: string;
  make: string;
  model: string;
  year: number;
  powertrainType: PowertrainType;
  trim: string | null;
  batteryKwh: number | null;
  rangeKm: number | null;
  rangeStandard: string;
  motorPowerKw: number | null;
  driveType: DriveType;
  condition: string | null;
  batteryHealthPercent: number | null;
  customsStatus: string | null;
  bodyColor: string | null;
  vin: string | null;
  priceUsd: number;
  mileageKm: number;
  region: string;
  description: string;
  photoUrls: string[];
  status: string;
  seller: unknown;
  createdAt: Date;
  updatedAt: Date;
};

interface ScoreResult {
  score: number;
  reasons: string[];
  warnings: string[];
}

@Injectable()
export class AiSearchService {
  private readonly knownMakes = [
    "BYD",
    "Li Auto",
    "Zeekr",
    "Nio",
    "Xpeng",
    "Avatr",
    "Aito",
    "Leapmotor",
    "Denza",
    "Geely",
    "Changan",
    "Chery",
    "Voyah",
    "HiPhi"
  ];

  private readonly knownModels = [
    "Song Plus",
    "Song",
    "Seal",
    "Han",
    "Tang",
    "Dolphin",
    "L7",
    "L8",
    "L9",
    "001",
    "007",
    "X",
    "P7",
    "G6",
    "ET5",
    "ES6"
  ];

  private readonly regions = [
    "Toshkent",
    "Samarqand",
    "Buxoro",
    "Andijon",
    "Fargona",
    "Namangan",
    "Qashqadaryo",
    "Surxondaryo",
    "Xorazm",
    "Navoiy",
    "Jizzax",
    "Sirdaryo",
    "Qoraqalpogiston"
  ];

  constructor(
    private readonly prisma: PrismaService,
    private readonly listingsService: ListingsService
  ) {}

  async search(query: string, userId?: string) {
    const filters = this.parseQuery(query);

    let listings = await this.prisma.listing.findMany({
      where: this.buildCandidateWhere(filters),
      include: { seller: true },
      orderBy: [{ createdAt: "desc" }],
      take: 100
    });

    if (!listings.length) {
      listings = await this.prisma.listing.findMany({
        where: { status: "ACTIVE" },
        include: { seller: true },
        orderBy: [{ createdAt: "desc" }],
        take: 100
      });
    }

    const results = listings
      .map((listing) => {
        const scored = this.scoreListing(listing as AiListing, filters);
        return {
          listing: this.listingsService.toPublicListing(listing),
          score: scored.score,
          confidenceLabel: this.confidenceLabel(scored.score),
          matchedFilters: this.toMatchedFilters(filters),
          explanationUz: this.explain(scored),
          nextActionUz: this.nextAction(scored.score)
        };
      })
      .filter((result) => result.score >= 28)
      .sort((a, b) => b.score - a.score)
      .slice(0, 10)
      .map((result, index) => ({ ...result, rank: index + 1 }));

    await this.logSearch({
      userId,
      query,
      parsed: this.toMatchedFilters(filters),
      resultCount: results.length,
      topListingId: results[0]?.listing.id
    });

    return results;
  }

  parseQuery(query: string): ParsedAiQuery {
    const normalized = this.normalize(query);
    const tokens = this.tokenize(normalized);
    const maxPrice = this.extractMaxPrice(normalized);
    const yearRange = this.extractYearRange(normalized);

    return {
      q: query,
      make: this.extractMake(normalized),
      model: this.extractModel(normalized),
      region: this.extractRegion(normalized),
      powertrainType: this.extractPowertrain(normalized),
      driveType: this.extractDriveType(normalized),
      maxPrice,
      minPrice: this.extractMinPrice(normalized),
      minYear: yearRange.minYear,
      maxYear: yearRange.maxYear,
      maxMileageKm: this.extractMaxMileage(normalized),
      minRangeKm: this.extractMinRange(normalized),
      minBatteryHealthPercent: this.extractBatteryHealth(normalized),
      customsStatus: this.extractCustomsStatus(normalized),
      familyUse: this.includesAny(normalized, ["oila", "oilaviy", "семья", "семей", "family", "7 joy", "7 мест", "keng"]),
      premiumUse: this.includesAny(normalized, ["premium", "lyuks", "люкс", "komfort", "qulay", "max", "flagship"]),
      cityUse: this.includesAny(normalized, ["shahar", "город", "city", "kompakt", "kichik"]),
      cheapIntent: this.includesAny(normalized, ["arzon", "дешев", "cheap", "byudjet", "budget"]),
      longRangeIntent: this.includesAny(normalized, ["uzoq", "range", "zapasi", "zapas", "дальн", "500+", "600+", "700+"]),
      lowMileageIntent: this.includesAny(normalized, ["yurishi kam", "kam yurgan", "probeg kam", "малый пробег", "low mileage"]),
      importedIntent: this.includesAny(normalized, ["xitoydan", "import", "olib kelingan", "привез", "из китая"]),
      tokens
    };
  }

  suggestQueries(query: string) {
    const filters = this.parseQuery(query);
    const suggestions = [
      filters.maxPrice ? undefined : "30 ming dollargacha",
      filters.powertrainType ? undefined : "REEV yoki toza EV",
      filters.maxMileageKm ? undefined : "50 ming km gacha",
      filters.minRangeKm ? undefined : "500 km dan yuqori",
      filters.region ? undefined : "Toshkent",
      filters.minBatteryHealthPercent ? undefined : "batareya 90% dan yuqori"
    ].filter((item): item is string => Boolean(item));

    return {
      parsed: this.toMatchedFilters(filters),
      suggestions
    };
  }

  async history(userId: string) {
    return this.prisma.aiSearchLog.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 20
    });
  }

  private async logSearch(input: { userId?: string; query: string; parsed: Record<string, unknown>; resultCount: number; topListingId?: string }) {
    await this.prisma.aiSearchLog.create({
      data: {
        userId: input.userId,
        query: input.query,
        parsed: input.parsed as Prisma.InputJsonValue,
        resultCount: input.resultCount,
        topListingId: input.topListingId
      }
    }).catch(() => undefined);
  }

  private buildCandidateWhere(filters: ParsedAiQuery): Prisma.ListingWhereInput {
    const or = this.buildBroadTextWhere(filters);
    if (!or?.length) return { status: "ACTIVE" };
    return { status: "ACTIVE", OR: or };
  }

  private buildBroadTextWhere(filters: ParsedAiQuery): Prisma.ListingWhereInput[] | undefined {
    const conditions: Prisma.ListingWhereInput[] = [];
    if (filters.make) conditions.push({ make: { equals: filters.make, mode: "insensitive" } });
    if (filters.model) conditions.push({ model: { contains: filters.model, mode: "insensitive" } });
    if (filters.region) conditions.push({ region: { equals: filters.region, mode: "insensitive" } });
    if (filters.powertrainType) conditions.push({ powertrainType: filters.powertrainType });

    for (const token of filters.tokens.slice(0, 8)) {
      conditions.push(
        { title: { contains: token, mode: "insensitive" } },
        { make: { contains: token, mode: "insensitive" } },
        { model: { contains: token, mode: "insensitive" } },
        { trim: { contains: token, mode: "insensitive" } },
        { description: { contains: token, mode: "insensitive" } }
      );
    }

    return conditions.length ? conditions : undefined;
  }

  private toMatchedFilters(filters: ParsedAiQuery) {
    return {
      q: filters.q,
      make: filters.make,
      model: filters.model,
      region: filters.region,
      powertrainType: filters.powertrainType,
      driveType: filters.driveType,
      minPrice: filters.minPrice,
      maxPrice: filters.maxPrice,
      minYear: filters.minYear,
      maxYear: filters.maxYear,
      maxMileageKm: filters.maxMileageKm,
      minRangeKm: filters.minRangeKm,
      minBatteryHealthPercent: filters.minBatteryHealthPercent,
      customsStatus: filters.customsStatus
    };
  }

  private scoreListing(listing: AiListing, filters: ParsedAiQuery): ScoreResult {
    let score = 48;
    const reasons: string[] = [];
    const warnings: string[] = [];
    const haystack = this.normalize([
      listing.title,
      listing.make,
      listing.model,
      listing.trim,
      listing.condition,
      listing.customsStatus,
      listing.bodyColor,
      listing.description
    ].filter(Boolean).join(" "));

    if (filters.make) {
      if (this.same(filters.make, listing.make)) {
        score += 18;
        reasons.push(`${listing.make} markasi mos`);
      } else {
        score -= 20;
        warnings.push(`marka ${filters.make} emas`);
      }
    }

    if (filters.model) {
      if (haystack.includes(this.normalize(filters.model))) {
        score += 14;
        reasons.push(`${filters.model} modeli mos`);
      } else {
        score -= 10;
      }
    }

    if (filters.powertrainType) {
      if (listing.powertrainType === filters.powertrainType) {
        score += 16;
        reasons.push(`${listing.powertrainType} turi mos`);
      } else {
        score -= 16;
        warnings.push(`turi ${listing.powertrainType}, so'rov ${filters.powertrainType}`);
      }
    }

    if (filters.driveType && listing.driveType === filters.driveType) {
      score += 8;
      reasons.push(`${listing.driveType} privod mos`);
    }

    if (filters.region) {
      if (this.same(filters.region, listing.region)) {
        score += 10;
        reasons.push(`${listing.region} hududi mos`);
      } else {
        score -= 6;
      }
    }

    if (filters.maxPrice) {
      const priceRatio = listing.priceUsd / filters.maxPrice;
      if (priceRatio <= 1) {
        score += priceRatio <= 0.9 ? 18 : 12;
        reasons.push("narxi byudjetga mos");
      } else if (priceRatio <= 1.12) {
        score -= 4;
        warnings.push("narxi byudjetdan biroz yuqori");
      } else {
        score -= 28;
        warnings.push("narxi byudjetdan yuqori");
      }
    } else if (filters.cheapIntent && listing.priceUsd <= 30000) {
      score += 8;
      reasons.push("arzon segmentga yaqin");
    }

    if (filters.minPrice && listing.priceUsd >= filters.minPrice) score += 4;

    if (filters.minYear) {
      if (listing.year >= filters.minYear) {
        score += 10;
        reasons.push("yili yangi");
      } else {
        score -= 10;
        warnings.push("yili so'rovdan eskiroq");
      }
    }

    if (filters.maxYear && listing.year <= filters.maxYear) score += 4;

    if (filters.maxMileageKm) {
      if (listing.mileageKm <= filters.maxMileageKm) {
        score += 12;
        reasons.push("probegi kam");
      } else {
        const overRatio = listing.mileageKm / filters.maxMileageKm;
        score -= overRatio > 2 ? 18 : 8;
        warnings.push("probegi so'rovdan yuqori");
      }
    } else if (filters.lowMileageIntent && listing.mileageKm <= 50000) {
      score += 8;
      reasons.push("ishlatilgan bo'lsa ham yurishi kam");
    }

    if (filters.minRangeKm) {
      if ((listing.rangeKm ?? 0) >= filters.minRangeKm) {
        score += 12;
        reasons.push("yurish masofasi mos");
      } else {
        score -= 12;
        warnings.push("yurish zaxirasi so'rovdan past");
      }
    } else if (filters.longRangeIntent && (listing.rangeKm ?? 0) >= 500) {
      score += 8;
      reasons.push("yurish zaxirasi yaxshi");
    }

    if (filters.minBatteryHealthPercent) {
      if ((listing.batteryHealthPercent ?? 0) >= filters.minBatteryHealthPercent) {
        score += 9;
        reasons.push("batareya holati yaxshi");
      } else {
        score -= 12;
        warnings.push("batareya holati so'rovdan past yoki kiritilmagan");
      }
    } else if ((listing.batteryHealthPercent ?? 0) >= 90) {
      score += 4;
    }

    if (filters.customsStatus && listing.customsStatus && this.normalize(listing.customsStatus).includes(filters.customsStatus)) {
      score += 7;
      reasons.push("bojxona holati mos");
    }

    if (filters.familyUse && this.familyScoreText(haystack)) {
      score += 12;
      reasons.push("oilaviy foydalanishga mos");
    }

    if (filters.cityUse && this.cityScoreText(haystack, listing)) {
      score += 8;
      reasons.push("shahar uchun qulay");
    }

    if (filters.premiumUse && this.premiumScoreText(haystack)) {
      score += 9;
      reasons.push("komplektatsiyasi yuqori");
    }

    if (filters.importedIntent && this.importScoreText(haystack)) {
      score += 6;
      reasons.push("Xitoydan olib kelingan e'longa mos");
    }

    const tokenHits = filters.tokens.filter((token) => haystack.includes(token)).length;
    score += Math.min(10, tokenHits * 2);

    return {
      score: Math.max(0, Math.min(100, Math.round(score))),
      reasons: [...new Set(reasons)].slice(0, 5),
      warnings: [...new Set(warnings)].slice(0, 3)
    };
  }

  private explain(scored: ScoreResult) {
    const reasons = scored.reasons.length ? scored.reasons.join(", ") : "so'rovga umumiy jihatdan yaqin";
    const warning = scored.warnings.length ? ` Eslatma: ${scored.warnings.join(", ")}.` : "";
    return `Nega mos: ${reasons}. Moslik: ${scored.score}%.${warning}`;
  }

  private confidenceLabel(score: number) {
    if (score >= 78) return "high";
    if (score >= 58) return "medium";
    return "low";
  }

  private nextAction(score: number) {
    if (score >= 78) return "Kontakt va aniq manzilni ko'rish uchun telefon raqam bilan kiring.";
    if (score >= 58) return "Mos keladi, lekin narx, probeg va yurish zaxirasini tekshiring.";
    return "Bu yaqin variant. Aniqroq natija uchun byudjet, probeg yoki yurish zaxirasini kiriting.";
  }

  private extractMake(query: string) {
    return this.knownMakes.find((make) => query.includes(this.normalize(make)));
  }

  private extractModel(query: string) {
    return this.knownModels.find((model) => query.includes(this.normalize(model)));
  }

  private extractRegion(query: string) {
    return this.regions.find((region) => query.includes(this.normalize(region)));
  }

  private extractPowertrain(query: string): PowertrainType | undefined {
    if (this.includesAny(query, ["reev", "range extender", "benzinda zaryad", "benzin generator"])) return "REEV";
    if (this.includesAny(query, ["phev", "plug in", "plugin"])) return "PHEV";
    if (this.includesAny(query, ["hybrid", "gibrid", "гибрид"])) return "HYBRID";
    if (this.includesAny(query, ["faqat ev", "toza ev", "pure ev", "100% ev", "bev"])) return "EV";
    return undefined;
  }

  private extractDriveType(query: string): DriveType | undefined {
    if (this.includesAny(query, ["awd", "4x4", "4wd", "to'liq privod", "полный привод"])) return "AWD";
    if (this.includesAny(query, ["rwd", "orqa privod", "задний привод"])) return "RWD";
    if (this.includesAny(query, ["fwd", "old privod", "передний привод"])) return "FWD";
    return undefined;
  }

  private extractMaxPrice(query: string) {
    const patterns: Array<{ regex: RegExp; needsPriceWord?: boolean }> = [
      { regex: /(\d{1,3})\s*(ming|минг|тыс|tys|k)\s*(dollar|dollargacha|usd|\$)?/i },
      { regex: /(\d{4,6})\s*(dollar|dollargacha|usd|\$)/i },
      { regex: /\$\s*(\d{4,6})/i },
      { regex: /(\d{4,6})/, needsPriceWord: true }
    ];
    for (const pattern of patterns) {
      if (pattern.needsPriceWord && !this.includesAny(query, ["byudjet", "budget", "narx", "dollar", "usd", "$", "gacha"])) continue;
      const match = query.match(pattern.regex);
      if (!match) continue;
      const value = Number(match[1]);
      if (!Number.isFinite(value) || value < 5) continue;
      return value < 1000 ? value * 1000 : value;
    }
    return undefined;
  }

  private extractMinPrice(query: string) {
    const match = query.match(/(\d{1,3})\s*(ming|k)\s*(dan yuqori|dan qimmat|above|over)/i);
    if (!match) return undefined;
    return Number(match[1]) * 1000;
  }

  private extractYearRange(query: string) {
    const explicitYears = [...query.matchAll(/\b(20[1-2]\d)\b/g)].map((match) => Number(match[1]));
    const currentYear = new Date().getFullYear();
    let minYear: number | undefined;
    let maxYear: number | undefined;

    if (explicitYears.length === 1) {
      if (this.includesAny(query, ["dan yangi", "yildan keyin", "after", "после"])) minYear = explicitYears[0];
      else if (this.includesAny(query, ["gacha", "dan eski", "before", "до"])) maxYear = explicitYears[0];
      else minYear = explicitYears[0];
    }

    if (explicitYears.length >= 2) {
      minYear = Math.min(...explicitYears);
      maxYear = Math.max(...explicitYears);
    }

    if (this.includesAny(query, ["yangi", "kam yurgan", "новый", "свежий"])) minYear = Math.max(minYear ?? 0, currentYear - 4);
    if (this.includesAny(query, ["eski bo'lmasin", "5 yildan oshmagan"])) minYear = Math.max(minYear ?? 0, currentYear - 5);

    return { minYear, maxYear };
  }

  private extractMaxMileage(query: string) {
    const patterns = [
      /(?:probeg|yurishi|mileage|пробег)\s*(\d{1,6})\s*(ming|минг|k)?\s*(km|км)?/i,
      /(\d{1,6})\s*(ming|минг|k)?\s*(km|км)\s*(?:gacha|dan kam|kam)?/i,
      /(\d{1,3})\s*(ming|минг|k)\s*(?:probeg|yurgan|mileage|пробег)/i
    ];
    for (const pattern of patterns) {
      const explicit = query.match(pattern);
      if (!explicit) continue;
      const value = Number(explicit[1]);
      if (Number.isFinite(value) && value >= 5) return explicit[2] || value < 1000 ? value * 1000 : value;
    }
    if (this.includesAny(query, ["yurishi kam", "kam yurgan", "probeg kam", "low mileage", "малый пробег"])) return 50000;
    if (this.includesAny(query, ["deyarli yangi", "почти новый"])) return 20000;
    return undefined;
  }

  private extractMinRange(query: string) {
    const explicit = query.match(/(\d{3,4})\s*(\+|km|км)?\s*(dan yuqori|dan kop|dan ko'p|yuqori|range|zapas|zapasi|yurish|ход)?/i);
    if (explicit && this.includesAny(query, ["range", "zapas", "zapasi", "yurish", "uzoq", "km dan yuqori", "km+", "ход"])) return Number(explicit[1]);
    const reversed = query.match(/(range|zapas|zapasi|yurish|ход)\s*(\d{3,4})/i);
    if (reversed) return Number(reversed[2]);
    const oldExplicit = query.match(/(\d{3,4})\s*(km|км)?\s*(range|zapas|zapasi|yurish|ход)/i);
    if (oldExplicit) return Number(oldExplicit[1]);
    const plus = query.match(/(\d{3,4})\s*\+/);
    if (plus && this.includesAny(query, ["range", "zapas", "uzoq"])) return Number(plus[1]);
    if (this.includesAny(query, ["uzoq yo'l", "uzoq yuradigan", "long range", "дальний ход"])) return 500;
    return undefined;
  }

  private extractBatteryHealth(query: string) {
    const match = query.match(/(\d{2,3})\s*%/);
    if (match && this.includesAny(query, ["batareya", "battery", "аккум"])) return Number(match[1]);
    if (this.includesAny(query, ["batareyasi yaxshi", "battery yaxshi", "аккумулятор хороший"])) return 90;
    return undefined;
  }

  private extractCustomsStatus(query: string) {
    if (this.includesAny(query, ["bojxona", "rastamojka", "rasmiylashtirilgan", "тамож", "растамож"])) return "rasmiy";
    return undefined;
  }

  private normalize(input: string) {
    return input
      .toLowerCase()
      .replace(/ё/g, "е")
      .replace(/ʼ|‘|’|`/g, "'")
      .replace(/[^a-zа-я0-9%$'+\s-]/gi, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  private tokenize(input: string) {
    const stopWords = new Set(["bilan", "uchun", "kerak", "top", "menga", "mashina", "avto", "auto", "car", "bor", "dan", "gacha", "the"]);
    return this.normalize(input)
      .split(/\s+/)
      .filter((token) => token.length > 2 && !stopWords.has(token))
      .slice(0, 12);
  }

  private includesAny(input: string, needles: string[]) {
    return needles.some((needle) => input.includes(this.normalize(needle)));
  }

  private same(a: string, b: string) {
    return this.normalize(a) === this.normalize(b);
  }

  private familyScoreText(text: string) {
    return /(l7|l8|l9|tang|denza|song plus|suv|7 joy|7 мест|oilaviy|keng|family)/i.test(text);
  }

  private cityScoreText(text: string, listing: AiListing) {
    return /(dolphin|compact|kompakt|shahar|city)/i.test(text) || listing.priceUsd <= 30000;
  }

  private premiumScoreText(text: string) {
    return /(pro|max|flagship|we|premium|lux|komfort|авангард)/i.test(text);
  }

  private importScoreText(text: string) {
    return /(xitoy|import|olib kelingan|привез|china|bojxona|rasmiylashtirilgan)/i.test(text);
  }
}
