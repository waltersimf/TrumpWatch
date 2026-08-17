import { afterEach, describe, it, expect, vi } from "vitest";
import { eq } from "drizzle-orm";
import { getDb, upsertNewsArticle, getLatestNewsArticles } from "../db";
import { newsArticles } from "../../drizzle/schema";
import { fetchPoliticalNews } from "./newsService";

const createdUrls: string[] = [];

afterEach(async () => {
  const db = await getDb();
  if (db) {
    for (const url of createdUrls) {
      await db.delete(newsArticles).where(eq(newsArticles.url, url));
    }
  }
  createdUrls.length = 0;
});
describe("News Persistence & Placeholder Rejection Integration Tests", () => {
  it("rejects upserting placeholder URLs and preserves valid ones", async () => {
    const invalidUrl = "https://example.com/fake-trump-news-" + Date.now();
    const validUrl = "https://www.reuters.com/world/us/trump-real-policy-" + Date.now();
    createdUrls.push(validUrl);

    const insertedInvalid = await upsertNewsArticle({
      title: "Fake placeholder article",
      description: "Should not be persisted",
      url: invalidUrl,
      source: "TestNews",
      publishedAt: new Date(),
    });

    expect(insertedInvalid).toBe(false);

    const insertedValid = await upsertNewsArticle({
      title: "Real Trump Policy Announcement",
      description: "Should be successfully persisted",
      url: validUrl,
      source: "Reuters",
      publishedAt: new Date(),
    });

    expect(insertedValid).toBe(true);

    const articles = await getLatestNewsArticles(10);
    const foundValid = articles.find((a) => a.url === validUrl);
    const foundInvalid = articles.find((a) => a.url === invalidUrl);

    expect(foundValid).toBeDefined();
    expect(foundInvalid).toBeUndefined();
  });

  it("filters out placeholder URLs during NewsAPI ingestion", async () => {
    const originalFetch = global.fetch;
    const placeholderUrl = "https://example.com/newsapi-placeholder-" + Date.now();
    const goodUrl = "https://apnews.com/article/trump-speech-" + Date.now();
    createdUrls.push(goodUrl);

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        status: "ok",
        totalResults: 2,
        articles: [
          {
            source: { id: "ex", name: "Example News" },
            author: "Tester",
            title: "Donald Trump fake article",
            description: "Placeholder description about Donald Trump",
            url: placeholderUrl,
            urlToImage: null,
            publishedAt: new Date().toISOString(),
            content: "Donald Trump spoke...",
          },
          {
            source: { id: "ap", name: "Associated Press" },
            author: "AP Writer",
            title: "Donald Trump real speech",
            description: "Real description about Donald Trump",
            url: goodUrl,
            urlToImage: null,
            publishedAt: new Date().toISOString(),
            content: "Donald Trump addressed the press...",
          },
        ],
      }),
    });

    try {
      await fetchPoliticalNews();
      const articles = await getLatestNewsArticles(20);
      expect(articles.some((a) => a.url === placeholderUrl)).toBe(false);
      expect(articles.some((a) => a.url === goodUrl)).toBe(true);
    } finally {
      global.fetch = originalFetch;
    }
  });
});
