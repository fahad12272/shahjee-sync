import { Check, Link2, Zap } from "lucide-react"

export function ConnectedAccounts({ accounts, onToggleAccount }) {
  const connectedCount = accounts.filter(
    (account) => account.status === "Connected",
  ).length

  return (
    <main className="flex-1 bg-slate-50 px-4 py-7 md:px-8 md:py-10 lg:px-10">
      <div className="mx-auto max-w-7xl">
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
              Connect and manage the social profiles you use to publish content.
            </p>
          </div>

          <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
            <div className="flex size-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
              <Check className="size-4.5" strokeWidth={2.5} />
            </div>
            <div>
              <div className="text-sm font-bold text-slate-900">
                {connectedCount} of {accounts.length}
              </div>
              <div className="text-xs text-slate-500">Accounts connected</div>
            </div>
          </div>
        </div>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {accounts.map((account) => {
            const Icon = account.icon
            const isConnected = account.status === "Connected"

            return (
              <article
                className={`group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md ${account.accent}`}
                key={account.name}
              >
                <div className="flex items-start justify-between gap-4">
                  <div
                    className={`flex size-12 items-center justify-center rounded-xl shadow-sm ${account.iconStyle}`}
                  >
                    <Icon aria-hidden="true" className="size-5" />
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${
                      isConnected
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {isConnected ? (
                      <span className="flex items-center gap-1.5">
                        <span className="size-1.5 rounded-full bg-emerald-500" />
                        Connected
                      </span>
                    ) : (
                      "Not Connected"
                    )}
                  </span>
                </div>

                <div className="mt-5">
                  <div className="text-base font-bold text-slate-900">
                    {account.name}
                  </div>
                  <div
                    className={`mt-1 truncate text-sm font-semibold ${
                      isConnected ? "text-slate-600" : "text-slate-400"
                    }`}
                  >
                    {account.handle}
                  </div>
                </div>

                <div className="mt-5 border-t border-slate-100 pt-4">
                  <button
                    className={`flex h-10 w-full items-center justify-center rounded-xl border text-sm font-semibold transition ${
                      isConnected
                        ? "border-rose-200 bg-white text-rose-600 hover:border-rose-300 hover:bg-rose-50"
                        : "border-indigo-200 bg-indigo-50 text-indigo-700 hover:border-indigo-300 hover:bg-indigo-100"
                    }`}
                    onClick={() => onToggleAccount(account.name)}
                    type="button"
                  >
                    {isConnected ? "Disconnect" : "Connect Account"}
                  </button>
                </div>
              </article>
            )
          })}
        </section>

        <div className="mt-6 flex items-start gap-3 rounded-2xl border border-indigo-100 bg-indigo-50/60 p-4 text-sm text-indigo-900">
          <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg bg-white text-indigo-600 shadow-sm">
            <Zap className="size-3.5 fill-current" />
          </div>
          <p className="leading-6">
            Connected accounts are securely authorized and can be removed at any
            time. Shahjee Sync never stores your social passwords.
          </p>
        </div>
      </div>
    </main>
  )
}