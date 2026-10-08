import { useEffect, useRef, useState } from "react"
import {
  ArrowRight,
  BarChart3,
  CalendarClock,
  Check,
  ChevronDown,
  Heart,
  Link2,
  LogIn,
  PenLine,
  ShieldCheck,
  Sparkles,
  Star,
  Undo2,
  Zap,
} from "lucide-react"
import {
  FaFacebookF,
  FaInstagram,
  FaLinkedinIn,
  FaTiktok,
  FaXTwitter,
  FaYoutube,
} from "react-icons/fa6"

const platformIcons = [
  {
    name: "Instagram",
    icon: FaInstagram,
    style: "bg-gradient-to-br from-violet-600 via-fuchsia-500 to-amber-400",
  },
  { name: "YouTube", icon: FaYoutube, style: "bg-red-600" },
  { name: "Facebook", icon: FaFacebookF, style: "bg-blue-600" },
  { name: "TikTok", icon: FaTiktok, style: "bg-slate-950" },
  { name: "LinkedIn", icon: FaLinkedinIn, style: "bg-sky-700" },
  { name: "X", icon: FaXTwitter, style: "bg-slate-950" },
]

const features = [
  {
    icon: PenLine,
    title: "Create once, publish everywhere",
    desc: "Write your post, attach media, and send it to every connected platform in one click.",
    style: "bg-indigo-50 text-indigo-600",
  },
  {
    icon: CalendarClock,
    title: "Visual content calendar",
    desc: "See your whole month at a glance. Hover any date and schedule instantly.",
    style: "bg-amber-50 text-amber-600",
  },
  {
    icon: BarChart3,
    title: "Live analytics",
    desc: "Track pending and published posts with real numbers from your own workspace.",
    style: "bg-emerald-50 text-emerald-600",
  },
  {
    icon: Link2,
    title: "Connect your accounts",
    desc: "Manage Instagram, YouTube, Facebook, TikTok, LinkedIn and X from one hub.",
    style: "bg-sky-50 text-sky-600",
  },
  {
    icon: Undo2,
    title: "Undo anything",
    desc: "Deleted a post by mistake? Every delete comes with a one-click Undo.",
    style: "bg-violet-50 text-violet-600",
  },
  {
    icon: ShieldCheck,
    title: "Private by design",
    desc: "Your workspace data stays on your own device — no tracking, no data selling.",
    style: "bg-rose-50 text-rose-600",
  },
]

const steps = [
  {
    number: "1",
    title: "Create your account",
    desc: "Sign up in seconds — just your name, email and a password.",
  },
  {
    number: "2",
    title: "Connect your platforms",
    desc: "Pick the social accounts you want to publish to.",
  },
  {
    number: "3",
    title: "Schedule & grow",
    desc: "Create posts, queue them up, and watch your analytics grow.",
  },
]

const testimonials = [
  {
    name: "Ayesha K.",
    role: "Content Creator",
    initials: "AK",
    color: "from-fuchsia-500 to-violet-600",
    quote:
      "Pehle main 4 apps mein ja ja ke post karti thi. Ab ek jagah se sab ho jata hai — calendar ne mera time bacha liya.",
  },
  {
    name: "Bilal R.",
    role: "Small Business Owner",
    initials: "BR",
    color: "from-sky-500 to-indigo-600",
    quote:
      "The queue and undo feature is genius. Main ghalat post delete karta hoon aur 1 click mein wapas — stress free!",
  },
  {
    name: "Sana M.",
    role: "Social Media Manager",
    initials: "SM",
    color: "from-emerald-500 to-teal-600",
    quote:
      "Analytics dashboard clean aur fast hai. Clients ko screenshots bhejne ke liye perfect. Highly recommended!",
  },
]

const faqs = [
  {
    question: "Is Shahjee Sync really free?",
    answer:
      "Yes! Your workspace, posts, calendar and analytics are completely free. No credit card, no hidden trials that expire.",
  },
  {
    question: "Which platforms can I publish to?",
    answer:
      "Instagram, YouTube Shorts, Facebook, TikTok, LinkedIn and X — all from one dashboard.",
  },
  {
    question: "Is my data safe?",
    answer:
      "Your workspace data stays private to your account. We never sell your information, and you can export everything anytime with one click.",
  },
  {
    question: "Can multiple people use it?",
    answer:
      "Absolutely. Every person gets their own private workspace with their own posts, accounts and settings.",
  },
  {
    question: "Do I need to install anything?",
    answer:
      "No. Shahjee Sync runs entirely in your browser — on desktop, tablet and mobile.",
  },
]

function useReveal() {
  const ref = useRef(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const node = ref.current
    if (!node) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.15 },
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  return { ref, visible }
}

function Reveal({ children, className = "" }) {
  const { ref, visible } = useReveal()
  return (
    <div
      className={`transition-all duration-700 ease-out ${
        visible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
      } ${className}`}
      ref={ref}
    >
      {children}
    </div>
  )
}

function FaqItem({ faq, isOpen, onToggle }) {
  return (
    <div
      className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
      key={faq.question}
    >
      <button
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
        onClick={onToggle}
        type="button"
      >
        <span className="text-sm font-bold text-slate-900 md:text-base">
          {faq.question}
        </span>
        <span
          className={`flex size-7 shrink-0 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition-transform duration-300 ${
            isOpen ? "rotate-180 bg-indigo-50 text-indigo-600" : ""
          }`}
        >
          <ChevronDown className="size-4" />
        </span>
      </button>
      <div
        className={`grid transition-all duration-300 ease-out ${
          isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="overflow-hidden">
          <p className="px-5 pb-5 text-sm leading-6 text-slate-500">
            {faq.answer}
          </p>
        </div>
      </div>
    </div>
  )
}

export function LandingPage({ onGetStarted, onLogin }) {
  const [openFaq, setOpenFaq] = useState(0)

  return (
    <div className="min-h-screen bg-white text-slate-900">
      {/* Navbar */}
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/85 backdrop-blur-lg">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-lg shadow-indigo-200">
              <Zap className="size-4.5 fill-current" />
            </div>
            <div>
              <div className="text-sm font-bold tracking-tight">
                Shahjee Sync
              </div>
              <div className="text-[10px] font-medium text-slate-400">
                Social workspace
              </div>
            </div>
          </div>
          <nav className="hidden items-center gap-6 text-sm font-medium text-slate-600 md:flex">
            <a className="transition hover:text-indigo-600" href="#features">
              Features
            </a>
            <a className="transition hover:text-indigo-600" href="#how">
              How it works
            </a>
            <a className="transition hover:text-indigo-600" href="#faq">
              FAQ
            </a>
          </nav>
          <div className="flex items-center gap-2.5">
            <button
              className="flex h-9 items-center gap-1.5 rounded-xl border border-slate-200 px-4 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
              onClick={onLogin}
              type="button"
            >
              <LogIn className="size-3.5" />
              Log in
            </button>
            <button
              className="flex h-9 items-center gap-1.5 rounded-xl bg-indigo-600 px-4 text-xs font-semibold text-white shadow-lg shadow-indigo-200 transition hover:bg-indigo-700"
              onClick={onGetStarted}
              type="button"
            >
              Get Started
              <ArrowRight className="size-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-indigo-50 via-white to-white">
        <div
          aria-hidden="true"
          className="animate-blob pointer-events-none absolute -left-24 top-10 size-72 rounded-full bg-fuchsia-200/40 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="animate-blob-slow pointer-events-none absolute -right-24 top-40 size-80 rounded-full bg-indigo-300/30 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute bottom-0 left-1/3 size-64 rounded-full bg-violet-200/30 blur-3xl"
        />

        <div className="relative mx-auto max-w-6xl px-4 pb-16 pt-20 text-center md:px-6 md:pb-24 md:pt-28">
          <div className="mx-auto mb-6 flex w-fit items-center gap-2 rounded-full border border-indigo-100 bg-white px-4 py-1.5 text-xs font-semibold text-indigo-700 shadow-sm">
            <Sparkles className="size-3.5" />
            For creators, brands & teams — free forever
          </div>

          <h1 className="mx-auto max-w-4xl text-4xl font-bold leading-tight tracking-tight md:text-6xl md:leading-[1.1]">
            One workspace.{" "}
            <span className="bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-500 bg-clip-text text-transparent">
              Every platform.
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-slate-600 md:text-lg md:leading-8">
            Stop juggling five apps. Shahjee Sync lets you create, schedule and
            track posts across Instagram, YouTube, TikTok and more — all from
            one clean dashboard.
          </p>

          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <button
              className="flex h-12 items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-8 text-sm font-semibold text-white shadow-xl shadow-indigo-300/60 transition hover:-translate-y-0.5 hover:shadow-2xl"
              onClick={onGetStarted}
              type="button"
            >
              Start free — no credit card
              <ArrowRight className="size-4" />
            </button>
            <a
              className="flex h-12 items-center rounded-xl border border-slate-200 bg-white px-8 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              href="#features"
            >
              Explore features
            </a>
          </div>

          {/* Social proof */}
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
            <div className="flex -space-x-2.5">
              {["AK", "BR", "SM", "FD", "ZK"].map((initials, index) => (
                <div
                  className={`flex size-8 items-center justify-center rounded-full border-2 border-white text-[9px] font-bold text-white ${
                    [
                      "bg-fuchsia-500",
                      "bg-sky-500",
                      "bg-emerald-500",
                      "bg-violet-500",
                      "bg-amber-500",
                    ][index]
                  }`}
                  key={initials}
                >
                  {initials}
                </div>
              ))}
            </div>
            <div className="text-xs text-slate-500">
              <span className="flex items-center justify-center gap-0.5 sm:justify-start">
                {[0, 1, 2, 3, 4].map((star) => (
                  <Star
                    className="size-3.5 fill-amber-400 text-amber-400"
                    key={star}
                  />
                ))}
              </span>
              Trusted by creators worldwide
            </div>
          </div>

          {/* App mockup */}
          <Reveal className="mt-14">
            <div className="relative mx-auto max-w-4xl">
              <div
                aria-hidden="true"
                className="absolute -inset-6 rounded-[2rem] bg-gradient-to-r from-indigo-200/60 via-fuchsia-200/40 to-violet-200/60 blur-2xl"
              />
              <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-indigo-300/30">
                <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50 px-4 py-3">
                  <span className="size-2.5 rounded-full bg-rose-400" />
                  <span className="size-2.5 rounded-full bg-amber-400" />
                  <span className="size-2.5 rounded-full bg-emerald-400" />
                  <span className="ml-3 flex h-6 flex-1 items-center rounded-md bg-white px-3 text-[10px] text-slate-400 ring-1 ring-slate-200">
                    shahjee-sync.app
                  </span>
                </div>
                <div className="flex">
                  <div className="hidden w-40 shrink-0 border-r border-slate-100 bg-white p-3 sm:block">
                    <div className="mb-3 flex items-center gap-2">
                      <div className="size-6 rounded-lg bg-indigo-600" />
                      <div className="h-2 w-16 rounded bg-slate-200" />
                    </div>
                    {[
                      "w-20",
                      "w-24",
                      "w-16 bg-indigo-100",
                      "w-20",
                      "w-14",
                    ].map((width, index) => (
                      <div
                        className={`mb-2 h-2 rounded bg-slate-100 ${width}`}
                        key={index}
                      />
                    ))}
                  </div>
                  <div className="flex-1 bg-slate-50/70 p-4 text-left">
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { label: "Total posts", value: "24", bar: "w-3/4" },
                        { label: "Pending", value: "7", bar: "w-1/2" },
                        { label: "Published", value: "17", bar: "w-2/3" },
                      ].map((card) => (
                        <div
                          className="rounded-xl border border-slate-200 bg-white p-3"
                          key={card.label}
                        >
                          <div className="text-[9px] font-semibold text-slate-400">
                            {card.label}
                          </div>
                          <div className="mt-1 text-lg font-bold text-slate-900">
                            {card.value}
                          </div>
                          <div
                            className={`mt-2 h-1.5 rounded-full bg-indigo-100 ${card.bar}`}
                          >
                            <div className="h-full w-2/3 rounded-full bg-gradient-to-r from-indigo-500 to-violet-500" />
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 rounded-xl border border-slate-200 bg-white p-3">
                      <div className="mb-2 flex items-center justify-between">
                        <div className="h-2 w-24 rounded bg-slate-200" />
                        <div className="h-2 w-10 rounded bg-emerald-200" />
                      </div>
                      <div className="flex h-20 items-end gap-1.5">
                        {[
                          35, 55, 40, 70, 50, 85, 65, 95, 75, 60, 88, 70,
                        ].map((height, index) => (
                          <div
                            className="flex-1 rounded-t bg-gradient-to-t from-indigo-500 to-violet-400"
                            key={index}
                            style={{ height: `${height}%` }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Platforms strip */}
      <section className="border-y border-slate-100 bg-white py-10">
        <div className="mx-auto max-w-6xl px-4 md:px-6">
          <p className="text-center text-xs font-bold uppercase tracking-widest text-slate-400">
            Publish everywhere your audience lives
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-4 md:gap-6">
            {platformIcons.map((platform) => {
              const Icon = platform.icon
              return (
                <div
                  className="flex items-center gap-2.5 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                  key={platform.name}
                >
                  <span
                    className={`flex size-8 items-center justify-center rounded-xl text-white ${platform.style}`}
                  >
                    <Icon className="size-3.5" />
                  </span>
                  <span className="text-sm font-semibold text-slate-700">
                    {platform.name}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="bg-slate-50 py-20 md:py-24" id="features">
        <div className="mx-auto max-w-6xl px-4 md:px-6">
          <Reveal>
            <div className="text-center">
              <div className="text-xs font-semibold uppercase tracking-widest text-indigo-600">
                Everything included
              </div>
              <h2 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">
                Built to save you hours
              </h2>
              <p className="mx-auto mt-3 max-w-xl text-sm text-slate-500 md:text-base">
                Every tool you need to run your social media — without juggling
                five different apps.
              </p>
            </div>
          </Reveal>

          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, index) => {
              const Icon = feature.icon
              return (
                <Reveal
                  className={index > 2 ? "hidden sm:block" : ""}
                  key={feature.title}
                >
                  <article className="h-full rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-indigo-200 hover:shadow-lg">
                    <div
                      className={`flex size-11 items-center justify-center rounded-xl ${feature.style}`}
                    >
                      <Icon className="size-5" />
                    </div>
                    <h3 className="mt-4 text-base font-bold">
                      {feature.title}
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-slate-500">
                      {feature.desc}
                    </p>
                  </article>
                </Reveal>
              )
            })}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 md:py-24" id="how">
        <div className="mx-auto max-w-5xl px-4 md:px-6">
          <Reveal>
            <div className="text-center">
              <div className="text-xs font-semibold uppercase tracking-widest text-indigo-600">
                How it works
              </div>
              <h2 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">
                Live in three steps
              </h2>
            </div>
          </Reveal>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {steps.map((step, index) => (
              <Reveal key={step.number}>
                <div className="relative rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm transition hover:-translate-y-1 hover:shadow-md">
                  {index < 2 && (
                    <ArrowRight
                      aria-hidden="true"
                      className="absolute -right-4 top-1/2 hidden size-6 -translate-y-1/2 text-slate-300 md:block"
                    />
                  )}
                  <div className="mx-auto flex size-11 items-center justify-center rounded-full bg-indigo-600 text-base font-bold text-white shadow-lg shadow-indigo-200">
                    {step.number}
                  </div>
                  <h3 className="mt-4 text-base font-bold">{step.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    {step.desc}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-slate-50 py-20 md:py-24">
        <div className="mx-auto max-w-6xl px-4 md:px-6">
          <Reveal>
            <div className="text-center">
              <div className="text-xs font-semibold uppercase tracking-widest text-indigo-600">
                Loved by creators
              </div>
              <h2 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">
                Don't take our word for it
              </h2>
            </div>
          </Reveal>

          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {testimonials.map((person) => (
              <Reveal key={person.name}>
                <figure className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
                  <div className="flex gap-0.5">
                    {[0, 1, 2, 3, 4].map((star) => (
                      <Star
                        className="size-4 fill-amber-400 text-amber-400"
                        key={star}
                      />
                    ))}
                  </div>
                  <blockquote className="mt-4 flex-1 text-sm leading-6 text-slate-600">
                    "{person.quote}"
                  </blockquote>
                  <figcaption className="mt-5 flex items-center gap-3 border-t border-slate-100 pt-4">
                    <div
                      className={`flex size-10 items-center justify-center rounded-full bg-gradient-to-br text-xs font-bold text-white ${person.color}`}
                    >
                      {person.initials}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-slate-900">
                        {person.name}
                      </div>
                      <div className="text-xs text-slate-400">
                        {person.role}
                      </div>
                    </div>
                  </figcaption>
                </figure>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 md:py-24" id="faq">
        <div className="mx-auto max-w-3xl px-4 md:px-6">
          <Reveal>
            <div className="text-center">
              <div className="text-xs font-semibold uppercase tracking-widest text-indigo-600">
                Questions
              </div>
              <h2 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">
                Everything you need to know
              </h2>
            </div>
          </Reveal>

          <div className="mt-10 space-y-3">
            {faqs.map((faq, index) => (
              <FaqItem
                faq={faq}
                isOpen={openFaq === index}
                key={faq.question}
                onToggle={() =>
                  setOpenFaq((current) => (current === index ? null : index))
                }
              />
            ))}
          </div>
        </div>
      </section>

      {/* CTA band */}
      <section className="relative overflow-hidden bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-600 py-20">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -left-16 top-0 size-64 rounded-full bg-white/10 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-16 bottom-0 size-72 rounded-full bg-fuchsia-400/20 blur-3xl"
        />
        <Reveal className="relative mx-auto max-w-4xl px-4 text-center md:px-6">
          <h2 className="text-3xl font-bold tracking-tight text-white md:text-4xl">
            Ready to sync your social?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-indigo-100 md:text-base">
            Join the workspace that keeps your content flowing — create your
            free account in under a minute.
          </p>
          <button
            className="mx-auto mt-9 flex h-12 items-center gap-2 rounded-xl bg-white px-8 text-sm font-bold text-indigo-700 shadow-xl transition hover:-translate-y-0.5 hover:shadow-2xl"
            onClick={onGetStarted}
            type="button"
          >
            Create your free account
            <ArrowRight className="size-4" />
          </button>
          <div className="mt-5 flex items-center justify-center gap-1.5 text-xs text-indigo-100">
            <Check className="size-3.5" />
            Free forever
            <span className="text-indigo-300">·</span>
            <Check className="size-3.5" />
            No credit card
            <span className="text-indigo-300">·</span>
            <Check className="size-3.5" />
            Setup in 60 seconds
          </div>
        </Reveal>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-slate-50 py-14">
        <div className="mx-auto max-w-6xl px-4 md:px-6">
          <div className="grid gap-10 md:grid-cols-[2fr_1fr_1fr]">
            <div>
              <div className="flex items-center gap-2.5">
                <div className="flex size-10 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-lg shadow-indigo-200">
                  <Zap className="size-5 fill-current" />
                </div>
                <div>
                  <div className="text-sm font-bold tracking-tight">
                    Shahjee Sync
                  </div>
                  <div className="text-xs text-slate-400">
                    Social workspace
                  </div>
                </div>
              </div>
              <p className="mt-4 max-w-sm text-sm leading-6 text-slate-500">
                The social workspace for creators who publish everywhere.
                Create once, schedule smart, grow fast.
              </p>
              <div className="mt-5 flex gap-2.5">
                {platformIcons.map((platform) => {
                  const Icon = platform.icon
                  return (
                    <span
                      className={`flex size-9 items-center justify-center rounded-xl text-white opacity-90 transition hover:opacity-100 ${platform.style}`}
                      key={platform.name}
                    >
                      <Icon className="size-3.5" />
                    </span>
                  )
                })}
              </div>
            </div>

            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Product
              </div>
              <a
                className="mt-4 flex items-center gap-1.5 text-sm text-slate-600 transition hover:text-indigo-600"
                href="#features"
              >
                Features
              </a>
              <a
                className="mt-2.5 flex items-center gap-1.5 text-sm text-slate-600 transition hover:text-indigo-600"
                href="#how"
              >
                How it works
              </a>
              <a
                className="mt-2.5 flex items-center gap-1.5 text-sm text-slate-600 transition hover:text-indigo-600"
                href="#faq"
              >
                FAQ
              </a>
            </div>

            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Get started
              </div>
              <button
                className="mt-4 block text-sm text-slate-600 transition hover:text-indigo-600"
                onClick={onGetStarted}
                type="button"
              >
                Sign up free
              </button>
              <button
                className="mt-2.5 block text-sm text-slate-600 transition hover:text-indigo-600"
                onClick={onLogin}
                type="button"
              >
                Log in
              </button>
            </div>
          </div>

          <div className="mt-12 flex flex-col items-center gap-3 border-t border-slate-200 pt-7">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-xs font-bold text-white shadow-md">
                SF
              </div>
              <div className="text-sm text-slate-600">
                Designed & built with{" "}
                <Heart className="inline size-3.5 fill-rose-500 text-rose-500" />{" "}
                by{" "}
                <span className="font-bold text-slate-900">Shah Fahad</span>
              </div>
            </div>
            <p className="text-xs text-slate-400">
              © {new Date().getFullYear()} Shah Fahad · Shahjee Sync. All
              rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}