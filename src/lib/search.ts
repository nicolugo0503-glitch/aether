// Web search via Serper.dev API (https://serper.dev)
// No npm package needed — just fetch

export async function webSearch(query: string, apiKey: string): Promise<string> {
  const res = await fetch("https://google.serper.dev/search", {
    method: "POST",
    headers: {
      "X-API-KEY": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ q: query, num: 5 }),
  });

  if (!res.ok) throw new Error("Search failed");

  const data = await res.json();
  const results = (data.organic || [])
    .slice(0, 5)
    .map((r: any) => `${r.title}: ${r.snippet}`)
    .join("\n");

  return results || "No results found.";
}
