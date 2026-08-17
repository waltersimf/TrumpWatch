import React from "react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface GovernmentMetricData {
  id: number;
  metricKey: string;
  metricName: string;
  value: string;
  date: string;
  unit: string | null;
  sourceUrl: string | null;
  lastUpdated: Date;
}

interface GovernmentMetricsProps {
  metrics: GovernmentMetricData[];
  dataGovStatus?: {
    status?: "healthy" | "degraded" | "failed";
    errorMessage?: string | null;
  } | null;
  isLoading: boolean;
}

export function GovernmentMetrics({
  metrics,
  dataGovStatus,
  isLoading,
}: GovernmentMetricsProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-white mb-6">Government Open Data</h2>
      <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-1">
        {isLoading || metrics.length === 0 ? (
          <>
            <Card className="p-4 bg-slate-800/50 border-slate-700">
              <Skeleton className="h-6 w-32 bg-slate-700 mb-3" />
              <Skeleton className="h-8 w-24 bg-slate-700 mb-2" />
              <Skeleton className="h-4 w-20 bg-slate-700" />
            </Card>
            <Card className="p-4 bg-slate-800/50 border-slate-700">
              <Skeleton className="h-6 w-32 bg-slate-700 mb-3" />
              <Skeleton className="h-8 w-24 bg-slate-700 mb-2" />
              <Skeleton className="h-4 w-20 bg-slate-700" />
            </Card>
          </>
        ) : (
          metrics.map((metric) => (
            <Card
              key={metric.metricKey}
              className="min-w-0 overflow-hidden bg-slate-800/50 border-slate-700 hover:border-slate-600 transition-colors p-4"
            >
              <div className="space-y-3">
                <p className="min-h-10 text-slate-300 text-sm font-medium leading-snug break-words">
                  {metric.metricName}
                </p>
                <div className="flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-1">
                  <span className="min-w-0 break-all text-2xl font-bold leading-none tracking-tight tabular-nums text-sky-400">
                    {metric.value}
                  </span>
                  {metric.unit && (
                    <span className="min-w-0 max-w-full break-words text-xs leading-snug text-slate-500">
                      {metric.unit}
                    </span>
                  )}
                </div>
                <div className="space-y-1 text-xs leading-snug">
                  <p className="text-slate-400">
                    Source data: {new Date(metric.date).toLocaleDateString()}
                  </p>
                  {metric.sourceUrl && (
                    <a
                      href={metric.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sky-400 hover:underline block truncate"
                    >
                      View official source ↗
                    </a>
                  )}
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      <div className="text-slate-500 text-xs mt-4 p-3 bg-slate-900/50 rounded border border-slate-700">
        <p>Federal open data provided by Data.gov / US Treasury Fiscal Data.</p>
        {dataGovStatus?.status === "failed" && (
          <p className="mt-2 text-amber-300" role="status">
            Data.gov sync encountered issues; showing cached public records.
          </p>
        )}
      </div>
    </div>
  );
}
