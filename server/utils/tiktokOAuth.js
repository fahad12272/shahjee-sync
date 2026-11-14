import crypto from "node:crypto"
import {
  serializeStateCookie,
  parseStateCookie,
  clearedStateCookie,
} from "./metaOAuth.js"

// TikTok OAuth 2.0 (Login Kit) — PKCE flow ke saath 1-click connect.
// 100% free — sirf TikTok for Developers app chahiye (TIKTOK_CLIENT_KEY/
// TIKTOK_CLIENT_SECRET env vars Vercel mein).
// Docs:
//   Login Kit web:   developers.tiktok.com/doc/login-kit-web
//   Token manage:   developers.tiktok.com/doc/login-kit-manage-user-access-tokens
//   Direct Post:    developers.tiktok.com/doc/content-posting-api-reference-direct-post

const AUTHORIZE_URL = "https://www.tiktok.com/v2/auth/authorize/"
const TOKEN_URL = "https://open.tiktokapis.com/v2/oauth/token/"
const USER_INFO_URL = "https://open.tiktokapis.com/v2/user/info/"

// SCOPE FIX: TikTok ke naye developer console mein "video.publish" scope
// Add Scopes list mein exist hi nahi karta — authorize URL mein wo scope
// bhejne par TikTok poori request reject kar deta hai ("correct the
// following: scope" wala error). Valid scopes sirf ye hain:
//   user.info.basic = profile (display name / avatar / username)
//   video.upload    = Content Posting API — video upload/share scope
// Direct Post capability console ke Content Posting API > "Direct Post"
// toggle se milti hai, OAuth scope request se nahi.
// NOTE: Audit se pehle posts PRIVATE (SELF_ONLY) hoti hain — TikTok ka
// official rule. Audit ke baad TIKTOK_PRIVACY_LEVEL env var se public
// posting enable hoti hai.
const TIKTOK_SCOPES = "user.info.basic,video.upload"

export function getTiktokConfig() {
  const clientKey = process.env.TIKTOK_CLIENT_KEY
  const clientSecret = process.env.TIKTOK_CLIENT_SECRET
  if (!clientKey || !clientSecret) return null
  return { clientKey, clientSecret }
}

export function getTiktokRedirectUri() {
  const base = process.env.APP_URL || "http://localhost:5000"
  return `${base.replace(/\/$/, "")}/api/platforms/tiktok/oauth/callback`
}

// PKCE — verifier random string, challenge uska SHA-256 (S256).
// Authorize URL ko challenge jata hai, token exchange pe verifier — code
// intercept karne wala attacker token nahi bana sakta.
export function createPkcePair() {
  const verifier = crypto.randomBytes(32).toString("base64url")
  const challenge = crypto
    .createHash("sha256")
    .update(verifier)
    .digest("base64url")
  return { verifier, challenge }
}

export function createState() {
  return crypto.randomBytes(16).toString("hex")
}

export function buildTiktokAuthorizeUrl({ state, codeChallenge }) {
  const params = new URLSearchParams({
    client_key: getTiktokConfig()?.clientKey || "",
    scope: TIKTOK_SCOPES,
    response_type: "code",
    redirect_uri: getTiktokRedirectUri(),
    state,
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
    // Hamesha authorize screen dikhao — TikTok ka "Continue as ..." auto-skip
    // stale grants wala masla paida karta hai
    disable_auto_auth: "1",
  })
  return `${AUTHORIZE_URL}?${params.toString()}`
}

// State cookie — metaOAuth ke generic signed-cookie helpers reuse (HMAC-SHA256,
// JWT_SECRET se sign, 10 min valid). Format sab OAuth flows jaisa hi.
export function serializeTiktokCookie(data) {
  return serializeStateCookie("tiktok_oauth", data)
}

export function parseTiktokCookie(cookieHeader) {
  return parseStateCookie(cookieHeader, "tiktok_oauth")
}

export function clearedTiktokCookie() {
  return clearedStateCookie("tiktok_oauth")
}

// Token endpoint shared helper — TikTok jawab ya flat error deta hai:
//   success: { access_token, expires_in, refresh_token, refresh_expires_in, open_id, scope, token_type }
//   error:   { error, error_description, log_id }
async function tokenRequest(formParams) {
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(formParams).toString(),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok || !data.access_token) {
    throw new Error(
      data.error_description ||
        data.error ||
        data.message ||
        `TikTok OAuth error ${res.status}`,
    )
  }
  return data
}

// Authorization code → access token (~24 ghante) + refresh token (~365 din)
export async function exchangeTiktokCode({ code, codeVerifier }) {
  const { clientKey, clientSecret } = getTiktokConfig() || {}
  return tokenRequest({
    client_key: clientKey || "",
    client_secret: clientSecret || "",
    code: String(code),
    grant_type: "authorization_code",
    redirect_uri: getTiktokRedirectUri(),
    code_verifier: codeVerifier || "",
  })
}

// Refresh token se naya access token — access token 24 ghante mein expire
// hota hai, publish se pehle expiry qareeb ho to ye chalta hai.
// Normalized return: { accessToken, refreshToken, expiresIn }
export async function refreshTiktokToken(refreshToken) {
  const { clientKey, clientSecret } = getTiktokConfig() || {}
  const data = await tokenRequest({
    client_key: clientKey || "",
    client_secret: clientSecret || "",
    grant_type: "refresh_token",
    refresh_token: String(refreshToken),
  })
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token || refreshToken,
    expiresIn: data.expires_in || 24 * 3600,
  }
}

// Profile — display name + @username (publish ke baad permalink isi se
// banta hai: tiktok.com/@username/video/{post_id})
export async function fetchTiktokUserInfo(accessToken) {
const url =
  USER_INFO_URL +          // "https://open.tiktokapis.com/v2/user/info/"
  new URLSearchParams({...}).toString()   // "fields=open_id%2C..."
      fields: "open_id,display_name,avatar_url,username",
    }).toString()
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok || data?.error?.code) {
    throw new Error(
      data?.error?.message || `TikTok user info error ${res.status}`,
    )
  }
  const user = data?.data?.user || {}
  return {
    openId: user.open_id || "",
    displayName: user.display_name || "",
    avatarUrl: user.avatar_url || "",
    username: user.username || "",
  }
}
