/**
 * Dashboard Router
 * Provides tRPC procedures for the TrumpWatch dashboard
 */

import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { publicProcedure, router } from "../_core/trpc";
import {
  createNewsLinkReport,
  getLatestEconomicMetrics,
  getLatestGovernmentMetrics,
  getLatestNewsArticles,
  getNewsArticleById,
  getQuoteByExternalId,
  getRandomQuote,
  getApiStatus,
  getRecentNotifications,
} from "../db";
import { isValidNewsArticleUrl } from "../services/newsUrl";
import { fetchRandomQuote, QUOTES_API_NAME } from "../services/quotesService";
import { calculateCountdown } from "../services/countdownService";

export const dashboardRouter = router({
  /**
   * Get countdown data
   */
  getCountdown: publicProcedure.query(async () => {
    const countdown = calculateCountdown();
    return countdown;
  }),

  /**
   * Get latest economic metrics
   */
  getEconomicMetrics: publicProcedure.query(async () => {
    const metrics = await getLatestEconomicMetrics();

    // Group metrics by series ID for easier frontend consumption
    const grouped: Record<string, (typeof metrics)[0][]> = {};
    for (const metric of metrics) {
      if (!grouped[metric.seriesId]) {
        grouped[metric.seriesId] = [];
      }
      grouped[metric.seriesId].push(metric);
    }

    return grouped;
  }),

  /**
   * Get latest news articles with optional search
   */
  getNews: publicProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(50).default(20),
        searchQuery: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      const articles = await getLatestNewsArticles(input.limit);

      // Filter by search query if provided
      if (input.searchQuery) {
        const query = input.searchQuery.toLowerCase();
        return articles.filter(
          (article) =>
            article.title.toLowerCase().includes(query) ||
            article.description?.toLowerCase().includes(query) ||
            article.summary?.toLowerCase().includes(query)
        );
      }

      return articles;
    }),

  /**
   * Report a news article whose source link is unavailable or incorrect.
   */
  reportBrokenLink: publicProcedure
    .input(
      z.object({
        articleId: z.number().int().positive(),
        articleUrl: z.string().url(),
        comment: z.string().trim().max(1000).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const article = await getNewsArticleById(input.articleId);

      if (!article) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "News article not found.",
        });
      }

      if (
        article.url !== input.articleUrl ||
        !isValidNewsArticleUrl(article.url)
      ) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "The reported article link is not valid.",
        });
      }

      await createNewsLinkReport({
        newsArticleId: article.id,
        articleUrl: article.url,
        comment: input.comment?.trim() || undefined,
        reporterUserId: ctx.user?.id,
        status: "open",
      });

      return { success: true };
    }),

  /**
   * Fetch and return a fresh verified Trump quote from the upstream source.
   */
  refreshQuote: publicProcedure.mutation(async () => {
    const refreshedQuote = await fetchRandomQuote();
    if (refreshedQuote?.externalId) {
      const persistedQuote = await getQuoteByExternalId(refreshedQuote.externalId);
      return {
        quote: persistedQuote ?? null,
        refreshed: Boolean(persistedQuote),
        apiStatus: await getApiStatus(QUOTES_API_NAME),
      };
    }

    // Preserve the existing verified quote when the upstream source is
    // temporarily unavailable, while keeping the failure visible in status.
    return {
      quote: (await getRandomQuote()) ?? null,
      refreshed: false,
      apiStatus: await getApiStatus(QUOTES_API_NAME),
    };
  }),

  /**
   * Get a random cached Trump quote
   */
  getRandomQuote: publicProcedure.query(async () => {
    const quote = await getRandomQuote();
    return quote;
  }),

  /**
   * Get API health status
   */
  getApiStatus: publicProcedure.query(async () => {
    const fredStatus = await getApiStatus("FRED");
    const newsStatus = await getApiStatus("NewsAPI");
    const quoteStatus = await getApiStatus(QUOTES_API_NAME);
    const dataGovStatus = await getApiStatus("DataGov");

    return {
      fred: fredStatus,
      newsApi: newsStatus,
      quotesApi: quoteStatus,
      dataGov: dataGovStatus,
    };
  }),

  /**
   * Get recent notifications and alerts
   */
  getNotifications: publicProcedure.query(async () => {
    return await getRecentNotifications();
  }),

  /**
   * Get full dashboard data (countdown + metrics + news + quote)
   */
  getDashboardData: publicProcedure.query(async () => {
    const [countdown, metrics, governmentMetrics, news, quote, apiStatus, notifications] = await Promise.all([
      Promise.resolve(calculateCountdown()),
      getLatestEconomicMetrics(),
      getLatestGovernmentMetrics(),
      getLatestNewsArticles(10),
      getRandomQuote(),
      Promise.all([
        getApiStatus("FRED"),
        getApiStatus("NewsAPI"),
        getApiStatus(QUOTES_API_NAME),
        getApiStatus("DataGov"),
      ]),
      getRecentNotifications(),
    ]);

    // Group metrics by series ID
    const groupedMetrics: Record<string, (typeof metrics)[0][]> = {};
    for (const metric of metrics) {
      if (!groupedMetrics[metric.seriesId]) {
        groupedMetrics[metric.seriesId] = [];
      }
      groupedMetrics[metric.seriesId].push(metric);
    }

    return {
      countdown,
      metrics: groupedMetrics,
      governmentMetrics,
      news,
      quote,
      notifications,
      apiStatus: {
        fred: apiStatus[0],
        newsApi: apiStatus[1],
        quotesApi: apiStatus[2],
        dataGov: apiStatus[3],
      },
    };
  }),
});
