import { useEffect, useState } from "react";
import React from "react";
import { Card } from "@/components/ui/card";

interface CountdownData {
  daysRemaining: number;
  hoursRemaining: number;
  minutesRemaining: number;
  secondsRemaining: number;
  totalSeconds: number;
  percentageComplete: number;
}

export function CountdownTimer() {
  const [countdown, setCountdown] = useState<CountdownData>({
    daysRemaining: 0,
    hoursRemaining: 0,
    minutesRemaining: 0,
    secondsRemaining: 0,
    totalSeconds: 0,
    percentageComplete: 0,
  });

  useEffect(() => {
    const updateCountdown = () => {
      const targetDate = new Date("2029-01-20T00:00:00Z");
      const now = new Date();
      const totalMs = targetDate.getTime() - now.getTime();

      if (totalMs <= 0) {
        setCountdown({
          daysRemaining: 0,
          hoursRemaining: 0,
          minutesRemaining: 0,
          secondsRemaining: 0,
          totalSeconds: 0,
          percentageComplete: 100,
        });
        return;
      }

      const totalSeconds = Math.floor(totalMs / 1000);
      const daysRemaining = Math.floor(totalSeconds / (24 * 60 * 60));
      const hoursRemaining = Math.floor(
        (totalSeconds % (24 * 60 * 60)) / (60 * 60)
      );
      const minutesRemaining = Math.floor((totalSeconds % (60 * 60)) / 60);
      const secondsRemaining = totalSeconds % 60;

      const startDate = new Date("2025-01-20T00:00:00Z");
      const totalDuration = targetDate.getTime() - startDate.getTime();
      const elapsed = now.getTime() - startDate.getTime();
      const percentageComplete = Math.min(100, (elapsed / totalDuration) * 100);

      setCountdown({
        daysRemaining,
        hoursRemaining,
        minutesRemaining,
        secondsRemaining,
        totalSeconds,
        percentageComplete,
      });
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Card className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border-red-500/30 p-8">
      <div className="text-center">
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">
          TRUMPWATCH
        </h1>
        <p className="text-red-400 text-lg mb-8">
          Countdown to January 20, 2029
        </p>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-red-600 via-white to-blue-600 transition-all duration-500"
              style={{ width: `${countdown.percentageComplete}%` }}
            />
          </div>
          <p className="text-slate-400 text-sm mt-2">
            {countdown.percentageComplete.toFixed(1)}% Complete
          </p>
        </div>

        {/* Countdown Display */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {/* Days */}
          <div className="bg-slate-800/50 border border-red-500/20 rounded-lg p-4 md:p-6">
            <div className="text-3xl md:text-5xl font-bold text-red-500 font-mono">
              {countdown.daysRemaining.toString().padStart(4, "0")}
            </div>
            <p className="text-slate-400 text-xs md:text-sm mt-2 uppercase tracking-wider">
              Days
            </p>
          </div>

          {/* Hours */}
          <div className="bg-slate-800/50 border border-white/20 rounded-lg p-4 md:p-6">
            <div className="text-3xl md:text-5xl font-bold text-white font-mono">
              {countdown.hoursRemaining.toString().padStart(2, "0")}
            </div>
            <p className="text-slate-400 text-xs md:text-sm mt-2 uppercase tracking-wider">
              Hours
            </p>
          </div>

          {/* Minutes */}
          <div className="bg-slate-800/50 border border-white/20 rounded-lg p-4 md:p-6">
            <div className="text-3xl md:text-5xl font-bold text-white font-mono">
              {countdown.minutesRemaining.toString().padStart(2, "0")}
            </div>
            <p className="text-slate-400 text-xs md:text-sm mt-2 uppercase tracking-wider">
              Minutes
            </p>
          </div>

          {/* Seconds */}
          <div className="bg-slate-800/50 border border-blue-500/20 rounded-lg p-4 md:p-6">
            <div className="text-3xl md:text-5xl font-bold text-blue-500 font-mono">
              {countdown.secondsRemaining.toString().padStart(2, "0")}
            </div>
            <p className="text-slate-400 text-xs md:text-sm mt-2 uppercase tracking-wider">
              Seconds
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
}
