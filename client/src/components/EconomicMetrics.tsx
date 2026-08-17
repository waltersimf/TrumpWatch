import React from "react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatMetricValue } from "@shared/metricFormatting";

interface MetricData {
  id: number;
  seriesId: string;
  seriesName: string;
  value: string;
  date: string;
  unit: string | null;
  lastUpdated: Date;
}

interface EconomicMetricsProps {
  metrics: Record<string, MetricData[]>;
  fredStatus?: {
    status?: "healthy" | "degraded" | "failed";
    errorMessage?: string | null;
    lastSuccessfulFetch?: Date | string | null;
  } | null;
  isLoading: boolean | string;
}

export function EconomicMetrics({ metrics, fredStatus, isLoading }: EconomicMetricsProps) {
  const getLatestValue = (seriesData: MetricData[] | undefined) => {
    if (!seriesData || seriesData.length === 0) return null;
    return seriesData[seriesData.length - 1];
  };

  const displayMetrics = [
    { key: "UNRATE", label: "Unemployment Rate", color: "text-red-500" },
    { key: "CPIAUCSL", label: "Consumer Price Index", color: "text-blue-500" },
    { key: "GDPC1", label: "Real GDP", color: "text-green-500" },
    { key: "DGS10", label: "10-Year Treasury Yield", color: "text-yellow-500" },
  ];

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-white mb-6">Economic Metrics</h2>
      <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-1">
        {displayMetrics.map(({ key, label, color }) => {
          const data = getLatestValue(metrics[key]);

          return (
            <Card
              key={key}
              className="min-w-0 overflow-hidden bg-slate-800/50 border-slate-700 hover:border-slate-600 transition-colors p-4"
            >
              <div className="space-y-3">
                <p className="min-h-10 text-slate-300 text-sm font-medium leading-snug break-words">{label}</p>

                {isLoading || !data ? (
                  <>
                    <Skeleton className="h-8 w-24 max-w-full bg-slate-700" />
                    <Skeleton className="h-4 w-20 max-w-full bg-slate-700" />
                  </>
                ) : (
                  <>
                    <div className="flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-1">
                      <span className={`min-w-0 break-all text-2xl font-bold leading-none tracking-tight tabular-nums ${color}`}>
                        {formatMetricValue(data.value)}
                      </span>
                      {data.unit && (
                        <span className="min-w-0 max-w-full break-words text-xs leading-snug text-slate-500">
                          {data.unit}
                        </span>
                      )}
                    </div>
                    <div className="space-y-1 text-xs leading-snug">
                      <p className="text-slate-400">
                        Source observation: {new Date(data.date).toLocaleDateString()}
                      </p>
                      <p className="text-slate-500">
                        Cache refreshed: {new Date(data.lastUpdated).toLocaleDateString()}
                      </p>
                    </div>
                  </>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {/* Data Source Info */}
      <div className="text-slate-500 text-xs mt-4 p-3 bg-slate-900/50 rounded border border-slate-700">
        <p>Data provided by Federal Reserve Economic Data (FRED).</p>
        <p className="mt-1">Source observations update on FRED's release schedule; the cache attempts a refresh every 5 minutes.</p>
        {fredStatus?.status === "failed" && (
          <p className="mt-2 text-amber-300" role="status">
            Live FRED refresh failed; values shown above are cached. {fredStatus.errorMessage ?? "Try again later."}
          </p>
        )}
        {fredStatus?.status === "degraded" && (
          <p className="mt-2 text-amber-300" role="status">
            FRED refreshed only some indicators; remaining values may be cached.
          </p>
        )}
      </div>
    </div>
  );
}
