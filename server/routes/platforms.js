import express from "express"
import User from "../models/User.js"
import { protect } from "../middleware/auth.js"
import {
  encryptSecret,
  maskSecret,
} from "../utils/secureStore.js"
import { verifyXCredentials } from "../services/xPost.js"
import { verifyTelegram } from "../services/telegramPost.js"

// Social platform connections — secrets AES-256-GCM encrypted save hote hain
// aur API se kabhi raw return NAHI hote (sirf masked preview).

const router = express.Router()

// GET /api/platforms — sab platforms ka connection status (masked)
router.get("/", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
    const p = user.platforms || {}

    res.json({
      success: true,
      platforms: {
        x: {
          connected: Boolean(p.x?.accessToken && p.x?.apiKey),
          handle: p.x?.handle || "",
          connectedAt: p.x?.connectedAt || null,
          masked: {
            apiKey: maskSecret(p.x?.apiKey),
            accessToken: maskSecret(p.x?.accessToken),
          },
        },
        telegram: {
          connected: Boolean(p.telegram?.botToken && p.telegram?.chatId),
          chatTitle: p.telegram?.chatTitle || "",
          connectedAt: p.telegram?.connectedAt || null,
          masked: { botToken: maskSecret(p.telegram?.botToken) },
        },
      },
    })
  } catch {
    res.status(500).json({ success: false, error: "Server error — try again" })
  }
})

// PUT /api/platforms/x — { apiKey, apiSecret, accessToken, accessSecret }
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
router.delete("/:platform", protect, async (req, res) => {
  try {
    const { platform } = req.params
    if (!["x", "telegram"].includes(platform)) {
      return res
        .status(400)
        .json({ success: false, error: "Unknown platform" })
    }

    const user = await User.findById(req.user._id)
    if (!user.platforms?.[platform]?.botToken && !user.platforms?.[platform]?.apiKey) {
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
