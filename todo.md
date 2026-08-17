# TrumpWatch Dashboard - Project TODO

## Core Features

### Countdown Timer
- [x] Implement countdown timer component showing days, hours, minutes, seconds to January 20, 2029
- [x] Real-time countdown update mechanism
- [x] Milestone notifications (1000 days, 100 days, 10 days remaining)

### Economic Metrics Dashboard
- [x] Integrate FRED API for real-time economic data
- [x] Display GDP metrics
- [x] Display unemployment rate
- [x] Display inflation rate
- [x] Display stock indices (S&P 500, Dow Jones, Nasdaq)
- [x] Create economic metrics visualization component
- [x] Auto-refresh economic data every 5 minutes

### News Feed Aggregator
- [x] Integrate NewsAPI for political news
- [x] Implement news filtering by keyword/category
- [x] Implement news search functionality
- [x] Create news card component with article preview
- [x] Auto-refresh news feed every 15 minutes
- [x] LLM-generated summaries for news articles

### Donald Trump Quotes
- [x] Integrate Tronald Dump API for quotes
- [x] Implement random quote generation
- [x] Create quote display component
- [x] Auto-refresh quotes every 30 minutes

### Government Data Visualization
- [x] Research and integrate relevant Data.gov APIs
- [x] Create government metrics visualization
- [x] Display key statistics and trends

### Database Schema
- [x] Create users table (already exists)
- [x] Create economic_metrics table for caching
- [x] Create news_articles table for caching
- [x] Create quotes table for caching
- [x] Create notifications table for milestone tracking
- [x] Create api_status table for monitoring API health

### Backend Services
- [x] Create FRED API integration service
- [x] Create NewsAPI integration service
- [x] Create Tronald Dump API integration service
- [x] Create Data.gov API integration service
- [x] Implement data caching mechanism
- [x] Implement error handling and retry logic
- [x] Create notification service for milestones
- [x] Create LLM summary generation service

### Frontend UI Components
- [x] Create countdown timer display component
- [x] Create economic metrics dashboard component
- [x] Create news feed component with search/filter
- [x] Create quote display component
- [x] Create government data visualization component
- [x] Implement responsive mobile layout
- [x] Implement dark theme with red/white/blue accents
- [x] Create loading states and error handling UI

### Auto-Refresh & Notifications
- [x] Implement auto-refresh for economic data
- [x] Implement auto-refresh for news feed
- [x] Implement auto-refresh for quotes
- [x] Implement countdown milestone notifications
- [x] Implement API failure notifications
- [x] Create notification UI component

### Testing & Deployment
- [x] Write vitest tests for API integration services
- [x] Test countdown timer accuracy
- [x] Test auto-refresh mechanisms
- [x] Test responsive design across devices
- [x] Test notification system
- [ ] Performance optimization and caching validation

## API Keys & Secrets Required
- [x] FRED API Key (Federal Reserve Economic Data)
- [x] NewsAPI Key
- [x] Tronald Dump API (free, no key required)
- [x] Data.gov API access (free, no key required)

## Design & Styling
- [x] Define color palette (dark theme with red/white/blue accents)
- [x] Define typography and font choices
- [x] Create responsive breakpoints for mobile/tablet/desktop
- [x] Implement Tailwind CSS theming
- [x] Add patriotic visual elements and branding

## Performance & Optimization
- [x] Implement data caching strategy
- [x] Optimize API calls to reduce rate limiting
- [ ] Implement lazy loading for images and components
- [ ] Optimize bundle size
- [ ] Monitor API response times

## Accessibility & UX
- [ ] Ensure WCAG 2.1 AA compliance
- [ ] Add keyboard navigation support
- [x] Add loading skeletons for better perceived performance
- [ ] Implement error boundaries
- [x] Add helpful error messages for failed API calls


## Known Issues & Bugs
- [x] Economic metrics not loading - backend services initialized and data seeded
- [x] News articles not loading - NewsAPI service working and fetching articles
- [x] Quotes not loading - Tronald Dump API has network issues, using seeded data
- [x] FRED API endpoint returns XML instead of JSON - needs endpoint format fix

## Follow-up Fixes
- [x] Add an automated test that starts from persisted DB data and verifies `dashboard.getNews` and `dashboard.getDashboardData` return populated news and quote responses without manual seeding steps beyond the intended startup flow.
- [x] Refactor startup/news refresh so real Trump-only NewsAPI articles are loaded by the app's normal service path, then verify with an endpoint-level test using the correct tRPC request format.
- [x] Add regression tests that mock a Tronald Dump failure and assert the dashboard still returns a cached/fallback quote.
- [x] Add regression tests that assert dashboard endpoint news items are Trump-related and come from persisted NewsAPI records.

## Layout Fixes
- [x] Fix Economic Metrics cards overlapping and overflowing on tablet/mobile widths
- [x] Rework metric value and unit typography so each card stays readable
- [x] Verify responsive layout with type checks, tests, and project status

## Quote Integrity Fixes
- [x] Remove test/fallback quote records and prevent test data from appearing in the production quote card
- [x] Replace fabricated fallback text with an explicit unavailable state when no verified quote is cached
- [x] Verify the current Tronald Dump endpoint/status and document the source behavior
- [x] Add rigorous endpoint test that explicitly clears publishable quotes and asserts strict null/undefined response

## Quote API Status Investigation
- [x] Confirm whether the Tronald Dump endpoint is still available or returns a permanent 404
- [x] Ensure API status reflects the latest quote fetch result rather than stale or test state
- [x] Add a truthful recovery/unavailable path without fabricated quote content
- [x] Add regression test verifying api status transition from failed back to healthy after quote recovery

## News Link Integrity
- [x] Remove persisted test/fabricated news rows whose URL uses example.com or another placeholder domain
- [x] Validate NewsAPI article URLs before saving them and exclude invalid/placeholder links
- [x] Ensure the article action button renders only valid external URLs and opens the original source
- [x] Add regression tests for invalid URL rejection and valid article link preservation

## Broken Link Reporting Feature
- [x] Add `news_link_reports` table to Drizzle schema for tracking user-submitted broken links
- [x] Implement database helper for inserting link reports
- [x] Add tRPC procedure `dashboard.reportBrokenLink` to receive article ID, URL, and optional comment
- [x] Wire persistent log for submitted link reports
- [x] Add report button and feedback toast/modal inside `NewsFeed.tsx` news cards
- [x] Add Vitest tests covering report submission and validation

## Quote Refresh and Article Source Regression
- [x] Remove test-generated and synthetic article rows that produce 404 source pages
- [x] Verify and update the What Does Trump Think quote endpoint and API status behavior
- [x] Make manual quote refresh return the latest verified quote or a truthful unavailable state
- [x] Ensure integration tests clean up their temporary database rows and do not pollute dashboard data
- [x] Add regression coverage for quote refresh recovery and real source URL preservation

## Regression Gaps Identified During Verification
- [x] Wire the manual refresh result directly into the displayed quote instead of relying on random cache refetching
- [x] Isolate all dashboard and quote tests that write persistent database rows
- [x] Add a regression test proving the displayed manual refresh result is the exact fetched quote
- [x] Rerun the full Vitest suite and resolve remaining failures caused by test pollution or nondeterminism

## Final Verification Gaps
- [x] Add cleanup or isolation for every dashboard and quote test that persists rows, including beforeAll seed suites
- [x] Add a client-side regression test asserting the New Quote flow displays the exact returned quote and truthful fallback state

## Quote Copy Feature
- [x] Add a Copy button to the TrumpQuote card
- [x] Copy the complete quote text using the browser clipboard API
- [x] Provide success and failure feedback without interrupting the dashboard
- [x] Add regression coverage for copied text and unavailable clipboard access

## Remaining Test Isolation Gaps
- [x] Add cleanup hooks for dashboardEndToEnd.test.ts, dashboardPrecise.test.ts, and dashboardUltimate.test.ts
- [x] Verify database row counts after running the complete test suite to ensure zero leakage

## Economic Metrics Freshness Regression
- [x] Inspect and correct the FRED request/response format that currently yields XML or Bad Request errors
- [x] Distinguish live FRED observations from cached fallback values and expose their freshness in the UI
- [x] Prevent failed refreshes from presenting stale seed timestamps as current data
- [x] Add regression tests for source observation dates, fallback labeling, and failed refresh status

## Economic Metrics UI Freshness Coverage
- [x] Add a UI regression test for source observation and cache refresh labels
- [x] Add a UI regression test for failed/degraded FRED cached-value warnings
- [x] Rerun the full suite after adding EconomicMetrics freshness coverage

## Degraded FRED Warning Coverage
- [x] Add a UI regression test for the degraded FRED cached-value warning
- [x] Rerun the full suite and verify the degraded warning coverage

## Government Source Link Integrity
- [x] Validate every government metric source URL against an official reachable destination
- [x] Replace raw or unstable API links with canonical official source pages
- [x] Add regression tests ensuring displayed government source links are non-placeholder and valid
- [x] Verify the live dashboard no longer exposes 404 government links

## Government Source Link End-to-End Coverage
- [x] Add a dashboard data integration test asserting persisted government source URLs are canonical official pages
- [x] Add a router/UI regression assertion proving dashboard output renders those persisted canonical links
- [x] Rerun the full suite and verify the end-to-end source-link path

## Dashboard to Government Link UI Coverage
- [x] Add a regression test that renders dashboard output with persisted government source links
- [x] Rerun the full Vitest suite after adding the dashboard-to-UI link test

## Persisted Government Link Path Coverage
- [x] Seed a government metric row, retrieve it through dashboard.getDashboardData, and render the resulting Home link
- [x] Rerun the full Vitest suite after adding persisted-data dashboard-to-UI coverage

## Notification Wiring and Integration Gaps
- [x] Add a `getNotifications` tRPC procedure to retrieve recent milestone and API failure notifications
- [x] Wire `NotificationCenter` in `Home.tsx` to query live notifications instead of passing an empty array
- [x] Add integration coverage for notification creation and retrieval

## Notification Integration Test Coverage
- [x] Add a server/router test asserting `dashboard.getNotifications` correctly aggregates API failures and milestone history from the database
- [x] Rerun the full Vitest suite after adding notification integration coverage

## Native Android Application
- [ ] Define the Android MVP scope and supported Android versions
- [ ] Create a separate cloud-hosted Android project without a local-folder dependency
- [ ] Create the native Android project structure and secure data-integration contract
- [ ] Build the TrumpWatch Android dashboard using the existing backend data
- [ ] Implement a countdown home-screen widget and an economic-data home-screen widget
- [ ] Implement Android-compliant background refresh and widget caching
- [ ] Test core app and widget flows on supported Android form factors

## Production API Data Parity
- [x] Remove the technical `Recovery quote text.` fallback from server-side quote responses
- [x] Restore the `governmentMetrics` payload in `dashboard.getDashboardData`
- [x] Expose current Trump Quotes and Data.gov API statuses under the production response keys expected by Android
- [x] Add dashboard router regression coverage for verified quotes, government metrics, and all four API statuses
- [x] Checkpoint the server fix so the owner can publish the updated API used by Android

## Trump-only News Regression
- [x] Filter persisted dashboard news so every returned article explicitly mentions Donald Trump or Trump
- [x] Remove/reject irrelevant persisted articles that cause dashboard news regression tests to fail
- [x] Re-run the full Vitest suite after restoring Trump-only news filtering
- [x] Clean up already-persisted irrelevant news rows after confirming the matching criteria
- [x] Verify the published domain response exposes government metrics and all Android status keys after publication

## GitHub Synchronization
- [x] Find and compare the current TrumpWatch project with the correct GitHub repository
- [x] Prepare the current web and Android source changes for a safe GitHub update
- [x] Push the approved current version to GitHub and verify the remote commit
- [x] Replace the outdated GitHub `main` structure with current TrumpWatch web and Android source code

## Android Production Data Verification
- [x] Diagnose the persisted API-status, quotes, and government-metrics production state used by Android
- [x] Correct quote API status naming, remove technical quote fallbacks, and restore government-metrics reads
- [x] Verify the published dashboard API returns a verified quote, government metrics, and all Android status keys
- [x] Build and publish a new Android APK from the verified data contract
- [ ] Verify the new Android APK on the user's device
