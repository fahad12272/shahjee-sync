import crypto from "node:crypto"

// X (Twitter) API v2 publishing — OAuth 1.0a (HMAC-SHA1), zero dependencies
// Docs: https://docs.x.com/x-api/posts

const API_BASE = "https://api.x.com"

function percentEncode(value) {
  return encodeURIComponent(String(value)).replace(
    /[!'()*]/g,
    (c) => "%" + c.charCodeAt(0).toString(16).toUpperCase(),
  )
}

// OAuth 1.0a Authorization header banata hai (har request ke liye fresh)
function oauthHeader(method, url, creds, extraParams = {}) {
  const oauth = {
    oauth_consumer_key: creds.apiKey,
    oauth_nonce: crypto.randomBytes(16).toString("hex"),
    oauth_signature_method: "HMAC-SHA1",
    oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
    oauth_token: creds.accessToken,
    oauth_version: "1.0",
  }

  const all = { ...oauth, ...extraParams }
  const paramStr = Object.keys(all)
    .sort()
    .map((k) => `${percentEncode(k)}=${percentEncode(all[k])}`)
    .join("&")
  const baseStr = [
    method.toUpperCase(),
    percentEncode(url),
    percentEncode(paramStr),
  ].join("&")
  const signingKey = `${percentEncode(creds.apiSecret)}&${percentEncode(creds.accessSecret)}`

  oauth.oauth_signature = crypto
    .createHmac("sha1", signingKey)
    .update(baseStr)
    .digest("base64")

  return (
    "OAuth " +
    Object.keys(oauth)
      .sort()
      .map((k) => `${percentEncode(k)}="${percentEncode(oauth[k])}"`)
      .join(", ")
  )
}

function xError(data, status) {
  return new Error(
    data?.detail ||
      data?.title ||
      data?.errors?.[0]?.message ||
      `X API error ${status}`,
  )
}

// Credentials verify — GET /2/users/me
export async function verifyXCredentials(creds) {
  const url = `${API_BASE}/2/users/me`
  const res = await fetch(url, {
    headers: { Authorization: oauthHeader("GET", url, creds) },
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw xError(data, res.status)
  return {
    username: data.data?.username || "",
    name: data.data?.name || "",
  }
}

// Image ko X pe upload karo — v2 chunked flow (INIT → APPEND → FINALIZE)
async function uploadXMedia(imageUrl, creds) {
  const imgRes = await fetch(imageUrl)
  if (!imgRes.ok) throw new Error(`Image download fail: HTTP ${imgRes.status}`)
  const buffer = Buffer.from(await imgRes.arrayBuffer())
  if (buffer.length > 5 * 1024 * 1024) {
    throw new Error("Image 5MB se badi hai — X ke liye chhoti image use karo")
  }
  const isPng = imageUrl.split("?")[0].toLowerCase().endsWith(".png")
  const mediaType = isPng ? "image/png" : "image/jpeg"

  // 1) INIT
  const initUrl = `${API_BASE}/2/media/upload/initialize`
  const initRes = await fetch(initUrl, {
    method: "POST",
    headers: {
      Authorization: oauthHeader("POST", initUrl, creds),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      media_type: mediaType,
      total_bytes: buffer.length,
      media_category: "tweet_image",
    }),
  })
  const initData = await initRes.json().catch(() => ({}))
  if (!initRes.ok) throw xError(initData, initRes.status)
  const mediaId = initData.data?.id

  // 2) APPEND (single chunk — images < 5MB ek hi chunk mein chali jaati hain)
  const appendUrl = `${API_BASE}/2/media/upload/${mediaId}/append`
  const form = new FormData()
  form.append("segment_index", "0")
  form.append(
    "media",
    new Blob([buffer], { type: mediaType }),
    isPng ? "image.png" : "image.jpg",
  )
  const appendRes = await fetch(appendUrl, {
    method: "POST",
    headers: { Authorization: oauthHeader("POST", appendUrl, creds) },
    body: form,
  })
  if (!appendRes.ok && appendRes.status !== 204) {
    const appendData = await appendRes.json().catch(() => ({}))
    throw xError(appendData, appendRes.status)
  }

  // 3) FINALIZE
  const finalizeUrl = `${API_BASE}/2/media/upload/${mediaId}/finalize`
  const finalizeRes = await fetch(finalizeUrl, {
    method: "POST",
    headers: { Authorization: oauthHeader("POST", finalizeUrl, creds) },
  })
  const finalizeData = await finalizeRes.json().catch(() => ({}))
  if (!finalizeRes.ok) throw xError(finalizeData, finalizeRes.status)

  return mediaId
}

// Post publish karo — POST /2/tweets
export async function publishToX({ text, imageUrl, creds }) {
  const clean = String(text || "").trim()
  const body = {
    text: clean.length > 280 ? clean.slice(0, 277) + "…" : clean,
  }

  if (imageUrl) {
    const mediaId = await uploadXMedia(imageUrl, creds)
    body.media = { media_ids: [mediaId] }
  }

  const url = `${API_BASE}/2/tweets`
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: oauthHeader("POST", url, creds),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw xError(data, res.status)

  const id = data.data?.id
  return { id: id || "", url: id ? `https://x.com/i/web/status/${id}` : "" }
}
