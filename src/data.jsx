import {
  AtSign,
  BarChart3,
  BriefcaseBusiness,
  CalendarClock,
  Camera,
  CirclePlay,
  Eye,
  Heart,
  Link2,
  Music2,
  PenLine,
  Repeat2,
  Settings,
  Users,
} from "lucide-react"
import {
  FaFacebookF,
  FaInstagram,
  FaLinkedinIn,
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
]

export const connectedAccounts = [
  {
    name: "Instagram",
    handle: "@shahjee.sync",
    status: "Connected",
    icon: FaInstagram,
    iconStyle:
      "bg-gradient-to-br from-violet-600 via-fuchsia-500 to-amber-400 text-white",
    accent: "group-hover:border-fuchsia-200",
  },
  {
    name: "YouTube",
    handle: "Shahjee Sync",
    status: "Connected",
    icon: FaYoutube,
    iconStyle: "bg-red-600 text-white",
    accent: "group-hover:border-red-200",
  },
  {
    name: "Facebook",
    handle: "Shahjee Sync Studio",
    status: "Connected",
    icon: FaFacebookF,
    iconStyle: "bg-blue-600 text-white",
    accent: "group-hover:border-blue-200",
  },
  {
    name: "LinkedIn",
    handle: "Shahjee Sync",
    status: "Not Connected",
    icon: FaLinkedinIn,
    iconStyle: "bg-sky-700 text-white",
    accent: "group-hover:border-sky-200",
  },
  {
    name: "TikTok",
    handle: "@shahjeesync",
    status: "Connected",
    icon: FaTiktok,
    iconStyle: "bg-slate-950 text-white",
    accent: "group-hover:border-slate-300",
  },
  {
    name: "X",
    handle: "No account linked",
    status: "Not Connected",
    icon: FaXTwitter,
    iconStyle: "bg-slate-950 text-white",
    accent: "group-hover:border-slate-300",
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
}

export const analyticsStats = [
  {
    label: "Total Reach",
    value: "284.6K",
    growth: "+14.2%",
    detail: "vs. previous 30 days",
    icon: Eye,
    iconStyle: "bg-indigo-50 text-indigo-600",
  },
  {
    label: "Cross-Posts Sent",
    value: "1,248",
    growth: "+8.7%",
    detail: "vs. previous 30 days",
    icon: Repeat2,
    iconStyle: "bg-sky-50 text-sky-600",
  },
  {
    label: "Engagement Rate",
    value: "7.86%",
    growth: "+14.2%",
    detail: "vs. previous 30 days",
    icon: Heart,
    iconStyle: "bg-rose-50 text-rose-600",
  },
]

export const engagementBreakdown = [
  {
    name: "Instagram",
    handle: "@shahjee.sync",
    icon: FaInstagram,
    iconStyle: "bg-gradient-to-br from-violet-600 via-fuchsia-500 to-amber-400",
    reach: "96.4K",
    likes: "12,840",
    comments: "1,264",
    change: "+18.4%",
  },
  {
    name: "YouTube",
    handle: "Shahjee Sync",
    icon: FaYoutube,
    iconStyle: "bg-red-600",
    reach: "72.8K",
    likes: "8,920",
    comments: "846",
    change: "+12.1%",
  },
  {
    name: "Facebook",
    handle: "Shahjee Sync Studio",
    icon: FaFacebookF,
    iconStyle: "bg-blue-600",
    reach: "61.2K",
    likes: "6,480",
    comments: "592",
    change: "+7.8%",
  },
]

export const chartData = [
  { label: "May 1", reach: "h-20", engagement: "h-10" },
  { label: "May 5", reach: "h-28", engagement: "h-14" },
  { label: "May 9", reach: "h-24", engagement: "h-12" },
  { label: "May 13", reach: "h-36", engagement: "h-20" },
  { label: "May 17", reach: "h-32", engagement: "h-16" },
  { label: "May 21", reach: "h-44", engagement: "h-24" },
  { label: "May 25", reach: "h-40", engagement: "h-20" },
]

export const platformKeyMap = {
  Instagram: "instagram",
  "YouTube Shorts": "youtube",
  Facebook: "facebook",
  TikTok: "tiktok",
  LinkedIn: "linkedin",
  X: "x",
}

export const readFileAsDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = reject
    reader.readAsDataURL(file)
  })

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

const postsKeyFor = (email) => `shahjee-sync-posts:${email}`

export function loadPosts(email) {
  try {
    const raw = window.localStorage.getItem(postsKeyFor(email))
    if (!raw) return queuedPosts
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed) || parsed.length === 0) return queuedPosts
    return parsed.map((post) => ({ ...post, id: post.id || createId() }))
  } catch {
    return queuedPosts
  }
}

export function savePosts(email, posts) {
  try {
    window.localStorage.setItem(postsKeyFor(email), JSON.stringify(posts))
  } catch {
    console.warn("Posts save nahi hui — storage full. Settings se reset karein.")
  }
}

export function clearStoredPosts(email) {
  try {
    window.localStorage.removeItem(postsKeyFor(email))
  } catch {
    // ignore
  }
}

export const accountToPlatform = {
  Instagram: "Instagram",
  YouTube: "YouTube Shorts",
  Facebook: "Facebook",
  TikTok: "TikTok",
  LinkedIn: "LinkedIn",
  X: "X",
}

const accountsKeyFor = (email) => `shahjee-sync-accounts:${email}`

export function loadAccounts(email) {
  try {
    const raw = window.localStorage.getItem(accountsKeyFor(email))
    if (!raw) return connectedAccounts
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return connectedAccounts
    return connectedAccounts.map((account) => {
      const saved = parsed.find((item) => item.name === account.name)
      return saved ? { ...account, status: saved.status } : account
    })
  } catch {
    return connectedAccounts
  }
}

export function saveAccounts(email, accounts) {
  try {
    const slim = accounts.map(({ name, status }) => ({ name, status }))
    window.localStorage.setItem(accountsKeyFor(email), JSON.stringify(slim))
  } catch {
    // ignore
  }
}

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