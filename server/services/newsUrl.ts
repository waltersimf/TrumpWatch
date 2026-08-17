const PLACEHOLDER_HOSTS = new Set([
  "example.com",
  "example.org",
  "example.net",
  "localhost",
  "invalid",
  "test",
]);

const PLACEHOLDER_HOST_SUFFIXES = [".localhost", ".invalid", ".test"];

/**
 * Returns true only for absolute HTTP(S) URLs that can identify a real news
 * source. NewsAPI may return placeholder, removed, or malformed URLs, so this
 * guard is applied before persistence and again before presentation.
 */
export function isValidNewsArticleUrl(value: unknown): value is string {
  if (typeof value !== "string" || value.trim().length === 0) return false;

  let parsed: URL;
  try {
    parsed = new URL(value.trim());
  } catch {
    return false;
  }

  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    return false;
  }

  const hostname = parsed.hostname.toLowerCase().replace(/^www\./, "");
  if (
    PLACEHOLDER_HOSTS.has(hostname) ||
    PLACEHOLDER_HOST_SUFFIXES.some((suffix) => hostname.endsWith(suffix))
  ) {
    return false;
  }

  if (
    hostname === "127.0.0.1" ||
    hostname === "0.0.0.0" ||
    hostname === "::1" ||
    hostname === "removed.com"
  ) {
    return false;
  }

  return Boolean(parsed.hostname && parsed.pathname);
}
