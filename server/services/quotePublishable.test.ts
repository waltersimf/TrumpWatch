import { describe, it, expect } from "vitest";
import { isPublishableQuote } from "../db";
import type { Quote } from "../../drizzle/schema";

describe("Quote Publishability & Truthful State Rules", () => {
  it("rejects test, fallback, and mock quote strings", () => {
    const testQuotes: Quote[] = [
      {
        id: 10,
        quoteText: "Fallback quote for unit testing.",
        source: "Test",
        date: "2026-08-13",
        externalId: "quote-test-123",
        createdAt: new Date(),
      },
      {
        id: 11,
        quoteText: "A normal quote",
        source: "Test Source",
        date: "2026-08-13",
        externalId: "abc",
        createdAt: new Date(),
      },
      {
        id: 12,
        quoteText: "",
        source: "Rally",
        date: "2026-08-13",
        externalId: "xyz",
        createdAt: new Date(),
      },
      {
        id: 13,
        quoteText: "Recovery quote text.",
        source: "What Does Trump Think API",
        date: null,
        externalId: "wdtt-recovery-placeholder",
        createdAt: new Date(),
      },
    ];

    expect(isPublishableQuote(testQuotes[0])).toBe(false);
    expect(isPublishableQuote(testQuotes[1])).toBe(false);
    expect(isPublishableQuote(testQuotes[2])).toBe(false);
    expect(isPublishableQuote(testQuotes[3])).toBe(false);
  });

  it("accepts genuine verified quotes with clean external IDs", () => {
    const validQuote: Quote = {
      id: 1,
      quoteText: "We will make our economy stronger than ever before.",
      source: "Campaign Rally",
      date: "2024-11-01",
      externalId: "real-external-id-999",
      createdAt: new Date(),
    };

    expect(isPublishableQuote(validQuote)).toBe(true);
  });
});
