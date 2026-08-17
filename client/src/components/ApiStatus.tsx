import { Card } from "@/components/ui/card";
import React from "react";
import { CheckCircle, AlertCircle, XCircle } from "lucide-react";

interface ApiStatusData {
  apiName: string;
  status: "healthy" | "degraded" | "failed";
  lastSuccessfulFetch: Date | null;
  lastFailedFetch: Date | null;
  errorMessage: string | null;
}

interface ApiStatusProps {
  fred: ApiStatusData | null | undefined;
  newsApi: ApiStatusData | null | undefined;
  quotesApi: ApiStatusData | null | undefined;
  dataGov?: ApiStatusData | null | undefined;
}

export function ApiStatus({ fred, newsApi, quotesApi, dataGov }: ApiStatusProps) {
  const getStatusIcon = (status: string | undefined) => {
    switch (status) {
      case "healthy":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "degraded":
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      case "failed":
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <AlertCircle className="h-5 w-5 text-slate-500" />;
    }
  };

  const getStatusColor = (status: string | undefined) => {
    switch (status) {
      case "healthy":
        return "text-green-400";
      case "degraded":
        return "text-yellow-400";
      case "failed":
        return "text-red-400";
      default:
        return "text-slate-400";
    }
  };

  const apis = [
    { name: "FRED API", data: fred },
    { name: "NewsAPI", data: newsApi },
    { name: "Trump Quotes API", data: quotesApi },
    { name: "Data.gov API", data: dataGov },
  ];

  return (
    <Card className="bg-slate-800/50 border-slate-700 p-4">
      <h3 className="text-sm font-semibold text-white mb-3">API Status</h3>
      <div className="space-y-2">
        {apis.map(({ name, data }) => (
          <div
            key={name}
            className="flex items-center justify-between text-sm py-2 px-3 bg-slate-900/50 rounded border border-slate-700/50"
          >
            <div className="flex items-center gap-2">
              {getStatusIcon(data?.status)}
              <span className="text-slate-300">{name}</span>
            </div>
            <span className={`text-xs font-semibold ${getStatusColor(data?.status)}`}>
              {data?.status || "unknown"}
            </span>
          </div>
        ))}
      </div>
      <p className="text-xs text-slate-500 mt-3">
        All services auto-refresh periodically. Check back if status shows
        degraded.
      </p>
    </Card>
  );
}
