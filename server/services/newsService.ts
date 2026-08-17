/**
 * NewsAPI Service
 * Fetches political news articles and caches them in the database
 */

import { isTrumpRelatedNewsArticle, upsertNewsArticle, updateApiStatus } from "../db";
import type { InsertNewsArticle } from "../../drizzle/schema";
import { isValidNewsArticleUrl } from "./newsUrl";

const NEWS_API_BASE_URL = "https://newsapi.org/v2";
const NEWS_API_KEY = process.env.NEWS_API_KEY;

interface NewsArticleData {
  source: { id: string | null; name: string };
  author: string | null;
  title: string;
  description: string | null;
  url: string;
  urlToImage: string | null;
  publishedAt: string;
  content: string | null;
}

interface NewsApiResponse {
  status: string;
  totalResults: number;
  articles: NewsArticleData[];
}

export async function fetchPoliticalNews(): Promise<void> {
  if (!NEWS_API_KEY) {
    console.warn("[NewsAPI] API key not configured");
    await updateApiStatus("NewsAPI", "failed", "API key not configured");
    return;
  }

  try {
    const response = await fetch(
      `${NEWS_API_BASE_URL}/everything?q=Donald+Trump+OR+President+Trump&sortBy=publishedAt&language=en&apiKey=${NEWS_API_KEY}&pageSize=30`
    );

    if (!response.ok) {
      throw new Error(`NewsAPI error: ${response.statusText}`);
    }

    const data = (await response.json()) as NewsApiResponse;

    if (data.articles && Array.isArray(data.articles)) {
      for (const article of data.articles) {
        // Ensure article is specifically about Trump and points to a real source.
        if (
          isTrumpRelatedNewsArticle({
            title: article.title || "",
            description: article.description,
          }) &&
          isValidNewsArticleUrl(article.url)
        ) {
          const newsArticle: InsertNewsArticle = {
            title: article.title,
            description: article.description || undefined,
            content: article.content || undefined,
            url: article.url,
            imageUrl: article.urlToImage || undefined,
            source: article.source.name,
            author: article.author || undefined,
            publishedAt: new Date(article.publishedAt),
          };

          await upsertNewsArticle(newsArticle);
        }
      }
    }

    await updateApiStatus("NewsAPI", "healthy");
  } catch (error) {
    console.error("[NewsAPI] Service error:", error);
    await updateApiStatus(
      "NewsAPI",
      "failed",
      error instanceof Error ? error.message : "Unknown error"
    );
  }
}

/**
 * Schedule periodic news fetches
 * Runs every 15 minutes
 */
export function scheduleNewsUpdates(): void {
  // Initial fetch
  fetchPoliticalNews().catch((error) =>
    console.error("[NewsAPI] Initial fetch failed:", error)
  );

  // Schedule periodic updates (15 minutes)
  setInterval(() => {
    fetchPoliticalNews().catch((error) =>
      console.error("[NewsAPI] Scheduled fetch failed:", error)
    );
  }, 15 * 60 * 1000);
}
