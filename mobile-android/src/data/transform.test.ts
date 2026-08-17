import { describe, expect, it } from 'vitest';
import { buildCountdown, extractQuoteRefreshResult, normalizeDashboardPayload, normalizeVerifiedQuote } from './transform';

describe('TrumpWatch Android data transformation', () => {
  it('calculates the countdown deterministically', () => {
    const now = new Date('2029-01-19T17:00:00.000Z').getTime();

    expect(buildCountdown(now)).toEqual({
      daysRemaining: 1,
      hoursRemaining: 0,
      minutesRemaining: 0,
    });
  });

  it('extracts the dashboard metrics from a tRPC response envelope', () => {
    const snapshot = normalizeDashboardPayload(
      {
        result: {
          data: {
            json: {
              metrics: {
                UNRATE: [
                  {
                    title: 'Unemployment Rate',
                    value: 4.1,
                    units: 'Percent',
                    observationDate: '2026-07-01',
                  },
                ],
              },
            },
          },
        },
      },
      new Date('2026-08-14T00:00:00.000Z').getTime()
    );

    expect(snapshot.source).toBe('live');
    expect(snapshot.metrics[0]).toEqual({
      key: 'UNRATE',
      label: 'Unemployment Rate',
      value: '4.1',
      unit: 'Percent',
      date: '2026-07-01',
    });
    expect(snapshot.metrics[1].value).toBeNull();
  });

  it('uses the latest API record and supports the production metric field names', () => {
    const snapshot = normalizeDashboardPayload({
      result: {
        data: {
          json: {
            metrics: {
              UNRATE: [
                { seriesName: 'Unemployment Rate', value: '4.2', unit: 'Percent', date: '2025-12-15' },
                { seriesName: 'Unemployment Rate', value: '4.1', unit: 'Percent', date: '2026-07-01' },
              ],
            },
          },
        },
      },
    });

    expect(snapshot.metrics[0]).toMatchObject({
      label: 'Unemployment Rate',
      value: '4.1',
      unit: 'Percent',
      date: '2026-07-01',
    });
  });

  it('keeps every dashboard section when the complete tRPC envelope is supplied', () => {
    const snapshot = normalizeDashboardPayload({
      result: {
        data: {
          json: {
            metrics: { UNRATE: [{ seriesName: 'Unemployment Rate', value: '4.1', unit: 'Percent', date: '2026-07-01' }] },
            governmentMetrics: [{ metricKey: 'DEBT', metricName: 'Federal Debt', value: '37.1', unit: 'Trillion USD', date: '2026-08-01', sourceUrl: 'https://fiscaldata.treasury.gov/' }],
            news: [{ id: 11, title: 'Trump policy update', description: 'Description', url: 'https://news.example.gov/article', source: 'News source', publishedAt: '2026-08-14T00:00:00.000Z', summary: 'Brief summary' }],
            quote: { id: 3, quoteText: 'A verified quote.', source: 'Archive', date: '2026-08-12' },
            notifications: [{ id: 4, title: 'API alert', message: 'A service is degraded', createdAt: '2026-08-14T01:00:00.000Z' }],
            apiStatus: { fred: { status: 'healthy' }, newsApi: { status: 'degraded' }, quotesApi: { status: 'healthy' }, dataGov: { status: 'healthy' } },
          },
        },
      },
    });

    expect(snapshot.governmentMetrics).toHaveLength(1);
    expect(snapshot.news).toHaveLength(1);
    expect(snapshot.quote?.quoteText).toBe('A verified quote.');
    expect(snapshot.notifications).toHaveLength(1);
    expect(snapshot.apiStatus.newsApi?.status).toBe('degraded');
    expect(snapshot.apiStatus.quotesApi?.status).toBe('healthy');
    expect(snapshot.apiStatus.dataGov?.status).toBe('healthy');
  });

  it('rejects an incomplete envelope instead of labeling empty data as live', () => {
    expect(() => normalizeDashboardPayload({ result: { data: { json: {} } } })).toThrow('неповну відповідь');
  });

  it('extracts a refreshed quote from the tRPC mutation envelope', () => {
    expect(extractQuoteRefreshResult({ result: { data: { json: { quote: { id: 9, quoteText: 'Verified quote', source: 'Archive', date: null }, refreshed: true } } } })).toEqual({
      quote: { id: 9, quoteText: 'Verified quote', source: 'Archive', date: null },
      refreshed: true,
    });
  });

  it('rejects technical recovery text instead of presenting it as a verified quote', () => {
    expect(normalizeVerifiedQuote({ id: 1, quoteText: 'Recovery quote text.', source: 'API', date: null })).toBeNull();
  });

  it('reads the production GDPC1 key for real GDP', () => {
    const snapshot = normalizeDashboardPayload({ result: { data: { json: { metrics: { GDPC1: [{ seriesName: 'Real GDP', value: '24270.599', unit: 'Billions of Dollars', date: '2026-04-01' }] } } } } });
    expect(snapshot.metrics[2]).toMatchObject({ key: 'GDPC1', label: 'Real GDP', value: '24,270.6' });
  });
});
