import React, { useEffect, useState } from "react";
import { CountdownTimer } from "@/components/CountdownTimer";
import { EconomicMetrics } from "@/components/EconomicMetrics";
import { GovernmentMetrics } from "@/components/GovernmentMetrics";
import { NewsFeed } from "@/components/NewsFeed";
import { TrumpQuote } from "@/components/TrumpQuote";
import { ApiStatus } from "@/components/ApiStatus";
import { NotificationCenter } from "@/components/NotificationCenter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch dashboard data
  const dashboardQuery = trpc.dashboard.getDashboardData.useQuery(undefined, {
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });

  // Fetch news with search
  const newsQuery = trpc.dashboard.getNews.useQuery(
    { limit: 20, searchQuery },
    { refetchInterval: 15 * 60 * 1000 } // Refetch every 15 minutes
  );

  const trpcUtils = trpc.useUtils();
  const quoteRefreshMutation = trpc.dashboard.refreshQuote.useMutation({
    onSuccess: (result) => {
      trpcUtils.dashboard.getDashboardData.setData(undefined, (current) => {
        if (!current) return current;
        return {
          ...current,
          quote: result.quote ?? undefined,
          apiStatus: {
            ...current.apiStatus,
            quotesApi: result.apiStatus,
          },
        };
      });
      if (result.refreshed) {
        toast.success("New verified quote loaded.");
      } else {
        toast.info("The quote source is unavailable; showing the last verified quote.");
      }
    },
    onError: (error) => {
      toast.error(error.message || "Unable to refresh the quote.");
    },
  });

  const handleNewsSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleRefreshQuote = () => {
    quoteRefreshMutation.mutate();
  };

  const isLoading =
    dashboardQuery.isLoading || (searchQuery && newsQuery.isLoading);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      {/* Animated background elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-red-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl" />
      </div>

      {/* Main Content */}
      <div className="relative z-10 container mx-auto px-4 py-8 md:py-12 max-w-7xl">
        {/* Countdown Timer - Full Width */}
        <div className="mb-12">
          <CountdownTimer />
        </div>

        {/* Main Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Economic Metrics and Quote */}
          <div className="lg:col-span-1 space-y-8">
            {/* Economic Metrics */}
            <div>
              <EconomicMetrics
                metrics={dashboardQuery.data?.metrics || {}}
                fredStatus={dashboardQuery.data?.apiStatus?.fred}
                isLoading={dashboardQuery.isLoading}
              />
            </div>

            {/* Government Metrics */}
            <div>
              <GovernmentMetrics
                metrics={dashboardQuery.data?.governmentMetrics || []}
                dataGovStatus={dashboardQuery.data?.apiStatus?.dataGov}
                isLoading={dashboardQuery.isLoading}
              />
            </div>

            {/* Trump Quote */}
            <div>
              <TrumpQuote
                quote={dashboardQuery.data?.quote}
                isLoading={dashboardQuery.isLoading || quoteRefreshMutation.isPending}
                onRefresh={handleRefreshQuote}
              />
            </div>

            {/* API Status */}
            <div>
              <ApiStatus
                fred={dashboardQuery.data?.apiStatus?.fred}
                newsApi={dashboardQuery.data?.apiStatus?.newsApi}
                quotesApi={dashboardQuery.data?.apiStatus?.quotesApi}
                dataGov={dashboardQuery.data?.apiStatus?.dataGov}
              />
            </div>

            {/* Notifications */}
            <div>
              <NotificationCenter
                notifications={dashboardQuery.data?.notifications || []}
                apiStatus={dashboardQuery.data?.apiStatus}
              />
            </div>
          </div>

          {/* Right Column - News Feed */}
          <div className="lg:col-span-2">
            <NewsFeed
              articles={
                searchQuery ? newsQuery.data || [] : dashboardQuery.data?.news || []
              }
              isLoading={isLoading}
              onSearch={handleNewsSearch}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="mt-16 pt-8 border-t border-slate-700/50 text-center text-slate-500 text-sm">
          <p>
            TrumpWatch Dashboard • Real-time data aggregation • Last updated:{" "}
            {new Date().toLocaleTimeString()}
          </p>
          <p className="mt-2 text-xs text-slate-600">
            Data sources: FRED API, NewsAPI, Trump Quotes API, Data.gov
          </p>
        </div>
      </div>
    </div>
  );
}
