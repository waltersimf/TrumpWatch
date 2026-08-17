// @vitest-environment jsdom
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";

const dashboardData = {
  countdown: {
    daysRemaining: 1000,
    hoursRemaining: 1,
    minutesRemaining: 2,
    secondsRemaining: 3,
    percentageComplete: 39,
  },
  metrics: {},
  governmentMetrics: [
    {
      id: 1,
      metricKey: "FEDERAL_DEBT",
      metricName: "Total Public Debt Outstanding",
      value: "35.46",
      date: "2026-06-30",
      unit: "Trillions of USD",
      sourceUrl: "https://fiscaldata.treasury.gov/americas-finance-guide/national-debt/",
      lastUpdated: new Date("2026-08-14T00:00:00.000Z"),
      createdAt: new Date("2026-08-14T00:00:00.000Z"),
    },
  ],
  news: [],
  quote: null,
  apiStatus: {
    fred: null,
    newsApi: null,
    quotesApi: null,
    dataGov: { status: "healthy" },
  },
};

const mocks = vi.hoisted(() => ({
  setData: vi.fn(),
  refreshMutate: vi.fn(),
}));

vi.mock("@/components/CountdownTimer", () => ({
  CountdownTimer: () => React.createElement("div", { "data-testid": "countdown" }),
}));
vi.mock("@/components/EconomicMetrics", () => ({
  EconomicMetrics: () => React.createElement("div", { "data-testid": "economic" }),
}));
vi.mock("@/components/NewsFeed", () => ({
  NewsFeed: () => React.createElement("div", { "data-testid": "news" }),
}));
vi.mock("@/components/TrumpQuote", () => ({
  TrumpQuote: () => React.createElement("div", { "data-testid": "quote" }),
}));
vi.mock("@/components/ApiStatus", () => ({
  ApiStatus: () => React.createElement("div", { "data-testid": "api-status" }),
}));

vi.mock("@/lib/trpc", () => ({
  trpc: {
    dashboard: {
      getDashboardData: {
        useQuery: () => ({ data: dashboardData, isLoading: false }),
      },
      getNews: {
        useQuery: () => ({ data: [], isLoading: false }),
      },
      refreshQuote: {
        useMutation: () => ({ mutate: mocks.refreshMutate, isPending: false }),
      },
    },
    useUtils: () => ({
      dashboard: { getDashboardData: { setData: mocks.setData } },
    }),
  },
}));

import Home from "./Home";

afterEach(() => cleanup());

describe("Home government source links", () => {
  it("renders the canonical persisted dashboard source link", () => {
    render(<Home />);

    const sourceLink = screen.getByRole("link", { name: /view official source/i });
    expect(sourceLink.getAttribute("href")).toBe(
      "https://fiscaldata.treasury.gov/americas-finance-guide/national-debt/"
    );
    expect(sourceLink.getAttribute("target")).toBe("_blank");
  });
});
