import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Telegraf, Markup, type Context } from "telegraf";
import { AiSearchService } from "../ai/ai-search.service";
import { AuthService } from "../auth/auth.service";
import { ListingsService } from "../listings/listings.service";
import type { CreateListingDto } from "../listings/listings.controller";

type BotMode = "idle" | "ai_search" | "phone" | "otp" | "seller_post";

interface BotState {
  mode: BotMode;
  phone?: string;
  userId?: string;
  pendingListing?: Partial<CreateListingDto>;
  sellerStep?: number;
}

const sellerQuestions: Array<{ key: keyof CreateListingDto; text: string }> = [
  { key: "make", text: "Marka: masalan, BYD" },
  { key: "model", text: "Model: masalan, Song Plus" },
  { key: "year", text: "Yil: masalan, 2024" },
  { key: "powertrainType", text: "Turi: EV, REEV, PHEV yoki HYBRID" },
  { key: "trim", text: "Trim/modifikatsiya: masalan, Flagship" },
  { key: "batteryKwh", text: "Batareya kWh: bilmasangiz 0" },
  { key: "batteryHealthPercent", text: "Batareya holati foizda: masalan, 95" },
  { key: "rangeKm", text: "Yurish masofasi km: masalan, 605" },
  { key: "driveType", text: "Privod: FWD, RWD, AWD yoki UNKNOWN" },
  { key: "bodyColor", text: "Rangi: masalan, oq" },
  { key: "vin", text: "VIN raqam: bo'lmasa yo'q deb yozing" },
  { key: "priceUsd", text: "Narx USD: masalan, 28500" },
  { key: "mileageKm", text: "Probeg km: masalan, 12000" },
  { key: "customsStatus", text: "Bojxona holati: masalan, rasmiylashtirilgan" },
  { key: "condition", text: "Holati: masalan, A'lo, yangi olib kelingan" },
  { key: "region", text: "Hudud: masalan, Toshkent" },
  { key: "exactLocation", text: "Aniq lokatsiya yoki manzil. Telegram lokatsiya yuborsangiz ham bo'ladi." },
  { key: "sellerPhone", text: "Telefon: masalan, +998901234567" },
  { key: "sellerTelegramUsername", text: "Telegram username: bo'lmasa yo'q deb yozing" },
  { key: "photoUrls", text: "Rasm URL: bo'lmasa yo'q deb yozing" },
  { key: "description", text: "Qisqa tavsif" }
];

@Injectable()
export class BotService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(BotService.name);
  private readonly states = new Map<number, BotState>();
  private bot?: Telegraf;

  constructor(
    private readonly config: ConfigService,
    private readonly authService: AuthService,
    private readonly aiSearchService: AiSearchService,
    private readonly listingsService: ListingsService
  ) {}

  async onModuleInit() {
    const token = this.config.get<string>("TELEGRAM_BOT_TOKEN");
    if (!token) {
      this.logger.warn("TELEGRAM_BOT_TOKEN yo'q. Telegram bot ishga tushmadi.");
      return;
    }

    this.bot = new Telegraf(token);
    this.registerHandlers(this.bot);
    await this.bot.launch();
    this.logger.log("Avtolink.uz Telegram bot ishga tushdi");
  }

  async onModuleDestroy() {
    this.bot?.stop("NestJS shutdown");
  }

  private registerHandlers(bot: Telegraf) {
    bot.start((ctx) => this.showMenu(ctx, "Avtolink.uz botiga xush kelibsiz.\n\nXaridor: AI bilan mashina toping.\nSotuvchi: 2-3 daqiqada e'lon joylang."));
    bot.hears("Mashina qidirish", (ctx) => {
      this.setState(ctx, { mode: "ai_search" });
      return ctx.reply(
        "Qanday mashina kerak?\n\nMasalan: 20 ming dollargacha BYD, yurishi kam, oilaga mos.",
        Markup.inlineKeyboard([
          [Markup.button.callback("BYD EV 20 minggacha", "quick:20 ming dollargacha BYD EV")],
          [Markup.button.callback("Oilaga mos REEV", "quick:oilaga mos REEV")],
          [Markup.button.callback("Range 500 km+", "quick:range 500 km dan yuqori")]
        ])
      );
    });
    bot.hears("Kirish", (ctx) => this.askPhone(ctx));
    bot.hears("E'lon berish", (ctx) => this.startSellerPost(ctx));
    bot.hears("Mening e'lonlarim", (ctx) => this.showSellerListings(ctx));
    bot.hears("Bekor qilish", (ctx) => this.showMenu(ctx, "Amal bekor qilindi."));

    bot.action(/^quick:(.+)$/, async (ctx) => {
      this.setState(ctx, { ...this.getState(ctx), mode: "ai_search" });
      await ctx.answerCbQuery("Qidirilmoqda");
      return this.handleAiSearch(ctx, ctx.match[1]);
    });

    bot.action(/^reveal:(.+)$/, async (ctx) => {
      const state = this.getState(ctx);
      const listingId = ctx.match[1];
      if (!state.userId) {
        await ctx.answerCbQuery("Avval telefon raqam bilan kiring");
        await this.askPhone(ctx);
        return;
      }

      const listing = await this.listingsService.getPrivate(listingId, state.userId);
      await ctx.reply(
        `Kontaktlar:\nTelefon: ${listing.sellerPhone ?? "kiritilmagan"}\nTelegram: ${listing.sellerTelegramUsername ?? "kiritilmagan"}\nLokatsiya: ${listing.exactLocation ?? "kiritilmagan"}\nYandex Maps: ${listing.yandexMapUrl ?? "kiritilmagan"}`
      );
    });

    bot.action(/^sold:(.+)$/, async (ctx) => {
      const state = this.getState(ctx);
      if (!state.userId) return this.askPhone(ctx);
      await this.listingsService.markSold(ctx.match[1], state.userId);
      await ctx.answerCbQuery("Sotildi deb belgilandi");
      await ctx.reply("E'lon sotildi deb belgilandi.");
    });

    bot.action(/^delete:(.+)$/, async (ctx) => {
      const state = this.getState(ctx);
      if (!state.userId) return this.askPhone(ctx);
      await this.listingsService.archiveBySeller(ctx.match[1], state.userId);
      await ctx.answerCbQuery("E'lon o'chirildi");
      await ctx.reply("E'lon arxivlandi.");
    });

    bot.on("text", async (ctx) => {
      const text = ctx.message.text.trim();
      const state = this.getState(ctx);

      if (state.mode === "ai_search") return this.handleAiSearch(ctx, text);
      if (state.mode === "phone") return this.handlePhone(ctx, text);
      if (state.mode === "otp") return this.handleOtp(ctx, text);
      if (state.mode === "seller_post") return this.handleSellerPost(ctx, text);

      return this.showMenu(ctx, "Menyudan bo'lim tanlang.");
    });

    bot.on("contact", async (ctx) => {
      const phone = ctx.message.contact.phone_number.startsWith("+")
        ? ctx.message.contact.phone_number
        : `+${ctx.message.contact.phone_number}`;
      return this.handlePhone(ctx, phone);
    });

    bot.on("location", async (ctx) => {
      const state = this.getState(ctx);
      if (state.mode !== "seller_post" || !state.pendingListing) {
        return ctx.reply("Lokatsiya e'lon berish jarayonida qabul qilinadi.");
      }

      const { latitude, longitude } = ctx.message.location;
      const pendingListing = {
        ...state.pendingListing,
        exactLocation: "Telegram orqali yuborilgan lokatsiya",
        latitude,
        longitude,
        yandexMapUrl: this.buildYandexMapUrl(latitude, longitude)
      };
      const nextStep = (state.sellerStep ?? 0) + 1;
      this.setState(ctx, { ...state, sellerStep: nextStep, pendingListing });
      return ctx.reply(this.sellerPrompt(nextStep));
    });
  }

  private async handleAiSearch(ctx: Context, text: string) {
    const state = this.getState(ctx);
    const results = await this.aiSearchService.search(text, state.userId);
    if (!results.length) {
      const help = this.aiSearchService.suggestQueries(text);
      await ctx.reply(
        `Mos e'lon topilmadi.\n\nAniqroq qidirish uchun:\n${help.suggestions.map((item) => `- ${item}`).join("\n") || "- Byudjet, marka yoki probegni o'zgartirib ko'ring."}`
      );
      return;
    }

    for (const result of results.slice(0, 5)) {
      const listing = result.listing;
      await ctx.reply(
        `${listing.make} ${listing.model} ${listing.year}\n\n` +
          `Narx: $${listing.priceUsd.toLocaleString("en-US")}\n` +
          `Turi: ${listing.powertrainType}${listing.trim ? `, ${listing.trim}` : ""}\n` +
          `Range: ${listing.rangeKm ? `${listing.rangeKm.toLocaleString("en-US")} km` : "kiritilmagan"}\n` +
          `Probeg: ${listing.mileageKm.toLocaleString("en-US")} km\n` +
          `Batareya: ${listing.batteryHealthPercent ? `${listing.batteryHealthPercent}%` : "kiritilmagan"}\n` +
          `Bojxona: ${listing.customsStatus ?? "kiritilmagan"}\n` +
          `Hudud: ${listing.region}\n\n` +
          `${result.explanationUz}\n${result.nextActionUz ?? ""}`,
        Markup.inlineKeyboard([Markup.button.callback("Telefon va lokatsiyani ko'rish", `reveal:${listing.id}`)])
      );
    }
  }

  private askPhone(ctx: Context) {
    this.setState(ctx, { ...this.getState(ctx), mode: "phone" });
    return ctx.reply(
      "Telefon raqamingizni yuboring yoki pastdagi tugma orqali ulashing.",
      Markup.keyboard([[Markup.button.contactRequest("Telefonni ulashish")], ["Bekor qilish"]]).resize().oneTime()
    );
  }

  private async handlePhone(ctx: Context, phone: string) {
    await this.authService.requestPhoneOtp({ phone });
    this.setState(ctx, { ...this.getState(ctx), mode: "otp", phone });
    await ctx.reply("Tasdiqlash kodi yuborildi. MVP test kodi: 111111");
  }

  private async handleOtp(ctx: Context, code: string) {
    const state = this.getState(ctx);
    if (!state.phone) return this.askPhone(ctx);

    const session = await this.authService.verifyPhoneOtp({ phone: state.phone, code });
    this.setState(ctx, { ...state, mode: "idle", userId: session.userId });
    await this.showMenu(ctx, "Kirish muvaffaqiyatli. Endi kontakt va lokatsiyani ko'rishingiz mumkin.");
  }

  private async startSellerPost(ctx: Context) {
    const state = this.getState(ctx);
    if (!state.userId) {
      await ctx.reply("E'lon berish uchun avval telefon raqam bilan kiring.");
      return this.askPhone(ctx);
    }

    this.setState(ctx, { ...state, mode: "seller_post", sellerStep: 0, pendingListing: { sellerId: state.userId, photoUrls: [] } });
    return ctx.reply(this.sellerPrompt(0));
  }

  private async showSellerListings(ctx: Context) {
    const state = this.getState(ctx);
    if (!state.userId) {
      await ctx.reply("E'lonlaringizni ko'rish uchun avval telefon raqam bilan kiring.");
      return this.askPhone(ctx);
    }

    const listings = await this.listingsService.listBySeller(state.userId);
    if (!listings.length) return ctx.reply("Sizda hali e'lon yo'q. \"E'lon berish\" tugmasidan foydalaning.");

    for (const listing of listings) {
      await ctx.reply(
        `${listing.title}\nHolat: ${listing.status}\nNarx: $${listing.priceUsd.toLocaleString("en-US")}`,
        Markup.inlineKeyboard([
          Markup.button.callback("Sotildi", `sold:${listing.id}`),
          Markup.button.callback("O'chirish", `delete:${listing.id}`)
        ])
      );
    }
  }

  private async handleSellerPost(ctx: Context, text: string) {
    const state = this.getState(ctx);
    const step = state.sellerStep ?? 0;
    const question = sellerQuestions[step];
    if (!question || !state.pendingListing || !state.userId) return this.showMenu(ctx, "E'lon yaratish qayta boshlandi.");

    const pendingListing = {
      ...state.pendingListing,
      [question.key]: this.normalizeListingValue(question.key, text)
    };

    const nextStep = step + 1;
    if (nextStep < sellerQuestions.length) {
      this.setState(ctx, { ...state, sellerStep: nextStep, pendingListing });
      return ctx.reply(this.sellerPrompt(nextStep));
    }

    const dto = {
      ...pendingListing,
      sellerId: state.userId,
      title: `${pendingListing.make} ${pendingListing.model} ${pendingListing.year}`,
      photoUrls: pendingListing.photoUrls?.length ? pendingListing.photoUrls : ["https://images.unsplash.com/photo-1619767886558-efdc259cde1a?auto=format&fit=crop&w=900&q=80"],
      rangeStandard: "CLTC",
      driveType: pendingListing.driveType ?? "UNKNOWN"
    } as CreateListingDto;

    const listing = await this.listingsService.create(dto);
    this.setState(ctx, { ...state, mode: "idle", pendingListing: undefined, sellerStep: undefined });
    await ctx.reply(`E'lon saqlandi: ${listing.title}\nNarx: $${listing.priceUsd.toLocaleString("en-US")}`);
    return this.showMenu(ctx, "Yana nima qilamiz?");
  }

  private normalizeListingValue(key: keyof CreateListingDto, value: string) {
    if (["year", "priceUsd", "mileageKm", "rangeKm", "motorPowerKw", "batteryHealthPercent"].includes(key)) return Number(value.replace(/\D/g, ""));
    if (key === "batteryKwh") return Number(value.replace(",", "."));
    if (key === "powertrainType" || key === "driveType") return value.toUpperCase();
    if (key === "sellerTelegramUsername" && value.toLowerCase() === "yo'q") return undefined;
    if (key === "vin" && value.toLowerCase() === "yo'q") return undefined;
    if (key === "photoUrls") return value.toLowerCase() === "yo'q" ? [] : [value];
    return value;
  }

  private showMenu(ctx: Context, text: string) {
    this.setState(ctx, { ...this.getState(ctx), mode: "idle" });
    const miniAppUrl = this.config.get<string>("WEB_APP_URL");
    const appRows = miniAppUrl
      ? [[Markup.button.webApp("Avtolink ilovasini ochish", miniAppUrl)]]
      : [];
    return ctx.reply(
      text,
      Markup.keyboard([...appRows, ["Mashina qidirish"], ["E'lon berish", "Mening e'lonlarim"], ["Kirish"]]).resize()
    );
  }

  private sellerPrompt(step: number) {
    const question = sellerQuestions[step];
    return `E'lon berish (${step + 1}/${sellerQuestions.length})\n${question.text}`;
  }

  private buildYandexMapUrl(latitude: number, longitude: number) {
    return `https://yandex.com/maps/?ll=${longitude},${latitude}&z=16&pt=${longitude},${latitude},pm2rdm`;
  }

  private getState(ctx: Context): BotState {
    const id = this.chatId(ctx);
    return this.states.get(id) ?? { mode: "idle" };
  }

  private setState(ctx: Context, state: BotState) {
    this.states.set(this.chatId(ctx), state);
  }

  private chatId(ctx: Context) {
    return ctx.chat?.id ?? ctx.from?.id ?? 0;
  }
}
