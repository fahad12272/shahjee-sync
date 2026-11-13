import express from "express"
import Post from "../models/Post.js"
import User from "../models/User.js"
import { decryptSecret, encryptSecret } from "../utils/secureStore.js"
import { publishToX } from "../services/xPost.js"
import { refreshX2Token } from "../utils/xOAuth.js"
import { publishToTelegram } from "../services/telegramPost.js"
import { publishToFacebook } from "../services/fbPost.js"
import { publishToInstagram } from "../services/igPost.js"
import { publishToThreads } from "../services/threadsPost.js"
import { publishToLinkedIn } from "../services/linkedinPost.js"
import {
  publishToTiktok,
  getFreshTiktokToken,
} from "../services/tiktokPost.js"
import { refreshThreadsToken } from "../utils/metaOAuth.js"
import { refreshLinkedInToken } from "../utils/linkedinOAuth.js"

const router = express.Router()

// CreatePost ka default placeholder image — real photo nahi hai, skip karte hain
const DEFAULT_IMAGE =
  "https://images.unsplash.com/photo-1615494487949-f5f68968330e?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&q=80&w=160&h=160"

// OAuth 2.0 access token 2 ghante mein expire hota hai — publish se pehle
// expiry check karke zaroorat ho to refresh karo (naya refresh token bhi save hota hai)
async function getFreshX2Bearer(user) {
  const xp = user.platforms.x
  const expiresAt = xp.oauth2ExpiresAt
    ? new Date(xp.oauth2ExpiresAt).getTime()
    : 0
  if (expiresAt && expiresAt - Date.now() > 60 * 1000) {
    return decryptSecret(xp.oauth2AccessToken) // abhi fresh hai
  }

  console.log(`🔄 Cron: X OAuth token refresh (${user.email})`)
  const refreshed = await refreshX2Token(decryptSecret(xp.oauth2RefreshToken))
  xp.oauth2AccessToken = encryptSecret(refreshed.accessToken)
  xp.oauth2RefreshToken = encryptSecret(refreshed.refreshToken)
  xp.oauth2ExpiresAt = new Date(Date.now() + refreshed.expiresIn * 1000)
  xp.authType = "oauth2"
  await user.save()
  return refreshed.accessToken
}

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
      const platforms = Array.isArray(post.platforms) ? post.platforms : []
      if (platforms.length > 0) {
        const user = await getUser(post.user)
        const text = post.caption || post.title || ""
        const image =
          post.image && post.image !== DEFAULT_IMAGE ? post.image : ""

        // DUPLICATE FIX: agar pichla cron run 60s timeout mein mar gaya tha aur
        // kuch platforms pe publish ho chuki thi (publishResults mein success),
        // to un platforms ko DOBARA publish NAHI karte — warna FB/IG pe
        // duplicate post chali jati thi. Sirf bache hue platforms chalte hain.
        const alreadySuccess = new Set(
          (Array.isArray(post.publishResults) ? post.publishResults : [])
            .filter((r) => r && r.success)
            .map((r) => r.platform),
        )
        const results = []
        for (const platform of platforms) {
          if (alreadySuccess.has(platform)) {
            // Pehle se publish ho chuka — wahi result rakho, skip karo
            const done = (post.publishResults || []).find(
              (r) => r.success && r.platform === platform,
            )
            if (done) {
              results.push({
                platform: done.platform,
                success: true,
                url: done.url || "",
                error: "",
                at: done.at || now,
              })
            }
            continue
          }
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
              const isOAuth2 = Boolean(
                xp?.oauth2AccessToken && xp?.oauth2RefreshToken,
              )
              const hasKeys = Boolean(xp?.accessToken && xp?.apiKey)

              if (!isOAuth2 && !hasKeys) {
                throw new Error(
                  "X connected nahi hai — Connected Accounts page pe connect karo",
                )
              }

              const r = isOAuth2
                ? await publishToX({
                    text,
                    imageUrl: image,
                    bearer: await getFreshX2Bearer(user),
                  })
                : await publishToX({
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
            } else if (platform === "facebook") {
              const fp = user?.platforms?.facebook
              if (!fp?.pageId || !fp?.pageToken) {
                throw new Error(
                  "Facebook connected nahi hai — Connected Accounts page pe connect karo",
                )
              }
              const r = await publishToFacebook({
                text,
                imageUrl: image,
                creds: {
                  pageId: fp.pageId,
                  pageToken: decryptSecret(fp.pageToken),
                },
              })
              result.success = true
              result.url = r.url
            } else if (platform === "instagram") {
              const ip = user?.platforms?.instagram
              if (!ip?.igUserId || !ip?.pageToken) {
                throw new Error(
                  "Instagram connected nahi hai — Connected Accounts page pe connect karo",
                )
              }
              const r = await publishToInstagram({
                text,
                imageUrl: image,
                creds: {
                  igUserId: ip.igUserId,
                  pageToken: decryptSecret(ip.pageToken),
                },
              })
              result.success = true
              result.url = r.url
            } else if (platform === "threads") {
              const thp = user?.platforms?.threads
              if (!thp?.userId || !thp?.accessToken) {
                throw new Error(
                  "Threads connected nahi hai — Connected Accounts page pe connect karo",
                )
              }
              // Long-lived token ~60 din ka — expiry ke 7 din andar ho to pehle refresh
              let threadsToken = decryptSecret(thp.accessToken)
              const thExpiry = thp.expiresAt
                ? new Date(thp.expiresAt).getTime()
                : 0
              if (thExpiry && thExpiry - Date.now() < 7 * 24 * 3600 * 1000) {
                console.log(`🔄 Cron: Threads token refresh (${user.email})`)
                const refreshed = await refreshThreadsToken(threadsToken)
                threadsToken = refreshed.accessToken
                thp.accessToken = encryptSecret(threadsToken)
                thp.expiresAt = new Date(
                  Date.now() + (refreshed.expiresIn || 60 * 24 * 3600) * 1000,
                )
                await user.save()
              }
              const r = await publishToThreads({
                text,
                imageUrl: image,
                creds: { userId: thp.userId, accessToken: threadsToken },
              })
              result.success = true
              result.url = r.url
            } else if (platform === "linkedin") {
              const lp = user?.platforms?.linkedin
              if (!lp?.memberUrn || !lp?.accessToken) {
                throw new Error(
                  "LinkedIn connected nahi hai — Connected Accounts page pe connect karo",
                )
              }
              let liToken = decryptSecret(lp.accessToken)
              const liExpiry = lp.expiresAt
                ? new Date(lp.expiresAt).getTime()
                : 0
              const hasLiRefresh = Boolean(lp.refreshToken)

              if (liExpiry && liExpiry <= Date.now() && !hasLiRefresh) {
                throw new Error(
                  "LinkedIn token expire ho gaya (60 din) — Connected Accounts pe dobara connect karo",
                )
              }
              // Expiry ke 24 ghante andar ho to pehle refresh karo
              if (
                liExpiry &&
                liExpiry - Date.now() < 24 * 3600 * 1000 &&
                hasLiRefresh
              ) {
                console.log(`🔄 Cron: LinkedIn token refresh (${user.email})`)
                const refreshed = await refreshLinkedInToken(
                  decryptSecret(lp.refreshToken),
                )
                liToken = refreshed.accessToken
                lp.accessToken = encryptSecret(liToken)
                if (refreshed.refreshToken) {
                  lp.refreshToken = encryptSecret(refreshed.refreshToken)
                }
                lp.expiresAt = new Date(
                  Date.now() + (refreshed.expiresIn || 60 * 24 * 3600) * 1000,
                )
                await user.save()
              }

              const r = await publishToLinkedIn({
                text,
                imageUrl: image,
                creds: { memberUrn: lp.memberUrn, accessToken: liToken },
              })
              result.success = true
              result.url = r.url
            } else if (platform === "tiktok") {
              const tkp = user?.platforms?.tiktok
              if (!tkp?.openId || !tkp?.accessToken) {
                throw new Error(
                  "TikTok connected nahi hai — Connected Accounts page pe connect karo",
                )
              }
              if (!post.videoUrl) {
                throw new Error(
                  "TikTok ke liye video zaroori hai — post banate waqt video upload karo",
                )
              }
              // Access token ~24 ghante ka — expiry qareeb ho to pehle refresh
              const tkExpiryMs = tkp.expiresAt
                ? new Date(tkp.expiresAt).getTime()
                : 0
              const tkNeedsRefresh =
                !tkExpiryMs || tkExpiryMs - Date.now() <= 2 * 3600 * 1000
              const tkToken = await getFreshTiktokToken(tkp)
              if (tkNeedsRefresh) {
                // naya token DB mein bhi save (agla cron run reuse kare)
                await user.save()
              }
              const r = await publishToTiktok({
                videoUrl: post.videoUrl,
                title: text,
                username: tkp.username || "",
                creds: {
                  accessToken: tkToken,
                  privacyLevel:
                    process.env.TIKTOK_PRIVACY_LEVEL || "SELF_ONLY",
                },
              })
              result.success = true
              result.url = r.url
              if (!r.url) {
                console.log(
                  `⏳ Cron: TikTok video upload ho gayi, post_id pending (publishId: ${r.publishId})`,
                )
              }
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

      // FIX: pehle bina results dekhe "Published" mark hota tha — sab platforms
      // fail hone par bhi post Published dikh rahi thi (user confusion).
      // Ab: kam az kam 1 platform success ho to Published, warna Failed.
      const okCount = (post.publishResults || []).filter(
        (r) => r.success,
      ).length
      if (platforms.length === 0 || okCount > 0) {
        post.status = "Published"
        post.publishedAt = now
      } else {
        post.status = "Failed"
      }

      await post.save()
      console.log(
        `📅 Cron: "${post.title}" (${post._id}) — status: ${post.status}, platforms OK: ${okCount}/${platforms.length}`,
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
