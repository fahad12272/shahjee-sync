import { useEffect, useState, type DragEvent } from "react"
import {
    Camera,
    Check,
    CirclePlay,
    Clock3,
    ImagePlus,
    Send,
    Sparkles,
    UploadCloud,
} from "lucide-react"
import {
    createId,
    createThumbnail,
    platformKeyMap,
    platforms,
    type Post,
} from "../data"

export function CreatePost({
    pageTitle,
    onPublish,
    connectedPlatforms,
    schedulePreset,
}: {
    pageTitle: string
    onPublish: (post: Post) => void
    connectedPlatforms: string[]
    schedulePreset?: { value: string; key: string } | null
}) {
    const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([])
    const [caption, setCaption] = useState("")
    const [publishMode, setPublishMode] = useState<"now" | "schedule">("now")
    const [scheduleAt, setScheduleAt] = useState("")
    const [previewPlatform, setPreviewPlatform] =
        useState<"Instagram" | "YouTube">("Instagram")
    const [media, setMedia] = useState<File | null>(null)
    const [mediaUrl, setMediaUrl] = useState("")
    const [isDragging, setIsDragging] = useState(false)

    useEffect(() => {
        if (!media) {
            setMediaUrl("")
            return
        }

        const url = URL.createObjectURL(media)
        setMediaUrl(url)
        return () => URL.revokeObjectURL(url)
    }, [media])
    useEffect(() => {
        if (schedulePreset) {
            setPublishMode("schedule")
            setScheduleAt(schedulePreset.value)
        }
    }, [schedulePreset])

    const selectMedia = (file?: File) => {
        if (
            file &&
            (file.type.startsWith("image/") || file.type.startsWith("video/"))
        ) {
            setMedia(file)
        }
    }

    const handleDrop = (event: DragEvent<HTMLLabelElement>) => {
        event.preventDefault()
        setIsDragging(false)
        selectMedia(event.dataTransfer.files[0])
    }

    const togglePlatform = (name: string) => {
        setSelectedPlatforms((current) =>
            current.includes(name)
                ? current.filter((platform) => platform !== name)
                : [...current, name],
        )
    }
    const scheduledInPast =
        publishMode === "schedule" &&
        (!scheduleAt || new Date(scheduleAt).getTime() < Date.now() - 60_000)

    const handlePublish = async () => {
        const targets = selectedPlatforms.filter((name) =>
            connectedPlatforms.includes(name),
        )
        if (targets.length === 0) return

        const now = new Date()
        const scheduledFor =
            publishMode === "schedule" && scheduleAt ? new Date(scheduleAt) : now

        const fallbackImage =
            "https://images.unsplash.com/photo-1615494487949-f5f68968330e?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&q=80&w=160&h=160"

        const image = media
            ? media.type.startsWith("video/")
                ? fallbackImage
                : await createThumbnail(media)
            : fallbackImage

        onPublish({
            id: createId(),
            title: caption.trim()
                ? caption.trim().split(/\s+/).slice(0, 4).join(" ")
                : "Untitled post",
            image,
            platforms: targets.map((name) => platformKeyMap[name] ?? "instagram"),
            date: scheduledFor.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
            }),
            time: scheduledFor.toLocaleTimeString("en-US", {
                hour: "numeric",
                minute: "2-digit",
            }),
            status: publishMode === "schedule" ? "Pending" : "Published",
        })

        setCaption("")
        setMedia(null)
        setSelectedPlatforms([])
        setPublishMode("now")
        setScheduleAt("")
    }

    return (
        <main className="flex-1 bg-slate-50 px-4 py-6 md:px-8 md:py-8 lg:px-10">
            <div className="mx-auto max-w-screen-2xl">
                <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                    <div>
                        <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-indigo-600">
                            <Sparkles className="size-3.5" />
                            Creation studio
                        </div>
                        <div className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
                            {pageTitle}
                        </div>
                        <p className="mt-1.5 max-w-xl text-sm leading-6 text-slate-500">
                            Build once, preview instantly, and publish everywhere.
                        </p>
                    </div>
                    <div className="flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
                        <span className="size-1.5 rounded-full bg-emerald-500" />
                        Draft autosaved
                    </div>
                </div>

                <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,3fr)_minmax(22rem,2fr)]">
                    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                        <div className="border-b border-slate-100 px-5 py-5 sm:px-6">
                            <div className="flex items-center justify-between gap-4">
                                <div>
                                    <div className="font-bold text-slate-900">
                                        Choose destinations
                                    </div>
                                    <p className="mt-1 text-xs text-slate-500">
                                        Select where this post should be published.
                                    </p>
                                </div>
                                <div className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700">
                                    {selectedPlatforms.length} selected
                                </div>
                            </div>

                            <div className="mt-5 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                                {platforms.map((platform) => {
                                    const Icon = platform.icon
                                    const isSelected = selectedPlatforms.includes(platform.name)
                                    const isConnected = connectedPlatforms.includes(platform.name)

                                    return (
                                        <button
                                            className={`relative flex min-h-12 items-center gap-2.5 rounded-xl border px-3.5 py-2.5 text-left text-xs font-semibold shadow-sm transition ${!isConnected
                                                ? "cursor-not-allowed border-slate-200 bg-slate-50 text-slate-400 opacity-70"
                                                : isSelected
                                                    ? platform.active
                                                    : "border-slate-200 bg-white text-slate-600 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow"
                                                }`}
                                            disabled={!isConnected}
                                            key={platform.name}
                                            onClick={() => togglePlatform(platform.name)}
                                            title={
                                                isConnected ? undefined : "Connect this account first"
                                            }
                                            type="button"
                                        >
                                            <Icon className="size-4.5 shrink-0" />
                                            <span className="leading-4">{platform.name}</span>
                                            {isSelected ? (
                                                <span
                                                    className={`ml-auto flex size-4 shrink-0 items-center justify-center rounded-full text-white ${platform.check}`}
                                                >
                                                    <Check className="size-2.5" strokeWidth={3} />
                                                </span>
                                            ) : !isConnected ? (
                                                <span className="ml-auto text-[9px] font-semibold text-slate-400">
                                                    Not connected
                                                </span>
                                            ) : null}
                                        </button>
                                    )
                                })}
                            </div>
                        </div>

                        <div className="space-y-6 p-5 sm:p-6">
                            <div>
                                <div className="mb-2.5 flex items-center justify-between">
                                    <label
                                        className="text-sm font-semibold text-slate-800"
                                        htmlFor="media-upload"
                                    >
                                        Media
                                    </label>
                                    <span className="text-xs text-slate-400">
                                        JPG, PNG, MP4 up to 100MB
                                    </span>
                                </div>
                                <label
                                    className={`group flex min-h-44 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-8 text-center transition ${isDragging
                                        ? "border-indigo-400 bg-indigo-50"
                                        : "border-slate-300 bg-slate-50/50 hover:border-indigo-300 hover:bg-indigo-50/50"
                                        }`}
                                    htmlFor="media-upload"
                                    onDragEnter={(event) => {
                                        event.preventDefault()
                                        setIsDragging(true)
                                    }}
                                    onDragLeave={() => setIsDragging(false)}
                                    onDragOver={(event) => event.preventDefault()}
                                    onDrop={handleDrop}
                                >
                                    <input
                                        accept="image/*,video/*"
                                        className="sr-only"
                                        id="media-upload"
                                        onChange={(event) => selectMedia(event.target.files?.[0])}
                                        type="file"
                                    />
                                    <div className="mb-3 flex size-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-indigo-600 shadow-sm transition group-hover:scale-105">
                                        {media ? (
                                            <ImagePlus className="size-5" />
                                        ) : (
                                            <UploadCloud className="size-5" />
                                        )}
                                    </div>
                                    <div className="text-sm font-semibold text-slate-800">
                                        {media ? media.name : "Drop your media here"}
                                    </div>
                                    <div className="mt-1 text-xs text-slate-500">
                                        {media
                                            ? "Click to replace this file"
                                            : "or click to browse your files"}
                                    </div>
                                </label>
                            </div>

                            <div>
                                <div className="mb-2.5 flex items-center justify-between gap-3">
                                    <label
                                        className="text-sm font-semibold text-slate-800"
                                        htmlFor="caption"
                                    >
                                        Caption
                                    </label>
                                    <button
                                        className="flex items-center gap-1.5 rounded-full border border-violet-200 bg-violet-50 px-3 py-1.5 text-xs font-semibold text-violet-700 transition hover:bg-violet-100"
                                        onClick={() =>
                                            setCaption(
                                                "Fresh ideas, made to move. Here's a look at what we've been creating lately. What do you think?",
                                            )
                                        }
                                        type="button"
                                    >
                                        <Sparkles className="size-3.5" />
                                        AI Suggest Caption
                                    </button>
                                </div>
                                <div className="overflow-hidden rounded-xl border border-slate-200 bg-white transition focus-within:border-indigo-400 focus-within:ring-4 focus-within:ring-indigo-100">
                                    <textarea
                                        className="min-h-36 w-full resize-none bg-transparent px-4 py-3.5 text-sm leading-6 text-slate-800 outline-none placeholder:text-slate-400"
                                        id="caption"
                                        maxLength={2200}
                                        onChange={(event) => setCaption(event.target.value)}
                                        placeholder="Write something your audience will love..."
                                        value={caption}
                                    />
                                    <div className="flex items-center justify-between border-t border-slate-100 px-4 py-2.5 text-xs text-slate-400">
                                        <span>Add #hashtags and @mentions</span>
                                        <span>{caption.length} / 2,200</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col gap-4 border-t border-slate-100 bg-slate-50/70 p-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                            <div className="flex flex-wrap items-center gap-3">
                                <div className="flex w-fit rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
                                    <button
                                        className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-semibold transition ${publishMode === "now"
                                            ? "bg-slate-900 text-white"
                                            : "text-slate-500 hover:text-slate-900"
                                            }`}

                                        onClick={() => setPublishMode("now")}
                                        type="button"

                                    >
                                        <Send className="size-3.5" />
                                        Post Now
                                    </button>
                                    <button
                                        className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-semibold transition ${publishMode === "schedule"
                                            ? "bg-slate-900 text-white"
                                            : "text-slate-500 hover:text-slate-900"
                                            }`}
                                        onClick={() => setPublishMode("schedule")}
                                        type="button"
                                    >
                                        <Clock3 className="size-3.5" />
                                        Schedule
                                    </button>
                                </div>

                                {publishMode === "schedule" && (
                                    <input
                                        aria-label="Schedule date and time"
                                        className="h-11 rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-semibold text-slate-700 outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
                                        onChange={(event) => setScheduleAt(event.target.value)}
                                        type="datetime-local"
                                        value={scheduleAt}
                                    />

                                )}
                                {scheduledInPast && (
                                    <p className="w-full text-xs font-semibold text-rose-600">
                                        Scheduled time is in the past — pick a future date and
                                        time.
                                    </p>
                                )}
                            </div>

                            <button
                                className="flex h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-5 text-sm font-semibold text-white shadow-lg shadow-indigo-200 transition hover:-translate-y-0.5 hover:shadow-indigo-300 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
                                disabled={selectedPlatforms.length === 0 || scheduledInPast}
                                onClick={handlePublish}
                                type="button"
                            >
                                Publish to Selected Accounts
                                <Send className="size-4" />
                            </button>
                        </div>
                    </section>

                    <aside className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 xl:sticky xl:top-24">
                        <div className="mb-5 flex items-center justify-between">
                            <div>
                                <div className="font-bold text-slate-900">Live preview</div>
                                <p className="mt-1 text-xs text-slate-500">
                                    See changes as you create.
                                </p>
                            </div>
                            <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-600">
                                <span className="size-1.5 rounded-full bg-emerald-500" />
                                Live
                            </span>
                        </div>

                        <div className="mx-auto mb-6 flex max-w-xs rounded-xl bg-slate-100 p-1">
                            {(["Instagram", "YouTube"] as const).map((platform) => (
                                <button
                                    className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-xs font-semibold transition ${previewPlatform === platform
                                        ? "bg-white text-slate-900 shadow-sm"
                                        : "text-slate-500"
                                        }`}
                                    key={platform}
                                    onClick={() => setPreviewPlatform(platform)}
                                    type="button"
                                >
                                    {platform === "Instagram" ? (
                                        <Camera className="size-3.5" />
                                    ) : (
                                        <CirclePlay className="size-3.5" />
                                    )}
                                    {platform}
                                </button>
                            ))}
                        </div>

                        <div className="rounded-2xl bg-gradient-to-b from-slate-100 to-indigo-50/60 px-4 py-7">
                            <div className="mx-auto w-full max-w-72 rounded-[2.75rem] border-[7px] border-slate-900 bg-slate-900 p-1 shadow-2xl shadow-slate-400/40">
                                <div className="relative overflow-hidden rounded-[2.15rem] bg-white">
                                    <div className="absolute left-1/2 top-2 z-20 h-5 w-20 -translate-x-1/2 rounded-full bg-slate-900" />
                                    <div className="flex h-12 items-end justify-between border-b border-slate-100 px-4 pb-2">
                                        <div className="flex items-center gap-2">
                                            <div className="flex size-6 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-[8px] font-bold text-white">
                                                SS
                                            </div>
                                            <span className="text-[10px] font-bold text-slate-800">
                                                shahjee.sync
                                            </span>
                                        </div>
                                        <span className="text-sm font-bold text-slate-500">
                                            •••
                                        </span>
                                    </div>

                                    <div className="flex aspect-square items-center justify-center overflow-hidden bg-slate-100">
                                        {mediaUrl ? (
                                            media?.type.startsWith("video/") ? (
                                                <video
                                                    autoPlay
                                                    className="size-full object-cover"
                                                    loop
                                                    muted
                                                    playsInline
                                                    src={mediaUrl}
                                                />
                                            ) : (
                                                <img
                                                    alt="Uploaded post preview"
                                                    className="size-full object-cover"
                                                    src={mediaUrl}
                                                />
                                            )
                                        ) : (
                                            <div className="flex flex-col items-center text-slate-400">
                                                <ImagePlus className="size-8" strokeWidth={1.5} />
                                                <span className="mt-2 text-[10px] font-medium">
                                                    Your media preview
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="min-h-36 p-3">
                                        <div className="mb-2 flex items-center justify-between">
                                            <div className="flex gap-3 text-slate-700">
                                                <span className="text-base">♡</span>
                                                <span className="text-sm">◯</span>
                                                <Send className="mt-0.5 size-4" />
                                            </div>
                                            <span className="text-base text-slate-700">⌑</span>
                                        </div>
                                        <div className="text-[10px] font-bold text-slate-800">
                                            1,248 likes
                                        </div>
                                        <p className="mt-1 line-clamp-3 text-[10px] leading-4 text-slate-600">
                                            <span className="font-bold text-slate-800">
                                                shahjee.sync{" "}
                                            </span>
                                            {caption ||
                                                "Your caption will appear here as you type..."}
                                        </p>
                                        <div className="mt-2 text-[9px] font-medium uppercase tracking-wide text-slate-400">
                                            {previewPlatform === "Instagram"
                                                ? "Just now"
                                                : "Published moments ago"}
                                        </div>
                                    </div>
                                    <div className="mx-auto mb-1 h-1 w-24 rounded-full bg-slate-900" />
                                </div>
                            </div>
                        </div>
                    </aside>
                </div>
            </div>
        </main>
    )
}