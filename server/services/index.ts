/**
 * Service Initialization
 * Starts all background services for data fetching and notifications
 */

import { scheduleFredUpdates } from "./fredService";
import { scheduleNewsUpdates } from "./newsService";
import { scheduleQuoteUpdates } from "./quotesService";
import { scheduleCountdownChecks } from "./countdownService";
import { scheduleSummaryGeneration } from "./summaryService";
import { scheduleGovernmentDataUpdates } from "./governmentDataService";
import { initializeMilestones } from "../db";

/**
 * Initialize all backend services
 * This should be called once when the server starts
 */
export async function initializeServices(): Promise<void> {
  console.log("[Services] Initializing background services...");

  try {
    // Initialize countdown milestones
    await initializeMilestones();
    console.log("[Services] Countdown milestones initialized");

    // Start scheduled services
    scheduleFredUpdates();
    console.log("[Services] FRED API updates scheduled");

    scheduleNewsUpdates();
    console.log("[Services] NewsAPI updates scheduled");

    scheduleQuoteUpdates();
    console.log("[Services] Tronald Dump quote updates scheduled");

    scheduleCountdownChecks();
    console.log("[Services] Countdown checks scheduled");

    scheduleSummaryGeneration();
    console.log("[Services] LLM summary generation scheduled");

    scheduleGovernmentDataUpdates();
    console.log("[Services] Government Data.gov updates scheduled");

    console.log("[Services] All background services initialized successfully");
  } catch (error) {
    console.error("[Services] Error initializing services:", error);
  }
}
