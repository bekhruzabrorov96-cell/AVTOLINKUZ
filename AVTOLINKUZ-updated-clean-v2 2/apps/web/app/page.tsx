import Link from "next/link";
import Image from "next/image";
import type { ReactNode } from "react";
import { ArrowRight, BatteryCharging, Bot, LockKeyhole, Search, ShieldCheck, Zap } from "lucide-react";
import { ListingCard } from "@/components/listing-card";
import { getListings } from "@/lib/api";

const makes = ["BYD", "Li Auto", "Zeekr", "Nio", "Xpeng"];
const quickSearches = [
  "20 ming dollargacha BYD EV",
  "oilaga mos REEV",
  "range 500 km dan yuqori",
  "kam yurgan Zeekr"
];

export default async function HomePage() {
  const listings = await getListings();
  const activeListings = listings.length;

  return (
    <div className="grid gap-6">
      <section className="relative overflow-hidden rounded-xl bg-ink text-white shadow-sm">
        <Image
          src="https://images.unsplash.com/photo-1593941707882-a5bba14938c7?auto=format&fit=crop&w=1600&q=80"
          alt="Elektr avtomobil"
          fill
          priority
          sizes="100vw"
          className="object-cover opacity-35"
        />
        <div className="relative grid gap-8 p-5 sm:p-7 lg:grid-cols-[1fr_390px] lg:p-8">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-md bg-white/10 px-3 py-2 text-sm font-semibold ring-1 ring-white/20">
              <Bot className="h-4 w-4 text-emerald-200" />
              AI bilan Xitoy EV va REEV qidiruv
            </div>
            <h1 className="mt-4 max-w-2xl text-4xl font-black leading-tight sm:text-5xl">Avtolink.uz</h1>
            <p className="mt-3 max-w-2xl text-base leading-7 text-white/80">
              Byudjet, yurish masofasi, EV turi va hududni yozing. Avtolink AI ichki e'lonlar orasidan mos mashinalarni topadi.
            </p>
            <form action="/ai-search" className="mt-6 grid gap-3 sm:grid-cols-[1fr_auto]">
              <label className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <input name="q" placeholder="Masalan: 20 ming dollargacha BYD EV, yurishi kam" className="min-h-12 w-full rounded-lg border border-white/20 bg-white px-10 py-4 text-sm font-medium text-ink outline-none focus:ring-4 focus:ring-brand/30" />
              </label>
              <button className="primary-button h-12 bg-accent hover:bg-orange-700">
                Topish <ArrowRight className="h-4 w-4" />
              </button>
            </form>
            <div className="mt-4 flex flex-wrap gap-2">
              {quickSearches.map((item) => (
                <Link key={item} href={`/ai-search?q=${encodeURIComponent(item)}`} className="rounded-md bg-white/10 px-3 py-2 text-xs font-semibold text-white ring-1 ring-white/20 hover:bg-white/20">
                  {item}
                </Link>
              ))}
            </div>
          </div>
          <div className="grid content-end gap-3">
            <div className="grid grid-cols-3 gap-2 rounded-lg bg-white/10 p-3 ring-1 ring-white/20 backdrop-blur">
              <Metric value={String(activeListings)} label="aktiv e'lon" />
              <Metric value="4" label="EV turi" />
              <Metric value="24/7" label="Telegram bot" />
            </div>
            <div className="grid gap-2 rounded-lg bg-white p-4 text-ink shadow-xl">
              <div className="flex items-center gap-2 text-sm font-bold"><LockKeyhole className="h-4 w-4 text-brand" />Kontaktlar himoyalangan</div>
              <p className="text-sm leading-6 text-slate-600">Guest narx va tavsifni ko'radi. Telefon va aniq lokatsiya login qilingandan keyin ochiladi.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-3">
        <Feature icon={<BatteryCharging className="h-5 w-5" />} title="EV/REEV fokus" text="Batareya, range, trim va privod bo'yicha solishtiring." />
        <Feature icon={<ShieldCheck className="h-5 w-5" />} title="Kontakt nazorati" text="Seller telefoni va lokatsiya faqat login bilan ochiladi." />
        <Feature icon={<Zap className="h-5 w-5" />} title="Tez qidiruv" text="Uzbek tilida yozilgan so'rovdan mos e'lonlar topiladi." />
      </section>

      <section className="flex gap-2 overflow-x-auto pb-1">
        {makes.map((make) => (
          <Link key={make} href={`/listings?make=${make}`} className="whitespace-nowrap rounded-md border border-line bg-white px-4 py-2 text-sm font-bold shadow-sm hover:border-brand/50">
            {make}
          </Link>
        ))}
      </section>

      <section className="grid gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-black text-ink">Yangi e'lonlar</h2>
          <Link href="/listings" className="text-sm font-bold text-brand">Barchasi</Link>
        </div>
        <div className="grid gap-3 lg:grid-cols-2">
          {listings.map((listing) => <ListingCard key={listing.id} listing={listing} />)}
        </div>
      </section>
    </div>
  );
}

function Metric({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <p className="text-2xl font-black">{value}</p>
      <p className="mt-1 text-xs font-medium text-white/70">{label}</p>
    </div>
  );
}

function Feature({ icon, title, text }: { icon: ReactNode; title: string; text: string }) {
  return (
    <div className="app-panel p-4">
      <div className="grid h-10 w-10 place-items-center rounded-md bg-brand/10 text-brand">{icon}</div>
      <h2 className="mt-3 text-base font-black text-ink">{title}</h2>
      <p className="mt-1 text-sm leading-6 text-slate-600">{text}</p>
    </div>
  );
}
