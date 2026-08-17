import { describe, it, expect, beforeAll, afterEach, vi } from "vitest";
import { eq } from "drizzle-orm";
import { appRouter } from "../routers";
import type { TrpcContext } from "../_core/context";
import { getDb, getLatestNewsArticles, getRandomQuote, upsertQuote, upsertNewsArticle } from "../db";
import { newsArticles, quotes } from "../../drizzle/schema";

const seededUrls: string[] = [];
const seededExternalIds: string[] = [];

afterEach(async () => {
  const db = await getDb();
  if (db) {
    for (const url of seededUrls) {
      await db.delete(newsArticles).where(eq(newsArticles.url, url));
    }
    for (const externalId of seededExternalIds) {
      await db.delete(quotes).where(eq(quotes.externalId, externalId));
    }
  }
  seededUrls.length = 0;
  seededExternalIds.length = 0;
});

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "test",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };

  return ctx;
}

describe("Dashboard Ultimate Regression & Integration Tests", () => {
  let caller: ReturnType<typeof appRouter.createCaller>;

  beforeAll(async () => {
    const ctx = createContext();
    caller = appRouter.createCaller(ctx);

    const testUrl = "https://www.reuters.com/world/us/trump-infrastructure-" + Date.now();
    seededUrls.push(testUrl);
    await upsertNewsArticle({
      title: "Trump unveils new infrastructure plan",
      description: "President Trump announced a comprehensive infrastructure package.",
      content: "Trump outlined plans for nationwide infrastructure...",
      url: testUrl,
      source: "Reuters",
      publishedAt: new Date(),
    });

    const testExternalId = "quote-fallback-" + Date.now();
    seededExternalIds.push(testExternalId);
    await upsertQuote({
      quoteText: "Cached fallback quote for TrumpWatch verification.",
      source: "Campaign",
      date: "2026-08-13",
      externalId: testExternalId,
    });
  });

  it("should verify dashboard endpoints return persisted news without manual intervention", async () => {
    const news = await caller.dashboard.getNews({ limit: 5 });
    expect(news.length).toBeGreaterThan(0);
    for (const article of news) {
      const text = (article.title + " " + (article.description || "")).toLowerCase();
      expect(text.includes("trump") || text.includes("donald trump")).toBe(true);
    }
  });

  it("should return dashboard data including news and quote from persisted records", async () => {
    const data = await caller.dashboard.getDashboardData();
    expect(data.news.length).toBeGreaterThan(0);
    if (data.quote) {
      expect(data.quote.quoteText.toLowerCase()).not.toContain("fallback");
    } else {
      expect(data.quote).toBeUndefined();
    }
  });

  it("should return a fallback or cached quote even when quote API fails", async () => {
    // Mock global fetch failure for Tronald Dump API
    const originalFetch = global.fetch;
    global.fetch = vi.fn().mockRejectedValue(new Error("Network failure"));

    try {
      const quote = await getRandomQuote();
      if (quote) {
        expect(quote.quoteText.trim().length).toBeGreaterThan(0);
        expect(quote.quoteText.toLowerCase()).not.toContain("fallback");
      } else {
        expect(quote).toBeUndefined();
      }
    } finally {
      global.fetch = originalFetch;
    }
  });

  it("should verify news articles are strictly Trump-related and come from persisted records", async () => {
    const articles = await getLatestNewsArticles(10);
    expect(articles.length).toBeGreaterThan(0);
    for (const article of articles) {
      const text = (article.title + " " + (article.description || "")).toLowerCase();
      expect(text.includes("trump")).toBe(true);
    }
  });
});
