import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Copy, Check, Quote, RefreshCw } from "lucide-react";
import { copyTextToClipboard } from "@/lib/clipboard";

interface Quote {
  id: number;
  quoteText: string;
  source: string | null;
  date: string | null;
  externalId: string | null;
  createdAt: Date;
}

interface TrumpQuoteProps {
  quote: Quote | null | undefined;
  isLoading: boolean | string;
  onRefresh: () => void;
}

export function TrumpQuote({ quote, isLoading, onRefresh }: TrumpQuoteProps) {
  const [displayQuote, setDisplayQuote] = useState<Quote | null>(null);
  const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">("idle");

  useEffect(() => {
    setDisplayQuote(quote ?? null);
    setCopyState("idle");
  }, [quote]);

  const handleCopy = async () => {
    if (!displayQuote) return;
    const copied = await copyTextToClipboard(displayQuote.quoteText);
    setCopyState(copied ? "copied" : "failed");
  };

  return (
    <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-blue-500/30 p-6 md:p-8">
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Quote className="h-6 w-6 text-blue-500" />
          <h2 className="text-2xl font-bold text-white">Trump Quote</h2>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-24 w-full bg-slate-700" />
            <Skeleton className="h-4 w-1/3 bg-slate-700" />
          </div>
        ) : displayQuote ? (
          <>
            <blockquote className="border-l-4 border-blue-500 pl-4 py-2">
              <p className="text-lg md:text-xl text-white italic leading-relaxed">
                "{displayQuote.quoteText}"
              </p>
            </blockquote>

            <div className="flex flex-col gap-4 text-sm text-slate-400 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-1">
                {displayQuote.source && (
                  <p>
                    <span className="text-slate-500">Source:</span>{" "}
                    {displayQuote.source}
                  </p>
                )}
                {displayQuote.date && (
                  <p>
                    <span className="text-slate-500">Date:</span>{" "}
                    {new Date(displayQuote.date).toLocaleDateString()}
                  </p>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  onClick={handleCopy}
                  disabled={Boolean(isLoading)}
                  variant="outline"
                  size="sm"
                  aria-label="Copy quote"
                  className="border-blue-500/30 text-blue-400 hover:bg-blue-500/10"
                >
                  {copyState === "copied" ? (
                    <Check className="h-4 w-4 mr-2" />
                  ) : (
                    <Copy className="h-4 w-4 mr-2" />
                  )}
                  {copyState === "copied"
                    ? "Copied"
                    : copyState === "failed"
                      ? "Copy failed"
                      : "Copy"}
                </Button>
                <Button
                  onClick={onRefresh}
                  disabled={Boolean(isLoading)}
                  variant="outline"
                  size="sm"
                  className="border-blue-500/30 text-blue-400 hover:bg-blue-500/10"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  New Quote
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-8">
            <div className="space-y-4">
              <div className="space-y-2">
                <p className="text-slate-300 font-medium">Verified quote unavailable</p>
                <p className="text-sm leading-relaxed text-slate-500">
                  The Trump Quotes API is currently unavailable and no verified quote is cached.
                  Try again to request a fresh quote.
                </p>
              </div>
              <Button
                onClick={onRefresh}
                disabled={Boolean(isLoading)}
                variant="outline"
                size="sm"
                className="border-blue-500/30 text-blue-400 hover:bg-blue-500/10"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                {isLoading ? "Refreshing..." : "Try again"}
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Data Source Info */}
      <div className="text-slate-500 text-xs mt-6 p-3 bg-slate-900/50 rounded border border-slate-700">
        Quotes provided by the What Does Trump Think API. Updates every 30 minutes.
      </div>
    </Card>
  );
}
