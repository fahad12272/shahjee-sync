const jwt = require("jsonwebtoken")
const User = require("../models/User")

// Ye middleware har protected route ke aage lagega
// Token check karega, sahi ho to user aage bhejega
const protect = async (req, res, next) => {
  try {
    let token = null

    // 1. Header se token nikalo: "Authorization: Bearer <token>"
    const authHeader = req.headers.authorization
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1]
    }

    // 2. Token hai hi nahi?
    if (!token) {
      return res.status(401).json({
        success: false,
        error: "Access denied — please login first",
      })
    }

    // 3. Token verify karo (galat/expired token yahan pakda jayega)
    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    // 4. Token ke andar wale userId se user dhoondo
    const user = await User.findById(decoded.userId).select("-password")

    if (!user) {
      return res.status(401).json({
        success: false,
        error: "User no longer exists",
      })
    }

    // 5. User ko request pe chipka do — aage wale route ko mil jayega
    req.user = user
    next()
  } catch (error) {
    console.error("❌ AUTH MIDDLEWARE ERROR:", error.message)
    res.status(401).json({
      success: false,
      error: "Invalid or expired token — login again",
    })
  }
}

module.exports = { protect }