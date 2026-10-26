import crypto from "node:crypto"

// Meta family OAuth — Facebook Pages + Instagram + Threads (1-click connect)
// 1 Meta developer app = teeno platforms. Graph API 100% free — koi credits/fees nahi.
// Docs:
//   FB Login manual flow: developers.facebook.com/docs/facebook-login/guides/advanced/manual-flow
//   IG publishing:        developers.facebook.com/docs/instagram-api/guides/content-publishing
//   Threads OAuth:        developers.facebook.com/docs/threads/getting-started

const GRAPH_BASE = process.env.META_GRAPH_BASE || "https://graph.facebook.com"
const THREADS_BASE = process.env.THREADS_GRAPH_BASE || "https://graph.threads.net"
const GRAPH_VERSION = "v21.0"

const FB_AUTHORIZE_URL = `https://www.facebook.com/${GRAPH_VERSION}/dialog/oauth`
const THREADS_AUTHORIZE_URL = "https://threads.net/oauth/authorize"

// FB scopes — dev mode mein app admins/testers ke liye review ke bina chalte hain
const FB_SCOPES = [
  "pages_show_list",
  "pages_manage_posts",
  "instagram_basic",
  "instagram_content_publish",
].join(",")

const THREADS_SCOPES = ["threads_basic", "threads_content_publish"].join(",")

export function getMetaConfig() {
  const appId = process.env.META_APP_ID
  const appSecret = process.env.META_APP_SECRET
  if (!appId || !appSecret) return null
  return { appId, appSecret }
}

// platform: "facebook" | "instagram" | "threads"
export function getRedirectUri(platform) {
  const base = process.env.APP_URL || "http://localhost:5000"
  return `${base.replace(/\/$/, "")}/api/platforms/${platform}/oauth/callback`
}

export function createState() {
  return crypto.randomBytes(16).toString("hex")
}

// ---------- Facebook (Pages + Instagram dono isi flow se) ----------
export function buildFacebookAuthorizeUrl({ state, platform }) {
  const params = new URLSearchParams({
    client_id: getMetaConfig()?.appId || "",
    redirect_uri: getRedirectUri(platform),
    state,
    scope: FB_SCOPES,
    response_type: "code",
  })
  return `${FB_AUTHORIZE_URL}?${params.toString()}`
}

async function graphGet(url) {
  const res = await fetch(url)
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(data?.error?.message || `Meta Graph API error ${res.status}`)
  }
  return data
}

// Authorization code → short-lived user token (1-2 ghante)
export async function exchangeFacebookCode({ code, platform }) {
  const { appId, appSecret } = getMetaConfig() || {}
  const url =
    `${GRAPH_BASE}/${GRAPH_VERSION}/oauth/access_token?` +
    new URLSearchParams({
      client_id: appId || "",
      client_secret: appSecret || "",
      redirect_uri: getRedirectUri(platform),
      code: String(code),
    }).toString()
  const data = await graphGet(url)
  if (!data.access_token) throw new Error("Facebook ne access token nahi diya")
  return data.access_token
}

// Short-lived → long-lived user token (~60 din)
export async function exchangeFacebookLongLived(shortToken) {
  const { appId, appSecret } = getMetaConfig() || {}
  const url =
    `${GRAPH_BASE}/${GRAPH_VERSION}/oauth/access_token?` +
    new URLSearchParams({
      grant_type: "fb_exchange_token",
      client_id: appId || "",
      client_secret: appSecret || "",
      fb_exchange_token: shortToken,
    }).toString()
  const data = await graphGet(url)
  if (!data.access_token) throw new Error("Facebook long-lived token nahi de saka")
  return data.access_token
}

// Long-lived user token se Pages + unke (long-lived) page tokens.
// Long-lived user token se liya gaya page token practically expire nahi hota.
export async function fetchUserPages(userToken) {
  const url =
    `${GRAPH_BASE}/${GRAPH_VERSION}/me/accounts?` +
    new URLSearchParams({
      fields: "id,name,access_token",
      access_token: userToken,
      limit: "25",
    }).toString()
  const data = await graphGet(url)
  return Array.isArray(data.data) ? data.data : []
}

// Page se linked Instagram Business/Creator account (na ho to null)
export async function fetchInstagramAccount(pageId, pageToken) {
  const url =
    `${GRAPH_BASE}/${GRAPH_VERSION}/${pageId}?` +
    new URLSearchParams({
      fields: "instagram_business_account{id,username}",
      access_token: pageToken,
    }).toString()
  const data = await graphGet(url)
  const ig = data.instagram_business_account
  if (!ig?.id) return null
  return { id: ig.id, username: ig.username || "" }
}

// ---------- Threads ----------
export function buildThreadsAuthorizeUrl({ state }) {
  const params = new URLSearchParams({
    client_id: getMetaConfig()?.appId || "",
    redirect_uri: getRedirectUri("threads"),
    response_type: "code",
    scope: THREADS_SCOPES,
    state,
  })
  return `${THREADS_AUTHORIZE_URL}?${params.toString()}`
}

// Authorization code → short-lived Threads token (~1 ghanta)
export async function exchangeThreadsCode({ code }) {
  const { appId, appSecret } = getMetaConfig() || {}
  const res = await fetch(`${THREADS_BASE}/oauth/access_token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: appId || "",
      client_secret: appSecret || "",
      grant_type: "authorization_code",
      redirect_uri: getRedirectUri("threads"),
      code: String(code),
    }).toString(),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok || !data.access_token) {
    throw new Error(data?.error?.message || `Threads OAuth error ${res.status}`)
  }
  return data.access_token
}

// Short-lived → long-lived (~60 din)
export async function exchangeThreadsLongLived(shortToken) {
  const { appSecret } = getMetaConfig() || {}
  const url =
    `${THREADS_BASE}/access_token?` +
    new URLSearchParams({
      grant_type: "th_exchange_token",
      client_secret: appSecret || "",
      access_token: shortToken,
    }).toString()
  const data = await graphGet(url)
  if (!data.access_token) throw new Error("Threads long-lived token nahi de saka")
  return data // { access_token, expires_in }
}

// Long-lived refresh — cron posting se pehle expiry ke qareeb ho to chalayenge
export async function refreshThreadsToken(longToken) {
  const url =
    `${THREADS_BASE}/refresh_access_token?` +
    new URLSearchParams({
      grant_type: "th_refresh_token",
      access_token: longToken,
    }).toString()
  const data = await graphGet(url)
  if (!data.access_token) throw new Error("Threads token refresh fail hui")
  // Normalized return — cron.js mein refreshed.accessToken/expiresIn use hota hai
  return {
    accessToken: data.access_token,
    expiresIn: data.expires_in || 60 * 24 * 3600,
  }
}

// Threads profile — @username ke liye
export async function fetchThreadsProfile(accessToken) {
  const url =
    `${THREADS_BASE}/v1.0/me?` +
    new URLSearchParams({
      fields: "id,username",
      access_token: accessToken,
    }).toString()
  const data = await graphGet(url)
  return { id: data.id || "", username: data.username || "" }
}

// ---------- Signed state cookie (xOAuth jaisa hi — generic naam wala) ----------
// Format: <base64url(JSON)>.<HMAC-SHA256> — JWT_SECRET se sign, 10 min valid
function signKey() {
  return crypto
    .createHash("sha256")
    .update(process.env.JWT_SECRET || "shahjee-sync-local-dev-secret")
    .digest()
}

const COOKIE_MAX_AGE_MS = 10 * 60 * 1000

export function serializeStateCookie(name, data) {
  const payload = Buffer.from(JSON.stringify(data)).toString("base64url")
  const sig = crypto
    .createHmac("sha256", signKey())
    .update(payload)
    .digest("base64url")
  return { name, value: `${payload}.${sig}`, maxAge: COOKIE_MAX_AGE_MS }
}

export function parseStateCookie(cookieHeader, name) {
  if (!cookieHeader) return null
  const raw = cookieHeader
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`))
  if (!raw) return null

  const value = raw.slice(name.length + 1)
  const dotIndex = value.lastIndexOf(".")
  if (dotIndex <= 0) return null

  const payload = value.slice(0, dotIndex)
  const sig = value.slice(dotIndex + 1)
  const expected = crypto
    .createHmac("sha256", signKey())
    .update(payload)
    .digest("base64url")
  if (sig.length !== expected.length) return null
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null

  try {
    return JSON.parse(Buffer.from(payload, "base64url").toString("utf8"))
  } catch {
    return null
  }
}

export function clearedStateCookie(name) {
  return { name, value: "", maxAge: 0 }
}
