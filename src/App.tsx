import React, { useState, useEffect, useCallback } from 'react';
import { DashboardState } from './types';
import {
  fetchNationalDebt,
  fetchExecutiveOrdersCount,
  fetchMultipleQuotes,
  fetchGasPrice,
  fetchSP500,
  fetchUnemployment,
  fetchInflation,
  fetchBitcoin,
  fetchGold
} from './services/api';
import Countdown from './components/Countdown';
import QuoteCarousel from './components/QuoteCarousel';
import LiveTracker from './components/LiveTracker';
import { Share2, AlertTriangle } from 'lucide-react';

// Прибрали імпорт NotificationBanner та Bell

const App: React.FC = () => {
  const [state, setState] = useState<DashboardState>({
    debt: null,
    eoCount: null,
    quotes: [],
    currentQuoteIndex: 0,
    gasPrice: null,
    sp500: null,
    unemployment: null,
    inflation: null,
    bitcoin: null,
    gold: null,
    loading: true,
    error: null,
    latestPost: null
  });

  const loadData = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const results = await Promise.all([
        fetchNationalDebt(),
        fetchExecutiveOrdersCount(),
        fetchMultipleQuotes(7),
        fetchGasPrice(),
        fetchSP500(),
        fetchUnemployment(),
        fetchInflation(),
        fetchBitcoin(),
        fetchGold()
      ]);

      const [
        debtData, 
        eoData, 
        quotesData, 
        gasPriceData, 
        sp500Data, 
        unemploymentData, 
        inflationData, 
        bitcoinData, 
        goldData
      ] = results;

      setState(prev => ({
        ...prev,
        debt: debtData,
        eoCount: eoData,
        quotes: quotesData,
        gasPrice: gasPriceData,
        sp500: sp500Data,
        unemployment: unemploymentData,
        inflation: inflationData,
        bitcoin: bitcoinData,
        gold: goldData,
        loading: false,
        error: null
      }));
    } catch (err) {
      console.error('Failed to load data:', err);
      setState(prev => ({
        ...prev,
        loading: false,
        error: "Failed to load some data feeds. Please check your connection."
      }));
    }
  }, []);

  const handleQuoteIndexChange = useCallback((index: number) => {
    setState(prev => ({ ...prev, currentQuoteIndex: index }));
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleShare = async () => {
    const shareData = {
      title: 'TrumpWatch',
      text: `Tracking Trump's presidency | National Debt: $${state.debt ? (state.debt.total_debt / 1e12).toFixed(1) : '?'}T`,
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.error('Share failed:', err);
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 selection:bg-red-500/30">
      {/* Header with safe area */}
      <header className="sticky top-0 z-50 bg-slate-900/95 backdrop-blur-md border-b border-white/5 pt-safe">
        <div className="px-4 h-14 flex items-center justify-between max-w-lg mx-auto">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-red-600 rounded-lg flex items-center justify-center text-white text-xs font-bold">
              45
            </div>
            <h1 className="font-bold text-lg tracking-tight">
              Trump<span className="text-red-500">Watch</span>
            </h1>
          </div>
          <div className="flex items-center gap-1">
            {/* Notification Button Removed */}
            <button
              onClick={handleShare}
              className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-full transition-colors"
              title="Share"
            >
              <Share2 size={20} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-4 py-6 max-w-lg mx-auto pb-safe">
        {/* Error Banner */}
        {state.error && (
          <div className="bg-red-900/20 border border-red-900/50 p-3 rounded-lg flex items-center gap-3 text-red-200 text-sm mb-6">
            <AlertTriangle size={18} />
            <p>{state.error}</p>
          </div>
        )}

        {/* Countdown Section */}
        <section className="mb-8 animate-fade-in-up">
          <Countdown />
        </section>

        {/* Daily Quote Carousel */}
        <section className="mb-2 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          <QuoteCarousel
            quotes={state.quotes}
            currentIndex={state.currentQuoteIndex}
            onIndexChange={handleQuoteIndexChange}
            loading={state.loading}
          />
        </section>

        {/* Live Tracker Section */}
        <section className="animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          <LiveTracker
            debt={state.debt}
            gasPrice={state.gasPrice}
            eoCount={state.eoCount}
            sp500={state.sp500}
            unemployment={state.unemployment}
            inflation={state.inflation}
            bitcoin={state.bitcoin}
            gold={state.gold}
            loading={state.loading}
          />
        </section>

        {/* Notification Banner Removed */}
      </main>
    </div>
  );
};

export default App;