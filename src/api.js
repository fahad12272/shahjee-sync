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

// ---------- Session expire (401) handler ----------
// Token expire (7 din) ya invalid hone par backend 401 deta hai. Ye endpoints
// 401 NORMALLY bhi dete hain (galat password waghera) — inhe auto-logout se
// bachao. Baaki jagah 401 = session khatam: token hatao + App.jsx ko event
// bhejo taake user seedha login page pohanch jaye (workspace ke broken pages
// pe error toasts dekhta na rehta).
const PUBLIC_AUTH_ENDPOINTS = [
  "/auth/login",
  "/auth/signup",
  "/auth/forgot-password",
  "/auth/reset-password",
  "/auth/password", // galat current password bhi 401 deta hai
]

function handleExpiredSession(endpoint) {
  if (PUBLIC_AUTH_ENDPOINTS.some((ep) => endpoint.startsWith(ep))) return
  if (!getToken()) return
  removeToken()
  window.dispatchEvent(new Event("shahjee-sync:session-expired"))
}

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
    if (res.status === 401) handleExpiredSession(endpoint)
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
    if (res.status === 401) handleExpiredSession("/upload")
    throw new Error(data?.error || "Upload fail ho gayi — try again")
  }
  return data
}

// ---------- VIDEO upload (TikTok ke liye) ----------
// Step 1: backend se signed upload params lo (api_secret server pe hi rehta hai)
export async function apiGetVideoUploadParams() {
  const data = await apiRequest("/upload/video-sign", { method: "POST" })
  return data
}

// Step 2: browser video file SEEDHA Cloudinary pe bhejta hai — hamare
// Vercel server se nahi guzarti (4.5MB body limit bypass, 60MB tak chalti hai).
// Return: permanent Cloudinary video URL (TikTok publish isi se hota hai)
export async function apiUploadVideoDirect(file, params, onProgress) {
  const formData = new FormData()
  formData.append("file", file)
  formData.append("api_key", params.apiKey)
  formData.append("timestamp", String(params.timestamp))
  formData.append("signature", params.signature)
  formData.append("folder", params.folder)

  // XMLHttpRequest — fetch ke paas upload progress ka event nahi hota
  const progress = await new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open("POST", params.uploadUrl)
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        onProgress(Math.round((event.loaded / event.total) * 100))
      }
    }
    xhr.onload = () => {
      let data = null
      try {
        data = JSON.parse(xhr.responseText)
      } catch {
        data = null
      }
      if (xhr.status >= 200 && xhr.status < 300 && data?.secure_url) {
        resolve(data)
      } else {
        reject(
          new Error(
            data?.error?.message ||
              `Video upload fail ho gayi (HTTP ${xhr.status})`,
          ),
        )
      }
    }
    xhr.onerror = () => reject(new Error("Video upload fail ho gayi — network error"))
    xhr.send(formData)
  })

  return { url: progress.secure_url, publicId: progress.public_id }
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

// X 1-click OAuth — authorize URL backend se lo, phir browser wahan bhejo
export async function apiStartXOAuth() {
  const data = await apiRequest("/platforms/x/oauth/start", { method: "POST" })
  return data
}

// Meta family 1-click OAuth — platform: "facebook" | "instagram" | "threads"
export async function apiStartPlatformOAuth(platform) {
  const data = await apiRequest(`/platforms/${platform}/oauth/start`, {
    method: "POST",
  })
  return data
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
