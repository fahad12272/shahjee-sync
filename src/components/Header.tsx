import { Bell, Menu, Plus, Search } from "lucide-react"

export function Header({
    pageTitle,
    onOpenMenu,
    onNewPost,
}: {
    pageTitle: string
    onOpenMenu: () => void
    onNewPost: () => void
}) {
    return (
        <header className="sticky top-0 z-30 flex h-20 items-center gap-4 border-b border-slate-200 bg-white/95 px-4 backdrop-blur md:px-8 lg:pl-10 lg:pr-8">
            <button
                aria-label="Open navigation"
                className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:bg-slate-50 lg:hidden"
                onClick={onOpenMenu}
                type="button"
            >
                <Menu className="size-5" />
            </button>

            <div className="min-w-0">
                <div className="truncate text-lg font-bold tracking-tight text-slate-900 md:text-xl">
                    {pageTitle}
                </div>
                <div className="hidden text-xs text-slate-500 sm:block">
                    Manage your content workspace
                </div>
            </div>

            <div className="ml-auto flex items-center gap-2.5 md:gap-3">
                <label className="relative hidden lg:block">
                    <Search
                        aria-hidden="true"
                        className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400"
                    />
                    <input
                        aria-label="Search workspace"
                        className="h-11 w-72 rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100"
                        placeholder="Search workspace..."
                        type="search"
                    />
                </label>

                <button
                    aria-label="Search"
                    className="flex size-10 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-slate-900 lg:hidden"
                    type="button"
                >
                    <Search className="size-4.5" />
                </button>

                <button
                    aria-label="Notifications"
                    className="relative flex size-10 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-slate-900"
                    type="button"
                >
                    <Bell className="size-4.5" />
                    <span className="absolute right-2 top-2 size-2 rounded-full border-2 border-white bg-indigo-600" />
                </button>

                <button
                    className="flex h-10 items-center gap-2 rounded-xl bg-indigo-600 px-3.5 text-sm font-semibold text-white shadow-lg shadow-indigo-200 transition hover:bg-indigo-700 hover:shadow-indigo-300/70 md:h-11 md:px-4"
                    onClick={onNewPost}
                    type="button"
                >
                    <Plus className="size-4.5" strokeWidth={2.5} />
                    <span className="hidden sm:inline">New Post</span>
                </button>
            </div>
        </header>
    )
}