import { describe, it, expect } from "vitest";
import { appRouter } from "../routers";
import type { TrpcContext } from "../_core/context";
import { getDb } from "../db";
import { quotes } from "../../drizzle/schema";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "strict-clear-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "test",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("Strict Quote Clearing & Unavailable State Assertion", () => {
  it("strictly returns undefined for getRandomQuote when all quotes are deleted or non-publishable", async () => {
    const db = await getDb();
    if (db) {
      await db.delete(quotes);
    }

    const caller = appRouter.createCaller(createContext());
    const quote = await caller.dashboard.getRandomQuote();
    expect(quote).toBeUndefined();

    const dashboardData = await caller.dashboard.getDashboardData();
    expect(dashboardData.quote).toBeUndefined();
  });
});
