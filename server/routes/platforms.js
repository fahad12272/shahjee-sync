import express from "express"
import User from "../models/User.js"
import { protect } from "../middleware/auth.js"
import {
  encryptSecret,
  maskSecret,
} from "../utils/secureStore.js"
import { verifyXCredentials } from "../services/xPost.js"
import { verifyTelegram } from "../services/telegramPost.js"
import {
  getOAuthConfig,
  getRedirectUri,
  createPkcePair,
  createState,
  buildAuthorizeUrl,
  serializeOAuthCookie,
  parseOAuthCookie,
  clearedOAuthCookie,
  exchangeCodeForTokens,
  fetchX2Me,
} from "../utils/xOAuth.js"
import {
  getMetaConfig,
  getRedirectUri as getMetaRedirectUri,
  createState as createMetaState,
  buildFacebookAuthorizeUrl,
  buildThreadsAuthorizeUrl,
  serializeStateCookie,
  parseStateCookie,
  clearedStateCookie,
  exchangeFacebookCode,
  exchangeFacebookLongLived,
  fetchUserPages,
  fetchInstagramAccount,
  exchangeThreadsCode,
  exchangeThreadsLongLived,
  fetchThreadsProfile,
} from "../utils/metaOAuth.js"
import {
  getLinkedInConfig,
  getRedirectUri as getLinkedInRedirectUri,
  createState as createLinkedInState,
  buildAuthorizeUrl as buildLinkedInAuthorizeUrl,
  exchangeCodeForTokens as exchangeLinkedInCode,
  fetchLinkedInProfile,
} from "../utils/linkedinOAuth.js"

// Social platform connections — secrets AES-256-GCM encrypted save hote hain
// aur API se kabhi raw return NAHI hote (sirf masked preview).
// X ke do connect tarike: 1-click OAuth 2.0 (default) ya manual keys (fallback).
// Meta family (Facebook/Instagram/Threads) — sab 1-click OAuth, 1 hi Meta app se.
// LinkedIn bhi 1-click OAuth — 100% free.

const router = express.Router()

// Cookie helper — Set-Cookie header serialize karo (cookie-parser ki zaroorat nahi)
function setOAuthCookie(res, cookie) {
  const attrs = [
    `${cookie.name}=${cookie.value}`,
    "Path=/api/platforms",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${cookie.maxAge}`,
  ]
  // Local http pe Secure cookie set nahi hoti — sirf prod (Vercel/https) pe
  if (process.env.VERCEL || process.env.APP_URL?.startsWith("https")) {
    attrs.push("Secure")
  }
  const existing = res.getHeader("Set-Cookie")
  const list = existing ? (Array.isArray(existing) ? existing : [existing]) : []
  list.push(attrs.join("; "))
  res.setHeader("Set-Cookie", list)
}

// GET /api/platforms — sab platforms ka connection status (masked)
router.get("/", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
    const p = user.platforms || {}

    res.json({
      success: true,
      platforms: {
        x: {
          connected: Boolean(
            (p.x?.accessToken && p.x?.apiKey) ||
              (p.x?.oauth2AccessToken && p.x?.oauth2RefreshToken),
          ),
          authType: p.x?.authType || "keys",
          handle: p.x?.handle || "",
          connectedAt: p.x?.connectedAt || null,
          masked: {
            apiKey: maskSecret(p.x?.apiKey),
            accessToken: maskSecret(p.x?.accessToken),
            oauth2: maskSecret(p.x?.oauth2AccessToken),
          },
        },
        telegram: {
          connected: Boolean(p.telegram?.botToken && p.telegram?.chatId),
          chatTitle: p.telegram?.chatTitle || "",
          connectedAt: p.telegram?.connectedAt || null,
          masked: { botToken: maskSecret(p.telegram?.botToken) },
        },
        facebook: {
          connected: Boolean(p.facebook?.pageId && p.facebook?.pageToken),
          pageName: p.facebook?.pageName || "",
          connectedAt: p.facebook?.connectedAt || null,
          masked: { pageToken: maskSecret(p.facebook?.pageToken) },
        },
        instagram: {
          connected: Boolean(p.instagram?.igUserId && p.instagram?.pageToken),
          username: p.instagram?.username || "",
          connectedAt: p.instagram?.connectedAt || null,
          masked: { pageToken: maskSecret(p.instagram?.pageToken) },
        },
        threads: {
          connected: Boolean(p.threads?.userId && p.threads?.accessToken),
          username: p.threads?.username || "",
          connectedAt: p.threads?.connectedAt || null,
          masked: { accessToken: maskSecret(p.threads?.accessToken) },
        },
        linkedin: {
          connected: Boolean(p.linkedin?.memberUrn && p.linkedin?.accessToken),
          name: p.linkedin?.name || "",
          connectedAt: p.linkedin?.connectedAt || null,
          expiresAt: p.linkedin?.expiresAt || null,
          masked: { accessToken: maskSecret(p.linkedin?.accessToken) },
        },
      },
    })
  } catch {
    res.status(500).json({ success: false, error: "Server error — try again" })
  }
})

// ---------- X OAuth 2.0 (1-click connect) ----------

// POST /api/platforms/x/oauth/start — authorize URL banao + state cookie set karo.
// Frontend isko Authorization header ke saath call karta hai, phir browser ko
// authorizeUrl pe redirect karta hai. (JWT URL mein nahi jaata — safe.)
router.post("/x/oauth/start", protect, async (req, res) => {
  try {
    const config = getOAuthConfig()
    if (!config) {
      return res.status(400).json({
        success: false,
        error:
          "OAuth setup nahi hua — X_OAUTH_CLIENT_ID/X_OAUTH_CLIENT_SECRET env vars missing. Filhaal keys wala method use karo.",
      })
    }

    const { verifier, challenge } = createPkcePair()
    const state = createState()

    setOAuthCookie(
      res,
      serializeOAuthCookie({ userId: req.user._id, verifier, state }),
    )

    res.json({
      success: true,
      authorizeUrl: buildAuthorizeUrl({
        clientId: config.clientId,
        state,
        codeChallenge: challenge,
      }),
      redirectUri: getRedirectUri(),
    })
  } catch {
    res.status(500).json({ success: false, error: "Server error — try again" })
  }
})

// GET /api/platforms/x/oauth/callback — X yahan user ko wapas bhejta hai.
// Cookie se userId + PKCE verifier milta hai (koi JWT header nahi hota — browser
// navigation hai). Success/fail dono cases frontend pe redirect karte hain.
router.get("/x/oauth/callback", async (req, res) => {
  const back = (status, reason) => {
    const params = new URLSearchParams({ x: status })
    if (reason) params.set("reason", reason)
    res.redirect(`/?${params.toString()}`)
  }

  try {
    const { code, state, error, error_description } = req.query

    if (error) {
      return back("failed", error_description || error || "X ne authorize nahi kiya")
    }
    if (!code || !state) {
      return back("failed", "X se code nahi mila — dobara try karo")
    }

    const session = parseOAuthCookie(req.headers.cookie)
    if (!session) {
      return back("failed", "Session expire ho gaya — dobara connect karo")
    }
    if (session.state !== state) {
      return back("failed", "Security check fail — dobara try karo")
    }

    const tokens = await exchangeCodeForTokens({
      code: String(code),
      codeVerifier: session.verifier,
    })
    const me = await fetchX2Me(tokens.accessToken)

    const user = await User.findById(session.userId)
    if (!user) {
      return back("failed", "Account nahi mila — login karke try karo")
    }

    user.platforms = user.platforms || {}
    user.platforms.x = {
      authType: "oauth2",
      oauth2AccessToken: encryptSecret(tokens.accessToken),
      oauth2RefreshToken: encryptSecret(tokens.refreshToken),
      oauth2ExpiresAt: new Date(Date.now() + tokens.expiresIn * 1000),
      handle: "@" + me.username,
      connectedAt: new Date(),
    }
    await user.save()

    setOAuthCookie(res, clearedOAuthCookie())
    return back("connected")
  } catch (err) {
    console.error("❌ X OAuth callback error:", err.message)
    return back("failed", err.message || "X connection fail hui")
  }
})

// ---------- Meta family OAuth (Facebook / Instagram / Threads) ----------

// Shared start handler — facebook aur instagram dono isi se chalte hain
async function startMetaOAuth(req, res, target) {
  try {
    const config = getMetaConfig()
    if (!config) {
      return res.status(400).json({
        success: false,
        error:
          "OAuth setup nahi hua — META_APP_ID/META_APP_SECRET env vars missing (Vercel mein add karo).",
      })
    }

    const state = createMetaState()
    setOAuthCookie(
      res,
      serializeStateCookie("meta_oauth", {
        userId: String(req.user._id),
        state,
        target,
      }),
    )

    res.json({
      success: true,
authorizeUrl: buildFacebookAuthorizeUrl({ state, platform: "facebook" }),
      redirectUri: getMetaRedirectUri(target),
    })
  } catch {
    res.status(500).json({ success: false, error: "Server error — try again" })
  }
}

// POST /api/platforms/facebook/oauth/start
router.post("/facebook/oauth/start", protect, (req, res) =>
  startMetaOAuth(req, res, "facebook"),
)

// POST /api/platforms/instagram/oauth/start — same Meta flow, target alag
router.post("/instagram/oauth/start", protect, (req, res) =>
  startMetaOAuth(req, res, "instagram"),
)

// GET /api/platforms/facebook/oauth/callback — Facebook yahan user wapas bhejta hai.
// Cookie ke target se decide hota hai ke facebook save karna hai ya instagram.
router.get("/facebook/oauth/callback", async (req, res) => {
  const back = (key, status, reason) => {
    const params = new URLSearchParams({ [key]: status })
    if (reason) params.set("reason", reason)
    res.redirect(`/?${params.toString()}`)
  }

  try {
    const { code, state, error, error_description } = req.query

    if (error) {
      return back("fb", "failed", error_description || error || "Facebook ne authorize nahi kiya")
    }
    if (!code || !state) {
      return back("fb", "failed", "Facebook se code nahi mila — dobara try karo")
    }

    const session = parseStateCookie(req.headers.cookie, "meta_oauth")
    if (!session) {
      return back("fb", "failed", "Session expire ho gaya — dobara connect karo")
    }
    if (session.state !== state) {
      return back("fb", "failed", "Security check fail — dobara try karo")
    }
    const target = session.target === "instagram" ? "instagram" : "facebook"

    // code → short-lived → long-lived user token → pages
    const shortToken = await exchangeFacebookCode({
      code: String(code),
      platform: "facebook",
    })
    const userToken = await exchangeFacebookLongLived(shortToken)
    const pages = await fetchUserPages(userToken)
    if (pages.length === 0) {
      return back(
        target === "instagram" ? "ig" : "fb",
        "failed",
        "Koi Facebook Page nahi mila — OAuth step mein apna Page select karo",
      )
    }

    const user = await User.findById(session.userId)
    if (!user) {
      return back(target === "instagram" ? "ig" : "fb", "failed", "Account nahi mila — login karke try karo")
    }
    user.platforms = user.platforms || {}

    if (target === "facebook") {
      const page = pages[0] // OAuth mein jo page(s) select huye, pehla connect hota hai
      user.platforms.facebook = {
        pageId: page.id,
        pageToken: encryptSecret(page.access_token),
        pageName: page.name || "Page",
        connectedAt: new Date(),
      }
      await user.save()
      setOAuthCookie(res, clearedStateCookie("meta_oauth"))
      return back("fb", "connected")
    }

    // Instagram — pehla Page jiske saath IG Business/Creator account linked hai
    let chosenPage = null
    let ig = null
    for (const page of pages) {
      const found = await fetchInstagramAccount(page.id, page.access_token).catch(
        () => null,
      )
      if (found?.id) {
        chosenPage = page
        ig = found
        break
      }
    }

    if (!ig) {
      return back(
        "ig",
        "failed",
        "Instagram Business/Creator account kisi Page se linked nahi mila — pehle IG account ko FB Page se link karo",
      )
    }
    user.platforms.instagram = {
      igUserId: ig.id,
      pageId: chosenPage.id,
      pageToken: encryptSecret(chosenPage.access_token),
      username: ig.username || "",
      connectedAt: new Date(),
    }
    await user.save()
    setOAuthCookie(res, clearedStateCookie("meta_oauth"))
    return back("ig", "connected")
  } catch (err) {
    console.error("❌ Meta OAuth callback error:", err.message)
    return back("fb", "failed", err.message || "Meta connection fail hui")
  }
})

// POST /api/platforms/threads/oauth/start
router.post("/threads/oauth/start", protect, async (req, res) => {
  try {
    const config = getMetaConfig()
    if (!config) {
      return res.status(400).json({
        success: false,
        error:
          "OAuth setup nahi hua — META_APP_ID/META_APP_SECRET env vars missing (Vercel mein add karo).",
      })
    }

    const state = createMetaState()
    setOAuthCookie(
      res,
      serializeStateCookie("threads_oauth", {
        userId: String(req.user._id),
        state,
      }),
    )

    res.json({
      success: true,
      authorizeUrl: buildThreadsAuthorizeUrl({ state }),
      redirectUri: getMetaRedirectUri("threads"),
    })
  } catch {
    res.status(500).json({ success: false, error: "Server error — try again" })
  }
})

// GET /api/platforms/threads/oauth/callback
router.get("/threads/oauth/callback", async (req, res) => {
  const back = (status, reason) => {
    const params = new URLSearchParams({ threads: status })
    if (reason) params.set("reason", reason)
    res.redirect(`/?${params.toString()}`)
  }

  try {
    const { code, state, error, error_description } = req.query

    if (error) {
      return back("failed", error_description || error || "Threads ne authorize nahi kiya")
    }
    if (!code || !state) {
      return back("failed", "Threads se code nahi mila — dobara try karo")
    }

    const session = parseStateCookie(req.headers.cookie, "threads_oauth")
    if (!session) {
      return back("failed", "Session expire ho gaya — dobara connect karo")
    }
    if (session.state !== state) {
      return back("failed", "Security check fail — dobara try karo")
    }

    const shortToken = await exchangeThreadsCode({ code: String(code) })
    const long = await exchangeThreadsLongLived(shortToken)
    const profile = await fetchThreadsProfile(long.access_token)

    const user = await User.findById(session.userId)
    if (!user) {
      return back("failed", "Account nahi mila — login karke try karo")
    }
    user.platforms = user.platforms || {}
    user.platforms.threads = {
      userId: profile.id,
      accessToken: encryptSecret(long.access_token),
      username: profile.username || "",
      expiresAt: new Date(
        Date.now() + (long.expires_in || 60 * 24 * 3600) * 1000,
      ),
      connectedAt: new Date(),
    }
    await user.save()

    setOAuthCookie(res, clearedStateCookie("threads_oauth"))
    return back("connected")
  } catch (err) {
    console.error("❌ Threads OAuth callback error:", err.message)
    return back("failed", err.message || "Threads connection fail hui")
  }
})

// POST /api/platforms/linkedin/oauth/start — LinkedIn authorize URL banao + state cookie
router.post("/linkedin/oauth/start", protect, async (req, res) => {
  try {
    const config = getLinkedInConfig()
    if (!config) {
      return res.status(400).json({
        success: false,
        error:
          "OAuth setup nahi hua — LINKEDIN_CLIENT_ID/LINKEDIN_CLIENT_SECRET env vars missing (Vercel mein add karo).",
      })
    }

    const state = createLinkedInState()
    setOAuthCookie(
      res,
      serializeStateCookie("linkedin_oauth", {
        userId: String(req.user._id),
        state,
      }),
    )

    res.json({
      success: true,
      authorizeUrl: buildLinkedInAuthorizeUrl({
        clientId: config.clientId,
        state,
      }),
      redirectUri: getLinkedInRedirectUri(),
    })
  } catch {
    res.status(500).json({ success: false, error: "Server error — try again" })
  }
})

// GET /api/platforms/linkedin/oauth/callback — LinkedIn yahan user wapas bhejta hai
router.get("/linkedin/oauth/callback", async (req, res) => {
  const back = (status, reason) => {
    const params = new URLSearchParams({ li: status })
    if (reason) params.set("reason", reason)
    res.redirect(`/?${params.toString()}`)
  }

  try {
    const { code, state, error, error_description } = req.query

    if (error) {
      return back("failed", error_description || error || "LinkedIn ne authorize nahi kiya")
    }
    if (!code || !state) {
      return back("failed", "LinkedIn se code nahi mila — dobara try karo")
    }

    const session = parseStateCookie(req.headers.cookie, "linkedin_oauth")
    if (!session) {
      return back("failed", "Session expire ho gaya — dobara connect karo")
    }
    if (session.state !== state) {
      return back("failed", "Security check fail — dobara try karo")
    }

    const tokens = await exchangeLinkedInCode({ code: String(code) })
    const profile = await fetchLinkedInProfile(tokens.accessToken)

    const user = await User.findById(session.userId)
    if (!user) {
      return back("failed", "Account nahi mila — login karke try karo")
    }
    user.platforms = user.platforms || {}
    user.platforms.linkedin = {
      memberUrn: profile.memberUrn,
      accessToken: encryptSecret(tokens.accessToken),
      refreshToken: tokens.refreshToken ? encryptSecret(tokens.refreshToken) : "",
      expiresAt: new Date(Date.now() + tokens.expiresIn * 1000),
      name: profile.name,
      connectedAt: new Date(),
    }
    await user.save()

    setOAuthCookie(res, clearedStateCookie("linkedin_oauth"))
    return back("connected")
  } catch (err) {
    console.error("❌ LinkedIn OAuth callback error:", err.message)
    return back("failed", err.message || "LinkedIn connection fail hui")
  }
})

// PUT /api/platforms/x — manual keys fallback { apiKey, apiSecret, accessToken, accessSecret }
router.put("/x", protect, async (req, res) => {
  try {
    const { apiKey, apiSecret, accessToken, accessSecret } = req.body
    if (!apiKey || !apiSecret || !accessToken || !accessSecret) {
      return res.status(400).json({
        success: false,
        error:
          "Charo fields zaroori hain — API Key, API Secret, Access Token, Access Secret",
      })
    }

    const creds = {
      apiKey: String(apiKey).trim(),
      apiSecret: String(apiSecret).trim(),
      accessToken: String(accessToken).trim(),
      accessSecret: String(accessSecret).trim(),
    }

    // Live test — galat keys ho to yahin fail hoga (save nahi hoga)
    const profile = await verifyXCredentials(creds)

    const user = await User.findById(req.user._id)
    user.platforms = user.platforms || {}
    user.platforms.x = {
      authType: "keys",
      apiKey: encryptSecret(creds.apiKey),
      apiSecret: encryptSecret(creds.apiSecret),
      accessToken: encryptSecret(creds.accessToken),
      accessSecret: encryptSecret(creds.accessSecret),
      handle: "@" + profile.username,
      connectedAt: new Date(),
    }
    await user.save()

    res.json({
      success: true,
      message: `X connected (@${profile.username}) — ab scheduled posts tweet hongi!`,
      handle: "@" + profile.username,
    })
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message || "X connection fail hui — keys dobara check karo",
    })
  }
})

// PUT /api/platforms/telegram — { botToken, chatId }
router.put("/telegram", protect, async (req, res) => {
  try {
    const { botToken, chatId } = req.body
    if (!botToken || !chatId) {
      return res.status(400).json({
        success: false,
        error: "Bot Token aur Chat ID dono zaroori hain",
      })
    }

    const creds = {
      botToken: String(botToken).trim(),
      chatId: String(chatId).trim(),
    }

    // Live test — test message bhejta hai (bot admin na ho to yahin fail hoga)
    const info = await verifyTelegram(creds)

    const user = await User.findById(req.user._id)
    user.platforms = user.platforms || {}
    user.platforms.telegram = {
      botToken: encryptSecret(creds.botToken),
      chatId: encryptSecret(creds.chatId),
      chatTitle: info.chatTitle,
      connectedAt: new Date(),
    }
    await user.save()

    res.json({
      success: true,
      message: `Telegram connected (${info.chatTitle}) — test message bhej diya!`,
      chatTitle: info.chatTitle,
    })
  } catch (error) {
    res.status(400).json({
      success: false,
      error:
        error.message ||
        "Telegram connection fail hui — token/chat_id check karo",
    })
  }
})

// DELETE /api/platforms/:platform — disconnect
const DISCONNECTABLE = ["x", "telegram", "facebook", "instagram", "threads", "linkedin"]

router.delete("/:platform", protect, async (req, res) => {
  try {
    const { platform } = req.params
    if (!DISCONNECTABLE.includes(platform)) {
      return res
        .status(400)
        .json({ success: false, error: "Unknown platform" })
    }

    const user = await User.findById(req.user._id)
    const p = user.platforms?.[platform]
    const hasConnection = Boolean(
      p?.botToken ||
        p?.apiKey ||
        p?.oauth2AccessToken ||
        p?.pageToken ||
        (p?.userId && p?.accessToken) ||
        (p?.memberUrn && p?.accessToken),
    )
    if (!hasConnection) {
      return res
        .status(400)
        .json({ success: false, error: "Ye platform pehle se disconnected hai" })
    }

    user.platforms[platform] = { connectedAt: null } // defaults baaki fields bhar dete hain
    await user.save()

    res.json({ success: true, message: "Platform disconnect ho gaya" })
  } catch {
    res.status(500).json({ success: false, error: "Server error — try again" })
  }
})

export default router
