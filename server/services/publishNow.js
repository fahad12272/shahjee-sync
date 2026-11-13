// publishNow.js — "Post Now" ka REAL publishing engine.
//
// Pehle Post Now sirf DB mein post ko "Published" mark karta tha — platforms pe
// kuch nahi jata tha (sirf Scheduled posts cron se publish hote the).
// Ab posts.js is helper se post ko TURANT user ke connected platforms pe bhejta hai.
//
// NOTE: cron.js (scheduled posts) ka apna similar switch hai — platform logic dono
// mein same hai. Refactor alag rakha hai taake working cron flow touch na ho.

import { decryptSecret, encryptSecret } from "../utils/secureStore.js"
import { publishToX } from "./xPost.js"
import { publishToTelegram } from "./telegramPost.js"
import { publishToFacebook } from "./fbPost.js"
import { publishToInstagram } from "./igPost.js"
import { publishToThreads } from "./threadsPost.js"
import { publishToLinkedIn } from "./linkedinPost.js"
import {
  publishToTiktok,
  getFreshTiktokToken,
} from "./tiktokPost.js"
import { refreshThreadsToken } from "../utils/metaOAuth.js"
import { refreshLinkedInToken } from "../utils/linkedinOAuth.js"
import { refreshX2Token } from "../utils/xOAuth.js"

// CreatePost ka default placeholder image — real photo nahi hai, skip karte hain
const DEFAULT_POST_IMAGE =
  "https://images.unsplash.com/photo-1615494487949-f5f68968330e?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&q=80&w=160&h=160"

// X OAuth 2.0 token 2 ghante mein expire hota hai — publish se pehle refresh check
// saveUser = optional chained saver (parallel publish mein ek hi user doc pe
// concurrent save() mongoose ParallelSaveError deta hai)
async function getFreshX2Bearer(user, saveUser = null) {
  const xp = user.platforms.x
  const expiresAt = xp.oauth2ExpiresAt
    ? new Date(xp.oauth2ExpiresAt).getTime()
    : 0
  if (expiresAt && expiresAt - Date.now() > 60 * 1000) {
    return decryptSecret(xp.oauth2AccessToken) // abhi fresh hai
  }

  console.log(`🔄 Post Now: X OAuth token refresh (${user.email})`)
  const refreshed = await refreshX2Token(decryptSecret(xp.oauth2RefreshToken))
  xp.oauth2AccessToken = encryptSecret(refreshed.accessToken)
  xp.oauth2RefreshToken = encryptSecret(refreshed.refreshToken)
  xp.oauth2ExpiresAt = new Date(Date.now() + refreshed.expiresIn * 1000)
  xp.authType = "oauth2"
  if (saveUser) await saveUser()
  else await user.save()
  return refreshed.accessToken
}

// Post ko user ke connected platforms pe turant publish karta hai.
// Ek platform fail ho to baaki platforms ka publish nahi rukta.
// Return: results[] — Post.publishResults ka format (cron jaisa hi)
export async function publishPostNow(user, post) {
  const platforms = Array.isArray(post.platforms) ? post.platforms : []
  const text = post.caption || post.title || ""
  const image =
    post.image && post.image !== DEFAULT_POST_IMAGE ? post.image : ""

  // Parallel branches ek hi user doc pe saath-saath save() na karein —
  // mongoose "Can't save() the same doc multiple times in parallel" error
  // deta hai. Isliye saari token-refresh saves EK chain mein jati hain.
  let saveChain = Promise.resolve()
  const saveUser = () => {
    saveChain = saveChain
      .then(() => user.save())
      .catch((err) => console.error("⚠️ User token save fail:", err.message))
    return saveChain
  }

  // TIMEOUT FIX (Vercel 60s limit): pehle platforms EK KE BAAD EK chalte the —
  // FB (~3s) + IG (~15s) + Threads image polling (~30s) + permalink (~8s)
  // mil kar 60s+ ho jate the, Vercel function KO Maar deta tha → Threads
  // publish adhoora + publishResults kabhi save nahi hote the ("hiiiiiiii"
  // wala masla). Ab SAB platforms PARALLEL chalte hain — total time =
  // sab se slow platform ka, unka SUM nahi (~40s worst-case, limit ke andar).
  const results = await Promise.all(
    platforms.map(async (platform) => {
      const result = {
        platform,
        success: false,
        url: "",
        error: "",
        at: new Date(),
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
                bearer: await getFreshX2Bearer(user, saveUser),
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
          const thExpiry = thp.expiresAt ? new Date(thp.expiresAt).getTime() : 0
          if (thExpiry && thExpiry - Date.now() < 7 * 24 * 3600 * 1000) {
            console.log(`🔄 Post Now: Threads token refresh (${user.email})`)
            const refreshed = await refreshThreadsToken(threadsToken)
            threadsToken = refreshed.accessToken
            thp.accessToken = encryptSecret(threadsToken)
            thp.expiresAt = new Date(
              Date.now() + (refreshed.expiresIn || 60 * 24 * 3600) * 1000,
            )
            await saveUser()
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
          const liExpiry = lp.expiresAt ? new Date(lp.expiresAt).getTime() : 0
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
            console.log(`🔄 Post Now: LinkedIn token refresh (${user.email})`)
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
            await saveUser()
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
              "TikTok ke liye video zaroori hai — Create Post pe video upload karo (sirf image TikTok pe nahi jati)",
            )
          }
          // Access token ~24 ghante ka — expiry qareeb ho to refresh (chained save)
          const tkToken = await getFreshTiktokToken(tkp, saveUser)
          const r = await publishToTiktok({
            videoUrl: post.videoUrl,
            title: text,
            username: tkp.username || "",
            creds: {
              accessToken: tkToken,
              privacyLevel: process.env.TIKTOK_PRIVACY_LEVEL || "SELF_ONLY",
            },
          })
          result.success = true
          result.url = r.url
          if (!r.url) {
            // Video TikTok ke paas pohnch gayi, post_id abhi moderation/
            // processing mein hai — URL baad mein TikTok app mein nazar aayegi
            console.log(
              `⏳ Post Now: TikTok video upload ho gayi, post_id pending (publishId: ${r.publishId})`,
            )
          }
        } else {
          throw new Error(`${platform} abhi supported nahi hai`)
        }
      } catch (error) {
        result.error = error.message || "Unknown error"
      }

      return result
    }),
  )

  // Saari chained token saves mukammal hone do (agar hui hon)
  await saveChain.catch(() => {})

  return results
}
