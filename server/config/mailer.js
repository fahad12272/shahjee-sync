import nodemailer from "nodemailer"

// Gmail SMTP setup (Vercel > Settings > Environment Variables):
//   SMTP_USER = tumhari Gmail address (e.g. shahjeesync.noreply@gmail.com)
//   SMTP_PASS = Google "App Password" (16 characters) — normal password NAHI chalta
//
// App Password banane ke liye:
//   1. Google Account > Security > 2-Step Verification ON karo
//   2. Google Account > Security > App passwords > naya password generate karo
//   3. Wahi 16-char password SMTP_PASS mein daalo

let transporter = null

if (process.env.SMTP_USER && process.env.SMTP_PASS) {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: Number(process.env.SMTP_PORT) || 465,
    secure: true,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  })
  console.log("✅ SMTP ready — emails jaa sakti hain")
} else {
  console.log("⚠️ SMTP setup nahi hai — password reset links sirf TESTING mode mein milenge")
}

export const mailerReady = () => Boolean(transporter)

export default transporter
