import express from "express"
import Post from "../models/Post.js"
import User from "../models/User.js"
import { decryptSecret } from "../utils/secureStore.js"
import { publishToX } from "../services/xPost.js"
import { publishToTelegram } from "../services/telegramPost.js"

const router = express.Router()

// CreatePost ka default placeholder image — real photo nahi hai, skip karte hain
const DEFAULT_IMAGE =
  "https://images.unsplash.com/photo-1615494487949-f5f68968330e?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&q=80&w=160&h=160"

// GET /api/cron/publish — jinki scheduled time aa gayi hai un posts ko
// Published karta hai + selected platforms pe real posting karta hai (X, Telegram)
//
// Trigger options:
//   1. Vercel Cron (vercel.json mein daily schedule — backup)
//   2. cron-job.org (har 1 min — real-time, Hobby plan pe yahi main mechanism hai)
//
// Security: dono ko header bhejna hoga: Authorization: Bearer <CRON_SECRET>
router.get("/publish", async (req, res) => {
  try {
    const secret = process.env.CRON_SECRET
    const authHeader = req.headers.authorization

    if (!secret) {
      return res.status(500).json({
        success: false,
        error:
          "CRON_SECRET env var set nahi hai — Vercel mein ek random string add karo",
      })
    }

    if (authHeader !== `Bearer ${secret}`) {
      return res.status(401).json({ success: false, error: "Unauthorized" })
    }

    const now = new Date()

    // Jo Pending posts ka scheduled time aa chuka hai — unhe uthao
    const duePosts = await Post.find({
      status: "Pending",
      scheduledAt: { $ne: null, $lte: now },
    })

    // Ek cron run mein same user ki creds baar-baar DB se na leni padein
    const userCache = new Map()
    const getUser = async (userId) => {
      const key = String(userId)
      if (!userCache.has(key)) {
        userCache.set(key, await User.findById(userId))
      }
      return userCache.get(key)
    }

    let platformAttempts = 0

    for (const post of duePosts) {
      post.status = "Published"
      post.publishedAt = now

      const platforms = Array.isArray(post.platforms) ? post.platforms : []
      if (platforms.length > 0) {
        const user = await getUser(post.user)
        const text = post.caption || post.title || ""
        const image = post.image && post.image !== DEFAULT_IMAGE ? post.image : ""

        const results = []
        for (const platform of platforms) {
          const result = {
            platform,
            success: false,
            url: "",
            error: "",
            at: now,
          }
          try {
            if (platform === "x") {
              const xp = user?.platforms?.x
              if (!xp?.accessToken || !xp?.apiKey) {
                throw new Error(
                  "X connected nahi hai — Connected Accounts page pe keys add karo",
                )
              }
              const r = await publishToX({
                text,
                imageUrl: image,
                creds: {
                  apiKey: decryptSecret(xp.apiKey),
                  apiSecret: decryptSecret(xp.apiSecret),
                  accessToken: decryptSecret(xp.accessToken),
                  accessSecret: decryptSecret(xp.accessSecret),
                },
              })
              result.success = true
              result.url = r.url
            } else if (platform === "telegram") {
              const tp = user?.platforms?.telegram
              if (!tp?.botToken || !tp?.chatId) {
                throw new Error(
                  "Telegram connected nahi hai — Connected Accounts page pe bot add karo",
                )
              }
              const r = await publishToTelegram({
                text,
                imageUrl: image,
                creds: {
                  botToken: decryptSecret(tp.botToken),
                  chatId: decryptSecret(tp.chatId),
                },
              })
              result.success = true
              result.url = r.url
            } else {
              throw new Error(`${platform} abhi supported nahi hai`)
            }
          } catch (error) {
            // Ek platform fail ho to baaki platforms ka publish nahi rukta
            result.error = error.message || "Unknown error"
          }
          results.push(result)
          platformAttempts += 1
        }
        post.publishResults = results
      }

      await post.save()
      const okCount = (post.publishResults || []).filter((r) => r.success).length
      console.log(
        `📅 Cron: "${post.title}" published (${post._id}) — platforms OK: ${okCount}/${platforms.length}`,
      )
    }

    res.json({
      success: true,
      message: `${duePosts.length} post(s) published`,
      published: duePosts.length,
      platformAttempts,
      time: now.toISOString(),
    })
  } catch (error) {
    console.error("❌ CRON ERROR:", error)
    res.status(500).json({ success: false, error: "Server error — try again" })
  }
})

export default router
