export type User = {
  name: string
  email: string
  password: string
  joinedAt: string
}

const USERS_KEY = "shahjee-sync-users"
const SESSION_KEY = "shahjee-sync-session"
const LEGACY_POSTS_KEY = "shahjee-sync-posts"
const LEGACY_ACCOUNTS_KEY = "shahjee-sync-accounts"

const postsKeyFor = (email: string) => `shahjee-sync-posts:${email}`
const accountsKeyFor = (email: string) => `shahjee-sync-accounts:${email}`

export type AuthResult =
  | { ok: true; user: User }
  | { ok: false; error: string }

function loadUsers(): User[] {
  try {
    const raw = window.localStorage.getItem(USERS_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as User[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

const isValidEmail = (email: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

export function signup(
  name: string,
  email: string,
  password: string,
): AuthResult {
  const cleanName = name.trim()
  const cleanEmail = email.trim().toLowerCase()

  if (cleanName.length < 2) {
    return { ok: false, error: "Please enter your full name." }
  }
  if (!isValidEmail(cleanEmail)) {
    return { ok: false, error: "Please enter a valid email address." }
  }
  if (password.length < 6) {
    return { ok: false, error: "Password must be at least 6 characters." }
  }

   const users = loadUsers()
  const isFirstUser = users.length === 0          // 👈 NAYI LINE
  if (users.some((user) => user.email === cleanEmail)) {
    return {
      ok: false,
      error: "This email is already registered — try logging in.",
    }
  }

  const user: User = {
    name: cleanName,
    email: cleanEmail,
    password,
    joinedAt: new Date().toISOString(),
  }
  users.push(user)
  window.localStorage.setItem(USERS_KEY, JSON.stringify(users))
  if (isFirstUser) {                               // 👈 NAYA CONDITION
    migrateLegacyData(cleanEmail)
  }
  return { ok: true, user }
}

export function login(email: string, password: string): AuthResult {
  const cleanEmail = email.trim().toLowerCase()

  if (!isValidEmail(cleanEmail)) {
    return { ok: false, error: "Please enter a valid email address." }
  }

  const user = loadUsers().find((entry) => entry.email === cleanEmail)
  if (!user) {
    return {
      ok: false,
      error: "No account found with this email. Sign up first.",
    }
  }
  if (user.password !== password) {
    return { ok: false, error: "Incorrect password. Try again." }
  }
  return { ok: true, user }
}

export function getSession(): User | null {
  try {
    const raw = window.localStorage.getItem(SESSION_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as User
    return parsed && parsed.email ? parsed : null
  } catch {
    return null
  }
}

export function setSession(user: User) {
  window.localStorage.setItem(SESSION_KEY, JSON.stringify(user))
}

export function logout() {
  try {
    window.localStorage.removeItem(SESSION_KEY)
  } catch {
    // ignore
  }
}

function migrateLegacyData(email: string) {
  try {
    const legacyPosts = window.localStorage.getItem(LEGACY_POSTS_KEY)
    if (legacyPosts && !window.localStorage.getItem(postsKeyFor(email))) {
      window.localStorage.setItem(postsKeyFor(email), legacyPosts)
    }
    window.localStorage.removeItem(LEGACY_POSTS_KEY)

    const legacyAccounts = window.localStorage.getItem(LEGACY_ACCOUNTS_KEY)
    if (
      legacyAccounts &&
      !window.localStorage.getItem(accountsKeyFor(email))
    ) {
      window.localStorage.setItem(accountsKeyFor(email), legacyAccounts)
    }
    window.localStorage.removeItem(LEGACY_ACCOUNTS_KEY)
  } catch {
    // ignore
  }
}