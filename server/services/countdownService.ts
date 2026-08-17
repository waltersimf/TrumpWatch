/**
 * Countdown Service
 * Manages countdown timer and milestone notifications
 */

import {
  getMilestoneByDays,
  updateMilestoneNotification,
  initializeMilestones,
  getNotificationPreferences,
  getAllUsers,
} from "../db";
import { notifyOwner } from "../_core/notification";

// Target date: January 20, 2029
const TARGET_DATE = new Date("2029-01-20T00:00:00Z");

export interface CountdownData {
  daysRemaining: number;
  hoursRemaining: number;
  minutesRemaining: number;
  secondsRemaining: number;
  totalSeconds: number;
  percentageComplete: number;
}

/**
 * Calculate countdown data
 */
export function calculateCountdown(): CountdownData {
  const now = new Date();
  const totalMs = TARGET_DATE.getTime() - now.getTime();

  if (totalMs <= 0) {
    return {
      daysRemaining: 0,
      hoursRemaining: 0,
      minutesRemaining: 0,
      secondsRemaining: 0,
      totalSeconds: 0,
      percentageComplete: 100,
    };
  }

  const totalSeconds = Math.floor(totalMs / 1000);
  const daysRemaining = Math.floor(totalSeconds / (24 * 60 * 60));
  const hoursRemaining = Math.floor((totalSeconds % (24 * 60 * 60)) / (60 * 60));
  const minutesRemaining = Math.floor((totalSeconds % (60 * 60)) / 60);
  const secondsRemaining = totalSeconds % 60;

  // Calculate percentage complete (from Jan 20, 2025 to Jan 20, 2029)
  const startDate = new Date("2025-01-20T00:00:00Z");
  const totalDuration = TARGET_DATE.getTime() - startDate.getTime();
  const elapsed = now.getTime() - startDate.getTime();
  const percentageComplete = Math.min(100, (elapsed / totalDuration) * 100);

  return {
    daysRemaining,
    hoursRemaining,
    minutesRemaining,
    secondsRemaining,
    totalSeconds,
    percentageComplete,
  };
}

/**
 * Check for milestone notifications
 */
export async function checkMilestones(): Promise<void> {
  try {
    await initializeMilestones();

    const countdown = calculateCountdown();
    const daysRemaining = countdown.daysRemaining;

    // Check if we've hit any milestones
    const milestoneDays = [1000, 500, 100, 50, 10, 1];

    for (const days of milestoneDays) {
      if (daysRemaining === days) {
        const milestone = await getMilestoneByDays(days);

        if (milestone && milestone.notificationSent === 0) {
          // Send notification
          await notifyOwner({
            title: `🎯 Countdown Milestone: ${days} Days Remaining`,
            content: `The countdown to January 20, 2029 has reached ${days} days remaining. Current status: ${countdown.daysRemaining} days, ${countdown.hoursRemaining} hours, ${countdown.minutesRemaining} minutes.`,
          });

          // Mark milestone as notified
          await updateMilestoneNotification(milestone.id);
        }
      }
    }
  } catch (error) {
    console.error("[Countdown] Milestone check error:", error);
  }
}

/**
 * Schedule periodic milestone checks
 * Runs every hour
 */
export function scheduleCountdownChecks(): void {
  // Initial check
  checkMilestones().catch((error) =>
    console.error("[Countdown] Initial check failed:", error)
  );

  // Schedule periodic checks (1 hour)
  setInterval(() => {
    checkMilestones().catch((error) =>
      console.error("[Countdown] Scheduled check failed:", error)
    );
  }, 60 * 60 * 1000);
}
