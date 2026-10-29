// Instagram publishing — Instagram Graph API (Business/Creator accounts only)
// IMPORTANT: IG API pe text-only post ALLOWED NAHI hai — image/video zaroori.
// 2-step flow: container banao → publish karo.
// Docs: developers.facebook.com/docs/instagram-api/guides/content-publishing

const GRAPH_BASE = process.env.META_GRAPH_BASE || "https://graph.facebook.com"
const V = "v21.0"
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

function igError(data, status) {
  return new Error(data?.error?.message || `Instagram API error ${status}`)
}

async function igPost(path, body, pageToken) {
  const res = await fetch(`${GRAPH_BASE}/${V}/${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...body, access_token: pageToken }),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw igError(data, res.status)
  return data
}

async function igGet(path, params, pageToken) {
  const url =
    `${GRAPH_BASE}/${V}/${path}?` +
    new URLSearchParams({ ...params, access_token: pageToken }).toString()
  const res = await fetch(url)
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw igError(data, res.status)
  return data
}

export async function publishToInstagram({ text, imageUrl, creds }) {
  const { igUserId, pageToken } = creds || {}
  if (!igUserId || !pageToken) {
    throw new Error("Instagram connection adhoora hai — dobara connect karo")
  }

  const img = String(imageUrl || "").trim()
  if (!img) {
    throw new Error(
      "Instagram pe text-only post nahi chalti (IG ka rule hai) — post mein image add karo",
    )
  }
  const caption = String(text || "").trim().slice(0, 2200) // IG caption limit

  // 1) Media container banao
  const container = await igPost(
    `${igUserId}/media`,
    { image_url: img, caption },
    pageToken,
  )
  const creationId = container.id
  if (!creationId) throw new Error("Instagram media container nahi bana")

  // 2) Container ready hone do (image aam tor pe instant, video thoda le sakta hai)
  for (let i = 0; i < 10; i++) {
    const status = await igGet(creationId, { fields: "status_code" }, pageToken)
    if (status.status_code === "FINISHED") break
    if (status.status_code === "ERROR" || status.status_code === "EXPIRED") {
      throw new Error(status.status || "Instagram media process fail hui")
    }
    await sleep(1500)
  }

  // 3) Publish
  const pub = await igPost(
    `${igUserId}/media_publish`,
    { creation_id: creationId },
    pageToken,
  )
  if (!pub.id) throw new Error("Instagram publish fail hui")

  // 4) Permalink (optional)
  let url = ""
  try {
    const p = await igGet(pub.id, { fields: "permalink" }, pageToken)
    url = p.permalink || ""
  } catch {
    // ignore
  }
  return { id: pub.id, url }
}
