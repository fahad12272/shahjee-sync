import { useEffect, useRef, useState } from "react"
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
  apiGetPlatforms,
  getToken,
  removeToken,
} from "./api"
import {
  createId,
  queuedPosts,
} from "./data"
import {
  ForgotPasswordPage,
  ResetPasswordPage,
} from "./pages/PasswordPages"

// Post Now publish status ka localStorage key — RELOAD FIX: page refresh
// hone par bhi publishing pill / result popup gayab nahi hota
const PUBLISH_STORAGE_KEY = "shahjee_publish_status"

export default function App() {
  const [user, setUser] = useState(null)
  const [checkingAuth, setCheckingAuth] = useState(true)
  const [authView, setAuthView] = useState(() => {
    // Email ke reset link (/reset?token=...) pe seedha reset page khule
    if (
      typeof window !== "undefined" &&
      window.location.pathname === "/reset" &&
      new URLSearchParams(window.location.search).get("token")
    ) {
      return "reset"
    }
    return "landing"
  })

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

  // API layer jab 401 (session expire) detect karti hai to ye event bhejti hai —
  // user ko seedha login page pe le jao, workspace ke broken pages pe mat atko
  useEffect(() => {
    const onSessionExpired = () => {
      removeToken()
      setUser(null)
      setAuthView("login")
    }
    window.addEventListener("shahjee-sync:session-expired", onSessionExpired)
    return () =>
      window.removeEventListener(
        "shahjee-sync:session-expired",
        onSessionExpired,
      )
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
    if (authView === "forgot") {
      return <ForgotPasswordPage onBack={() => setAuthView("login")} />
    }
    if (authView === "reset") {
      return (
        <ResetPasswordPage
          token={new URLSearchParams(window.location.search).get("token")}
          onSuccess={() => {
            // URL se token hata ke login pe le jao
            window.history.replaceState({}, "", "/")
            setAuthView("login")
          }}
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

return <WorkspaceApp key={user.email} onLogout={handleLogout} onUserUpdated={setUser} user={user} />
}

function WorkspaceApp({ onLogout, onUserUpdated, user }) {
  const [activePage, setActivePage] = useState("Create Post")
  const [mobileOpen, setMobileOpen] = useState(false)
  const [posts, setPosts] = useState([])
  // Platform connections — BACKEND se (X / Telegram), localStorage mock nahi
  const [platforms, setPlatforms] = useState(null)
  const [toasts, setToasts] = useState([])
  const [activities, setActivities] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [schedulePreset, setSchedulePreset] = useState(null)
  const [queueSearch, setQueueSearch] = useState(null)
  // Post Now background publish status — ScheduledQueue isse result popup
  // dikhati hai. stage: "publishing" | "done" | "error"
  const [publishStatus, setPublishStatus] = useState(null)
  // Activity feed dedupe — promise path aur polling path dono finish kar sakte
  // hain; ek hi post ke liye "was published" entry do dafa na aaye
  const announcedPublishes = useRef(new Set())

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

  const fetchPlatforms = async () => {
    try {
      const data = await apiGetPlatforms()
      setPlatforms(data)
    } catch {
      // Fail ho to khali state — CreatePost cards disabled rahenge
      setPlatforms({})
    }
  }

  // Platform connections load karo (connect/disconnect ke baad bhi refresh)
  useEffect(() => {
    fetchPlatforms()
  }, [])

  // Posts BACKEND SE load karo 🚀
  const fetchPosts = async ({ silent = false } = {}) => {
    try {
      const data = await apiGetPosts()
      setPosts(data)
    } catch (error) {
      // Silent refresh (polling) pe toast spam na ho — sirf pehli load pe error dikhao
      if (!silent) showToast(error.message, "error")
    }
  }

  useEffect(() => {
    fetchPosts()
  }, [])

  // AUTO-REFRESH: cron job background mein scheduled post publish karta hai,
  // lekin khule hue page ko iski khabar nahi hoti — isliye har 15 second
  // chhupke se dobara fetch karo. + tab/window pe wapas aane pe turant refresh.
  // (Pending → Published green chip ab bina manual refresh ke nazar aayegi)
  useEffect(() => {
    const silentRefresh = () => fetchPosts({ silent: true })
    const interval = setInterval(silentRefresh, 15000)
    const refreshOnVisible = () => {
      if (document.visibilityState === "visible") silentRefresh()
    }
    document.addEventListener("visibilitychange", refreshOnVisible)
    window.addEventListener("focus", refreshOnVisible)
    return () => {
      clearInterval(interval)
      document.removeEventListener("visibilitychange", refreshOnVisible)
      window.removeEventListener("focus", refreshOnVisible)
    }
  }, [])

  useEffect(() => {
    const title = activePage === "Calendar" ? "Content Calendar" : activePage
    document.title = `${title} — Shahjee Sync`
  }, [activePage])

  // RELOAD FIX (1/3): publishStatus ka har change localStorage mein save karo —
  // refresh ke baad bhi publishing pill aur result popup wapas milta hai
  useEffect(() => {
    try {
      if (publishStatus) {
        window.localStorage.setItem(
          PUBLISH_STORAGE_KEY,
          JSON.stringify(publishStatus),
        )
      } else {
        window.localStorage.removeItem(PUBLISH_STORAGE_KEY)
      }
    } catch {
      // localStorage unavailable — sirf refresh-recovery nahi hogi, baaki sab chalega
    }
  }, [publishStatus])

  // RELOAD FIX (2/3): page load pe last publish status wapis lao.
  //  - "publishing" 2 minute tak fresh ho to pill wapis + polling resume
  //  - "done"/"error" popup 1 ghante tak dobara dikha sakte hain (jab tak
  //    user "Got it" na dabaaye)
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(PUBLISH_STORAGE_KEY)
      if (!raw) return
      const saved = JSON.parse(raw)
      if (
        !saved ||
        !["publishing", "done", "error"].includes(saved.stage)
      ) {
        window.localStorage.removeItem(PUBLISH_STORAGE_KEY)
        return
      }
      const age = Date.now() - (saved.startedAt || 0)
      if (saved.stage === "publishing") {
        if (age <= 120000) {
          setPublishStatus(saved)
        } else {
          // Bahut purana publishing record — ab wait ka matlab nahi; post list
          // ke status chips final result dikha dete hain
          window.localStorage.removeItem(PUBLISH_STORAGE_KEY)
        }
      } else if (age <= 3600000) {
        setPublishStatus(saved)
      } else {
        window.localStorage.removeItem(PUBLISH_STORAGE_KEY)
      }
    } catch {
      try {
        window.localStorage.removeItem(PUBLISH_STORAGE_KEY)
      } catch {
        // ignore
      }
    }
  }, [])

  // RELOAD FIX (3/3): agar publish ke dauran page refresh ho gaya to original
  // request ka jawab kabhi nahi milega. Stage "publishing" ke dauran backend
  // se post ka publishResults poll karo — mukammal hote hi result popup khud
  // aa jayega (chahe user ne beech mein page refresh kar liya ho)
  useEffect(() => {
    if (publishStatus?.stage !== "publishing") return undefined
    let cancelled = false
    const startedAt = publishStatus.startedAt || Date.now()

    const finish = (post) => {
      if (cancelled) return
      cancelled = true
      setPosts((current) =>
        current.map((p) => (p.id === post.id ? { ...p, ...post } : p)),
      )
      if (!announcedPublishes.current.has(post.id)) {
        announcedPublishes.current.add(post.id)
        addActivity(`“${post.title}” was published`, "publish")
      }
      setPublishStatus({
        stage: "done",
        savedPost: post,
        title: post.title,
        startedAt,
        finishedAt: Date.now(),
      })
    }

    const check = async () => {
      if (cancelled) return
      // 2 minute se zyada wait ho gaya — polling band karo, clear message do
      if (Date.now() - startedAt > 120000) {
        cancelled = true
        setPublishStatus({
          stage: "error",
          title: publishStatus.title,
          message:
            "Publish result confirm nahi hua (timeout) — Scheduled Queue mein post ke status chips se final result check karein.",
        })
        return
      }
      try {
        const data = await apiGetPosts()
        if (cancelled) return
        let match = null
        if (publishStatus.postId) {
          match =
            data.find(
              (p) =>
                p.id === publishStatus.postId &&
                Array.isArray(p.publishResults) &&
                p.publishResults.length > 0,
            ) || null
        } else {
          // postId abhi pata nahi (reload recovery) — same title ki nayi post
          // jiske publishResults bhar chuke hain, usay adopt karo
          match =
            data.find(
              (p) =>
                p.title === publishStatus.title &&
                Array.isArray(p.publishResults) &&
                p.publishResults.length > 0,
            ) || null
        }
        if (match) finish(match)
      } catch {
        // network hiccup — agli polling try karegi
      }
    }

    const timer = setTimeout(check, 2000)
    const interval = setInterval(check, 4000)
    return () => {
      cancelled = true
      clearTimeout(timer)
      clearInterval(interval)
    }
  }, [
    publishStatus?.stage,
    publishStatus?.postId,
    publishStatus?.title,
    publishStatus?.startedAt,
  ])

  // OAuth se wapas aane pe result toast (?x= ?fb= ?ig= ?threads= ?li= — connected ya failed&reason=...)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const labels = {
      x: "X",
      fb: "Facebook",
      ig: "Instagram",
      threads: "Threads",
      li: "LinkedIn",
    }
    const key = Object.keys(labels).find((k) => params.get(k))
    if (!key) return
    const result = params.get(key)
    const label = labels[key]
    window.history.replaceState({}, "", "/")
    if (result === "connected") {
      showToast(
        `${label} connected — ab scheduled posts is platform pe publish hongi! 🎉`,
        "success",
      )
      addActivity(`${label} account was connected`, "account")
    } else if (result === "failed") {
      showToast(
        `${label} connect fail — ${params.get("reason") || "dobara try karo"}`,
        "error",
      )
    }
    fetchPlatforms()
  }, [])

  // Real connected platforms — backend keys se display names banao
  const connectedPlatforms = platforms
    ? [
        platforms.x?.connected ? "X" : null,
        platforms.telegram?.connected ? "Telegram" : null,
        platforms.facebook?.connected ? "Facebook" : null,
        platforms.instagram?.connected ? "Instagram" : null,
        platforms.threads?.connected ? "Threads" : null,
        platforms.linkedin?.connected ? "LinkedIn" : null,
      ].filter(Boolean)
    : []

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

  // UX FIX: pehle handlePublish backend ke poore publish (Threads polling 16s+)
  // ka wait karta tha — user Create Post page pe atka rehta tha. Ab FORAN
  // Scheduled Queue pe le jao, publish background mein chale, aur mukammal
  // hone par queue page pe khud result popup khul jaye.
  // startedAt record karta hai taake popup user ko bata sake ke kitna time
  // lagega (live timer) aur mukammal hone par kitna waqt laga
  const handlePublish = (post) => {
    const { id, ...postData } = post
    // Dono modes mein pehle hi queue pe le jao — koi intezaar nahi
    setActivePage("Scheduled Queue")

    // Scheduled post (Pending) — backend sirf save karta hai, publish nahi hoti,
    // request foran mukammal hoti hai. Background mein hi save kafi hai.
    if (postData.status !== "Published") {
      apiCreatePost(postData)
        .then((savedPost) => {
          setPosts((current) => [savedPost, ...current])
          showToast(`Post scheduled for ${savedPost.date}`)
          addActivity(
            `“${savedPost.title}” was scheduled for ${savedPost.date}`,
            "publish",
          )
        })
        .catch((error) => showToast(error.message, "error"))
      return
    }

    // Post Now — publish background mein, user queue browse karta rehta hai
    const startedAt = Date.now()
    setPublishStatus({
      stage: "publishing",
      title: postData.title,
      postId: null,
      startedAt,
    })
    ;(async () => {
      try {
        const savedPost = await apiCreatePost(postData)
        setPosts((current) => [savedPost, ...current])
        if (!announcedPublishes.current.has(savedPost.id)) {
          announcedPublishes.current.add(savedPost.id)
          addActivity(`“${savedPost.title}” was published`, "publish")
        }
        // Agar user ne beech mein reload kar liya ho to ye state kho jati hai
        // (localStorage publishing record hi bachata hai) — isliye sirf tab
        // update karo jab publishing stage abhi bhi chal raha ho
        setPublishStatus((current) =>
          current && current.stage === "publishing"
            ? {
                stage: "done",
                savedPost,
                title: savedPost.title,
                startedAt,
                finishedAt: Date.now(),
              }
            : current,
        )
      } catch (error) {
        setPublishStatus({
          stage: "error",
          title: postData.title,
          message: error.message,
          startedAt,
        })
      }
    })()
  }

  const clearPublishStatus = () => setPublishStatus(null)

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
      // Future schedule rakho; past/published wala clear karo
      // warna cron copy ko turant publish kar dega
      const keepSchedule =
        copyData.scheduledAt && new Date(copyData.scheduledAt) > new Date()
      const copy = await apiCreatePost({
        ...copyData,
        title: `${original.title} (Copy)`,
        status: "Pending",
        scheduledAt: keepSchedule ? copyData.scheduledAt : null,
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

  const handleReschedulePost = async (id, date, time, scheduledAt) => {
    try {
      await apiUpdatePost(id, {
        date,
        time,
        status: "Pending",
        // Cron exact isi time pe publish karega — purana scheduledAt overwrite zaroori
        scheduledAt: scheduledAt || null,
      })
      setPosts((current) =>
        current.map((post) =>
          post.id === id
            ? {
                ...post,
                date,
                time,
                status: "Pending",
                scheduledAt: scheduledAt || null,
              }
            : post,
        ),
      )
      showToast(`Rescheduled to ${date}, ${time}`)
      addActivity(`A post was rescheduled to ${date}, ${time}`, "edit")
    } catch (error) {
      showToast(error.message, "error")
    }
  }
  const handlePlatformsChanged = () => {
    fetchPlatforms()
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
        .map((item) => {
          // FIX: scheduledAt preserve karo — warna imported scheduled posts ka
          // exact publish time kho jata hai (cron scheduledAt null ko skip karta hai)
          const parsedSchedule =
            typeof item.scheduledAt === "string" && item.scheduledAt
              ? new Date(item.scheduledAt)
              : null
          return {
            title: String(item.title),
            caption: typeof item.caption === "string" ? item.caption : "",
            image:
              typeof item.image === "string"
                ? item.image
                : "https://images.unsplash.com/photo-1615494487949-f5f68968330e?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&q=80&w=160&h=160",
            platforms: item.platforms.map(String),
            date: typeof item.date === "string" ? item.date : "No date",
            time: typeof item.time === "string" ? item.time : "—",
            status: item.status === "Published" ? "Published" : "Pending",
            scheduledAt:
              parsedSchedule && !Number.isNaN(parsedSchedule.getTime())
                ? parsedSchedule.toISOString()
                : null,
          }
        })

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
            addActivity={addActivity}
            onPlatformsChanged={handlePlatformsChanged}
            showToast={showToast}
          />
        ) : activePage === "Scheduled Queue" ? (
          <ScheduledQueue
            initialSearch={queueSearch}
            onBulkDelete={handleBulkDelete}
            onClosePublishStatus={clearPublishStatus}
            onDeletePost={handleDeletePost}
            onDuplicatePost={handleDuplicatePost}
            onEditPost={handleEditPost}
            onOpenCalendar={() => setActivePage("Calendar")}
            onReschedulePost={handleReschedulePost}
            posts={posts}
            publishStatus={publishStatus}
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
            onProfileUpdated={onUserUpdated}
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
