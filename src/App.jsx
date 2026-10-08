import { useEffect, useState } from "react"
import { Zap } from "lucide-react"
import { Sidebar } from "./components/Sidebar"
import { Header } from "./components/Header"
import { ToastContainer } from "./components/Toast"
import { CreatePost } from "./pages/CreatePost"
import { ConnectedAccounts } from "./pages/ConnectedAccounts"
import { ScheduledQueue } from "./pages/ScheduledQueue"
import { CalendarView } from "./pages/CalendarView"
import { AnalyticsPage } from "./pages/AnalyticsPage"
import { SettingsPage } from "./pages/SettingsPage"
import { LandingPage } from "./pages/LandingPage"
import { AuthPage } from "./pages/AuthPage"
import {
  apiMe,
  apiGetPosts,
  apiCreatePost,
  apiUpdatePost,
  apiDeletePost,
  getToken,
  removeToken,
} from "./api"
import {
  accountToPlatform,
  connectedAccounts,
  createId,
  loadAccounts,
  queuedPosts,
  saveAccounts,
} from "./data"

export default function App() {
  const [user, setUser] = useState(null)
  const [checkingAuth, setCheckingAuth] = useState(true)
  const [authView, setAuthView] = useState("landing")

  // Page load pe token check karo — valid hai to seedha workspace
  useEffect(() => {
    const checkSession = async () => {
      if (!getToken()) {
        setCheckingAuth(false)
        return
      }
      try {
        const userData = await apiMe()
        setUser(userData)
      } catch {
        removeToken()
      }
      setCheckingAuth(false)
    }
    checkSession()
  }, [])

  const handleAuth = (authenticated) => {
    setUser(authenticated)
  }

  const handleLogout = () => {
    removeToken()
    setUser(null)
    setAuthView("landing")
  }

  if (checkingAuth) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-200">
            <Zap className="size-7 fill-current" />
          </div>
          <p className="text-sm font-semibold text-slate-500">
            Loading your workspace...
          </p>
        </div>
      </div>
    )
  }

  if (!user) {
    if (authView === "landing") {
      return (
        <LandingPage
          onGetStarted={() => setAuthView("signup")}
          onLogin={() => setAuthView("login")}
        />
      )
    }
    return (
      <AuthPage
        mode={authView}
        onAuth={handleAuth}
        onBack={() => setAuthView("landing")}
        onSwitchMode={setAuthView}
      />
    )
  }

  return <WorkspaceApp key={user.email} onLogout={handleLogout} user={user} />
}

function WorkspaceApp({ onLogout, user }) {
  const [activePage, setActivePage] = useState("Create Post")
  const [mobileOpen, setMobileOpen] = useState(false)
  const [posts, setPosts] = useState([])
  const [accounts, setAccounts] = useState(() => loadAccounts(user.email))
  const [toasts, setToasts] = useState([])
  const [activities, setActivities] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [schedulePreset, setSchedulePreset] = useState(null)
  const [queueSearch, setQueueSearch] = useState(null)

  const removeToast = (id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id))
  }

  const showToast = (message, type = "success", action) => {
    const id = createId()
    setToasts((current) => [
      ...current.slice(-2),
      { id, message, type, action },
    ])
    window.setTimeout(() => removeToast(id), action ? 6000 : 3200)
  }

  const addActivity = (message, kind) => {
    const time = new Date().toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    })
    setActivities((current) =>
      [{ id: createId(), message, time, kind }, ...current].slice(0, 12),
    )
    setUnreadCount((current) => current + 1)
  }

  // Accounts abhi localStorage pe hain (Day 10 mein API pe jayenge)
  useEffect(() => {
    saveAccounts(user.email, accounts)
  }, [accounts, user.email])

  // Posts BACKEND SE load karo 🚀
  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const data = await apiGetPosts()
        setPosts(data)
      } catch (error) {
        showToast(error.message, "error")
      }
    }
    fetchPosts()
  }, [])

  useEffect(() => {
    const title = activePage === "Calendar" ? "Content Calendar" : activePage
    document.title = `${title} — Shahjee Sync`
  }, [activePage])

  const connectedPlatforms = accounts
    .filter((account) => account.status === "Connected")
    .map((account) => accountToPlatform[account.name])
    .filter((platform) => Boolean(platform))

  const restorePosts = async (removedList) => {
    try {
      const created = []
      for (const removed of removedList) {
        const { id, ...postData } = removed
        created.push(await apiCreatePost(postData))
      }
      setPosts((current) => [...created, ...current])
      showToast("Deleted posts restored")
    } catch (error) {
      showToast(error.message, "error")
    }
  }

  const handlePublish = async (post) => {
    try {
      const { id, ...postData } = post
      const savedPost = await apiCreatePost(postData)
      setPosts((current) => [savedPost, ...current])
      setActivePage("Scheduled Queue")
      showToast(
        savedPost.status === "Published"
          ? "Post published successfully"
          : "Post added to your publishing queue",
      )
      addActivity(
        savedPost.status === "Published"
          ? `“${savedPost.title}” was published`
          : `“${savedPost.title}” was scheduled for ${savedPost.date}`,
        "publish",
      )
    } catch (error) {
      showToast(error.message, "error")
    }
  }

  const handleDeletePost = async (id) => {
    const removed = posts.find((post) => post.id === id)
    if (!removed) return
    try {
      await apiDeletePost(id)
      setPosts((current) => current.filter((post) => post.id !== id))
      showToast("Post deleted", "info", {
        label: "Undo",
        onClick: () => restorePosts([removed]),
      })
      addActivity(`“${removed.title}” was deleted`, "delete")
    } catch (error) {
      showToast(error.message, "error")
    }
  }

  const handleBulkDelete = async (ids) => {
    const removed = posts.filter((post) => ids.includes(post.id))
    if (removed.length === 0) return
    try {
      await Promise.all(ids.map((id) => apiDeletePost(id)))
      setPosts((current) => current.filter((post) => !ids.includes(post.id)))
      showToast(
        `${removed.length} ${removed.length === 1 ? "post" : "posts"} deleted`,
        "info",
        { label: "Undo", onClick: () => restorePosts(removed) },
      )
      addActivity(
        `${removed.length} ${removed.length === 1 ? "post was" : "posts were"} deleted`,
        "delete",
      )
    } catch (error) {
      showToast(error.message, "error")
    }
  }

  const handleDuplicatePost = async (id) => {
    const original = posts.find((post) => post.id === id)
    if (!original) return
    try {
      const { id: _, ...copyData } = original
      const copy = await apiCreatePost({
        ...copyData,
        title: `${original.title} (Copy)`,
        status: "Pending",
      })
      setPosts((current) => [copy, ...current])
      showToast("Post duplicated as Pending")
      addActivity(`“${original.title}” was duplicated`, "info")
    } catch (error) {
      showToast(error.message, "error")
    }
  }

  const handleEditPost = async (id, title) => {
    try {
      await apiUpdatePost(id, { title })
      setPosts((current) =>
        current.map((post) => (post.id === id ? { ...post, title } : post)),
      )
      showToast("Post updated")
      addActivity(`A post was renamed to “${title}”`, "edit")
    } catch (error) {
      showToast(error.message, "error")
    }
  }

  const handleReschedulePost = async (id, date, time) => {
    try {
      await apiUpdatePost(id, { date, time, status: "Pending" })
      setPosts((current) =>
        current.map((post) =>
          post.id === id ? { ...post, date, time, status: "Pending" } : post,
        ),
      )
      showToast(`Rescheduled to ${date}, ${time}`)
      addActivity(`A post was rescheduled to ${date}, ${time}`, "edit")
    } catch (error) {
      showToast(error.message, "error")
    }
  }

  const handleToggleAccount = (name) => {
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
    addActivity(
      willConnect
        ? `${name} account was connected`
        : `${name} account was disconnected`,
      "account",
    )
  }

  const handleResetData = async () => {
    try {
      // Purani posts delete karo (backend se)
      await Promise.all(posts.map((post) => apiDeletePost(post.id)))
      // Demo posts backend mein banao
      const created = []
      for (const demo of queuedPosts) {
        const { id, ...postData } = demo
        created.push(await apiCreatePost(postData))
      }
      setPosts(created)
      setActivePage("Scheduled Queue")
      showToast("Demo data restored", "info")
      addActivity("Workspace data was reset", "info")
    } catch (error) {
      showToast(error.message, "error")
    }
  }

  const handleExportData = () => {
    const payload = {
      version: 1,
      exportedAt: new Date().toISOString(),
      posts,
    }
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `shahjee-sync-backup-${new Date()
      .toISOString()
      .slice(0, 10)}.json`
    link.click()
    URL.revokeObjectURL(url)
    showToast("Backup downloaded")
  }

  const handleImportData = async (file) => {
    try {
      const text = await file.text()
      const parsed = JSON.parse(text)
      const incoming = Array.isArray(parsed) ? parsed : parsed?.posts

      if (!Array.isArray(incoming)) throw new Error("invalid")

      const cleaned = incoming
        .filter(
          (item) =>
            Boolean(item) &&
            typeof item.title === "string" &&
            Array.isArray(item.platforms),
        )
        .map((item) => ({
          title: String(item.title),
          image:
            typeof item.image === "string"
              ? item.image
              : "https://images.unsplash.com/photo-1615494487949-f5f68968330e?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&q=80&w=160&h=160",
          platforms: item.platforms.map(String),
          date: typeof item.date === "string" ? item.date : "No date",
          time: typeof item.time === "string" ? item.time : "—",
          status: item.status === "Published" ? "Published" : "Pending",
        }))

      if (cleaned.length === 0) throw new Error("empty")

      const created = []
      for (const postData of cleaned) {
        created.push(await apiCreatePost(postData))
      }

      setPosts((current) => [...created, ...current])
      setActivePage("Scheduled Queue")
      showToast(`Imported ${created.length} posts`)
      addActivity(`Backup imported (${created.length} posts)`, "info")
    } catch {
      showToast("Import failed — invalid backup file", "error")
    }
  }

  const handleCalendarAdd = (date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const day = String(date.getDate()).padStart(2, "0")
    setSchedulePreset({
      value: `${year}-${month}-${day}T12:00`,
      key: createId(),
    })
    setActivePage("Create Post")
  }

  const handleSearchSelect = (query) => {
    setQueueSearch({ value: query, key: createId() })
    setActivePage("Scheduled Queue")
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Sidebar
        activePage={activePage}
        mobileOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
        onLogout={onLogout}
        onNavigate={setActivePage}
        user={user}
      />
      <div className="flex min-h-screen flex-col lg:pl-72">
        <Header
          activities={activities}
          onMarkActivitiesRead={() => setUnreadCount(0)}
          onNewPost={() => setActivePage("Create Post")}
          onOpenMenu={() => setMobileOpen(true)}
          onSearchSelect={handleSearchSelect}
          pageTitle={activePage}
          posts={posts}
          unreadCount={unreadCount}
        />
        {activePage === "Connected Accounts" ? (
          <ConnectedAccounts
            accounts={accounts}
            onToggleAccount={handleToggleAccount}
          />
        ) : activePage === "Scheduled Queue" ? (
          <ScheduledQueue
            initialSearch={queueSearch}
            onBulkDelete={handleBulkDelete}
            onDeletePost={handleDeletePost}
            onDuplicatePost={handleDuplicatePost}
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
          <SettingsPage
            onExportData={handleExportData}
            onImportData={handleImportData}
            onResetData={handleResetData}
            user={user}
          />
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