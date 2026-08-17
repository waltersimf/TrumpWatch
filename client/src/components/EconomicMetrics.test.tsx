// @vitest-environment jsdom
import React from "react";
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { EconomicMetrics } from "./EconomicMetrics";

afterEach(() => cleanup());

const metric = {
  id: 1,
  seriesId: "UNRATE",
  seriesName: "Unemployment Rate",
  value: "4.10",
  date: "2026-07-01",
  unit: "Percent",
  lastUpdated: new Date("2026-08-14T00:00:00.000Z"),
};

describe("EconomicMetrics freshness labels", () => {
  it("renders the source observation date separately from the cache refresh date", () => {
    render(
      <EconomicMetrics
        metrics={{ UNRATE: [metric] }}
        fredStatus={{ status: "healthy" }}
        isLoading={false}
      />
    );

    expect(screen.getByText(/Source observation:/)).toBeDefined();
    expect(screen.getByText(/Cache refreshed:/)).toBeDefined();
    expect(screen.getByText(/Source observation: 7\/1\/2026/)).toBeDefined();
    expect(screen.getByText(/Cache refreshed: 8\/14\/2026/)).toBeDefined();
  });

  it("warns users when displayed values are cached after a failed FRED refresh", () => {
    render(
      <EconomicMetrics
        metrics={{ UNRATE: [metric] }}
        fredStatus={{
          status: "failed",
          errorMessage: "FRED returned a non-JSON response",
        }}
        isLoading={false}
      />
    );

    const status = screen.getByRole("status");
    expect(status.textContent).toContain(
      "Live FRED refresh failed; values shown above are cached."
    );
    expect(status.textContent).toContain("FRED returned a non-JSON response");
  });

  it("warns users when only some indicators refresh", () => {
    render(
      <EconomicMetrics
        metrics={{ UNRATE: [metric] }}
        fredStatus={{ status: "degraded" }}
        isLoading={false}
      />
    );

    expect(screen.getByRole("status").textContent).toContain(
      "FRED refreshed only some indicators; remaining values may be cached."
    );
  });
});
