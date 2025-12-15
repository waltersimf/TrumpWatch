import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle } from 'lucide-react';
import { QuoteData } from '../types';

interface QuoteCarouselProps {
  quotes: QuoteData[];
  currentIndex: number;
  onIndexChange: (index: number) => void;
  loading: boolean;
}

const QuoteCarousel: React.FC<QuoteCarouselProps> = ({
  quotes,
  currentIndex,
  onIndexChange,
  loading
}) => {
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-rotate quotes every 10 seconds
  useEffect(() => {
    if (quotes.length <= 1) return;

    const interval = setInterval(() => {
      onIndexChange((currentIndex + 1) % quotes.length);
    }, 10000);

    return () => clearInterval(interval);
  }, [currentIndex, quotes.length, onIndexChange]);

  // Minimum swipe distance
  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe && currentIndex < quotes.length - 1) {
      onIndexChange(currentIndex + 1);
    } else if (isRightSwipe && currentIndex > 0) {
      onIndexChange(currentIndex - 1);
    } else if (isLeftSwipe && currentIndex === quotes.length - 1) {
      onIndexChange(0);
    } else if (isRightSwipe && currentIndex === 0) {
      onIndexChange(quotes.length - 1);
    }
  };

  const currentQuote = quotes[currentIndex];

  const formatSource = (quote: QuoteData): string => {
    if (quote.source_url) {
        try {
            return new URL(quote.source_url).hostname.replace('www.', '');
        } catch {
            // ignore error
        }
    }
    
    if (quote.appeared_at) {
      const date = new Date(quote.appeared_at);
      return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    }
    return '';
  };

  return (
    <div className="glass-panel rounded-xl p-5 sm:p-6">
      <div className="flex items-center gap-2 mb-4">
        <MessageCircle size={16} className="text-orange-500" />
        <span className="text-slate-400 text-xs uppercase tracking-wider font-semibold">Daily Quote</span>
      </div>

      <div
        ref={containerRef}
        // ВАЖЛИВО: touch-pan-y дозволяє горизонтальні свайпи працювати в JS
        className="quote-carousel touch-pan-y min-h-[120px] select-none"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {loading ? (
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-slate-700 rounded w-full"></div>
            <div className="h-4 bg-slate-700 rounded w-5/6"></div>
            <div className="h-4 bg-slate-700 rounded w-4/6"></div>
          </div>
        ) : currentQuote ? (
          <div className="quote-slide">
            <blockquote className="text-lg sm:text-xl text-slate-200 leading-relaxed mb-4 italic">
              "{currentQuote.value}"
            </blockquote>
            <p className="text-slate-500 text-sm font-medium">
              — Donald J. Trump, <span className="text-slate-600 font-normal">{formatSource(currentQuote)}</span>
            </p>
          </div>
        ) : (
          <p className="text-slate-500">No quotes available</p>
        )}
      </div>

      {quotes.length > 1 && (
        <div className="flex items-center justify-center gap-2 mt-4 pt-4 border-t border-slate-700/50">
          {quotes.map((_, index) => (
            <button
              key={index}
              onClick={() => onIndexChange(index)}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                index === currentIndex ? 'bg-orange-500 w-4' : 'bg-slate-600 hover:bg-slate-500'
              }`}
              aria-label={`Go to quote ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default QuoteCarousel;