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
