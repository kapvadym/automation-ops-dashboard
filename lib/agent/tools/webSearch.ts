export class WebSearchError extends Error {}

export interface WebSearchResult {
  title: string;
  url: string;
  snippet: string;
}

const TAVILY_ENDPOINT = "https://api.tavily.com/search";
const MAX_RESULTS = 5;

export async function webSearch(query: string): Promise<WebSearchResult[]> {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) {
    throw new WebSearchError("TAVILY_API_KEY is not configured");
  }

  const res = await fetch(TAVILY_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ query, max_results: MAX_RESULTS }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new WebSearchError(`Tavily search failed (${res.status}): ${body}`);
  }

  const data = await res.json();
  const results: Array<{ title: string; url: string; content: string }> = data.results ?? [];

  return results.map((r) => ({ title: r.title, url: r.url, snippet: r.content }));
}
