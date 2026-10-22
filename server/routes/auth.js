import express from "express"
import crypto from "node:crypto"
import jwt from "jsonwebtoken"
import User from "../models/User.js"
import { protect } from "../middleware/auth.js"
import transporter, { mailerReady } from "../config/mailer.js"
import User from "../models/User.js"
import Post from "../models/Post.js"

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

// POST /api/auth/forgot-password — reset link generate karke email bhejta hai
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body

    if (!email) {
      return res
        .status(400)
        .json({ success: false, error: "Email zaroori hai" })
    }

    const user = await User.findOne({
      email: String(email).toLowerCase().trim(),
    })

    // Generic message — taake kisi ko pata na chale ke email exist karta hai ya nahi
    const genericMessage =
      "Agar ye email registered hai, to password reset link bhej diya gaya hai. Inbox aur spam dono check karein."

    if (!user) {
      return res.json({ success: true, message: genericMessage })
    }

    // Random 32-byte token — DB mein sirf uska SHA-256 hash save hota hai
    const resetToken = crypto.randomBytes(32).toString("hex")
    const resetTokenHash = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex")

    user.resetTokenHash = resetTokenHash
    user.resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000) // 1 ghanta valid
    await user.save()

    const resetUrl = `${APP_URL}/reset?token=${resetToken}`

    // TESTING MODE: SMTP setup nahi hai to link response mein wapas
    // (frontend isko amber box mein dikha deta hai). Email bhejne ke liye
    // SMTP_USER + SMTP_PASS env vars set karo.
    if (!mailerReady()) {
      console.log("⚠️ TESTING MODE — reset link directly return kiya:", resetUrl)
      return res.json({ success: true, message: genericMessage, resetUrl })
    }

    const emailHtml = `
      <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px;border:1px solid #e2e8f0;border-radius:12px">
        <h2 style="color:#4f46e5;margin-top:0">Shahjee Sync</h2>
        <p>Salam!</p>
        <p>Aap ne password reset request ki hai. Neeche wale button se naya password set karein:</p>
        <p style="text-align:center;margin:28px 0">
          <a href="${resetUrl}" style="background-color:#4f46e5;color:#ffffff;padding:12px 28px;border-radius:10px;text-decoration:none;font-weight:bold;display:inline-block">Reset Password</a>
        </p>
        <p style="color:#64748b;font-size:13px">Ye link 1 ghante ke liye valid hai. Agar aap ne request nahi ki thi, to is email ko ignore karein — aapka password waisa hi rahega.</p>
        <p style="color:#94a3b8;font-size:12px">— Shahjee Sync team</p>
      </div>`

    await transporter.sendMail({
      from: `"Shahjee Sync" <${process.env.SMTP_USER}>`,
      to: user.email,
      subject: "Reset your password — Shahjee Sync",
      html: emailHtml,
    })

    res.json({ success: true, message: genericMessage })
  } catch (error) {
    console.error("❌ FORGOT PASSWORD ERROR:", error)
    res.status(500).json({ success: false, error: "Server error — try again" })
  }
})

// POST /api/auth/reset-password — token verify karke naya password set karta hai
router.post("/reset-password", async (req, res) => {
  try {
    const { token, password } = req.body

    if (!token || !password) {
      return res.status(400).json({
        success: false,
        error: "Token aur naya password dono zaroori hain",
      })
    }

    if (String(password).length < 6) {
      return res.status(400).json({
        success: false,
        error: "Password kam se kam 6 characters ka hona chahiye",
      })
    }

    const resetTokenHash = crypto
      .createHash("sha256")
      .update(String(token))
      .digest("hex")

    const user = await User.findOne({
      resetTokenHash,
      resetTokenExpiry: { $gt: new Date() },
    })

    if (!user) {
      return res.status(400).json({
        success: false,
        error:
          "Reset link invalid ya expire ho gaya — dobara 'Forgot password' se request karein",
      })
    }

    // pre-save hook khud bcrypt hash kar dega
    user.password = password
    user.resetTokenHash = ""
    user.resetTokenExpiry = null
    await user.save()

    res.json({
      success: true,
      message:
        "Password successfully change ho gaya! Ab naye password se login karein.",
    })
  } catch (error) {
    console.error("❌ RESET PASSWORD ERROR:", error)
    res.status(500).json({ success: false, error: "Server error — try again" })
  }
})

// PUT /api/auth/profile — logged-in user apna naam update karta hai
router.put("/profile", protect, async (req, res) => {
  try {
    const { name } = req.body

    if (!name || String(name).trim().length < 2) {
      return res.status(400).json({
        success: false,
        error: "Naam kam se kam 2 characters ka hona chahiye",
      })
    }

    if (String(name).trim().length > 50) {
      return res.status(400).json({
        success: false,
        error: "Naam 50 characters se zyada nahi ho sakta",
      })
    }

    const user = await User.findById(req.user._id)
    if (!user) {
      return res
        .status(404)
        .json({ success: false, error: "User not found" })
    }

    user.name = String(name).trim()
    await user.save()

    res.json({
      success: true,
      message: "Profile update ho gaya! ✅",
      user: { id: user._id, name: user.name, email: user.email },
    })
  } catch (error) {
    console.error("❌ PROFILE UPDATE ERROR:", error)
    res.status(500).json({ success: false, error: "Server error — try again" })
  }
})

// PUT /api/auth/password — logged-in user password change karta hai
// (current password verify hota hai — reset-password se alag ye logged-in flow hai)
router.put("/password", protect, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        error: "Current aur naya password dono zaroori hain",
      })
    }

    if (String(newPassword).length < 6) {
      return res.status(400).json({
        success: false,
        error: "Naya password kam se kam 6 characters ka hona chahiye",
      })
    }

    const user = await User.findById(req.user._id)
    if (!user) {
      return res
        .status(404)
        .json({ success: false, error: "User not found" })
    }

    const isMatch = await user.comparePassword(currentPassword)
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: "Current password galat hai — dobara try karein",
      })
    }

    if (currentPassword === newPassword) {
      return res.status(400).json({
        success: false,
        error: "Naya password purane jaisa nahi ho sakta",
      })
    }

    // pre-save hook khud bcrypt hash kar dega
    user.password = newPassword
    await user.save()

    res.json({
      success: true,
      message: "Password change ho gaya! 🔐",
    })
  } catch (error) {
    console.error("❌ PASSWORD CHANGE ERROR:", error)
    res.status(500).json({ success: false, error: "Server error — try again" })
  }
})

// DELETE /api/auth/account — account + saari posts permanently delete
router.delete("/account", protect, async (req, res) => {
  try {
    // Pehle is user ki saari posts delete karo
    await Post.deleteMany({ user: req.user._id })
    // Phir user hi delete karo
    await User.findByIdAndDelete(req.user._id)

    res.json({
      success: true,
      message: "Account aur saara data permanently delete ho gaya",
    })
  } catch (error) {
    console.error("❌ ACCOUNT DELETE ERROR:", error)
    res.status(500).json({ success: false, error: "Server error — try again" })
  }
})

export default router
