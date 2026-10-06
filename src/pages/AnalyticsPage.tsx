import { useMemo, useState } from "react"
import {
  ArrowUpRight,
  BarChart3,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Layers,
} from "lucide-react"
import { platformIconMap, type Post } from "../data"

export function AnalyticsPage({ posts }: { posts: Post[] }) {
  const [timePeriod, setTimePeriod] = useState("Last 30 days")

  const periodPosts = useMemo(() => {
    if (timePeriod === "All time") return posts
    const days =
      timePeriod === "Last 7 days"
        ? 7
        : timePeriod === "Last 30 days"
          ? 30
          : 90
    const times = posts
      .map((post) => new Date(post.date).getTime())
      .filter((time) => !Number.isNaN(time))
    if (times.length === 0) return posts
    const newest = Math.max(...times)
    const cutoff = newest - days * 24 * 60 * 60 * 1000
    return posts.filter(
      (post) => new Date(post.date).getTime() >= cutoff,
    )
  }, [posts, timePeriod])

  const stats = useMemo(() => {
    const total = periodPosts.length
    const pending = periodPosts.filter((post) => post.status === "Pending").length
    const published = periodPosts.filter(
      (post) => post.status === "Published",
    ).length
    const publishRate = total > 0 ? Math.round((published / total) * 100) : 0
    return { total, pending, published, publishRate }
  }, [periodPosts])

  const platformRows = useMemo(() => {
    const counts = new Map<
      string,
      { total: number; pending: number; published: number }
    >()

    periodPosts.forEach((post) => {
      post.platforms.forEach((platform) => {
        const entry =
          counts.get(platform) ?? { total: 0, pending: 0, published: 0 }
        entry.total += 1
        if (post.status === "Published") {
          entry.published += 1
        } else {
          entry.pending += 1
        }
        counts.set(platform, entry)
      })
    })

    const totalSlots = [...counts.values()].reduce(
      (sum, entry) => sum + entry.total,
      0,
    )

    return [...counts.entries()]
      .map(([key, entry]) => {
        const config = platformIconMap[key as keyof typeof platformIconMap]
        return {
          key,
          name: key.charAt(0).toUpperCase() + key.slice(1),
          icon: config?.icon,
          iconStyle: config?.style ?? "bg-slate-500",
          share: totalSlots > 0 ? Math.round((entry.total / totalSlots) * 100) : 0,
          ...entry,
        }
      })
      .sort((a, b) => b.total - a.total)
  }, [periodPosts])

  const activityData = useMemo(() => {
    const groups = new Map<
      string,
      { label: string; total: number; published: number; sortKey: number }
    >()

    periodPosts.forEach((post) => {
      const date = new Date(post.date)
      if (Number.isNaN(date.getTime())) return
      const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`
      const existing = groups.get(key)

      if (existing) {
        existing.total += 1
        if (post.status === "Published") existing.published += 1
      } else {
        groups.set(key, {
          label: date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          }),
          total: 1,
          published: post.status === "Published" ? 1 : 0,
          sortKey: date.getTime(),
        })
      }
    })

    return [...groups.values()]
      .sort((a, b) => a.sortKey - b.sortKey)
      .slice(-8)
  }, [periodPosts])

  const maxActivity = Math.max(1, ...activityData.map((item) => item.total))
  const maxShare = Math.max(1, ...platformRows.map((row) => row.share))

  const statCards = [
    {
      label: "Total Posts",
      value: String(stats.total),
      detail: "across all platforms",
      icon: Layers,
      iconStyle: "bg-indigo-50 text-indigo-600",
      badge: `${platformRows.length} ${platformRows.length === 1 ? "platform" : "platforms"}`,
      badgeStyle: "bg-indigo-50 text-indigo-700",
    },
    {
      label: "Pending Posts",
      value: String(stats.pending),
      detail: "waiting to be published",
      icon: Clock3,
      iconStyle: "bg-amber-50 text-amber-600",
      badge: "Needs action",
      badgeStyle: "bg-amber-50 text-amber-700",
    },
    {
      label: "Published Posts",
      value: String(stats.published),
      detail: "successfully delivered",
      icon: CheckCircle2,
      iconStyle: "bg-emerald-50 text-emerald-600",
      badge: `${stats.publishRate}% publish rate`,
      badgeStyle: "bg-emerald-50 text-emerald-700",
    },
  ]

  return (
    <main className="flex-1 bg-slate-50 px-4 py-7 md:px-8 md:py-10 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-indigo-600">
              <BarChart3 className="size-3.5" />
              Performance center
            </div>
            <div className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
              Analytics Overview
            </div>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              {periodPosts.length} {periodPosts.length === 1 ? "post" : "posts"}{" "}
              in this period.
            </p>
          </div>

          <label className="relative w-fit">
            <span className="sr-only">Analytics time period</span>
            <select
              className="h-11 min-w-40 appearance-none rounded-xl border border-slate-200 bg-white pl-4 pr-10 text-sm font-semibold text-slate-700 shadow-sm outline-none transition hover:border-slate-300 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
              onChange={(event) => setTimePeriod(event.target.value)}
              value={timePeriod}
            >
              <option>Last 7 days</option>
              <option>Last 30 days</option>
              <option>Last 90 days</option>
              <option>All time</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          </label>
        </div>

        <section className="mb-6 grid gap-4 md:grid-cols-3">
          {statCards.map((card) => {
            const Icon = card.icon
            return (
              <article
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                key={card.label}
              >
                <div className="flex items-center justify-between">
                  <div
                    className={`flex size-10 items-center justify-center rounded-xl ${card.iconStyle}`}
                  >
                    <Icon className="size-4.5" />
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-bold ${card.badgeStyle}`}
                  >
                    {card.badge}
                  </span>
                </div>
                <div className="mt-5 text-sm font-semibold text-slate-500">
                  {card.label}
                </div>
                <div className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
                  {card.value}
                </div>
                <div className="mt-2 text-xs text-slate-400">{card.detail}</div>
              </article>
            )
          })}
        </section>

        <section className="grid items-start gap-6 xl:grid-cols-[minmax(0,3fr)_minmax(20rem,2fr)]">
          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
              <div>
                <div className="font-bold text-slate-900">
                  Publishing activity
                </div>
                <div className="mt-1 text-xs text-slate-500">
                  Posts scheduled per day
                </div>
              </div>
              <div className="flex items-center gap-4 text-xs font-medium text-slate-500">
                <span className="flex items-center gap-2">
                  <span className="size-2 rounded-full bg-indigo-500" />
                  Total posts
                </span>
                <span className="flex items-center gap-2">
                  <span className="size-2 rounded-full bg-violet-300" />
                  Published
                </span>
              </div>
            </div>

            {activityData.length > 0 ? (
              <div className="mt-8">
                <div className="relative flex h-56 items-end justify-between gap-2 border-b border-slate-200 sm:gap-4">
                  <div className="pointer-events-none absolute inset-0 flex flex-col justify-between">
                    {[0, 1, 2, 3].map((line) => (
                      <div
                        className="border-t border-dashed border-slate-100"
                        key={line}
                      />
                    ))}
                  </div>
                  {activityData.map((item) => (
                    <div
                      className="relative z-10 flex h-full flex-1 items-end justify-center gap-1 sm:gap-1.5"
                      key={item.label}
                    >
                      <div
                        className="w-2.5 rounded-t bg-gradient-to-t from-indigo-600 to-indigo-400 transition hover:opacity-80 sm:w-4"
                        style={{
                          height: `${(item.total / maxActivity) * 100}%`,
                        }}
                        title={`${item.total} ${item.total === 1 ? "post" : "posts"}`}
                      />
                      <div
                        className="w-2.5 rounded-t bg-violet-300 transition hover:bg-violet-400 sm:w-4"
                        style={{
                          height: `${(item.published / maxActivity) * 100}%`,
                        }}
                        title={`${item.published} published`}
                      />
                    </div>
                  ))}
                </div>
                <div className="mt-3 flex justify-between gap-2">
                  {activityData.map((item) => (
                    <div
                      className="flex-1 text-center text-[9px] font-medium text-slate-400 sm:text-[10px]"
                      key={item.label}
                    >
                      {item.label}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="mt-8 flex h-56 flex-col items-center justify-center text-slate-400">
                <BarChart3 className="size-8" strokeWidth={1.5} />
                <p className="mt-3 text-sm font-semibold">
                  No activity yet — publish a post to see data here.
                </p>
              </div>
            )}
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex items-start justify-between">
              <div>
                <div className="font-bold text-slate-900">Queue overview</div>
                <div className="mt-1 text-xs text-slate-500">
                  Everything in your pipeline right now
                </div>
              </div>
              <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">
                {stats.publishRate}% published
              </span>
            </div>
            <div className="mt-7 text-4xl font-bold tracking-tight text-slate-900">
              {stats.total} {stats.total === 1 ? "post" : "posts"}
            </div>
            <div className="mt-2 text-xs text-slate-400">
              {stats.pending} pending · {stats.published} published
            </div>
            <div className="mt-8 flex h-28 items-end gap-2">
              {platformRows.map((row) => (
                <div
                  className="flex-1 rounded-t bg-indigo-100 transition hover:bg-indigo-300"
                  key={row.key}
                  style={{
                    height: `${Math.max(12, (row.share / maxShare) * 100)}%`,
                  }}
                  title={`${row.name}: ${row.share}%`}
                />
              ))}
            </div>
            <div className="mt-3 text-center text-xs text-slate-400">
              Distribution across {platformRows.length}{" "}
              {platformRows.length === 1 ? "platform" : "platforms"}
            </div>
          </article>
        </section>

        <section className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-5 py-5 sm:px-6">
            <div className="font-bold text-slate-900">Platform breakdown</div>
            <div className="mt-1 text-xs text-slate-500">
              How your posts are distributed across platforms.
            </div>
          </div>

          {platformRows.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-2xl text-left">
                <thead className="bg-slate-100/80">
                  <tr className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    <th className="px-5 py-3.5 sm:px-6">Platform</th>
                    <th className="px-5 py-3.5">Posts</th>
                    <th className="px-5 py-3.5">Pending</th>
                    <th className="px-5 py-3.5">Published</th>
                    <th className="px-5 py-3.5 text-right sm:px-6">Share</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {platformRows.map((row) => {
                    const Icon = row.icon
                    return (
                      <tr
                        className="transition hover:bg-slate-50/70"
                        key={row.key}
                      >
                        <td className="px-5 py-4 sm:px-6">
                          <div className="flex items-center gap-3">
                            <span
                              className={`flex size-9 items-center justify-center rounded-xl text-white ${row.iconStyle}`}
                            >
                              {Icon ? <Icon className="size-4" /> : null}
                            </span>
                            <div className="text-sm font-bold text-slate-800">
                              {row.name}
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-sm font-bold text-slate-800">
                          {row.total}
                        </td>
                        <td className="px-5 py-4 text-sm font-semibold text-amber-600">
                          {row.pending}
                        </td>
                        <td className="px-5 py-4 text-sm font-semibold text-emerald-600">
                          {row.published}
                        </td>
                        <td className="px-5 py-4 text-right sm:px-6">
                          <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-bold text-indigo-700">
                            <ArrowUpRight className="size-3" />
                            {row.share}%
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center px-6 py-14 text-center text-slate-400">
              <Layers className="size-8" strokeWidth={1.5} />
              <p className="mt-3 text-sm font-semibold">
                No posts yet — data will appear once you publish.
              </p>
            </div>
          )}
        </section>
      </div>
    </main>
  )
}