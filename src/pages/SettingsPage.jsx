import { useEffect, useState } from "react"
import {
  AlertTriangle,
  Check,
  ChevronDown,
  Download,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Lock,
  Settings,
  Trash2,
  Upload,
} from "lucide-react"
import { ToggleSwitch } from "../components/ToggleSwitch"
import {
  apiChangePassword,
  apiDeleteAccount,
  apiMe,
  removeToken,
} from "../api"

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

const timezoneOptions = [
  "Asia/Karachi",
  "Asia/Dubai",
  "Asia/Riyadh",
  "Asia/Kolkata",
  "Europe/London",
  "Europe/Berlin",
  "America/New_York",
  "America/Los_Angeles",
  "Australia/Sydney",
]

const NOTIF_KEY = "shahjee-sync-notifications"
const TZ_KEY = "shahjee-sync-timezone"

const defaultNotifications = {
  publishSuccess: true,
  publishFailures: true,
  weeklyReport: false,
  productUpdates: true,
}

function loadStored(key, fallback) {
  try {
    const raw = window.localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

const getInitials = (name) => {
  const words = String(name || "").trim().split(/\s+/).filter(Boolean)
  if (words.length === 0) return "?"
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase()
  return (words[0][0] + words[1][0]).toUpperCase()
}

// Password strength: 0-4 score ke hisaab se bar dikhata hai
function getPasswordScore(password) {
  if (!password) return 0
  let score = 0
  if (password.length >= 8) score += 1
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score += 1
  if (/\d/.test(password)) score += 1
  if (/[^A-Za-z0-9]/.test(password)) score += 1
  return score
}

const strengthLabels = ["Bohat kamzor", "Kamzor", "Theek", "Strong", "Bohat strong"]
const strengthColors = [
  "bg-slate-200",
  "bg-rose-500",
  "bg-orange-500",
  "bg-amber-500",
  "bg-emerald-500",
]

function PasswordInput({
  id,
  label,
  value,
  onChange,
  placeholder,
  autoComplete,
}) {
  const [show, setShow] = useState(false)
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold text-slate-500">
        {label}
      </span>
      <span className="relative block">
        <input
          autoComplete={autoComplete}
          className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 pr-11 text-sm text-slate-900 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100"
          id={id}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          type={show ? "text" : "password"}
          value={value}
        />
        <button
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-600"
          onClick={() => setShow((current) => !current)}
          type="button"
        >
          {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      </span>
    </label>
  )
}

export function SettingsPage({
  onExportData,
  onImportData,
  onProfileUpdated = () => {},
  onResetData,
  user,
}) {
  // ---------- Profile ----------
  const [profile, setProfile] = useState({
    name: user.name,
    email: user.email,
  })
  const [savingProfile, setSavingProfile] = useState(false)
  const [profileMessage, setProfileMessage] = useState(null) // {type, text}
  const [joinedAt, setJoinedAt] = useState(user.joinedAt || null)

  useEffect(() => {
    let active = true
    if (!user.joinedAt) {
      apiMe()
        .then((fresh) => {
          if (active && fresh?.joinedAt) setJoinedAt(fresh.joinedAt)
        })
        .catch(() => {})
    }
    return () => {
      active = false
    }
  }, [user.joinedAt])

  const nameDirty =
    profile.name.trim() !== user.name && profile.name.trim().length >= 2

  const handleSaveProfile = async () => {
    if (!nameDirty || savingProfile) return
    setSavingProfile(true)
    setProfileMessage(null)
    try {
      const updated = await apiUpdateProfile(profile.name.trim())
      onProfileUpdated({ ...user, name: updated.name })
      setProfile((current) => ({ ...current, name: updated.name }))
      setProfileMessage({ type: "success", text: "Profile save ho gaya!" })
      window.setTimeout(() => setProfileMessage(null), 3000)
    } catch (error) {
      setProfileMessage({ type: "error", text: error.message })
    } finally {
      setSavingProfile(false)
    }
  }

  // ---------- Password ----------
  const [passwords, setPasswords] = useState({
    current: "",
    next: "",
    confirm: "",
  })
  const [changingPassword, setChangingPassword] = useState(false)
  const [passwordMessage, setPasswordMessage] = useState(null)

  const pwScore = getPasswordScore(passwords.next)

  const passwordValid =
    passwords.current.length > 0 &&
    passwords.next.length >= 6 &&
    passwords.next === passwords.confirm &&
    passwords.next !== passwords.current

  const handleChangePassword = async () => {
    if (!passwordValid || changingPassword) return
    setChangingPassword(true)
    setPasswordMessage(null)
    try {
      await apiChangePassword(passwords.current, passwords.next)
      setPasswordMessage({
        type: "success",
        text: "Password change ho gaya! Agli baar naya password use karein.",
      })
      setPasswords({ current: "", next: "", confirm: "" })
    } catch (error) {
      setPasswordMessage({ type: "error", text: error.message })
    } finally {
      setChangingPassword(false)
    }
  }

  // ---------- Preferences (browser mein save hoti hain) ----------
  const [timezone, setTimezone] = useState(() => {
    const stored = window.localStorage.getItem(TZ_KEY)
    return stored || "Asia/Karachi"
  })
  const [notifications, setNotifications] = useState(() =>
    loadStored(NOTIF_KEY, defaultNotifications),
  )

  useEffect(() => {
    window.localStorage.setItem(TZ_KEY, timezone)
  }, [timezone])

  useEffect(() => {
    window.localStorage.setItem(NOTIF_KEY, JSON.stringify(notifications))
  }, [notifications])

  // ---------- Delete account ----------
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [deleteText, setDeleteText] = useState("")
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState(null)

  const handleDeleteAccount = async () => {
    if (deleteText !== "DELETE" || deleting) return
    setDeleting(true)
    setDeleteError(null)
    try {
      await apiDeleteAccount()
      removeToken()
      // Poora state clear — landing page pe wapas
      window.location.href = "/"
    } catch (error) {
      setDeleteError(error.message)
      setDeleting(false)
    }
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
            Manage your profile, password, preferences, and data.
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
              {getInitials(profile.name)}
            </div>
            <div className="grid flex-1 gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold text-slate-500">
                  Full name
                </span>
                <input
                  className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100"
                  maxLength={50}
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
                <span className="mb-1.5 flex items-center justify-between text-xs font-semibold text-slate-500">
                  Email
                  <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-slate-400">
                    <Lock className="size-3" />
                    Locked
                  </span>
                </span>
                <input
                  className="h-11 w-full cursor-not-allowed rounded-xl border border-slate-200 bg-slate-100 px-4 text-sm text-slate-500"
                  disabled
                  type="email"
                  value={profile.email}
                />
              </label>
            </div>
          </div>

          {joinedAt && (
            <p className="mt-4 text-xs text-slate-400">
              Member since{" "}
              {new Date(joinedAt).toLocaleDateString("en-US", {
                month: "long",
                year: "numeric",
              })}
            </p>
          )}

          <div className="mt-6 flex items-center gap-3 border-t border-slate-100 pt-5">
            <button
              className="flex h-10 items-center gap-2 rounded-xl bg-indigo-600 px-5 text-sm font-semibold text-white shadow-lg shadow-indigo-200 transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={!nameDirty || savingProfile}
              onClick={handleSaveProfile}
              type="button"
            >
              {savingProfile && <Loader2 className="size-4 animate-spin" />}
              {savingProfile ? "Saving..." : "Save changes"}
            </button>
            {profileMessage?.type === "success" && (
              <span className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700">
                <Check className="size-3.5" strokeWidth={2.5} />
                {profileMessage.text}
              </span>
            )}
            {profileMessage?.type === "error" && (
              <span className="text-xs font-semibold text-rose-600">
                {profileMessage.text}
              </span>
            )}
          </div>
        </section>

        {/* Change password */}
        <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-center gap-2">
            <KeyRound className="size-4 text-indigo-600" />
            <div className="text-base font-bold text-slate-900">
              Change password
            </div>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Security ke liye current password verify hota hai.
          </p>

          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            <PasswordInput
              autoComplete="current-password"
              label="Current password"
              onChange={(value) =>
                setPasswords((current) => ({ ...current, current: value }))
              }
              placeholder="Abhi wala password"
              value={passwords.current}
            />
            <PasswordInput
              autoComplete="new-password"
              label="New password"
              onChange={(value) =>
                setPasswords((current) => ({ ...current, next: value }))
              }
              placeholder="Kam se kam 6 characters"
              value={passwords.next}
            />
            <PasswordInput
              autoComplete="new-password"
              label="Confirm new password"
              onChange={(value) =>
                setPasswords((current) => ({ ...current, confirm: value }))
              }
              placeholder="Dobara wahi password"
              value={passwords.confirm}
            />
          </div>

          {passwords.next && (
            <div className="mt-4 flex items-center gap-3">
              <div className="flex flex-1 gap-1.5">
                {[1, 2, 3, 4].map((level) => (
                  <span
                    className={`h-1.5 flex-1 rounded-full ${
                      pwScore >= level ? strengthColors[pwScore] : "bg-slate-200"
                    }`}
                    key={level}
                  />
                ))}
              </div>
              <span className="text-xs font-semibold text-slate-500">
                {strengthLabels[pwScore]}
              </span>
            </div>
          )}

          {passwords.confirm && passwords.next !== passwords.confirm && (
            <p className="mt-3 text-xs font-semibold text-rose-600">
              Naya password aur confirm dono same nahi hain
            </p>
          )}

          <div className="mt-5 flex items-center gap-3 border-t border-slate-100 pt-5">
            <button
              className="flex h-10 items-center gap-2 rounded-xl bg-indigo-600 px-5 text-sm font-semibold text-white shadow-lg shadow-indigo-200 transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={!passwordValid || changingPassword}
              onClick={handleChangePassword}
              type="button"
            >
              {changingPassword && <Loader2 className="size-4 animate-spin" />}
              {changingPassword ? "Changing..." : "Update password"}
            </button>
            {passwordMessage?.type === "success" && (
              <span className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700">
                <Check className="size-3.5" strokeWidth={2.5} />
                Password changed
              </span>
            )}
            {passwordMessage?.type === "error" && (
              <span className="text-xs font-semibold text-rose-600">
                {passwordMessage.text}
              </span>
            )}
          </div>
        </section>

        {/* Preferences */}
        <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="text-base font-bold text-slate-900">Preferences</div>
          <p className="mt-1 text-xs text-slate-500">
            Ye settings isi browser mein save hoti hain.
          </p>

          <div className="mt-5 grid gap-6 lg:grid-cols-2">
            <label className="block max-w-xs">
              <span className="mb-1.5 block text-xs font-semibold text-slate-500">
                Timezone
              </span>
              <span className="relative block">
                <select
                  className="h-11 w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-700 outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
                  onChange={(event) => setTimezone(event.target.value)}
                  value={timezone}
                >
                  {timezoneOptions.map((tz) => (
                    <option key={tz}>{tz}</option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              </span>
              <span className="mt-2 block text-xs text-slate-400">
                Selected: {timezone}
              </span>
            </label>

            <div className="divide-y divide-slate-100">
              {notificationOptions.map((item) => (
                <div
                  className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0"
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
          </div>
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
          <div className="flex items-center gap-2">
            <AlertTriangle className="size-4 text-rose-600" />
            <div className="text-base font-bold text-rose-900">Danger zone</div>
          </div>
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

          <div className="mt-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-rose-700">
                Permanently delete your account, all posts, and all data. Ye
                action kabhi wapas nahi hota.
              </p>
              <button
                className="flex h-10 shrink-0 items-center gap-2 rounded-xl border border-rose-300 bg-white px-5 text-sm font-semibold text-rose-600 transition hover:bg-rose-600 hover:text-white"
                onClick={() => {
                  setConfirmingDelete(true)
                  setDeleteError(null)
                }}
                type="button"
              >
                <Trash2 className="size-4" />
                Delete workspace
              </button>
            </div>

            {confirmingDelete && (
              <div className="mt-4 rounded-xl border border-rose-200 bg-white p-4">
                <p className="text-sm font-semibold text-rose-800">
                  Confirm karne ke liye neeche <code className="rounded bg-rose-50 px-1.5 py-0.5 font-mono text-xs">DELETE</code> type karein:
                </p>
                <div className="mt-3 flex flex-col gap-3 sm:flex-row">
                  <input
                    className="h-11 flex-1 rounded-xl border border-rose-200 bg-rose-50/50 px-4 text-sm font-semibold text-slate-900 outline-none transition focus:border-rose-400 focus:bg-white focus:ring-4 focus:ring-rose-100"
                    onChange={(event) => setDeleteText(event.target.value)}
                    placeholder="Type DELETE"
                    type="text"
                    value={deleteText}
                  />
                  <button
                    className="flex h-11 items-center justify-center gap-2 rounded-xl bg-rose-600 px-5 text-sm font-semibold text-white shadow-lg shadow-rose-200 transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-40"
                    disabled={deleteText !== "DELETE" || deleting}
                    onClick={handleDeleteAccount}
                    type="button"
                  >
                    {deleting && <Loader2 className="size-4 animate-spin" />}
                    {deleting ? "Deleting..." : "Permanently delete"}
                  </button>
                  <button
                    className="h-11 rounded-xl border border-slate-200 px-5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                    disabled={deleting}
                    onClick={() => {
                      setConfirmingDelete(false)
                      setDeleteText("")
                      setDeleteError(null)
                    }}
                    type="button"
                  >
                    Cancel
                  </button>
                </div>
                {deleteError && (
                  <p className="mt-3 text-xs font-semibold text-rose-600">
                    {deleteError}
                  </p>
                )}
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  )
}
