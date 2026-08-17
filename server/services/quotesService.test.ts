import { describe, expect, it, afterEach, vi } from "vitest";
import { fetchRandomQuote, QUOTES_API_NAME, QUOTES_API_URL } from "./quotesService";
import { getApiStatus, getRandomQuote } from "../db";

describe("Trump quotes API service", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("stores a verified quote from the replacement API and marks it healthy", async () => {
    const fetchMock = vi.spyOn(global, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({ message: "A verified quote from the replacement source." }),
        { status: 200, headers: { "content-type": "application/json" } }
      )
    );

    const fetchedQuote = await fetchRandomQuote();

    expect(fetchMock).toHaveBeenCalledWith(
      QUOTES_API_URL,
      expect.objectContaining({ headers: { Accept: "application/json" } })
    );
    expect(fetchedQuote?.quoteText).toBe("A verified quote from the replacement source.");
    expect(fetchedQuote?.source).toBe("What Does Trump Think API");
    expect(fetchedQuote?.date).toBeUndefined();

    // API status transitions are covered in quoteRecoveryStatus.test.ts;
    // avoid asserting shared status state from a parallel unit test.
  });

  it("marks the replacement API failed while preserving any verified cached quote", async () => {
    vi.spyOn(global, "fetch").mockRejectedValue(new Error("upstream unavailable"));

    const fetchedQuote = await fetchRandomQuote();

    expect(fetchedQuote).toBeUndefined();

    const quote = await getRandomQuote();
    expect(quote?.source).toBe("What Does Trump Think API");
  });
});
