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

  // 2) Container ready hone do — sirf IMAGE/VIDEO ke liye.
  // FIX: TEXT container pe status_code field EXIST hi nahi karta — poll karne
  // par "tried accessing nonexisting field (status_code)" error aata tha aur
  // text posts kabhi publish nahi hoti thi. TEXT turant ready hota hai, isliye
  // polling skip. IMAGE/VIDEO ke liye Meta ~30s average process time batata hai
  // — pehle sirf 15s max tha, ab 60s tak wait + polling error par crash nahi.
  if (body.media_type !== "TEXT") {
    await sleep(2000)
    for (let i = 0; i < 20; i++) {
      let statusCode = ""
      try {
        const status = await threadsGet(
          `v1.0/${container.id}`,
          { fields: "status_code" },
          accessToken,
        )
        statusCode = status.status_code || ""
      } catch {
        // Status abhi query nahi ho saka (container process ho raha hai) —
        // crash mat karo, agle round mein dobara check hoga
      }
      if (statusCode === "FINISHED") break
      if (statusCode === "ERROR" || statusCode === "EXPIRED") {
        throw new Error(
          "Threads media process fail hui — image/video dobara check karo",
        )
      }
      await sleep(3000)
    }
  }

  // 3) Publish
  const pub = await threadsPost(
    `v1.0/${userId}/threads_publish`,
    { creation_id: container.id },
    accessToken,
  )
  if (!pub.id) throw new Error("Threads publish fail hui")

  // 4) Permalink (optional) — publish ke foran baad Threads post ko query
  // karne par kabhi kabhi abhi data nahi milta (post process ho rahi hoti hai),
  // isliye 3 koshish (3s gap) — mila to URL, warna post phir bhi published hai
  let url = ""
  for (let i = 0; i < 3 && !url; i++) {
    try {
      const p = await threadsGet(`v1.0/${pub.id}`, { fields: "permalink" }, accessToken)
      url = p.permalink || ""
    } catch {
      // ignore — permalink nice-to-have hai, isse publish fail nahi karna
    }
    if (!url && i < 2) await sleep(3000)
  }
  return { id: pub.id, url }
}
