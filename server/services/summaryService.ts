/**
 * LLM Summary Service
 * Generates concise summaries of news articles using the LLM API
 */

import { getLatestNewsArticles, updateArticleSummary } from "../db";
import { invokeLLM } from "../_core/llm";

/**
 * Generate summary for a single article
 */
export async function generateArticleSummary(
  articleId: number,
  title: string,
  content: string
): Promise<string | null> {
  try {
    if (!content || content.length === 0) {
      return null;
    }

    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content:
            "You are a concise news summarizer. Generate a brief 2-3 sentence summary of the article that captures the key points. Be objective and factual.",
        },
        {
          role: "user",
          content: `Title: ${title}\n\nContent: ${content.substring(0, 1000)}`,
        },
      ],
    });

    if (
      response.choices &&
      response.choices.length > 0 &&
      response.choices[0].message.content
    ) {
      const content = response.choices[0].message.content;
      const summary = typeof content === 'string' ? content : '';
      if (summary) {
        await updateArticleSummary(articleId, summary);
        return summary;
      }
    }

    return null;
  } catch (error) {
    console.error("[Summary] Error generating summary for article", articleId, error);
    return null;
  }
}

/**
 * Generate summaries for recent articles without summaries
 */
export async function generateMissingSummaries(): Promise<void> {
  try {
    const articles = await getLatestNewsArticles(50);

    for (const article of articles) {
      // Skip if summary already exists
      if (article.summary) {
        continue;
      }

      // Skip if no content
      if (!article.content) {
        continue;
      }

      // Generate summary
      await generateArticleSummary(article.id, article.title, article.content);

      // Add a small delay to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  } catch (error) {
    console.error("[Summary] Error generating missing summaries:", error);
  }
}

/**
 * Schedule periodic summary generation
 * Runs every 30 minutes
 */
export function scheduleSummaryGeneration(): void {
  // Initial generation
  generateMissingSummaries().catch((error) =>
    console.error("[Summary] Initial generation failed:", error)
  );

  // Schedule periodic updates (30 minutes)
  setInterval(() => {
    generateMissingSummaries().catch((error) =>
      console.error("[Summary] Scheduled generation failed:", error)
    );
  }, 30 * 60 * 1000);
}
