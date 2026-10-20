import { useState } from "react"
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  Mail,
  Zap,
} from "lucide-react"
import { apiForgotPassword, apiResetPassword } from "../api"

/* ================= Forgot Password ================= */
export function ForgotPasswordPage({ onBack }) {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [resetUrl, setResetUrl] = useState(null)
  const [error, setError] = useState(null)

  const handleSubmit = async (event) => {
    event.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const data = await apiForgotPassword(email.trim())
      setDone(true)
      // TESTING mode: SMTP set nahi hai to backend direct link deta hai
      setResetUrl(data.resetUrl || null)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Brand panel */}
      <div className="relative hidden flex-1 flex-col justify-between bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800 p-10 text-white lg:flex">
        <div className="flex items-center gap-2.5">
          <div className="flex size-10 items-center justify-center rounded-xl bg-white/15 backdrop-blur">
            <Zap className="size-5 fill-current" />
          </div>
          <div>
            <div className="text-base font-bold">Shahjee Sync</div>
            <div className="text-xs text-indigo-200">Social workspace</div>
          </div>
        </div>

        <div>
          <h2 className="max-w-md text-3xl font-bold leading-tight md:text-4xl">
            Password reset, ek email door.
          </h2>
          <p className="mt-4 max-w-md text-sm text-indigo-100">
            Apna registered email likhein — hum aapko secure reset link bhej
            denge. Link 1 ghante ke liye valid hota hai.
          </p>
        </div>

        <div className="text-xs text-indigo-200">
          © {new Date().getFullYear()} Shah Fahad — Shahjee Sync
        </div>
      </div>

      {/* Form panel */}
      <div className="flex flex-1 flex-col">
        <div className="p-4">
          <button
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 transition hover:text-slate-800"
            onClick={onBack}
            type="button"
          >
            <ArrowLeft className="size-3.5" />
            Back to login
          </button>
        </div>

        <div className="flex flex-1 items-center justify-center p-4 pb-16">
          <div className="w-full max-w-md">
            <div className="mb-6 flex items-center gap-2.5 lg:hidden">
              <div className="flex size-10 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-lg shadow-indigo-200">
                <Zap className="size-5 fill-current" />
              </div>
              <div className="text-base font-bold text-slate-900">
                Shahjee Sync
              </div>
            </div>

            {!done ? (
              <>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
                  Password bhool gaye?
                </h1>
                <p className="mt-2 text-sm text-slate-500">
                  Koi baat nahi. Apna email likhein aur hum reset link bhej
                  denge.
                </p>

                {error && (
                  <div className="mt-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
                    {error}
                  </div>
                )}

                <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
                  <label className="block">
                    <span className="mb-1.5 block text-xs font-semibold text-slate-500">
                      Email
                    </span>
                    <span className="relative block">
                      <Mail className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                      <input
                        className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100"
                        onChange={(event) => setEmail(event.target.value)}
                        placeholder="you@example.com"
                        required
                        type="email"
                        value={email}
                      />
                    </span>
                  </label>

                  <button
                    className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-sm font-semibold text-white shadow-lg shadow-indigo-200 transition hover:-translate-y-0.5 hover:shadow-indigo-300 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
                    disabled={loading}
                    type="submit"
                  >
                    {loading ? "Bhej rahe hain..." : "Reset link bhejein"}
                    {!loading && <ArrowRight className="size-4" />}
                  </button>
                </form>
              </>
            ) : (
              <>
                <div className="flex size-12 items-center justify-center rounded-xl bg-emerald-100">
                  <CheckCircle2 className="size-6 text-emerald-600" />
                </div>
                <h1 className="mt-4 text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
                  Request mil gayi!
                </h1>
                <p className="mt-2 text-sm text-slate-500">
                  Agar <span className="font-semibold">{email}</span> se koi
                  account juda hua hai, to reset link bhej diya gaya hai. Email
                  1 ghante me expire ho jayega.
                </p>

                {resetUrl && (
                  <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                    <p className="font-bold">
                      TESTING mode — email setup abhi nahi hui hai
                    </p>
                    <p className="mt-1">
                      Tab tak is direct link se password reset karein:
                    </p>
                    <a
                      className="mt-2 block break-all font-semibold text-indigo-700 underline"
                      href={resetUrl}
                    >
                      {resetUrl}
                    </a>
                  </div>
                )}

                <button
                  className="mt-6 flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                  onClick={onBack}
                  type="button"
                >
                  <ArrowLeft className="size-4" />
                  Login pe wapas jayein
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ================= Reset Password ================= */
export function ResetPasswordPage({ token, onSuccess }) {
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState(null)

  // Token hi nahi hai — link adhura hai
  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-xl shadow-slate-200/50">
          <div className="mx-auto flex size-12 items-center justify-center rounded-xl bg-rose-100">
            <KeyRound className="size-6 text-rose-600" />
          </div>
          <h1 className="mt-4 text-xl font-bold text-slate-900">
            Reset link adhura hai
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Link me reset token missing hai. Naya link lene ke liye
            &ldquo;Forgot password&rdquo; dobara use karein.
          </p>
          <button
            className="mt-6 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-sm font-semibold text-white shadow-lg shadow-indigo-200 transition hover:-translate-y-0.5"
            onClick={onSuccess}
            type="button"
          >
            Login pe jayein
            <ArrowRight className="size-4" />
          </button>
        </div>
      </div>
    )
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError(null)

    if (password.length < 6) {
      setError("Password kam se kam 6 characters ka hona chahiye.")
      return
    }
    if (password !== confirm) {
      setError("Dono passwords match nahi kar rahe. Dobara check karein.")
      return
    }

    setLoading(true)
    try {
      await apiResetPassword(token, password)
      setDone(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Brand panel */}
      <div className="relative hidden flex-1 flex-col justify-between bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800 p-10 text-white lg:flex">
        <div className="flex items-center gap-2.5">
          <div className="flex size-10 items-center justify-center rounded-xl bg-white/15 backdrop-blur">
            <Zap className="size-5 fill-current" />
          </div>
          <div>
            <div className="text-base font-bold">Shahjee Sync</div>
            <div className="text-xs text-indigo-200">Social workspace</div>
          </div>
        </div>

        <div>
          <h2 className="max-w-md text-3xl font-bold leading-tight md:text-4xl">
            Naya password banayein.
          </h2>
          <p className="mt-4 max-w-md text-sm text-indigo-100">
            Strong password rakhein — kam se kam 6 characters. Purana password
            turant invalid ho jayega.
          </p>
        </div>

        <div className="text-xs text-indigo-200">
          © {new Date().getFullYear()} Shah Fahad — Shahjee Sync
        </div>
      </div>

      {/* Form panel */}
      <div className="flex flex-1 flex-col">
        <div className="flex flex-1 items-center justify-center p-4 pb-16">
          <div className="w-full max-w-md">
            <div className="mb-6 flex items-center gap-2.5 lg:hidden">
              <div className="flex size-10 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-lg shadow-indigo-200">
                <Zap className="size-5 fill-current" />
              </div>
              <div className="text-base font-bold text-slate-900">
                Shahjee Sync
              </div>
            </div>

            {!done ? (
              <>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
                  Naya password set karein
                </h1>
                <p className="mt-2 text-sm text-slate-500">
                  Naya password likhein — iske baad naye password se log in
                  karein.
                </p>

                {error && (
                  <div className="mt-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
                    {error}
                  </div>
                )}

                <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
                  <label className="block">
                    <span className="mb-1.5 block text-xs font-semibold text-slate-500">
                      Naya password
                    </span>
                    <span className="relative block">
                      <Lock className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                      <input
                        className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-11 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100"
                        onChange={(event) => setPassword(event.target.value)}
                        placeholder="At least 6 characters"
                        required
                        type={showPassword ? "text" : "password"}
                        value={password}
                      />
                      <button
                        aria-label={
                          showPassword ? "Hide password" : "Show password"
                        }
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-600"
                        onClick={() => setShowPassword((current) => !current)}
                        type="button"
                      >
                        {showPassword ? (
                          <EyeOff className="size-4" />
                        ) : (
                          <Eye className="size-4" />
                        )}
                      </button>
                    </span>
                  </label>

                  <label className="block">
                    <span className="mb-1.5 block text-xs font-semibold text-slate-500">
                      Confirm password
                    </span>
                    <span className="relative block">
                      <KeyRound className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                      <input
                        className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100"
                        onChange={(event) => setConfirm(event.target.value)}
                        placeholder="Password dobara likhein"
                        required
                        type={showPassword ? "text" : "password"}
                        value={confirm}
                      />
                    </span>
                  </label>

                  <button
                    className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-sm font-semibold text-white shadow-lg shadow-indigo-200 transition hover:-translate-y-0.5 hover:shadow-indigo-300 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
                    disabled={loading}
                    type="submit"
                  >
                    {loading ? "Save ho raha hai..." : "Password change karein"}
                    {!loading && <ArrowRight className="size-4" />}
                  </button>
                </form>
              </>
            ) : (
              <>
                <div className="flex size-12 items-center justify-center rounded-xl bg-emerald-100">
                  <CheckCircle2 className="size-6 text-emerald-600" />
                </div>
                <h1 className="mt-4 text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
                  Password change ho gaya!
                </h1>
                <p className="mt-2 text-sm text-slate-500">
                  Ab apne naye password se log in karke workspace me wapas aa
                  jayein.
                </p>
                <button
                  className="mt-6 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-sm font-semibold text-white shadow-lg shadow-indigo-200 transition hover:-translate-y-0.5"
                  onClick={onSuccess}
                  type="button"
                >
                  Login pe jayein
                  <ArrowRight className="size-4" />
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
