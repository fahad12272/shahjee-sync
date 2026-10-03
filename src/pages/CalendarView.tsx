import { useMemo, useState } from "react"
import {
  CalendarCheck,
  CalendarClock,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Plus,
  X,
} from "lucide-react"
import { platformIconMap, type Post } from "../data"

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

const statusChip: Record<string, string> = {
  Pending: "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100",
  Published:
    "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100",
  Failed: "border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100",
}

const statusDot: Record<string, string> = {
  Pending: "bg-amber-500",
  Published: "bg-emerald-500",
  Failed: "bg-rose-500",
}

const statusBadge: Record<string, string> = {
  Pending: "bg-amber-50 text-amber-700",
  Published: "bg-emerald-50 text-emerald-700",
  Failed: "bg-rose-50 text-rose-700",
}

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

function dateKey(date: Date) {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`
}

export function CalendarView({
  posts,
  onAddPost,
  onBack,
}: {
  posts: Post[]
  onAddPost: (date: Date) => void
  onBack: () => void
}) {
  const [viewDate, setViewDate] = useState(() =>
    posts.length > 0 ? new Date(posts[0].date) : new Date(),
  )
  const [selectedPost, setSelectedPost] = useState<Post | null>(null)

  const year = viewDate.getFullYear()
  const month = viewDate.getMonth()
  const today = new Date()

  const cells = useMemo(() => {
    const firstWeekday = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const daysInPrevMonth = new Date(year, month, 0).getDate()

    const result: { date: Date; inMonth: boolean }[] = []

    for (let i = firstWeekday - 1; i >= 0; i--) {
      result.push({
        date: new Date(year, month - 1, daysInPrevMonth - i),
        inMonth: false,
      })
    }
    for (let day = 1; day <= daysInMonth; day++) {
      result.push({ date: new Date(year, month, day), inMonth: true })
    }
    let nextDay = 1
    while (result.length < 42) {
      result.push({ date: new Date(year, month + 1, nextDay), inMonth: false })
      nextDay += 1
    }
    return result
  }, [year, month])

  const postsByDay = useMemo(() => {
    const map = new Map<string, Post[]>()
    posts.forEach((post) => {
      const date = new Date(post.date)
      if (Number.isNaN(date.getTime())) return
      const key = dateKey(date)
      map.set(key, [...(map.get(key) ?? []), post])
    })
    return map
  }, [posts])

  const monthStats = useMemo(() => {
    let pending = 0
    let published = 0
    posts.forEach((post) => {
      const date = new Date(post.date)
      if (date.getFullYear() === year && date.getMonth() === month) {
        if (post.status === "Published") {
          published += 1
        } else {
          pending += 1
        }
      }
    })
    return { pending, published }
  }, [posts, year, month])

  const goPrev = () => setViewDate(new Date(year, month - 1, 1))
  const goNext = () => setViewDate(new Date(year, month + 1, 1))
  const goToday = () => setViewDate(new Date())

  return (
    <main className="flex-1 bg-slate-50 px-4 py-7 md:px-8 md:py-10 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <div className="mb-7 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div>
            <button
              className="mb-3 inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 transition hover:text-indigo-700"
              onClick={onBack}
              type="button"
            >
              <ChevronLeft className="size-3.5" />
              Back to queue
            </button>
            <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-indigo-600">
              <CalendarDays className="size-3.5" />
              Publishing workflow
            </div>
            <div className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
              Content Calendar
            </div>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Hover any date and press + to schedule a post instantly.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
              <div className="flex size-9 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                <CalendarClock className="size-4.5" />
              </div>
              <div>
                <div className="text-sm font-bold text-slate-900">
                  {monthStats.pending}
                </div>
                <div className="text-xs text-slate-500">
                  Pending this month
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
              <div className="flex size-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                <CalendarCheck className="size-4.5" />
              </div>
              <div>
                <div className="text-sm font-bold text-slate-900">
                  {monthStats.published}
                </div>
                <div className="text-xs text-slate-500">
                  Published this month
                </div>
              </div>
            </div>
          </div>
        </div>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col justify-between gap-4 border-b border-slate-200 p-4 sm:flex-row sm:items-center sm:px-5">
            <div className="flex flex-wrap items-center gap-4">
              <div className="text-base font-bold text-slate-900">
                {viewDate.toLocaleDateString("en-US", {
                  month: "long",
                  year: "numeric",
                })}
              </div>
              <div className="flex items-center gap-4 text-xs font-medium text-slate-500">
                <span className="flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-amber-500" />
                  Pending
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-emerald-500" />
                  Published
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                aria-label="Previous month"
                className="flex size-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-slate-900"
                onClick={goPrev}
                type="button"
              >
                <ChevronLeft className="size-4" />
              </button>
              <button
                className="flex h-9 items-center rounded-lg border border-slate-200 px-3.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                onClick={goToday}
                type="button"
              >
                Today
              </button>
              <button
                aria-label="Next month"
                className="flex size-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-slate-900"
                onClick={goNext}
                type="button"
              >
                <ChevronRight className="size-4" />
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <div className="min-w-3xl">
              <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-100/80">
                {WEEKDAYS.map((day) => (
                  <div
                    className="px-3 py-2.5 text-[11px] font-bold uppercase tracking-wider text-slate-500"
                    key={day}
                  >
                    {day}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7">
                {cells.map(({ date, inMonth }, index) => {
                  const dayPosts = postsByDay.get(dateKey(date)) ?? []
                  const isToday = isSameDay(date, today)
                  const isLastRow = index >= 35

                  return (
                    <div
                      className={`group min-h-24 p-2 ${index % 7 !== 6 ? "border-r border-slate-100" : ""} ${isLastRow ? "" : "border-b border-slate-100"} ${inMonth ? "bg-white" : "bg-slate-50/60"}`}
                      key={dateKey(date)}
                    >
                      <div className="flex items-center justify-between px-0.5">
                        <span
                          className={`flex size-6 items-center justify-center rounded-full text-xs font-semibold ${
                            isToday
                              ? "bg-indigo-600 text-white"
                              : inMonth
                                ? "text-slate-700"
                                : "text-slate-300"
                          }`}
                        >
                          {date.getDate()}
                        </span>
                        {inMonth && (
                          <div className="flex items-center gap-1">
                            {dayPosts.length > 0 && (
                              <span className="text-[10px] font-semibold text-slate-400">
                                {dayPosts.length}
                              </span>
                            )}
                            <button
                              aria-label={`Schedule post on ${date.toDateString()}`}
                              className="flex size-5 items-center justify-center rounded-md text-slate-400 opacity-0 transition hover:bg-indigo-50 hover:text-indigo-600 focus:opacity-100 group-hover:opacity-100"
                              onClick={() => onAddPost(date)}
                              type="button"
                            >
                              <Plus className="size-3" />
                            </button>
                          </div>
                        )}
                      </div>

                      {inMonth && (
                        <div className="mt-1 space-y-1">
                          {dayPosts.slice(0, 2).map((post) => (
                            <button
                              className={`w-full rounded-lg border px-1.5 py-1 text-left transition ${statusChip[post.status] ?? "border-slate-200 bg-slate-50 text-slate-600"}`}
                              key={post.id}
                              onClick={() => setSelectedPost(post)}
                              type="button"
                            >
                              <span className="flex items-center gap-1">
                                <span
                                  className={`size-1.5 shrink-0 rounded-full ${statusDot[post.status] ?? "bg-slate-400"}`}
                                />
                                <span className="truncate text-[10px] font-bold">
                                  {post.title}
                                </span>
                              </span>
                              <span className="mt-0.5 block truncate text-[9px] font-medium opacity-70">
                                {post.time}
                              </span>
                            </button>
                          ))}
                          {dayPosts.length > 2 && (
                            <div className="px-1 text-[10px] font-semibold text-slate-400">
                              +{dayPosts.length - 2} more
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Post details modal */}
      {selectedPost && (
        <div
          aria-hidden="false"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm"
          onClick={() => setSelectedPost(null)}
        >
          <div
            aria-modal="true"
            className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
          >
            <div className="relative h-40 bg-slate-100">
              <img
                alt=""
                className="size-full object-cover"
                src={selectedPost.image}
              />
              <button
                aria-label="Close details"
                className="absolute right-3 top-3 flex size-8 items-center justify-center rounded-lg bg-white/90 text-slate-600 shadow-sm transition hover:bg-white"
                onClick={() => setSelectedPost(null)}
                type="button"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-lg font-bold text-slate-900">
                    {selectedPost.title}
                  </div>
                  <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
                    <Clock3 className="size-3" />
                    {selectedPost.date} · {selectedPost.time}
                  </div>
                </div>
                <span
                  className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${statusBadge[selectedPost.status] ?? "bg-slate-100 text-slate-600"}`}
                >
                  <span
                    className={`size-1.5 rounded-full ${statusDot[selectedPost.status] ?? "bg-slate-400"}`}
                  />
                  {selectedPost.status}
                </span>
              </div>

              <div className="mt-4 border-t border-slate-100 pt-4">
                <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Platforms
                </div>
                <div className="mt-2 flex gap-2">
                  {selectedPost.platforms.map((platform) => {
                    const config =
                      platformIconMap[
                        platform as keyof typeof platformIconMap
                      ]
                    if (!config) return null
                    const Icon = config.icon
                    return (
                      <span
                        className={`flex size-9 items-center justify-center rounded-xl text-white ${config.style}`}
                        key={platform}
                      >
                        <Icon className="size-4" />
                      </span>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}