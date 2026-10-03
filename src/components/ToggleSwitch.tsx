export function ToggleSwitch({
  enabled,
  label,
  onToggle,
}: {
  enabled: boolean
  label: string
  onToggle: () => void
}) {
  return (
    <button
      aria-checked={enabled}
      aria-label={label}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 ${
        enabled ? "bg-indigo-600" : "bg-slate-300"
      }`}
      onClick={onToggle}
      role="switch"
      type="button"
    >
      <span
        className={`inline-block size-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${
          enabled ? "translate-x-5" : "translate-x-0.5"
        }`}
      />
    </button>
  )
}