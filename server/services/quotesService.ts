/**
 * Trump quotes service.
 *
 * The former Tronald Dump endpoint now returns 404 and its root domain serves
 * unrelated content. This service uses the documented What Does Trump Think
 * endpoint instead; it returns quote text only, so source/date metadata is
 * handled explicitly rather than invented.
 */

import { createHash } from "node:crypto";
import { upsertQuote, updateApiStatus } from "../db";
import type { InsertQuote } from "../../drizzle/schema";

export const QUOTES_API_NAME = "TrumpQuotesAPI";
export const QUOTES_API_URL =
  "https://api.whatdoestrumpthink.com/api/v1/quotes/random";

interface WhatDoesTrumpThinkResponse {
  message?: unknown;
}

const TECHNICAL_QUOTE_PATTERN = /^(?:recovery quote text\.?|fallback quote\.?|sample quote\.?|placeholder quote\.?)$/i;

function createExternalId(quoteText: string): string {
  const digest = createHash("sha256").update(quoteText).digest("hex").slice(0, 24);
  return `wdtt-${digest}`;
}

export async function fetchRandomQuote(): Promise<InsertQuote | undefined> {
  try {
    const response = await fetch(QUOTES_API_URL, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(20_000),
    });

    if (!response.ok) {
      throw new Error(`Trump quotes API error: ${response.status} ${response.statusText}`);
    }

    const data = (await response.json()) as WhatDoesTrumpThinkResponse;
    const quoteText = typeof data.message === "string" ? data.message.trim() : "";

    if (!quoteText || TECHNICAL_QUOTE_PATTERN.test(quoteText)) {
      throw new Error("Trump quotes API returned no publishable quote text");
    }

    const quote: InsertQuote = {
      quoteText,
      source: "What Does Trump Think API",
      // The replacement API does not provide a quote date. Do not invent one.
      date: undefined,
      externalId: createExternalId(quoteText),
    };

    await upsertQuote(quote);
    await updateApiStatus(QUOTES_API_NAME, "healthy");
    return quote;
  } catch (error) {
    console.error("[TrumpQuotesAPI] Service error:", error);
    await updateApiStatus(
      QUOTES_API_NAME,
      "failed",
      error instanceof Error ? error.message : "Unknown error"
    );
    return undefined;
  }
}

/** Schedule periodic quote fetches. Runs every 30 minutes. */
export function scheduleQuoteUpdates(): void {
  fetchRandomQuote().catch((error) =>
    console.error("[TrumpQuotesAPI] Initial fetch failed:", error)
  );

  setInterval(() => {
    fetchRandomQuote().catch((error) =>
      console.error("[TrumpQuotesAPI] Scheduled fetch failed:", error)
    );
  }, 30 * 60 * 1000);
}
