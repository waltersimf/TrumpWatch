import { afterEach, describe, expect, it, vi } from "vitest";

const dbMocks = vi.hoisted(() => ({
  getDb: vi.fn(),
  updateApiStatus: vi.fn(),
}));

vi.mock("../db", () => dbMocks);

import { upsertGovernmentMetric } from "./governmentDataService";

afterEach(() => {
  vi.resetAllMocks();
});

describe("government metric persistence", () => {
  it("uses one atomic insert-or-update instead of selecting by metricKey first", async () => {
    const onDuplicateKeyUpdate = vi.fn().mockResolvedValue(undefined);
    const values = vi.fn(() => ({ onDuplicateKeyUpdate }));
    const insert = vi.fn(() => ({ values }));
    dbMocks.getDb.mockResolvedValue({ insert });

    await upsertGovernmentMetric({
      metricKey: "FEDERAL_DEBT",
      metricName: "Total Public Debt Outstanding",
      value: "35.46",
      date: "2026-06-30",
      unit: "Trillions of USD",
      sourceUrl: "https://fiscaldata.treasury.gov/americas-finance-guide/national-debt/",
    });

    expect(insert).toHaveBeenCalledOnce();
    expect(values).toHaveBeenCalledWith(
      expect.objectContaining({ metricKey: "FEDERAL_DEBT" })
    );
    expect(onDuplicateKeyUpdate).toHaveBeenCalledWith({
      set: expect.objectContaining({
        metricName: "Total Public Debt Outstanding",
        sourceUrl: "https://fiscaldata.treasury.gov/americas-finance-guide/national-debt/",
      }),
    });
  });
});
