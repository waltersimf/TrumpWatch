import { describe, expect, it } from "vitest";
import { getRandomQuote, getLatestNewsArticles, isPublishableQuote } from "../db";

describe("TrumpWatch Data Integrations Test", () => {
  it("does not return fabricated or test fallback quotes", async () => {
    const quote = await getRandomQuote();
    if (quote) {
      expect(isPublishableQuote(quote)).toBe(true);
      expect(quote.quoteText.toLowerCase()).not.toContain("fallback");
      expect(quote.source?.toLowerCase()).not.toContain("test");
    } else {
      expect(quote).toBeUndefined();
    }
  });

  it("rejects known test and fallback records", () => {
    expect(
      isPublishableQuote({
        id: 1,
        quoteText: "Fallback quote for unit testing.",
        source: "Test",
        date: "2026-08-13",
        externalId: "quote-test-1",
        createdAt: new Date(),
      })
    ).toBe(false);
  });

  it("accepts a quote with a non-test source and external identifier", () => {
    expect(
      isPublishableQuote({
        id: 2,
        quoteText: "A verified quote from an external archive.",
        source: "Tronald Dump",
        date: "2024-01-01",
        externalId: "abc-123",
        createdAt: new Date(),
      })
    ).toBe(true);
  });

  it("should retrieve news articles ordered by publication date descending", async () => {
    const articles = await getLatestNewsArticles(10);
    expect(Array.isArray(articles)).toBe(true);

    if (articles.length > 1) {
      const firstDate = articles[0]?.publishedAt
        ? new Date(articles[0].publishedAt).getTime()
        : 0;
      const secondDate = articles[1]?.publishedAt
        ? new Date(articles[1].publishedAt).getTime()
        : 0;
      if (firstDate && secondDate) {
        expect(firstDate).toBeGreaterThanOrEqual(secondDate);
      }
    }
  });
});
