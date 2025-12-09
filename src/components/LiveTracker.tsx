import React from 'react';
import { DollarSign, TrendingUp, BarChart3, Zap, TreePine, MessageCircle } from 'lucide-react';
import { DebtData, GasPriceData, ApprovalData } from '../types';

interface LiveTrackerProps {
  debt: DebtData | null;
  gasPrice: GasPriceData | null;
  approvalRating: ApprovalData | null;
  eoCount: number | null;
  golfDays: number;
  truthPostsCount: number | null;
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
  approvalRating,
  eoCount,
  golfDays,
  truthPostsCount,
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
    return `${prefix}$${val.toFixed(2)}`;
  };

  // Calculate today's posts (mock - would need real-time data)
  const todayPosts = 23; // Hardcoded as per design

  return (
    <section className="mt-8">
      {/* Section header */}
      <div className="flex items-center gap-2 mb-4">
        <BarChart3 size={18} className="text-slate-400" />
        <h3 className="text-white font-semibold">Live Tracker</h3>
      </div>

      {/* Stats grid - 2 columns */}
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

        {/* Approval Rating */}
        <StatItem
          icon={<BarChart3 size={16} />}
          label="Approval Rating"
          value={approvalRating ? `${approvalRating.approve}%` : '---'}
          subValue={approvalRating?.monthChange !== null && approvalRating?.monthChange !== undefined
            ? `${approvalRating.monthChange >= 0 ? '+' : ''}${approvalRating.monthChange}% this month`
            : 'Loading...'}
          color="text-blue-500"
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

        {/* Golf Days */}
        <StatItem
          icon={<TreePine size={16} />}
          label="Golf Days"
          value={golfDays.toString()}
          subValue="~$142M taxpayer cost"
          color="text-purple-500"
          loading={loading}
        />

        {/* Truth Social Posts */}
        <StatItem
          icon={<MessageCircle size={16} />}
          label="Truth Social Posts"
          value={truthPostsCount !== null ? truthPostsCount.toLocaleString() : '---'}
          subValue={`+${todayPosts} today`}
          color="text-cyan-500"
          loading={loading}
        />
      </div>
    </section>
  );
};

export default LiveTracker;
