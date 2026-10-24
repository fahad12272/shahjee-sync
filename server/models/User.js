import mongoose from "mongoose"
import bcrypt from "bcryptjs"

// X (Twitter) keys — values AES-256-GCM encrypted store hoti hain
const xPlatformSchema = new mongoose.Schema(
  {
    apiKey: { type: String, default: "" },
    apiSecret: { type: String, default: "" },
    accessToken: { type: String, default: "" },
    accessSecret: { type: String, default: "" },
    handle: { type: String, default: "" },
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
