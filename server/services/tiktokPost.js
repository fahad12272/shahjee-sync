// tiktokPost.js — TikTok Direct Post publishing engine.
//
// Flow (TikTok Content Posting API — FILE_UPLOAD, single chunk):
//   1. Video Cloudinary se download (browser pehle hi video upload kar chuka hota hai)
//   2. /v2/post/publish/video/init/  → publish_id + upload_url (1 ghante valid)
//   3. PUT video bytes → upload_url (Content-Range ke saath)
//   4. /v2/post/publish/status/fetch/ poll → post_id mila to permalink banao
//
// IMPORTANT (Vercel 60s limit): video cap 60MB — download + upload + short
// status polling iske andar comfortably fit hota hai. Chunks (>64MB rule) ki
// zaroorat nahi kyunke ek hi PUT chalta hai.
//
// ZAROORI NOTE (unaudited apps): Jab tak TikTok app audit pass nahi karta,
// har post PRIVATE (SELF_ONLY) publish hoti hai — ye TikTok ka official rule
// hai. Audit ke baad TIKTOK_PRIVACY_LEVEL=PUBLIC_TO_EVERYONE env var set karo.

import { decryptSecret, encryptSecret } from "../utils/secureStore.js"
import { refreshTiktokToken } from "../utils/tiktokOAuth.js"

const TIKTOK_API = "https://open.tiktokapis.com"

// 60MB cap — Vercel serverless 60s timeout ke andar safe (download ~10s +
// upload ~20s + polling ~15s worst case). Cloudinary free tier 100MB deta hai
// magar hum 60MB pe rok te hain.
export const MAX_VIDEO_BYTES = 60 * 1024 * 1024

// Init endpoint per-token rate limit: ~6 requests/min — ek post = 1 request.
const INIT_URL = `${TIKTOK_API}/v2/post/publish/video/init/`
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
    return "TikTok audit tak account PRIVATE hona chahiye — TikTok app mein account private karo"
  }
  if (code === "scope_not_authorized") {
    return "TikTok scope grant nahi hui — developer portal mein video.publish scope add karo aur dobara connect karo"
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

// Status poll — post_id mila to wahi return, warna { postId: "", url: "" }.
// FAILED status pe TikTok ka fail_reason ke saath error.
async function pollTiktokStatus({ publishId, accessToken, deadlineMs }) {
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

    if (data.post_id) {
      return { postId: String(data.post_id) }
    }
    // PUBLISH_COMPLETE ho magar post_id na mila (public moderation) —
    // loop chalta rahega deadline tak, phir bina URL ke success
  }
  return { postId: "" }
}

// Main publish — return: { publishId, postId, url }
//   url = tiktok.com/@{username}/video/{post_id} (username mile to)
//   unaudited/private posts pe post_id jaldi milta hai; public moderation
//   wali posts pe deadline tak nahi mila to url khaali rehti hai (publish
//   phir bhi KAMYAB hai — video TikTok ke paas hai)
export async function publishToTiktok({
  videoUrl,
  title,
  username = "",
  creds,
}) {
  const { accessToken, privacyLevel } = creds
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
  const privacy = privacyLevel || process.env.TIKTOK_PRIVACY_LEVEL || "SELF_ONLY"
  const initRes = await fetch(INIT_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json; charset=UTF-8",
    },
    body: JSON.stringify({
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
    }),
  })
  const initJson = await initRes.json().catch(() => ({}))
  if (initJson?.error?.code && initJson.error.code !== "ok") {
    throw new Error(friendlyTiktokError(initJson.error))
  }
  const { publish_id: publishId, upload_url: uploadUrl } = initJson?.data || {}
  if (!publishId || !uploadUrl) {
    throw new Error(
      `TikTok init jawab mein publish_id/upload_url nahi mila (HTTP ${initRes.status})`,
    )
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

  // 4) Status poll — total request 60s se kam rakhne ke liye hard deadline
  // (upload + download ka time nikal ke ~20s polling)
  const elapsed = Date.now() - startedAt
  const pollBudget = Math.max(8000, 45000 - elapsed)
  const deadline = Date.now() + pollBudget
  let postId = ""
  try {
    const status = await pollTiktokStatus({ publishId, accessToken, deadlineMs: deadline })
    postId = status.postId
  } catch (err) {
    // Publish fail hui to error uthao — magar agar sirf polling timeout
    // hui ho to post phir bhi TikTok pe process ho rahi hai (success)
    if (String(err.message).startsWith("TikTok publish fail")) throw err
    console.log(`⚠️ TikTok status poll budget khatam (${err.message})`)
  }

  const url =
    postId && username
      ? `https://www.tiktok.com/@${username}/video/${postId}`
      : ""

  return { publishId, postId, url }
}
