export type MetricCard = {
  key: string;
  label: string;
  value: string | null;
  unit: string | null;
  date: string | null;
};

export type GovernmentMetric = {
  key: string;
  name: string;
  value: string;
  unit: string | null;
  date: string;
  sourceUrl: string | null;
};

export type NewsArticle = {
  id: number;
  title: string;
  description: string | null;
  url: string;
  source: string;
  author: string | null;
  publishedAt: string | null;
  summary: string | null;
};

export type TrumpQuote = {
  id: number;
  quoteText: string;
  source: string | null;
  date: string | null;
};

export type QuoteRefreshResult = {
  quote: TrumpQuote | null;
  refreshed: boolean;
};

export type ApiHealth = {
  status: 'healthy' | 'degraded' | 'failed' | string;
  errorMessage?: string | null;
  lastSuccessfulFetch?: string | null;
};

export type DashboardNotification = {
  id: number;
  title: string;
  message: string;
  type?: string | null;
  createdAt: string;
};

export type DashboardSnapshot = {
  countdown: { daysRemaining: number | null; hoursRemaining: number | null; minutesRemaining: number | null };
  metrics: MetricCard[];
  governmentMetrics: GovernmentMetric[];
  news: NewsArticle[];
  quote: TrumpQuote | null;
  notifications: DashboardNotification[];
  apiStatus: { fred: ApiHealth | null; newsApi: ApiHealth | null; quotesApi: ApiHealth | null; dataGov: ApiHealth | null };
  updatedAt: string;
  source: 'live' | 'cache';
};

type RawMetric = {
  title?: string;
  seriesName?: string;
  value?: number | string | null;
  units?: string | null;
  unit?: string | null;
  observationDate?: string | Date | null;
  date?: string | Date | null;
  lastUpdated?: string | Date | null;
};

const TARGET_DATE = new Date('2029-01-20T17:00:00.000Z');

export function buildCountdown(now = Date.now()) {
  const remaining = Math.max(0, TARGET_DATE.getTime() - now);
  const totalMinutes = Math.floor(remaining / 60000);
  return {
    daysRemaining: Math.floor(totalMinutes / (60 * 24)),
    hoursRemaining: Math.floor((totalMinutes % (60 * 24)) / 60),
    minutesRemaining: totalMinutes % 60,
  };
}

function formatMetricValue(value: RawMetric['value']) {
  if (value === null || value === undefined || value === '') return null;
  const numericValue = Number(value);
  if (Number.isFinite(numericValue)) {
    return numericValue.toLocaleString('en-US', { maximumFractionDigits: 2 });
  }
  return String(value);
}

function metricFor(metrics: Record<string, RawMetric[]> | undefined, key: string, label: string): MetricCard {
  const metric = [...(metrics?.[key] ?? [])].sort((left, right) => {
    const leftDate = new Date(left.date ?? left.observationDate ?? left.lastUpdated ?? 0).getTime();
    const rightDate = new Date(right.date ?? right.observationDate ?? right.lastUpdated ?? 0).getTime();
    return rightDate - leftDate;
  })[0];
  return {
    key,
    label: metric?.seriesName || metric?.title || label,
    value: formatMetricValue(metric?.value),
    unit: metric?.unit || metric?.units || null,
    date: metric?.date || metric?.observationDate ? String(metric?.date ?? metric?.observationDate).slice(0, 10) : null,
  };
}

function normalizeNews(rawNews: unknown): NewsArticle[] {
  if (!Array.isArray(rawNews)) return [];
  return rawNews
    .filter((article): article is Record<string, unknown> => Boolean(article && typeof article === 'object'))
    .filter((article) => typeof article.title === 'string' && typeof article.url === 'string')
    .map((article) => ({
      id: Number(article.id), title: String(article.title), description: typeof article.description === 'string' ? article.description : null,
      url: String(article.url), source: typeof article.source === 'string' ? article.source : 'Unknown source',
      author: typeof article.author === 'string' ? article.author : null,
      publishedAt: article.publishedAt ? String(article.publishedAt) : null,
      summary: typeof article.summary === 'string' ? article.summary : null,
    }));
}

function normalizeGovernmentMetrics(rawMetrics: unknown): GovernmentMetric[] {
  if (!Array.isArray(rawMetrics)) return [];
  return rawMetrics
    .filter((metric): metric is Record<string, unknown> => Boolean(metric && typeof metric === 'object'))
    .filter((metric) => typeof metric.metricName === 'string' && metric.value !== undefined)
    .map((metric) => ({
      key: String(metric.metricKey ?? metric.id ?? metric.metricName), name: String(metric.metricName), value: formatMetricValue(metric.value as string) ?? '—',
      unit: typeof metric.unit === 'string' ? metric.unit : null, date: typeof metric.date === 'string' ? metric.date : '',
      sourceUrl: typeof metric.sourceUrl === 'string' ? metric.sourceUrl : null,
    }));
}

function normalizeNotifications(rawNotifications: unknown): DashboardNotification[] {
  if (!Array.isArray(rawNotifications)) return [];
  return rawNotifications
    .filter((item): item is Record<string, unknown> => Boolean(item && typeof item === 'object'))
    .filter((item) => typeof item.title === 'string' && typeof item.message === 'string')
    .map((item, index) => ({
      id: Number(item.id ?? index), title: String(item.title), message: String(item.message),
      type: typeof item.type === 'string' ? item.type : null, createdAt: item.createdAt ? String(item.createdAt) : new Date().toISOString(),
    }));
}

const TECHNICAL_QUOTE_PATTERN = /^(?:recovery quote text\.?|fallback quote\.?|sample quote\.?|placeholder quote\.?)$/i;

export function normalizeVerifiedQuote(rawQuote: unknown): TrumpQuote | null {
  if (!rawQuote || typeof rawQuote !== 'object') return null;
  const quote = rawQuote as Record<string, unknown>;
  if (typeof quote.quoteText !== 'string') return null;
  const quoteText = quote.quoteText.trim();
  if (!quoteText || TECHNICAL_QUOTE_PATTERN.test(quoteText)) return null;
  return { id: Number(quote.id ?? 0), quoteText, source: typeof quote.source === 'string' ? quote.source : null, date: typeof quote.date === 'string' ? quote.date : null };
}

export function normalizeDashboardPayload(payload: unknown, now = Date.now()): DashboardSnapshot {
  const envelope = payload as { result?: { data?: { json?: Record<string, unknown> } } };
  const data = envelope.result?.data?.json;
  if (!data || typeof data !== 'object' || Object.keys(data).length === 0) {
    throw new Error('Сервер повернув неповну відповідь дашборду.');
  }
  const statuses = (data.apiStatus ?? {}) as Record<string, ApiHealth | null>;
  return {
    countdown: buildCountdown(now),
    metrics: [metricFor(data.metrics as Record<string, RawMetric[]> | undefined, 'UNRATE', 'Рівень безробіття'), metricFor(data.metrics as Record<string, RawMetric[]> | undefined, 'CPIAUCSL', 'Індекс споживчих цін'), metricFor(data.metrics as Record<string, RawMetric[]> | undefined, 'GDPC1', 'Реальний ВВП'), metricFor(data.metrics as Record<string, RawMetric[]> | undefined, 'DGS10', 'Дохідність казначейських облігацій')],
    governmentMetrics: normalizeGovernmentMetrics(data.governmentMetrics), news: normalizeNews(data.news), quote: normalizeVerifiedQuote(data.quote), notifications: normalizeNotifications(data.notifications),
    apiStatus: { fred: statuses.fred ?? null, newsApi: statuses.newsApi ?? null, quotesApi: statuses.quotesApi ?? null, dataGov: statuses.dataGov ?? null },
    updatedAt: new Date(now).toISOString(), source: 'live',
  };
}

export function extractQuoteRefreshResult(payload: unknown): QuoteRefreshResult {
  const envelope = payload as {
    result?: { data?: { json?: { quote?: TrumpQuote | null; refreshed?: boolean } } };
  };
  const result = envelope.result?.data?.json;
  return { quote: normalizeVerifiedQuote(result?.quote), refreshed: result?.refreshed === true };
}
