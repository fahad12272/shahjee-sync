import express from "express"
import Post from "../models/Post.js"
import { protect } from "../middleware/auth.js"
import { publishPostNow } from "../services/publishNow.js"

const router = express.Router()

router.use(protect)

router.post("/", async (req, res) => {
  try {
    const { title, image, caption, platforms, date, time, status, scheduledAt } = req.body

    if (!title || title.trim().length === 0) {
      return res
        .status(400)
        .json({ success: false, error: "Post title is required" })
    }

    const post = await Post.create({
      title: title.trim(),
      caption: typeof caption === "string" ? caption : "",
      image,
      platforms,
      date,
      time,
      status,
      scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
      publishedAt: status === "Published" ? new Date() : null,
      user: req.user._id,
    })

    // "Post Now" — post ko connected platforms pe TURANT publish karo.
    // (Pehle yahan sirf DB save hota tha — FB/IG pe kuch nahi jata tha,
    //  real posting sirf scheduled posts ke cron mein hoti thi.)
    if (post.status === "Published") {
      try {
        post.publishResults = await publishPostNow(req.user, post)
        await post.save()
        const okCount = (post.publishResults || []).filter((r) => r.success).length
        console.log(
          `⚡ Post Now: "${post.title}" (${post._id}) — platforms OK: ${okCount}/${post.platforms?.length || 0}`,
        )
      } catch (err) {
        // Publish fail ho to bhi post DB mein rahe — error publishResults mein hoga
        console.error("❌ Post Now publish error:", err.message)
      }
    }

    res.status(201).json({
      success: true,
      message: "Post created successfully! 🎉",
      post,
    })
  } catch (error) {
    console.error("❌ POST CREATE ERROR:", error)
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((err) => err.message)
      return res.status(400).json({ success: false, error: messages[0] })
    }
    res.status(500).json({ success: false, error: "Server error — try again" })
  }
})

router.get("/", async (req, res) => {
  try {
    const posts = await Post.find({ user: req.user._id }).sort({
      createdAt: -1,
    })

    res.json({ success: true, count: posts.length, posts })
  } catch (error) {
    console.error("❌ POSTS FETCH ERROR:", error)
    res.status(500).json({ success: false, error: "Server error — try again" })
  }
})

router.put("/:id", async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)

    if (!post) {
      return res.status(404).json({ success: false, error: "Post not found" })
    }

    if (post.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: "Not allowed — this post belongs to another user",
      })
    }

    const updates = [
      "title",
      "caption",
      "image",
      "platforms",
      "date",
      "time",
      "status",
      "scheduledAt",
    ]

    updates.forEach((field) => {
      if (req.body[field] !== undefined) {
        post[field] = req.body[field]
      }
    })

    await post.save()

    res.json({ success: true, message: "Post updated successfully ✅", post })
  } catch (error) {
    console.error("❌ POST UPDATE ERROR:", error)
    res.status(500).json({ success: false, error: "Server error — try again" })
  }
})

router.delete("/:id", async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)

    if (!post) {
      return res.status(404).json({ success: false, error: "Post not found" })
    }

    if (post.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: "Not allowed — this post belongs to another user",
      })
    }

    await post.deleteOne()

    res.json({ success: true, message: "Post deleted successfully 🗑️" })
  } catch (error) {
    console.error("❌ POST DELETE ERROR:", error)
    res.status(500).json({ success: false, error: "Server error — try again" })
  }
})

export default router
