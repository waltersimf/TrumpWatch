import { afterEach, beforeAll, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { appRouter } from "../routers";
import type { TrpcContext } from "../_core/context";
import { getDb, getQuoteByExternalId, upsertQuote, isPublishableQuote } from "../db";
import { quotes } from "../../drizzle/schema";

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

  return {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("Quote Integration State & Display Verification", () => {
  let caller: ReturnType<typeof appRouter.createCaller>;

  afterEach(async () => {
    const db = await getDb();
    if (db) {
      await db.delete(quotes).where(eq(quotes.externalId, "verified-quote-001"));
      await db.delete(quotes).where(eq(quotes.externalId, "quote-test-999"));
    }
  });

  beforeAll(async () => {
    caller = appRouter.createCaller(createContext());
  });

  it("returns cached real quote with source and date when a publishable quote exists", async () => {
    await upsertQuote({
      quoteText: "We are going to win and make America great again.",
      source: "Verified Archive",
      date: "2024-11-05",
      externalId: "verified-quote-001",
    });

    const storedQuote = await getQuoteByExternalId("verified-quote-001");
    expect(storedQuote).toBeDefined();
    expect(storedQuote && isPublishableQuote(storedQuote)).toBe(true);
    expect(storedQuote?.quoteText).toContain("make America great again");
    expect(storedQuote?.source).toBe("Verified Archive");
    expect(storedQuote?.date).toBe("2024-11-05");

    const quote = await caller.dashboard.getRandomQuote();
    expect(quote).toBeDefined();
    expect(quote && isPublishableQuote(quote)).toBe(true);
  });

  it("filters out test or unverified fallback quotes from dashboard endpoints", async () => {
    await upsertQuote({
      quoteText: "Fallback quote for unit testing.",
      source: "Test",
      date: "2026-08-13",
      externalId: "quote-test-999",
    });

    const quote = await caller.dashboard.getRandomQuote();
    if (quote) {
      expect(quote.quoteText.toLowerCase()).not.toContain("fallback");
    }
  });
});
