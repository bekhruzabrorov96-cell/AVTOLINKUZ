"use client";

import Image from "next/image";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { BatteryCharging, Bot, Camera, CheckCircle2, ChevronRight, Gauge, Heart, Home, Loader2, LockKeyhole, MapPin, MapPinned, Navigation, PlusCircle, Save, Search, User, X, Zap } from "lucide-react";
import type { AiSearchResult, ListingFilters, ListingPrivate, ListingPublic } from "@avtolink/shared";
import { aiSearch, aiSuggestions, createSellerListing } from "@/lib/api";
import { BrandMark } from "@/components/brand-mark";

type Tab = "home" | "search" | "sell" | "profile";
type TelegramUser = {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  language_code?: string;
};

type TelegramWebApp = {
  initData?: string;
  initDataUnsafe?: { user?: TelegramUser };
  colorScheme?: "light" | "dark";
  themeParams?: {
    bg_color?: string;
    text_color?: string;
    button_color?: string;
    button_text_color?: string;
    secondary_bg_color?: string;
  };
  ready: () => void;
  expand: () => void;
  close?: () => void;
  showPopup?: (params: { title?: string; message: string; buttons?: Array<{ id?: string; type?: string; text: string }> }) => void;
};

type SellerDraft = {
  make: string;
  model: string;
  year: string;
  powertrainType: "EV" | "REEV" | "PHEV" | "HYBRID";
  trim: string;
  batteryKwh: string;
  rangeKm: string;
  rangeStandard: "CLTC" | "WLTP" | "EPA" | "UNKNOWN";
  motorPowerKw: string;
  driveType: "FWD" | "RWD" | "AWD" | "UNKNOWN";
  condition: string;
  batteryHealthPercent: string;
  customsStatus: string;
  bodyColor: string;
  priceUsd: string;
  mileageKm: string;
  region: string;
  exactLocation: string;
  latitude: string;
  longitude: string;
  yandexMapUrl: string;
  sellerPhone: string;
  sellerTelegramUsername: string;
  description: string;
  photoUrls: string;
};

declare global {
  interface Window {
    Telegram?: {
      WebApp?: TelegramWebApp;
    };
  }
}

export function TelegramMiniApp({ listings }: { listings: ListingPrivate[] }) {
  const [tab, setTab] = useState<Tab>("home");
  const [query, setQuery] = useState("20 ming dollargacha BYD EV");
  const [selectedMake, setSelectedMake] = useState("Barchasi");
  const [selectedListing, setSelectedListing] = useState<ListingPublic | null>(null);
  const telegram = useTelegramMiniApp();

  return (
    <div className="mx-auto min-h-screen max-w-md bg-[#F4F7FA] text-ink shadow-2xl" style={{ background: telegram.theme.secondaryBgColor ?? "#F4F7FA" }}>
      <header className="sticky top-0 z-20 border-b border-line bg-white/95 px-4 py-3 backdrop-blur">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BrandMark className="h-10 w-10 shrink-0 drop-shadow-sm" />
            <div>
              <h1 className="text-base font-black">Avtolink.uz</h1>
              <p className="text-xs font-medium text-slate-500">{telegram.isTelegram ? "Telegram ichida" : "Demo rejim"}</p>
            </div>
          </div>
          <button className="rounded-md bg-brand/10 px-3 py-2 text-xs font-black text-brand">{telegram.user?.first_name ?? "UZ"}</button>
        </div>
      </header>

      <main className="px-4 pb-24 pt-4">
        {tab === "home" ? <HomeScreen listings={listings} setTab={setTab} onContactClick={setSelectedListing} /> : null}
        {tab === "search" ? (
          <SearchScreen
            query={query}
            setQuery={setQuery}
            selectedMake={selectedMake}
            setSelectedMake={setSelectedMake}
            fallbackListings={listings}
            onContactClick={setSelectedListing}
          />
        ) : null}
        {tab === "sell" ? <SellerScreen telegramUser={telegram.user} /> : null}
        {tab === "profile" ? <ProfileScreen listings={listings} /> : null}
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-30 mx-auto max-w-md border-t border-line bg-white/95 px-2 py-2 backdrop-blur">
        <div className="grid grid-cols-4 gap-1">
          <TabButton active={tab === "home"} icon={<Home className="h-5 w-5" />} label="Bosh" onClick={() => setTab("home")} />
          <TabButton active={tab === "search"} icon={<Search className="h-5 w-5" />} label="Qidiruv" onClick={() => setTab("search")} />
          <TabButton active={tab === "sell"} icon={<PlusCircle className="h-5 w-5" />} label="Sotish" onClick={() => setTab("sell")} />
          <TabButton active={tab === "profile"} icon={<User className="h-5 w-5" />} label="Profil" onClick={() => setTab("profile")} />
        </div>
      </nav>

      {selectedListing ? <LockedContactSheet listing={selectedListing} telegram={telegram.webApp} onClose={() => setSelectedListing(null)} onLogin={() => setTab("profile")} /> : null}
    </div>
  );
}

function useTelegramMiniApp() {
  const [user, setUser] = useState<TelegramUser | undefined>();
  const [webApp, setWebApp] = useState<TelegramWebApp | undefined>();
  const [theme, setTheme] = useState<{ secondaryBgColor?: string }>({});

  useEffect(() => {
    document.body.classList.add("miniapp-mode");
    const app = window.Telegram?.WebApp;
    if (!app) return () => document.body.classList.remove("miniapp-mode");

    app.ready();
    app.expand();
    setWebApp(app);
    setUser(app.initDataUnsafe?.user);
    setTheme({ secondaryBgColor: app.themeParams?.secondary_bg_color });

    if (app.themeParams?.bg_color) document.body.style.backgroundColor = app.themeParams.bg_color;
    return () => document.body.classList.remove("miniapp-mode");
  }, []);

  return {
    isTelegram: Boolean(webApp),
    webApp,
    user,
    theme
  };
}

function HomeScreen({ listings, setTab, onContactClick }: { listings: ListingPrivate[]; setTab: (tab: Tab) => void; onContactClick: (listing: ListingPublic) => void }) {
  return (
    <div className="grid gap-4">
      <section className="overflow-hidden rounded-xl bg-ink text-white">
        <div className="relative min-h-56 p-4">
          <Image src={listings[0].photoUrls[0]} alt="EV" fill sizes="420px" className="object-cover opacity-35" />
          <div className="relative">
            <div className="inline-flex items-center gap-2 rounded-md bg-white/10 px-3 py-2 text-xs font-bold">
              <Bot className="h-4 w-4 text-emerald-200" />
              AI yordamchi
            </div>
            <h2 className="mt-4 text-3xl font-black leading-tight">Elektromobilni tez toping</h2>
            <p className="mt-2 max-w-xs text-sm font-medium leading-6 text-white/80">O'rtacha 10 soniyada byudjetingizga mos EV va REEV e'lonlarini toping.</p>
            <button onClick={() => setTab("search")} className="mt-5 inline-flex h-11 items-center gap-2 rounded-md bg-accent px-4 text-sm font-black">
              Qidirishni boshlash <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-3 gap-2">
        <MiniStat value={String(listings.length)} label="e'lon" />
        <MiniStat value="4" label="EV turi" />
        <MiniStat value="1 tap" label="login" />
      </section>

      <section className="grid gap-3">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-black">Yangi e'lonlar</h3>
          <button onClick={() => setTab("search")} className="text-sm font-black text-brand">Barchasi</button>
        </div>
        {listings.slice(0, 2).map((listing) => <MiniListingCard key={listing.id} listing={listing} onContactClick={onContactClick} />)}
      </section>
    </div>
  );
}

function SearchScreen({
  query,
  setQuery,
  selectedMake,
  setSelectedMake,
  fallbackListings,
  onContactClick
}: {
  query: string;
  setQuery: (value: string) => void;
  selectedMake: string;
  setSelectedMake: (value: string) => void;
  fallbackListings: ListingPrivate[];
  onContactClick: (listing: ListingPublic) => void;
}) {
  const makes = ["Barchasi", "BYD", "Li Auto", "Zeekr", "Nio"];
  const quickPrompts = [
    "20 ming dollargacha",
    "Oilaviy REEV",
    "Toshkentda probegi kam",
    "500 km dan yuqori",
    "Yangi BYD",
    "Batareya 90%+"
  ];
  const [results, setResults] = useState<AiSearchResult[]>([]);
  const [parsedFilters, setParsedFilters] = useState<ListingFilters>({});
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchedQuery, setSearchedQuery] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const initialQuery = selectedMake === "Barchasi" || query.toLowerCase().includes(selectedMake.toLowerCase())
      ? query
      : `${query} ${selectedMake}`;
    void searchWithQuery(initialQuery);
  }, []);

  async function runSearch() {
    const effectiveQuery = selectedMake === "Barchasi" || query.toLowerCase().includes(selectedMake.toLowerCase())
      ? query
      : `${query} ${selectedMake}`;
    await searchWithQuery(effectiveQuery);
  }

  async function searchWithQuery(effectiveQuery: string) {
    setLoading(true);
    setSearchedQuery(effectiveQuery);
    setError("");
    try {
      const [searchResults, helper] = await Promise.all([aiSearch(effectiveQuery), aiSuggestions(effectiveQuery)]);
      setResults(searchResults);
      setParsedFilters(helper.parsed);
      setSuggestions(helper.suggestions);
    } catch {
      setResults([]);
      setParsedFilters({});
      setSuggestions(["Byudjetni yozing", "Probeg chegarasini yozing", "Hududni tanlang"]);
      setError("AI qidiruv vaqtincha ishlamadi. Iltimos, so'rovni qisqartirib qayta urinib ko'ring.");
    } finally {
      setLoading(false);
    }
  }

  function applySuggestion(suggestion: string) {
    const nextQuery = query.toLowerCase().includes(suggestion.toLowerCase()) ? query : `${query}, ${suggestion}`;
    setQuery(nextQuery);
    void searchWithQuery(nextQuery);
  }

  function applyQuickPrompt(prompt: string) {
    const nextQuery = query.trim()
      ? `${query}, ${prompt}`
      : prompt;
    setQuery(nextQuery);
    void searchWithQuery(nextQuery);
  }

  const displayedResults = useMemo(() => {
    const source = results.length
      ? results
      : searchedQuery
        ? []
        : fallbackListings.map((listing, index) => ({
          listing,
          score: 70 - index * 5,
          rank: index + 1,
          confidenceLabel: "medium" as const,
          matchedFilters: { q: query },
          explanationUz: "Nega mos: demo e'lonlar orasidan ko'rsatildi.",
          nextActionUz: "Kontaktni ochish uchun telefon bilan kiring."
        }));

    return selectedMake === "Barchasi"
      ? source
      : source.filter((result) => result.listing.make === selectedMake);
  }, [fallbackListings, query, results, searchedQuery, selectedMake]);

  return (
    <div className="grid gap-4">
      <section className="rounded-xl bg-white p-4 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase text-brand">AI qidiruv</p>
            <h2 className="mt-1 text-xl font-black leading-tight">Qanday EV kerak?</h2>
            <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">Byudjet, probeg, hudud yoki foydalanish maqsadini yozing.</p>
          </div>
          <span className="rounded-md bg-emerald-50 px-2 py-1 text-[11px] font-black text-brand">Guest</span>
        </div>
        <label className="mt-3 flex h-12 items-center gap-2 rounded-lg border border-line bg-slate-50 px-3">
          <Search className="h-5 w-5 text-slate-400" />
          <input value={query} onChange={(event) => setQuery(event.target.value)} className="min-w-0 flex-1 bg-transparent text-sm font-semibold outline-none" placeholder="20 minggacha BYD EV" />
        </label>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {quickPrompts.map((prompt) => (
            <button
              key={prompt}
              onClick={() => applyQuickPrompt(prompt)}
              className="min-h-10 rounded-md bg-slate-100 px-2 py-2 text-left text-xs font-black leading-4 text-slate-700"
            >
              {prompt}
            </button>
          ))}
        </div>
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {makes.map((make) => (
            <button key={make} onClick={() => setSelectedMake(make)} className={`whitespace-nowrap rounded-md px-3 py-2 text-xs font-black ${selectedMake === make ? "bg-brand text-white" : "bg-slate-100 text-slate-700"}`}>
              {make}
            </button>
          ))}
        </div>
        <button onClick={runSearch} disabled={loading} className="mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-md bg-brand text-sm font-black text-white disabled:opacity-70">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bot className="h-4 w-4" />}
          {loading ? "AI mos e'lonlarni tekshiryapti..." : "AI bilan topish"}
        </button>
      </section>

      <AiIntentPanel parsed={parsedFilters} suggestions={suggestions} onSuggestionClick={applySuggestion} />

      <section className="grid gap-3">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-bold text-slate-600">{displayedResults.length} ta mos e'lon</p>
          {searchedQuery ? <p className="truncate text-xs font-semibold text-slate-400">"{searchedQuery}"</p> : null}
        </div>
        {error ? <AiErrorBox message={error} /> : null}
        {displayedResults.map((result) => (
          <div key={result.listing.id} className="grid gap-2">
            <MiniListingCard listing={result.listing} score={result.score} rank={result.rank} confidence={result.confidenceLabel} onContactClick={onContactClick} />
            <AiReasonBox explanation={result.explanationUz} nextAction={result.nextActionUz} />
          </div>
        ))}
        {loading ? <LoadingAiResults /> : null}
        {!displayedResults.length && !loading ? <NoAiResults suggestions={suggestions} onSuggestionClick={applySuggestion} /> : null}
      </section>
    </div>
  );
}

function AiErrorBox({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-red-100 bg-red-50 p-3 text-sm font-semibold leading-6 text-red-700">
      {message}
    </div>
  );
}

function LoadingAiResults() {
  return (
    <div className="grid gap-2">
      {[0, 1].map((item) => (
        <div key={item} className="h-36 animate-pulse rounded-xl bg-white shadow-sm" />
      ))}
    </div>
  );
}

function AiIntentPanel({ parsed, suggestions, onSuggestionClick }: { parsed: ListingFilters; suggestions: string[]; onSuggestionClick: (suggestion: string) => void }) {
  const chips = intentChips(parsed);

  return (
    <section className="rounded-xl bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2">
        <Bot className="h-4 w-4 text-brand" />
        <h3 className="text-sm font-black">AI tushungan talablar</h3>
      </div>
      {chips.length ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {chips.map((chip) => (
            <span key={chip} className="rounded-md bg-brand/10 px-2.5 py-1.5 text-xs font-black text-brand">{chip}</span>
          ))}
        </div>
      ) : (
        <p className="mt-2 text-sm leading-6 text-slate-600">Hali aniq talab topilmadi. Byudjet, marka, probeg yoki range yozing.</p>
      )}
      {suggestions.length ? (
        <div className="mt-3">
          <p className="text-xs font-black uppercase text-slate-400">Aniqlashtirish</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {suggestions.slice(0, 4).map((suggestion) => (
              <button key={suggestion} onClick={() => onSuggestionClick(suggestion)} className="rounded-md bg-slate-100 px-2.5 py-1.5 text-xs font-black text-slate-700">
                + {suggestion}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}

function AiReasonBox({ explanation, nextAction }: { explanation: string; nextAction?: string }) {
  return (
    <div className="rounded-lg bg-white px-3 py-2 text-xs font-semibold leading-5 text-slate-600 shadow-sm">
      <p>{explanation}</p>
      {nextAction ? <p className="mt-1 font-black text-brand">{nextAction}</p> : null}
    </div>
  );
}

function NoAiResults({ suggestions, onSuggestionClick }: { suggestions: string[]; onSuggestionClick: (suggestion: string) => void }) {
  return (
    <div className="rounded-xl bg-white p-4 shadow-sm">
      <h3 className="font-black">Mos e'lon topilmadi</h3>
      <p className="mt-2 text-sm leading-6 text-slate-600">AI qidiruvni toraytirish yoki byudjetni o'zgartirish yordam beradi.</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {suggestions.map((suggestion) => (
          <button key={suggestion} onClick={() => onSuggestionClick(suggestion)} className="rounded-md bg-brand/10 px-2.5 py-1.5 text-xs font-black text-brand">
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  );
}

function intentChips(parsed: ListingFilters) {
  const chips: string[] = [];
  if (parsed.make) chips.push(`Marka: ${parsed.make}`);
  if (parsed.model) chips.push(`Model: ${parsed.model}`);
  if (parsed.powertrainType) chips.push(`Turi: ${parsed.powertrainType}`);
  if (parsed.driveType) chips.push(`Privod: ${parsed.driveType}`);
  if (parsed.region) chips.push(`Hudud: ${parsed.region}`);
  if (parsed.maxPrice) chips.push(`Byudjet: $${parsed.maxPrice.toLocaleString("en-US")} gacha`);
  if (parsed.maxMileageKm) chips.push(`Probeg: ${parsed.maxMileageKm.toLocaleString("en-US")} km gacha`);
  if (parsed.minRangeKm) chips.push(`Range: ${parsed.minRangeKm.toLocaleString("en-US")} km+`);
  if (parsed.minBatteryHealthPercent) chips.push(`Batareya: ${parsed.minBatteryHealthPercent}%+`);
  if (parsed.customsStatus) chips.push("Bojxona: rasmiy");
  return chips;
}

function SellerScreen({ telegramUser }: { telegramUser?: TelegramUser }) {
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<SellerDraft>({
    make: "BYD",
    model: "Song Plus",
    year: "2024",
    powertrainType: "EV",
    trim: "Flagship",
    batteryKwh: "87",
    rangeKm: "605",
    rangeStandard: "CLTC",
    motorPowerKw: "160",
    driveType: "FWD",
    condition: "Yangi olib kelingan",
    batteryHealthPercent: "96",
    customsStatus: "Rasmiylashtirilgan",
    bodyColor: "Oq",
    priceUsd: "28900",
    mileageKm: "12000",
    region: "Toshkent",
    exactLocation: "Sergeli avtomobil bozori",
    latitude: "",
    longitude: "",
    yandexMapUrl: "",
    sellerPhone: "+998",
    sellerTelegramUsername: telegramUser?.username ?? "",
    description: "Xitoydan olib kelingan, batareya holati yaxshi, oilaviy krossover.",
    photoUrls: "https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?auto=format&fit=crop&w=900&q=80"
  });
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState("");
  const stepTitles = ["Mashina", "EV texnika", "Sotuv", "Ko'rib chiqish"];

  function updateDraft<K extends keyof SellerDraft>(key: K, value: SellerDraft[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  function useCurrentLocation() {
    if (!navigator.geolocation) {
      setStatus("Telefoningiz lokatsiyani qo'llab-quvvatlamadi. Yandex Maps URL yoki manzilni qo'lda kiriting.");
      return;
    }

    setStatus("Lokatsiya olinmoqda...");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const latitude = position.coords.latitude.toFixed(6);
        const longitude = position.coords.longitude.toFixed(6);
        setDraft((current) => ({
          ...current,
          latitude,
          longitude,
          yandexMapUrl: `https://yandex.com/maps/?ll=${longitude},${latitude}&z=16&pt=${longitude},${latitude},pm2rdm`
        }));
        setStatus("Yandex Maps lokatsiya tayyor.");
      },
      () => setStatus("Lokatsiya uchun ruxsat berilmadi. Manzil yoki Yandex Maps URL kiriting."),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  async function publishListing() {
    setSaving(true);
    setStatus("");
    try {
      await createSellerListing({
        telegramId: telegramUser?.id ? String(telegramUser.id) : undefined,
        sellerName: telegramUser?.first_name ?? "Seller",
        sellerTelegramUsername: draft.sellerTelegramUsername || telegramUser?.username,
        title: `${draft.make} ${draft.model} ${draft.year}`,
        make: draft.make,
        model: draft.model,
        year: toNumber(draft.year, 2024),
        powertrainType: draft.powertrainType,
        trim: draft.trim || undefined,
        batteryKwh: toOptionalNumber(draft.batteryKwh),
        rangeKm: toOptionalNumber(draft.rangeKm),
        rangeStandard: draft.rangeStandard,
        motorPowerKw: toOptionalNumber(draft.motorPowerKw),
        driveType: draft.driveType,
        condition: draft.condition || undefined,
        batteryHealthPercent: toOptionalNumber(draft.batteryHealthPercent),
        customsStatus: draft.customsStatus || undefined,
        bodyColor: draft.bodyColor || undefined,
        priceUsd: toNumber(draft.priceUsd, 0),
        mileageKm: toNumber(draft.mileageKm, 0),
        region: draft.region,
        exactLocation: draft.exactLocation || undefined,
        latitude: toOptionalNumber(draft.latitude),
        longitude: toOptionalNumber(draft.longitude),
        yandexMapUrl: draft.yandexMapUrl || undefined,
        sellerPhone: draft.sellerPhone || undefined,
        description: draft.description,
        photoUrls: draft.photoUrls.split(/\n|,/).map((url) => url.trim()).filter(Boolean)
      });
      setStatus("E'lon saqlandi. Endi AI qidiruv bu ma'lumotlardan foydalanadi.");
    } catch {
      setStatus("E'lon saqlanmadi. Telefon/login yoki internet sozlamalarini tekshiring.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid gap-4">
      <section className="rounded-xl bg-white p-4 shadow-sm">
        <p className="text-xs font-black uppercase text-brand">Seller mode</p>
        <h2 className="mt-1 text-2xl font-black">E'lon berish</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">AI yaxshi topishi uchun probeg, batareya, range, narx va Yandex Maps lokatsiyani aniq kiriting.</p>
        <div className="mt-4 grid grid-cols-4 gap-1">
          {stepTitles.map((title, index) => (
            <button
              key={title}
              onClick={() => setStep(index)}
              className={`min-h-10 rounded-md px-1 text-[11px] font-black leading-3 ${step === index ? "bg-brand text-white" : "bg-slate-100 text-slate-600"}`}
            >
              {index + 1}. {title}
            </button>
          ))}
        </div>
      </section>

      {step === 0 ? (
        <SellerPanel title="Mashina ma'lumotlari" badge="1/4">
          <SellerTextInput label="Marka" value={draft.make} onChange={(value) => updateDraft("make", value)} placeholder="BYD" />
          <SellerTextInput label="Model" value={draft.model} onChange={(value) => updateDraft("model", value)} placeholder="Song Plus" />
          <SellerTextInput label="Yil" value={draft.year} onChange={(value) => updateDraft("year", value)} placeholder="2024" inputMode="numeric" />
          <SellerSelect label="EV turi" value={draft.powertrainType} onChange={(value) => updateDraft("powertrainType", value as SellerDraft["powertrainType"])} options={["EV", "REEV", "PHEV", "HYBRID"]} />
          <SellerTextInput label="Trim/modifikatsiya" value={draft.trim} onChange={(value) => updateDraft("trim", value)} placeholder="Base / Pro / Max / Flagship" />
          <SellerTextInput label="Holati" value={draft.condition} onChange={(value) => updateDraft("condition", value)} placeholder="Yangi / yaxshi / a'lo" />
        </SellerPanel>
      ) : null}

      {step === 1 ? (
        <SellerPanel title="EV texnika va probeg" badge="2/4">
          <SellerTextInput label="Probeg, km" value={draft.mileageKm} onChange={(value) => updateDraft("mileageKm", value)} placeholder="12000" inputMode="numeric" />
          <SellerTextInput label="Batareya, kWh" value={draft.batteryKwh} onChange={(value) => updateDraft("batteryKwh", value)} placeholder="87" inputMode="decimal" />
          <SellerTextInput label="Range, km" value={draft.rangeKm} onChange={(value) => updateDraft("rangeKm", value)} placeholder="605" inputMode="numeric" />
          <SellerSelect label="Range standarti" value={draft.rangeStandard} onChange={(value) => updateDraft("rangeStandard", value as SellerDraft["rangeStandard"])} options={["CLTC", "WLTP", "EPA", "UNKNOWN"]} />
          <SellerTextInput label="Batareya holati, %" value={draft.batteryHealthPercent} onChange={(value) => updateDraft("batteryHealthPercent", value)} placeholder="95" inputMode="numeric" />
          <SellerTextInput label="Motor quvvati, kW" value={draft.motorPowerKw} onChange={(value) => updateDraft("motorPowerKw", value)} placeholder="160" inputMode="numeric" />
          <SellerSelect label="Privod" value={draft.driveType} onChange={(value) => updateDraft("driveType", value as SellerDraft["driveType"])} options={["UNKNOWN", "FWD", "RWD", "AWD"]} />
          <SellerTextInput label="Bojxona" value={draft.customsStatus} onChange={(value) => updateDraft("customsStatus", value)} placeholder="Rasmiylashtirilgan" />
          <SellerTextInput label="Rangi" value={draft.bodyColor} onChange={(value) => updateDraft("bodyColor", value)} placeholder="Oq" />
        </SellerPanel>
      ) : null}

      {step === 2 ? (
        <SellerPanel title="Sotuv va lokatsiya" badge="3/4">
          <SellerTextInput label="Narx, USD" value={draft.priceUsd} onChange={(value) => updateDraft("priceUsd", value)} placeholder="28900" inputMode="numeric" />
          <SellerTextInput label="Hudud" value={draft.region} onChange={(value) => updateDraft("region", value)} placeholder="Toshkent" />
          <SellerTextInput label="Aniq manzil" value={draft.exactLocation} onChange={(value) => updateDraft("exactLocation", value)} placeholder="Sergeli avtomobil bozori" />
          <SellerTextInput label="Telefon" value={draft.sellerPhone} onChange={(value) => updateDraft("sellerPhone", value)} placeholder="+998901234567" inputMode="tel" />
          <SellerTextInput label="Telegram username" value={draft.sellerTelegramUsername} onChange={(value) => updateDraft("sellerTelegramUsername", value)} placeholder="avto_seller" />
          <div className="col-span-2 grid gap-2">
            <button onClick={useCurrentLocation} className="flex h-12 items-center justify-center gap-2 rounded-md border border-brand/30 bg-brand/10 text-sm font-black text-brand">
              <MapPinned className="h-4 w-4" /> Hozirgi lokatsiyadan Yandex Maps yaratish
            </button>
            <SellerTextInput label="Yandex Maps URL" value={draft.yandexMapUrl} onChange={(value) => updateDraft("yandexMapUrl", value)} placeholder="https://yandex.com/maps/..." />
          </div>
        </SellerPanel>
      ) : null}

      {step === 3 ? (
        <section className="rounded-xl bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="font-black">Ko'rib chiqish</h3>
            <span className="rounded-md bg-brand/10 px-2 py-1 text-xs font-black text-brand">4/4</span>
          </div>
          <div className="mt-4 rounded-lg border border-line p-3">
            <p className="text-lg font-black">{draft.make} {draft.model} {draft.year}</p>
            <p className="mt-1 text-2xl font-black text-brand">${toNumber(draft.priceUsd, 0).toLocaleString("en-US")}</p>
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs font-semibold text-slate-600">
              <span className="flex items-center gap-1"><Zap className="h-4 w-4 text-brand" />{draft.powertrainType} · {draft.trim}</span>
              <span className="flex items-center gap-1"><Gauge className="h-4 w-4" />{toNumber(draft.mileageKm, 0).toLocaleString("en-US")} km</span>
              <span className="flex items-center gap-1"><BatteryCharging className="h-4 w-4 text-cobalt" />{draft.rangeKm || "-"} km</span>
              <span className="flex items-center gap-1"><MapPin className="h-4 w-4" />{draft.region}</span>
            </div>
          </div>
          <label className="mt-4 grid gap-1 text-sm font-bold">
            Tavsif
            <textarea value={draft.description} onChange={(event) => updateDraft("description", event.target.value)} rows={4} className="rounded-md border border-line px-3 py-2 text-sm outline-none focus:border-brand" />
          </label>
          <label className="mt-3 grid gap-1 text-sm font-bold">
            Rasm URL
            <textarea value={draft.photoUrls} onChange={(event) => updateDraft("photoUrls", event.target.value)} rows={3} placeholder="Har qatorga bitta rasm URL" className="rounded-md border border-line px-3 py-2 text-sm outline-none focus:border-brand" />
          </label>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <button onClick={() => setStep(0)} className="h-12 rounded-md bg-slate-100 text-sm font-black text-slate-700">Tahrirlash</button>
            <button onClick={publishListing} disabled={saving} className="flex h-12 items-center justify-center gap-2 rounded-md bg-brand text-sm font-black text-white disabled:opacity-70">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Saqlash
            </button>
          </div>
        </section>
      ) : null}

      {status ? (
        <div className="flex items-start gap-2 rounded-xl bg-white p-3 text-sm font-semibold leading-6 text-slate-700 shadow-sm">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
          <span>{status}</span>
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-2">
        <button disabled={step === 0} onClick={() => setStep((current) => Math.max(0, current - 1))} className="h-11 rounded-md bg-slate-100 text-sm font-black text-slate-700 disabled:opacity-40">Orqaga</button>
        <button disabled={step === 3} onClick={() => setStep((current) => Math.min(3, current + 1))} className="h-11 rounded-md bg-ink text-sm font-black text-white disabled:opacity-40">Keyingi</button>
      </div>
    </div>
  );
}

function SellerPanel({ title, badge, children }: { title: string; badge: string; children: ReactNode }) {
  return (
    <section className="rounded-xl bg-white p-4 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-black">{title}</h3>
        <span className="rounded-md bg-brand/10 px-2 py-1 text-xs font-black text-brand">{badge}</span>
      </div>
      <div className="grid grid-cols-2 gap-3">{children}</div>
    </section>
  );
}

function SellerTextInput({
  label,
  value,
  onChange,
  placeholder,
  inputMode = "text"
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  inputMode?: "text" | "numeric" | "decimal" | "tel";
}) {
  return (
    <label className="grid gap-1 text-sm font-bold">
      {label}
      <input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} inputMode={inputMode} className="h-11 min-w-0 rounded-md border border-line px-3 text-sm outline-none focus:border-brand" />
    </label>
  );
}

function SellerSelect({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: string[] }) {
  return (
    <label className="grid gap-1 text-sm font-bold">
      {label}
      <select value={value} onChange={(event) => onChange(event.target.value)} className="h-11 min-w-0 rounded-md border border-line bg-white px-3 text-sm outline-none focus:border-brand">
        {options.map((option) => <option key={option} value={option}>{option}</option>)}
      </select>
    </label>
  );
}

function toNumber(value: string, fallback: number) {
  const numeric = Number(value.replace(/[^0-9.]/g, ""));
  return Number.isFinite(numeric) ? numeric : fallback;
}

function toOptionalNumber(value: string) {
  const numeric = toNumber(value, Number.NaN);
  return Number.isFinite(numeric) ? numeric : undefined;
}

function ProfileScreen({ listings }: { listings: ListingPrivate[] }) {
  return (
    <div className="grid gap-4">
      <section className="rounded-xl bg-ink p-4 text-white">
        <div className="grid h-16 w-16 place-items-center rounded-full bg-brand text-2xl font-black">A</div>
        <h2 className="mt-3 text-xl font-black">Azizbek</h2>
        <p className="text-sm text-white/70">Telefon tasdiqlangan</p>
      </section>

      <section className="grid gap-3">
        <h3 className="text-lg font-black">Mening e'lonlarim</h3>
        {listings.slice(0, 1).map((listing) => <MiniListingCard key={listing.id} listing={listing} sellerMode />)}
      </section>
    </div>
  );
}

function MiniListingCard({
  listing,
  sellerMode = false,
  score,
  rank,
  confidence,
  onContactClick
}: {
  listing: ListingPublic;
  sellerMode?: boolean;
  score?: number;
  rank?: number;
  confidence?: "high" | "medium" | "low";
  onContactClick?: (listing: ListingPublic) => void;
}) {
  return (
    <article className="overflow-hidden rounded-xl bg-white shadow-sm">
      <div className="relative aspect-[16/10] bg-slate-100">
        <Image src={listing.photoUrls[0]} alt={listing.title} fill sizes="420px" className="object-cover" />
        <span className="absolute left-3 top-3 rounded-md bg-white px-2 py-1 text-xs font-black text-brand">{listing.powertrainType}</span>
        {rank ? <span className="absolute bottom-3 left-3 rounded-md bg-ink/90 px-2 py-1 text-xs font-black text-white">#{rank} · {score}% · {confidenceLabel(confidence)}</span> : null}
        <button className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full bg-white text-slate-600"><Heart className="h-4 w-4" /></button>
      </div>
      <div className="p-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-black">{listing.title}</h3>
            <p className="mt-1 text-xl font-black">${listing.priceUsd.toLocaleString("en-US")}</p>
          </div>
          <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-black text-slate-600">{listing.year}</span>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2 text-xs font-semibold text-slate-600">
          <span className="flex items-center gap-1"><BatteryCharging className="h-4 w-4 text-cobalt" />{listing.rangeKm} km</span>
          <span className="flex items-center gap-1"><Gauge className="h-4 w-4" />{listing.mileageKm.toLocaleString("en-US")} km</span>
          <span className="flex items-center gap-1"><Zap className="h-4 w-4 text-brand" />{listing.trim}</span>
          <span className="flex items-center gap-1"><MapPin className="h-4 w-4" />{listing.region}</span>
        </div>
        {sellerMode ? (
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button className="h-10 rounded-md bg-slate-100 text-xs font-black">Sotildi</button>
            <button className="h-10 rounded-md bg-red-50 text-xs font-black text-red-600">O'chirish</button>
          </div>
        ) : (
          <button onClick={() => onContactClick?.(listing)} className="mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-md bg-brand text-sm font-black text-white">
            <LockKeyhole className="h-4 w-4" /> Kontaktni ochish
          </button>
        )}
      </div>
    </article>
  );
}

function confidenceLabel(confidence?: "high" | "medium" | "low") {
  if (confidence === "high") return "kuchli";
  if (confidence === "medium") return "o'rtacha";
  if (confidence === "low") return "yaqin";
  return "AI";
}

function LockedContactSheet({ listing, telegram, onClose, onLogin }: { listing: ListingPublic; telegram?: TelegramWebApp; onClose: () => void; onLogin: () => void }) {
  function handleLogin() {
    telegram?.showPopup?.({
      title: "Kirish kerak",
      message: "Telefon raqam bilan kirgandan keyin sotuvchi telefoni va Yandex Maps lokatsiyasi ochiladi.",
      buttons: [{ type: "ok", text: "Tushunarli" }]
    });
    onLogin();
    onClose();
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 mx-auto max-w-md">
      <div className="rounded-t-2xl bg-white p-4 shadow-2xl ring-1 ring-black/5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase text-brand">Guest mode</p>
            <h3 className="mt-1 text-lg font-black">Kontaktlar yopiq</h3>
          </div>
          <button onClick={onClose} className="grid h-9 w-9 place-items-center rounded-full bg-slate-100 text-slate-600">
            <X className="h-4 w-4" />
          </button>
        </div>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          {listing.title} sotuvchisining telefoni va aniq Yandex Maps lokatsiyasini ko'rish uchun telefon raqam bilan kiring.
        </p>
        <div className="mt-4 grid gap-2">
          <button onClick={handleLogin} className="h-12 rounded-md bg-brand text-sm font-black text-white">Telefon bilan kirish</button>
          <button onClick={onClose} className="h-11 rounded-md bg-slate-100 text-sm font-black text-slate-700">Hozircha ko'rish</button>
        </div>
      </div>
    </div>
  );
}

function MiniStat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-xl bg-white p-3 shadow-sm">
      <p className="text-xl font-black">{value}</p>
      <p className="text-xs font-bold text-slate-500">{label}</p>
    </div>
  );
}

function TabButton({ active, icon, label, onClick }: { active: boolean; icon: ReactNode; label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className={`flex min-h-12 flex-col items-center justify-center gap-1 rounded-lg text-[11px] font-black ${active ? "bg-brand/10 text-brand" : "text-slate-500"}`}>
      {icon}
      {label}
    </button>
  );
}
