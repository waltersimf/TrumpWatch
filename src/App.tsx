import React, { useState, useEffect, useCallback } from 'react';
import { DashboardState } from './types';
import { fetchNationalDebt, fetchExecutiveOrdersCount, fetchRandomQuote, fetchLatestTruth } from './services/api';
import Countdown from './components/Countdown';
import StatCard from './components/StatCard';
import QuoteCard from './components/QuoteCard';
import TruthPostComp from './components/TruthPost';
import { DollarSign, FileText, Share2, RefreshCw, AlertTriangle } from 'lucide-react';

const App: React.FC = () => {
  const [state, setState] = useState<DashboardState>({
    debt: null,
    eoCount: null,
    quote: null,
    latestPost: null,
    loading: true,
    error: null
  });

  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const loadData = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const [debtData, eoData, quoteData, truthData] = await Promise.all([
        fetchNationalDebt(),
        fetchExecutiveOrdersCount(),
        fetchRandomQuote(),
        fetchLatestTruth()
      ]);

      setState({
        debt: debtData,
        eoCount: eoData,
        quote: quoteData,
        latestPost: truthData,
        loading: false,
        error: null
      });
      setLastUpdated(new Date());
    } catch (err) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: "Failed to load some data feeds. Please check your connection."
      }));
    }
  }, []);

  const refreshQuote = async () => {
    const newQuote = await fetchRandomQuote();
    setState(prev => ({ ...prev, quote: newQuote }));
  };

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle Share
  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: 'TrumpWatch Dashboard',
        text: `Tracking Day ${state.debt ? '...' : ''} of the presidency. National Debt: $${state.debt?.total_debt.toLocaleString()}`,
        url: window.location.href,
      }).catch(console.error);
    } else {
      alert("Link copied to clipboard!");
      navigator.clipboard.writeText(window.location.href);
    }
  };

  // Helper to format currency
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      notation: 'compact',
      maximumFractionDigits: 2
    }).format(val);
  };

  // Calculate Debt Change
  const debtChange = state.debt ? state.debt.total_debt - state.debt.baseline_debt : 0;
  const debtTrend = debtChange > 0 ? 'up' : debtChange < 0 ? 'down' : 'neutral';
  
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 pb-20 selection:bg-red-500/30">
      {/* Header */}
      <header className="fixed top-0 w-full z-50 bg-slate-900/80 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-600 rounded-full animate-pulse"></div>
            <h1 className="font-bold text-xl tracking-tighter">TRUMP<span className="text-red-500">WATCH</span></h1>
          </div>
          <div className="flex items-center gap-2">
             <button 
              onClick={loadData} 
              className="p-2 hover:bg-white/5 rounded-full transition-colors text-slate-400 hover:text-white"
              title="Refresh Data"
            >
              <RefreshCw size={18} className={state.loading ? 'animate-spin' : ''} />
            </button>
            <button 
              onClick={handleShare}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-1.5 rounded-full text-sm font-semibold transition-colors flex items-center gap-2"
            >
              <Share2 size={14} /> Share
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-24 px-4 max-w-7xl mx-auto space-y-8">
        
        {/* Error Banner */}
        {state.error && (
          <div className="bg-red-900/20 border border-red-900/50 p-4 rounded-lg flex items-center gap-3 text-red-200">
            <AlertTriangle size={20} />
            <p>{state.error}</p>
          </div>
        )}

        {/* Hero Section */}
        <section className="animate-fade-in-up">
          <Countdown />
        </section>

        {/* Stats Grid */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <StatCard 
            title="National Debt"
            icon={DollarSign}
            value={state.debt ? `$${(state.debt.total_debt / 1000000000000).toFixed(3)}T` : "---"}
            subValue={state.debt ? `since Jan 20, 2025` : "Loading..."}
            trendValue={formatCurrency(debtChange)}
            trend={debtTrend}
            subLabel="Total Public Debt Outstanding"
            loading={state.loading}
          />
          
          <StatCard 
            title="Executive Orders"
            icon={FileText}
            value={state.eoCount !== null ? state.eoCount : "---"}
            subValue="Signed in current term"
            subLabel="Source: Federal Register"
            loading={state.loading}
          />

          <div className="lg:row-span-2">
            <QuoteCard 
              quote={state.quote} 
              loading={state.loading} 
              onRefresh={refreshQuote}
            />
          </div>

          <div className="md:col-span-2 lg:col-span-2">
            <TruthPostComp post={state.latestPost} loading={state.loading} />
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 mt-20 py-8 text-center text-slate-500 text-xs">
        <p className="mb-2">Data sources: U.S. Treasury, Federal Register, Truth Social Archive.</p>
        <p>Not affiliated with any political party or campaign. For informational purposes only.</p>
        <p className="mt-4 opacity-50">Last updated: {lastUpdated.toLocaleTimeString()}</p>
      </footer>
    </div>
  );
};

export default App;