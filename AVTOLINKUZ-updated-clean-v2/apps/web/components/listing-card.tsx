import Image from "next/image";
import Link from "next/link";
import { BatteryCharging, Gauge, MapPin, Zap } from "lucide-react";
import type { Listing } from "@avtolink/shared";

export function ListingCard({ listing }: { listing: Listing }) {
  return (
    <Link href={`/listings/${listing.id}`} className="group grid grid-cols-[132px_1fr] gap-3 rounded-lg border border-line bg-white p-2 shadow-sm transition hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-md sm:grid-cols-[190px_1fr]">
      <div className="relative aspect-[4/3] overflow-hidden rounded-md bg-slate-100">
        <Image src={listing.photoUrls[0]} alt={listing.title} fill sizes="180px" className="object-cover" />
        <span className="absolute left-2 top-2 rounded-md bg-white/95 px-2 py-1 text-[11px] font-bold text-brand shadow-sm">{listing.powertrainType}</span>
      </div>
      <div className="flex min-w-0 flex-col justify-between py-1 pr-1">
        <div>
          <h3 className="line-clamp-2 text-sm font-bold text-ink transition group-hover:text-brand sm:text-base">{listing.title}</h3>
          <p className="mt-1 text-xl font-black text-ink">${listing.priceUsd.toLocaleString("en-US")}</p>
        </div>
        <div className="grid gap-1.5 text-xs text-slate-600 sm:text-sm">
          <span className="flex items-center gap-1"><Zap className="h-4 w-4 text-brand" />{listing.year} yil{listing.trim ? ` · ${listing.trim}` : ""}</span>
          {listing.rangeKm ? <span className="flex items-center gap-1"><BatteryCharging className="h-4 w-4 text-cobalt" />{listing.rangeKm.toLocaleString("en-US")} km {listing.rangeStandard ?? ""}</span> : null}
          <span className="flex items-center gap-1"><Gauge className="h-4 w-4" />{listing.mileageKm.toLocaleString("en-US")} km</span>
          <span className="flex items-center gap-1"><MapPin className="h-4 w-4" />{listing.region}</span>
        </div>
      </div>
    </Link>
  );
}
