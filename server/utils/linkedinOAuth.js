import crypto from "node:crypto"

// LinkedIn OAuth 2.0 (3-legged) — "Connect with LinkedIn" 1-click flow
// 100% free — koi credits/fees nahi. Access token ~60 din chalta hai,
// refresh_token mile to auto-renew, warna user dobara connect karta hai.
// Docs: learn.microsoft.com/linkedin/shared/authentication/authorization-code-flow
// Posts API: learn.microsoft.com/linkedin/marketing/community-management/shares/posts-api

const AUTHORIZE_URL = "https://www.linkedin.com/oauth/v2/authorization"
const TOKEN_URL = "https://www.linkedin.com/oauth/v2/accessToken"
const USERINFO_URL = "https://api.linkedin.com/v2/userinfo"

// openid + profile = Sign In with LinkedIn (profile lena), w_member_social = posting
const SCOPES = "openid profile w_member_social"

export function getLinkedInConfig() {
  const clientId = process.env.LINKEDIN_CLIENT_ID
  const clientSecret = process.env.LINKEDIN_CLIENT_SECRET
  if (!clientId || !clientSecret) return null
  return { clientId, clientSecret }
}

export function getRedirectUri() {
  const base = process.env.APP_URL || "http://localhost:5000"
  return `${base.replace(/\/$/, "")}/api/platforms/linkedin/oauth/callback`
}

export function createState() {
  return crypto.randomBytes(16).toString("hex")
}

export function buildAuthorizeUrl({ clientId, state }) {
  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    redirect_uri: getRedirectUri(),
    scope: SCOPES,
    state,
  })
  return `${AUTHORIZE_URL}?${params.toString()}`
}

// ---------- Token exchange + refresh (form-urlencoded POST) ----------
async function tokenRequest(body) {
  const { clientId, clientSecret } = getLinkedInConfig() || {}
  if (!clientId || !clientSecret) {
    throw new Error("LinkedIn OAuth setup adhoora hai — env vars missing")
  }
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      ...body,
      client_id: clientId,
      client_secret: clientSecret,
    }).toString(),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(
      data.error_description || data.error || data.message || `LinkedIn OAuth error ${res.status}`,
    )
  }
  return data
}

// Authorization code → access token (60 din) [+ refresh token kabhi-kabhi]
export async function exchangeCodeForTokens({ code }) {
  const data = await tokenRequest({
    grant_type: "authorization_code",
    code: String(code),
    redirect_uri: getRedirectUri(),
  })
  if (!data.access_token) throw new Error("LinkedIn ne access token nahi diya")
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token || "",
    expiresIn: data.expires_in || 60 * 24 * 3600, // 60 din default
    scope: data.scope || "",
  }
}

// Refresh token se naya access token (sirf tab jab app ko refresh token mila ho)
export async function refreshLinkedInToken(refreshToken) {
  const data = await tokenRequest({
    grant_type: "refresh_token",
    refresh_token: String(refreshToken),
  })
  if (!data.access_token) {
    throw new Error("LinkedIn token refresh fail hui — dobara connect karo")
  }
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token || "",
    expiresIn: data.expires_in || 60 * 24 * 3600,
  }
}

// Connected member ki profile — `sub` se member URN banta hai (posting ke liye zaroori)
export async function fetchLinkedInProfile(accessToken) {
  const res = await fetch(USERINFO_URL, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(data.message || data.error_description || `LinkedIn API error ${res.status}`)
  }
  if (!data.sub) throw new Error("LinkedIn profile nahi mili — dobara connect karo")
  return {
    sub: data.sub,
    memberUrn: `urn:li:person:${data.sub}`,
    name: data.name || "",
    email: data.email || "",
  }
}
