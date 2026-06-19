import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { PlusCircle, Search } from "lucide-react";
import { BottomNav } from "@/components/bottom-nav";
import { BrandMark } from "@/components/brand-mark";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Avtolink.uz",
    template: "%s | Avtolink.uz"
  },
  description: "Uzbekistonda avtomobil sotish va xarid qilish uchun mobile-first platforma"
};

export const viewport: Viewport = {
  themeColor: "#075E59"
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="uz">
      <body>
        <header className="sticky top-0 z-40 border-b border-line bg-white/90 backdrop-blur-xl">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
            <Link href="/" className="flex min-w-0 items-center gap-2 text-lg font-bold text-ink">
              <BrandMark className="h-10 w-10 shrink-0 drop-shadow-sm" />
              <span className="leading-tight">Avtolink.uz</span>
            </Link>
            <nav className="hidden items-center gap-2 text-sm font-medium text-slate-700 md:flex">
              <Link href="/listings" className="rounded-md px-3 py-2 hover:bg-slate-100">E'lonlar</Link>
              <Link href="/ai-search" className="inline-flex items-center gap-2 rounded-md px-3 py-2 hover:bg-slate-100"><Search className="h-4 w-4" />AI qidiruv</Link>
              <Link href="/profile" className="rounded-md px-3 py-2 hover:bg-slate-100">Profil</Link>
              <Link href="/new-listing" className="primary-button"><PlusCircle className="h-4 w-4" />E'lon berish</Link>
            </nav>
          </div>
        </header>
        <main className="mx-auto min-h-screen max-w-6xl px-4 pb-24 pt-4 md:pb-10">{children}</main>
        <BottomNav />
      </body>
    </html>
  );
}
