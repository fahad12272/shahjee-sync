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
