import React, { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';
import { CountdownTime } from '../types';

const Countdown: React.FC = () => {
  const [time, setTime] = useState<CountdownTime>({
    days: 0, hours: 0, minutes: 0, seconds: 0,
    totalDaysInTerm: 1461, daysPassed: 0, percentageComplete: 0
  });

  useEffect(() => {
    const calculateTime = () => {
      const start = new Date('2025-01-20T12:00:00-05:00'); // EST
      const end = new Date('2029-01-20T12:00:00-05:00');   // EST
      const now = new Date();

      const totalDuration = end.getTime() - start.getTime();
      const timeRemaining = end.getTime() - now.getTime();
      const timePassed = now.getTime() - start.getTime();

      if (timeRemaining <= 0) {
        setTime({
          days: 0, hours: 0, minutes: 0, seconds: 0,
          totalDaysInTerm: 1461, daysPassed: 1461, percentageComplete: 100
        });
        return;
      }

      const days = Math.floor(timeRemaining / (1000 * 60 * 60 * 24));
      const hours = Math.floor((timeRemaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((timeRemaining % (1000 * 60)) / 1000);

      const daysPassedRaw = Math.floor(timePassed / (1000 * 60 * 60 * 24));
      const daysPassed = Math.max(0, Math.min(1461, daysPassedRaw));
      const percentageComplete = Math.max(0, Math.min(100, (timePassed / totalDuration) * 100));

      setTime({
        days, hours, minutes, seconds,
        totalDaysInTerm: 1461,
        daysPassed: daysPassed + 1,
        percentageComplete
      });
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full max-w-lg mx-auto text-center">
      {/* Day counter */}
      <div className="flex items-center justify-center gap-2 text-slate-400 text-sm mb-2">
        <Clock size={14} />
        <span>Day <span className="text-white font-bold">{time.daysPassed}</span> of {time.totalDaysInTerm.toLocaleString()}</span>
      </div>

      {/* Title */}
      <h2 className="text-xl sm:text-2xl font-bold text-white mb-6">
        Time Remaining in Trump's Final Term
      </h2>

      {/* Countdown blocks - all 4 in one row */}
      <div className="flex justify-center items-center gap-2 sm:gap-3 mb-6">
        <TimeBlock value={time.days} label="DAYS" />
        <Separator />
        <TimeBlock value={time.hours} label="HOURS" />
        <Separator />
        <TimeBlock value={time.minutes} label="MINS" />
        <Separator />
        <TimeBlock value={time.seconds} label="SECS" />
      </div>

      {/* Progress bar */}
      <div className="w-full mb-2">
        <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full progress-gradient transition-all duration-1000 ease-out rounded-full"
            style={{ width: `${time.percentageComplete}%` }}
          />
        </div>
      </div>

      {/* Percentage */}
      <p className="text-slate-400 text-sm">
        <span className="text-white font-semibold">{time.percentageComplete.toFixed(2)}%</span> of term completed
      </p>
    </div>
  );
};

const TimeBlock: React.FC<{ value: number; label: string }> = ({ value, label }) => (
  <div className="countdown-block flex flex-col items-center">
    <span className="text-2xl sm:text-4xl md:text-5xl font-bold text-white font-mono tabular-nums leading-none">
      {value.toString().padStart(2, '0')}
    </span>
    <span className="text-[10px] sm:text-xs text-slate-500 uppercase tracking-wider mt-1 font-medium">
      {label}
    </span>
  </div>
);

const Separator: React.FC = () => (
  <span className="text-slate-600 text-xl sm:text-2xl font-bold self-start mt-3 sm:mt-4">:</span>
);

export default Countdown;
