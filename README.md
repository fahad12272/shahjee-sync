# Shahjee Sync 🚀

Social media post scheduler — ek jagah se posts plan, schedule aur track karo. Image + caption ke saath posts banao, apne time pe auto-publish hona set karo, aur analytics se performance dekho.

**Live app:** [shahjee-sync.vercel.app](https://shahjee-sync.vercel.app)

---

## ✨ Features

- 📅 **Post scheduling** — kisi bhi date/time pe post schedule karo, auto-publish cron khud publish kar deta hai
- 📝 **Full captions** — 2200 characters tak ka text har post ke saath save hota hai
- 🖼️ **Media uploads** — Cloudinary se fast image hosting
- 🗓️ **Multiple views** — Scheduled Queue, Calendar view, aur Analytics dashboard
- 🔐 **Authentication** — JWT auth, bcrypt password hashing, email password reset
- 🛡️ **Security** — rate limiting, NoSQL injection sanitizer, helmet security headers, payload caps
- ⚙️ **Settings** — profile management, password change, workspace deletion
- 💾 **Backup & restore** — saare posts JSON backup mein export/import
- ↩️ **Undo system** — galti se delete ho to turant wapas

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Vite, Tailwind CSS 4 |
| Backend | Node.js, Express 5 (Vercel serverless) |
| Database | MongoDB Atlas + Mongoose 9 |
| Media | Cloudinary |
| Email | Nodemailer (Gmail SMTP) |
| Auth | JWT + bcryptjs |

## 📦 Project Structure

```
├── api/
│   └── index.js          # Vercel serverless entry
├── server/
│   ├── server.js         # Express app (helmet, rate limiting, CORS)
│   ├── config/           # DB connection, mailer
│   ├── middleware/       # JWT auth
│   ├── models/           # User, Post schemas
│   └── routes/           # auth, posts, upload, cron
├── src/
│   ├── App.jsx           # Workspace shell + state
│   ├── api.js            # API client
│   ├── components/       # Sidebar, Header, Toast, etc.
│   └── pages/            # CreatePost, ScheduledQueue, CalendarView, Analytics, Settings...
└── vercel.json           # Rewrites + daily cron
```

## ⚙️ Local Setup

```bash
# 1. Clone karo
git clone https://github.com/fahad12272/shahjee-sync.git
cd shahjee-sync

# 2. Dependencies install karo
npm install
cd server && npm install && cd ..

# 3. Environment variables set karo
cp .env.example .env
# .env file mein apni values bharo

# 4. Chalao
npm run dev          # frontend (localhost:5173)
cd server && node server.js   # backend (localhost:5000)
```

## 🔐 Environment Variables

| Variable | Kahan milega | Zaroori? |
|----------|-------------|----------|
| `MONGODB_URI` | [MongoDB Atlas](https://cloud.mongodb.com) — free M0 cluster | ✅ |
| `JWT_SECRET` | Khud banao — lamba random string | ✅ |
| `CRON_SECRET` | Khud banao — scheduler endpoint ka password | ✅ |
| `APP_URL` | Tumhari deployed site ka URL | Optional |
| `CLOUDINARY_CLOUD_NAME` | [Cloudinary](https://cloudinary.com) dashboard | Media upload ke liye ✅ |
| `CLOUDINARY_API_KEY` | Cloudinary dashboard | ✅ |
| `CLOUDINARY_API_SECRET` | Cloudinary dashboard | ✅ |
| `SMTP_USER` | Gmail address (password reset emails ke liye) | Optional |
| `SMTP_PASS` | Google **App Password** (16 chars — normal password nahi) | Optional |
| `SMTP_HOST` | Default: `smtp.gmail.com` | Optional |
| `SMTP_PORT` | Default: `465` | Optional |
| `VITE_API_URL` | Frontend → backend URL (default `/api`) | Optional |
| `X_API_KEY` etc. | [developer.x.com](https://developer.x.com) — direct posting ke liye | Aane wala feature |

## 🔄 Auto-Publish Kaise Kaam Karta Hai

1. Post schedule karo — DB mein `scheduledAt` (UTC ISO) save hota hai
2. Har minute ek cron job `/api/cron/publish` ko `CRON_SECRET` ke saath hit karta hai
3. Endpoint saare aise posts uthata hai jin ka `status: "Pending"` hai aur `scheduledAt` nikal chuka hai → `Published` kar deta hai
4. Vercel daily cron bhi backup ke liye laga hai (Hobby plan limitation)

> **Note:** Bina `Authorization: Bearer <CRON_SECRET>` ke endpoint 401 deta hai — koi random trigger scheduler ko chala nahi sakta.

## 🚀 Deployment (Vercel)

1. Repo ko GitHub pe rakho, Vercel mein import karo
2. Root directory se build hota hai (`npm run build` + `api/index.js`)
3. Environment variables Vercel → Settings → Environment Variables mein daalo
4. MongoDB Atlas → Network Access mein `0.0.0.0/0` allow karo (serverless IPs dynamic hote hain)

## 📄 License

MIT — bebas use karo, seekho, improve karo.

---

Made with ❤️ by **fahad12272** — feedback welcome!
