import { CheckCircle2, Info, X, XCircle } from "lucide-react"

const toastStyles = {
  success: "border-emerald-200 bg-white",
  error: "border-rose-200 bg-white",
  info: "border-indigo-200 bg-white",
}

const toastIcons = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
}

const toastIconColors = {
  success: "text-emerald-500",
  error: "text-rose-500",
  info: "text-indigo-500",
}

export function ToastContainer({ toasts, onDismiss }) {
  return (
    <div className="pointer-events-none fixed bottom-5 right-5 z-[70] flex w-[calc(100vw-2.5rem)] max-w-sm flex-col gap-2.5">
      {toasts.map((toast) => {
        const Icon = toastIcons[toast.type]
        return (
          <div
            className="animate-toast-in pointer-events-auto flex items-start gap-3 rounded-xl border p-3.5 shadow-lg shadow-slate-300/50"
            key={toast.id}
            role="status"
          >
            <div
              className={`flex flex-1 items-start gap-3 ${toastStyles[toast.type]} rounded-lg`}
            >
              <Icon
                className={`mt-0.5 size-4.5 shrink-0 ${toastIconColors[toast.type]}`}
              />
              <p className="flex-1 text-sm font-semibold text-slate-800">
                {toast.message}
              </p>
              {toast.action && (
                <button
                  className="shrink-0 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-slate-700"
                  onClick={() => {
                    toast.action?.onClick()
                    onDismiss(toast.id)
                  }}
                  type="button"
                >
                  {toast.action.label}
                </button>
              )}
            </div>
            <button
              aria-label="Dismiss notification"
              className="flex size-6 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
              onClick={() => onDismiss(toast.id)}
              type="button"
            >
              <X className="size-3.5" />
            </button>
          </div>
        )
      })}
    </div>
  )
}