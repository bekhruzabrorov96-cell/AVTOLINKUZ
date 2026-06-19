import Image from "next/image";
import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { BatteryCharging, Gauge, Heart, LockKeyhole, MapPin, MessageCircle, Phone, Zap } from "lucide-react";
import { getListing } from "@/lib/api";

export default async function ListingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const listing = await getListing(id);
  if (!listing) notFound();

  return (
    <article className="grid gap-4 lg:grid-cols-[1fr_360px]">
      <section className="grid gap-4">
        <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-slate-100 shadow-sm md:aspect-[16/9]">
          <Image src={listing.photoUrls[0]} alt={listing.title} fill priority sizes="(min-width: 1024px) 720px, 100vw" className="object-cover" />
          <span className="absolute left-4 top-4 rounded-md bg-white px-3 py-2 text-sm font-black text-brand shadow-sm">{listing.powertrainType}</span>
        </div>
        <div className="app-panel p-4 sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="text-2xl font-black text-ink">{listing.title}</h1>
              <p className="mt-2 flex items-center gap-2 text-sm font-medium text-slate-600"><MapPin className="h-4 w-4" />{listing.region}</p>
            </div>
            <p className="text-3xl font-black text-ink">${listing.priceUsd.toLocaleString("en-US")}</p>
          </div>
          <dl className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
            <Fact icon={<Zap className="h-4 w-4" />} label="Marka" value={listing.make} />
            <Fact icon={<Zap className="h-4 w-4" />} label="Model" value={listing.model} />
            <Fact icon={<Zap className="h-4 w-4" />} label="Yil" value={String(listing.year)} />
            <Fact icon={<Gauge className="h-4 w-4" />} label="Probeg" value={`${listing.mileageKm.toLocaleString("en-US")} km`} />
            <Fact icon={<Zap className="h-4 w-4" />} label="EV turi" value={listing.powertrainType} />
            <Fact icon={<Zap className="h-4 w-4" />} label="Komplektatsiya" value={listing.trim ?? "Kiritilmagan"} />
            <Fact icon={<BatteryCharging className="h-4 w-4" />} label="Yurish zaxirasi" value={listing.rangeKm ? `${listing.rangeKm.toLocaleString("en-US")} km ${listing.rangeStandard ?? ""}` : "Kiritilmagan"} />
            <Fact icon={<BatteryCharging className="h-4 w-4" />} label="Batareya" value={listing.batteryKwh ? `${listing.batteryKwh} kWh` : "Kiritilmagan"} />
            <Fact icon={<BatteryCharging className="h-4 w-4" />} label="Batareya holati" value={listing.batteryHealthPercent ? `${listing.batteryHealthPercent}%` : "Kiritilmagan"} />
            <Fact icon={<Zap className="h-4 w-4" />} label="Bojxona" value={listing.customsStatus ?? "Kiritilmagan"} />
            <Fact icon={<Zap className="h-4 w-4" />} label="Rangi" value={listing.bodyColor ?? "Kiritilmagan"} />
            <Fact icon={<Zap className="h-4 w-4" />} label="VIN" value={listing.vin ?? "Kiritilmagan"} />
          </dl>
          <div className="mt-5 border-t border-line pt-5">
            <h2 className="text-lg font-black text-ink">Tavsif</h2>
            <p className="mt-2 leading-7 text-slate-700">{listing.description}</p>
          </div>
        </div>
      </section>

      <aside className="app-panel h-fit p-4">
        <p className="text-sm text-slate-500">Sotuvchi</p>
        <h2 className="mt-1 text-xl font-black">{listing.seller.name}</h2>
        <p className="mt-1 text-sm text-slate-600">{listing.region}</p>
        <div className="mt-4 rounded-lg bg-brand/10 p-4 text-sm leading-6 text-slate-700 ring-1 ring-brand/20">
          <LockKeyhole className="mb-2 h-5 w-5 text-brand" />
          Telefon raqam va aniq manzilni ko'rish uchun telefon raqam bilan kiring.
        </div>
        <div className="mt-4 grid gap-2">
          <button className="primary-button h-12">
            <Phone className="h-5 w-5" /> Kirib kontaktni ko'rish
          </button>
          <button className="secondary-button h-12">
            <MessageCircle className="h-5 w-5" /> Chat
          </button>
          <button className="secondary-button h-12">
            <Heart className="h-5 w-5" /> Sevimlilarga
          </button>
        </div>
      </aside>
    </article>
  );
}

function Fact({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-md bg-slate-50 p-3">
      <div className="text-brand">{icon}</div>
      <dt className="text-xs text-slate-500">{label}</dt>
      <dd className="mt-1 font-semibold text-ink">{value}</dd>
    </div>
  );
}
