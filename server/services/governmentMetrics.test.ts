import { describe, expect, it, vi } from "vitest";
import { getLatestGovernmentMetrics, upsertGovernmentMetric } from "../db";

describe("Government Metrics Service", () => {
  it("provides fallback or persisted government metrics", async () => {
    const metrics = await getLatestGovernmentMetrics();
    expect(Array.isArray(metrics)).toBe(true);
  });
});
