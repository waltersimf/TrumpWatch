import { describe, expect, it } from "vitest";
import { isValidGovernmentSourceUrl } from "./governmentUrl";

describe("government source URL validation", () => {
  it("accepts verified Treasury and Census pages", () => {
    expect(
      isValidGovernmentSourceUrl(
        "https://fiscaldata.treasury.gov/americas-finance-guide/national-debt/"
      )
    ).toBe(true);
    expect(
      isValidGovernmentSourceUrl("https://www.census.gov/programs-surveys/popest.html")
    ).toBe(true);
  });

  it("rejects raw API URLs, insecure URLs, and placeholders", () => {
    expect(isValidGovernmentSourceUrl("https://api.example.com/data")).toBe(false);
    expect(isValidGovernmentSourceUrl("http://www.census.gov/data")).toBe(false);
    expect(isValidGovernmentSourceUrl("https://example.com")).toBe(false);
    expect(isValidGovernmentSourceUrl(undefined)).toBe(false);
  });
});
