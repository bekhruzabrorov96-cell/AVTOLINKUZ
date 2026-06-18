"use client";

import Link from "next/link";
import type { Route } from "next";
import { Heart, Home, PlusCircle, Search, User } from "lucide-react";

const navItems: Array<{ href: Route; label: string; icon: typeof Home }> = [
  { href: "/", label: "Bosh", icon: Home },
  { href: "/ai-search", label: "AI", icon: Search },
  { href: "/new-listing", label: "Sotish", icon: PlusCircle },
  { href: "/profile", label: "Profil", icon: User },
  { href: "/profile#favorites" as Route, label: "Saqlangan", icon: Heart }
];

export function BottomNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-line bg-white/95 shadow-[0_-10px_30px_rgba(15,23,42,0.08)] backdrop-blur-xl md:hidden">
      <div className="mx-auto grid max-w-xl grid-cols-5 px-2 py-2">
        {navItems.map(({ href, label, icon: Icon }) => (
          <Link key={href} href={href} className="flex min-h-12 flex-col items-center justify-center gap-1 rounded-md text-[11px] font-bold text-slate-600 hover:bg-slate-100 hover:text-brand">
            <Icon aria-hidden className="h-5 w-5" />
            <span>{label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
