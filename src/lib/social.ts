const AYRSHARE_BASE = "https://app.ayrshare.com/api";

function ayrshareHeaders(profileKey?: string) {
  const h: Record<string, string> = {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${process.env.AYRSHARE_API_KEY}`,
  };
  if (profileKey) h["Profile-Key"] = profileKey;
  return h;
}

export async function postToSocial(
  profileKey: string,
  caption: string,
  platforms: string[],
  imageUrl?: string | null,
) {
  const mappedPlatforms = platforms.map(p => p === "x" ? "twitter" : p);
  const body: any = { post: caption, platforms: mappedPlatforms };
  if (imageUrl) body.mediaUrls = [imageUrl];

  const res = await fetch(`${AYRSHARE_BASE}/post`, {
    method: "POST",
    headers: ayrshareHeaders(profileKey),
    body: JSON.stringify(body),
  });
  return res.json();
}

export async function createAyrshareProfile(userId: string, email: string): Promise<string> {
  const res = await fetch(`${AYRSHARE_BASE}/profiles/profile`, {
    method: "POST",
    headers: ayrshareHeaders(),
    body: JSON.stringify({ title: userId, email }),
  });
  const data = await res.json();
  return data.profileKey ?? "";
}

export async function getConnectUrl(profileKey: string): Promise<string> {
  const res = await fetch(`${AYRSHARE_BASE}/profiles/generateJWT`, {
    method: "POST",
    headers: ayrshareHeaders(),
    body: JSON.stringify({ profileKey }),
  });
  const data = await res.json();
  return data.url ?? "";
}
