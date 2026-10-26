// LinkedIn publishing — Posts API (rest/posts), 100% free
// Text post + image post dono chalti hain. Image ke liye 2-step:
// initializeUpload → PUT binary → post mein media id reference.
// Docs: learn.microsoft.com/linkedin/marketing/community-management/shares/posts-api
//       learn.microsoft.com/linkedin/marketing/community-management/shares/images-api

const API_BASE = "https://api.linkedin.com"
const LINKEDIN_VERSION = "202506" // koi bhi recent monthly version chalega
const MAX_TEXT = 3000 // LinkedIn post limit

function apiHeaders(accessToken) {
  return {
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json",
    "X-Restli-Protocol-Version": "2.0.0",
    "LinkedIn-Version": LINKEDIN_VERSION,
  }
}

async function readError(res) {
  const data = await res.json().catch(() => ({}))
  const msg = data.message || data.error_description || data.error
  if (res.status === 401) {
    return new Error("LinkedIn token expire ho gaya — Connected Accounts pe dobara connect karo")
  }
  if (res.status === 403) {
    return new Error(
      msg || "LinkedIn ne permission nahi di — app mein 'Share on LinkedIn' product add hona chahiye",
    )
  }
  return new Error(msg || `LinkedIn API error ${res.status}`)
}

// Cloudinary (ya koi bhi public URL) se image uthao, LinkedIn pe upload karo → image URN
async function uploadLinkedInImage({ imageUrl, memberUrn, accessToken }) {
  // 1) Upload URL + image URN lo
  const initRes = await fetch(`${API_BASE}/rest/images?action=initializeUpload`, {
    method: "POST",
    headers: apiHeaders(accessToken),
    body: JSON.stringify({ initializeUploadRequest: { owner: memberUrn } }),
  })
  const initData = await initRes.json().catch(() => ({}))
  if (!initRes.ok) throw await readError(initRes)
  const value = initData?.value
  if (!value?.uploadUrl || !value?.imageUrn) {
    throw new Error("LinkedIn image upload URL nahi mila")
  }

  // 2) Image bytes download karo
  const imgRes = await fetch(imageUrl)
  if (!imgRes.ok) throw new Error("Post ki image download nahi ho payi")
  const imgBuffer = Buffer.from(await imgRes.arrayBuffer())
  const contentType = imgRes.headers.get("content-type") || "application/octet-stream"

  // 3) Pre-signed upload URL pe PUT karo (auth headers yahan NAHI lagte)
  const putRes = await fetch(value.uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": contentType },
    body: imgBuffer,
  })
  if (!putRes.ok) {
    throw new Error(`LinkedIn image upload fail hui (${putRes.status})`)
  }

  return value.imageUrn // e.g. urn:li:image:C4D03...
}

// Main publish — text (+ optional image). Post URN + feed URL return karta hai.
export async function publishToLinkedIn({ text, imageUrl, creds }) {
  const { memberUrn, accessToken } = creds || {}
  if (!memberUrn || !accessToken) {
    throw new Error("LinkedIn connection adhoora hai — dobara connect karo")
  }

  const t = String(text || "").trim().slice(0, MAX_TEXT)
  if (!t) throw new Error("Post ka text khali hai")
  const img = String(imageUrl || "").trim()

  const body = {
    author: memberUrn,
    commentary: t,
    visibility: "PUBLIC",
    distribution: {
      feedDistribution: "MAIN_FEED",
      targetEntities: [],
      thirdPartyDistributionChannels: [],
    },
    lifecycleState: "PUBLISHED",
    isReshareDisabledByAuthor: false,
  }

  if (img) {
    const imageUrn = await uploadLinkedInImage({ imageUrl: img, memberUrn, accessToken })
    body.content = { media: { id: imageUrn } }
  }

  const res = await fetch(`${API_BASE}/rest/posts`, {
    method: "POST",
    headers: apiHeaders(accessToken),
    body: JSON.stringify(body),
  })
  if (!res.ok) throw await readError(res)

  // x-restli-id header mein post URN aata hai — feed link isi se banta hai
  const rawId = res.headers.get("x-restli-id") || ""
  const urn = rawId.startsWith("urn:") ? rawId : rawId ? `urn:li:share:${rawId}` : ""
  return {
    id: rawId,
    url: urn ? `https://www.linkedin.com/feed/update/${encodeURIComponent(urn)}` : "",
  }
}
