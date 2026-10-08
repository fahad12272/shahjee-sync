import { useEffect, useRef, useState } from "react"
import {
  Bell,
  CalendarClock,
  CheckCircle2,
  Link2,
  Menu,
  Plus,
  Search,
  Trash2,
} from "lucide-react"

const activityMeta = {
  publish: { icon: CheckCircle2, style: "bg-emerald-50 text-emerald-600" },
  delete: { icon: Trash2, style: "bg-rose-50 text-rose-600" },
  edit: { icon: CalendarClock, style: "bg-indigo-50 text-indigo-600" },
  account: { icon: Link2, style: "bg-sky-50 text-sky-600" },
  info: { icon: Bell, style: "bg-slate-100 text-slate-600" },
}

export function Header({
  activities,
  onMarkActivitiesRead,
  onNewPost,
  onOpenMenu,
  onSearchSelect,
  pageTitle,
  posts,
  unreadCount,
}) {
  const [query, setQuery] = useState("")
  const [showResults, setShowResults] = useState(false)
  const [showBell, setShowBell] = useState(false)
  const searchRef = useRef(null)
  const bellRef = useRef(null)

  const trimmed = query.trim().toLowerCase()
  const results =
    trimmed.length > 0
      ? posts
          .filter((post) => post.title.toLowerCase().includes(trimmed))
          .slice(0, 5)
      : []

  useEffect(() => {
    const handleOutside = (event) => {
      const target = event.target
      if (searchRef.current && !searchRef.current.contains(target)) {
        setShowResults(false)
      }
      if (bellRef.current && !bellRef.current.contains(target)) {
        setShowBell(false)
      }
    }
    document.addEventListener("mousedown", handleOutside)
    return () => document.removeEventListener("mousedown", handleOutside)
  }, [])

  const toggleBell = () => {
    const next = !showBell
    setShowBell(next)
    if (next) onMarkActivitiesRead()
  }

  return (
    <header className="sticky top-0 z-30 flex h-20 items-center gap-4 border-b border-slate-200 bg-white/95 px-4 backdrop-blur md:px-8 lg:pl-10 lg:pr-8">
      <button
        aria-label="Open navigation"
        className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:bg-slate-50 lg:hidden"
        onClick={onOpenMenu}
        type="button"
      >
        <Menu className="size-5" />
      </button>

      <div className="min-w-0">
        <div className="truncate text-lg font-bold tracking-tight text-slate-900 md:text-xl">
          {pageTitle === "Calendar" ? "Content Calendar" : pageTitle}
        </div>
        <div className="hidden text-xs text-slate-500 sm:block">
          Manage your content workspace
        </div>
      </div>

      <div className="ml-auto flex items-center gap-2.5 md:gap-3">
        {/* Workspace search */}
        <div className="relative hidden lg:block" ref={searchRef}>
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400"
          />
          <input
            aria-label="Search workspace"
            className="h-11 w-72 rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100"
            onChange={(event) => {
              setQuery(event.target.value)
              setShowResults(true)
            }}
            onFocus={() => setShowResults(true)}
            placeholder="Search workspace..."
            type="search"
            value={query}
          />

          {showResults && trimmed.length > 0 && (
            <div className="absolute right-0 top-full z-50 mt-2 w-96 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl shadow-slate-300/40">
              {results.length > 0 ? (
                <>
                  <div className="border-b border-slate-100 px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    {results.length} {results.length === 1 ? "post" : "posts"}{" "}
                    found
                  </div>
                  {results.map((post) => (
                    <button
                      className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-slate-50"
                      key={post.id}
                      onClick={() => {
                        onSearchSelect(post.title)
                        setQuery("")
                        setShowResults(false)
                      }}
                      type="button"
                    >
                      <img
                        alt=""
                        className="size-9 shrink-0 rounded-lg object-cover ring-1 ring-slate-200"
                        src={post.image}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-semibold text-slate-800">
                          {post.title}
                        </div>
                        <div className="mt-0.5 text-xs text-slate-400">
                          {post.date} · {post.time}
                        </div>
                      </div>
                      <span
                        className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          post.status === "Published"
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-amber-50 text-amber-700"
                        }`}
                      >
                        {post.status}
                      </span>
                    </button>
                  ))}
                </>
              ) : (
                <div className="px-4 py-6 text-center text-sm text-slate-500">
                  No posts match “{query}”
                </div>
              )}
            </div>
          )}
        </div>

        {/* Notifications */}
        <div className="relative" ref={bellRef}>
          <button
            aria-label="Notifications"
            className="relative flex size-10 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-slate-900"
            onClick={toggleBell}
            type="button"
          >
            <Bell className="size-4.5" />
            {unreadCount > 0 && (
              <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-indigo-600 px-1 text-[10px] font-bold text-white ring-2 ring-white">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          {showBell && (
            <div className="absolute right-0 top-full z-50 mt-2 w-80 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl shadow-slate-300/40">
              <div className="border-b border-slate-100 px-4 py-3 text-sm font-bold text-slate-900">
                Notifications
              </div>
              {activities.length > 0 ? (
                <div className="max-h-80 overflow-y-auto">
                  {activities.map((activity) => {
                    const meta = activityMeta[activity.kind]
                    const Icon = meta.icon
                    return (
                      <div
                        className="flex items-start gap-3 border-b border-slate-50 px-4 py-3 last:border-0"
                        key={activity.id}
                      >
                        <span
                          className={`mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg ${meta.style}`}
                        >
                          <Icon className="size-4" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-semibold leading-5 text-slate-800">
                            {activity.message}
                          </div>
                          <div className="mt-0.5 text-xs text-slate-400">
                            {activity.time}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="px-4 py-8 text-center">
                  <Bell className="mx-auto size-6 text-slate-300" />
                  <p className="mt-2 text-sm text-slate-500">
                    No activity yet — publish a post or connect an account.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        <button
          className="flex h-10 items-center gap-2 rounded-xl bg-indigo-600 px-3.5 text-sm font-semibold text-white shadow-lg shadow-indigo-200 transition hover:bg-indigo-700 hover:shadow-indigo-300/70 md:h-11 md:px-4"
          onClick={onNewPost}
          type="button"
        >
          <Plus className="size-4.5" strokeWidth={2.5} />
          <span className="hidden sm:inline">New Post</span>
        </button>
      </div>
    </header>
  )
}