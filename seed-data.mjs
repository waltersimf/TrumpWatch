/**
 * Seed script to populate initial data for TrumpWatch Dashboard
 * Run with: node seed-data.mjs
 */

import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

const pool = mysql.createPool({
  connectionLimit: 10,
  host: process.env.DATABASE_URL?.split("@")[1]?.split("/")[0] || "localhost",
  user: process.env.DATABASE_URL?.split("://")[1]?.split(":")[0] || "root",
  password: process.env.DATABASE_URL?.split(":")[2]?.split("@")[0] || "",
  database: process.env.DATABASE_URL?.split("/").pop() || "trumpwatch",
});

async function seedEconomicMetrics() {
  const connection = await pool.getConnection();

  try {
    console.log("Seeding economic metrics...");

    const metrics = [
      {
        seriesId: "UNRATE",
        seriesName: "Unemployment Rate",
        value: "4.2",
        date: new Date().toISOString().split("T")[0],
        unit: "Percent",
      },
      {
        seriesId: "CPIAUCSL",
        seriesName: "Consumer Price Index",
        value: "314.5",
        date: new Date().toISOString().split("T")[0],
        unit: "Index",
      },
      {
        seriesId: "GDPC1",
        seriesName: "Real GDP",
        value: "28456.7",
        date: new Date().toISOString().split("T")[0],
        unit: "Billions of Dollars",
      },
      {
        seriesId: "DGS10",
        seriesName: "10-Year Treasury Yield",
        value: "4.25",
        date: new Date().toISOString().split("T")[0],
        unit: "Percent",
      },
      {
        seriesId: "DCOILWTICO",
        seriesName: "Crude Oil WTI",
        value: "72.50",
        date: new Date().toISOString().split("T")[0],
        unit: "Dollars per Barrel",
      },
      {
        seriesId: "GSPC",
        seriesName: "S&P 500",
        value: "5890.25",
        date: new Date().toISOString().split("T")[0],
        unit: "Index",
      },
    ];

    for (const metric of metrics) {
      await connection.execute(
        `INSERT INTO economic_metrics (seriesId, seriesName, value, date, unit, lastUpdated, createdAt)
         VALUES (?, ?, ?, ?, ?, NOW(), NOW())
         ON DUPLICATE KEY UPDATE value = ?, lastUpdated = NOW()`,
        [
          metric.seriesId,
          metric.seriesName,
          metric.value,
          metric.date,
          metric.unit,
          metric.value,
        ]
      );
    }

    console.log("✓ Economic metrics seeded successfully");
  } catch (error) {
    console.error("Error seeding economic metrics:", error);
  } finally {
    await connection.release();
  }
}

async function seedQuotes() {
  const connection = await pool.getConnection();

  try {
    console.log("Seeding Trump quotes...");

    const quotes = [
      {
        quoteText:
          "Make America Great Again - we will build a wall and Mexico will pay for it!",
        source: "Campaign Rally",
        date: "2024-12-15",
        externalId: "quote-001",
      },
      {
        quoteText:
          "We are going to win so much, you may even get tired of winning.",
        source: "Campaign Speech",
        date: "2024-12-10",
        externalId: "quote-002",
      },
      {
        quoteText:
          "I will be the greatest jobs president that God ever created.",
        source: "Interview",
        date: "2024-12-05",
        externalId: "quote-003",
      },
      {
        quoteText:
          "The fake news media is the enemy of the people, but we will win.",
        source: "Press Conference",
        date: "2024-11-30",
        externalId: "quote-004",
      },
      {
        quoteText:
          "We will rebuild our military and take care of our great veterans.",
        source: "Campaign Rally",
        date: "2024-11-25",
        externalId: "quote-005",
      },
    ];

    for (const quote of quotes) {
      await connection.execute(
        `INSERT INTO quotes (quoteText, source, date, externalId, createdAt)
         VALUES (?, ?, ?, ?, NOW())
         ON DUPLICATE KEY UPDATE quoteText = ?`,
        [quote.quoteText, quote.source, quote.date, quote.externalId, quote.quoteText]
      );
    }

    console.log("✓ Trump quotes seeded successfully");
  } catch (error) {
    console.error("Error seeding quotes:", error);
  } finally {
    await connection.release();
  }
}

async function seedCountdownMilestones() {
  const connection = await pool.getConnection();

  try {
    console.log("Seeding countdown milestones...");

    const milestones = [1000, 500, 100, 50, 10, 1];

    for (const days of milestones) {
      await connection.execute(
        `INSERT IGNORE INTO countdown_milestones (daysRemaining, notificationSent, createdAt)
         VALUES (?, 0, NOW())`,
        [days]
      );
    }

    console.log("✓ Countdown milestones seeded successfully");
  } catch (error) {
    console.error("Error seeding countdown milestones:", error);
  } finally {
    await connection.release();
  }
}

async function main() {
  try {
    console.log("Starting data seeding...\n");
    await seedEconomicMetrics();
    await seedQuotes();
    await seedCountdownMilestones();
    console.log("\n✓ All data seeded successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Fatal error:", error);
    process.exit(1);
  }
}

main();
