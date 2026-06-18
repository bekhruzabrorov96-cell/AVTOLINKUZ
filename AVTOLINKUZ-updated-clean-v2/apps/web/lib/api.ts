import type { AiSearchResult, AiSearchSuggestions, Listing, ListingFilters, ListingPrivate } from "@avtolink/shared";
import { featuredListings } from "./mock-data";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export interface CreateSellerListingInput {
  sellerId?: string;
  telegramId?: string;
  sellerName?: string;
  sellerTelegramUsername?: string;
  title?: string;
  make: string;
  model: string;
  year: number;
  powertrainType: "EV" | "REEV" | "PHEV" | "HYBRID";
  trim?: string;
  batteryKwh?: number;
  rangeKm?: number;
  rangeStandard?: "CLTC" | "WLTP" | "EPA" | "UNKNOWN";
  motorPowerKw?: number;
  driveType?: "FWD" | "RWD" | "AWD" | "UNKNOWN";
  condition?: string;
  batteryHealthPercent?: number;
  customsStatus?: string;
  bodyColor?: string;
  vin?: string;
  priceUsd: number;
  mileageKm: number;
  region: string;
  exactLocation?: string;
  latitude?: number;
  longitude?: number;
  yandexMapUrl?: string;
  sellerPhone?: string;
  description: string;
  photoUrls: string[];
}

export interface BuyerSession {
  userId: string;
  accessToken?: string;
}

export async function getListings(filters?: ListingFilters): Promise<Listing[]> {
  if (!API_URL) {
    return filterLocalListings(filters);
  }

  const params = new URLSearchParams();
  Object.entries(filters ?? {}).forEach(([key, value]) => {
    if (value !== undefined && value !== "") params.set(key, String(value));
  });

  try {
    const res = await fetch(`${API_URL}/listings?${params.toString()}`, { next: { revalidate: 30 } });
    if (!res.ok) throw new Error("Listings could not be loaded");
    return res.json();
  } catch {
    return filterLocalListings(filters);
  }
}

export async function getListing(id: string): Promise<Listing | null> {
  if (!API_URL) return featuredListings.find((listing) => listing.id === id) ?? null;

  try {
    const res = await fetch(`${API_URL}/listings/${id}`, { next: { revalidate: 30 } });
    if (res.status === 404) return null;
    if (!res.ok) throw new Error("Listing could not be loaded");
    return res.json();
  } catch {
    return featuredListings.find((listing) => listing.id === id) ?? null;
  }
}

export async function getPrivateListing(id: string, userId: string): Promise<ListingPrivate | null> {
  if (!API_URL) {
    const listing = featuredListings.find((item) => item.id === id);
    return listing ?? null;
  }

  const res = await fetch(`${API_URL}/listings/${id}/private?userId=${userId}`, { cache: "no-store" });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error("Private listing could not be loaded");
  return res.json();
}

export async function requestPhoneOtp(phone: string, name?: string) {
  if (!API_URL) {
    return {
      phone,
      expiresInSeconds: 300,
      message: "Sinov rejimi: tasdiqlash kodi 111111"
    };
  }

  const res = await fetch(`${API_URL}/auth/phone/request`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone, name }),
    cache: "no-store"
  });
  if (!res.ok) throw new Error("OTP request failed");
  return res.json();
}

export async function verifyPhoneOtp(phone: string, code: string, name?: string): Promise<BuyerSession> {
  if (!API_URL) {
    if (code !== "111111") throw new Error("Invalid demo OTP");
    return {
      userId: `demo-buyer-${phone.replace(/\D/g, "") || "user"}`,
      accessToken: "demo-token"
    };
  }

  const res = await fetch(`${API_URL}/auth/phone/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone, code, name }),
    cache: "no-store"
  });
  if (!res.ok) throw new Error("OTP verification failed");
  return res.json();
}

export async function createSellerListing(input: CreateSellerListingInput): Promise<ListingPrivate> {
  if (!API_URL) {
    return {
      ...input,
      id: `demo-${Date.now()}`,
      title: input.title || `${input.make} ${input.model} ${input.year}`,
      rangeStandard: input.rangeStandard ?? "UNKNOWN",
      driveType: input.driveType ?? "UNKNOWN",
      status: "ACTIVE",
      seller: {
        id: input.sellerId ?? "demo-seller",
        name: input.sellerName ?? "Sotuvchi",
        phone: input.sellerPhone,
        telegramId: input.telegramId,
        telegramUsername: input.sellerTelegramUsername,
        region: input.region as ListingPrivate["region"],
        createdAt: new Date().toISOString()
      },
      region: input.region as ListingPrivate["region"],
      createdAt: new Date().toISOString()
    };
  }

  let sellerId = input.sellerId;
  if (!sellerId && input.telegramId) {
    const authRes = await fetch(`${API_URL}/auth/telegram`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        telegramId: input.telegramId,
        name: input.sellerName ?? "Sotuvchi",
        username: input.sellerTelegramUsername
      }),
      cache: "no-store"
    });
    if (!authRes.ok) throw new Error("Telegram login failed");
    const session = await authRes.json() as { userId: string };
    sellerId = session.userId;
  }

  if (!sellerId) throw new Error("Seller login is required");

  const { telegramId, sellerName, ...listingInput } = input;
  void telegramId;
  void sellerName;

  const res = await fetch(`${API_URL}/listings`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...listingInput, sellerId }),
    cache: "no-store"
  });
  if (!res.ok) throw new Error("Listing could not be created");
  return res.json();
}

export async function updateListingStatus(id: string, status: "ACTIVE" | "SOLD" | "ARCHIVED"): Promise<ListingPrivate | null> {
  if (!API_URL) return null;

  const res = await fetch(`${API_URL}/listings/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
    cache: "no-store"
  });
  if (!res.ok) throw new Error("Listing status could not be updated");
  return res.json();
}

export async function aiSearch(query: string): Promise<AiSearchResult[]> {
  if (!API_URL) {
    return localAiSearch(query);
  }

  try {
    const res = await fetch(`${API_URL}/ai/search`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query }),
      cache: "no-store"
    });
    if (!res.ok) throw new Error("AI search failed");
    return res.json();
  } catch {
    return localAiSearch(query);
  }
}

export async function aiSuggestions(query: string): Promise<AiSearchSuggestions> {
  if (!API_URL) {
    return localAiSuggestions(query);
  }

  try {
    const res = await fetch(`${API_URL}/ai/suggestions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query }),
      cache: "no-store"
    });
    if (!res.ok) throw new Error("AI suggestions failed");
    return res.json();
  } catch {
    return localAiSuggestions(query);
  }
}

function filterLocalListings(filters?: ListingFilters): Listing[] {
  return featuredListings.filter((listing) => {
    const q = filters?.q?.toLowerCase();
    const matchesText = !q || `${listing.title} ${listing.make} ${listing.model} ${listing.trim ?? ""} ${listing.powertrainType}`.toLowerCase().includes(q);
    const matchesMake = !filters?.make || listing.make === filters.make;
    const matchesRegion = !filters?.region || listing.region === filters.region;
    const matchesPowertrain = !filters?.powertrainType || listing.powertrainType === filters.powertrainType;
    const matchesMinPrice = !filters?.minPrice || listing.priceUsd >= filters.minPrice;
    const matchesMaxPrice = !filters?.maxPrice || listing.priceUsd <= filters.maxPrice;
    const matchesMinYear = !filters?.minYear || listing.year >= filters.minYear;
    const matchesMaxYear = !filters?.maxYear || listing.year <= filters.maxYear;
    const matchesMileage = !filters?.maxMileageKm || listing.mileageKm <= filters.maxMileageKm;
    const matchesRange = !filters?.minRangeKm || (listing.rangeKm ?? 0) >= filters.minRangeKm;
    const matchesBattery = !filters?.minBatteryHealthPercent || (listing.batteryHealthPercent ?? 0) >= filters.minBatteryHealthPercent;
    const matchesDrive = !filters?.driveType || listing.driveType === filters.driveType;
    return matchesText && matchesMake && matchesRegion && matchesPowertrain && matchesMinPrice && matchesMaxPrice && matchesMinYear && matchesMaxYear && matchesMileage && matchesRange && matchesBattery && matchesDrive;
  });
}

function localAiFilters(query: string): ListingFilters {
  const lower = normalizeSearchText(query);
  const make = ["BYD", "Li Auto", "Zeekr", "Nio", "Xpeng"].find((item) => lower.includes(item.toLowerCase()));
  const model = ["Song Plus", "Song", "Seal", "Han", "Tang", "L7", "L8", "L9", "001", "007"].find((item) => lower.includes(item.toLowerCase()));
  const region = ["Toshkent", "Samarqand", "Buxoro", "Fargona", "Andijon", "Namangan"].find((item) => lower.includes(item.toLowerCase()));
  const budget = lower.match(/(?:\$?\s*)?(\d{1,3})\s*(ming|k|минг|tys|тыс)\b|(?:\$?\s*)(\d{4,6})\s*(?:dollar|usd|\$)?/);
  const powertrainType = lower.includes("reev")
    ? "REEV"
    : lower.includes("phev")
      ? "PHEV"
      : lower.includes("hybrid") || lower.includes("gibrid")
        ? "HYBRID"
        : lower.includes("faqat ev") || lower.includes("toza ev") || lower.includes("pure ev")
          ? "EV"
          : undefined;
  const range = lower.match(/(\d{3,4})\s*(km)?\s*(range|zapas|zapasi|yurish|ход)/);
  const mileage = lower.match(/(\d{1,3})\s*(ming|k|минг|tys|тыс)?\s*(km|км)?\s*(probeg|yurgan|mileage|пробег)/);
  const battery = lower.match(/(\d{2,3})\s*%/);
  const rawBudgetValue = Number(budget?.[1] ?? budget?.[3]);
  const maxPrice = budget
    ? rawBudgetValue < 1000
      ? rawBudgetValue * 1000
      : rawBudgetValue
    : undefined;
  const mileageValue = mileage ? Number(mileage[1]) : undefined;
  const shouldScaleMileage = Boolean(mileage?.[2]) || Boolean(mileageValue && mileageValue < 1000);
  const mileageMultiplier = shouldScaleMileage ? 1000 : 1;
  const maxMileageKm = mileageValue
    ? mileageValue * mileageMultiplier
      : lower.includes("yurishi kam") || lower.includes("kam yurgan")
        ? 50000
        : undefined;
  const year = lower.match(/\b(20[1-2]\d)\b/);
  const wantsNewer = lower.includes("yangi") || lower.includes("svejiy") || lower.includes("свеж");

  return {
    q: make || model ? undefined : query,
    make,
    model,
    region,
    powertrainType,
    maxPrice,
    minYear: year ? Number(year[1]) : wantsNewer ? new Date().getFullYear() - 4 : undefined,
    maxMileageKm,
    minRangeKm: range ? Number(range[1]) : lower.includes("uzoq") || lower.includes("range") ? 500 : undefined,
    minBatteryHealthPercent: battery ? Number(battery[1]) : lower.includes("batareyasi yaxshi") ? 90 : undefined
  };
}

function localAiSuggestions(query: string): AiSearchSuggestions {
  const parsed = localAiFilters(query);
  const suggestions = [
    parsed.maxPrice ? undefined : "30 ming dollargacha",
    parsed.powertrainType ? undefined : "REEV yoki toza EV",
    parsed.maxMileageKm ? undefined : "50 ming km gacha",
    parsed.minRangeKm ? undefined : "500 km dan yuqori",
    parsed.region ? undefined : "Toshkent",
    parsed.minBatteryHealthPercent ? undefined : "batareya 90% dan yuqori"
  ].filter((item): item is string => Boolean(item));

  return { parsed, suggestions };
}

function localAiSearch(query: string): AiSearchResult[] {
  const filters = localAiFilters(query);
  return featuredListings
    .map((listing) => {
      const scored = localScoreListing(listing, filters, query);
      return {
        listing,
        score: scored.score,
        confidenceLabel: scored.score >= 78 ? "high" as const : scored.score >= 58 ? "medium" as const : "low" as const,
        matchedFilters: filters,
        explanationUz: `Nega mos: ${scored.reasons.join(", ") || "so'rovga umumiy jihatdan yaqin"}. Moslik: ${scored.score}%.${scored.warnings.length ? ` Eslatma: ${scored.warnings.join(", ")}.` : ""}`,
        nextActionUz: scored.score >= 78 ? "Kontakt va aniq manzilni ko'rish uchun telefon raqam bilan kiring." : "Aniqroq natija uchun byudjet, probeg yoki yurish zaxirasini kiriting."
      };
    })
    .filter((result) => result.score >= 28)
    .sort((a, b) => b.score - a.score)
    .slice(0, 10)
    .map((result, index) => ({ ...result, rank: index + 1 }));
}

function localScoreListing(listing: ListingPrivate, filters: ListingFilters, rawQuery: string) {
  let score = 48;
  const reasons: string[] = [];
  const warnings: string[] = [];
  const lower = normalizeSearchText(rawQuery);
  const haystack = normalizeSearchText(`${listing.title} ${listing.make} ${listing.model} ${listing.trim ?? ""} ${listing.description} ${listing.condition ?? ""} ${listing.region}`);

  if (filters.make) {
    if (listing.make === filters.make) {
      score += 18;
      reasons.push(`${listing.make} markasi mos`);
    } else {
      score -= 20;
      warnings.push(`marka ${filters.make} emas`);
    }
  }

  if (filters.powertrainType) {
    if (listing.powertrainType === filters.powertrainType) {
      score += 16;
      reasons.push(`${listing.powertrainType} turi mos`);
    } else {
      score -= 16;
    }
  }

  if (filters.model) {
    if (haystack.includes(normalizeSearchText(filters.model))) {
      score += 14;
      reasons.push(`${filters.model} modeli mos`);
    } else {
      score -= 10;
    }
  }

  if (filters.region) {
    if (listing.region === filters.region) {
      score += 10;
      reasons.push(`${listing.region} hududi mos`);
    } else {
      score -= 5;
      warnings.push(`${filters.region} hududida emas`);
    }
  }

  if (filters.maxPrice) {
    const ratio = listing.priceUsd / filters.maxPrice;
    if (ratio <= 1) {
      score += 18;
      reasons.push("narxi byudjetga mos");
    } else if (ratio <= 1.15) {
      score -= 4;
      warnings.push("narxi byudjetdan biroz yuqori");
    } else {
      score -= 28;
      warnings.push("narxi byudjetdan yuqori");
    }
  }

  if (filters.maxMileageKm) {
    if (listing.mileageKm <= filters.maxMileageKm) {
      score += 12;
      reasons.push("probegi kam");
    } else {
      score -= 8;
      warnings.push("probegi yuqoriroq");
    }
  }

  if (filters.minYear) {
    if (listing.year >= filters.minYear) {
      score += 10;
      reasons.push("yili mos");
    } else {
      score -= 10;
      warnings.push("yili so'rovdan eskiroq");
    }
  }

  if (filters.minRangeKm) {
    if ((listing.rangeKm ?? 0) >= filters.minRangeKm) {
      score += 12;
      reasons.push("yurish zaxirasi mos");
    } else {
      score -= 10;
      warnings.push("yurish zaxirasi pastroq");
    }
  }

  if (filters.minBatteryHealthPercent) {
    if ((listing.batteryHealthPercent ?? 0) >= filters.minBatteryHealthPercent) {
      score += 9;
      reasons.push("batareya holati yaxshi");
    } else {
      score -= 8;
    }
  }

  if (lower.includes("oilaviy") || lower.includes("oila") || lower.includes("family")) {
    if (haystack.includes("oilaviy") || haystack.includes("suv") || haystack.includes("krossover") || haystack.includes("5 orin")) {
      score += 10;
      reasons.push("oilaviy foydalanishga mos");
    }
  }

  if (lower.includes("shahar") || lower.includes("city")) {
    if (listing.priceUsd <= 32000 || listing.powertrainType === "EV") {
      score += 7;
      reasons.push("shahar uchun qulay");
    }
  }

  const tokens = lower.split(/\s+/).filter((token) => token.length > 2 && !["gacha", "uchun", "bilan", "kerak"].includes(token));
  score += Math.min(10, tokens.filter((token) => haystack.includes(token)).length * 2);

  return {
    score: Math.max(0, Math.min(100, Math.round(score))),
    reasons,
    warnings
  };
}

function normalizeSearchText(value: string) {
  return value
    .toLowerCase()
    .replaceAll("ʻ", "'")
    .replaceAll("ʼ", "'")
    .replaceAll("ў", "o")
    .replaceAll("ғ", "g")
    .replaceAll("қ", "q")
    .replaceAll("ҳ", "h");
}
