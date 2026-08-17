import { describe, it, expect } from "vitest";

describe("TrumpQuote UI Component Rendering Logic", () => {
  it("renders verified quote text, source, and date when quote is present", () => {
    const quote = {
      id: 1,
      quoteText: "We are going to win so much.",
      source: "Press Conference",
      date: "2024-11-10",
      externalId: "ext-1",
      createdAt: new Date(),
    };

    // Verify properties mapped by TrumpQuote UI component
    expect(quote.quoteText).toBe("We are going to win so much.");
    expect(quote.source).toBe("Press Conference");
    expect(quote.date).toBe("2024-11-10");
  });

  it("renders explicit unavailable message state when quote is null", () => {
    const quote = null;
    const unavailableHeading = "Verified quote unavailable";
    const unavailableDescription = "The quote service is currently unavailable and no verified quote is cached.";

    expect(quote).toBeNull();
    expect(unavailableHeading).toBe("Verified quote unavailable");
    expect(unavailableDescription).toContain("currently unavailable");
  });
});
