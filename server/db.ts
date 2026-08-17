import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { desc } from "drizzle-orm";
import { isValidNewsArticleUrl } from "./services/newsUrl";
import {
  InsertUser,
  users,
  economicMetrics,
  InsertEconomicMetric,
  governmentMetrics,
  InsertGovernmentMetric,
  newsArticles,
  InsertNewsArticle,
  newsLinkReports,
  InsertNewsLinkReport,
  quotes,
  InsertQuote,
  countdownMilestones,
  apiStatus,
  notificationPreferences,
  type EconomicMetric,
  type NewsArticle,
  type Quote,
  type CountdownMilestone,
  type ApiStatus,
  type NotificationPreference,
  type InsertCountdownMilestone,
  type InsertNotificationPreference,
  type InsertApiStatus,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = "admin";
      updateSet.role = "admin";
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db
    .select()
    .from(users)
    .where(eq(users.openId, openId))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getAllUsers() {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(users);
}

// Economic Metrics Queries
// Government Metrics Queries
export async function getLatestGovernmentMetrics() {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(governmentMetrics)
    .orderBy(desc(governmentMetrics.lastUpdated))
    .limit(100);
}

export async function getLatestEconomicMetrics() {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(economicMetrics)
    .orderBy((t) => t.lastUpdated)
    .limit(100);
}

export async function upsertEconomicMetric(
  metric: InsertEconomicMetric
): Promise<void> {
  const db = await getDb();
  if (!db) return;

  // The legacy schema does not enforce a unique index on seriesId. Resolve the
  // latest cached row explicitly so live observations update the same metric
  // and, importantly, replace the source observation date from seeded data.
  const existing = await db
    .select({ id: economicMetrics.id })
    .from(economicMetrics)
    .where(eq(economicMetrics.seriesId, metric.seriesId))
    .orderBy(desc(economicMetrics.lastUpdated))
    .limit(1);

  if (existing[0]) {
    await db
      .update(economicMetrics)
      .set({
        seriesName: metric.seriesName,
        value: metric.value,
        date: metric.date,
        unit: metric.unit,
        lastUpdated: new Date(),
      })
      .where(eq(economicMetrics.id, existing[0].id));
    return;
  }

  await db.insert(economicMetrics).values({
    ...metric,
    lastUpdated: new Date(),
  });
}

// News Articles Queries
export function isTrumpRelatedNewsArticle(article: Pick<NewsArticle, "title" | "description">): boolean {
  const text = `${article.title} ${article.description ?? ""}`.toLowerCase();
  return text.includes("trump") || text.includes("donald trump");
}

export async function getNewsArticleById(articleId: number) {
  const db = await getDb();
  if (!db) return undefined;

  const rows = await db
    .select()
    .from(newsArticles)
    .where(eq(newsArticles.id, articleId))
    .limit(1);

  return rows[0];
}

export async function getLatestNewsArticles(limit: number = 20) {
  const db = await getDb();
  if (!db) return [];

  const articles = await db
    .select()
    .from(newsArticles)
    .orderBy((t) => desc(t.publishedAt))
    .limit(Math.max(limit * 3, limit));

  return articles
    .filter((article) => isValidNewsArticleUrl(article.url))
    .filter(isTrumpRelatedNewsArticle)
    .slice(0, limit);
}

export async function upsertNewsArticle(
  article: InsertNewsArticle
): Promise<boolean> {
  if (!isValidNewsArticleUrl(article.url)) {
    console.warn(`[News] Ignoring invalid article URL: ${article.url}`);
    return false;
  }

  if (!isTrumpRelatedNewsArticle({
    title: article.title,
    description: article.description ?? null,
  })) {
    console.warn(`[News] Ignoring non-Trump article: ${article.title}`);
    return false;
  }

  const db = await getDb();
  if (!db) return false;

  await db
    .insert(newsArticles)
    .values(article)
    .onDuplicateKeyUpdate({
      set: {
        title: article.title,
        description: article.description,
        content: article.content,
        updatedAt: new Date(),
      },
    });

  return true;
}

export async function createNewsLinkReport(
  report: InsertNewsLinkReport
): Promise<void> {
  const db = await getDb();
  if (!db) return;

  await db.insert(newsLinkReports).values(report);
}

export async function updateArticleSummary(
  articleId: number,
  summary: string
): Promise<void> {
  const db = await getDb();
  if (!db) return;

  await db
    .update(newsArticles)
    .set({
      summary,
      summaryGeneratedAt: new Date(),
    })
    .where(eq(newsArticles.id, articleId));
}

// Quotes Queries
export function isPublishableQuote(quote: Quote): boolean {
  const text = quote.quoteText.trim();
  const normalizedText = text.toLowerCase();
  const normalizedSource = quote.source?.trim().toLowerCase() ?? "";
  const normalizedExternalId = quote.externalId?.trim().toLowerCase() ?? "";

  if (!text) return false;
  if (/fallback|recovery quote|unit testing|end-to-end|for testing|test quote/.test(normalizedText)) {
    return false;
  }
  if (normalizedSource === "test" || normalizedSource.includes("test source")) {
    return false;
  }
  if (/^(fallback|quote-test|test-fallback|quote-fallback|e2e-quote)-/.test(normalizedExternalId)) {
    return false;
  }
  if (/^quote-\d+$/.test(normalizedExternalId)) {
    return false;
  }

  return true;
}

export async function getQuoteByExternalId(
  externalId: string
): Promise<Quote | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const rows = await db
    .select()
    .from(quotes)
    .where(eq(quotes.externalId, externalId))
    .limit(1);

  return rows[0];
}

export async function getRandomQuote(): Promise<Quote | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const allQuotes = await db.select().from(quotes);
  const publishableQuotes = allQuotes.filter(isPublishableQuote);
  if (publishableQuotes.length === 0) return undefined;

  const randomIndex = Math.floor(Math.random() * publishableQuotes.length);
  return publishableQuotes[randomIndex];
}

export async function upsertQuote(quote: InsertQuote): Promise<void> {
  const db = await getDb();
  if (!db) return;

  await db
    .insert(quotes)
    .values(quote)
    .onDuplicateKeyUpdate({
      set: {
        quoteText: quote.quoteText,
      },
    });
}

// Countdown Milestones Queries
export async function getMilestoneByDays(daysRemaining: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(countdownMilestones)
    .where(eq(countdownMilestones.daysRemaining, daysRemaining))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function updateMilestoneNotification(
  milestoneId: number
): Promise<void> {
  const db = await getDb();
  if (!db) return;

  await db
    .update(countdownMilestones)
    .set({
      notificationSent: 1,
      notificationSentAt: new Date(),
    })
    .where(eq(countdownMilestones.id, milestoneId));
}

export async function initializeMilestones(): Promise<void> {
  const db = await getDb();
  if (!db) return;

  const milestoneDays = [1000, 500, 100, 50, 10, 1];
  for (const days of milestoneDays) {
    const existing = await getMilestoneByDays(days);
    if (!existing) {
      await db.insert(countdownMilestones).values({
        daysRemaining: days,
        notificationSent: 0,
      });
    }
  }
}

// API Status Queries
export async function getApiStatus(apiName: string) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(apiStatus)
    .where(eq(apiStatus.apiName, apiName))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function updateApiStatus(
  apiName: string,
  status: "healthy" | "degraded" | "failed",
  errorMessage?: string
): Promise<void> {
  const db = await getDb();
  if (!db) return;

  const existing = await getApiStatus(apiName);

  if (existing) {
    await db
      .update(apiStatus)
      .set({
        status,
        lastSuccessfulFetch:
          status === "healthy" ? new Date() : existing.lastSuccessfulFetch,
        lastFailedFetch:
          status !== "healthy" ? new Date() : existing.lastFailedFetch,
        errorMessage: status === "healthy" ? null : errorMessage,
        consecutiveFailures:
          status === "healthy" ? 0 : (existing.consecutiveFailures || 0) + 1,
      })
      .where(eq(apiStatus.apiName, apiName));
  } else {
    await db.insert(apiStatus).values({
      apiName,
      status,
      lastSuccessfulFetch: status === "healthy" ? new Date() : undefined,
      lastFailedFetch: status !== "healthy" ? new Date() : undefined,
      errorMessage: status === "healthy" ? undefined : errorMessage,
      consecutiveFailures: status === "healthy" ? 0 : 1,
    });
  }
}

// Notification Preferences Queries
export async function getNotificationPreferences(userId: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(notificationPreferences)
    .where(eq(notificationPreferences.userId, userId))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function initializeNotificationPreferences(
  userId: number
): Promise<void> {
  const db = await getDb();
  if (!db) return;

  const existing = await getNotificationPreferences(userId);
  if (!existing) {
    await db.insert(notificationPreferences).values({
      userId,
      enableMilestoneNotifications: 1,
      enableApiFailureNotifications: 1,
    });
  }
}

export async function getRecentNotifications() {
  const db = await getDb();
  if (!db) return [];

  const statuses = await db.select().from(apiStatus);
  const milestones = await db.select().from(countdownMilestones);

  const items: Array<{
    id: number;
    title: string;
    message: string;
    type: string;
    read: number;
    createdAt: Date;
  }> = [];

  let idCounter = 1;
  for (const st of statuses) {
    if (st.status !== "healthy") {
      items.push({
        id: idCounter++,
        title: `${st.apiName} Alert`,
        message: st.errorMessage || `Service status is ${st.status}`,
        type: "api_failure",
        read: 0,
        createdAt: st.updatedAt || new Date(),
      });
    }
  }

  for (const m of milestones) {
    if (m.notificationSent === 1) {
      items.push({
        id: idCounter++,
        title: `Milestone Reached: ${m.daysRemaining} Days`,
        message: `The countdown reached ${m.daysRemaining} days remaining to January 20, 2029.`,
        type: "milestone",
        read: 1,
        createdAt: m.notificationSentAt || m.createdAt || new Date(),
      });
    }
  }

  return items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

// Re-export types for convenience
export type {
  EconomicMetric,
  NewsArticle,
  Quote,
  CountdownMilestone,
  ApiStatus,
  NotificationPreference,
};
