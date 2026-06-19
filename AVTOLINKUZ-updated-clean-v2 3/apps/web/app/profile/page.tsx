import Link from "next/link";
import { Bell, PlusCircle, Settings, ShieldCheck } from "lucide-react";
import { ListingCard } from "@/components/listing-card";
import { featuredListings } from "@/lib/mock-data";

export const metadata = {
  title: "Profil"
};

export default function ProfilePage() {
  return (
    <div className="grid gap-4 lg:grid-cols-[300px_1fr]">
      <aside className="app-panel h-fit overflow-hidden">
        <div className="bg-ink p-4 text-white">
          <div className="grid h-16 w-16 place-items-center rounded-full bg-brand text-2xl font-black text-white ring-4 ring-white/10">A</div>
          <h1 className="mt-3 text-xl font-black">Azizbek</h1>
          <p className="text-sm text-white/70">+998 90 123 45 67</p>
        </div>
        <div className="grid gap-2 p-4 text-sm">
          <div className="flex items-center gap-2 rounded-md bg-brand/10 px-3 py-3 text-sm font-semibold text-brand">
            <ShieldCheck className="h-4 w-4" />
            Telefon tasdiqlangan
          </div>
          <Link href="/new-listing" className="primary-button"><PlusCircle className="h-4 w-4" />E'lon berish</Link>
          <button className="secondary-button justify-start"><Settings className="h-4 w-4" />Sozlamalar</button>
          <button className="secondary-button justify-start"><Bell className="h-4 w-4" />Bildirishnomalar</button>
        </div>
      </aside>
      <section className="grid gap-5">
        <div>
          <h2 className="mb-3 text-lg font-black">Mening e'lonlarim</h2>
          <div className="grid gap-3">
            {featuredListings.slice(0, 1).map((listing) => <ListingCard key={listing.id} listing={listing} />)}
          </div>
        </div>
        <div id="favorites">
          <h2 className="mb-3 text-lg font-black">Sevimlilar</h2>
          <div className="grid gap-3">
            {featuredListings.slice(1).map((listing) => <ListingCard key={listing.id} listing={listing} />)}
          </div>
        </div>
      </section>
    </div>
  );
}
