// Meta Graph API — Facebook Pages + Instagram Business posting

const GRAPH = "https://graph.facebook.com/v19.0";

export async function postToFacebook(
  pageId: string,
  pageToken: string,
  message: string,
): Promise<string> {
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
  // Step 1: Create media container
  const containerBody: any = { caption, access_token: pageToken };
  if (imageUrl) {
    containerBody.image_url = imageUrl;
    containerBody.media_type = "IMAGE";
  } else {
    // Text-only isn't supported natively — use a solid color placeholder image
    containerBody.image_url = "https://placehold.co/1080x1080/6366f1/ffffff/png?text=Aether";
    containerBody.media_type = "IMAGE";
  }

  const containerRes = await fetch(`${GRAPH}/${igUserId}/media`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(containerBody),
  });
  const container = await containerRes.json();
  if (!containerRes.ok || container.error) {
    throw new Error(container.error?.message || "Instagram container creation failed");
  }

  // Step 2: Publish
  const publishRes = await fetch(`${GRAPH}/${igUserId}/media_publish`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ creation_id: container.id, access_token: pageToken }),
  });
  const published = await publishRes.json();
  if (!publishRes.ok || published.error) {
    throw new Error(published.error?.message || "Instagram publish failed");
  }
  return published.id;
}
