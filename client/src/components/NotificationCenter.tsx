import React from "react";
import { Card } from "@/components/ui/card";
import { Bell, CheckCircle, AlertTriangle, ShieldAlert } from "lucide-react";

interface NotificationItem {
  id: number;
  title: string;
  message: string;
  type?: string;
  read: number;
  createdAt: Date | string;
}

interface NotificationCenterProps {
  notifications?: NotificationItem[];
  apiStatus?: {
    fred?: { status: string; errorMessage?: string | null } | null;
    newsApi?: { status: string; errorMessage?: string | null } | null;
    quotesApi?: { status: string; errorMessage?: string | null } | null;
    dataGov?: { status: string; errorMessage?: string | null } | null;
  } | null;
}

export function NotificationCenter({
  notifications = [],
  apiStatus,
}: NotificationCenterProps) {
  const degradedOrFailedApis = Object.entries(apiStatus || {}).filter(
    ([_, st]) => st && st.status && st.status !== "healthy"
  );

  return (
    <Card className="bg-slate-800/50 border-slate-700 p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-sky-400" />
          <h3 className="text-sm font-semibold text-white">Notifications & Alerts</h3>
        </div>
        <span className="text-xs bg-slate-700 text-slate-300 px-2 py-0.5 rounded-full">
          {notifications.length + degradedOrFailedApis.length} active
        </span>
      </div>

      <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
        {degradedOrFailedApis.map(([name, st]) => (
          <div
            key={name}
            className="flex items-start gap-2.5 p-2.5 bg-red-950/30 border border-red-900/50 rounded text-xs"
            role="status"
          >
            <ShieldAlert className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-red-200 capitalize">
                {name} Service Alert
              </p>
              <p className="text-slate-300 mt-0.5">
                Status is <span className="font-medium uppercase">{st?.status}</span>
                {st?.errorMessage ? `: ${st.errorMessage}` : ""}
              </p>
            </div>
          </div>
        ))}

        {notifications.length === 0 && degradedOrFailedApis.length === 0 && (
          <div className="flex items-center gap-2 p-3 bg-slate-900/50 border border-slate-700/50 rounded text-xs text-slate-400">
            <CheckCircle className="h-4 w-4 text-green-400 shrink-0" />
            <p>All countdown milestones and API feeds are operating normally.</p>
          </div>
        )}

        {notifications.map((n) => (
          <div
            key={n.id}
            className="flex items-start gap-2.5 p-2.5 bg-slate-900/50 border border-slate-700/50 rounded text-xs"
          >
            <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-slate-200">{n.title}</p>
              <p className="text-slate-300 mt-0.5">{n.message}</p>
              <span className="text-[10px] text-slate-500 mt-1 block">
                {new Date(n.createdAt).toLocaleString()}
              </span>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
