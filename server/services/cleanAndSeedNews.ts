/**
 * Clean and Seed News helper using db.ts
 */

import { fetchPoliticalNews } from "./newsService";
import { getLatestNewsArticles, getDb } from "../db";
import { newsArticles } from "../../drizzle/schema";
import dotenv from "dotenv";

dotenv.config();

async function run() {
  console.log("Cleaning news articles via Drizzle DB helper...");
  const db = await getDb();
  if (!db) {
    console.error("Database not available");
    process.exit(1);
  }

  await db.delete(newsArticles);
  console.log("Cleared all articles.");

  console.log("Fetching fresh Trump-related news from NewsAPI...");
  await fetchPoliticalNews();

  const articles = await getLatestNewsArticles(10);
  console.log(`Successfully fetched and stored ${articles.length} Trump-related news articles.`);
  articles.forEach((a, i) => {
    console.log(`${i + 1}. [${a.source}] ${a.title}`);
  });

  process.exit(0);
}

run().catch((err) => {
  console.error("Error running news cleanup & seed:", err);
  process.exit(1);
});
