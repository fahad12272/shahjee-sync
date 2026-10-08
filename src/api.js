const API_URL = "http://localhost:5000/api"

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