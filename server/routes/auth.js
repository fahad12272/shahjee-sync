const express = require("express")
const jwt = require("jsonwebtoken")
const User = require("../models/User")

const router = express.Router()

// Helper: JWT token banane ka function
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  })
}

// @route   POST /api/auth/signup
// @desc    Naya user account banano
router.post("/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body

    // 1. Saare fields aaye?
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        error: "Please provide name, email and password",
      })
    }

    // 2. Email pehle se registered hai?
    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: "This email is already registered — try logging in.",
      })
    }

    // 3. User banao (password automatically encrypt hoga — model ka pre-save hook)
    const user = await User.create({ name, email, password })

    // 4. Token banao aur bhejo
    const token = generateToken(user._id)

    res.status(201).json({
      success: true,
      message: "Account created successfully! 🎉",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    })
   } catch (error) {
    console.error("❌ SIGNUP ERROR:", error)   // 👈 YE LINE ADD KARO
    // Validation errors (galat email format, chota password waghera)
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((err) => err.message)
      return res.status(400).json({ success: false, error: messages[0] })
    }
    res.status(500).json({ success: false, error: "Server error — try again" })
  }
})

// @route   POST /api/auth/login
// @desc    Existing user login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: "Please provide email and password",
      })
    }

    // User dhoondo (password ke saath)
    const user = await User.findOne({ email })
    if (!user) {
      return res.status(401).json({
        success: false,
        error: "No account found with this email.",
      })
    }

    // Password match karo
    const isMatch = await user.comparePassword(password)
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: "Incorrect password. Try again.",
      })
    }

    const token = generateToken(user._id)

    res.json({
      success: true,
      message: "Login successful! 🚀",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    })
  } catch (error) {
    console.error("❌ LOGIN ERROR:", error)    // 👈 YE LINE ADD KARO
    res.status(500).json({ success: false, error: "Server error — try again" })
  }
})

module.exports = router