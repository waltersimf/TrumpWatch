# Tronald Dump API research

- Search result catalog: https://apis.io/apis/tronald-dump/quotes-api/
- The catalog URL currently resolves to a Page Not Found response and does not provide a current endpoint or schema.
- Search results also surfaced the official-looking GitHub organization https://github.com/tronalddump-io and the API Evangelist mirror https://github.com/api-evangelist/tronald-dump, which should be checked before changing the endpoint.
- Current app logs report the configured `https://www.tronalddump.io/random/quote` endpoint returning HTTP 404/Not Found, so the app must not present a fabricated fallback as if it were verified source data.

- The GitHub organization https://github.com/tronalddump-io is still present, but the main `tronald-app` repository was last updated Jun 9, 2024; the `tronald-docs` repository was last updated Jan 3, 2020.
- The organization still links to https://www.tronalddump.io/, but the app's current random endpoint returns 404 in runtime logs. Treat the upstream as unavailable until a live endpoint is confirmed; do not label local fallback text as a Tronald Dump quote.

Live verification on Aug 14, 2026: `https://www.tronalddump.io/random/quote` returns HTTP 404 with a Page Not Found response. The root domain currently serves unrelated SLOT88 storefront content rather than the Trump quote archive or API documentation. Therefore the configured integration is not failing because of the app's JSON parsing; the upstream route/domain is no longer a trustworthy quote source.

A viable replacement was verified on Aug 14, 2026: What Does Trump Think documents the base URL `https://api.whatdoestrumpthink.com/api/`, requires no authentication, and exposes `GET /api/v1/quotes/random` returning JSON with a `message` field. The live endpoint returned a quote successfully. It provides generic historical Trump quote text but no source/date metadata, so TrumpWatch should label the source as `What Does Trump Think API` and leave date blank rather than inventing metadata.
