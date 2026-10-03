import { useEffect, useState } from "react"
import { Sidebar } from "./components/Sidebar"
import { Header } from "./components/Header"
import {
  ToastContainer,
  type ToastItem,
  type ToastType,
} from "./components/Toast"
import { CreatePost } from "./pages/CreatePost"
import { ConnectedAccounts } from "./pages/ConnectedAccounts"
import { ScheduledQueue } from "./pages/ScheduledQueue"
import { CalendarView } from "./pages/CalendarView"
import { AnalyticsPage } from "./pages/AnalyticsPage"
import { SettingsPage } from "./pages/SettingsPage"
import {
  accountToPlatform,
  clearStoredPosts,
  connectedAccounts,
  createId,
  loadAccounts,
  loadPosts,
  queuedPosts,
  saveAccounts,
  savePosts,
  type Post,
} from "./data"

export default function App() {
  const [activePage, setActivePage] = useState("Create Post")
  const [mobileOpen, setMobileOpen] = useState(false)
  const [posts, setPosts] = useState<Post[]>(loadPosts)
  const [accounts, setAccounts] = useState(loadAccounts)
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const [schedulePreset, setSchedulePreset] = useState<{
    value: string
    key: string
  } | null>(null)

  useEffect(() => {
    savePosts(posts)
  }, [posts])

  useEffect(() => {
    saveAccounts(accounts)
  }, [accounts])

  const removeToast = (id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id))
  }

  const showToast = (message: string, type: ToastType = "success") => {
    const id = createId()
    setToasts((current) => [...current.slice(-2), { id, message, type }])
    window.setTimeout(() => removeToast(id), 3200)
  }

  const connectedPlatforms = accounts
    .filter((account) => account.status === "Connected")
    .map((account) => accountToPlatform[account.name])
    .filter((platform): platform is string => Boolean(platform))

  const handlePublish = (post: Post) => {
    setPosts((current) => [post, ...current])
    setActivePage("Scheduled Queue")
    showToast("Post added to your publishing queue")
  }

  const handleDeletePost = (id: string) => {
    setPosts((current) => current.filter((post) => post.id !== id))
    showToast("Post deleted", "info")
  }

  const handleEditPost = (id: string, title: string) => {
    setPosts((current) =>
      current.map((post) => (post.id === id ? { ...post, title } : post)),
    )
    showToast("Post updated")
  }

  const handleReschedulePost = (id: string, date: string, time: string) => {
    setPosts((current) =>
      current.map((post) =>
        post.id === id ? { ...post, date, time, status: "Pending" } : post,
      ),
    )
    showToast(`Rescheduled to ${date}, ${time}`)
  }

  const handleToggleAccount = (name: string) => {
    const target = accounts.find((account) => account.name === name)
    const willConnect = target?.status !== "Connected"

    setAccounts((current) =>
      current.map((account) =>
        account.name === name
          ? {
              ...account,
              status: willConnect ? "Connected" : "Not Connected",
            }
          : account,
      ),
    )

    showToast(
      willConnect ? `${name} connected` : `${name} disconnected`,
      willConnect ? "success" : "info",
    )
  }

  const handleResetData = () => {
    clearStoredPosts()
    setPosts(queuedPosts)
    setAccounts(connectedAccounts)
    setActivePage("Scheduled Queue")
    showToast("Demo data restored", "info")
  }

  const handleCalendarAdd = (date: Date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const day = String(date.getDate()).padStart(2, "0")
    setSchedulePreset({
      value: `${year}-${month}-${day}T12:00`,
      key: createId(),
    })
    setActivePage("Create Post")
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Sidebar
        activePage={activePage}
        mobileOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
        onNavigate={setActivePage}
      />
      <div className="flex min-h-screen flex-col lg:pl-72">
        <Header
          onNewPost={() => setActivePage("Create Post")}
          onOpenMenu={() => setMobileOpen(true)}
          pageTitle={activePage}
        />
        {activePage === "Connected Accounts" ? (
          <ConnectedAccounts
            accounts={accounts}
            onToggleAccount={handleToggleAccount}
          />
        ) : activePage === "Scheduled Queue" ? (
          <ScheduledQueue
            onDeletePost={handleDeletePost}
            onEditPost={handleEditPost}
            onOpenCalendar={() => setActivePage("Calendar")}
            onReschedulePost={handleReschedulePost}
            posts={posts}
          />
        ) : activePage === "Calendar" ? (
          <CalendarView
            onAddPost={handleCalendarAdd}
            onBack={() => setActivePage("Scheduled Queue")}
            posts={posts}
          />
        ) : activePage === "Analytics" ? (
          <AnalyticsPage posts={posts} />
        ) : activePage === "Settings" ? (
          <SettingsPage onResetData={handleResetData} />
        ) : (
          <CreatePost
            connectedPlatforms={connectedPlatforms}
            onPublish={handlePublish}
            pageTitle={activePage}
            schedulePreset={schedulePreset}
          />
        )}
      </div>

      <ToastContainer onDismiss={removeToast} toasts={toasts} />
    </div>
  )
}