import { TelegramMiniApp } from "@/components/miniapp/telegram-mini-app";
import { featuredListings } from "@/lib/mock-data";

export const metadata = {
  title: "Telegram Mini App"
};

export default function MiniAppPage() {
  return <TelegramMiniApp listings={featuredListings} />;
}
