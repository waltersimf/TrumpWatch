import { describe, expect, it } from "vitest";
import { getLatestNewsArticles, getRandomQuote, getLatestEconomicMetrics } from "../db";

describe("TrumpWatch Integration & Data Flow Tests", () => {
  it("should retrieve persisted Trump-specific news articles without fabrication", async () => {
    const articles = await getLatestNewsArticles(10);
    expect(articles.length).toBeGreaterThan(0);
    
    for (const article of articles) {
      const text = (article.title + " " + (article.description || "")).toLowerCase();
      expect(text.includes("trump") || text.includes("donald trump")).toBe(true);
      expect(article.url).toBeDefined();
      expect(article.source).toBeDefined();
    }
  });

  it("should provide a verified quote or an explicit unavailable state when upstream API is unreachable", async () => {
    const quote = await getRandomQuote();
    if (quote) {
      expect(quote.quoteText.trim().length).toBeGreaterThan(0);
      expect(quote.quoteText.toLowerCase()).not.toContain("fallback");
    } else {
      expect(quote).toBeUndefined();
    }
  });

  it("should successfully retrieve economic metrics", async () => {
    const metrics = await getLatestEconomicMetrics();
    expect(Array.isArray(metrics)).toBe(true);
  });
});
