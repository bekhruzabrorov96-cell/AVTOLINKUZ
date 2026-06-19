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

export interface ChatSession {
  chatId: string;
}

export interface MiniChatMessage {
  id: string;
  listingId: string;
  sender: "buyer" | "seller";
  body: string;
  createdAt: string;
}

interface ApiChatMessage {
  id: string;
  chatId: string;
  senderId: string;
  body: string;
  createdAt: string;
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

export async function updateSellerListing(id: string, input: CreateSellerListingInput): Promise<ListingPrivate> {
  if (!API_URL) {
    return {
      ...input,
      id,
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

  const { telegramId, sellerName, ...listingInput } = input;
  void telegramId;
  void sellerName;

  const res = await fetch(`${API_URL}/listings/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(listingInput),
    cache: "no-store"
  });
  if (!res.ok) throw new Error("Listing could not be updated");
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

export async function startChat(input: { listingId: string; buyerId: string; sellerId: string }): Promise<ChatSession> {
  if (!API_URL) return { chatId: `demo-${input.listingId}-${input.buyerId}` };

  const res = await fetch(`${API_URL}/chat/start`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
    cache: "no-store"
  });
  if (!res.ok) throw new Error("Chat could not be started");
  const chat = await res.json() as { id: string };
  return { chatId: chat.id };
}

export async function getChatMessages(input: { chatId: string; listingId: string; buyerId: string }): Promise<MiniChatMessage[]> {
  if (!API_URL || input.chatId.startsWith("demo-")) return [];

  const res = await fetch(`${API_URL}/chat/${input.chatId}/messages`, { cache: "no-store" });
  if (!res.ok) throw new Error("Chat messages could not be loaded");
  const messages = await res.json() as ApiChatMessage[];
  return messages.map((message) => mapChatMessage(message, input.listingId, input.buyerId));
}

export async function sendChatMessage(input: { chatId: string; listingId: string; senderId: string; buyerId: string; body: string }): Promise<MiniChatMessage> {
  if (!API_URL || input.chatId.startsWith("demo-")) {
    return {
      id: `buyer-${Date.now()}`,
      listingId: input.listingId,
      sender: "buyer",
      body: input.body,
      createdAt: new Date().toISOString()
    };
  }

  const res = await fetch(`${API_URL}/chat/${input.chatId}/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ senderId: input.senderId, body: input.body }),
    cache: "no-store"
  });
  if (!res.ok) throw new Error("Chat message could not be sent");
  const message = await res.json() as ApiChatMessage;
  return mapChatMessage(message, input.listingId, input.buyerId);
}

function mapChatMessage(message: ApiChatMessage, listingId: string, buyerId: string): MiniChatMessage {
  return {
    id: message.id,
    listingId,
    sender: message.senderId === buyerId ? "buyer" : "seller",
    body: message.body,
    createdAt: message.createdAt
  };
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
  const make = ["BYD", "Li Auto", "Zeekr", "Nio", "Xpeng", "Avatr", "Aito", "Denza", "Voyah"].find((item) => lower.includes(item.toLowerCase()));
  const model = ["Song Plus", "Song", "Seal", "Han", "Tang", "Dolphin", "L7", "L8", "L9", "001", "007", "P7", "G6", "ET5", "ES6"].find((item) => lower.includes(item.toLowerCase()));
  const region = ["Toshkent", "Samarqand", "Buxoro", "Fargona", "Andijon", "Namangan", "Navoiy", "Jizzax", "Xorazm"].find((item) => lower.includes(item.toLowerCase()));
  const budget = lower.match(/(?:\$?\s*)?(\d{1,3})\s*(ming|k|минг|тыс|tys)\b|(?:\$?\s*)(\d{4,6})\s*(?:dollar|usd|\$)?/);
  const powertrainType = lower.includes("reev")
    ? "REEV" as const
    : lower.includes("phev") || lower.includes("plug in") || lower.includes("plugin")
      ? "PHEV" as const
      : lower.includes("hybrid") || lower.includes("gibrid") || lower.includes("гибрид")
        ? "HYBRID" as const
        : lower.includes("faqat ev") || lower.includes("toza ev") || lower.includes("pure ev") || lower.includes("bev")
          ? "EV" as const
          : undefined;
  const driveType = lower.includes("awd") || lower.includes("4x4") || lower.includes("4wd") || lower.includes("toliq privod") || lower.includes("to'liq privod") || lower.includes("полный привод")
    ? "AWD" as const
    : lower.includes("rwd") || lower.includes("orqa privod") || lower.includes("задний привод")
      ? "RWD" as const
      : lower.includes("fwd") || lower.includes("old privod") || lower.includes("передний привод")
        ? "FWD" as const
        : undefined;
  const range = lower.match(/(?:yurish|zapas|zapasi|range|ход)\s*(\d{3,4})|(\d{3,4})\s*(?:km|км|\+)?\s*(?:dan yuqori|dan kop|dan ko'p|yuqori|yurish|zapas|zapasi|range|ход)/);
  const mileage = lower.match(/(?:probeg|yurishi|mileage|пробег)\s*(\d{1,6})\s*(ming|k|минг|тыс|tys)?|(\d{1,6})\s*(ming|k|минг|тыс|tys)?\s*(?:km|км)?\s*(?:gacha|dan kam|probeg|yurgan|mileage|пробег)/);
  const battery = lower.match(/(?:batareya|battery|аккум)[^\d]*(\d{2,3})\s*%|(\d{2,3})\s*%\s*(?:batareya|battery|аккум)/);
  const rawBudgetValue = Number(budget?.[1] ?? budget?.[3]);
  const maxPrice = budget
    ? rawBudgetValue < 1000
      ? rawBudgetValue * 1000
      : rawBudgetValue
    : undefined;
  const mileageValue = mileage ? Number(mileage[1] ?? mileage[3]) : undefined;
  const shouldScaleMileage = Boolean(mileage?.[2] ?? mileage?.[4]) || Boolean(mileageValue && mileageValue < 1000);
  const mileageMultiplier = shouldScaleMileage ? 1000 : 1;
  const maxMileageKm = mileageValue
    ? mileageValue * mileageMultiplier
      : lower.includes("yurishi kam") || lower.includes("kam yurgan")
        ? 50000
        : lower.includes("deyarli yangi") || lower.includes("почти новый")
          ? 20000
        : undefined;
  const year = lower.match(/\b(20[1-2]\d)\b/);
  const wantsNewer = lower.includes("yangi") || lower.includes("svejiy") || lower.includes("свеж");
  const minRangeKm = range
    ? Number(range[1] ?? range[2])
    : lower.includes("uzoq") || lower.includes("long range") || lower.includes("дальний")
      ? 500
      : undefined;
  const minBatteryHealthPercent = battery
    ? Number(battery[1] ?? battery[2])
    : lower.includes("batareyasi yaxshi") || lower.includes("аккумулятор хороший")
      ? 90
      : undefined;

  return {
    q: make || model ? undefined : query,
    make,
    model,
    region,
    powertrainType,
    driveType,
    maxPrice,
    minYear: year ? Number(year[1]) : wantsNewer ? new Date().getFullYear() - 4 : undefined,
    maxMileageKm,
    minRangeKm,
    minBatteryHealthPercent,
    customsStatus: lower.includes("bojxona") || lower.includes("rastamojka") || lower.includes("rasmiylashtirilgan") || lower.includes("растамож") ? "rasmiy" : undefined
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
        priceInsightUz: localPriceInsight(listing),
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

  if (filters.driveType) {
    if (listing.driveType === filters.driveType) {
      score += 8;
      reasons.push(`${listing.driveType} privod mos`);
    } else if (listing.driveType && listing.driveType !== "UNKNOWN") {
      score -= 6;
      warnings.push(`privod ${listing.driveType}`);
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
      warnings.push("batareya foizi past yoki kiritilmagan");
    }
  } else if ((listing.batteryHealthPercent ?? 0) >= 90) {
    score += 4;
  }

  if (filters.customsStatus) {
    if (listing.customsStatus && normalizeSearchText(listing.customsStatus).includes("rasmiy")) {
      score += 7;
      reasons.push("bojxona holati mos");
    } else {
      warnings.push("bojxona holati aniq emas");
    }
  }

  if (lower.includes("oilaviy") || lower.includes("oila") || lower.includes("family") || lower.includes("семей")) {
    if (/(oilaviy|suv|krossover|5 o'rin|5 orin|7 joy|l7|l8|l9|tang|song plus)/.test(haystack)) {
      score += 10;
      reasons.push("oilaviy foydalanishga mos");
    } else {
      warnings.push("oilaviy qulaylik aniq emas");
    }
  }

  if (lower.includes("shahar") || lower.includes("city") || lower.includes("город")) {
    if (listing.priceUsd <= 32000 || listing.powertrainType === "EV") {
      score += 7;
      reasons.push("shahar uchun qulay");
    }
  }

  if (lower.includes("premium") || lower.includes("lyuks") || lower.includes("komfort") || lower.includes("max")) {
    if (/(pro|max|lyuks|premium|we|komfort|flagship)/.test(haystack)) {
      score += 8;
      reasons.push("komplektatsiyasi yuqori");
    }
  }

  const tokens = lower.split(/\s+/).filter((token) => token.length > 2 && !["gacha", "uchun", "bilan", "kerak", "menga", "toping", "mashina"].includes(token));
  score += Math.min(10, tokens.filter((token) => haystack.includes(token)).length * 2);

  return {
    score: Math.max(0, Math.min(100, Math.round(score))),
    reasons: [...new Set(reasons)].slice(0, 5),
    warnings: [...new Set(warnings)].slice(0, 3)
  };
}

function localPriceInsight(listing: ListingPrivate) {
  const similar = featuredListings.filter((item) => item.id !== listing.id && (item.make === listing.make || item.powertrainType === listing.powertrainType));
  const average = similar.length
    ? Math.round(similar.reduce((sum, item) => sum + item.priceUsd, 0) / similar.length)
    : listing.priceUsd;
  const diffPercent = average ? Math.round(((listing.priceUsd - average) / average) * 100) : 0;

  if (diffPercent <= -8) return `Narx tahlili: o'xshash e'lonlardan taxminan ${Math.abs(diffPercent)}% arzonroq.`;
  if (diffPercent >= 10) return `Narx tahlili: o'xshash e'lonlardan taxminan ${diffPercent}% qimmatroq, savdolashish foydali.`;
  return "Narx tahlili: o'xshash e'lonlarga yaqin, adolatli diapazonda.";
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
