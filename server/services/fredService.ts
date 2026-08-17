/**
 * FRED API Service
 * Fetches economic observations from the Federal Reserve Economic Data API.
 */

import { upsertEconomicMetric, updateApiStatus } from "../db";
import type { InsertEconomicMetric } from "../../drizzle/schema";

const FRED_BASE_URL = "https://api.stlouisfed.org/fred";
const FRED_API_KEY = process.env.FRED_API_KEY;

// Key economic indicators to track.
const ECONOMIC_SERIES = {
  UNRATE: { name: "Unemployment Rate", unit: "Percent" },
  CPIAUCSL: { name: "Consumer Price Index", unit: "Index" },
  GDPC1: { name: "Real GDP", unit: "Billions of Dollars" },
  SP500: { name: "S&P 500", unit: "Index" },
  DCOILWTICO: { name: "Crude Oil WTI", unit: "Dollars per Barrel" },
  DGS10: { name: "10-Year Treasury Yield", unit: "Percent" },
};

interface FredObservation {
  date: string;
  value: string;
}

interface FredSeriesResponse {
  observations?: FredObservation[];
  error_code?: string;
  error_message?: string;
}

function buildObservationsUrl(seriesId: string): string {
  const url = new URL(`${FRED_BASE_URL}/series/observations`);
  url.searchParams.set("series_id", seriesId);
  url.searchParams.set("api_key", FRED_API_KEY ?? "");
  url.searchParams.set("file_type", "json");
  url.searchParams.set("sort_order", "desc");
  url.searchParams.set("limit", "1");
  return url.toString();
}

async function fetchLatestObservation(seriesId: string): Promise<FredObservation> {
  const response = await fetch(buildObservationsUrl(seriesId), {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(15_000),
  });
  const body = await response.text();

  if (!response.ok) {
    throw new Error(`FRED API error ${response.status}: ${body.slice(0, 240)}`);
  }

  let data: FredSeriesResponse;
  try {
    data = JSON.parse(body) as FredSeriesResponse;
  } catch {
    throw new Error("FRED returned a non-JSON response; live metrics were not updated");
  }

  if (data.error_message) {
    throw new Error(`FRED API error ${data.error_code ?? "unknown"}: ${data.error_message}`);
  }

  const observation = data.observations?.[0];
  if (!observation || !observation.date || !observation.value || observation.value === ".") {
    throw new Error("FRED returned no usable latest observation");
  }

  return observation;
}

export async function fetchFredData(): Promise<void> {
  if (!FRED_API_KEY) {
    console.warn("[FRED] API key not configured");
    await updateApiStatus("FRED", "failed", "API key not configured");
    return;
  }

  const seriesIds = Object.keys(ECONOMIC_SERIES);
  let succeeded = 0;
  let failed = 0;
  let firstError: string | undefined;

  for (const seriesId of seriesIds) {
    try {
      const latest = await fetchLatestObservation(seriesId);
      const seriesInfo = ECONOMIC_SERIES[seriesId as keyof typeof ECONOMIC_SERIES];
      const metric: InsertEconomicMetric = {
        seriesId,
        seriesName: seriesInfo.name,
        value: latest.value,
        date: latest.date,
        unit: seriesInfo.unit,
      };

      await upsertEconomicMetric(metric);
      succeeded += 1;
    } catch (error) {
      failed += 1;
      const message = error instanceof Error ? error.message : "Unknown FRED error";
      firstError ??= message;
      console.error(`[FRED] Error fetching ${seriesId}:`, error);
    }
  }

  if (succeeded === seriesIds.length) {
    await updateApiStatus("FRED", "healthy");
  } else if (succeeded > 0) {
    await updateApiStatus(
      "FRED",
      "degraded",
      `${succeeded}/${seriesIds.length} indicators refreshed; ${failed} failed. ${firstError ?? ""}`
    );
  } else {
    await updateApiStatus(
      "FRED",
      "failed",
      firstError ?? "No FRED indicators could be refreshed"
    );
  }
}

/**
 * Schedule periodic FRED data fetches.
 * Runs every 5 minutes.
 */
export function scheduleFredUpdates(): void {
  fetchFredData().catch((error) => console.error("[FRED] Initial fetch failed:", error));

  setInterval(() => {
    fetchFredData().catch((error) =>
      console.error("[FRED] Scheduled fetch failed:", error)
    );
  }, 5 * 60 * 1000);
}
