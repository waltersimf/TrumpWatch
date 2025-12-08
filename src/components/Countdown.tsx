import React, { useEffect, useState } from 'react';
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
        // Term ended
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

      // Days passed calculation
      const daysPassedRaw = Math.floor(timePassed / (1000 * 60 * 60 * 24));
      // Clamp days passed for UI
      const daysPassed = Math.max(0, Math.min(1461, daysPassedRaw));
      
      const percentageComplete = Math.max(0, Math.min(100, (timePassed / totalDuration) * 100));

      setTime({
        days, hours, minutes, seconds,
        totalDaysInTerm: 1461,
        daysPassed: daysPassed + 1, // 1-indexed for "Day X"
        percentageComplete
      });
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full max-w-5xl mx-auto mb-12">
      <div className="text-center mb-8">
        <h2 className="text-sm md:text-base text-red-400 font-bold uppercase tracking-[0.2em] mb-2">
          Presidency Countdown
        </h2>
        <div className="flex flex-wrap justify-center gap-4 md:gap-8 mb-8">
          <TimeBlock value={time.days} label="Days" />
          <TimeBlock value={time.hours} label="Hours" />
          <TimeBlock value={time.minutes} label="Minutes" />
          <TimeBlock value={time.seconds} label="Seconds" />
        </div>
        
        <div className="glass-panel p-6 rounded-2xl max-w-3xl mx-auto border border-slate-700">
          <div className="flex justify-between items-end mb-2 text-slate-300 text-sm font-mono">
            <span>Jan 20, 2025</span>
            <span className="text-white font-bold">Day {time.daysPassed.toLocaleString()} of {time.totalDaysInTerm.toLocaleString()}</span>
            <span>Jan 20, 2029</span>
          </div>
          <div className="h-4 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
            <div 
              className="h-full bg-gradient-to-r from-red-800 to-red-600 transition-all duration-1000 ease-out"
              style={{ width: `${time.percentageComplete}%` }}
            ></div>
          </div>
          <div className="text-center mt-2 text-xs text-slate-500">
            {time.percentageComplete.toFixed(5)}% Complete
          </div>
        </div>
      </div>
    </div>
  );
};

const TimeBlock: React.FC<{ value: number; label: string }> = ({ value, label }) => (
  <div className="flex flex-col items-center">
    <div className="bg-slate-800/50 backdrop-blur-md border border-slate-700 w-20 h-20 md:w-32 md:h-32 rounded-2xl flex items-center justify-center mb-2 shadow-2xl shadow-red-900/10">
      <span className="text-3xl md:text-6xl font-bold text-white font-mono tabular-nums">
        {value.toString().padStart(2, '0')}
      </span>
    </div>
    <span className="text-slate-400 text-xs md:text-sm uppercase tracking-wider font-semibold">{label}</span>
  </div>
);

export default Countdown;