import express from "express"
import crypto from "node:crypto"
import jwt from "jsonwebtoken"
import User from "../models/User.js"
import { protect } from "../middleware/auth.js"
import transporter, { mailerReady } from "../config/mailer.js"

const router = express.Router()

const APP_URL = process.env.APP_URL || "https://shahjee-sync.vercel.app"

const generateToken = (userId) =>
  jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: "7d" })

router.post("/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        error: "Please provide name, email and password",
      })
    }

    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: "This email is already registered — try logging in.",
      })
    }

    const user = await User.create({ name, email, password })
    const token = generateToken(user._id)

    res.status(201).json({
      success: true,
      message: "Account created successfully! 🎉",
      token,
      user: { id: user._id, name: user.name, email: user.email },
    })
  } catch (error) {
    console.error("❌ SIGNUP ERROR:", error)
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((err) => err.message)
      return res.status(400).json({ success: false, error: messages[0] })
    }
    res.status(500).json({ success: false, error: "Server error — try again" })
  }
})

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: "Please provide email and password",
      })
    }

    const user = await User.findOne({ email })
    if (!user) {
      return res
        .status(401)
        .json({ success: false, error: "No account found with this email." })
    }

    const isMatch = await user.comparePassword(password)
    if (!isMatch) {
      return res
        .status(401)
        .json({ success: false, error: "Incorrect password. Try again." })
    }

    const token = generateToken(user._id)

    res.json({
      success: true,
      message: "Login successful! 🚀",
      token,
      user: { id: user._id, name: user.name, email: user.email },
    })
  } catch (error) {
    console.error("❌ LOGIN ERROR:", error)
    res.status(500).json({ success: false, error: "Server error — try again" })
  }
})

router.get("/me", protect, async (req, res) => {
  try {
    res.json({
      success: true,
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        joinedAt: req.user.joinedAt,
      },
    })
  } catch (error) {
    console.error("❌ ME ERROR:", error)
    res.status(500).json({ success: false, error: "Server error — try again" })
  }
})

export default router
