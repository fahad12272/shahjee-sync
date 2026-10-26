import { useEffect, useState } from "react"
import {
  AlertCircle,
  Check,
  ChevronDown,
  ExternalLink,
  Link2,
  Loader2,
  Send,
  ShieldCheck,
  Zap,
} from "lucide-react"
import { FaXTwitter } from "react-icons/fa6"
import {
  apiConnectTelegram,
  apiConnectX,
  apiDisconnectPlatform,
  apiGetPlatforms,
} from "../api"

// Abhi real posting sirf X + Telegram pe hai — baaki platforms road map pe
const COMING_SOON = [
  { name: "Instagram", icon: null, note: "Meta review ke baad aayega" },
  { name: "Facebook Pages", icon: null, note: "Meta review ke baad aayega" },
  { name: "LinkedIn", icon: null, note: "Approval process ke baad aayega" },
  { name: "YouTube Shorts", icon: null, note: "Coming soon" },
]

const inputClass =
  "h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"

function formatConnectedAt(value) {
  if (!value) return ""
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ""
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

function StatusBadge({ connected }) {
  return (
    <span
      className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${
        connected
          ? "bg-emerald-50 text-emerald-700"
          : "bg-slate-100 text-slate-600"
      }`}
    >
      {connected ? (
        <span className="flex items-center gap-1.5">
          <span className="size-1.5 rounded-full bg-emerald-500" />
          Connected
        </span>
      ) : (
        "Not Connected"
      )}
    </span>
  )
}

function SetupGuide({ children }) {
  return (
    <details className="group mt-4 rounded-xl border border-slate-200 bg-slate-50/80">
      <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 text-xs font-bold text-slate-700">
        Setup guide — keys kahan se milti hain?
        <ChevronDown className="size-4 text-slate-400 transition group-open:rotate-180" />
      </summary>
      <div className="border-t border-slate-200 px-4 py-3 text-xs leading-6 text-slate-600">
        {children}
      </div>
    </details>
  )
}

export function ConnectedAccounts({ showToast, addActivity, onPlatformsChanged }) {
  const [platforms, setPlatforms] = useState(null)
  const [loadError, setLoadError] = useState("")

  // X connection form
  const [xOpen, setXOpen] = useState(false)
  const [xForm, setXForm] = useState({
    apiKey: "",
    apiSecret: "",
    accessToken: "",
    accessSecret: "",
  })
  const [xSaving, setXSaving] = useState(false)

  // Telegram connection form
  const [tgOpen, setTgOpen] = useState(false)
  const [tgForm, setTgForm] = useState({ botToken: "", chatId: "" })
  const [tgSaving, setTgSaving] = useState(false)

  const [disconnecting, setDisconnecting] = useState("")

  const loadPlatforms = async () => {
    setLoadError("")
    try {
      const data = await apiGetPlatforms()
      setPlatforms(data)
    } catch (error) {
      setLoadError(error.message)
    }
  }

  useEffect(() => {
    loadPlatforms()
  }, [])

  const handleConnectX = async (event) => {
    event.preventDefault()
    if (xSaving) return
    setXSaving(true)
    try {
      const data = await apiConnectX(xForm)
      showToast(data.message || "X connected!", "success")
      addActivity("X account was connected", "account")
      setXForm({
        apiKey: "",
        apiSecret: "",
        accessToken: "",
        accessSecret: "",
      })
      setXOpen(false)
      // Fresh state server se — masked previews sahi dikhenge
      await loadPlatforms()
      onPlatformsChanged?.()
    } catch (error) {
      showToast(error.message, "error")
    } finally {
      setXSaving(false)
    }
  }

  const handleConnectTelegram = async (event) => {
    event.preventDefault()
    if (tgSaving) return
    setTgSaving(true)
    try {
      const data = await apiConnectTelegram(tgForm)
      showToast(data.message || "Telegram connected!", "success")
      addActivity("Telegram account was connected", "account")
      setTgForm({ botToken: "", chatId: "" })
      setTgOpen(false)
      // Fresh state server se — masked previews sahi dikhenge
      await loadPlatforms()
      onPlatformsChanged?.()
    } catch (error) {
      showToast(error.message, "error")
    } finally {
      setTgSaving(false)
    }
  }

  const handleDisconnect = async (platform, label) => {
    if (disconnecting) return
    const sure = window.confirm(
      `${label} disconnect karein? Aage ke scheduled posts is platform pe publish nahi hongi.`,
    )
    if (!sure) return
    setDisconnecting(platform)
    try {
      await apiDisconnectPlatform(platform)
      showToast(`${label} disconnect ho gaya`, "info")
      addActivity(`${label} account was disconnected`, "account")
      // Fresh state server se
      await loadPlatforms()
      onPlatformsChanged?.()
    } catch (error) {
      showToast(error.message, "error")
    } finally {
      setDisconnecting("")
    }
  }

  const xConnected = Boolean(platforms?.x?.connected)
  const tgConnected = Boolean(platforms?.telegram?.connected)
  const connectedCount = [xConnected, tgConnected].filter(Boolean).length

  return (
    <main className="flex-1 bg-slate-50 px-4 py-7 md:px-8 md:py-10 lg:px-10">
      <div className="mx-auto max-w-7xl">
        {/* ---------- Header ---------- */}
        <div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-indigo-600">
              <Link2 className="size-3.5" />
              Account hub
            </div>
            <div className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
              Social Connections
            </div>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              X aur Telegram connect karo — scheduled posts automatically
              publish hongi. Secrets AES-256 encrypted store hote hain.
            </p>
          </div>

          <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
            <div className="flex size-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
              <Check className="size-4.5" strokeWidth={2.5} />
            </div>
            <div>
              <div className="text-sm font-bold text-slate-900">
                {connectedCount} of 2
              </div>
              <div className="text-xs text-slate-500">Platforms connected</div>
            </div>
          </div>
        </div>

        {/* ---------- Load error ---------- */}
        {loadError ? (
          <div className="mb-6 flex flex-col items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3 text-sm text-rose-800">
              <AlertCircle className="mt-0.5 size-4.5 shrink-0" />
              <span>Connections load nahi hui — {loadError}</span>
            </div>
            <button
              className="flex h-9 items-center gap-2 rounded-lg bg-rose-600 px-4 text-xs font-bold text-white transition hover:bg-rose-700"
              onClick={loadPlatforms}
              type="button"
            >
              <Loader2 className="size-3.5" />
              Retry
            </button>
          </div>
        ) : null}

        {/* ---------- Loading ---------- */}
        {platforms === null && !loadError ? (
          <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500 shadow-sm">
            <Loader2 className="size-4.5 animate-spin text-indigo-500" />
            Connections load ho rahi hain…
          </div>
        ) : null}

        {/* ---------- Real platform cards ---------- */}
        {platforms !== null ? (
          <section className="grid gap-4 lg:grid-cols-2">
            {/* ============ X (Twitter) ============ */}
            <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md group-hover:border-slate-300">
              <div className="flex items-start justify-between gap-4">
                <div className="flex size-12 items-center justify-center rounded-xl bg-slate-950 text-white shadow-sm">
                  <FaXTwitter aria-hidden="true" className="size-5" />
                </div>
                <StatusBadge connected={xConnected} />
              </div>

              <div className="mt-5">
                <div className="text-base font-bold text-slate-900">
                  X (Twitter)
                </div>
                <div
                  className={`mt-1 truncate text-sm font-semibold ${
                    xConnected ? "text-slate-600" : "text-slate-400"
                  }`}
                >
                  {xConnected ? platforms.x.handle : "No account linked"}
                </div>
                {xConnected && platforms.x.connectedAt ? (
                  <div className="mt-0.5 text-xs text-slate-400">
                    Connected on {formatConnectedAt(platforms.x.connectedAt)}
                  </div>
                ) : null}
              </div>

              {xConnected && platforms.x.masked ? (
                <div className="mt-4 space-y-1 rounded-xl bg-slate-50 px-3.5 py-3 text-xs text-slate-500">
                  <div className="flex items-center gap-1.5 font-semibold text-slate-600">
                    <ShieldCheck className="size-3.5 text-emerald-500" />
                    Keys encrypted hain
                  </div>
                  <div>API Key: {platforms.x.masked.apiKey || "—"}</div>
                  <div>Access Token: {platforms.x.masked.accessToken || "—"}</div>
                </div>
              ) : null}

              {!xConnected ? (
                <div className="mt-5 border-t border-slate-100 pt-4">
                  {xOpen ? (
                    <form className="space-y-3" onSubmit={handleConnectX}>
                      <input
                        className={inputClass}
                        onChange={(event) =>
                          setXForm({ ...xForm, apiKey: event.target.value })
                        }
                        placeholder="API Key"
                        type="text"
                        value={xForm.apiKey}
                      />
                      <input
                        className={inputClass}
                        onChange={(event) =>
                          setXForm({ ...xForm, apiSecret: event.target.value })
                        }
                        placeholder="API Key Secret"
                        type="password"
                        value={xForm.apiSecret}
                      />
                      <input
                        className={inputClass}
                        onChange={(event) =>
                          setXForm({ ...xForm, accessToken: event.target.value })
                        }
                        placeholder="Access Token"
                        type="password"
                        value={xForm.accessToken}
                      />
                      <input
                        className={inputClass}
                        onChange={(event) =>
                          setXForm({
                            ...xForm,
                            accessSecret: event.target.value,
                          })
                        }
                        placeholder="Access Token Secret"
                        type="password"
                        value={xForm.accessSecret}
                      />
                      <SetupGuide>
                        <p className="font-bold text-slate-700">
                          developer.x.com se (free account):
                        </p>
                        <ol className="mt-1 list-decimal space-y-1 pl-4">
                          <li>
                            <a
                              className="inline-flex items-center gap-1 font-semibold text-indigo-600 hover:underline"
                              href="https://developer.x.com"
                              rel="noreferrer"
                              target="_blank"
                            >
                              developer.x.com <ExternalLink className="size-3" />
                            </a>{" "}
                            pe sign up karo (free tier)
                          </li>
                          <li>Dashboard → Project &amp; App banao</li>
                          <li>
                            App settings →{" "}
                            <b>User authentication settings</b> → Edit →{" "}
                            <b>Read and Write</b> permissions select karo
                          </li>
                          <li>
                            <b>Keys and tokens</b> tab se charo values copy karo:
                            API Key, API Key Secret, Access Token, Access Token
                            Secret
                          </li>
                        </ol>
                      </SetupGuide>
                      <div className="flex gap-2">
                        <button
                          className="flex h-10 flex-1 items-center justify-center gap-2 rounded-xl bg-indigo-600 text-sm font-bold text-white transition hover:bg-indigo-700 disabled:opacity-60"
                          disabled={xSaving}
                          type="submit"
                        >
                          {xSaving ? (
                            <Loader2 className="size-4 animate-spin" />
                          ) : null}
                          {xSaving ? "Verify ho raha hai…" : "Save & Connect"}
                        </button>
                        <button
                          className="h-10 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-500 transition hover:bg-slate-50"
                          onClick={() => setXOpen(false)}
                          type="button"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  ) : (
                    <button
                      className="flex h-10 w-full items-center justify-center rounded-xl border border-indigo-200 bg-indigo-50 text-sm font-semibold text-indigo-700 transition hover:border-indigo-300 hover:bg-indigo-100"
                      onClick={() => setXOpen(true)}
                      type="button"
                    >
                      Connect X Account
                    </button>
                  )}
                </div>
              ) : (
                <div className="mt-5 border-t border-slate-100 pt-4">
                  <button
                    className="flex h-10 w-full items-center justify-center rounded-xl border border-rose-200 bg-white text-sm font-semibold text-rose-600 transition hover:border-rose-300 hover:bg-rose-50 disabled:opacity-60"
                    disabled={disconnecting === "x"}
                    onClick={() => handleDisconnect("x", "X")}
                    type="button"
                  >
                    {disconnecting === "x" ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : null}
                    Disconnect
                  </button>
                </div>
              )}
            </article>

            {/* ============ Telegram ============ */}
            <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md group-hover:border-slate-300">
              <div className="flex items-start justify-between gap-4">
                <div className="flex size-12 items-center justify-center rounded-xl bg-sky-500 text-white shadow-sm">
                  <Send aria-hidden="true" className="size-5" />
                </div>
                <StatusBadge connected={tgConnected} />
              </div>

              <div className="mt-5">
                <div className="text-base font-bold text-slate-900">
                  Telegram
                </div>
                <div
                  className={`mt-1 truncate text-sm font-semibold ${
                    tgConnected ? "text-slate-600" : "text-slate-400"
                  }`}
                >
                  {tgConnected ? platforms.telegram.chatTitle : "No chat linked"}
                </div>
                {tgConnected && platforms.telegram.connectedAt ? (
                  <div className="mt-0.5 text-xs text-slate-400">
                    Connected on {formatConnectedAt(platforms.telegram.connectedAt)}
                  </div>
                ) : null}
              </div>

              {tgConnected && platforms.telegram.masked ? (
                <div className="mt-4 space-y-1 rounded-xl bg-slate-50 px-3.5 py-3 text-xs text-slate-500">
                  <div className="flex items-center gap-1.5 font-semibold text-slate-600">
                    <ShieldCheck className="size-3.5 text-emerald-500" />
                    Bot token encrypted hai
                  </div>
                  <div>Bot Token: {platforms.telegram.masked.botToken || "—"}</div>
                </div>
              ) : null}

              {!tgConnected ? (
                <div className="mt-5 border-t border-slate-100 pt-4">
                  {tgOpen ? (
                    <form className="space-y-3" onSubmit={handleConnectTelegram}>
                      <input
                        className={inputClass}
                        onChange={(event) =>
                          setTgForm({ ...tgForm, botToken: event.target.value })
                        }
                        placeholder="Bot Token (123456789:ABC...)"
                        type="password"
                        value={tgForm.botToken}
                      />
                      <input
                        className={inputClass}
                        onChange={(event) =>
                          setTgForm({ ...tgForm, chatId: event.target.value })
                        }
                        placeholder="Chat ID (@channel ya -100123456789)"
                        type="text"
                        value={tgForm.chatId}
                      />
                      <SetupGuide>
                        <p className="font-bold text-slate-700">
                          100% free — sirf 2 minute ka kaam:
                        </p>
                        <ol className="mt-1 list-decimal space-y-1 pl-4">
                          <li>
                            Telegram pe{" "}
                            <a
                              className="inline-flex items-center gap-1 font-semibold text-indigo-600 hover:underline"
                              href="https://t.me/BotFather"
                              rel="noreferrer"
                              target="_blank"
                            >
                              @BotFather <ExternalLink className="size-3" />
                            </a>{" "}
                            kholo → <b>/newbot</b> bhejo → bot ka naam do →{" "}
                            <b>Bot Token</b> copy karo
                          </li>
                          <li>
                            Apne channel/group mein bot ko <b>admin</b> banao
                            (post permission ke saath)
                          </li>
                          <li>
                            Channel ka <b>Chat ID</b> lo: @userinfobot ya
                            @getidsbot ko message karke — public channel ke liye
                            @channelusername bhi chalta hai
                          </li>
                          <li>
                            Save karte hi ek test message jayega — bot wahan
                            post kar sakta hai, ye confirm ho jayega
                          </li>
                        </ol>
                      </SetupGuide>
                      <div className="flex gap-2">
                        <button
                          className="flex h-10 flex-1 items-center justify-center gap-2 rounded-xl bg-sky-500 text-sm font-bold text-white transition hover:bg-sky-600 disabled:opacity-60"
                          disabled={tgSaving}
                          type="submit"
                        >
                          {tgSaving ? (
                            <Loader2 className="size-4 animate-spin" />
                          ) : null}
                          {tgSaving ? "Test message ja raha hai…" : "Save & Connect"}
                        </button>
                        <button
                          className="h-10 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-500 transition hover:bg-slate-50"
                          onClick={() => setTgOpen(false)}
                          type="button"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  ) : (
                    <button
                      className="flex h-10 w-full items-center justify-center rounded-xl border border-sky-200 bg-sky-50 text-sm font-semibold text-sky-700 transition hover:border-sky-300 hover:bg-sky-100"
                      onClick={() => setTgOpen(true)}
                      type="button"
                    >
                      Connect Telegram
                    </button>
                  )}
                </div>
              ) : (
                <div className="mt-5 border-t border-slate-100 pt-4">
                  <button
                    className="flex h-10 w-full items-center justify-center rounded-xl border border-rose-200 bg-white text-sm font-semibold text-rose-600 transition hover:border-rose-300 hover:bg-rose-50 disabled:opacity-60"
                    disabled={disconnecting === "telegram"}
                    onClick={() => handleDisconnect("telegram", "Telegram")}
                    type="button"
                  >
                    {disconnecting === "telegram" ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : null}
                    Disconnect
                  </button>
                </div>
              )}
            </article>
          </section>
        ) : null}

        {/* ---------- Coming soon platforms ---------- */}
        <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {COMING_SOON.map((item) => (
            <article
              className="rounded-2xl border border-dashed border-slate-300 bg-white/60 p-5"
              key={item.name}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex size-10 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
                  <Link2 className="size-4" />
                </div>
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-500">
                  Soon
                </span>
              </div>
              <div className="mt-4 text-sm font-bold text-slate-600">
                {item.name}
              </div>
              <div className="mt-1 text-xs leading-5 text-slate-400">
                {item.note}
              </div>
            </article>
          ))}
        </section>

        {/* ---------- Security note ---------- */}
        <div className="mt-6 flex items-start gap-3 rounded-2xl border border-indigo-100 bg-indigo-50/60 p-4 text-sm text-indigo-900">
          <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg bg-white text-indigo-600 shadow-sm">
            <Zap className="size-3.5 fill-current" />
          </div>
          <p className="leading-6">
            Tumhari keys <b>AES-256-GCM encryption</b> ke saath store hoti hain
            aur API se kabhi raw return nahi hoti — sirf last 4 characters ka
            preview dikhta hai. Keys kabhi bhi disconnect karke hata sakte ho.
          </p>
        </div>
      </div>
    </main>
  )
}
