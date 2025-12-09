export interface DebtData {
  total_debt: number;
  record_date: string;
  baseline_debt: number;
}

export interface QuoteData {
  value: string;
  appeared_at: string;
  source_url?: string;
}

export interface TruthPost {
  id: string;
  content: string;
  created_at: string;
  stats?: {
    replies_count: number;
    reblogs_count: number;
    favourites_count: number;
  };
  media_attachments?: Array<{
    type: string;
    url: string;
  }>;
}

export interface CountdownTime {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  totalDaysInTerm: number;
  daysPassed: number;
  percentageComplete: number;
}

export interface GasData {
  current_price: number;
  baseline_price: number;
  change: number;
}

export interface SP500Data {
  value: number;
  change: number;
  changePercent: number;
}

export interface BitcoinData {
  value: number;
  change: number;
  changePercent: number;
}

export interface GoldData {
  value: number;
  change: number;
}

export interface UnemploymentData {
  value: number;
  change: number;
}

export interface InflationData {
  value: number;
  change: number;
}

export interface DashboardState {
  debt: DebtData | null;
  gas: GasData | null;
  eoCount: number | null;
  sp500: SP500Data | null;
  bitcoin: BitcoinData | null;
  gold: GoldData | null;
  unemployment: UnemploymentData | null;
  inflation: InflationData | null;
  quotes: QuoteData[];
  latestPost: TruthPost | null;
  loading: boolean;
  error: string | null;
}