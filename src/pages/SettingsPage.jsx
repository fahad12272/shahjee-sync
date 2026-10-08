import { useState } from "react"
import {
  Check,
  ChevronDown,
  Download,
  Settings,
  Trash2,
  Upload,
} from "lucide-react"
import { ToggleSwitch } from "../components/ToggleSwitch"

const notificationOptions = [
  {
    key: "publishSuccess",
    title: "Publish confirmations",
    desc: "Get notified when a post is successfully published.",
  },
  {
    key: "publishFailures",
    title: "Publish failures",
    desc: "Get alerted immediately if a post fails to publish.",
  },
  {
    key: "weeklyReport",
    title: "Weekly performance report",
    desc: "A summary of your analytics every Monday morning.",
  },
  {
    key: "productUpdates",
    title: "Product updates",
    desc: "News about new features and improvements.",
  },
]

export function SettingsPage({
  onExportData,
  onImportData,
  onResetData,
  user,
}) {
  const [profile, setProfile] = useState({
    name: user.name,
    email: user.email,
  })
  const [saved, setSaved] = useState(false)
  const [timezone, setTimezone] = useState("Asia/Karachi")
  const [notifications, setNotifications] = useState({
    publishSuccess: true,
    publishFailures: true,
    weeklyReport: false,
    productUpdates: true,
  })

  const handleSaveProfile = () => {
    setSaved(true)
    window.setTimeout(() => setSaved(false), 2500)
  }

  return (
    <main className="flex-1 bg-slate-50 px-4 py-7 md:px-8 md:py-10 lg:px-10">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8">
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-indigo-600">
            <Settings className="size-3.5" />
            Workspace settings
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
            Settings
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Manage your profile, notifications, and publishing preferences.
          </p>
        </div>

        {/* Profile */}
        <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="text-base font-bold text-slate-900">Profile</div>
          <p className="mt-1 text-xs text-slate-500">
            This information appears across your workspace.
          </p>

          <div className="mt-6 flex flex-col gap-5 sm:flex-row sm:items-center">
            <div className="flex size-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-lg font-bold text-white shadow-lg shadow-indigo-200">
              SF
            </div>
            <div className="grid flex-1 gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold text-slate-500">
                  Full name
                </span>
                <input
                  className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100"
                  onChange={(event) =>
                    setProfile((current) => ({
                      ...current,
                      name: event.target.value,
                    }))
                  }
                  type="text"
                  value={profile.name}
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold text-slate-500">
                  Email
                </span>
                <input
                  className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100"
                  onChange={(event) =>
                    setProfile((current) => ({
                      ...current,
                      email: event.target.value,
                    }))
                  }
                  type="email"
                  value={profile.email}
                />
              </label>
            </div>
          </div>

          <div className="mt-6 flex items-center gap-3 border-t border-slate-100 pt-5">
            <button
              className="flex h-10 items-center rounded-xl bg-indigo-600 px-5 text-sm font-semibold text-white shadow-lg shadow-indigo-200 transition hover:bg-indigo-700"
              onClick={handleSaveProfile}
              type="button"
            >
              Save changes
            </button>
            {saved && (
              <span className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700">
                <Check className="size-3.5" strokeWidth={2.5} />
                Changes saved
              </span>
            )}
          </div>
        </section>

        {/* Notifications */}
        <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="text-base font-bold text-slate-900">
            Notifications
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Choose what updates you want to receive.
          </p>

          <div className="mt-4 divide-y divide-slate-100">
            {notificationOptions.map((item) => (
              <div
                className="flex items-center justify-between gap-4 py-4"
                key={item.key}
              >
                <div>
                  <div className="text-sm font-semibold text-slate-800">
                    {item.title}
                  </div>
                  <div className="mt-0.5 text-xs text-slate-500">
                    {item.desc}
                  </div>
                </div>
                <ToggleSwitch
                  enabled={notifications[item.key]}
                  label={item.title}
                  onToggle={() =>
                    setNotifications((current) => ({
                      ...current,
                      [item.key]: !current[item.key],
                    }))
                  }
                />
              </div>
            ))}
          </div>
        </section>

        {/* Publishing defaults */}
        <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="text-base font-bold text-slate-900">
            Publishing defaults
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Default settings applied when scheduling new posts.
          </p>

          <label className="mt-5 block max-w-xs">
            <span className="mb-1.5 block text-xs font-semibold text-slate-500">
              Timezone
            </span>
            <span className="relative block">
              <select
                className="h-11 w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-700 outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
                onChange={(event) => setTimezone(event.target.value)}
                value={timezone}
              >
                <option>Asia/Karachi</option>
                <option>Asia/Dubai</option>
                <option>Europe/London</option>
                <option>America/New_York</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            </span>
          </label>
        </section>

        {/* Data backup */}
        <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="text-base font-bold text-slate-900">Data backup</div>
          <p className="mt-1 text-xs text-slate-500">
            Download all your posts as a JSON file, or restore from a previous
            backup.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <button
              className="flex h-10 items-center gap-2 rounded-xl bg-indigo-600 px-5 text-sm font-semibold text-white shadow-lg shadow-indigo-200 transition hover:bg-indigo-700"
              onClick={onExportData}
              type="button"
            >
              <Download className="size-4" />
              Export backup
            </button>
            <label className="flex h-10 cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
              <Upload className="size-4 text-slate-400" />
              Import backup
              <input
                accept="application/json,.json"
                className="sr-only"
                onChange={(event) => {
                  const file = event.target.files?.[0]
                  if (file) onImportData(file)
                  event.target.value = ""
                }}
                type="file"
              />
            </label>
          </div>
        </section>

        {/* Danger zone */}
        <section className="rounded-2xl border border-rose-200 bg-rose-50/60 p-5 shadow-sm sm:p-6">
          <div className="text-base font-bold text-rose-900">Danger zone</div>
          <p className="mt-1 text-xs text-rose-600">
            Irreversible actions — please be certain.
          </p>
          <div className="mt-5 flex flex-col gap-4 border-b border-rose-100 pb-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-rose-700">
              Delete all saved posts and restore the original demo data.
            </p>
            <button
              className="flex h-10 shrink-0 items-center gap-2 rounded-xl border border-rose-300 bg-white px-5 text-sm font-semibold text-rose-600 transition hover:bg-rose-600 hover:text-white"
              onClick={onResetData}
              type="button"
            >
              <Trash2 className="size-4" />
              Reset demo data
            </button>
          </div>
          <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-rose-700">
              Permanently delete this workspace and all of its content.
            </p>
            <button
              className="flex h-10 shrink-0 items-center gap-2 rounded-xl border border-rose-300 bg-white px-5 text-sm font-semibold text-rose-600 transition hover:bg-rose-600 hover:text-white"
              type="button"
            >
              <Trash2 className="size-4" />
              Delete workspace
            </button>
          </div>
        </section>
      </div>
    </main>
  )
}