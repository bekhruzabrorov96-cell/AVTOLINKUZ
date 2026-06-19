import { Camera, CarFront, Phone, Save, Zap } from "lucide-react";
import type { ReactNode } from "react";

export const metadata = {
  title: "E'lon berish"
};

export default function NewListingPage() {
  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-4">
        <p className="text-sm font-bold text-brand">Sotuvchi bo'limi</p>
        <h1 className="mt-1 text-2xl font-black text-ink">Mashina e'loni yaratish</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">EV/REEV xaridorlari tez solishtirishi uchun yurish zaxirasi, batareya, komplektatsiya va kontaktlarni aniq kiriting.</p>
      </div>

      <form className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <section className="app-panel p-4">
          <SectionTitle icon={<CarFront className="h-5 w-5" />} title="Mashina ma'lumotlari" />
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Field name="make" label="Marka" placeholder="BYD" />
            <Field name="model" label="Model" placeholder="Song Plus" />
            <Field name="year" label="Yil" placeholder="2024" />
            <label className="grid gap-1 text-sm font-semibold">
              EV turi
              <select name="powertrainType" className="form-control">
                <option value="EV">EV</option>
                <option value="REEV">REEV</option>
                <option value="PHEV">PHEV</option>
                <option value="HYBRID">Gibrid</option>
              </select>
            </label>
            <Field name="trim" label="Komplektatsiya/modifikatsiya" placeholder="Lyuks" />
            <Field name="condition" label="Holati" placeholder="A'lo" />
          </div>

          <SectionTitle icon={<Zap className="h-5 w-5" />} title="EV texnikasi" className="mt-6" />
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Field name="batteryKwh" label="Batareya, kWh" placeholder="87" />
            <Field name="batteryHealthPercent" label="Batareya holati, %" placeholder="95" />
            <Field name="rangeKm" label="Yurish zaxirasi, km" placeholder="605" />
            <Field name="motorPowerKw" label="Motor quvvati, kW" placeholder="160" />
            <label className="grid gap-1 text-sm font-semibold">
              Tortish turi (privod)
              <select name="driveType" className="form-control">
                <option value="UNKNOWN">Kiritilmagan</option>
                <option value="FWD">FWD</option>
                <option value="RWD">RWD</option>
                <option value="AWD">AWD</option>
              </select>
            </label>
            <Field name="priceUsd" label="Narx, USD" placeholder="28900" />
            <Field name="mileageKm" label="Probeg, km" placeholder="12000" />
            <Field name="customsStatus" label="Bojxona holati" placeholder="Rasmiylashtirilgan" />
            <Field name="bodyColor" label="Rangi" placeholder="Oq" />
            <Field name="vin" label="VIN" placeholder="LGB..." />
          </div>

          <label className="mt-4 grid gap-1 text-sm font-semibold">
            Tavsif
            <textarea name="description" rows={5} placeholder="Holati, komplektatsiya, qo'shimcha ma'lumotlar" className="rounded-md border border-line px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20" />
          </label>
        </section>

        <aside className="grid h-fit gap-4">
          <section className="app-panel p-4">
            <SectionTitle icon={<Phone className="h-5 w-5" />} title="Kontakt" />
            <div className="mt-4 grid gap-3">
              <Field name="region" label="Hudud" placeholder="Toshkent" />
              <Field name="exactLocation" label="Aniq manzil" placeholder="Sergeli avtomobil bozori" />
              <Field name="latitude" label="Kenglik" placeholder="41.2995" />
              <Field name="longitude" label="Uzunlik" placeholder="69.2401" />
              <Field name="yandexMapUrl" label="Yandex Maps havolasi" placeholder="https://yandex.com/maps/..." />
              <Field name="sellerPhone" label="Telefon" placeholder="+998901234567" />
              <Field name="sellerTelegramUsername" label="Telegram username" placeholder="avto_sotuvchi" />
            </div>
          </section>

          <section className="app-panel p-4">
            <SectionTitle icon={<Camera className="h-5 w-5" />} title="Rasmlar" />
            <label className="mt-4 grid min-h-32 place-items-center rounded-lg border border-dashed border-line bg-slate-50 p-4 text-center text-sm font-medium text-slate-600">
              <span>Rasm yuklash</span>
              <input type="file" name="photos" multiple accept="image/*" className="sr-only" />
            </label>
          </section>

          <button className="primary-button h-12"><Save className="h-5 w-5" />E'lonni saqlash</button>
        </aside>
      </form>
    </div>
  );
}

function Field({ name, label, placeholder }: { name: string; label: string; placeholder: string }) {
  return (
    <label className="grid gap-1 text-sm font-semibold">
      {label}
      <input name={name} placeholder={placeholder} className="form-control" />
    </label>
  );
}

function SectionTitle({ icon, title, className = "" }: { icon: ReactNode; title: string; className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span className="grid h-9 w-9 place-items-center rounded-md bg-brand/10 text-brand">{icon}</span>
      <h2 className="text-base font-black text-ink">{title}</h2>
    </div>
  );
}
