import { describe, it, expect } from "vitest";
import { isValidNewsArticleUrl } from "./newsUrl";

describe("News Article URL Validation & Placeholder Rejection", () => {
  it("rejects example.com and other placeholder URLs", () => {
    expect(isValidNewsArticleUrl("https://example.com/trump-policy")).toBe(false);
    expect(isValidNewsArticleUrl("http://www.example.org/test")).toBe(false);
    expect(isValidNewsArticleUrl("https://removed.com/article")).toBe(false);
    expect(isValidNewsArticleUrl("http://localhost:3000/news")).toBe(false);
  });

  it("rejects malformed or non-http URLs", () => {
    expect(isValidNewsArticleUrl("not-a-url")).toBe(false);
    expect(isValidNewsArticleUrl("ftp://reuters.com/article")).toBe(false);
    expect(isValidNewsArticleUrl("")).toBe(false);
  });

  it("accepts valid news source URLs", () => {
    expect(isValidNewsArticleUrl("https://www.reuters.com/world/us/trump-policy-2026")).toBe(true);
    expect(isValidNewsArticleUrl("https://apnews.com/article/donald-trump-election-update")).toBe(true);
    expect(isValidNewsArticleUrl("https://www.bbc.com/news/world-us-canada-12345678")).toBe(true);
  });
});
