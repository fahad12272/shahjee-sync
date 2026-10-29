// Threads publishing — Threads API (Meta), 100% free
// Text-only + image dono chalti hain. 2-step: container → publish.
// Docs: developers.facebook.com/docs/threads/create-posts

const THREADS_BASE = process.env.THREADS_GRAPH_BASE || "https://graph.threads.net"
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

function thError(data, status) {
  return new Error(data?.error?.message || `Threads API error ${status}`)
}

async function threadsPost(path, body, accessToken) {
  const res = await fetch(`${THREADS_BASE}/${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...body, access_token: accessToken }),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw thError(data, res.status)
  return data
}

async function threadsGet(path, params, accessToken) {
  const url =
    `${THREADS_BASE}/${path}?` +
    new URLSearchParams({ ...params, access_token: accessToken }).toString()
  const res = await fetch(url)
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw thError(data, res.status)
  return data
}

export async function publishToThreads({ text, imageUrl, creds }) {
  const { userId, accessToken } = creds || {}
  if (!userId || !accessToken) {
    throw new Error("Threads connection adhoora hai — dobara connect karo")
  }

  const t = String(text || "").trim().slice(0, 5000) // Threads text limit
  const img = String(imageUrl || "").trim()

  const body = img
    ? { media_type: "IMAGE", image_url: img, text: t }
    : { media_type: "TEXT", text: t }

  // 1) Container
  const container = await threadsPost(`v1.0/${userId}/threads`, body, accessToken)
  if (!container.id) throw new Error("Threads container nahi bana")

  // 2) Container ready hone do (TEXT instant hota hai, IMAGE thoda le sakta hai)
  for (let i = 0; i < 10; i++) {
    const status = await threadsGet(
      `v1.0/${container.id}`,
      { fields: "status_code" },
      accessToken,
    )
    if (status.status_code === "FINISHED") break
    if (status.status_code === "ERROR" || status.status_code === "EXPIRED") {
      throw new Error(status.status || "Threads media process fail hui")
    }
    await sleep(1500)
  }

  // 3) Publish
  const pub = await threadsPost(
    `v1.0/${userId}/threads_publish`,
    { creation_id: container.id },
    accessToken,
  )
  if (!pub.id) throw new Error("Threads publish fail hui")

  // 4) Permalink (optional)
  let url = ""
  try {
    const p = await threadsGet(`v1.0/${pub.id}`, { fields: "permalink" }, accessToken)
    url = p.permalink || ""
  } catch {
    // ignore
  }
  return { id: pub.id, url }
}
