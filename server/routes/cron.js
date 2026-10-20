import express from "express"
import Post from "../models/Post.js"

const router = express.Router()

// GET /api/cron/publish — jinki scheduled time aa gayi hai un posts ko Published karta hai
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

    // Jo Pending posts ka scheduled time aa chuka hai — unhe Published karo
    const duePosts = await Post.find({
      status: "Pending",
      scheduledAt: { $ne: null, $lte: now },
    })

    for (const post of duePosts) {
      post.status = "Published"
      post.publishedAt = now
      await post.save()
      console.log(`📅 Cron: "${post.title}" published (${post._id})`)
    }

    res.json({
      success: true,
      message: `${duePosts.length} post(s) published`,
      published: duePosts.length,
      time: now.toISOString(),
    })
  } catch (error) {
    console.error("❌ CRON ERROR:", error)
    res.status(500).json({ success: false, error: "Server error — try again" })
  }
})

export default router
