/**
 * @vitest-environment jsdom
 */
import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import Home from "./Home";

const dashboardData = {
  countdown: {
    daysRemaining: 1000,
    hoursRemaining: 1,
    minutesRemaining: 2,
    secondsRemaining: 3,
    percentageComplete: 39,
  },
  metrics: {},
  governmentMetrics: [],
  news: [],
  quote: null,
  notifications: [],
  apiStatus: {
    fred: null,
    newsApi: null,
    quotesApi: null,
    dataGov: { status: "healthy" },
  },
};

vi.mock("@/components/CountdownTimer", () => ({
  CountdownTimer: () => React.createElement("div", { "data-testid": "countdown" }),
}));
vi.mock("@/components/EconomicMetrics", () => ({
  EconomicMetrics: () => React.createElement("div", { "data-testid": "economic" }),
}));
vi.mock("@/components/GovernmentMetrics", () => ({
  GovernmentMetrics: () => React.createElement("div", { "data-testid": "gov-metrics" }),
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
vi.mock("@/components/NotificationCenter", () => ({
  NotificationCenter: () => React.createElement("div", { "data-testid": "notifications" }),
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
        useMutation: () => ({ mutate: vi.fn(), isLoading: false }),
      },
      reportBrokenLink: {
        useMutation: () => ({ mutate: vi.fn(), isLoading: false }),
      },
    },
    useUtils: () => ({
      dashboard: {
        getDashboardData: { setData: vi.fn() },
      },
    }),
  },
}));

afterEach(() => cleanup());

describe("Home Responsive Layout Across Viewports", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders correctly under mobile viewport constraints", () => {
    if (typeof window !== "undefined") {
      window.innerWidth = 375;
      window.innerHeight = 667;
      window.dispatchEvent(new Event("resize"));
    }

    render(<Home />);

    expect(screen.getByTestId("countdown")).toBeTruthy();
    expect(screen.getByTestId("economic")).toBeTruthy();
    expect(screen.getByTestId("news")).toBeTruthy();
  });

  it("renders correctly under tablet viewport constraints", () => {
    if (typeof window !== "undefined") {
      window.innerWidth = 768;
      window.innerHeight = 1024;
      window.dispatchEvent(new Event("resize"));
    }

    render(<Home />);

    expect(screen.getByTestId("countdown")).toBeTruthy();
    expect(screen.getByTestId("economic")).toBeTruthy();
    expect(screen.getByTestId("news")).toBeTruthy();
  });

  it("renders correctly under desktop viewport constraints", () => {
    if (typeof window !== "undefined") {
      window.innerWidth = 1440;
      window.innerHeight = 900;
      window.dispatchEvent(new Event("resize"));
    }

    render(<Home />);

    expect(screen.getByTestId("countdown")).toBeTruthy();
    expect(screen.getByTestId("economic")).toBeTruthy();
    expect(screen.getByTestId("news")).toBeTruthy();
  });
});
