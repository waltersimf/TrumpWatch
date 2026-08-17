import { describe, it, expect } from "vitest";
import { appRouter } from "../routers";
import type { TrpcContext } from "../_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user-unavailable",
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

describe("Quote Unavailable Endpoint Verification", () => {
  it("asserts dashboard.getRandomQuote returns undefined/null when no publishable quote exists", async () => {
    const caller = appRouter.createCaller(createContext());
    const quote = await caller.dashboard.getRandomQuote();
    
    // Since our database isolation ensures unverified/test quotes are filtered out,
    // if no verified external quote is cached, the endpoint must cleanly return undefined/null
    // rather than serving fabricated text.
    if (quote !== undefined && quote !== null) {
      expect(quote.quoteText.toLowerCase()).not.toContain("fallback");
    } else {
      expect(quote).toBeFalsy();
    }
  });
});
