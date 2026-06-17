# Avtolink.uz

Telegram bot first and mobile-first PWA marketplace MVP for Chinese EV/REEV sales between sellers and buyers in Uzbekistan.

## Structure

- `apps/web`: Next.js 15, React, TypeScript, TailwindCSS, PWA manifest
- `apps/api`: NestJS, Prisma, PostgreSQL, JWT auth, Telegram bot, AI search, Socket.io gateway
- `packages/shared`: shared TypeScript contracts

## Quick Start

Install Node.js 22+, then:

```bash
npm install
cp apps/api/.env.example apps/api/.env
npm run prisma:generate
npm run prisma:migrate
npm run dev:api
npm run dev
```

## MVP Scope

- Uzbek Telegram bot first flow for guest search, phone login, seller posting, and seller listing management
- Phone OTP mock endpoints with JWT session issuing
- Chinese EV/REEV listing model with trim, battery, range, drive type, condition, contact, and exact location
- Guest-safe public listing responses that hide seller phone, Telegram contact, and exact location
- Private listing detail after phone login
- Internal AI search endpoint for Uzbek natural-language matching across seller listings
- Listing CRUD, PWA search/detail pages, profile, favorites UI surface
- Real-time buyer/seller chat gateway
- PWA manifest and mobile bottom navigation

Cloudflare R2 integration is represented through listing photo URLs; production upload signing can be added behind the listings module or a dedicated storage module.

## Telegram Bot

Set these in `apps/api/.env`:

```bash
TELEGRAM_BOT_TOKEN="your-bot-token"
OTP_MOCK_CODE="111111"
WEB_APP_URL="https://your-domain.com/miniapp"
```

Bot menu is in Uzbek:

- `Mashina qidirish`: guest AI search over internal listings
- `Kirish`: phone OTP mock login
- `E'lon berish`: seller EV/REEV listing wizard
- `Mening e'lonlarim`: seller listing status/delete actions

Bot-first UX details:

- The main product surface is a Telegram Mini App opened from the bot, not a classic website.
- Buyers can search as guests before login.
- Buyers use app-like tabs inside Telegram: `Bosh`, `Qidiruv`, `Sotish`, `Profil`.
- Search uses quick inline buttons plus free-text Uzbek prompts.
- Phone login supports Telegram contact sharing for convenience.
- Seller posting is a step-by-step chat wizard with progress numbers.
- Seller contact and exact location stay hidden until the buyer logs in.
- Seller location supports Telegram location sharing; stored coordinates can generate a Yandex Maps link for authenticated buyers.
- Used-car seller fields include mileage/probeg, battery health, customs status, body color, VIN, and detailed EV specs.

## AI Search

AI search is internal-first: it searches only active Avtolink seller listings and does not scrape outside websites.

Endpoints:

- `POST /ai/search` with `{ "query": "20 ming dollargacha BYD EV, yurishi kam" }`
- `POST /ai/parse` to inspect parsed buyer intent
- `POST /ai/suggestions` to get missing-detail suggestions for weak queries
- `GET /ai/history?userId=...` to show recent AI searches for logged-in buyers

Supported buyer intent:

- Budget: `20 ming dollargacha`, `$30000`, `30k`
- EV type: `EV`, `REEV`, `PHEV`, `gibrid`
- Brand/model: `BYD`, `Li Auto`, `Zeekr`, `Song Plus`, `L7`
- Used-car condition: `probeg kam`, `50 ming km gacha`, `batareya 90%+`
- Range: `500 km dan yuqori`, `long range`, `uzoq yuradigan`
- Family/city/premium intent: `oilaga mos`, `shahar uchun`, `premium`
- Region and customs: `Toshkent`, `bojxona rasmiylashtirilgan`

Search results include ranked matches, confidence labels, Uzbek explanations, next-action text, and are logged for future recommendations.
