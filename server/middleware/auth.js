import jwt from "jsonwebtoken"
import User from "../models/User.js"

const protect = async (req, res, next) => {
  try {
    let token = null

    const authHeader = req.headers.authorization
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1]
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        error: "Access denied — please login first",
      })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    const user = await User.findById(decoded.userId).select("-password")

    if (!user) {
      return res.status(401).json({
        success: false,
        error: "User no longer exists",
      })
    }

    req.user = user
    next()
  } catch (error) {
    console.error("❌ AUTH ERROR:", error.message)
    res.status(401).json({
      success: false,
      error: "Invalid or expired token — login again",
    })
  }
}

export { protect }
