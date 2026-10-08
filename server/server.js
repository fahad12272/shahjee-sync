const express = require("express")
const cors = require("cors")
require("dotenv").config()

const connectDB = require("./config/db")
const authRoutes = require("./routes/auth")

const app = express()

// Middleware
app.use(cors())
app.use(express.json())

// Database connect karo
connectDB()

// Routes
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    message: "Shahjee Sync server is running! 🚀",
    time: new Date().toISOString(),
  })
})

app.use("/api/auth", authRoutes)

const PORT = process.env.PORT || 5000

app.listen(PORT, () => {
  console.log(`✅ Shahjee Sync backend chal raha hai: http://localhost:${PORT}`)
  console.log(`💡 Health: http://localhost:${PORT}/api/health`)
})