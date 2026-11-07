import {
  AtSign,
  BarChart3,
  BriefcaseBusiness,
  CalendarClock,
  Camera,
  CirclePlay,
  Link2,
  Music2,
  PenLine,
  Send,
  Settings,
  Users,
} from "lucide-react"
import {
  FaFacebookF,
  FaInstagram,
  FaLinkedinIn,
  FaThreads,
  FaTiktok,
  FaXTwitter,
  FaYoutube,
} from "react-icons/fa6"

export const navigation = [
  { label: "Create Post", icon: PenLine },
  { label: "Connected Accounts", icon: Link2 },
  { label: "Scheduled Queue", icon: CalendarClock },
  { label: "Analytics", icon: BarChart3 },
  { label: "Settings", icon: Settings },
]

export const platforms = [
  {
    name: "Instagram",
    icon: Camera,
    active: "border-fuchsia-400 bg-fuchsia-50/60 text-fuchsia-700",
    check: "bg-fuchsia-500",
  },
  {
    name: "YouTube Shorts",
    icon: CirclePlay,
    active: "border-red-400 bg-red-50/60 text-red-700",
    check: "bg-red-500",
  },
  {
    name: "Facebook",
    icon: Users,
    active: "border-blue-400 bg-blue-50/60 text-blue-700",
    check: "bg-blue-500",
  },
  {
    name: "TikTok",
    icon: Music2,
    active: "border-slate-700 bg-slate-50 text-slate-900",
    check: "bg-slate-800",
  },
  {
    name: "LinkedIn",
    icon: BriefcaseBusiness,
    active: "border-sky-500 bg-sky-50/60 text-sky-700",
    check: "bg-sky-600",
  },
  {
    name: "X",
    icon: AtSign,
    active: "border-slate-700 bg-slate-50 text-slate-900",
    check: "bg-slate-800",
  },
  {
    name: "Threads",
    icon: FaThreads,
    active: "border-neutral-700 bg-neutral-50 text-neutral-900",
    check: "bg-neutral-900",
  },
  {
    name: "Telegram",
    icon: Send,
    active: "border-sky-400 bg-sky-50/60 text-sky-700",
    check: "bg-sky-500",
  },
]

export const createId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`

export const queuedPosts = [
  {
    id: "post-1",
    title: "Building better workflows",
    image:
      "https://images.unsplash.com/photo-1615494487949-f5f68968330e?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&q=80&w=160&h=160",
    platforms: ["instagram", "linkedin"],
    date: "May 24, 2025",
    time: "10:30 AM",
    status: "Pending",
  },
  {
    id: "post-2",
    title: "A fresh perspective",
    image:
      "https://images.unsplash.com/photo-1621184078903-6bfe9482d935?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&q=80&w=160&h=160",
    platforms: ["youtube", "tiktok"],
    date: "May 24, 2025",
    time: "2:00 PM",
    status: "Pending",
  },
  {
    id: "post-3",
    title: "Color outside the lines",
    image:
      "https://images.unsplash.com/photo-1597434430513-537624aa33c9?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&q=80&w=160&h=160",
    platforms: ["instagram", "facebook", "x"],
    date: "May 23, 2025",
    time: "4:45 PM",
    status: "Published",
  },
  {
    id: "post-4",
    title: "Work from anywhere",
    image:
      "https://images.unsplash.com/photo-1655722723663-75b47de17a31?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&q=80&w=160&h=160",
    platforms: ["linkedin", "facebook"],
    date: "May 22, 2025",
    time: "9:15 AM",
    status: "Published",
  },
]

export const platformIconMap = {
  instagram: {
    icon: FaInstagram,
    style: "bg-gradient-to-br from-violet-600 via-fuchsia-500 to-amber-400",
  },
  youtube: { icon: FaYoutube, style: "bg-red-600" },
  facebook: { icon: FaFacebookF, style: "bg-blue-600" },
  linkedin: { icon: FaLinkedinIn, style: "bg-sky-700" },
  tiktok: { icon: FaTiktok, style: "bg-slate-950" },
  x: { icon: FaXTwitter, style: "bg-slate-950" },
  threads: { icon: FaThreads, style: "bg-neutral-900" },
  telegram: { icon: Send, style: "bg-sky-500" },
}

export const platformKeyMap = {
  Instagram: "instagram",
  "YouTube Shorts": "youtube",
  Facebook: "facebook",
  TikTok: "tiktok",
  LinkedIn: "linkedin",
  X: "x",
  Threads: "threads",
  Telegram: "telegram",
}

export const createThumbnail = (file, maxSize = 400) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = () => {
      const img = new Image()

      img.onload = () => {
        const scale = Math.min(1, maxSize / Math.max(img.width, img.height))
        const width = Math.max(1, Math.round(img.width * scale))
        const height = Math.max(1, Math.round(img.height * scale))

        const canvas = document.createElement("canvas")
        canvas.width = width
        canvas.height = height

        const ctx = canvas.getContext("2d")
        if (!ctx) {
          reject(new Error("Canvas not supported"))
          return
        }

        ctx.drawImage(img, 0, 0, width, height)
        resolve(canvas.toDataURL("image/jpeg", 0.72))
      }

      img.onerror = () => reject(new Error("Image load failed"))
      img.src = String(reader.result)
    }

    reader.onerror = () => reject(new Error("File read failed"))
    reader.readAsDataURL(file)
  })

const DRAFT_KEY = "shahjee-sync-draft"

export function loadDraft() {
  try {
    const raw = window.localStorage.getItem(DRAFT_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed.caption !== "string") return null
    return {
      caption: parsed.caption,
      platforms: Array.isArray(parsed.platforms) ? parsed.platforms : [],
      publishMode: parsed.publishMode === "schedule" ? "schedule" : "now",
      scheduleAt: typeof parsed.scheduleAt === "string" ? parsed.scheduleAt : "",
    }
  } catch {
    return null
  }
}

export function saveDraft(draft) {
  try {
    window.localStorage.setItem(DRAFT_KEY, JSON.stringify(draft))
  } catch {
    // ignore
  }
}

export function clearDraft() {
  try {
    window.localStorage.removeItem(DRAFT_KEY)
  } catch {
    // ignore
  }
}

export const formatDateLabel = (date) =>
  date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })

export const formatTimeLabel = (date) =>
  date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  })
