import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN") || "";
if (!BOT_TOKEN) {
  console.error("TELEGRAM_BOT_TOKEN is not set in edge function secrets");
}
const TELEGRAM_API = `https://api.telegram.org/bot${BOT_TOKEN}`;

const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const SITE_URL = "https://estatepremium.kg";

type Lang = "ru" | "en" | "kg";

type Subscriber = {
  id: string;
  chat_id: number;
  bot_language: Lang | null;
  bot_state: string | null;
  username: string | null;
  first_name: string | null;
};

type Draft = { step: string; data: Record<string, any> };

// ─── i18n ────────────────────────────────────────────────
const M: Record<Lang, Record<string, string>> = {
  ru: {
    welcome: "👋 <b>Добро пожаловать в Estate Premium!</b>\n\nМы поможем вам найти дом, квартиру или коммерческое помещение.\n\nВыберите действие:",
    help: "<b>Доступные команды:</b>\n\n/start — главное меню\n/buy — недвижимость на продажу\n/rent — аренда недвижимости\n/sell — подать объявление на продажу\n/lease — сдать в аренду\n/search — поиск по базе\n/favorites — избранное\n/myads — мои объявления\n/support — связь с поддержкой\n/language — сменить язык\n/help — справка",
    buy: "🏠 <b>Недвижимость на продажу</b>\n\nПоследние предложения:",
    rent: "🔑 <b>Аренда недвижимости</b>\n\nПоследние предложения:",
    sell: "📝 <b>Подача объявления на продажу</b>\n\nОтправьте <b>название</b> объекта:",
    lease: "📝 <b>Сдача в аренду</b>\n\nОтправьте <b>название</b> объекта:",
    searchPrompt: "🔍 <b>Поиск недвижимости</b>\n\nОтправьте ключевое слово (город, район или тип):",
    favorites: "⭐ <b>Избранное</b>",
    myads: "📋 <b>Мои объявления</b>",
    support: "📞 <b>Поддержка</b>\n\nОтправьте ваше сообщение, и мы свяжемся с вами:",
    language: "🌐 <b>Выберите язык:</b>",
    noResults: "Ничего не найдено. Попробуйте другой запрос.",
    emptyFavorites: "У вас пока нет избранных объектов. Зарегистрируйтесь на сайте, чтобы сохранять объекты.",
    emptyMyads: "У вас пока нет объявлений, созданных через бота.",
    titlePrompt: "Отправьте <b>название</b> объекта:",
    pricePrompt: "Отправьте <b>цену</b> (только число):",
    cityPrompt: "Отправьте <b>город</b>:",
    areaPrompt: "Отправьте <b>площадь</b> в м² (только число):",
    phonePrompt: "Отправьте <b>контактный телефон</b>:",
    done: "✅ Объявление создано! Оно появится на сайте после проверки администратором.",
    cancelled: "❌ Создание отменено.",
    supportSent: "✅ Ваше сообщение отправлено в поддержку. Мы свяжемся с вами в ближайшее время.",
    catalogEmpty: "Каталог пуст. Скоро появятся новые объекты!",
    contactInfo: "📞 <b>Контакты</b>\n\nТелефон: {phone}\nEmail: {email}\nWhatsApp: {whatsapp}\nTelegram: @{telegram}",
    useStart: "Используйте /start для открытия меню",
    cancelHint: "Для отмены отправьте /cancel",
  },
  en: {
    welcome: "👋 <b>Welcome to Estate Premium!</b>\n\nWe'll help you find a house, apartment, or commercial space.\n\nChoose an action:",
    help: "<b>Available commands:</b>\n\n/start — main menu\n/buy — properties for sale\n/rent — rental properties\n/sell — list for sale\n/lease — list for rent\n/search — search database\n/favorites — favorites\n/myads — my listings\n/support — contact support\n/language — change language\n/help — help",
    buy: "🏠 <b>Properties for sale</b>\n\nLatest offers:",
    rent: "🔑 <b>Rental properties</b>\n\nLatest offers:",
    sell: "📝 <b>List a property for sale</b>\n\nSend the <b>title</b> of the property:",
    lease: "📝 <b>List for rent</b>\n\nSend the <b>title</b> of the property:",
    searchPrompt: "🔍 <b>Property search</b>\n\nSend a keyword (city, district, or type):",
    favorites: "⭐ <b>Favorites</b>",
    myads: "📋 <b>My listings</b>",
    support: "📞 <b>Support</b>\n\nSend your message and we'll get back to you:",
    language: "🌐 <b>Select language:</b>",
    noResults: "Nothing found. Try a different query.",
    emptyFavorites: "You have no favorites yet. Register on the site to save properties.",
    emptyMyads: "You have no listings created via the bot yet.",
    titlePrompt: "Send the <b>title</b> of the property:",
    pricePrompt: "Send the <b>price</b> (number only):",
    cityPrompt: "Send the <b>city</b>:",
    areaPrompt: "Send the <b>area</b> in m² (number only):",
    phonePrompt: "Send your <b>contact phone</b>:",
    done: "✅ Listing created! It will appear on the site after admin review.",
    cancelled: "❌ Creation cancelled.",
    supportSent: "✅ Your message has been sent to support. We'll contact you soon.",
    catalogEmpty: "The catalog is empty. New properties coming soon!",
    contactInfo: "📞 <b>Contacts</b>\n\nPhone: {phone}\nEmail: {email}\nWhatsApp: {whatsapp}\nTelegram: @{telegram}",
    useStart: "Use /start to open the menu",
    cancelHint: "To cancel, send /cancel",
  },
  kg: {
    welcome: "👋 <b>Estate Premium'га кош келиңиз!</b>\n\nСизге үй, батир же коммерциялык жай табууга жардам берем.\n\nАракетти тандаңыз:",
    help: "<b>Жеткиликтүү командалар:</b>\n\n/start — башкы меню\n/buy — сатуудагы мүлк\n/rent — ижарага мүлк\n/sell — сатууга жарнама\n/lease — ижарага берүү\n/search — издөө\n/favorites — тандалмалар\n/myads — менин жарнамаларым\n/support — колдоо\n/language — тилди өзгөртүү\n/help — жардам",
    buy: "🏠 <b>Сатуудагы жылжымай мүлк</b>\n\nАкыркы сунуштар:",
    rent: "🔑 <b>Ижарага берилген мүлк</b>\n\nАкыркы сунуштар:",
    sell: "📝 <b>Сатууга жарнама берүү</b>\n\nОбъектин <b>атын</b> жибериңиз:",
    lease: "📝 <b>Ижарага берүү</b>\n\nОбъектин <b>атын</b> жибериңиз:",
    searchPrompt: "🔍 <b>Жылжымай мүлк издөө</b>\n\nАчкыч сөз жибериңиз (шаар, район же түр):",
    favorites: "⭐ <b>Тандалмалар</b>",
    myads: "📋 <b>Менин жарнамаларым</b>",
    support: "📞 <b>Колдоо</b>\n\nБилдирүүңүздү жибериңиз, биз сиз менен байланышабыз:",
    language: "🌐 <b>Тилди тандаңыз:</b>",
    noResults: "Эч нерсе табылган жок. Башка суроону аракет кылыңыз.",
    emptyFavorites: "Сизде азырынча тандалган объекттер жок. Сайтта катталыңыз.",
    emptyMyads: "Сизде бот аркылуу түзүлгөн жарнамалар жок.",
    titlePrompt: "Объектин <b>атын</b> жибериңиз:",
    pricePrompt: "<b>Баасын</b> жибериңиз (гана сан):",
    cityPrompt: "<b>Шаарды</b> жибериңиз:",
    areaPrompt: "<b>Аянтын</b> м² жибериңиз (гана сан):",
    phonePrompt: "<b>Байланыш телефонуңузду</b> жибериңиз:",
    done: "✅ Жарнама түзүлдү! Администратор текшергенден кийин сайтта пайда болот.",
    cancelled: "❌ Түзүү жокко чыгарылды.",
    supportSent: "✅ Сиздин билдирүүңүз колдоого жиберилди. Биз жакында байланышабыз.",
    catalogEmpty: "Каталог бош. Жаңы объекттер жакында пайда болот!",
    contactInfo: "📞 <b>Байланыштар</b>\n\nТелефон: {phone}\nEmail: {email}\nWhatsApp: {whatsapp}\nTelegram: @{telegram}",
    useStart: "Менюну ачуу үчүн /start колдонуңуз",
    cancelHint: "Жокко чыгаруу үчүн /cancel жибериңиз",
  },
};

function t(lang: Lang, key: string, vars?: Record<string, string | number>): string {
  let msg = M[lang]?.[key] || M.ru[key] || key;
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      msg = msg.replace(`{${k}}`, String(v));
    }
  }
  return msg;
}

// ─── Telegram API helpers ────────────────────────────────
async function sendMessage(chatId: number, text: string, keyboard?: any) {
  const body: any = { chat_id: chatId, text, parse_mode: "HTML" };
  if (keyboard) body.reply_markup = keyboard;
  try {
    const res = await fetch(`${TELEGRAM_API}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) console.error("sendMessage failed:", res.status, await res.text());
  } catch (err) {
    console.error("sendMessage error:", err);
  }
}

async function sendProperty(chatId: number, prop: any) {
  const title = prop.title?.ru || prop.title?.en || prop.title?.kg || "Property";
  const price = `${Number(prop.price).toLocaleString()} ${prop.currency}`;
  const text = `🏠 <b>${title}</b>\n💰 ${price}\n📍 ${prop.city || "—"}${prop.district ? `, ${prop.district}` : ""}\n📐 ${prop.area} м²${prop.bedrooms ? `\n🛏 ${prop.bedrooms}` : ""}${prop.bathrooms ? `\n🚿 ${prop.bathrooms}` : ""}\n\n🔗 <a href="${SITE_URL}/properties/${prop.id}">Подробнее на сайте</a>`;
  if (prop.main_image_url) {
    try {
      await fetch(`${TELEGRAM_API}/sendPhoto`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: chatId, photo: prop.main_image_url, caption: text, parse_mode: "HTML" }),
      });
    } catch {
      await sendMessage(chatId, text);
    }
  } else {
    await sendMessage(chatId, text);
  }
}

async function answerCallback(callbackId: string) {
  await fetch(`${TELEGRAM_API}/answerCallbackQuery`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ callback_query_id: callbackId }),
  });
}

// ─── Keyboards ───────────────────────────────────────────
function mainKeyboard(lang: Lang) {
  const labels = {
    ru: { buy: "🏠 Купить", rent: "🔑 Арендовать", sell: "📝 Продать", lease: "📝 Сдать", search: "🔍 Поиск", fav: "⭐ Избранное", myads: "📋 Мои объявления", support: "📞 Поддержка", lang: "🌐 Язык" },
    en: { buy: "🏠 Buy", rent: "🔑 Rent", sell: "📝 Sell", lease: "📝 Lease", search: "🔍 Search", fav: "⭐ Favorites", myads: "📋 My ads", support: "📞 Support", lang: "🌐 Language" },
    kg: { buy: "🏠 Сатып алуу", rent: "🔑 Ижарага алуу", sell: "📝 Сатуу", lease: "📝 Ижарага берүү", search: "🔍 Издөө", fav: "⭐ Тандалмалар", myads: "📋 Менин жарнамаларым", support: "📞 Колдоо", lang: "🌐 Тил" },
  };
  const l = labels[lang];
  return {
    inline_keyboard: [
      [{ text: l.buy, callback_data: "buy" }, { text: l.rent, callback_data: "rent" }],
      [{ text: l.sell, callback_data: "sell" }, { text: l.lease, callback_data: "lease" }],
      [{ text: l.search, callback_data: "search" }],
      [{ text: l.fav, callback_data: "favorites" }, { text: l.myads, callback_data: "myads" }],
      [{ text: l.support, callback_data: "support" }, { text: l.lang, callback_data: "language" }],
    ],
  };
}

function languageKeyboard() {
  return {
    inline_keyboard: [
      [{ text: "🇷🇺 Русский", callback_data: "lang_ru" }, { text: "🇬🇧 English", callback_data: "lang_en" }],
      [{ text: "🇰🇬 Кыргызча", callback_data: "lang_kg" }],
    ],
  };
}

// ─── Subscriber helpers ───────────────────────────────────
async function getSubscriber(chatId: number): Promise<Subscriber | null> {
  const { data } = await supabase.from("telegram_subscribers").select("*").eq("chat_id", chatId).maybeSingle();
  return (data as Subscriber) || null;
}

async function ensureSubscriber(msg: any): Promise<Subscriber> {
  const chatId = msg.chat?.id;
  let sub = await getSubscriber(chatId);
  if (!sub) {
    await supabase.from("telegram_subscribers").insert({
      chat_id: chatId,
      username: msg.from?.username || null,
      first_name: msg.from?.first_name || null,
      last_name: msg.from?.last_name || null,
      language_code: msg.from?.language_code || null,
    });
    sub = await getSubscriber(chatId);
  }
  return sub!;
}

async function clearBotState(chatId: number) {
  await supabase.from("telegram_subscribers").update({ bot_state: null }).eq("chat_id", chatId);
}

async function setBotLanguage(chatId: number, lang: Lang) {
  await supabase.from("telegram_subscribers").update({ bot_language: lang, bot_state: null }).eq("chat_id", chatId);
}

async function setDraft(chatId: number, step: string, data: Record<string, any>) {
  await supabase.from("telegram_subscribers").update({ bot_state: JSON.stringify({ step, data }) }).eq("chat_id", chatId);
}

function getDraft(sub: Subscriber | null): Draft | null {
  if (!sub?.bot_state) return null;
  try {
    const parsed = JSON.parse(sub.bot_state);
    if (parsed && parsed.step && typeof parsed.step === "string") {
      return { step: parsed.step, data: parsed.data || {} };
    }
  } catch { /* not JSON */ }
  return null;
}

function getLang(sub: Subscriber | null): Lang {
  const l = sub?.bot_language;
  return (l === "en" || l === "kg" || l === "ru") ? l : "ru";
}

// ─── Property queries ────────────────────────────────────
async function fetchProperties(listingType: string, limit = 5) {
  const { data } = await supabase
    .from("properties")
    .select("*")
    .eq("is_published", true)
    .eq("status", "active")
    .eq("listing_type", listingType)
    .order("created_at", { ascending: false })
    .limit(limit);
  return data || [];
}

async function searchProperties(query: string, limit = 5) {
  const { data } = await supabase
    .from("properties")
    .select("*")
    .eq("is_published", true)
    .eq("status", "active")
    .or(`city.ilike.%${query}%,district.ilike.%${query}%,address.ilike.%${query}%`)
    .order("created_at", { ascending: false })
    .limit(limit);
  return data || [];
}

async function fetchMyAds(chatId: number) {
  const { data } = await supabase
    .from("properties")
    .select("*")
    .eq("telegram_chat_id", chatId)
    .order("created_at", { ascending: false })
    .limit(10);
  return data || [];
}

// ─── Listing creation state machine ──────────────────────
async function handleDraftMessage(sub: Subscriber, msg: any, lang: Lang) {
  const chatId = msg.chat?.id;
  const text = msg.text || "";
  const draft = getDraft(sub);

  if (!draft) {
    await sendMessage(chatId, t(lang, "useStart"), mainKeyboard(lang));
    return;
  }

  // Cancel
  if (text === "/cancel" || text.toLowerCase() === "отмена" || text.toLowerCase() === "cancel") {
    await clearBotState(chatId);
    await sendMessage(chatId, t(lang, "cancelled"), mainKeyboard(lang));
    return;
  }

  const step = draft.step;
  const data = { ...draft.data };

  // Support message
  if (step === "support_wait") {
    const name = sub.first_name || sub.username || "Unknown";
    await supabase.from("property_inquiries").insert({
      name,
      phone: "—",
      email: null,
      message: `Telegram support: ${text}`,
    });
    await clearBotState(chatId);
    await sendMessage(chatId, t(lang, "supportSent"), mainKeyboard(lang));
    return;
  }

  // Search
  if (step === "search_wait") {
    await clearBotState(chatId);
    const results = await searchProperties(text, 5);
    if (results.length > 0) {
      await sendMessage(chatId, `🔍 ${text}:`);
      for (const p of results) await sendProperty(chatId, p);
    } else {
      await sendMessage(chatId, t(lang, "noResults"), mainKeyboard(lang));
    }
    return;
  }

  // Sell / Lease steps
  const isSell = step.startsWith("sell_");
  const isLease = step.startsWith("lease_");
  if (!isSell && !isLease) {
    await clearBotState(chatId);
    await sendMessage(chatId, t(lang, "useStart"), mainKeyboard(lang));
    return;
  }

  const prefix = isSell ? "sell" : "lease";
  const listingType = isSell ? "sale" : "rent";

  if (step === `${prefix}_title`) {
    data.title = text;
    await setDraft(chatId, `${prefix}_price`, data);
    await sendMessage(chatId, t(lang, "pricePrompt") + "\n\n" + t(lang, "cancelHint"));
    return;
  }

  if (step === `${prefix}_price`) {
    const price = parseFloat(text.replace(/[^\d.]/g, ""));
    if (isNaN(price) || price <= 0) {
      await sendMessage(chatId, t(lang, "pricePrompt"));
      return;
    }
    data.price = price;
    await setDraft(chatId, `${prefix}_city`, data);
    await sendMessage(chatId, t(lang, "cityPrompt"));
    return;
  }

  if (step === `${prefix}_city`) {
    data.city = text;
    await setDraft(chatId, `${prefix}_area`, data);
    await sendMessage(chatId, t(lang, "areaPrompt"));
    return;
  }

  if (step === `${prefix}_area`) {
    const area = parseFloat(text.replace(/[^\d.]/g, ""));
    if (isNaN(area) || area <= 0) {
      await sendMessage(chatId, t(lang, "areaPrompt"));
      return;
    }
    data.area = area;
    await setDraft(chatId, `${prefix}_phone`, data);
    await sendMessage(chatId, t(lang, "phonePrompt"));
    return;
  }

  if (step === `${prefix}_phone`) {
    data.phone = text;
    const titleObj: Record<string, string> = {};
    titleObj[lang] = data.title;

    const { error } = await supabase.from("properties").insert({
      title: titleObj,
      description: {},
      price: data.price,
      currency: "KGS",
      listing_type: listingType,
      property_type: "apartment",
      status: "active",
      city: data.city,
      area: data.area,
      is_published: false,
      is_featured: false,
      telegram_chat_id: chatId,
    });

    await clearBotState(chatId);

    if (error) {
      await sendMessage(chatId, `❌ Ошибка: ${error.message}`, mainKeyboard(lang));
    } else {
      await sendMessage(chatId, t(lang, "done"), mainKeyboard(lang));
    }
    return;
  }
}

// ─── Command handler ─────────────────────────────────────
async function handleCommand(sub: Subscriber, msg: any) {
  const chatId = msg.chat?.id;
  const text = msg.text || "";
  const lang = getLang(sub);

  // If there's an active draft and user sends a non-command message, handle as draft input
  const draft = getDraft(sub);
  if (draft && !text.startsWith("/")) {
    await handleDraftMessage(sub, msg, lang);
    return;
  }

  // Commands cancel any ongoing draft
  if (draft && text.startsWith("/")) {
    await clearBotState(chatId);
  }

  if (text === "/start") {
    await sendMessage(chatId, t(lang, "welcome"), mainKeyboard(lang));
    return;
  }

  if (text === "/help") {
    await sendMessage(chatId, t(lang, "help"), mainKeyboard(lang));
    return;
  }

  if (text === "/buy") {
    const props = await fetchProperties("sale", 5);
    if (props.length > 0) {
      await sendMessage(chatId, t(lang, "buy"));
      for (const p of props) await sendProperty(chatId, p);
    } else {
      await sendMessage(chatId, t(lang, "catalogEmpty"), mainKeyboard(lang));
    }
    return;
  }

  if (text === "/rent") {
    const props = await fetchProperties("rent", 5);
    if (props.length > 0) {
      await sendMessage(chatId, t(lang, "rent"));
      for (const p of props) await sendProperty(chatId, p);
    } else {
      await sendMessage(chatId, t(lang, "catalogEmpty"), mainKeyboard(lang));
    }
    return;
  }

  if (text === "/sell") {
    await setDraft(chatId, "sell_title", {});
    await sendMessage(chatId, t(lang, "sell") + "\n\n" + t(lang, "cancelHint"));
    return;
  }

  if (text === "/lease") {
    await setDraft(chatId, "lease_title", {});
    await sendMessage(chatId, t(lang, "lease") + "\n\n" + t(lang, "cancelHint"));
    return;
  }

  if (text === "/search") {
    await setDraft(chatId, "search_wait", {});
    await sendMessage(chatId, t(lang, "searchPrompt") + "\n\n" + t(lang, "cancelHint"));
    return;
  }

  if (text === "/favorites") {
    await sendMessage(chatId, t(lang, "emptyFavorites"), mainKeyboard(lang));
    return;
  }

  if (text === "/myads") {
    const ads = await fetchMyAds(chatId);
    if (ads.length > 0) {
      await sendMessage(chatId, t(lang, "myads"));
      for (const p of ads) await sendProperty(chatId, p);
    } else {
      await sendMessage(chatId, t(lang, "emptyMyads"), mainKeyboard(lang));
    }
    return;
  }

  if (text === "/support") {
    await setDraft(chatId, "support_wait", {});
    await sendMessage(chatId, t(lang, "support") + "\n\n" + t(lang, "cancelHint"));
    return;
  }

  if (text === "/language") {
    await sendMessage(chatId, t(lang, "language"), languageKeyboard());
    return;
  }

  if (text === "/cancel") {
    await clearBotState(chatId);
    await sendMessage(chatId, t(lang, "cancelled"), mainKeyboard(lang));
    return;
  }

  await sendMessage(chatId, t(lang, "useStart"), mainKeyboard(lang));
}

// ─── Callback handler ─────────────────────────────────────
async function handleCallback(cb: any) {
  const chatId = cb.message?.chat?.id;
  const data = cb.data;
  const sub = await getSubscriber(chatId);
  const lang = getLang(sub);

  // Language selection
  if (data === "lang_ru" || data === "lang_en" || data === "lang_kg") {
    const newLang = data.replace("lang_", "") as Lang;
    await setBotLanguage(chatId, newLang);
    const names: Record<Lang, string> = { ru: "Русский", en: "English", kg: "Кыргызча" };
    await sendMessage(chatId, `✅ ${names[newLang]}`, mainKeyboard(newLang));
    await answerCallback(cb.id);
    return;
  }

  // Reset any draft state on button press
  await clearBotState(chatId);

  if (data === "buy") {
    const props = await fetchProperties("sale", 5);
    if (props.length > 0) {
      await sendMessage(chatId, t(lang, "buy"));
      for (const p of props) await sendProperty(chatId, p);
    } else {
      await sendMessage(chatId, t(lang, "catalogEmpty"), mainKeyboard(lang));
    }
  } else if (data === "rent") {
    const props = await fetchProperties("rent", 5);
    if (props.length > 0) {
      await sendMessage(chatId, t(lang, "rent"));
      for (const p of props) await sendProperty(chatId, p);
    } else {
      await sendMessage(chatId, t(lang, "catalogEmpty"), mainKeyboard(lang));
    }
  } else if (data === "sell") {
    await setDraft(chatId, "sell_title", {});
    await sendMessage(chatId, t(lang, "sell") + "\n\n" + t(lang, "cancelHint"));
  } else if (data === "lease") {
    await setDraft(chatId, "lease_title", {});
    await sendMessage(chatId, t(lang, "lease") + "\n\n" + t(lang, "cancelHint"));
  } else if (data === "search") {
    await setDraft(chatId, "search_wait", {});
    await sendMessage(chatId, t(lang, "searchPrompt") + "\n\n" + t(lang, "cancelHint"));
  } else if (data === "favorites") {
    await sendMessage(chatId, t(lang, "emptyFavorites"), mainKeyboard(lang));
  } else if (data === "myads") {
    const ads = await fetchMyAds(chatId);
    if (ads.length > 0) {
      await sendMessage(chatId, t(lang, "myads"));
      for (const p of ads) await sendProperty(chatId, p);
    } else {
      await sendMessage(chatId, t(lang, "emptyMyads"), mainKeyboard(lang));
    }
  } else if (data === "support") {
    await setDraft(chatId, "support_wait", {});
    await sendMessage(chatId, t(lang, "support") + "\n\n" + t(lang, "cancelHint"));
  } else if (data === "language") {
    await sendMessage(chatId, t(lang, "language"), languageKeyboard());
  } else if (data === "contact") {
    const { data: settings } = await supabase.from("site_settings").select("*").limit(1).maybeSingle();
    if (settings) {
      await sendMessage(chatId, t(lang, "contactInfo", {
        phone: settings.phone || "—",
        email: settings.email || "—",
        whatsapp: settings.whatsapp || "—",
        telegram: settings.telegram || "—",
      }), mainKeyboard(lang));
    }
  } else {
    await sendMessage(chatId, t(lang, "useStart"), mainKeyboard(lang));
  }

  await answerCallback(cb.id);
}

// ─── Main handler ────────────────────────────────────────
Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  if (!BOT_TOKEN) {
    return new Response(
      JSON.stringify({ error: "Bot token not configured" }),
      { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const url = new URL(req.url);
    const path = url.pathname.replace("/functions/v1/telegram-bot", "");

    // Setup webhook
    if (path === "/setup-webhook" && req.method === "POST") {
      const webhookUrl = `${supabaseUrl}/functions/v1/telegram-bot`;
      const result = await fetch(`${TELEGRAM_API}/setWebhook`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: webhookUrl }),
      });
      const resultJson = await result.json();
      return new Response(JSON.stringify({ message: "Webhook configured", result: resultJson }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Broadcast message
    if (path === "/broadcast" && req.method === "POST") {
      const { message } = await req.json();
      if (!message) {
        return new Response(JSON.stringify({ error: "Message required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: subscribers } = await supabase
        .from("telegram_subscribers")
        .select("chat_id")
        .eq("is_active", true);

      let sent = 0;
      let failed = 0;

      if (subscribers && subscribers.length > 0) {
        const results = await Promise.all(
          subscribers.map(async (sub: any) => {
            try {
              const res = await fetch(`${TELEGRAM_API}/sendMessage`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ chat_id: sub.chat_id, text: message, parse_mode: "HTML" }),
              });
              return res.ok ? "sent" : "failed";
            } catch {
              return "failed";
            }
          })
        );
        sent = results.filter((r) => r === "sent").length;
        failed = results.filter((r) => r === "failed").length;
      }

      return new Response(JSON.stringify({ sent, failed, total: subscribers?.length || 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Telegram webhook
    if (req.method === "POST") {
      const update = await req.json();

      if (update.callback_query) {
        await handleCallback(update.callback_query);
        return new Response(JSON.stringify({ ok: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (update.message) {
        const sub = await ensureSubscriber(update.message);
        await handleCommand(sub, update.message);
      }

      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // GET request - bot info
    if (req.method === "GET") {
      const me = await fetch(`${TELEGRAM_API}/getMe`);
      const botInfo = await me.json();
      return new Response(JSON.stringify({ status: "ok", bot: botInfo }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Not found" }), {
      status: 404,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Telegram bot error:", err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
