import { CheckCircle2, Info, X, XCircle } from "lucide-react"

export type ToastType = "success" | "error" | "info"

export type ToastItem = {
  id: string
  message: string
  type: ToastType
}

const toastStyles: Record<ToastType, string> = {
  success: "border-emerald-200 bg-white",
  error: "border-rose-200 bg-white",
  info: "border-indigo-200 bg-white",
}

const toastIcons: Record<ToastType, typeof CheckCircle2> = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
}

const toastIconColors: Record<ToastType, string> = {
  success: "text-emerald-500",
  error: "text-rose-500",
  info: "text-indigo-500",
}

export function ToastContainer({
  toasts,
  onDismiss,
}: {
  toasts: ToastItem[]
  onDismiss: (id: string) => void
}) {
  return (
    <div className="pointer-events-none fixed bottom-5 right-5 z-[70] flex w-[calc(100vw-2.5rem)] max-w-sm flex-col gap-2.5">
      {toasts.map((toast) => {
        const Icon = toastIcons[toast.type]
        return (
          <div
            className={`animate-toast-in pointer-events-auto flex items-start gap-3 rounded-xl border p-3.5 shadow-lg shadow-slate-300/50 ${toastStyles[toast.type]}`}
            key={toast.id}
            role="status"
          >
            <Icon
              className={`mt-0.5 size-4.5 shrink-0 ${toastIconColors[toast.type]}`}
            />
            <p className="flex-1 text-sm font-semibold text-slate-800">
              {toast.message}
            </p>
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