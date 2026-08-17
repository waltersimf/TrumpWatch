# Production API Audit — 2026-08-17

## Verified endpoint

`dashboard.getDashboardData` was read directly from the published TrumpWatch domain using the production tRPC envelope.

## Findings

- The published payload exposes `apiStatus` keys `fred`, `newsApi`, `quotesApi`, and `dataGov`.
- `quotesApi` resolves to the current `TrumpQuotesAPI` record, which is healthy; the legacy `TronaldDump` record is not used by this response.
- The published payload includes persisted government metrics, so Android can render them when its transform accepts the response.
- `dataGov` is still marked `failed` because the background refresh previously failed while selecting an existing `government_metrics` row by `metricKey`; the table and canonical rows exist in production.

## Next action

The background government-metric upsert path was replaced with an atomic insert-or-update and published. Direct reads from the published tRPC endpoint then confirmed:

- `governmentMetrics` contains `FEDERAL_DEBT`, `FEDERAL_OUTLAYS`, and `POPULATION_ESTIMATE` with canonical Treasury/Census source URLs;
- the quote is a non-technical response from the What Does Trump Think API;
- the Android contract exposes `fred`, `newsApi`, `quotesApi`, and `dataGov`, with `quotesApi` and `dataGov` healthy at verification time.

The unused failed `TronaldDump` status row was removed after confirming no live code depends on it.
