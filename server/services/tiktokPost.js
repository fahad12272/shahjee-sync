// tiktokPost.js — TikTok Content Posting API publishing engine.
//
// DO MODES (TIKTOK_POST_MODE env var — default "draft"):
//   "draft"  — /v2/post/publish/inbox/video/init/ (video.upload scope)
//     Video user ke TikTok INBOX/DRAFTS mein jati hai; user TikTok app
//     mein ek tap mein usay post kar deta hai (caption + privacy khud
//     choose karta hai). Ye TikTok ka OFFICIAL unaudited/sandbox flow hai
//     — naye console mein video.publish scope hota hi nahi isliye direct
//     post unaudited apps ke liye scope_not_authorized deta hai.
//   "direct" — /v2/post/publish/video/init/ (video.publish scope)
//     Seedha profile pe publish. Ye tabhi on karo jab app audit pass kar
//     le: TIKTOK_POST_MODE=direct + TIKTOK_PRIVACY_LEVEL=PUBLIC_TO_EVERYONE
//
// Flow (FILE_UPLOAD, single chunk):
//   1. Video Cloudinary se download (browser pehle hi upload kar chuka hota hai)
//   2. init endpoint → publish_id + upload_url (1 ghante valid)
//   3. PUT video bytes → upload_url (Content-Range ke saath)
//   4. /v2/post/publish/status/fetch/ poll → post_id (direct) ya
//      SEND_TO_USER_INBOX (draft) mila to kamyab
//
// IMPORTANT (Vercel 60s limit): video cap 60MB — download + upload + short
// status polling iske andar comfortably fit hota hai. Chunks (>64MB rule) ki
// zaroorat nahi kyunke ek hi PUT chalta hai.

import { decryptSecret, encryptSecret } from "../utils/secureStore.js"
import { refreshTiktokToken } from "../utils/tiktokOAuth.js"

const TIKTOK_API = "https://open.tiktokapis.com"

// 60MB cap — Vercel serverless 60s timeout ke andar safe (download ~10s +
// upload ~20s + polling ~15s worst case). Cloudinary free tier 100MB deta hai
// magar hum 60MB pe rok te hain.
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

// Video ko Cloudinary se RAM mein download karo (buffer, streaming nahi —
// simple aur reliable; 60MB max cap ke saath memory bilkul theek rehti hai)
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
// hota hai (parallel publish mein mongoose ParallelSaveError se bachao —
// publishNow.js ka saveChain pattern).
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

// Status poll — post_id (direct mode) mila to wahi return, ya draft mode
// mein SEND_TO_USER_INBOX (video inbox mein pohnch gayi). FAILED status pe
// TikTok ka fail_reason ke saath error.
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
      if (json?.error?.code && json.error.code !== "ok") {
        // Status endpoint ke transient errors pe polling rokni nahi —
        // bas next iteration try hoga (deadline tak)
        console.log(`⚠️ TikTok status check: ${json.error.code}`)
      }
    } catch {
      // network hiccup — deadline tak dobara try
      continue
    }

    if (!data) continue

    if (data.status === "FAILED") {
      const reason = data.fail_reason?.[0]?.fail_reason_str || "unknown"
      throw new Error(`TikTok publish fail hui — ${reason}`)
    }

    // Draft mode: video inbox mein pohnch gayi = kamyab (post_id nahi hota
    // drafts ka — user TikTok app mein khud post karega)
    if (draftMode && data.status === "SEND_TO_USER_INBOX") {
      return { postId: "", delivered: "inbox" }
    }

    if (data.post_id) {
      return { postId: String(data.post_id) }
    }
    // PUBLISH_COMPLETE ho magar post_id na mila (public moderation) —
    // loop chalta rahega deadline tak, phir bina URL ke success
  }
  return { postId: "" }
}

// Main publish — return: { publishId, postId, url, mode }
//   mode "direct": url = tiktok.com/@{username}/video/{post_id} (username mile to)
//   mode "draft":  url khali — video TikTok INBOX/DRAFTS mein hai, user
//                  TikTok app mein khud post karega (caption + privacy wahan)
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

  // 1) Video download
  const buffer = await downloadVideo(videoUrl)
  const size = buffer.length

  // 2) Init — FILE_UPLOAD single chunk (whole file <= 60MB < 64MB chunk limit)
  //    draft mode: inbox init sirf source_info leta hai (post_info NAHI —
  //    caption/privacy user TikTok app mein draft post karte waqt choose karta hai)
  //    direct mode: post_info + source_info dono
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
  if (initJson?.error?.code && initJson.error.code !== "ok") {
    throw new Error(friendlyTiktokError(initJson.error))
  }
  const { publish_id: publishId = "", upload_url: uploadUrl } =
    initJson?.data || {}
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
  if (!putRes.ok) {
    const errText = await putRes.text().catch(() => "")
    throw new Error(
      `TikTok video upload fail hui (HTTP ${putRes.status}) ${errText.slice(0, 120)}`,
    )
  }

  // 3b) Draft mode + init ne publish_id nahi diya — upload kafi hai, video
  //     TikTok ke paas hai aur inbox/drafts mein nazar aayegi
  if (mode === "draft" && !publishId) {
    return { publishId: "", postId: "", url: "", mode }
  }

  // 4) Status poll — total request 60s se kam rakhne ke liye hard deadline
  //    (upload + download ka time nikal ke polling budget)
  //    draft mode: chhota budget (inbox delivery jaldi confirm ho jati hai)
  const elapsed = Date.now() - startedAt
  const pollBudget =
    mode === "draft"
      ? Math.max(8000, 20000 - elapsed)
      : Math.max(8000, 45000 - elapsed)
  const deadline = Date.now() + pollBudget
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
    // Publish fail hui to error uthao — magar agar sirf polling timeout
    // hui ho to post phir bhi TikTok pe process ho rahi hai (success)
    if (String(err.message).startsWith("TikTok publish fail")) throw err
    console.log(`⚠️ TikTok status poll budget khatam (${err.message})`)
  }

  const url =
    mode === "direct" && postId && username
      ? `https://www.tiktok.com/@${username}/video/${postId}`
      : ""

  return { publishId, postId, url, mode }
}
