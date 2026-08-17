import { describe, it, expect, afterEach, vi } from "vitest";
import { fetchRandomQuote, QUOTES_API_NAME, QUOTES_API_URL } from "./quotesService";
import { getApiStatus } from "../db";

describe("Quote API Recovery Status Transition", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("transitions API status from failed back to healthy upon successful quote recovery", async () => {
    // 1. Simulate failure
    vi.spyOn(global, "fetch").mockRejectedValueOnce(new Error("network timeout"));
    await fetchRandomQuote();
    let status = await getApiStatus(QUOTES_API_NAME);
    expect(status?.status).toBe("failed");
    expect(status?.errorMessage).toContain("network timeout");

    // 2. Simulate recovery with a publishable upstream quote.
    vi.spyOn(global, "fetch").mockResolvedValueOnce(
      new Response(
        JSON.stringify({ message: "Americanism, not globalism, will be our credo." }),
        { status: 200, headers: { "content-type": "application/json" } }
      )
    );
    await fetchRandomQuote();
    status = await getApiStatus(QUOTES_API_NAME);
    expect(status?.status).toBe("healthy");
    expect(status?.errorMessage).toBeNull();
  });
});
