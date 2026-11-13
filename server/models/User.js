import mongoose from "mongoose"
import bcrypt from "bcryptjs"
import crypto from "node:crypto"
import { encryptSecret } from "../utils/secureStore.js"

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: { type: String, required: true, minlength: 6, select: false },
    avatar: { type: String, default: "" },
    role: { type: String, enum: ["user", "admin"], default: "user" },

    // Social accounts ki encrypted creds — sab kuch User ke andar hi rehta hai
    platforms: {
      x: { type: Object, default: () => ({}) },
      telegram: { type: Object, default: () => ({}) },
      facebook: { type: Object, default: () => ({}) },
      instagram: { type: Object, default: () => ({}) },
      youtube: { type: Object, default: () => ({}) },
      threads: { type: Object, default: () => ({}) },
      linkedin: { type: Object, default: () => ({}) },

      // TikTok — 1-click OAuth PKCE (access token ~24 ghante, refresh token ~365 din).
      // username publish ke baad permalink banane ke kaam aata hai
      // (tiktok.com/@username/video/{post_id})
      tiktok: {
        type: new mongoose.Schema(
          {
            openId: { type: String, default: "" },
            accessToken: { type: String, default: "" },
            refreshToken: { type: String, default: "" },
            expiresAt: { type: Date, default: null },
            displayName: { type: String, default: "" },
            username: { type: String, default: "" },
            avatarUrl: { type: String, default: "" },
            connectedAt: { type: Date, default: null },
          },
          { _id: false },
        ),
        default: () => ({}),
      },
    },
  },
  { timestamps: true },
)

// Password ko save se PEHLE hash karo (sirf jab change hua ho)
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next()
  this.password = await bcrypt.hash(this.password, 10)
  next()
})

// Plain password vs hash compare (login ke waqt)
userSchema.methods.matchPassword = function (entered) {
  return bcrypt.compare(entered, this.password)
}

// Kabhi kabhi purane users ke tokens plain text mein the — pehli save pe
// encrypt kar do (ek dafa migrate, phir hamesha encrypted)
userSchema.pre("save", function (next) {
  const p = this.platforms || {}
  for (const key of Object.keys(p)) {
    const creds = p[key] || {}
    const secretFields = [
      "accessToken",
      "accessSecret",
      "refreshToken",
      "apiKey",
      "apiSecret",
      "pageToken",
      "botToken",
      "chatId",
      "oauth2AccessToken",
      "oauth2RefreshToken",
    ]
    for (const f of secretFields) {
      const v = creds[f]
      if (typeof v === "string" && v && !v.startsWith("enc:")) {
        creds[f] = encryptSecret(v)
      }
    }
  }
  next()
})

// JWT payload ke liye public shape
userSchema.methods.toPublicJSON = function () {
  return {
    id: this._id,
    name: this.name,
    email: this.email,
    avatar: this.avatar,
    role: this.role,
    platforms: this.platforms,
    createdAt: this.createdAt,
  }
}

// Password reset — secure random token
userSchema.methods.getResetPasswordToken = function () {
  const token = crypto.randomBytes(20).toString("hex")
  this.resetPasswordToken = crypto
    .createHash("sha256")
    .update(token)
    .digest("hex")
  this.resetPasswordExpire = Date.now() + 10 * 60 * 1000
  return token
}

const User = mongoose.model("User", userSchema)
export default User
