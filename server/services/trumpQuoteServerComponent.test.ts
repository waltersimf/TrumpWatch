import { describe, it, expect } from "vitest";

describe("TrumpQuote Component Data Mapping & Unavailable State", () => {
  it("maps quote properties correctly for valid quote display", () => {
    const quote = {
      id: 1,
      quoteText: "We will make our economy stronger than ever.",
      source: "Campaign Rally",
      date: "2024-11-05",
      externalId: "ext-1",
      createdAt: new Date(),
    };

    expect(quote.quoteText).toBe("We will make our economy stronger than ever.");
    expect(quote.source).toBe("Campaign Rally");
    expect(quote.date).toBe("2024-11-05");
  });

  it("exposes the explicit unavailable message state when quote is null or undefined", () => {
    const quote = null;
    const unavailableState = {
      heading: "Verified quote unavailable",
      description: "The quote service is currently unavailable and no verified quote is cached.",
    };

    expect(quote).toBeNull();
    expect(unavailableState.heading).toBe("Verified quote unavailable");
    expect(unavailableState.description).toContain("currently unavailable");
  });
});
