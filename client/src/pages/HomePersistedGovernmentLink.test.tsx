// @vitest-environment jsdom
import React from "react";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { eq } from "drizzle-orm";
import Home from "./Home";
import { appRouter } from "@/../../server/routers";
import { getDb } from "@/../../server/db";
import { governmentMetrics } from "@/../../drizzle/schema";
import type { TrpcContext } from "@/../../server/_core/context";

const TEST_METRIC_KEY = "TEST_PERSISTED_SOURCE_LINK";
const state = vi.hoisted(() => ({ data: null as any }));

vi.mock("@/components/CountdownTimer", () => ({
  CountdownTimer: () => React.createElement("div"),
}));
vi.mock("@/components/EconomicMetrics", () => ({
  EconomicMetrics: () => React.createElement("div"),
}));
vi.mock("@/components/NewsFeed", () => ({
  NewsFeed: () => React.createElement("div"),
}));
vi.mock("@/components/TrumpQuote", () => ({
  TrumpQuote: () => React.createElement("div"),
}));
vi.mock("@/components/ApiStatus", () => ({
  ApiStatus: () => React.createElement("div"),
}));
vi.mock("@/lib/trpc", () => ({
  trpc: {
    dashboard: {
      getDashboardData: {
        useQuery: () => ({ data: state.data, isLoading: false }),
      },
      getNews: {
        useQuery: () => ({ data: [], isLoading: false }),
      },
      refreshQuote: {
        useMutation: () => ({ mutate: vi.fn(), isPending: false }),
      },
    },
    useUtils: () => ({
      dashboard: { getDashboardData: { setData: vi.fn() } },
    }),
  },
}));

function createContext(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("Persisted government source link path", () => {
  beforeAll(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database is unavailable for persisted link test");

    await db.delete(governmentMetrics).where(eq(governmentMetrics.metricKey, TEST_METRIC_KEY));
    await db.insert(governmentMetrics).values({
      metricKey: TEST_METRIC_KEY,
      metricName: "Persisted Treasury Source",
      value: "1.00",
      date: "2026-08-14",
      unit: "Test units",
      sourceUrl: "https://fiscaldata.treasury.gov/americas-finance-guide/national-debt/",
    });

    state.data = await appRouter.createCaller(createContext()).dashboard.getDashboardData();
  });

  afterAll(async () => {
    const db = await getDb();
    if (db) {
      await db.delete(governmentMetrics).where(eq(governmentMetrics.metricKey, TEST_METRIC_KEY));
    }
    cleanup();
  });

  it("renders the canonical source URL returned from persisted dashboard data", () => {
    render(<Home />);

    const sourceLinks = screen.getAllByRole("link", { name: /view official source/i });
    expect(
      sourceLinks.some(
        (link) =>
          link.getAttribute("href") ===
          "https://fiscaldata.treasury.gov/americas-finance-guide/national-debt/"
      )
    ).toBe(true);
  });
});
