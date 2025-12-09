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

export interface ApprovalData {
  approve: number;
  disapprove: number;
  monthChange: number | null;
  pollDate: string;
  pollster: string;
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

export interface DashboardState {
  debt: DebtData | null;
  eoCount: number | null;
  quotes: QuoteData[];
  currentQuoteIndex: number;
  gasPrice: GasPriceData | null;
  approvalRating: ApprovalData | null;
  golfDays: number;
  truthPostsCount: number | null;
  loading: boolean;
  error: string | null;
}
