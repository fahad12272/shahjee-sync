const express = require("express")
const Post = require("../models/Post")
const { protect } = require("../middleware/auth")

const router = express.Router()

// Ye 1 line pura router PROTECT kar deti hai —
// ab har posts API ke liye token ZAROORI hai!
router.use(protect)

// @route   POST /api/posts
// @desc    Nayi post banao (logged-in user ki)
router.post("/", async (req, res) => {
  try {
    const { title, image, platforms, date, time, status } = req.body

    if (!title || title.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: "Post title is required",
      })
    }

    const post = await Post.create({
      title: title.trim(),
      image,
      platforms,
      date,
      time,
      status,
      user: req.user._id, // 👈 token se mila — user khud se nahi bhej sakta kisi aur ka ID!
    })

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

// @route   GET /api/posts
// @desc    Logged-in user ki SARI posts (sirf uski!)
router.get("/", async (req, res) => {
  try {
    const posts = await Post.find({ user: req.user._id }).sort({ createdAt: -1 })

    res.json({
      success: true,
      count: posts.length,
      posts,
    })
  } catch (error) {
    console.error("❌ POSTS FETCH ERROR:", error)
    res.status(500).json({ success: false, error: "Server error — try again" })
  }
})

// @route   PUT /api/posts/:id
// @desc    Post update karo (title, date, time, status — jo bhi bhejo)
router.put("/:id", async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)

    if (!post) {
      return res.status(404).json({ success: false, error: "Post not found" })
    }

    // OWNERSHIP CHECK — kisi aur ki post update nahi kar sakta!
    if (post.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: "Not allowed — this post belongs to another user",
      })
    }

    // Jo bhi field bheji, update karo (baqi same rahengi)
    const updates = ["title", "image", "platforms", "date", "time", "status"]
    updates.forEach((field) => {
      if (req.body[field] !== undefined) {
        post[field] = req.body[field]
      }
    })

    await post.save()

    res.json({
      success: true,
      message: "Post updated successfully ✅",
      post,
    })
  } catch (error) {
    console.error("❌ POST UPDATE ERROR:", error)
    res.status(500).json({ success: false, error: "Server error — try again" })
  }
})

// @route   DELETE /api/posts/:id
// @desc    Post delete karo (sirf apni!)
router.delete("/:id", async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)

    if (!post) {
      return res.status(404).json({ success: false, error: "Post not found" })
    }

    // OWNERSHIP CHECK
    if (post.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: "Not allowed — this post belongs to another user",
      })
    }

    await post.deleteOne()

    res.json({
      success: true,
      message: "Post deleted successfully 🗑️",
    })
  } catch (error) {
    console.error("❌ POST DELETE ERROR:", error)
    res.status(500).json({ success: false, error: "Server error — try again" })
  }
})

module.exports = router