import { useState } from "react"
import { ArrowUpRight, BarChart3, ChevronDown } from "lucide-react"
import { analyticsStats, chartData, engagementBreakdown } from "../data"

export function AnalyticsPage() {
  const [timePeriod, setTimePeriod] = useState("Last 30 days")

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
              A snapshot of your cross-platform performance.
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
            </select>
            <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          </label>
        </div>

        <section className="mb-6 grid gap-4 md:grid-cols-3">
          {analyticsStats.map((stat) => {
            const Icon = stat.icon
            return (
              <article
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                key={stat.label}
              >
                <div className="flex items-center justify-between">
                  <div
                    className={`flex size-10 items-center justify-center rounded-xl ${stat.iconStyle}`}
                  >
                    <Icon className="size-4.5" />
                  </div>
                  <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">
                    <ArrowUpRight className="size-3" />
                    {stat.growth}
                  </span>
                </div>
                <div className="mt-5 text-sm font-semibold text-slate-500">
                  {stat.label}
                </div>
                <div className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
                  {stat.value}
                </div>
                <div className="mt-2 text-xs text-slate-400">{stat.detail}</div>
              </article>
            )
          })}
        </section>

        <section className="grid items-start gap-6 xl:grid-cols-[minmax(0,3fr)_minmax(20rem,2fr)]">
          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
              <div>
                <div className="font-bold text-slate-900">
                  Cross-platform engagement
                </div>
                <div className="mt-1 text-xs text-slate-500">
                  Reach and engagement activity over time
                </div>
              </div>
              <div className="flex items-center gap-4 text-xs font-medium text-slate-500">
                <span className="flex items-center gap-2">
                  <span className="size-2 rounded-full bg-indigo-500" />
                  Reach
                </span>
                <span className="flex items-center gap-2">
                  <span className="size-2 rounded-full bg-violet-300" />
                  Engagement
                </span>
              </div>
            </div>

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
                {chartData.map((item) => (
                  <div
                    className="relative z-10 flex h-full flex-1 items-end justify-center gap-1 sm:gap-1.5"
                    key={item.label}
                  >
                    <div
                      className={`w-2.5 rounded-t bg-gradient-to-t from-indigo-600 to-indigo-400 transition hover:opacity-80 sm:w-4 ${item.reach}`}
                      title={`${item.label} reach`}
                    />
                    <div
                      className={`w-2.5 rounded-t bg-violet-300 transition hover:bg-violet-400 sm:w-4 ${item.engagement}`}
                      title={`${item.label} engagement`}
                    />
                  </div>
                ))}
              </div>
              <div className="mt-3 flex justify-between gap-2">
                {chartData.map((item) => (
                  <div
                    className="flex-1 text-center text-[9px] font-medium text-slate-400 sm:text-[10px]"
                    key={item.label}
                  >
                    {item.label}
                  </div>
                ))}
              </div>
            </div>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex items-start justify-between">
              <div>
                <div className="font-bold text-slate-900">Audience growth</div>
                <div className="mt-1 text-xs text-slate-500">
                  New followers across all channels
                </div>
              </div>
              <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">
                +12.8%
              </span>
            </div>
            <div className="mt-7 text-4xl font-bold tracking-tight text-slate-900">
              18,492
            </div>
            <div className="mt-2 text-xs text-slate-400">
              +2,104 new followers this period
            </div>
            <div className="mt-8 flex h-28 items-end gap-2">
              {[
                "h-10",
                "h-14",
                "h-12",
                "h-20",
                "h-16",
                "h-24",
                "h-28",
                "h-24",
                "h-28",
                "h-32",
              ].map((height, index) => (
                <div
                  className={`flex-1 rounded-t bg-indigo-100 transition hover:bg-indigo-300 ${height}`}
                  key={`${height}-${index}`}
                />
              ))}
            </div>
          </article>
        </section>

        <section className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-5 py-5 sm:px-6">
            <div className="font-bold text-slate-900">Platform breakdown</div>
            <div className="mt-1 text-xs text-slate-500">
              Reach and engagement by connected account.
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-2xl text-left">
              <thead className="bg-slate-100/80">
                <tr className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="px-5 py-3.5 sm:px-6">Platform</th>
                  <th className="px-5 py-3.5">Reach</th>
                  <th className="px-5 py-3.5">Likes</th>
                  <th className="px-5 py-3.5">Comments</th>
                  <th className="px-5 py-3.5 text-right sm:px-6">Growth</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {engagementBreakdown.map((platform) => {
                  const Icon = platform.icon
                  return (
                    <tr
                      className="transition hover:bg-slate-50/70"
                      key={platform.name}
                    >
                      <td className="px-5 py-4 sm:px-6">
                        <div className="flex items-center gap-3">
                          <span
                            className={`flex size-9 items-center justify-center rounded-xl text-white ${platform.iconStyle}`}
                          >
                            <Icon className="size-4" />
                          </span>
                          <div>
                            <div className="text-sm font-bold text-slate-800">
                              {platform.name}
                            </div>
                            <div className="mt-0.5 text-xs text-slate-400">
                              {platform.handle}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-sm font-bold text-slate-800">
                        {platform.reach}
                      </td>
                      <td className="px-5 py-4 text-sm font-semibold text-slate-600">
                        {platform.likes}
                      </td>
                      <td className="px-5 py-4 text-sm font-semibold text-slate-600">
                        {platform.comments}
                      </td>
                      <td className="px-5 py-4 text-right sm:px-6">
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">
                          <ArrowUpRight className="size-3" />
                          {platform.change}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  )
}