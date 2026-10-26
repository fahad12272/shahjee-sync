import { useEffect, useMemo, useState } from "react"
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  CalendarClock,
  CalendarDays,
  Check,
  Clock3,
  Copy,
  ExternalLink,
  MoreHorizontal,
  Pencil,
  Search,
  Trash2,
  TriangleAlert,
  X,
} from "lucide-react"
import {
  formatDateLabel,
  formatTimeLabel,
  platformIconMap,
} from "../data"

function toDateInputValue(dateStr) {
  const date = new Date(dateStr)
  if (Number.isNaN(date.getTime())) return ""
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${date.getFullYear()}-${month}-${day}`
}

function toTimeInputValue(timeStr) {
  const match = timeStr.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i)
  if (!match) return ""
  let hours = Number(match[1])
  const minutes = match[2]
  const period = match[3].toUpperCase()
  if (period === "PM" && hours !== 12) hours += 12
  if (period === "AM" && hours === 12) hours = 0
  return `${String(hours).padStart(2, "0")}:${minutes}`
}

function PostModal({
  mode,
  onClose,
  onSaveEdit,
  onSaveReschedule,
  post,
}) {
  const [title, setTitle] = useState(post.title)
  const [dateValue, setDateValue] = useState(toDateInputValue(post.date))
  const [timeValue, setTimeValue] = useState(toTimeInputValue(post.time))

  const rescheduleIncomplete =
    mode === "reschedule" && (!dateValue || !timeValue)

  const handleSave = () => {
    if (rescheduleIncomplete) return

    if (mode === "edit") {
      onSaveEdit(title.trim() || post.title)
      return
    }

    const combined = new Date(`${dateValue}T${timeValue}`)
    if (Number.isNaN(combined.getTime())) return
    // Teesra arg = exact ISO time — cron isi se publish karta hai
    onSaveReschedule(
      formatDateLabel(combined),
      formatTimeLabel(combined),
      combined.toISOString(),
    )
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        aria-modal="true"
        className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
      >
        <div className="flex items-center justify-between gap-4 border-b border-slate-100 px-5 py-4">
          <div className="min-w-0">
            <div className="text-base font-bold text-slate-900">
              {mode === "edit" ? "Edit post" : "Reschedule post"}
            </div>
            <div className="mt-0.5 truncate text-xs text-slate-500">
              {post.title}
            </div>
          </div>
          <button
            aria-label="Close dialog"
            className="flex size-8 shrink-0 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
            onClick={onClose}
            type="button"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="space-y-4 p-5">
          {mode === "edit" ? (
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold text-slate-500">
                Post title
              </span>
              <input
                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-900 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100"
                maxLength={80}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Enter post title"
                type="text"
                value={title}
              />
              <span className="mt-1.5 block text-right text-[11px] text-slate-400">
                {title.length} / 80
              </span>
            </label>
          ) : (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1.5 block text-xs font-semibold text-slate-500">
                    Date
                  </span>
                  <input
                    className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-900 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100"
                    onChange={(event) => setDateValue(event.target.value)}
                    type="date"
                    value={dateValue}
                  />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-xs font-semibold text-slate-500">
                    Time
                  </span>
                  <input
                    className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-900 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100"
                    onChange={(event) => setTimeValue(event.target.value)}
                    type="time"
                    value={timeValue}
                  />
                </label>
              </div>
              <p className="rounded-xl border border-amber-100 bg-amber-50 p-3 text-xs font-medium text-amber-700">
                Rescheduling moves this post back to Pending status.
              </p>
            </>
          )}
        </div>

        <div className="flex justify-end gap-2.5 border-t border-slate-100 bg-slate-50/70 px-5 py-4">
          <button
            className="flex h-10 items-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
            onClick={onClose}
            type="button"
          >
            Cancel
          </button>
          <button
            className="flex h-10 items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-5 text-sm font-semibold text-white shadow-lg shadow-indigo-200 transition hover:-translate-y-0.5 hover:shadow-indigo-300 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
            disabled={rescheduleIncomplete}
            onClick={handleSave}
            type="button"
          >
            <Check className="size-4" />
            Save changes
          </button>
        </div>
      </div>
    </div>
  )
}

const SORT_FIELDS = ["date", "status", "title"]

export function ScheduledQueue({
  onDeletePost,
  onDuplicatePost,
  onEditPost,
  onOpenCalendar,
  onReschedulePost,
  posts,
  onBulkDelete,
  initialSearch,
}) {
  const [searchQuery, setSearchQuery] = useState("")
  const [platformFilter, setPlatformFilter] = useState("All")
  const [statusFilter, setStatusFilter] = useState("All")
  const [activeMenu, setActiveMenu] = useState(null)
  const [editingPost, setEditingPost] = useState(null)
  const [editMode, setEditMode] = useState("edit")
  const [sortField, setSortField] = useState("date")
  const [sortDir, setSortDir] = useState("desc")
  const [selected, setSelected] = useState(new Set())

  useEffect(() => {
    if (initialSearch) {
      setSearchQuery(initialSearch.value)
    }
  }, [initialSearch])

  const filteredPosts = useMemo(() => {
    return posts.filter((post) => {
      const matchesSearch = post.title
        .toLowerCase()
        .includes(searchQuery.toLowerCase())
      const matchesPlatform =
        platformFilter === "All" ||
        post.platforms.includes(platformFilter.toLowerCase())
      const matchesStatus =
        statusFilter === "All" || post.status === statusFilter

      return matchesSearch && matchesPlatform && matchesStatus
    })
  }, [posts, searchQuery, platformFilter, statusFilter])

  const sortedPosts = useMemo(() => {
    const arr = [...filteredPosts]
    arr.sort((a, b) => {
      let result = 0
      if (sortField === "title") {
        result = a.title.localeCompare(b.title)
      } else if (sortField === "status") {
        result = a.status.localeCompare(b.status)
      } else {
        const ta = new Date(`${a.date} ${a.time}`).getTime()
        const tb = new Date(`${b.date} ${b.time}`).getTime()
        result = (Number.isNaN(ta) ? 0 : ta) - (Number.isNaN(tb) ? 0 : tb)
      }
      return sortDir === "asc" ? result : -result
    })
    return arr
  }, [filteredPosts, sortField, sortDir])

  const allVisibleSelected =
    sortedPosts.length > 0 &&
    sortedPosts.every((post) => selected.has(post.id))

  const toggleSort = (field) => {
    if (!SORT_FIELDS.includes(field)) return
    if (sortField === field) {
      setSortDir((current) => (current === "asc" ? "desc" : "asc"))
    } else {
      setSortField(field)
      setSortDir(field === "date" ? "desc" : "asc")
    }
  }

  const toggleOne = (id) => {
    setSelected((current) => {
      const next = new Set(current)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const toggleAll = () => {
    setSelected((current) => {
      if (allVisibleSelected) {
        const next = new Set(current)
        sortedPosts.forEach((post) => next.delete(post.id))
        return next
      }
      const next = new Set(current)
      sortedPosts.forEach((post) => next.add(post.id))
      return next
    })
  }

  const sortIcon = (field) => {
    if (sortField !== field) {
      return <ArrowUpDown className="size-3 opacity-40" />
    }
    return sortDir === "asc" ? (
      <ArrowUp className="size-3" />
    ) : (
      <ArrowDown className="size-3" />
    )
  }

  return (
    <>
      <main className="flex-1 bg-slate-50 px-4 py-7 md:px-8 md:py-10 lg:px-10">
        <div className="mx-auto max-w-7xl">
          <div className="mb-7 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
            <div>
              <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-indigo-600">
                <CalendarClock className="size-3.5" />
                Publishing workflow
              </div>
              <div className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
                Scheduled Queue
              </div>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Review and manage every post in your publishing pipeline.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <label className="relative min-w-64">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                <input
                  aria-label="Search queued posts"
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm text-slate-800 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search scheduled posts..."
                  type="search"
                  value={searchQuery}
                />
              </label>
              <button
                className="flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
                onClick={onOpenCalendar}
                type="button"
              >
                <CalendarDays className="size-4 text-indigo-600" />
                View Calendar
              </button>
            </div>
          </div>

          <section className="overflow-visible rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-col justify-between gap-4 border-b border-slate-200 p-4 sm:flex-row sm:items-center sm:px-5">
              <div>
                <div className="text-sm font-bold text-slate-900">
                  Publishing queue
                </div>
                <div className="mt-1 text-xs text-slate-500">
                  {filteredPosts.length}{" "}
                  {filteredPosts.length === 1 ? "post" : "posts"} shown
                </div>
              </div>

              <div className="flex flex-col gap-2.5 sm:flex-row">
                <label className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-500">
                    Platform
                  </span>
                  <select
                    aria-label="Filter by platform"
                    className="h-9 min-w-32 rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs font-semibold text-slate-700 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                    onChange={(event) => setPlatformFilter(event.target.value)}
                    value={platformFilter}
                  >
                    <option>All</option>
                    <option>Instagram</option>
                    <option>YouTube</option>
                  </select>
                </label>

                <label className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-500">
                    Status
                  </span>
                  <select
                    aria-label="Filter by status"
                    className="h-9 min-w-32 rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs font-semibold text-slate-700 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                    onChange={(event) => setStatusFilter(event.target.value)}
                    value={statusFilter}
                  >
                    <option>All</option>
                    <option>Pending</option>
                    <option>Published</option>
                    <option>Failed</option>
                  </select>
                </label>
              </div>
            </div>

            {selected.size > 0 && (
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-indigo-100 bg-indigo-50 px-4 py-2.5 sm:px-5">
                <span className="text-xs font-bold text-indigo-700">
                  {selected.size} {selected.size === 1 ? "post" : "posts"}{" "}
                  selected
                </span>
                <div className="flex items-center gap-2">
                  <button
                    className="flex h-8 items-center rounded-lg border border-indigo-200 bg-white px-3 text-xs font-semibold text-indigo-700 transition hover:bg-indigo-50"
                    onClick={() => setSelected(new Set())}
                    type="button"
                  >
                    Clear
                  </button>
                  <button
                    className="flex h-8 items-center gap-1.5 rounded-lg bg-rose-600 px-3 text-xs font-semibold text-white shadow-sm transition hover:bg-rose-700"
                    onClick={() => {
                      onBulkDelete([...selected])
                      setSelected(new Set())
                    }}
                    type="button"
                  >
                    <Trash2 className="size-3.5" />
                    Delete selected
                  </button>
                </div>
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full min-w-3xl border-collapse text-left">
                <thead className="bg-slate-100/80">
                  <tr className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    <th className="w-10 px-4 py-3.5">
                      <input
                        aria-label="Select all posts"
                        checked={allVisibleSelected}
                        className="size-4 cursor-pointer accent-indigo-600"
                        onChange={toggleAll}
                        type="checkbox"
                      />
                    </th>
                    <th className="px-5 py-3.5">
                      <button
                        className="inline-flex items-center gap-1 transition hover:text-slate-700"
                        onClick={() => toggleSort("title")}
                        type="button"
                      >
                        Post
                        {sortIcon("title")}
                      </button>
                    </th>
                    <th className="px-5 py-3.5">Platforms</th>
                    <th className="px-5 py-3.5">
                      <button
                        className="inline-flex items-center gap-1 transition hover:text-slate-700"
                        onClick={() => toggleSort("date")}
                        type="button"
                      >
                        Scheduled date
                        {sortIcon("date")}
                      </button>
                    </th>
                    <th className="px-5 py-3.5">
                      <button
                        className="inline-flex items-center gap-1 transition hover:text-slate-700"
                        onClick={() => toggleSort("status")}
                        type="button"
                      >
                        Status
                        {sortIcon("status")}
                      </button>
                    </th>
                    <th className="px-5 py-3.5 text-right">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sortedPosts.map((post) => (
                    <tr
                      className={`relative transition hover:bg-slate-50/70 ${
                        selected.has(post.id) ? "bg-indigo-50/40" : ""
                      }`}
                      key={post.id}
                    >
                      <td className="px-4 py-4">
                        <input
                          aria-label={`Select ${post.title}`}
                          checked={selected.has(post.id)}
                          className="size-4 cursor-pointer accent-indigo-600"
                          onChange={() => toggleOne(post.id)}
                          type="checkbox"
                        />
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <img
                            alt=""
                            className="size-12 rounded-xl object-cover ring-1 ring-slate-200"
                            src={post.image}
                          />
                          <div>
                            <div className="text-sm font-bold text-slate-800">
                              {post.title}
                            </div>
                            <div className="mt-1 max-w-[26rem] truncate text-xs text-slate-400">
                              {post.caption ? post.caption : "Image post"}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex -space-x-1.5">
                          {post.platforms.map((platform) => {
                            const config =
                              platformIconMap[platform]
                            if (!config) return null
                            const Icon = config.icon
                            return (
                              <span
                                className={`flex size-7 items-center justify-center rounded-full border-2 border-white text-white ${config.style}`}
                                key={platform}
                              >
                                <Icon className="size-3" />
                              </span>
                            )
                          })}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="text-sm font-semibold text-slate-700">
                          {post.date}
                        </div>
                        <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-400">
                          <Clock3 className="size-3" />
                          {post.time}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${
                            post.status === "Published"
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-amber-50 text-amber-700"
                          }`}
                        >
                          <span
                            className={`size-1.5 rounded-full ${
                              post.status === "Published"
                                ? "bg-emerald-500"
                                : "bg-amber-500"
                            }`}
                          />
                          {post.status}
                        </span>
                        {post.publishResults?.length > 0 ? (
                          <div className="mt-1.5 flex flex-col items-start gap-1">
                            {post.publishResults.map((result, resultIndex) => {
                              const config = platformIconMap[result.platform]
                              if (!config) return null
                              return result.success ? (
                                <a
                                  className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 transition hover:bg-emerald-100"
                                  href={result.url || "#"}
                                  key={`${post.id}-${resultIndex}`}
                                  rel="noreferrer"
                                  target="_blank"
                                  title="Published post dekho"
                                >
                                  <config.icon className="size-3" />
                                  View
                                  <ExternalLink className="size-2.5" />
                                </a>
                              ) : (
                                <span
                                  className="inline-flex cursor-help items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 text-[11px] font-semibold text-rose-700"
                                  key={`${post.id}-${resultIndex}`}
                                  title={result.error || "Publish fail hui"}
                                >
                                  <config.icon className="size-3" />
                                  Fail
                                  <TriangleAlert className="size-2.5" />
                                </span>
                              )
                            })}
                          </div>
                        ) : null}
                      </td>
                      <td className="relative px-5 py-4 text-right">
                        <button
                          aria-expanded={activeMenu === post.id}
                          aria-label={`Actions for ${post.title}`}
                          className="inline-flex size-9 items-center justify-center rounded-lg border border-transparent text-slate-400 transition hover:border-slate-200 hover:bg-white hover:text-slate-700"
                          onClick={() =>
                            setActiveMenu((current) =>
                              current === post.id ? null : post.id,
                            )
                          }
                          type="button"
                        >
                          <MoreHorizontal className="size-4" />
                        </button>

                        {activeMenu === post.id && (
                          <div className="absolute right-5 top-12 z-20 w-44 overflow-hidden rounded-xl border border-slate-200 bg-white p-1.5 text-left shadow-xl shadow-slate-200/60">
                            <button
                              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                              onClick={() => {
                                setEditingPost(post)
                                setEditMode("edit")
                                setActiveMenu(null)
                              }}
                              type="button"
                            >
                              <Pencil className="size-3.5 text-slate-400" />
                              Edit post
                            </button>
                            <button
                              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                              onClick={() => {
                                setEditingPost(post)
                                setEditMode("reschedule")
                                setActiveMenu(null)
                              }}
                              type="button"
                            >
                              <CalendarClock className="size-3.5 text-slate-400" />
                              Reschedule
                            </button>
                            <button
                              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                              onClick={() => {
                                onDuplicatePost(post.id)
                                setActiveMenu(null)
                              }}
                              type="button"
                            >
                              <Copy className="size-3.5 text-slate-400" />
                              Duplicate
                            </button>
                            <button
                              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-semibold text-rose-600 transition hover:bg-rose-50"
                              onClick={() => {
                                onDeletePost(post.id)
                                setActiveMenu(null)
                              }}
                              type="button"
                            >
                              <Trash2 className="size-3.5" />
                              Delete
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {filteredPosts.length === 0 && (
                <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
                  <div className="flex size-12 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
                    <Search className="size-5" />
                  </div>
                  <div className="mt-4 text-sm font-bold text-slate-800">
                    No scheduled posts found
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    Try changing your search or filter selection.
                  </p>
                </div>
              )}
            </div>
          </section>
        </div>
      </main>

      {editingPost && (
        <PostModal
          mode={editMode}
          onClose={() => setEditingPost(null)}
          onSaveEdit={(title) => {
            onEditPost(editingPost.id, title)
            setEditingPost(null)
          }}
          onSaveReschedule={(date, time, iso) => {
            onReschedulePost(editingPost.id, date, time, iso)
            setEditingPost(null)
          }}
          post={editingPost}
        />
      )}
    </>
  )
}
