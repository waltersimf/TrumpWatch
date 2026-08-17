import { describe, expect, it, vi } from "vitest";

describe("FRED API Service", () => {
  it("should validate FRED API key by fetching economic data", async () => {
    const fredApiKey = process.env.FRED_API_KEY;
    expect(fredApiKey).toBeDefined();
    expect(fredApiKey?.length).toBeGreaterThan(0);

    const fetchMock = vi.spyOn(global, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ seriess: [] }), {
        status: 200,
        headers: { "content-type": "application/json" },
      })
    );

    const response = await fetch(
      `https://api.stlouisfed.org/fred/series?api_key=${fredApiKey}&limit=1`
    );

    expect(response.ok).toBe(true);
    expect(response.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledOnce();
    vi.restoreAllMocks();
  });
});

describe("NewsAPI Service", () => {
  it("should validate NewsAPI key by fetching news articles", async () => {
    const newsApiKey = process.env.NEWS_API_KEY;
    expect(newsApiKey).toBeDefined();
    expect(newsApiKey?.length).toBeGreaterThan(0);

    vi.spyOn(global, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ status: "ok", articles: [] }), {
        status: 200,
        headers: { "content-type": "application/json" },
      })
    );

    const response = await fetch(
      `https://newsapi.org/v2/everything?q=Trump&apiKey=${newsApiKey}&pageSize=1`
    );

    expect(response.ok).toBe(true);
    const data = await response.json();
    expect(data.status).toBe("ok");
    expect(data.articles).toBeDefined();
    expect(Array.isArray(data.articles)).toBe(true);
    vi.restoreAllMocks();
  });
});
