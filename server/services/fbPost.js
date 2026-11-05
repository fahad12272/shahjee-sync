// Facebook Page publishing — Graph API, 100% free
// Page token + page id se direct posting hoti hai (text ya image + caption).
// Docs: developers.facebook.com/docs/pages-api/posts

const GRAPH_BASE = process.env.META_GRAPH_BASE || "https://graph.facebook.com"
const V = "v21.0"

function fbError(data, status) {
  return new Error(data?.error?.message || `Facebook API error ${status}`)
}

async function graphPost(path, body, pageToken) {
  const res = await fetch(`${GRAPH_BASE}/${V}/${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...body, access_token: pageToken }),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw fbError(data, res.status)
  return data
}

async function graphGet(path, params, pageToken) {
  const url =
    `${GRAPH_BASE}/${V}/${path}?` +
    new URLSearchParams({ ...params, access_token: pageToken }).toString()
  const res = await fetch(url)
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw fbError(data, res.status)
  return data
}

// Page pe publish — image ho to /photos (caption ke saath), warna /feed (message)
export async function publishToFacebook({ text, imageUrl, creds }) {
  const { pageId, pageToken } = creds || {}
  if (!pageId || !pageToken) {
    throw new Error("Facebook connection adhoora hai — dobara connect karo")
  }
  const message = String(text || "").trim()

  let postId
  if (imageUrl) {
    const r = await graphPost(
      `${pageId}/photos`,
      { url: imageUrl, caption: message.slice(0, 5000) },
      pageToken,
    )
    postId = r.post_id || r.id
  } else {
    const r = await graphPost(
      `${pageId}/feed`,
      { message: message.slice(0, 5000) },
      pageToken,
    )
    postId = r.id
  }
  if (!postId) throw new Error("Facebook ne post id nahi di")

  // Permalink — shareable URL (optional step, fail ho to URL khaali)
  // IMPORTANT: FB Graph permalink_url KABHI poora URL deta hai (https://www.facebook.com/...)
  // aur kabhi sirf path (/photo?fbid=...). Pehle hum hamesha domain prefix jorr rahe the
  // jis se full-URL case mein "www.facebook.comhttps://..." jaisa toota hua URL banta tha
  // (browser DNS error). Ab dono shapes handle hoti hain.
  let url = ""
  try {
    const p = await graphGet(postId, { fields: "permalink_url" }, pageToken)
    const raw = String(p.permalink_url || "").trim()
    if (raw.startsWith("http")) {
      url = raw // poora URL — as-is use karo
    } else if (raw) {
      // path — leading slash ensure karo
      url = `https://www.facebook.com/${raw.replace(/^\/+/, "")}`
    }
  } catch {
    // ignore
  }
  return { id: postId, url }
}
