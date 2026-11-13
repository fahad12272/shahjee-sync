import crypto from "node:crypto"
import express from "express"
import multer from "multer"
import { protect } from "../middleware/auth.js"
import cloudinary from "../config/cloudinary.js"

const router = express.Router()

// File RAM mein buffer hoti hai — Vercel serverless pe disk pe likh nahi sakte
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 4 * 1024 * 1024 }, // 4 MB (Vercel body limit ~4.5 MB hai)
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true)
    } else {
      cb(new Error("Sirf image files allowed hain (JPG/PNG/WebP)"))
    }
  },
})

// POST /api/upload — image upload karke permanent Cloudinary URL return karta hai
router.post("/", protect, upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res
        .status(400)
        .json({ success: false, error: "Koi image file nahi mili" })
    }

    // Buffer ko base64 data URI bana ke Cloudinary par bhejo
    const b64 = Buffer.from(req.file.buffer).toString("base64")
    const dataURI = `data:${req.file.mimetype};base64,${b64}`

    const result = await cloudinary.uploader.upload(dataURI, {
      folder: "shahjee-sync",
      resource_type: "image",
    })

    res.status(201).json({
      success: true,
      message: "Image upload ho gayi! ✅",
      url: result.secure_url,
      publicId: result.public_id,
    })
  } catch (error) {
    console.error("❌ UPLOAD ERROR:", error)
    res
      .status(500)
      .json({ success: false, error: "Image upload fail ho gayi — try again" })
  }
})

// POST /api/upload/video-sign — VIDEO ke liye signed direct upload params.
// Vercel body limit ~4.5MB hai isliye video hamare server se NAHI guzarti —
// browser seedha Cloudinary pe upload karta hai (60MB tak, TikTok cap).
// Backend sirf signature deta hai — CLOUDINARY_API_SECRET kabhi frontend
// pe nahi jata, sirf uska SHA-1 signature jata hai.
router.post("/video-sign", protect, (req, res) => {
  try {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME
    const apiKey = process.env.CLOUDINARY_API_KEY
    const apiSecret = process.env.CLOUDINARY_API_SECRET
    if (!cloudName || !apiKey || !apiSecret) {
      return res.status(400).json({
        success: false,
        error:
          "Cloudinary setup nahi hua — CLOUDINARY_CLOUD_NAME/CLOUDINARY_API_KEY/CLOUDINARY_API_SECRET env vars missing (Vercel mein add karo).",
      })
    }

    const timestamp = Math.round(Date.now() / 1000)
    const folder = "shahjee-sync"
    // Cloudinary signature rule: jo params bhejne hain (file/api_key ke siwa)
    // unko alphabetical jodo + api_secret last mein — phir SHA-1.
    // Hum sirf folder + timestamp bhejte hain, isliye yahi do sign hote hain.
    const signature = crypto
      .createHash("sha1")
      .update(`folder=${folder}&timestamp=${timestamp}${apiSecret}`)
      .digest("hex")

    res.json({
      success: true,
      cloudName,
      apiKey,
      timestamp,
      folder,
      signature,
      // Browser is URL pe FormData (file + params) POST karta hai
      uploadUrl: `https://api.cloudinary.com/v1_1/${cloudName}/video/upload`,
      maxBytes: 60 * 1024 * 1024, // TikTok publish cap ke saath sync (tiktokPost.js)
    })
  } catch {
    res.status(500).json({ success: false, error: "Server error — try again" })
  }
})

// Multer/file errors ko proper JSON response mein convert karo
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    const msg =
      error.code === "LIMIT_FILE_SIZE"
        ? "File 4MB se badi hai — chhoti image choose karo"
        : error.message
    return res.status(400).json({ success: false, error: msg })
  }
  if (error) {
    return res.status(400).json({ success: false, error: error.message })
  }
  next()
})

export default router
