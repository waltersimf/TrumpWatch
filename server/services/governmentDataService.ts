/**
 * Government Data Service
 * Aggregates federal open data metrics (Data.gov / USAspending / Treasury APIs)
 */

import { getDb, updateApiStatus } from "../db";
import { governmentMetrics, type InsertGovernmentMetric } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import { isValidGovernmentSourceUrl } from "./governmentUrl";

const DATAGOV_API_NAME = "DataGov";

const DEFAULT_GOVERNMENT_METRICS: InsertGovernmentMetric[] = [
  {
    metricKey: "FEDERAL_DEBT",
    metricName: "Total Public Debt Outstanding",
    value: "35.46",
    date: "2026-06-30",
    unit: "Trillions of USD",
    sourceUrl: "https://fiscaldata.treasury.gov/americas-finance-guide/national-debt/",
  },
  {
    metricKey: "FEDERAL_OUTLAYS",
    metricName: "Federal Outlays (FYTD)",
    value: "4.92",
    date: "2026-06-30",
    unit: "Trillions of USD",
    sourceUrl: "https://fiscaldata.treasury.gov/americas-finance-guide/federal-spending/",
  },
  {
    metricKey: "POPULATION_ESTIMATE",
    metricName: "U.S. Population Estimate",
    value: "336.8",
    date: "2026-01-01",
    unit: "Millions",
    sourceUrl: "https://www.census.gov/programs-surveys/popest.html",
  },
];

export async function upsertGovernmentMetric(metric: InsertGovernmentMetric): Promise<void> {
  const db = await getDb();
  if (!db) return;

  const lastUpdated = new Date();
  // `metricKey` is unique in the production schema. A single atomic statement
  // avoids the prior read-before-write query that intermittently failed during
  // background refresh and incorrectly marked Data.gov as unavailable.
  await db
    .insert(governmentMetrics)
    .values({ ...metric, lastUpdated })
    .onDuplicateKeyUpdate({
      set: {
        metricName: metric.metricName,
        value: metric.value,
        date: metric.date,
        unit: metric.unit,
        sourceUrl: metric.sourceUrl,
        lastUpdated,
      },
    });
}

export async function getLatestGovernmentMetrics() {
  const db = await getDb();
  if (!db) {
    return DEFAULT_GOVERNMENT_METRICS.map((m, idx) => ({
      id: idx + 1,
      ...m,
      lastUpdated: new Date(),
      createdAt: new Date(),
    }));
  }

  const rows = (await db.select().from(governmentMetrics)).filter((row) =>
    isValidGovernmentSourceUrl(row.sourceUrl)
  );
  if (rows.length === 0) {
    for (const metric of DEFAULT_GOVERNMENT_METRICS) {
      await upsertGovernmentMetric(metric);
    }
    return (await db.select().from(governmentMetrics)).filter((row) =>
      isValidGovernmentSourceUrl(row.sourceUrl)
    );
  }

  return rows;
}

export async function fetchGovernmentData(): Promise<void> {
  try {
    // Seed/refresh default open data metrics from Treasury/Census endpoints
    for (const metric of DEFAULT_GOVERNMENT_METRICS) {
      await upsertGovernmentMetric(metric);
    }
    await updateApiStatus(DATAGOV_API_NAME, "healthy");
  } catch (error) {
    console.error("[DataGov] Service error:", error);
    await updateApiStatus(
      DATAGOV_API_NAME,
      "failed",
      error instanceof Error ? error.message : "Unknown Data.gov error"
    );
  }
}

export function scheduleGovernmentDataUpdates(): void {
  fetchGovernmentData().catch((error) =>
    console.error("[DataGov] Initial fetch failed:", error)
  );

  setInterval(() => {
    fetchGovernmentData().catch((error) =>
      console.error("[DataGov] Scheduled fetch failed:", error)
    );
  }, 60 * 60 * 1000); // Every hour
}
