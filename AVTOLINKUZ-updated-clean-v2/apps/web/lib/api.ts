import type { AiSearchResult, AiSearchSuggestions, Listing, ListingFilters, ListingPrivate } from "@avtolink/shared";
import { featuredListings } from "./mock-data";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

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

export async function aiSearch(query: string): Promise<AiSearchResult[]> {
  if (!API_URL) {
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
          nextActionUz: scored.score >= 78 ? "Kontakt va lokatsiyani ko'rish uchun telefon raqam bilan kiring." : "Aniqroq natija uchun byudjet, probeg yoki range kiriting."
        };
      })
      .filter((result) => result.score >= 35)
      .sort((a, b) => b.score - a.score)
      .slice(0, 10)
      .map((result, index) => ({ ...result, rank: index + 1 }));
  }

  const res = await fetch(`${API_URL}/ai/search`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query }),
    cache: "no-store"
  });
  if (!res.ok) throw new Error("AI search failed");
  return res.json();
}

export async function aiSuggestions(query: string): Promise<AiSearchSuggestions> {
  if (!API_URL) {
    const parsed = localAiFilters(query);
    const suggestions = [
      parsed.maxPrice ? undefined : "30 ming dollargacha",
      parsed.powertrainType ? undefined : "EV yoki REEV",
      parsed.maxMileageKm ? undefined : "50 ming km gacha",
      parsed.minRangeKm ? undefined : "500 km dan yuqori",
      parsed.minBatteryHealthPercent ? undefined : "batareya 90% dan yuqori"
    ].filter((item): item is string => Boolean(item));

    return { parsed, suggestions };
  }

  const res = await fetch(`${API_URL}/ai/suggestions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query }),
    cache: "no-store"
  });
  if (!res.ok) throw new Error("AI suggestions failed");
  return res.json();
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
  const lower = query.toLowerCase();
  const make = ["BYD", "Li Auto", "Zeekr", "Nio", "Xpeng"].find((item) => lower.includes(item.toLowerCase()));
  const budget = lower.match(/(\d{2,3})\s*(ming|k)/);
  const powertrainType = lower.includes("reev") ? "REEV" : lower.includes("ev") || lower.includes("elektro") ? "EV" : undefined;
  const range = lower.match(/(\d{3,4})\s*(km)?\s*(range|zapas|yurish)/);
  const mileage = lower.match(/(\d{1,3})\s*(ming|k)?\s*(km)?\s*(probeg|yurgan)/);
  const battery = lower.match(/(\d{2,3})\s*%/);
  const mileageValue = mileage ? Number(mileage[1]) : undefined;
  const shouldScaleMileage = Boolean(mileage?.[2]) || Boolean(mileageValue && mileageValue < 1000);
  const mileageMultiplier = shouldScaleMileage ? 1000 : 1;
  const maxMileageKm = mileageValue
    ? mileageValue * mileageMultiplier
    : lower.includes("yurishi kam") || lower.includes("kam yurgan")
      ? 50000
      : undefined;

  return {
    q: make ? undefined : query,
    make,
    powertrainType,
    maxPrice: budget ? Number(budget[1]) * 1000 : undefined,
    maxMileageKm,
    minRangeKm: range ? Number(range[1]) : lower.includes("uzoq") || lower.includes("range") ? 500 : undefined,
    minBatteryHealthPercent: battery ? Number(battery[1]) : lower.includes("batareyasi yaxshi") ? 90 : undefined
  };
}

function localScoreListing(listing: ListingPrivate, filters: ListingFilters, rawQuery: string) {
  let score = 48;
  const reasons: string[] = [];
  const warnings: string[] = [];
  const haystack = `${listing.title} ${listing.make} ${listing.model} ${listing.trim ?? ""} ${listing.description} ${listing.condition ?? ""}`.toLowerCase();

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

  if (filters.minRangeKm) {
    if ((listing.rangeKm ?? 0) >= filters.minRangeKm) {
      score += 12;
      reasons.push("range mos");
    } else {
      score -= 10;
      warnings.push("range pastroq");
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

  const tokens = rawQuery.toLowerCase().split(/\s+/).filter((token) => token.length > 2);
  score += Math.min(10, tokens.filter((token) => haystack.includes(token)).length * 2);

  return {
    score: Math.max(0, Math.min(100, Math.round(score))),
    reasons,
    warnings
  };
}
