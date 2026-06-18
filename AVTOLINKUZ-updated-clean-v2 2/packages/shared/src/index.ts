export type Region =
  | "Toshkent"
  | "Samarqand"
  | "Buxoro"
  | "Andijon"
  | "Fargona"
  | "Namangan"
  | "Qashqadaryo"
  | "Surxondaryo"
  | "Xorazm"
  | "Navoiy"
  | "Jizzax"
  | "Sirdaryo"
  | "Qoraqalpogiston";

export type ListingStatus = "ACTIVE" | "SOLD" | "ARCHIVED";
export type PowertrainType = "EV" | "REEV" | "PHEV" | "HYBRID";
export type DriveType = "FWD" | "RWD" | "AWD" | "UNKNOWN";
export type RangeStandard = "CLTC" | "WLTP" | "EPA" | "UNKNOWN";

export interface UserProfile {
  id: string;
  phone?: string;
  telegramId?: string;
  telegramUsername?: string;
  name: string;
  region?: Region;
  createdAt: string;
}

export interface ListingPublic {
  id: string;
  title: string;
  make: string;
  model: string;
  year: number;
  powertrainType: PowertrainType;
  trim?: string;
  batteryKwh?: number;
  rangeKm?: number;
  rangeStandard?: RangeStandard;
  motorPowerKw?: number;
  driveType?: DriveType;
  condition?: string;
  batteryHealthPercent?: number;
  customsStatus?: string;
  bodyColor?: string;
  vin?: string;
  priceUsd: number;
  mileageKm: number;
  region: Region;
  description: string;
  photoUrls: string[];
  status: ListingStatus;
  seller: Omit<UserProfile, "phone" | "telegramId" | "telegramUsername">;
  createdAt: string;
}

export interface ListingPrivate extends ListingPublic {
  exactLocation?: string;
  latitude?: number;
  longitude?: number;
  yandexMapUrl?: string;
  sellerPhone?: string;
  sellerTelegramUsername?: string;
  seller: UserProfile;
}

export type Listing = ListingPublic | ListingPrivate;

export interface ListingFilters {
  q?: string;
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
}

export interface AiSearchResult {
  listing: ListingPublic;
  score: number;
  rank?: number;
  confidenceLabel?: "high" | "medium" | "low";
  matchedFilters: ListingFilters;
  explanationUz: string;
  priceInsightUz?: string;
  nextActionUz?: string;
}

export interface AiSearchHistoryItem {
  id: string;
  query: string;
  parsed: ListingFilters;
  resultCount: number;
  topListingId?: string;
  createdAt: string;
}

export interface AiSearchSuggestions {
  parsed: ListingFilters;
  suggestions: string[];
}
