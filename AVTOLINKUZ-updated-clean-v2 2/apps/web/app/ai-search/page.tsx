import { Bot, Search, Sparkles } from "lucide-react";
import { aiSearch } from "@/lib/api";
import { ListingCard } from "@/components/listing-card";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export const metadata = {
  title: "AI qidiruv"
};

export default async function AiSearchPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const query = value(params.q);
  const results = query ? await aiSearch(query) : [];

  return (
    <div className="grid gap-4">
      <section className="app-panel overflow-hidden">
        <div className="border-b border-line bg-ink p-5 text-white">
          <div className="inline-flex items-center gap-2 rounded-md bg-white/10 px-3 py-2 text-sm font-bold">
            <Sparkles className="h-4 w-4 text-emerald-200" />
            Uzbek tilida AI qidiruv
          </div>
          <h1 className="mt-3 text-2xl font-black">Qanday Xitoy EV kerak?</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-white/75">Byudjet, marka, range, probeg yoki oilaviy foydalanishni yozing. Natijalar ichki e'lonlardan tanlanadi.</p>
        </div>
        <form className="grid gap-3 p-4 sm:grid-cols-[1fr_auto]">
          <input name="q" defaultValue={query} placeholder="Masalan: 20 ming dollargacha, BYD EV, yurishi kam" className="form-control h-12" />
          <button className="primary-button h-12" aria-label="Qidirish">
            <Search className="h-5 w-5" />
            Qidirish
          </button>
        </form>
      </section>

      <section className="grid gap-3">
        {query ? <p className="text-sm font-medium text-slate-600">{results.length} ta mos e'lon topildi</p> : (
          <div className="app-panel p-5 text-sm leading-6 text-slate-600">
            <Bot className="mb-3 h-6 w-6 text-brand" />
            Masalan: "oilaga mos REEV", "30 minggacha Zeekr", yoki "range 500 km dan yuqori" deb yozing.
          </div>
        )}
        {results.map((result) => (
          <div key={result.listing.id} className="grid gap-2">
            <ListingCard listing={result.listing} />
            <p className="rounded-md bg-white px-3 py-2 text-sm text-slate-700">{result.explanationUz}</p>
          </div>
        ))}
      </section>
    </div>
  );
}

function value(input: string | string[] | undefined) {
  return Array.isArray(input) ? input[0] : input ?? "";
}
