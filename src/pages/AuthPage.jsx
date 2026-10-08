import { useState } from "react"
import {
  ArrowLeft,
  ArrowRight,
  Eye,
  EyeOff,
  Lock,
  Mail,
  User as UserIcon,
  Zap,
} from "lucide-react"
import { login, signup } from "../auth"

export function AuthPage({ mode, onAuth, onBack, onSwitchMode }) {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState(null)

  const isSignup = mode === "signup"

  const handleSubmit = (event) => {
    event.preventDefault()
    setError(null)

    const result = isSignup
      ? signup(name, email, password)
      : login(email, password)

    if (result.ok) {
      onAuth(result.user)
    } else {
      setError(result.error)
    }
  }

  const switchMode = () => {
    setError(null)
    onSwitchMode(isSignup ? "login" : "signup")
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
            Your social media command center.
          </h2>
          <ul className="mt-8 space-y-3.5 text-sm text-indigo-100">
            {[
              "Publish to 6 platforms from one place",
              "Calendar & analytics built right in",
              "Your workspace — your data, always",
            ].map((item) => (
              <li className="flex items-center gap-2.5" key={item}>
                <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-white/20 text-[10px]">
                  ✓
                </span>
                {item}
              </li>
            ))}
          </ul>
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
            Back to home
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

            <h1 className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
              {isSignup ? "Create your account" : "Welcome back"}
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              {isSignup
                ? "Start your social workspace in under a minute."
                : "Log in to continue to your workspace."}
            </p>

            {error && (
              <div className="mt-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
                {error}
              </div>
            )}

            <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
              {isSignup && (
                <label className="block">
                  <span className="mb-1.5 block text-xs font-semibold text-slate-500">
                    Full name
                  </span>
                  <span className="relative block">
                    <UserIcon className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                    <input
                      className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100"
                      onChange={(event) => setName(event.target.value)}
                      placeholder="Shah Fahad"
                      type="text"
                      value={name}
                    />
                  </span>
                </label>
              )}

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
                    type="email"
                    value={email}
                  />
                </span>
              </label>

              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold text-slate-500">
                  Password
                </span>
                <span className="relative block">
                  <Lock className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                  <input
                    className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-11 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100"
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder={
                      isSignup ? "At least 6 characters" : "Your password"
                    }
                    type={showPassword ? "text" : "password"}
                    value={password}
                  />
                  <button
                    aria-label={showPassword ? "Hide password" : "Show password"}
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

              <button
                className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-sm font-semibold text-white shadow-lg shadow-indigo-200 transition hover:-translate-y-0.5 hover:shadow-indigo-300"
                type="submit"
              >
                {isSignup ? "Create account" : "Log in"}
                <ArrowRight className="size-4" />
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-slate-500">
              {isSignup
                ? "Already have an account?"
                : "New to Shahjee Sync?"}{" "}
              <button
                className="font-bold text-indigo-600 transition hover:text-indigo-700"
                onClick={switchMode}
                type="button"
              >
                {isSignup ? "Log in" : "Create one free"}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}