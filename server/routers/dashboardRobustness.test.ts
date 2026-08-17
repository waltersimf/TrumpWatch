import { describe, it, expect, beforeAll } from "vitest";
import { appRouter } from "../routers";
import type { TrpcContext } from "../_core/context";
import { getLatestNewsArticles, getRandomQuote, upsertQuote } from "../db";

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

describe("Dashboard Robustness & Data Integrity Tests", () => {
  let caller: ReturnType<typeof appRouter.createCaller>;

  beforeAll(async () => {
    const ctx = createContext();
    caller = appRouter.createCaller(ctx);
  });

  it("should return persisted news articles that are exclusively Trump-related", async () => {
    const news = await caller.dashboard.getNews({ limit: 10 });
    expect(Array.isArray(news)).toBe(true);
    
    for (const article of news) {
      const text = (article.title + " " + (article.description || "")).toLowerCase();
      expect(text.includes("trump") || text.includes("donald trump")).toBe(true);
    }
  });

  it("should provide a verified quote or an explicit unavailable state when upstream API fails", async () => {
    const quote = await caller.dashboard.getRandomQuote();
    if (quote) {
      expect(quote.quoteText.trim().length).toBeGreaterThan(0);
      expect(quote.quoteText.toLowerCase()).not.toContain("fallback");
    } else {
      expect(quote).toBeUndefined();
    }
  });

  it("should return complete dashboard data including news and quote successfully", async () => {
    const data = await caller.dashboard.getDashboardData();
    expect(data).toBeDefined();
    expect(data).toHaveProperty("countdown");
    expect(data).toHaveProperty("metrics");
    expect(data).toHaveProperty("news");
    expect(data).toHaveProperty("quote");
    expect(Array.isArray(data.news)).toBe(true);
    if (data.quote) {
      expect(data.quote.quoteText.trim().length).toBeGreaterThan(0);
      expect(data.quote.quoteText.toLowerCase()).not.toContain("fallback");
    } else {
      expect(data.quote).toBeUndefined();
    }
  });
});
