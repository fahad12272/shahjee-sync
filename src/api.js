const API_URL = import.meta.env.VITE_API_URL || "/api"

// ---------- Token management ----------
export function getToken() {
  return window.localStorage.getItem("shahjee-sync-token")
}

export function setToken(token) {
  window.localStorage.setItem("shahjee-sync-token", token)
}

export function removeToken() {
  window.localStorage.removeItem("shahjee-sync-token")
}

// MongoDB _id ko frontend ke id mein convert karo
const transformPost = (post) => ({ ...post, id: post._id })

// ---------- Core request helper ----------
async function apiRequest(endpoint, options = {}) {
  const token = getToken()
  const headers = { "Content-Type": "application/json" }
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  const res = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  })

  let data = null
  try {
    data = await res.json()
  } catch {
    data = null
  }

  if (!res.ok) {
    throw new Error(data?.error || "Server error — try again")
  }
  return data
}

// ---------- Auth ----------
export async function apiSignup(name, email, password) {
  const data = await apiRequest("/auth/signup", {
    method: "POST",
    body: JSON.stringify({ name, email, password }),
  })
  setToken(data.token)
  return data.user
}

export async function apiLogin(email, password) {
  const data = await apiRequest("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  })
  setToken(data.token)
  return data.user
}

export async function apiMe() {
  const data = await apiRequest("/auth/me")
  return data.user
}

// ---------- Password reset ----------
export async function apiForgotPassword(email) {
  const data = await apiRequest("/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify({ email }),
  })
  return data
}

export async function apiResetPassword(token, password) {
  const data = await apiRequest("/auth/reset-password", {
    method: "POST",
    body: JSON.stringify({ token, password }),
  })
  return data
}

// ---------- Posts ----------
export async function apiGetPosts() {
  const data = await apiRequest("/posts")
  return data.posts.map(transformPost)
}

export async function apiCreatePost(postData) {
  const data = await apiRequest("/posts", {
    method: "POST",
    body: JSON.stringify(postData),
  })
  return transformPost(data.post)
}

export async function apiUpdatePost(id, updates) {
  const data = await apiRequest(`/posts/${id}`, {
    method: "PUT",
    body: JSON.stringify(updates),
  })
  return transformPost(data.post)
}

export async function apiDeletePost(id) {
  await apiRequest(`/posts/${id}`, { method: "DELETE" })
}

// ---------- Media upload (Cloudinary) ----------
// NOTE: Yahan apiRequest use nahi kiya kyunki FormData ke saath
// Content-Type header khud set NAHI karna hota (browser khud boundary lagata hai)
export async function apiUploadMedia(file) {
  const token = getToken()
  const formData = new FormData()
  formData.append("image", file)

  const res = await fetch(`${API_URL}/upload`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  })

  let data = null
  try {
    data = await res.json()
  } catch {
    data = null
  }

  if (!res.ok) {
    throw new Error(data?.error || "Upload fail ho gayi — try again")
  }
  return data
}

// ---------- Settings (profile / password / account) ----------
export async function apiUpdateProfile(name) {
  const data = await apiRequest("/auth/profile", {
    method: "PUT",
    body: JSON.stringify({ name }),
  })
  return data.user
}

export async function apiChangePassword(currentPassword, newPassword) {
  const data = await apiRequest("/auth/password", {
    method: "PUT",
    body: JSON.stringify({ currentPassword, newPassword }),
  })
  return data
}

export async function apiDeleteAccount() {
  const data = await apiRequest("/auth/account", { method: "DELETE" })
  return data
}

// ---------- Platform connections (X / Telegram) ----------
export async function apiGetPlatforms() {
  const data = await apiRequest("/platforms")
  return data.platforms
}

export async function apiConnectX({
  apiKey,
  apiSecret,
  accessToken,
  accessSecret,
}) {
  const data = await apiRequest("/platforms/x", {
    method: "PUT",
    body: JSON.stringify({ apiKey, apiSecret, accessToken, accessSecret }),
  })
  return data
}

export async function apiConnectTelegram({ botToken, chatId }) {
  const data = await apiRequest("/platforms/telegram", {
    method: "PUT",
    body: JSON.stringify({ botToken, chatId }),
  })
  return data
}

export async function apiDisconnectPlatform(platform) {
  const data = await apiRequest(`/platforms/${platform}`, {
    method: "DELETE",
  })
  return data
}
