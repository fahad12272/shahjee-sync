import express from "express"
import jwt from "jsonwebtoken"
import User from "../models/User.js"
import { getFreshTiktokToken } from "../services/tiktokPost.js"

// TikTok publish status checker — debug/diagnostic tool.
//
// Masla: publish "Published" dikhata hai magar video TikTok app mein nazar
// nahi aati. TikTok server pe video ka ASLI status sirf status/fetch
// endpoint se pata chalta hai (PROCESSING / SEND_TO_USER_INBOX / FAILED).
// Vercel function 60s ke andar nikal jata hai isliye wahan poori kahani
// nahi mil sakti — ye endpoint publishId ke saath BAAD MEIN bhi check
// kar sakta hai (kitna bhi waqt guzar jaye).
//
// Use:
//   GET /api/tiktok-status?publishId=7xxxxxxxxxxxxx
//   Header: Authorization: Bearer <login token>
//   (Diagnostic convenience: &token=<login token> query mein bhi chal jata hai
//    taake browser se seedha URL khol kar test ho sake.)
//
// publishId kahan se milega? Vercel Runtime Logs mein ye line:
//   ✅ TikTok publish khatam — mode: draft | publishId: mila | ...
//   ⏳ Post Now: TikTok video upload ho gayi, post_id pending (publishId: ...)

const router = express.Router()

const STATUS_URL = "https://open.tiktokapis.com/v2/post/publish/status/fetch/"

router.get("/", async (req, res) => {
  try {
    // Token: pehle Authorization header (spa ka normal tareeqa), warna
    // diagnostic ke liye ?token= query param
    let token = ""
    const authHeader = req.headers.authorization
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1]
    }
    if (!token && req.query.token) {
      token = String(req.query.token)
    }
    if (!token) {
      return res
        .status(401)
        .json({ success: false, error: "Token missing — login token chahiye" })
    }

    let userId
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET)
      userId = decoded.userId
    } catch {
      return res.status(401).json({
        success: false,
        error: "Token galat ya expire — app mein login karke naya token lo",
      })
    }

    const user = await User.findById(userId).select("-password")
    if (!user) {
      return res
        .status(401)
        .json({ success: false, error: "User nahi mila" })
    }

    const tkp = user?.platforms?.tiktok
    if (!tkp?.openId || !tkp?.accessToken) {
      return res.status(400).json({
        success: false,
        error:
          "TikTok connected nahi hai — Connected Accounts page pe TikTok connect karo",
      })
    }

    const publishId = String(req.query.publishId || "").trim()
    if (!publishId) {
      return res.status(400).json({
        success: false,
        error:
          "publishId zaroori hai — Vercel Runtime Logs se 'publishId' wali line copy karo",
      })
    }

    // Token expire qareeb ho to refresh (tiktokPost.js ka shared helper)
    const accessToken = await getFreshTiktokToken(tkp, () => user.save())

    const ttRes = await fetch(STATUS_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json; charset=UTF-8",
      },
      body: JSON.stringify({ publish_id: publishId }),
    })
    const ttJson = await ttRes.json().catch(() => ({}))

    console.log(
      `🔍 TikTok status check (${publishId}) — HTTP ${ttRes.status}: ${JSON.stringify(ttJson)}`,
    )

    // Insani jawab — status ke hisaab se agla qadam batao
    const status = ttJson?.data?.status || ""
    let hint = "TikTok ne status nahi diya — error field dekho"
    if (status === "SEND_TO_USER_INBOX") {
      hint =
        "Video TikTok Inbox mein POHNCH GAYI — TikTok app kholo, Inbox mein 'uploaded' notification dekho, wahan se post karo"
    } else if (status === "FAILED") {
      hint =
        "Video TikTok pe FAIL ho gayi — fail_reason dekho (neeche tiktok.data.fail_reason)"
    } else if (status) {
      hint = `TikTok abhi process kar raha hai (${status}) — 2-3 minute baad ye URL dobara kholo`
    }

    res.json({
      success: true,
      publishId,
      httpStatus: ttRes.status,
      tiktok: ttJson,
      hint,
    })
  } catch (err) {
    console.error("❌ TikTok status check error:", err.message)
    res.status(500).json({ success: false, error: err.message || "Server error" })
  }
})

export default router
