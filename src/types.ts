export interface DebtData {
  total_debt: number;
  record_date: string;
  baseline_debt: number;
}

export interface QuoteData {
  value: string;
  appeared_at: string;
  source_url?: string;
  source?: string;
}

export interface GasPriceData {
  price: number;
  baseline_price: number;
  date: string;
}

export interface SP500Data {
  price: number;
  change: number;
  changePercent: number;
}

export interface UnemploymentData {
  rate: number;
  date: string;
}

export interface InflationData {
  rate: number;
  date: string;
}

export interface BitcoinData {
  price: number;
  change24h: number;
}

export interface GoldData {
  price: number;
  date: string;
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

export interface DashboardState {
  debt: DebtData | null;
  eoCount: number | null;
  quotes: QuoteData[];
  currentQuoteIndex: number;
  gasPrice: GasPriceData | null;
  sp500: SP500Data | null;
  unemployment: UnemploymentData | null;
  inflation: InflationData | null;
  bitcoin: BitcoinData | null;
  gold: GoldData | null;
  loading: boolean;
  error: string | null;
}
