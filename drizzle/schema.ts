import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Economic metrics cache table for storing FRED API data
 */
export const economicMetrics = mysqlTable("economic_metrics", {
  id: int("id").autoincrement().primaryKey(),
  seriesId: varchar("seriesId", { length: 64 }).notNull(), // e.g., "UNRATE", "CPIAUCSL", "GDPC1"
  seriesName: varchar("seriesName", { length: 255 }).notNull(),
  value: varchar("value", { length: 255 }).notNull(),
  date: varchar("date", { length: 10 }).notNull(), // YYYY-MM-DD format
  unit: varchar("unit", { length: 64 }), // e.g., "Percent", "Billions of Dollars"
  lastUpdated: timestamp("lastUpdated").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type EconomicMetric = typeof economicMetrics.$inferSelect;
export type InsertEconomicMetric = typeof economicMetrics.$inferInsert;

/**
 * News articles cache table
 */
export const newsArticles = mysqlTable("news_articles", {
  id: int("id").autoincrement().primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  content: text("content"),
  url: varchar("url", { length: 2048 }).notNull().unique(),
  imageUrl: varchar("imageUrl", { length: 2048 }),
  source: varchar("source", { length: 255 }).notNull(),
  author: varchar("author", { length: 255 }),
  publishedAt: timestamp("publishedAt"),
  summary: text("summary"), // LLM-generated summary
  summaryGeneratedAt: timestamp("summaryGeneratedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type NewsArticle = typeof newsArticles.$inferSelect;
export type InsertNewsArticle = typeof newsArticles.$inferInsert;

/**
 * User-submitted reports for broken or inaccessible news links.
 */
export const newsLinkReports = mysqlTable("news_link_reports", {
  id: int("id").autoincrement().primaryKey(),
  newsArticleId: int("newsArticleId")
    .notNull()
    .references(() => newsArticles.id),
  articleUrl: varchar("articleUrl", { length: 2048 }).notNull(),
  comment: text("comment"),
  reporterUserId: int("reporterUserId").references(() => users.id),
  status: mysqlEnum("status", ["open", "resolved", "dismissed"])
    .default("open")
    .notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type NewsLinkReport = typeof newsLinkReports.$inferSelect;
export type InsertNewsLinkReport = typeof newsLinkReports.$inferInsert;

/**
 * Trump quotes cache table
 */
export const quotes = mysqlTable("quotes", {
  id: int("id").autoincrement().primaryKey(),
  quoteText: text("quoteText").notNull(),
  source: varchar("source", { length: 255 }),
  date: varchar("date", { length: 10 }), // YYYY-MM-DD format
  externalId: varchar("externalId", { length: 255 }).unique(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Quote = typeof quotes.$inferSelect;
export type InsertQuote = typeof quotes.$inferInsert;

/**
 * Countdown milestones and notifications
 */
export const countdownMilestones = mysqlTable("countdown_milestones", {
  id: int("id").autoincrement().primaryKey(),
  daysRemaining: int("daysRemaining").notNull(), // e.g., 1000, 100, 10, 1
  notificationSent: int("notificationSent").default(0).notNull(), // 0 = false, 1 = true
  notificationSentAt: timestamp("notificationSentAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CountdownMilestone = typeof countdownMilestones.$inferSelect;
export type InsertCountdownMilestone = typeof countdownMilestones.$inferInsert;

/**
 * Government data cache table for tracking Data.gov federal metrics
 */
export const governmentMetrics = mysqlTable("government_metrics", {
  id: int("id").autoincrement().primaryKey(),
  metricKey: varchar("metricKey", { length: 64 }).notNull().unique(), // e.g., "FEDERAL_DEBT", "POPULATION", "MILITARY_SPENDING"
  metricName: varchar("metricName", { length: 255 }).notNull(),
  value: varchar("value", { length: 255 }).notNull(),
  date: varchar("date", { length: 10 }).notNull(), // YYYY-MM-DD format
  unit: varchar("unit", { length: 64 }), // e.g., "Trillions of Dollars", "Millions"
  sourceUrl: varchar("sourceUrl", { length: 2048 }),
  lastUpdated: timestamp("lastUpdated").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type GovernmentMetric = typeof governmentMetrics.$inferSelect;
export type InsertGovernmentMetric = typeof governmentMetrics.$inferInsert;

/**
 * API status and error tracking
 */
export const apiStatus = mysqlTable("api_status", {
  id: int("id").autoincrement().primaryKey(),
  apiName: varchar("apiName", { length: 64 }).notNull(), // e.g., "FRED", "NewsAPI", "TrumpQuotesAPI"
  status: mysqlEnum("status", ["healthy", "degraded", "failed"]).default("healthy").notNull(),
  lastSuccessfulFetch: timestamp("lastSuccessfulFetch"),
  lastFailedFetch: timestamp("lastFailedFetch"),
  errorMessage: text("errorMessage"),
  consecutiveFailures: int("consecutiveFailures").default(0).notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ApiStatus = typeof apiStatus.$inferSelect;
export type InsertApiStatus = typeof apiStatus.$inferInsert;

/**
 * User notification preferences
 */
export const notificationPreferences = mysqlTable("notification_preferences", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  enableMilestoneNotifications: int("enableMilestoneNotifications").default(1).notNull(), // 0 = false, 1 = true
  enableApiFailureNotifications: int("enableApiFailureNotifications").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type NotificationPreference = typeof notificationPreferences.$inferSelect;
export type InsertNotificationPreference = typeof notificationPreferences.$inferInsert;
