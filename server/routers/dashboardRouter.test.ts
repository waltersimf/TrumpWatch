import { describe, it, expect, beforeAll } from "vitest";
import { appRouter } from "../routers";
import type { TrpcContext } from "../_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "test",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };

  return ctx;
}

describe("Dashboard Router", () => {
  let caller: ReturnType<typeof appRouter.createCaller>;

  beforeAll(() => {
    const ctx = createContext();
    caller = appRouter.createCaller(ctx);
  });

  it("should return countdown data with valid structure", async () => {
    const countdown = await caller.dashboard.getCountdown();

    expect(countdown).toBeDefined();
    expect(countdown).toHaveProperty("daysRemaining");
    expect(countdown).toHaveProperty("hoursRemaining");
    expect(countdown).toHaveProperty("minutesRemaining");
    expect(countdown).toHaveProperty("secondsRemaining");
    expect(countdown).toHaveProperty("percentageComplete");

    expect(typeof countdown.daysRemaining).toBe("number");
    expect(typeof countdown.percentageComplete).toBe("number");
    expect(countdown.percentageComplete).toBeGreaterThanOrEqual(0);
    expect(countdown.percentageComplete).toBeLessThanOrEqual(100);
  });

  it("should return economic metrics grouped by series ID", async () => {
    const metrics = await caller.dashboard.getEconomicMetrics();

    expect(metrics).toBeDefined();
    expect(typeof metrics).toBe("object");

    // Check if we have at least some metrics
    const seriesIds = Object.keys(metrics);
    if (seriesIds.length > 0) {
      const firstSeries = metrics[seriesIds[0]];
      expect(Array.isArray(firstSeries)).toBe(true);

      if (firstSeries && firstSeries.length > 0) {
        const metric = firstSeries[0];
        expect(metric).toHaveProperty("seriesId");
        expect(metric).toHaveProperty("seriesName");
        expect(metric).toHaveProperty("value");
        expect(metric).toHaveProperty("date");
      }
    }
  });

  it("should return news articles with valid structure", async () => {
    const news = await caller.dashboard.getNews({ limit: 5 });

    expect(Array.isArray(news)).toBe(true);

    if (news.length > 0) {
      const article = news[0];
      expect(article).toHaveProperty("id");
      expect(article).toHaveProperty("title");
      expect(article).toHaveProperty("url");
      expect(article).toHaveProperty("source");
      expect(typeof article.title).toBe("string");
      expect(typeof article.url).toBe("string");
    }
  });

  it("should return API status information", async () => {
    const status = await caller.dashboard.getApiStatus();

    expect(status).toBeDefined();
    expect(status).toHaveProperty("fred");
    expect(status).toHaveProperty("newsApi");
    expect(status).toHaveProperty("quotesApi");

    // Check status structure
    if (status.fred) {
      expect(status.fred).toHaveProperty("status");
      expect(["healthy", "degraded", "failed"]).toContain(status.fred.status);
    }
  });

  it("should return canonical government source links in complete dashboard data", async () => {
    const dashboardData = await caller.dashboard.getDashboardData();

    expect(Array.isArray(dashboardData.governmentMetrics)).toBe(true);
    expect(dashboardData.governmentMetrics).not.toBeNull();
    dashboardData.governmentMetrics.forEach((metric) => {
      expect(metric.sourceUrl).toMatch(
        /^https:\/\/(fiscaldata\.treasury\.gov|www\.census\.gov|data\.census\.gov)\//
      );
      expect(metric.sourceUrl).not.toContain("example.com");
    });

    expect(dashboardData.apiStatus).toHaveProperty("quotesApi");
    expect(dashboardData.apiStatus).toHaveProperty("dataGov");
  });

  it("should return complete dashboard data", async () => {
    const dashboardData = await caller.dashboard.getDashboardData();

    expect(dashboardData).toBeDefined();
    expect(dashboardData).toHaveProperty("countdown");
    expect(dashboardData).toHaveProperty("metrics");
    expect(dashboardData).toHaveProperty("news");
    expect(dashboardData).toHaveProperty("apiStatus");

    // Verify countdown
    expect(dashboardData.countdown).toHaveProperty("daysRemaining");
    expect(typeof dashboardData.countdown.daysRemaining).toBe("number");

    // Verify news is an array
    expect(Array.isArray(dashboardData.news)).toBe(true);

    // Verify API status
    expect(dashboardData.apiStatus).toHaveProperty("fred");
    expect(dashboardData.apiStatus).toHaveProperty("newsApi");
  });

  it("should filter news by search query", async () => {
    const allNews = await caller.dashboard.getNews({ limit: 20 });
    const filteredNews = await caller.dashboard.getNews({
      limit: 20,
      searchQuery: "Trump",
    });

    expect(Array.isArray(allNews)).toBe(true);
    expect(Array.isArray(filteredNews)).toBe(true);

    // Filtered results should be less than or equal to all results
    expect(filteredNews.length).toBeLessThanOrEqual(allNews.length);

    // All filtered results should contain the search term (case-insensitive)
    filteredNews.forEach((article) => {
      const searchTerm = "trump".toLowerCase();
      const titleMatch = article.title.toLowerCase().includes(searchTerm);
      const descriptionMatch = article.description
        ?.toLowerCase()
        .includes(searchTerm);
      const summaryMatch = article.summary?.toLowerCase().includes(searchTerm);

      expect(titleMatch || descriptionMatch || summaryMatch).toBe(true);
    });
  });
});
