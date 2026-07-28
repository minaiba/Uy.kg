import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const BOT_TOKEN = "8418470696:AAENJm0-3ytsBzWfSv5M0a4YSQRnKWMe_Y0";
const TELEGRAM_API = `https://api.telegram.org/bot${BOT_TOKEN}`;

const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function sendMessage(chatId: number, text: string, keyboard?: any) {
  const body: any = {
    chat_id: chatId,
    text: text,
    parse_mode: "HTML",
  };
  if (keyboard) body.reply_markup = keyboard;
  await fetch(`${TELEGRAM_API}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

async function setWebhook(url: string) {
  const res = await fetch(`${TELEGRAM_API}/setWebhook`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
  });
  return res.json();
}

const mainKeyboard = {
  inline_keyboard: [
    [{ text: "🏠 Каталог недвижимости", callback_data: "catalog" }],
    [{ text: "📞 Связаться с нами", callback_data: "contact" }],
    [{ text: "🌐 Наш сайт", url: "https://estatepremium.kg" }],
  ],
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const path = url.pathname.replace("/functions/v1/telegram-bot", "");

    // Setup webhook
    if (path === "/setup-webhook" && req.method === "POST") {
      const webhookUrl = `${supabaseUrl}/functions/v1/telegram-bot`;
      const result = await setWebhook(webhookUrl);
      return new Response(JSON.stringify({ message: "Webhook configured", result }), {
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
                body: JSON.stringify({
                  chat_id: sub.chat_id,
                  text: message,
                  parse_mode: "HTML",
                }),
              });
              if (res.ok) return "sent";
              return "failed";
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

      // Handle callback queries (button presses)
      if (update.callback_query) {
        const cb = update.callback_query;
        const chatId = cb.message?.chat?.id;
        const data = cb.callback_query?.data || cb.data;

        if (data === "catalog") {
          const { data: properties } = await supabase
            .from("properties")
            .select("*")
            .eq("is_published", true)
            .eq("status", "active")
            .order("created_at", { ascending: false })
            .limit(5);

          if (properties && properties.length > 0) {
            for (const prop of properties) {
              const title = prop.title?.ru || prop.title?.en || "Property";
              const price = `${prop.price} ${prop.currency}`;
              const text = `🏠 <b>${title}</b>\n💰 ${price}\n📍 ${prop.city || ""}\n📐 ${prop.area} м²${prop.bedrooms ? `\n🛏 ${prop.bedrooms} комнат` : ""}`;
              if (prop.main_image_url) {
                await fetch(`${TELEGRAM_API}/sendPhoto`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    chat_id: chatId,
                    photo: prop.main_image_url,
                    caption: text,
                    parse_mode: "HTML",
                  }),
                });
              } else {
                await sendMessage(chatId, text);
              }
            }
          } else {
            await sendMessage(chatId, "Каталог пуст. Скоро появятся новые объекты!");
          }
        } else if (data === "contact") {
          const { data: settings } = await supabase
            .from("site_settings")
            .select("*")
            .limit(1)
            .maybeSingle();

          if (settings) {
            const contactText = `📞 <b>Контакты</b>\n\nТелефон: ${settings.phone || "—"}\nEmail: ${settings.email || "—"}\nWhatsApp: ${settings.whatsapp || "—"}\nTelegram: @${settings.telegram || "—"}`;
            await sendMessage(chatId, contactText);
          }
        }

        // Answer callback query
        await fetch(`${TELEGRAM_API}/answerCallbackQuery`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ callback_query_id: cb.id }),
        });

        return new Response(JSON.stringify({ ok: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Handle regular messages
      if (update.message) {
        const msg = update.message;
        const chatId = msg.chat?.id;
        const text = msg.text || "";

        if (text === "/start") {
          // Subscribe user
          const { data: existing } = await supabase
            .from("telegram_subscribers")
            .select("id")
            .eq("chat_id", chatId)
            .maybeSingle();

          if (!existing) {
            await supabase.from("telegram_subscribers").insert({
              chat_id: chatId,
              username: msg.from?.username || null,
              first_name: msg.from?.first_name || null,
              last_name: msg.from?.last_name || null,
              language_code: msg.from?.language_code || null,
            });
          }

          const welcomeText = `👋 <b>Добро пожаловать в Estate Premium!</b>\n\nМы поможем вам найти дом, квартиру или коммерческое помещение.\n\nВыберите действие:`;
          await sendMessage(chatId, welcomeText, mainKeyboard);
        } else if (text === "/help") {
          await sendMessage(chatId, "Доступные команды:\n/start — главное меню\n/help — помощь", mainKeyboard);
        } else {
          await sendMessage(chatId, "Используйте /start для открытия меню", mainKeyboard);
        }
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
    return new Response(
      JSON.stringify({ error: err.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
