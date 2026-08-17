const OFFICIAL_GOVERNMENT_HOSTS = new Set([
  "fiscaldata.treasury.gov",
  "www.census.gov",
  "data.census.gov",
]);

export function isValidGovernmentSourceUrl(value: string | null | undefined): boolean {
  if (!value) return false;

  try {
    const url = new URL(value);
    return url.protocol === "https:" && OFFICIAL_GOVERNMENT_HOSTS.has(url.hostname);
  } catch {
    return false;
  }
}
