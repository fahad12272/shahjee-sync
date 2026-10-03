import { ChevronDown, X, Zap } from "lucide-react"
import { navigation } from "../data"

export function Sidebar({
  activePage,
  onNavigate,
  mobileOpen,
  onClose,
}: {
  activePage: string
  onNavigate: (page: string) => void
  mobileOpen: boolean
  onClose: () => void
}) {
  return (
    <>
      <div
        aria-hidden="true"
        className={`fixed inset-0 z-40 bg-slate-950/25 backdrop-blur-sm transition-opacity lg:hidden ${
          mobileOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={onClose}
      />

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-slate-200 bg-white shadow-xl shadow-slate-200/40 transition-transform duration-300 lg:translate-x-0 lg:shadow-sm ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-20 shrink-0 items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-lg shadow-indigo-200">
              <Zap aria-hidden="true" className="size-5 fill-current" />
            </div>
            <div>
              <div className="text-base font-bold tracking-tight text-slate-900">
                Shahjee Sync
              </div>
              <div className="text-xs font-medium text-slate-400">
                Social workspace
              </div>
            </div>
          </div>
          <button
            aria-label="Close navigation"
            className="flex size-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 lg:hidden"
            onClick={onClose}
            type="button"
          >
            <X className="size-5" />
          </button>
        </div>

        <nav aria-label="Primary navigation" className="flex-1 px-4 py-5">
          <div className="mb-3 px-3 text-[11px] font-semibold uppercase tracking-widest text-slate-400">
            Workspace
          </div>
          <div className="space-y-1.5">
            {navigation.map((item) => {
              const Icon = item.icon
              const isActive = activePage === item.label

              return (
                <button
                  className={`group flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-left text-sm font-semibold transition-all ${
                    isActive
                      ? "bg-indigo-50 text-indigo-700 shadow-sm shadow-indigo-100/60"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                  key={item.label}
                  onClick={() => {
                    onNavigate(item.label)
                    onClose()
                  }}
                  type="button"
                >
                  <Icon
                    aria-hidden="true"
                    className={`size-5 ${
                      isActive
                        ? "text-indigo-600"
                        : "text-slate-400 group-hover:text-slate-600"
                    }`}
                    strokeWidth={isActive ? 2.25 : 2}
                  />
                  <span>{item.label}</span>
                  {isActive && (
                    <span className="ml-auto size-1.5 rounded-full bg-indigo-600" />
                  )}
                </button>
              )
            })}
          </div>
        </nav>

        <div className="p-4">
          <button
            className="flex w-full items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 text-left transition hover:border-slate-300 hover:bg-slate-100"
            type="button"
          >
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-sm font-bold text-white">
              SJ
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-semibold text-slate-900">
                Shahjee Khan
              </div>
              <div className="truncate text-xs text-slate-500">
                shahjee@example.com
              </div>
            </div>
            <ChevronDown className="size-4 shrink-0 text-slate-400" />
          </button>
        </div>
      </aside>
    </>
  )
}