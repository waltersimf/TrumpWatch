import { afterEach, describe, expect, it, vi } from "vitest";
import { eq } from "drizzle-orm";
import { appRouter } from "../routers";
import { getDb, upsertQuote } from "../db";
import { quotes } from "../../drizzle/schema";

const createdExternalIds: string[] = [];

afterEach(async () => {
  vi.restoreAllMocks();
  const db = await getDb();
  if (db) {
    for (const externalId of createdExternalIds) {
      await db.delete(quotes).where(eq(quotes.externalId, externalId));
    }
  }
  createdExternalIds.length = 0;
});

describe("Manual quote refresh", () => {
  it("fetches a fresh verified quote and restores healthy API status", async () => {
    const quoteText = `Manual refresh quote ${Date.now()}`;
    vi.spyOn(global, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ message: quoteText }), {
        status: 200,
        headers: { "content-type": "application/json" },
      })
    );

    const caller = appRouter.createCaller({
      user: null,
      req: { protocol: "https", headers: {} } as any,
      res: {} as any,
    });
    const result = await caller.dashboard.refreshQuote();

    expect(result.refreshed).toBe(true);
    expect(result.quote?.quoteText).toBe(quoteText);
    expect(result.quote?.source).toBe("What Does Trump Think API");
    expect(result.apiStatus?.status).toBe("healthy");

    if (result.quote?.externalId) {
      createdExternalIds.push(result.quote.externalId);
    }
  });

  it("returns a cached verified quote when the upstream source is temporarily unavailable", async () => {
    const externalId = `manual-refresh-fallback-${Date.now()}`;
    createdExternalIds.push(externalId);
    await upsertQuote({
      quoteText: "A verified cached quote for temporary outage handling.",
      source: "What Does Trump Think API",
      externalId,
    });

    vi.spyOn(global, "fetch").mockRejectedValue(new Error("temporary upstream outage"));

    const caller = appRouter.createCaller({
      user: null,
      req: { protocol: "https", headers: {} } as any,
      res: {} as any,
    });
    const result = await caller.dashboard.refreshQuote();

    expect(result.refreshed).toBe(false);
    expect(result.quote).toBeDefined();
    expect(result.apiStatus?.status).toBe("failed");
  });
});
