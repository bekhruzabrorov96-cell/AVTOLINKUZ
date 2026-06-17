import { ListingCard } from "@/components/listing-card";
import { getListings } from "@/lib/api";
import type { PowertrainType } from "@avtolink/shared";
import { SlidersHorizontal, Search } from "lucide-react";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export const metadata = {
  title: "E'lonlar"
};

export default async function ListingsPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const listings = await getListings({
    q: value(params.q),
    make: value(params.make),
    region: value(params.region),
    powertrainType: powertrainValue(params.powertrainType),
    minPrice: numberValue(params.minPrice),
    maxPrice: numberValue(params.maxPrice),
    minYear: numberValue(params.minYear),
    maxYear: numberValue(params.maxYear),
    maxMileageKm: numberValue(params.maxMileageKm),
    minRangeKm: numberValue(params.minRangeKm)
  });

  return (
    <div className="grid gap-4 md:grid-cols-[300px_1fr]">
      <aside className="app-panel h-fit p-4">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-5 w-5 text-brand" />
          <h1 className="text-lg font-black">Qidiruv</h1>
        </div>
        <form className="mt-4 grid gap-3">
          <input name="q" defaultValue={value(params.q)} placeholder="Tezkor qidiruv" className="form-control" />
          <input name="make" defaultValue={value(params.make)} placeholder="Marka" className="form-control" />
          <input name="region" defaultValue={value(params.region)} placeholder="Hudud" className="form-control" />
          <select name="powertrainType" defaultValue={value(params.powertrainType)} className="form-control">
            <option value="">EV turi</option>
            <option value="EV">EV</option>
            <option value="REEV">REEV</option>
            <option value="PHEV">PHEV</option>
            <option value="HYBRID">Hybrid</option>
          </select>
          <div className="grid grid-cols-2 gap-2">
            <input name="minPrice" defaultValue={value(params.minPrice)} placeholder="Min $" inputMode="numeric" className="form-control" />
            <input name="maxPrice" defaultValue={value(params.maxPrice)} placeholder="Max $" inputMode="numeric" className="form-control" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <input name="minYear" defaultValue={value(params.minYear)} placeholder="Yildan" inputMode="numeric" className="form-control" />
            <input name="maxYear" defaultValue={value(params.maxYear)} placeholder="Yilgacha" inputMode="numeric" className="form-control" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <input name="maxMileageKm" defaultValue={value(params.maxMileageKm)} placeholder="Max km" inputMode="numeric" className="form-control" />
            <input name="minRangeKm" defaultValue={value(params.minRangeKm)} placeholder="Min range" inputMode="numeric" className="form-control" />
          </div>
          <button className="primary-button"><Search className="h-4 w-4" />Topish</button>
        </form>
      </aside>
      <section className="grid gap-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-black text-ink">E'lonlar</h2>
            <p className="text-sm text-slate-600">{listings.length} ta e'lon topildi</p>
          </div>
        </div>
        <div className="grid gap-3">
          {listings.map((listing) => <ListingCard key={listing.id} listing={listing} />)}
        </div>
      </section>
    </div>
  );
}

function value(input: string | string[] | undefined) {
  return Array.isArray(input) ? input[0] : input ?? "";
}

function numberValue(input: string | string[] | undefined) {
  const parsed = Number(value(input));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

function powertrainValue(input: string | string[] | undefined): PowertrainType | undefined {
  const selected = value(input);
  return ["EV", "REEV", "PHEV", "HYBRID"].includes(selected) ? selected as PowertrainType : undefined;
}
