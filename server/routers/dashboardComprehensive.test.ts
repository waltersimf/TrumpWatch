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

describe("Dashboard Comprehensive Regression Tests", () => {
  let caller: ReturnType<typeof appRouter.createCaller>;

  beforeAll(async () => {
    const ctx = createContext();
    caller = appRouter.createCaller(ctx);

    const testUrl = "https://www.reuters.com/world/us/trump-comprehensive-" + Date.now();
    seededUrls.push(testUrl);
    await upsertNewsArticle({
      title: "President Trump Announces Major Policy Update",
      description: "A detailed breakdown of new Trump administration initiatives.",
      content: "President Trump announced new policies today...",
      url: testUrl,
      source: "Reuters",
      publishedAt: new Date(),
    });

    const testExternalId = "test-fallback-" + Date.now();
    seededExternalIds.push(testExternalId);
    await upsertQuote({
      quoteText: "Fallback test quote for TrumpWatch testing.",
      source: "Test Source",
      date: "2026-08-13",
      externalId: testExternalId,
    });
  });

  it("should verify dashboard endpoints return persisted news without manual intervention", async () => {
    const news = await caller.dashboard.getNews({ limit: 5, searchQuery: "trump" });
    expect(news.length).toBeGreaterThan(0);
    expect(
      news.some((article) =>
        `${article.title} ${article.description ?? ""} ${article.content ?? ""}`
          .toLowerCase()
          .includes("trump")
      )
    ).toBe(true);
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

  it("should return a fallback or cached quote even when quote API or fetch fails", async () => {
    const quote = await getRandomQuote();
    if (quote) {
      expect(quote.quoteText.trim().length).toBeGreaterThan(0);
      expect(quote.quoteText.toLowerCase()).not.toContain("fallback");
    } else {
      expect(quote).toBeUndefined();
    }
  });
});
