// tiktokPost.js — TikTok Content Posting API publishing engine.
//
// DO MODES (TIKTOK_POST_MODE env var — default "draft"):
//   "draft"  — /v2/post/publish/inbox/video/init/ (video.upload scope)
//     Video user ke TikTok INBOX/DRAFTS mein jati hai; user TikTok app
//     mein ek tap mein usay post kar deta hai. Ye TikTok ka OFFICIAL
//     unaudited/sandbox flow hai.
//   "direct" — /v2/post/publish/video/init/ (video.publish scope)
//     Audit ke baad: TIKTOK_POST_MODE=direct +
//     TIKTOK_PRIVACY_LEVEL=PUBLIC_TO_EVERYONE
//
// DEBUG BUILD: har step Vercel runtime logs mein print hota hai (init jawab,
// PUT status, har status poll ka jawab) — taake video TikTok tak pohnchne
// ka exact point trace ho sake. Tokens/URLs log NAHI hote (sirf status).

import { decryptSecret, encryptSecret } from "../utils/secureStore.js"
import { refreshTiktokToken } from "../utils/tiktokOAuth.js"

const TIKTOK_API = "https://open.tiktokapis.com"

// 60MB cap — Vercel serverless 60s timeout ke andar safe.
export const MAX_VIDEO_BYTES = 60 * 1024 * 1024

// Mode switch — "draft" (default, unaudited-safe) | "direct" (audit ke baad)
export function getTiktokPostMode() {
  return String(process.env.TIKTOK_POST_MODE || "draft").toLowerCase() ===
    "direct"
    ? "direct"
    : "draft"
}

const DIRECT_INIT_URL = `${TIKTOK_API}/v2/post/publish/video/init/`
const INBOX_INIT_URL = `${TIKTOK_API}/v2/post/publish/inbox/video/init/`
const STATUS_URL = `${TIKTOK_API}/v2/post/publish/status/fetch/`

// Cloudinary URL extension se TikTok upload ka Content-Type nikaalo
// (TikTok accepted: video/mp4, video/quicktime, video/webm)
function guessVideoMime(videoUrl) {
  const clean = String(videoUrl).split("?")[0].toLowerCase()
  if (clean.endsWith(".mov")) return "video/quicktime"
  if (clean.endsWith(".webm")) return "video/webm"
  return "video/mp4"
}

// TikTok errors: HTTP 200 ke andar bhi { error: { code, message } } aa sakta
// hai — user-friendly Roman Urdu messages common codes ke liye
function friendlyTiktokError(error) {
  const code = error?.code || ""
  const message = error?.message || "TikTok API error"
  if (code === "spam_risk_too_many_posts") {
    return "TikTok daily limit reach ho gayi (~15 posts/din) — kal try karo"
  }
  if (code === "privacy_level_option_mismatch") {
    return "TikTok privacy level support nahi karta — TIKTOK_PRIVACY_LEVEL=SELF_ONLY rakho"
  }
  if (code === "unaudited_client_can_only_post_to_private_accounts") {
    return "TikTok audit tak direct post PRIVATE hai — draft mode use karo (TIKTOK_POST_MODE=draft)"
  }
  if (code === "scope_not_authorized") {
    return "TikTok scope grant poori nahi hui — Connected Accounts pe TikTok disconnect karke dobara connect karo"
  }
  if (code === "url_ownership_unverified") {
    return "TikTok video URL verify nahi hua — FILE_UPLOAD mode use hota hai, dobara try karo"
  }
  return message
}

// Video ko Cloudinary se RAM mein download karo (buffer, streaming nahi)
async function downloadVideo(videoUrl) {
  const res = await fetch(videoUrl)
  if (!res.ok) {
    throw new Error(`Video download fail hui (HTTP ${res.status}) — Cloudinary URL check karo`)
  }
  const buffer = Buffer.from(await res.arrayBuffer())
  if (buffer.length === 0) {
    throw new Error("Video file khali hai")
  }
  if (buffer.length > MAX_VIDEO_BYTES) {
    throw new Error(
      `Video ${Math.round(buffer.length / (1024 * 1024))}MB hai — TikTok ke liye 60MB se chhoti video rakho`,
    )
  }
  return buffer
}

// Token helper — access token ~24 ghante mein expire hota hai. Expiry ke
// 2 ghante andar ho to refresh_token se naya le lo. saveUser chained call
// hota hai (parallel publish mein mongoose ParallelSaveError se bachao).
export async function getFreshTiktokToken(tkp, saveUser = null) {
  const expiresAt = tkp.expiresAt ? new Date(tkp.expiresAt).getTime() : 0
  if (expiresAt && expiresAt - Date.now() > 2 * 3600 * 1000) {
    return decryptSecret(tkp.accessToken) // abhi fresh hai
  }
  if (!tkp.refreshToken) {
    throw new Error(
      "TikTok token expire ho gaya aur refresh token nahi hai — Connected Accounts pe dobara connect karo",
    )
  }

  console.log("🔄 TikTok token refresh (publish se pehle)")
  const refreshed = await refreshTiktokToken(decryptSecret(tkp.refreshToken))
  tkp.accessToken = encryptSecret(refreshed.accessToken)
  tkp.refreshToken = encryptSecret(refreshed.refreshToken)
  tkp.expiresAt = new Date(Date.now() + refreshed.expiresIn * 1000)
  if (saveUser) await saveUser()

  return refreshed.accessToken
}

// Status poll — post_id (direct mode) ya SEND_TO_USER_INBOX (draft mode).
// DEBUG: har poll ka jawab log hota hai.
async function pollTiktokStatus({ publishId, accessToken, deadlineMs, draftMode = false }) {
  while (Date.now() < deadlineMs) {
    await new Promise((resolve) => setTimeout(resolve, 5000)) // 5s gap

    let data = null
    try {
      const res = await fetch(STATUS_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json; charset=UTF-8",
        },
        body: JSON.stringify({ publish_id: publishId }),
      })
      const json = await res.json().catch(() => ({}))
      data = json?.data || null
      console.log(
        `📡 TikTok status poll — HTTP ${res.status} | error: ${JSON.stringify(json?.error || null)} | data: ${JSON.stringify(data || null)}`,
      )
      if (json?.error?.code && json.error.code !== "ok") {
        // Transient errors pe polling rokni nahi — deadline tak try
        console.log(`⚠️ TikTok status check: ${json.error.code}`)
      }
    } catch (e) {
      console.log(`⚠️ TikTok status poll network error: ${e.message}`)
      continue
    }

    if (!data) continue

    if (data.status === "FAILED") {
      const reason = data.fail_reason?.[0]?.fail_reason_str || "unknown"
      throw new Error(`TikTok publish fail hui — ${reason}`)
    }

    // Draft mode: video inbox mein pohnch gayi = kamyab
    if (draftMode && data.status === "SEND_TO_USER_INBOX") {
      return { postId: "", delivered: "inbox" }
    }

    if (data.post_id) {
      return { postId: String(data.post_id) }
    }
  }
  return { postId: "" }
}

// Main publish — return: { publishId, postId, url, mode }
export async function publishToTiktok({
  videoUrl,
  title,
  username = "",
  creds,
}) {
  const { accessToken, privacyLevel } = creds
  const mode = getTiktokPostMode()
  if (!accessToken) {
    throw new Error("TikTok access token nahi mila")
  }
  if (!videoUrl) {
    throw new Error(
      "TikTok ke liye video zaroori hai — Create Post pe video upload karo (sirf image kaafi nahi)",
    )
  }

  const startedAt = Date.now()
  console.log(`📤 TikTok publish start — mode: ${mode}`)

  // 1) Video download
  const buffer = await downloadVideo(videoUrl)
  const size = buffer.length
  console.log(`📤 TikTok video download ho gayi — ${Math.round(size / 1024)} KB`)

  // 2) Init — FILE_UPLOAD single chunk
  const privacy = privacyLevel || process.env.TIKTOK_PRIVACY_LEVEL || "SELF_ONLY"
  const initBody =
    mode === "direct"
      ? {
          post_info: {
            title: String(title || "").slice(0, 2200),
            privacy_level: privacy,
            disable_duet: false,
            disable_stitch: false,
            disable_comment: false,
            brand_content_toggle: false,
            brand_organic_toggle: false,
            is_aigc: false,
          },
          source_info: {
            source: "FILE_UPLOAD",
            video_size: size,
            chunk_size: size,
            total_chunk_count: 1,
          },
        }
      : {
          source_info: {
            source: "FILE_UPLOAD",
            video_size: size,
            chunk_size: size,
            total_chunk_count: 1,
          },
        }

  console.log(
    `📤 TikTok init request — ${mode === "direct" ? "DIRECT" : "INBOX (draft)"} endpoint`,
  )
  const initRes = await fetch(
    mode === "direct" ? DIRECT_INIT_URL : INBOX_INIT_URL,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json; charset=UTF-8",
      },
      body: JSON.stringify(initBody),
    },
  )
  const initJson = await initRes.json().catch(() => ({}))
  const { publish_id: publishId = "", upload_url: uploadUrl } =
    initJson?.data || {}
  console.log(
    `📤 TikTok init jawab — HTTP ${initRes.status} | error: ${JSON.stringify(initJson?.error || null)} | publishId: ${publishId ? "MILA" : "NAHI MILA"} | uploadUrl: ${uploadUrl ? "MILA" : "NAHI MILA"} | dataKeys: ${JSON.stringify(Object.keys(initJson?.data || {}))}`,
  )
  if (initJson?.error?.code && initJson.error.code !== "ok") {
    throw new Error(friendlyTiktokError(initJson.error))
  }
  if (!uploadUrl) {
    throw new Error(
      `TikTok init jawab mein upload_url nahi mila (HTTP ${initRes.status})`,
    )
  }
  if (mode === "direct" && !publishId) {
    throw new Error("TikTok init jawab mein publish_id nahi mila (direct mode)")
  }

  // 3) Video PUT — upload_url pehle se authorized hai, koi auth header nahi
  const putRes = await fetch(uploadUrl, {
    method: "PUT",
    headers: {
      "Content-Type": guessVideoMime(videoUrl),
      "Content-Length": String(size),
      "Content-Range": `bytes 0-${size - 1}/${size}`,
    },
    body: buffer,
  })
  console.log(`📤 TikTok video PUT — HTTP ${putRes.status}`)
  if (!putRes.ok) {
    const errText = await putRes.text().catch(() => "")
    console.log(`📤 TikTok PUT error body: ${errText.slice(0, 200)}`)
    throw new Error(
      `TikTok video upload fail hui (HTTP ${putRes.status}) ${errText.slice(0, 120)}`,
    )
  }

  // 3b) Draft mode + init ne publish_id nahi diya — upload kafi hai
  if (mode === "draft" && !publishId) {
    console.log("⏭️ TikTok draft mode — publish_id nahi mila tha, PUT kamyab = video TikTok ke paas")
    return { publishId: "", postId: "", url: "", mode }
  }

  // 4) Status poll — hard deadline (60s Vercel limit ke andar)
  const elapsed = Date.now() - startedAt
  const pollBudget =
    mode === "draft"
      ? Math.max(8000, 20000 - elapsed)
      : Math.max(8000, 45000 - elapsed)
  const deadline = Date.now() + pollBudget
  console.log(`📡 TikTok status poll shuru — budget: ${Math.round(pollBudget / 1000)}s`)
  let postId = ""
  try {
    const status = await pollTiktokStatus({
      publishId,
      accessToken,
      deadlineMs: deadline,
      draftMode: mode === "draft",
    })
    postId = status.postId
  } catch (err) {
    if (String(err.message).startsWith("TikTok publish fail")) throw err
    console.log(`⚠️ TikTok status poll budget khatam (${err.message})`)
  }

  const url =
    mode === "direct" && postId && username
      ? `https://www.tiktok.com/@${username}/video/${postId}`
      : ""

  console.log(
    `✅ TikTok publish khatam — mode: ${mode} | publishId: ${publishId ? "mila" : "—"} | postId: ${postId || "—"} | url: ${url || "—"}`,
  )
  return { publishId, postId, url, mode }
}
