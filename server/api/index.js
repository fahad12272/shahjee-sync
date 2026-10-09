const mongoose = require("mongoose")
const app = require("../server/server")

// Serverless mein har invocation pe naya connection mat banao — cache karo
let cached = global.__mongooseConn
if (!cached) {
  cached = global.__mongooseConn = { promise: null }
}

module.exports = async (req, res) => {
  if (!cached.promise) {
    cached.promise = mongoose
      .connect(process.env.MONGODB_URI)
      .then((m) => {
        console.log("✅ MongoDB Connected (serverless)")
        return m
      })
      .catch((error) => {
        console.error("❌ MongoDB Error:", error.message)
        cached.promise = null
        throw error
      })
  }

  try {
    await cached.promise
  } catch {
    return res
      .status(500)
      .json({ success: false, error: "Database connection failed" })
  }

  return app(req, res)
}