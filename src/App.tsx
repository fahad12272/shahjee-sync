import { useEffect, useState } from "react"
import { Sidebar } from "./components/Sidebar"
import { Header } from "./components/Header"
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

  useEffect(() => {
    savePosts(posts)
  }, [posts])

  useEffect(() => {
    saveAccounts(accounts)
  }, [accounts])

  const connectedPlatforms = accounts
    .filter((account) => account.status === "Connected")
    .map((account) => accountToPlatform[account.name])
    .filter((platform): platform is string => Boolean(platform))

  const handlePublish = (post: Post) => {
    setPosts((current) => [post, ...current])
    setActivePage("Scheduled Queue")
  }

  const handleDeletePost = (id: string) => {
    setPosts((current) => current.filter((post) => post.id !== id))
  }

  const handleToggleAccount = (name: string) => {
    setAccounts((current) =>
      current.map((account) =>
        account.name === name
          ? {
              ...account,
              status:
                account.status === "Connected"
                  ? "Not Connected"
                  : "Connected",
            }
          : account,
      ),
    )
  }

  const handleResetData = () => {
    clearStoredPosts()
    setPosts(queuedPosts)
    setAccounts(connectedAccounts)
    setActivePage("Scheduled Queue")
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
            onOpenCalendar={() => setActivePage("Calendar")}
            posts={posts}
          />
        ) : activePage === "Calendar" ? (
          <CalendarView
            onBack={() => setActivePage("Scheduled Queue")}
            posts={posts}
          />
        ) : activePage === "Analytics" ? (
          <AnalyticsPage />
        ) : activePage === "Settings" ? (
          <SettingsPage onResetData={handleResetData} />
        ) : (
          <CreatePost
            connectedPlatforms={connectedPlatforms}
            onPublish={handlePublish}
            pageTitle={activePage}
          />
        )}
      </div>
    </div>
  )
}