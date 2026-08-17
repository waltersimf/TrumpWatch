import { afterEach, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { appRouter } from "../routers";
import type { TrpcContext } from "../_core/context";
import { getDb, getLatestNewsArticles, upsertNewsArticle } from "../db";
import { newsArticles, newsLinkReports } from "../../drizzle/schema";

const createdUrls: string[] = [];

afterEach(async () => {
  const db = await getDb();
  if (db) {
    for (const url of createdUrls) {
      await db.delete(newsLinkReports).where(eq(newsLinkReports.articleUrl, url));
      await db.delete(newsArticles).where(eq(newsArticles.url, url));
    }
  }
  createdUrls.length = 0;
});

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "broken-link-test-user",
    email: "broken-link-test@example.com",
    name: "Broken Link Test User",
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

describe("Broken link report procedure", () => {
  it("persists a report for an existing article", async () => {
    const articleUrl = `https://www.reuters.com/world/us/trump-report-${Date.now()}`;
    createdUrls.push(articleUrl);
    await upsertNewsArticle({
      title: "Donald Trump reportable article",
      description: "Test article used to verify reporting.",
      url: articleUrl,
      source: "Reuters",
      publishedAt: new Date(),
    });

    const article = (await getLatestNewsArticles(50)).find(
      (candidate) => candidate.url === articleUrl
    );
    expect(article).toBeDefined();

    const caller = appRouter.createCaller(createContext());
    await expect(
      caller.dashboard.reportBrokenLink({
        articleId: article!.id,
        articleUrl,
        comment: "The source returns a 404 page.",
      })
    ).resolves.toEqual({ success: true });
  });

  it("rejects a report when the submitted URL does not match the stored article", async () => {
    const articleUrl = `https://apnews.com/article/trump-report-${Date.now()}`;
    createdUrls.push(articleUrl);
    await upsertNewsArticle({
      title: "Donald Trump article for URL validation",
      url: articleUrl,
      source: "Associated Press",
      publishedAt: new Date(),
    });

    const article = (await getLatestNewsArticles(50)).find(
      (candidate) => candidate.url === articleUrl
    );
    expect(article).toBeDefined();

    const caller = appRouter.createCaller(createContext());
    await expect(
      caller.dashboard.reportBrokenLink({
        articleId: article!.id,
        articleUrl: "https://example.com/not-the-stored-article",
      })
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });
});
