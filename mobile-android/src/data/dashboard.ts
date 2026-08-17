import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { buildCountdown, extractQuoteRefreshResult, normalizeDashboardPayload, normalizeVerifiedQuote, type DashboardSnapshot, type MetricCard, type NewsArticle, type QuoteRefreshResult, type TrumpQuote } from './transform';

export type { DashboardSnapshot, MetricCard, NewsArticle, TrumpQuote, GovernmentMetric, DashboardNotification, ApiHealth, QuoteRefreshResult } from './transform';

const CACHE_KEY = 'trumpwatch.dashboard.snapshot.v4';
const DASHBOARD_API_BASE_URL = (Constants.expoConfig?.extra?.dashboardApiBaseUrl as string | undefined) ?? 'https://trumpdash-njn2ba2j.manus.space';

function trpcUrl(procedure: string, input?: Record<string, unknown>) {
  const inputParam = input ? `?input=${encodeURIComponent(JSON.stringify({ json: input }))}` : '?input=%7B%22json%22%3Anull%7D';
  return `${DASHBOARD_API_BASE_URL}/api/trpc/${procedure}${inputParam}`;
}

type TrpcEnvelope = { result?: { data?: { json?: unknown } } };

async function requestEnvelope(procedure: string, input?: Record<string, unknown>): Promise<TrpcEnvelope> {
  const response = await fetch(trpcUrl(procedure, input), { headers: { Accept: 'application/json' } });
  if (!response.ok) throw new Error(`Сервер повернув помилку ${response.status}.`);
  return await response.json() as TrpcEnvelope;
}

async function requestJson(procedure: string, input?: Record<string, unknown>) {
  const payload = await requestEnvelope(procedure, input);
  return payload.result?.data?.json;
}

async function readCache(): Promise<DashboardSnapshot | null> {
  const raw = await AsyncStorage.getItem(CACHE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as DashboardSnapshot;
    if ((!parsed.metrics?.some((metric) => metric.value) && !parsed.news?.length && !parsed.quote) || (parsed.quote && !normalizeVerifiedQuote(parsed.quote))) {
      await AsyncStorage.removeItem(CACHE_KEY);
      return null;
    }
    return { ...parsed, countdown: buildCountdown(), source: 'cache', governmentMetrics: parsed.governmentMetrics ?? [], news: parsed.news ?? [], quote: parsed.quote ?? null, notifications: parsed.notifications ?? [], apiStatus: parsed.apiStatus ?? { fred: null, newsApi: null, quotesApi: null, dataGov: null } };
  } catch { await AsyncStorage.removeItem(CACHE_KEY); return null; }
}

export async function getDashboardSnapshot(): Promise<DashboardSnapshot> {
  try {
    const snapshot = normalizeDashboardPayload(await requestEnvelope('dashboard.getDashboardData'));
    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(snapshot));
    return snapshot;
  } catch (error) {
    const cached = await readCache();
    if (cached) return cached;
    throw error instanceof Error ? error : new Error('Неможливо отримати дані TrumpWatch.');
  }
}

export async function getCachedDashboardSnapshot(): Promise<DashboardSnapshot> {
  const cached = await readCache();
  return cached ?? { countdown: buildCountdown(), metrics: [], governmentMetrics: [], news: [], quote: null, notifications: [], apiStatus: { fred: null, newsApi: null, quotesApi: null, dataGov: null }, updatedAt: new Date().toISOString(), source: 'cache' };
}

export async function getNewsArticles(searchQuery = ''): Promise<NewsArticle[]> {
  const result = await requestJson('dashboard.getNews', { limit: 20, ...(searchQuery ? { searchQuery } : {}) });
  return Array.isArray(result) ? result as NewsArticle[] : [];
}

export async function refreshQuote(): Promise<QuoteRefreshResult> {
  try {
    const response = await fetch(`${DASHBOARD_API_BASE_URL}/api/trpc/dashboard.refreshQuote`, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify({ json: null }) });
    if (!response.ok) throw new Error(`Сервер повернув помилку ${response.status}.`);
    const result = extractQuoteRefreshResult(await response.json());
    if (result.quote) return result;
  } catch {
    // A GET fallback below preserves the last server-verified quote whenever a mutation request is interrupted.
  }

  const cachedQuote = normalizeVerifiedQuote(await requestJson('dashboard.getRandomQuote'));
  return { quote: cachedQuote, refreshed: false };
}

export async function reportBrokenLink(articleId: number, articleUrl: string): Promise<void> {
  const response = await fetch(`${DASHBOARD_API_BASE_URL}/api/trpc/dashboard.reportBrokenLink`, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify({ json: { articleId, articleUrl, comment: 'Reported from the Android app.' } }) });
  if (!response.ok) throw new Error('Не вдалося надіслати повідомлення.');
}

export function getEconomicHighlights(snapshot: DashboardSnapshot): MetricCard[] { return snapshot.metrics; }
