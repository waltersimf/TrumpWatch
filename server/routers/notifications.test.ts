import { describe, expect, it } from "vitest";
import { appRouter } from "../routers";
import type { TrpcContext } from "../_core/context";
import { getDb, updateApiStatus } from "../db";
import { apiStatus, countdownMilestones } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

function createContext(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("Notifications integration", () => {
  it("aggregates API failures and milestone history into recent notifications", async () => {
    await updateApiStatus("TestAPI", "failed", "Simulated connection timeout");

    const db = await getDb();
    if (db) {
      await db.insert(countdownMilestones).values({
        daysRemaining: 1000,
        notificationSent: 1,
        notificationSentAt: new Date(),
      });
    }

    const caller = appRouter.createCaller(createContext());
    const notifications = await caller.dashboard.getNotifications();
    const dashboardData = await caller.dashboard.getDashboardData();

    expect(Array.isArray(notifications)).toBe(true);
    const testAlert = notifications.find((n) => n.title.includes("TestAPI"));
    expect(testAlert).toBeDefined();
    expect(testAlert?.message).toContain("Simulated connection timeout");
    expect(testAlert?.type).toBe("api_failure");

    const milestoneAlert = notifications.find((n) => n.title.includes("1000 Days"));
    expect(milestoneAlert).toBeDefined();
    expect(milestoneAlert?.type).toBe("milestone");

    expect(dashboardData.notifications.length).toBeGreaterThanOrEqual(2);

    // Cleanup
    if (db) {
      await db.delete(apiStatus).where(eq(apiStatus.apiName, "TestAPI"));
      await db.delete(countdownMilestones).where(eq(countdownMilestones.daysRemaining, 1000));
    }
  });
});
