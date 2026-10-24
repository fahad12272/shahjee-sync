import express from "express"
import cors from "cors"
import helmet from "helmet"
import rateLimit from "express-rate-limit"
import "dotenv/config"
import cronRoutes from "./routes/cron.js"

import connectDB from "./config/db.js"
import authRoutes from "./routes/auth.js"
import postRoutes from "./routes/posts.js"
import uploadRoutes from "./routes/upload.js"
import platformRoutes from "./routes/platforms.js"

const app = express()

// Vercel proxy ke peeche chalte hain — sahi IP ke liye zaroori
app.set("trust proxy", 1)

// ---------- Security headers ----------
// CSP band hai kyunki ye sirf /api JSON deta hai (static site Vercel khud serve karta hai)
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  }),
)
app.disable("x-powered-by")

// ---------- CORS ----------
const allowedOrigins = [
  "http://localhost:5173",
  "https://shahjee-sync.vercel.app",
]

// Kisi bhi Vercel project/preview URL (***.vercel.app) ko bhi allow karo
const isVercelUrl = (origin) => /^https:\/\/[a-z0-9-]+\.vercel\.app$/.test(origin)

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin) || isVercelUrl(origin)) {
        return callback(null, true)
      }
      return callback(new Error("Not allowed by CORS"))
    },
    credentials: true,
  }),
)

// ---------- Rate limiters ----------
// General API limit — normal usage isse kabhi touch nahi karegi
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: "Bohat zyada requests — thodi der baad try karein",
  },
})

// Auth limit — brute-force protection (login/signup/password reset)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 25,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: "Bohat zyada koshishen — 15 minute baad try karein",
  },
})

app.use("/api", apiLimiter)
app.use(
  [
    "/api/auth/login",
    "/api/auth/signup",
    "/api/auth/forgot-password",
    "/api/auth/reset-password",
  ],
  authLimiter,
)

// ---------- NoSQL injection sanitizer ----------
// Body/params/query keys jo $ se shuru hote hain ya . rakhte hain — unhe hata do
// (Express 5 compatible: sirf object keys mutate karte hain, reassign nahi)
function cleanObject(obj) {
  if (!obj || typeof obj !== "object") return
  for (const key of Object.keys(obj)) {
    if (key.startsWith("$") || key.includes(".")) {
      delete obj[key]
    } else {
      cleanObject(obj[key])
    }
  }
}

app.use((req, res, next) => {
  try {
    if (req.body && typeof req.body === "object") cleanObject(req.body)
    if (req.params && typeof req.params === "object") cleanObject(req.params)
    if (req.query && typeof req.query === "object") cleanObject(req.query)
  } catch {
    // sanitize fail ho to request block na ho — aage badhne do
  }
  next()
})

// ---------- Body parser (explicit 1MB cap) ----------
app.use(express.json({ limit: "1mb" }))

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    message: "Shahjee Sync server is running! 🚀",
    time: new Date().toISOString(),
  })
})

app.use("/api/auth", authRoutes)
app.use("/api/posts", postRoutes)
app.use("/api/upload", uploadRoutes)
app.use("/api/platforms", platformRoutes)
app.use("/api/cron", cronRoutes)

// ---------- 404 + global error handler (JSON only) ----------
app.use((req, res) => {
  res.status(404).json({ success: false, error: "Route not found" })
})

app.use((err, req, res, next) => {
  console.error("❌ SERVER ERROR:", err.message)
  res.status(500).json({ success: false, error: "Server error — try again" })
})

// Local dev: server khud listen karta hai. Vercel (serverless) pe sirf export.
if (!process.env.VERCEL) {
  connectDB()

  const PORT = process.env.PORT || 5000
  app.listen(PORT, () => {
    console.log(`✅ Shahjee Sync backend: http://localhost:${PORT}`)
    console.log(`💡 Health: http://localhost:${PORT}/api/health`)
  })
}

export default app
