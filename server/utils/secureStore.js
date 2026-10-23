import crypto from "node:crypto"

// Platform secrets (X keys, Telegram bot token) DB mein AES-256-GCM se
// encrypted store hote hain — encryption key JWT_SECRET se derive hoti hai.
// Format: enc:v1:<iv>:<authTag>:<cipherText> (sab base64)
const RAW_KEY = crypto
  .createHash("sha256")
  .update(process.env.JWT_SECRET || "shahjee-sync-local-dev-secret")
  .digest()

const PREFIX = "enc:v1:"

export function encryptSecret(plain) {
  if (!plain) return ""
  const value = String(plain)
  if (value.startsWith(PREFIX)) return value // already encrypted
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv("aes-256-gcm", RAW_KEY, iv)
  const data = Buffer.concat([cipher.update(value, "utf8"), cipher.final()])
  const tag = cipher.getAuthTag()
  return `${PREFIX}${iv.toString("base64")}:${tag.toString("base64")}:${data.toString("base64")}`
}

export function decryptSecret(stored) {
  if (!stored) return ""
  const value = String(stored)
  if (!value.startsWith(PREFIX)) return value // legacy/plain value
  const [ivB64, tagB64, dataB64] = value.slice(PREFIX.length).split(":")
  try {
    const decipher = crypto.createDecipheriv(
      "aes-256-gcm",
      RAW_KEY,
      Buffer.from(ivB64, "base64"),
    )
    decipher.setAuthTag(Buffer.from(tagB64, "base64"))
    return Buffer.concat([
      decipher.update(Buffer.from(dataB64, "base64")),
      decipher.final(),
    ]).toString("utf8")
  } catch {
    return "" // tampered ya galat key — khali value do
  }
}

// UI ke liye safe preview — sirf last 4 chars dikhte hain
export function maskSecret(stored) {
  const value = decryptSecret(stored)
  if (!value) return ""
  if (value.length <= 8) return "••••••••"
  return "••••••••" + value.slice(-4)
}
