import mongoose from "mongoose"
import bcrypt from "bcryptjs"

// X (Twitter) — values AES-256-GCM encrypted store hoti hain
// authType "keys" = purana manual method | "oauth2" = 1-click Connect with X
const xPlatformSchema = new mongoose.Schema(
  {
    apiKey: { type: String, default: "" },
    apiSecret: { type: String, default: "" },
    accessToken: { type: String, default: "" },
    accessSecret: { type: String, default: "" },
    authType: { type: String, default: "keys" },
    // OAuth 2.0 session (access token 2 ghante mein expire — cron refresh karta hai)
    oauth2AccessToken: { type: String, default: "" },
    oauth2RefreshToken: { type: String, default: "" },
    oauth2ExpiresAt: { type: Date, default: null },
    handle: { type: String, default: "" },
    connectedAt: { type: Date, default: null },
  },
  { _id: false },
)

// Facebook Page — page token encrypted (long-lived user token se bana — practically kabhi expire nahi hota)
const facebookPlatformSchema = new mongoose.Schema(
  {
    pageId: { type: String, default: "" },
    pageToken: { type: String, default: "" },
    pageName: { type: String, default: "" },
    connectedAt: { type: Date, default: null },
  },
  { _id: false },
)

// Instagram Business/Creator — IG token = page token (encrypted)
const instagramPlatformSchema = new mongoose.Schema(
  {
    igUserId: { type: String, default: "" },
    pageId: { type: String, default: "" },
    pageToken: { type: String, default: "" },
    username: { type: String, default: "" },
    connectedAt: { type: Date, default: null },
  },
  { _id: false },
)

// Threads — long-lived token (~60 din), cron post se pehle refresh hota hai
const threadsPlatformSchema = new mongoose.Schema(
  {
    userId: { type: String, default: "" },
    accessToken: { type: String, default: "" },
    username: { type: String, default: "" },
    expiresAt: { type: Date, default: null },
    connectedAt: { type: Date, default: null },
  },
  { _id: false },
)

// LinkedIn — 1-click OAuth (access token ~60 din; refresh_token mile to cron auto-renew)
const linkedinPlatformSchema = new mongoose.Schema(
  {
    memberUrn: { type: String, default: "" }, // urn:li:person:{sub} — posting ke liye
    accessToken: { type: String, default: "" },
    refreshToken: { type: String, default: "" },
    expiresAt: { type: Date, default: null },
    name: { type: String, default: "" },
    connectedAt: { type: Date, default: null },
  },
  { _id: false },
)

// Telegram bot — values AES-256-GCM encrypted store hoti hain
const telegramPlatformSchema = new mongoose.Schema(
  {
    botToken: { type: String, default: "" },
    chatId: { type: String, default: "" },
    chatTitle: { type: String, default: "" },
    connectedAt: { type: Date, default: null },
  },
  { _id: false },
)

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Please enter a valid email"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
    // Password reset (kabhi expire hone wale reset tokens)
    resetTokenHash: { type: String, default: "" },
    resetTokenExpiry: { type: Date, default: null },
    // Social platform connections (secrets encrypted — API se raw kabhi nahi jaate)
    platforms: {
      x: { type: xPlatformSchema, default: () => ({}) },
      telegram: { type: telegramPlatformSchema, default: () => ({}) },
      facebook: { type: facebookPlatformSchema, default: () => ({}) },
      instagram: { type: instagramPlatformSchema, default: () => ({}) },
      threads: { type: threadsPlatformSchema, default: () => ({}) },
      linkedin: { type: linkedinPlatformSchema, default: () => ({}) },
    },
  },
  { timestamps: true },
)

userSchema.pre("save", async function () {
  if (!this.isModified("password")) return
  const salt = await bcrypt.genSalt(10)
  this.password = await bcrypt.hash(this.password, salt)
})

userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password)
}

export default mongoose.model("User", userSchema)
