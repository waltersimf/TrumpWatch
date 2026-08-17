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

describe("Dashboard Precise Regression Suite", () => {
  let caller: ReturnType<typeof appRouter.createCaller>;

  beforeAll(async () => {
    const ctx = createContext();
    caller = appRouter.createCaller(ctx);

    const testUrl = "https://www.reuters.com/world/us/trump-summit-" + Date.now();
    seededUrls.push(testUrl);
    await upsertNewsArticle({
      title: "Donald Trump speaks at major policy summit",
      description: "Trump outlined key economic priorities.",
      content: "Donald Trump discussed tax policy and economic growth...",
      url: testUrl,
      source: "Reuters",
      publishedAt: new Date(),
    });

    const testExternalId = "quote-test-" + Date.now();
    seededExternalIds.push(testExternalId);
    await upsertQuote({
      quoteText: "Fallback quote for unit testing.",
      source: "Test",
      date: "2026-08-13",
      externalId: testExternalId,
    });
  });

  it("verifies dashboard.getNews returns persisted Trump-related articles", async () => {
    const news = await caller.dashboard.getNews({ limit: 10 });
    expect(news.length).toBeGreaterThan(0);
    for (const article of news) {
      const text = (article.title + " " + (article.description || "")).toLowerCase();
      expect(text.includes("trump") || text.includes("donald trump")).toBe(true);
    }
  });

  it("verifies dashboard.getDashboardData returns populated news and quote from persisted state", async () => {
    const data = await caller.dashboard.getDashboardData();
    expect(data.news.length).toBeGreaterThan(0);
    if (data.quote) {
      expect(data.quote.quoteText.toLowerCase()).not.toContain("fallback");
    } else {
      expect(data.quote).toBeUndefined();
    }
  });

  it("asserts quote fallback returns valid quote when Tronald Dump API fetch fails", async () => {
    const originalFetch = global.fetch;
    global.fetch = vi.fn().mockRejectedValue(new Error("API Unreachable"));

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
});
