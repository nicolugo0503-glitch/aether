// Meta Graph API — Facebook Pages + Instagram Business
// Twitter/X — OAuth 1.0a v2 tweets API

import crypto from "crypto";

const GRAPH = "https://graph.facebook.com/v19.0";

export async function postToFacebook(
  pageId: string,
  pageToken: string,
  message: string,
  imageUrl?: string,
): Promise<string> {
  // Post with image as a photo
  if (imageUrl) {
    const res = await fetch(`${GRAPH}/${pageId}/photos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ caption: message, url: imageUrl, access_token: pageToken }),
    });
    const data = await res.json();
    if (!res.ok || data.error) throw new Error(data.error?.message || "Facebook photo post failed");
    return data.id || data.post_id;
  }

  // Text-only fallback
  const res = await fetch(`${GRAPH}/${pageId}/feed`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, access_token: pageToken }),
  });
  const data = await res.json();
  if (!res.ok || data.error) throw new Error(data.error?.message || "Facebook post failed");
  return data.id;
}

export async function postToInstagram(
  igUserId: string,
  pageToken: string,
  caption: string,
  imageUrl?: string,
): Promise<string> {
  const containerBody: Record<string, string> = {
    caption,
    access_token: pageToken,
    image_url: imageUrl || "https://placehold.co/1080x1080/6366f1/ffffff/png?text=Aether",
    media_type: "IMAGE",
  };
  const containerRes = await fetch(`${GRAPH}/${igUserId}/media`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(containerBody),
  });
  const container = await containerRes.json();
  if (!containerRes.ok || container.error) throw new Error(container.error?.message || "Instagram container failed");

  const publishRes = await fetch(`${GRAPH}/${igUserId}/media_publish`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ creation_id: container.id, access_token: pageToken }),
  });
  const published = await publishRes.json();
  if (!publishRes.ok || published.error) throw new Error(published.error?.message || "Instagram publish failed");
  return published.id;
}

// ── Twitter / X — OAuth 1.0a ───────────────────────────────────

function pct(str: string) {
  return encodeURIComponent(str).replace(/[!'()*]/g, c => "%" + c.charCodeAt(0).toString(16).toUpperCase());
}

function buildOAuthHeader(
  method: string,
  url: string,
  apiKey: string,
  apiSecret: string,
  accessToken: string,
  accessSecret: string,
): string {
  const nonce = crypto.randomBytes(16).toString("hex");
  const ts = Math.floor(Date.now() / 1000).toString();

  const params: Record<string, string> = {
    oauth_consumer_key: apiKey,
    oauth_nonce: nonce,
    oauth_signature_method: "HMAC-SHA1",
    oauth_timestamp: ts,
    oauth_token: accessToken,
    oauth_version: "1.0",
  };

  const sortedParams = Object.keys(params).sort()
    .map(k => `${pct(k)}=${pct(params[k])}`)
    .join("&");

  const base = [method.toUpperCase(), pct(url), pct(sortedParams)].join("&");
  const sigKey = `${pct(apiSecret)}&${pct(accessSecret)}`;
  params.oauth_signature = crypto.createHmac("sha1", sigKey).update(base).digest("base64");

  return "OAuth " + Object.keys(params).sort()
    .map(k => `${pct(k)}="${pct(params[k])}"`)
    .join(", ");
}

export async function postToTwitter(
  apiKey: string,
  apiSecret: string,
  accessToken: string,
  accessSecret: string,
  text: string,
): Promise<string> {
  const url = "https://api.twitter.com/2/tweets";
  const auth = buildOAuthHeader("POST", url, apiKey, apiSecret, accessToken, accessSecret);

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: auth,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ text }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`X/Twitter error: ${err}`);
  }

  const data = await res.json();
  return data.data?.id ?? "ok";
}
