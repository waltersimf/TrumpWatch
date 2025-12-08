import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subValue?: string;
  subLabel?: string;
  icon: LucideIcon;
  loading?: boolean;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
}

const StatCard: React.FC<StatCardProps> = ({ 
  title, value, subValue, subLabel, icon: Icon, loading, trend, trendValue 
}) => {
  return (
    <div className="glass-panel p-6 rounded-xl relative overflow-hidden group hover:border-red-500/30 transition-colors duration-300">
      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
        <Icon size={80} className="text-white" />
      </div>
      
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-red-500/20 rounded-lg text-red-500">
          <Icon size={20} />
        </div>
        <h3 className="text-slate-400 font-semibold uppercase text-xs tracking-wider">{title}</h3>
      </div>

      {loading ? (
        <div className="animate-pulse space-y-3">
          <div className="h-8 bg-slate-700 rounded w-3/4"></div>
          <div className="h-4 bg-slate-800 rounded w-1/2"></div>
        </div>
      ) : (
        <div>
          <div className="text-2xl md:text-3xl font-bold text-white mb-1 font-mono tracking-tight">
            {value}
          </div>
          {subValue && (
            <div className="text-sm text-slate-400">
              {trend && trendValue && (
                <span className={`font-bold mr-2 ${
                  trend === 'up' ? 'text-red-400' : 
                  trend === 'down' ? 'text-green-400' : 'text-slate-400'
                }`}>
                  {trendValue}
                </span>
              )}
              {subValue} <span className="text-slate-500 text-xs block mt-1">{subLabel}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default StatCard;