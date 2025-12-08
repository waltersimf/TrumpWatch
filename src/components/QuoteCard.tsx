import React from 'react';
import { QuoteData } from '../types';
import { Quote, RefreshCw, ExternalLink } from 'lucide-react';

interface QuoteCardProps {
  quote: QuoteData | null;
  loading: boolean;
  onRefresh: () => void;
}

const QuoteCard: React.FC<QuoteCardProps> = ({ quote, loading, onRefresh }) => {
  return (
    <div className="glass-panel p-8 rounded-xl relative flex flex-col justify-between min-h-[250px] border-l-4 border-l-red-600">
      <div className="absolute top-4 right-4">
        <button 
          onClick={onRefresh}
          disabled={loading}
          className="p-2 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-full transition-all disabled:opacity-50"
          aria-label="New Quote"
        >
          <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      <div className="mb-6">
        <Quote className="text-red-600 mb-4 opacity-50" size={32} />
        {loading || !quote ? (
          <div className="animate-pulse space-y-2">
            <div className="h-4 bg-slate-700 rounded w-full"></div>
            <div className="h-4 bg-slate-700 rounded w-5/6"></div>
            <div className="h-4 bg-slate-700 rounded w-4/6"></div>
          </div>
        ) : (
          <blockquote className="text-lg md:text-xl font-light text-slate-200 italic leading-relaxed">
            "{quote.value}"
          </blockquote>
        )}
      </div>

      {!loading && quote && (
        <div className="flex justify-between items-end border-t border-slate-700 pt-4 mt-auto">
          <div>
            <div className="text-sm font-bold text-white">Donald J. Trump</div>
            <div className="text-xs text-slate-500">
              {new Date(quote.appeared_at).toLocaleDateString(undefined, {
                year: 'numeric', month: 'long', day: 'numeric'
              })}
            </div>
          </div>
          {quote.source_url && (
            <a 
              href={quote.source_url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1 transition-colors"
            >
              Source <ExternalLink size={10} />
            </a>
          )}
        </div>
      )}
    </div>
  );
};

export default QuoteCard;