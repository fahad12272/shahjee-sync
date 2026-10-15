import express from "express"
import cors from "cors"
import "dotenv/config"

import connectDB from "./config/db.js"
import authRoutes from "./routes/auth.js"
import postRoutes from "./routes/posts.js"

const app = express()

const allowedOrigins = [
  "http://localhost:5173",
  "https://shahjee-sync.vercel.app",
]

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true)
      }
      return callback(new Error("Not allowed by CORS"))
    },
  }),
)

app.use(express.json())

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    message: "Shahjee Sync server is running! 🚀",
    time: new Date().toISOString(),
  })
})

app.use("/api/auth", authRoutes)
app.use("/api/posts", postRoutes)

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
