// @vitest-environment jsdom
import React from "react";
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { GovernmentMetrics } from "./GovernmentMetrics";

afterEach(() => cleanup());

describe("GovernmentMetrics source links", () => {
  it("renders official source links for each government metric", () => {
    render(
      <GovernmentMetrics
        metrics={[
          {
            id: 1,
            metricKey: "FEDERAL_DEBT",
            metricName: "Total Public Debt Outstanding",
            value: "35.46",
            date: "2026-06-30",
            unit: "Trillions of USD",
            sourceUrl: "https://fiscaldata.treasury.gov/americas-finance-guide/national-debt/",
            lastUpdated: new Date("2026-08-14T00:00:00.000Z"),
          },
        ]}
        dataGovStatus={{ status: "healthy" }}
        isLoading={false}
      />
    );

    const sourceLink = screen.getByRole("link", { name: /view official source/i });
    expect(sourceLink.getAttribute("href")).toBe(
      "https://fiscaldata.treasury.gov/americas-finance-guide/national-debt/"
    );
    expect(sourceLink.getAttribute("target")).toBe("_blank");
  });
});
