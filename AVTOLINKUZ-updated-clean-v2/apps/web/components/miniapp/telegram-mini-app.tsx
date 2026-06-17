"use client";

import Image from "next/image";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { BatteryCharging, Bot, CarFront, ChevronRight, Gauge, Heart, Home, Loader2, LockKeyhole, MapPin, Navigation, PlusCircle, Search, User, X, Zap } from "lucide-react";
import type { AiSearchResult, ListingFilters, ListingPrivate, ListingPublic } from "@avtolink/shared";
import { aiSearch, aiSuggestions } from "@/lib/api";

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
            <span className="grid h-10 w-10 place-items-center rounded-lg bg-brand text-white"><CarFront className="h-5 w-5" /></span>
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
        {tab === "sell" ? <SellerScreen /> : null}
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
        <p className="text-xs font-black uppercase text-brand">AI qidiruv</p>
        <label className="mt-3 flex h-12 items-center gap-2 rounded-lg border border-line bg-slate-50 px-3">
          <Search className="h-5 w-5 text-slate-400" />
          <input value={query} onChange={(event) => setQuery(event.target.value)} className="min-w-0 flex-1 bg-transparent text-sm font-semibold outline-none" placeholder="20 minggacha BYD EV" />
        </label>
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {makes.map((make) => (
            <button key={make} onClick={() => setSelectedMake(make)} className={`whitespace-nowrap rounded-md px-3 py-2 text-xs font-black ${selectedMake === make ? "bg-brand text-white" : "bg-slate-100 text-slate-700"}`}>
              {make}
            </button>
          ))}
        </div>
        <button onClick={runSearch} disabled={loading} className="mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-md bg-brand text-sm font-black text-white disabled:opacity-70">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bot className="h-4 w-4" />}
          AI bilan topish
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

function SellerScreen() {
  const carFields = [
    ["Marka", "BYD"],
    ["Model", "Song Plus"],
    ["Yil", "2024"],
    ["Turi", "EV / REEV"],
    ["Trim", "Flagship"],
    ["Holati", "Yangi / ishlatilgan"]
  ];
  const usedFields = [
    ["Probeg", "12 000 km"],
    ["Batareya", "87 kWh"],
    ["Range", "605 km"],
    ["Batareya holati", "95%"],
    ["Privod", "FWD / RWD / AWD"],
    ["Bojxona", "Rasmiylashtirilgan"]
  ];
  const saleFields = [
    ["Narx", "$28,900"],
    ["Hudud", "Toshkent"],
    ["Aniq manzil", "Yandex Maps orqali"],
    ["Telefon", "+998 90 123 45 67"]
  ];

  return (
    <div className="grid gap-4">
      <section className="rounded-xl bg-white p-4 shadow-sm">
        <p className="text-xs font-black uppercase text-brand">Seller mode</p>
        <h2 className="mt-1 text-2xl font-black">E'lon berish</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">Sotuvchi barcha muhim EV ma'lumotlarini kiritadi: probeg, batareya, range, holat, narx va xaritadagi lokatsiya.</p>
      </section>

      <section className="rounded-xl bg-white p-4 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-black">Mashina</h3>
          <span className="rounded-md bg-brand/10 px-2 py-1 text-xs font-black text-brand">1/3</span>
        </div>
        <FieldGrid fields={carFields} />
      </section>

      <section className="rounded-xl bg-white p-4 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-black">Texnik holat</h3>
          <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-black text-slate-600">ishlatilgan auto</span>
        </div>
        <FieldGrid fields={usedFields} />
      </section>

      <section className="rounded-xl bg-white p-4 shadow-sm">
        <h3 className="font-black">Sotuv va lokatsiya</h3>
        <div className="mt-4 grid gap-3">
          <FieldGrid fields={saleFields} />
          <button className="flex h-12 items-center justify-center gap-2 rounded-md border border-brand/30 bg-brand/10 text-sm font-black text-brand">
            <Navigation className="h-4 w-4" /> Yandex Maps orqali lokatsiya tanlash
          </button>
          <button className="h-12 rounded-md bg-brand text-sm font-black text-white">E'lonni ko'rib chiqish</button>
        </div>
      </section>
    </div>
  );
}

function FieldGrid({ fields }: { fields: string[][] }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {fields.map(([label, value], index) => (
        <label key={label} className={index === fields.length - 1 && fields.length % 2 === 1 ? "col-span-2 grid gap-1 text-sm font-bold" : "grid gap-1 text-sm font-bold"}>
          {label}
          <input placeholder={value} className="h-11 rounded-md border border-line px-3 text-sm outline-none focus:border-brand" />
        </label>
      ))}
    </div>
  );
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
