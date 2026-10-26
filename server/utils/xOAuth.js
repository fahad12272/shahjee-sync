import crypto from "node:crypto"

// X OAuth 2.0 Authorization Code + PKCE — "Connect with X" 1-click flow
// User sirf X pe "Authorize" dabata hai — koi developer portal, koi manual token nahi.
// Docs: https://docs.x.com/resources/fundamentals/authentication/oauth-2-0/authorization-code

// Test/mock ke liye override possible — prod mein hamesha api.x.com
const API_BASE = process.env.X_API_BASE || "https://api.x.com"
const AUTHORIZE_URL = "https://x.com/i/oauth2/authorize"
const TOKEN_URL = `${API_BASE}/2/oauth2/token`
const ME_URL = `${API_BASE}/2/users/me`

// tweet.write = posting, users.read = handle lena, offline.access = refresh token
const SCOPES = "tweet.read tweet.write users.read offline.access"

// Callback URL — X developer app mein YEHI register hona chahiye (bilkul same)
export function getRedirectUri() {
  const base = process.env.APP_URL || "http://localhost:5000"
  return `${base.replace(/\/$/, "")}/api/platforms/x/oauth/callback`
}

export function getOAuthConfig() {
  const clientId = process.env.X_OAUTH_CLIENT_ID
  const clientSecret = process.env.X_OAUTH_CLIENT_SECRET
  if (!clientId || !clientSecret) return null
  return { clientId, clientSecret }
}

// PKCE: verifier (secret, cookie mein) + challenge (S256, authorize URL mein)
export function createPkcePair() {
  const verifier = crypto.randomBytes(48).toString("base64url") // 64 chars
  const challenge = crypto
    .createHash("sha256")
    .update(verifier)
    .digest("base64url")
  return { verifier, challenge }
}

export function createState() {
  return crypto.randomBytes(16).toString("hex")
}

export function buildAuthorizeUrl({ clientId, state, codeChallenge }) {
  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    redirect_uri: getRedirectUri(),
    scope: SCOPES,
    state,
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
  })
  return `${AUTHORIZE_URL}?${params.toString()}`
}

// ---------- Signed cookie (state + PKCE verifier + userId carry karta hai) ----------
// Format: <base64url(JSON)>.<HMAC-SHA256> — JWT_SECRET se sign, 10 min valid
const COOKIE_NAME = "x_oauth"
const COOKIE_MAX_AGE_MS = 10 * 60 * 1000

function signKey() {
  return crypto
    .createHash("sha256")
    .update(process.env.JWT_SECRET || "shahjee-sync-local-dev-secret")
    .digest()
}

export function serializeOAuthCookie({ userId, verifier, state }) {
  const payload = Buffer.from(
    JSON.stringify({ userId: String(userId), verifier, state }),
  ).toString("base64url")
  const sig = crypto.createHmac("sha256", signKey()).update(payload).digest("base64url")
  return {
    name: COOKIE_NAME,
    value: `${payload}.${sig}`,
    maxAge: COOKIE_MAX_AGE_MS,
  }
}

export function parseOAuthCookie(cookieHeader) {
  if (!cookieHeader) return null
  const raw = cookieHeader
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${COOKIE_NAME}=`))
  if (!raw) return null

  const value = raw.slice(COOKIE_NAME.length + 1)
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
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"))
    if (!data?.userId || !data?.verifier || !data?.state) return null
    return data
  } catch {
    return null
  }
}

export function clearedOAuthCookie() {
  return { name: COOKIE_NAME, value: "", maxAge: 0 }
}

// ---------- Token exchange + refresh ----------
async function tokenRequest(body) {
  const { clientId, clientSecret } = getOAuthConfig() || {}
  if (!clientId || !clientSecret) {
    throw new Error("OAuth setup adhoora hai")
  }
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams(body).toString(),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(
      data.error_description || data.error || data.title || `X OAuth error ${res.status}`,
    )
  }
  return data
}

// Authorization code ko access/refresh tokens mein badlo (ek hi baar valid hota hai)
export async function exchangeCodeForTokens({ code, codeVerifier }) {
  const data = await tokenRequest({
    grant_type: "authorization_code",
    code,
    redirect_uri: getRedirectUri(),
    code_verifier: codeVerifier,
  })
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token || "",
    expiresIn: data.expires_in || 7200,
    scope: data.scope || "",
  }
}

// Access token 2 ghante mein expire hota hai — refresh token se naya lo.
// IMPORTANT: X refresh tokens single-use hote hain — naya refresh token DB mein save karna zaroori!
export async function refreshX2Token(refreshToken) {
  const data = await tokenRequest({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
    client_id: getOAuthConfig()?.clientId || "",
  })
  if (!data.access_token || !data.refresh_token) {
    throw new Error("X ne refresh token nahi diya — dobara connect karo")
  }
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresIn: data.expires_in || 7200,
  }
}

// Connected account ka @username — token sahi hai ye confirm karne ke liye
export async function fetchX2Me(accessToken) {
  const res = await fetch(ME_URL, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(
      data.detail || data.title || data.errors?.[0]?.message || `X API error ${res.status}`,
    )
  }
  return {
    id: data.data?.id || "",
    username: data.data?.username || "",
    name: data.data?.name || "",
  }
}
