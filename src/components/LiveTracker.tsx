import React from 'react';
import { DollarSign, TrendingUp, Zap, BarChart3, Users, Percent, Bitcoin, CircleDollarSign } from 'lucide-react';
import { DebtData, GasPriceData, SP500Data, UnemploymentData, InflationData, BitcoinData, GoldData } from '../types';

interface LiveTrackerProps {
  debt: DebtData | null;
  gasPrice: GasPriceData | null;
  eoCount: number | null;
  sp500: SP500Data | null;
  unemployment: UnemploymentData | null;
  inflation: InflationData | null;
  bitcoin: BitcoinData | null;
  gold: GoldData | null;
  loading: boolean;
}

interface StatItemProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  subValue: string;
  color: string;
  loading?: boolean;
}

const StatItem: React.FC<StatItemProps> = ({ icon, label, value, subValue, color, loading }) => (
  <div className="stat-card">
    <div className="flex items-center gap-2 mb-3">
      <span className={color}>{icon}</span>
      <span className="text-slate-400 text-xs uppercase tracking-wider font-medium">{label}</span>
    </div>
    {loading ? (
      <div className="animate-pulse">
        <div className="h-8 bg-slate-700 rounded w-24 mb-2"></div>
        <div className="h-3 bg-slate-800 rounded w-20"></div>
      </div>
    ) : (
      <>
        <div className={`text-2xl sm:text-3xl font-bold font-mono ${color}`}>
          {value}
        </div>
        <div className="text-slate-500 text-xs mt-1">
          {subValue}
        </div>
      </>
    )}
  </div>
);

const LiveTracker: React.FC<LiveTrackerProps> = ({
  debt,
  gasPrice,
  eoCount,
  sp500,
  unemployment,
  inflation,
  bitcoin,
  gold,
  loading
}) => {
  // Format debt
  const formatDebt = (val: number): string => {
    return `$${(val / 1e12).toFixed(1)}T`;
  };

  // Calculate debt change
  const debtChange = debt ? debt.total_debt - debt.baseline_debt : 0;
  const formatDebtChange = (val: number): string => {
    const prefix = val >= 0 ? '+' : '';
    return `${prefix}$${(val / 1e12).toFixed(1)}T since Jan 20`;
  };

  // Format gas price change
  const gasPriceChange = gasPrice ? gasPrice.price - gasPrice.baseline_price : 0;
  const formatGasChange = (val: number): string => {
    const prefix = val >= 0 ? '+' : '';
    return `${prefix}$${val.toFixed(2)} since Jan 20`;
  };

  // Format S&P 500
  const formatSP500Change = (data: SP500Data | null): string => {
    if (!data) return 'Loading...';
    const prefix = data.changePercent >= 0 ? '+' : '';
    return `${prefix}${data.changePercent.toFixed(2)}% today`;
  };

  // Format Bitcoin change
  const formatBtcChange = (data: BitcoinData | null): string => {
    if (!data) return 'Loading...';
    const prefix = data.change24h >= 0 ? '+' : '';
    return `${prefix}${data.change24h.toFixed(1)}% 24h`;
  };

  return (
    <section className="mt-8">
      {/* Section header */}
      <div className="flex items-center gap-2 mb-4">
        <BarChart3 size={18} className="text-slate-400" />
        <h3 className="text-white font-semibold">Live Tracker</h3>
      </div>

      {/* Stats grid - 2 columns x 4 rows */}
      <div className="grid grid-cols-2 gap-3">
        {/* National Debt */}
        <StatItem
          icon={<DollarSign size={16} />}
          label="National Debt"
          value={debt ? formatDebt(debt.total_debt) : '---'}
          subValue={debt ? formatDebtChange(debtChange) : 'Loading...'}
          color="text-red-500"
          loading={loading}
        />

        {/* Gas Price */}
        <StatItem
          icon={<TrendingUp size={16} />}
          label="Gas Price (Avg)"
          value={gasPrice ? `$${gasPrice.price.toFixed(2)}` : '---'}
          subValue={gasPrice ? formatGasChange(gasPriceChange) : 'Loading...'}
          color="text-green-500"
          loading={loading}
        />

        {/* Executive Orders */}
        <StatItem
          icon={<Zap size={16} />}
          label="Executive Orders"
          value={eoCount !== null ? eoCount.toString() : '---'}
          subValue="Signed to date"
          color="text-yellow-500"
          loading={loading}
        />

        {/* S&P 500 */}
        <StatItem
          icon={<BarChart3 size={16} />}
          label="S&P 500 (SPY)"
          value={sp500 ? `$${sp500.price.toFixed(2)}` : '---'}
          subValue={formatSP500Change(sp500)}
          color="text-blue-500"
          loading={loading}
        />

        {/* Unemployment */}
        <StatItem
          icon={<Users size={16} />}
          label="Unemployment"
          value={unemployment ? `${unemployment.rate}%` : '---'}
          subValue="U.S. Rate (BLS)"
          color="text-orange-500"
          loading={loading}
        />

        {/* Inflation */}
        <StatItem
          icon={<Percent size={16} />}
          label="Inflation (CPI)"
          value={inflation ? `${inflation.rate}%` : '---'}
          subValue="Year-over-year"
          color="text-red-500"
          loading={loading}
        />

        {/* Bitcoin */}
        <StatItem
          icon={<Bitcoin size={16} />}
          label="Bitcoin"
          value={bitcoin ? `$${bitcoin.price.toLocaleString()}` : '---'}
          subValue={formatBtcChange(bitcoin)}
          color="text-amber-500"
          loading={loading}
        />

        {/* Gold */}
        <StatItem
          icon={<CircleDollarSign size={16} />}
          label="Gold Price"
          value={gold ? `$${gold.price.toLocaleString()}` : '---'}
          subValue="Per ounce"
          color="text-yellow-400"
          loading={loading}
        />
      </div>
    </section>
  );
};

export default LiveTracker;
