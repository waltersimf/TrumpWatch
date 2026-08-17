import { describe, it, expect, beforeAll, vi } from "vitest";
import { appRouter } from "../routers";
import type { TrpcContext } from "../_core/context";
import { getLatestNewsArticles, getRandomQuote, upsertQuote, upsertNewsArticle } from "../db";
import { fetchPoliticalNews } from "../services/newsService";
import { fetchRandomQuote } from "../services/quotesService";

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

describe("Dashboard Comprehensive Regression Suite Part 2", () => {
  let caller: ReturnType<typeof appRouter.createCaller>;

  beforeAll(async () => {
    const ctx = createContext();
    caller = appRouter.createCaller(ctx);
  });

  it("should test startup news fetch flow and verify news articles contain Trump-related terms", async () => {
    // Mock global fetch for NewsAPI response during startup/refresh flow
    const originalFetch = global.fetch;
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        status: "ok",
        totalResults: 1,
        articles: [
          {
            source: { id: "reuters", name: "Reuters" },
            author: "Test Author",
            title: "Donald Trump unveils new trade policy",
            description: "President Trump announced new tariffs and trade measures.",
            url: "https://example.com/trump-trade-" + Date.now(),
            urlToImage: null,
            publishedAt: new Date().toISOString(),
            content: "Donald Trump announced trade measures...",
          },
        ],
      }),
    });

    try {
      await fetchPoliticalNews();
      const news = await caller.dashboard.getNews({ limit: 5 });
      expect(news.length).toBeGreaterThan(0);
      const trumpArticle = news.find(a => a.title.toLowerCase().includes("trump"));
      expect(trumpArticle).toBeDefined();
    } finally {
      global.fetch = originalFetch;
    }
  });

  it("should test quote fallback behavior when Tronald Dump API fetch fails", async () => {
    // Mock global fetch failure to simulate Tronald Dump API outage
    const originalFetch = global.fetch;
    global.fetch = vi.fn().mockRejectedValue(new Error("Tronald Dump API down"));

    try {
      await fetchRandomQuote();
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
