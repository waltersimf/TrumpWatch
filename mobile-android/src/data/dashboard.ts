import AsyncStorage from '@react-native-async-storage/async-storage';
import { buildCountdown, normalizeDashboardPayload, normalizeVerifiedQuote, type DashboardSnapshot } from './transform';
import { PRODUCTION_BASE_URL } from '../config/production';

export type { DashboardSnapshot, MetricCard } from './transform';

// Bump this whenever the live dashboard contract is repaired so an existing
// installation never reuses an incomplete cached response from an older APK.
const CACHE_KEY = 'trumpwatch.dashboard.snapshot.v5';
const DASHBOARD_API_BASE_URL = PRODUCTION_BASE_URL;

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
