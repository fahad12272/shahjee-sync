import { useState } from "react"
import {
  CalendarClock,
  CalendarDays,
  Clock3,
  MoreHorizontal,
  Pencil,
  Search,
  Trash2,
} from "lucide-react"
import { platformIconMap, type Post } from "../data"

export function ScheduledQueue({
  posts,
  onOpenCalendar,
  onDeletePost,
}: {
  posts: Post[]
  onOpenCalendar: () => void
  onDeletePost: (id: string) => void
}) {
  const [searchQuery, setSearchQuery] = useState("")
  const [platformFilter, setPlatformFilter] = useState("All")
  const [statusFilter, setStatusFilter] = useState("All")
  const [activeMenu, setActiveMenu] = useState<string | null>(null)

  const filteredPosts = posts.filter((post) => {
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

  return (
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

          <div className="overflow-x-auto">
            <table className="w-full min-w-3xl border-collapse text-left">
              <thead className="bg-slate-100/80">
                <tr className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="px-5 py-3.5">Post</th>
                  <th className="px-5 py-3.5">Platforms</th>
                  <th className="px-5 py-3.5">Scheduled date</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPosts.map((post) => (
                  <tr
                    className="relative transition hover:bg-slate-50/70"
                    key={post.id}
                  >
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
                          <div className="mt-1 text-xs text-slate-400">
                            Image post
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex -space-x-1.5">
                        {post.platforms.map((platform) => {
                          const config =
                            platformIconMap[
                              platform as keyof typeof platformIconMap
                            ]
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
                        <div className="absolute right-5 top-12 z-20 w-40 overflow-hidden rounded-xl border border-slate-200 bg-white p-1.5 text-left shadow-xl shadow-slate-200/60">
                          <button
                            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                            onClick={() => setActiveMenu(null)}
                            type="button"
                          >
                            <Pencil className="size-3.5 text-slate-400" />
                            Edit post
                          </button>
                          <button
                            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                            onClick={() => setActiveMenu(null)}
                            type="button"
                          >
                            <CalendarClock className="size-3.5 text-slate-400" />
                            Reschedule
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
  )
}