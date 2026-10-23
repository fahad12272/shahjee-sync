// Telegram Bot API publishing — zero dependencies, 100% free, koi approval nahi
// Docs: https://core.telegram.org/bots/api

const TG_BASE = "https://api.telegram.org"

async function tgCall(botToken, method, payload) {
  const res = await fetch(`${TG_BASE}/bot${botToken}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok || !data.ok) {
    throw new Error(data?.description || `Telegram API error ${res.status}`)
  }
  return data.result
}

// Connection verify — test message bhejta hai (bot + chat dono validate hote hain)
export async function verifyTelegram({ botToken, chatId }) {
  const sent = await tgCall(botToken, "sendMessage", {
    chat_id: chatId,
    text: "✅ Shahjee Sync connected! Ab tumhari scheduled posts yahan auto-publish hongi.",
  })
  let botName = ""
  try {
    const me = await tgCall(botToken, "getMe", {})
    botName = me.username || ""
  } catch {
    // getMe fail ho bhi to connection valid hai (message chala gaya)
  }
  const chat = sent.chat || {}
  return {
    chatTitle: chat.title || chat.username || chat.first_name || "chat",
    botName,
  }
}

// Post publish karo — image ho to sendPhoto (caption ke saath), warna sendMessage
export async function publishToTelegram({ text, imageUrl, creds }) {
  const caption = String(text || "").trim()
  let result
  if (imageUrl) {
    result = await tgCall(creds.botToken, "sendPhoto", {
      chat_id: creds.chatId,
      photo: imageUrl,
      caption: caption.slice(0, 1024), // Telegram caption limit
    })
  } else {
    result = await tgCall(creds.botToken, "sendMessage", {
      chat_id: creds.chatId,
      text: caption || "📷",
    })
  }
  const chat = result.chat || {}
  const url = chat.username
    ? `https://t.me/${chat.username}/${result.message_id}`
    : ""
  return {
    id: String(result.message_id),
    url,
    chatTitle: chat.title || chat.username || chat.first_name || "",
  }
}
