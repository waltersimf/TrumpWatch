import { useState } from "react";
import React from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { ExternalLink, Flag, Search } from "lucide-react";
import { toast } from "sonner";

interface NewsArticle {
  id: number;
  title: string;
  description: string | null;
  content: string | null;
  url: string;
  imageUrl: string | null;
  source: string;
  author: string | null;
  publishedAt: Date | null;
  summary: string | null;
}

interface NewsFeedProps {
  articles: NewsArticle[];
  isLoading: boolean | string;
  onSearch: (query: string) => void;
}

function isSafeExternalUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    const hostname = parsed.hostname.toLowerCase().replace(/^www\./, "");
    const isPlaceholderHost = [
      "example.com",
      "example.org",
      "example.net",
      "localhost",
      "invalid",
      "test",
      "removed.com",
    ].includes(hostname);
    const isPlaceholderSuffix = [".localhost", ".invalid", ".test"].some((suffix) =>
      hostname.endsWith(suffix)
    );

    return (
      (parsed.protocol === "https:" || parsed.protocol === "http:") &&
      Boolean(parsed.hostname && parsed.pathname) &&
      !isPlaceholderHost &&
      !isPlaceholderSuffix &&
      !["127.0.0.1", "0.0.0.0", "::1"].includes(hostname)
    );
  } catch {
    return false;
  }
}

export function NewsFeed({ articles, isLoading, onSearch }: NewsFeedProps) {
  const visibleArticles = articles.filter((article) => isSafeExternalUrl(article.url));
  const [searchQuery, setSearchQuery] = useState("");
  const [reportArticle, setReportArticle] = useState<NewsArticle | null>(null);
  const [reportComment, setReportComment] = useState("");
  const reportMutation = trpc.dashboard.reportBrokenLink.useMutation({
    onSuccess: () => {
      toast.success("Дякуємо! Ми перевіримо це посилання.");
      setReportArticle(null);
      setReportComment("");
    },
    onError: (error) => {
      toast.error(error.message || "Не вдалося надіслати повідомлення.");
    },
  });

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    onSearch(value);
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-white mb-6">Political News</h2>

      {/* Search Bar */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-3 h-5 w-5 text-slate-500" />
        <Input
          placeholder="Search news articles..."
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          className="pl-10 bg-slate-800 border-slate-700 text-white placeholder-slate-500"
        />
      </div>

      {/* News Articles */}
      <div className="space-y-4">
        {isLoading ? (
          // Loading Skeletons
          Array.from({ length: 5 }).map((_, i) => (
            <Card
              key={i}
              className="bg-slate-800/50 border-slate-700 p-4 space-y-3"
            >
              <Skeleton className="h-6 w-3/4 bg-slate-700" />
              <Skeleton className="h-4 w-full bg-slate-700" />
              <Skeleton className="h-4 w-2/3 bg-slate-700" />
            </Card>
          ))
        ) : visibleArticles.length === 0 ? (
          <Card className="bg-slate-800/50 border-slate-700 p-8 text-center">
            <p className="text-slate-400">No articles found</p>
          </Card>
        ) : (
          visibleArticles.map((article) => (
            <Card
              key={article.id}
              className="bg-slate-800/50 border-slate-700 hover:border-slate-600 transition-colors overflow-hidden"
            >
              <div className="p-4 space-y-3">
                {/* Header */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-white leading-tight mb-2 line-clamp-2">
                      {article.title}
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-slate-400 flex-wrap">
                      <span className="px-2 py-1 bg-red-500/20 text-red-400 rounded">
                        {article.source}
                      </span>
                      {article.author && (
                        <span className="text-slate-500">by {article.author}</span>
                      )}
                      {article.publishedAt && (
                        <span className="text-slate-500">
                          {new Date(article.publishedAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                  <a
                    href={article.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Open ${article.source} article: ${article.title}`}
                    className="flex-shrink-0 text-blue-500 hover:text-blue-400 transition-colors"
                  >
                    <ExternalLink className="h-5 w-5" />
                  </a>
                </div>

                {/* Summary or Description */}
                {article.summary ? (
                  <div className="bg-slate-900/50 border-l-2 border-blue-500 p-3 rounded">
                    <p className="text-sm text-slate-300 italic">
                      <span className="text-blue-400 font-semibold">
                        AI Summary:{" "}
                      </span>
                      {article.summary}
                    </p>
                  </div>
                ) : article.description ? (
                  <p className="text-sm text-slate-300 line-clamp-2">
                    {article.description}
                  </p>
                ) : null}

                <div className="flex items-center justify-end border-t border-slate-700/60 pt-3">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 gap-2 text-xs text-slate-400 hover:bg-red-500/10 hover:text-red-300"
                    onClick={() => {
                      setReportArticle(article);
                      setReportComment("");
                    }}
                  >
                    <Flag className="h-3.5 w-3.5" />
                    Report broken link
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      <Dialog
        open={Boolean(reportArticle)}
        onOpenChange={(open) => {
          if (!open && !reportMutation.isPending) {
            setReportArticle(null);
            setReportComment("");
          }
        }}
      >
        <DialogContent className="border-slate-700 bg-slate-900 text-white">
          <DialogHeader>
            <DialogTitle>Report a broken link</DialogTitle>
            <DialogDescription className="text-slate-400">
              Tell us what went wrong with this article link. Your report will
              be saved for review.
            </DialogDescription>
          </DialogHeader>

          {reportArticle && (
            <div className="space-y-3">
              <div className="rounded border border-slate-700 bg-slate-950/60 p-3">
                <p className="text-sm font-semibold text-slate-200 line-clamp-2">
                  {reportArticle.title}
                </p>
                <p className="mt-1 break-all text-xs text-slate-500">
                  {reportArticle.url}
                </p>
              </div>
              <Textarea
                value={reportComment}
                onChange={(event) => setReportComment(event.target.value)}
                maxLength={1000}
                placeholder="Optional: describe the problem (404, paywall, wrong article, etc.)"
                className="min-h-24 border-slate-700 bg-slate-950/60 text-white placeholder:text-slate-500"
              />
              <p className="text-right text-xs text-slate-500">
                {reportComment.length}/1000
              </p>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              className="border-slate-700 text-slate-300"
              disabled={reportMutation.isPending}
              onClick={() => {
                setReportArticle(null);
                setReportComment("");
              }}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="bg-red-600 text-white hover:bg-red-500"
              disabled={!reportArticle || reportMutation.isPending}
              onClick={() => {
                if (!reportArticle) return;
                reportMutation.mutate({
                  articleId: reportArticle.id,
                  articleUrl: reportArticle.url,
                  comment: reportComment.trim() || undefined,
                });
              }}
            >
              {reportMutation.isPending ? "Sending..." : "Send report"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Data Source Info */}
      <div className="text-slate-500 text-xs mt-4 p-3 bg-slate-900/50 rounded border border-slate-700">
        News provided by NewsAPI. Updates every 15 minutes. AI summaries
        generated automatically.
      </div>
    </div>
  );
}
