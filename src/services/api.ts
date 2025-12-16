import { 
  DebtData, 
  QuoteData, 
  TruthPost, 
  GasData, 
  SP500Data, 
  BitcoinData, 
  GoldData, 
  UnemploymentData, 
  InflationData 
} from '../types';

// ============ CONSTANTS ============
const TERM_START_DATE = '2025-01-20';
const GAS_BASELINE_JAN20 = 3.08;
const BITCOIN_BASELINE_JAN20 = 101000;
const GOLD_BASELINE_JAN20 = 2750;
const FRED_API_KEY = '82376aa22a515252bb9e18ddd772b3e0';

// API Endpoints
const TREASURY_API = 'https://api.fiscaldata.treasury.gov/services/api/fiscal_service/v2/accounting/od/debt_to_penny';
const FEDERAL_REGISTER_API = 'https://www.federalregister.gov/api/v1/documents.json';
const QUOTE_API = 'https://api.tronalddump.io/random/quote';
const EIA_GAS_API = 'https://api.eia.gov/v2/petroleum/pri/gnd/data/';

// ============ FETCH FUNCTIONS ============

export const fetchNationalDebt = async (): Promise<DebtData> => {
  const latestRes = await fetch(`${TREASURY_API}?sort=-record_date&limit=1`);
  const latestJson = await latestRes.json();
  
  const baselineRes = await fetch(`${TREASURY_API}?filter=record_date:gte:${TERM_START_DATE}&sort=record_date&limit=1`);
  const baselineJson = await baselineRes.json();

  const current = parseFloat(latestJson.data[0]?.tot_pub_debt_out_amt || '0');
  const baseline = parseFloat(baselineJson.data[0]?.tot_pub_debt_out_amt || current.toString());

  return {
    total_debt: current,
    record_date: latestJson.data[0]?.record_date,
    baseline_debt: baseline
  };
};

export const fetchGasPrice = async (): Promise<GasData> => {
  try {
    const url = `${EIA_GAS_API}?api_key=DEMO_KEY&frequency=weekly&data[0]=value&facets[product][]=EPM0&facets[duoarea][]=NUS&sort[0][column]=period&sort[0][direction]=desc&length=1`;
    const res = await fetch(url);
    const json = await res.json();
    const currentPrice = parseFloat(json.response?.data?.[0]?.value || '0');

    if (currentPrice > 0) {
      return {
        current_price: currentPrice,
        baseline_price: GAS_BASELINE_JAN20,
        change: currentPrice - GAS_BASELINE_JAN20 
      };
    }
    throw new Error('Invalid gas data');
  } catch (e) {
    return {
      current_price: 2.95,
      baseline_price: GAS_BASELINE_JAN20,
      change: -0.13
    };
  }
};

export const fetchExecutiveOrdersCount = async (): Promise<number> => {
  try {
    const url = `${FEDERAL_REGISTER_API}?conditions[presidential_document_type]=executive_order&conditions[president]=donald-trump&conditions[publication_date][gte]=${TERM_START_DATE}`;
    const res = await fetch(url);
    const json = await res.json();
    return json.count || 0;
  } catch {
    return 0;
  }
};

export const fetchSP500 = async (): Promise<SP500Data> => {
  try {
    const res = await fetch(`https://api.stlouisfed.org/fred/series/observations?series_id=SP500&api_key=${FRED_API_KEY}&file_type=json&limit=2&sort_order=desc`);
    const json = await res.json();
    const current = parseFloat(json.observations?.[0]?.value || '0');
    const prev = parseFloat(json.observations?.[1]?.value || current.toString());
    const changePercent = prev > 0 ? ((current - prev) / prev) * 100 : 0;
    return {
      value: current,
      change: current - prev,
      changePercent: changePercent
    };
  } catch {
    return { value: 5950, change: 0, changePercent: 0 };
  }
};

export const fetchBitcoin = async (): Promise<BitcoinData> => {
  try {
    const res = await fetch('https://api.binance.com/api/v3/ticker/24hr?symbol=BTCUSDT');
    const json = await res.json();
    const price = parseFloat(json.lastPrice) || 0;
    const changePercent = parseFloat(json.priceChangePercent) || 0;
    return {
      value: price,
      change: price - BITCOIN_BASELINE_JAN20,
      changePercent: changePercent
    };
  } catch {
    return { value: 100000, change: 0, changePercent: 0 };
  }
};

export const fetchGold = async (): Promise<GoldData> => {
  try {
    const res = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=tether-gold&vs_currencies=usd&include_24hr_change=true');
    const json = await res.json();
    const goldPrice = json['tether-gold']?.usd || 2650;
    const change = json['tether-gold']?.usd_24h_change || 0;
    return {
      value: goldPrice,
      change: goldPrice - GOLD_BASELINE_JAN20,
      changePercent: change
    };
  } catch {
    return { value: 2650, change: 0, changePercent: 0 };
  }
};

export const fetchUnemployment = async (): Promise<UnemploymentData> => {
  try {
    const res = await fetch(`https://api.stlouisfed.org/fred/series/observations?series_id=UNRATE&api_key=${FRED_API_KEY}&file_type=json&limit=2&sort_order=desc`);
    const json = await res.json();
    const current = parseFloat(json.observations?.[0]?.value || '0');
    const prev = parseFloat(json.observations?.[1]?.value || current.toString());
    return { value: current, change: current - prev };
  } catch {
    return { value: 4.2, change: 0 };
  }
};

export const fetchInflation = async (): Promise<InflationData> => {
  try {
    const res = await fetch(`https://api.stlouisfed.org/fred/series/observations?series_id=CPIAUCSL&api_key=${FRED_API_KEY}&file_type=json&limit=14&sort_order=desc`);
    const json = await res.json();
    const current = parseFloat(json.observations?.[0]?.value || '0');
    const yearAgo = parseFloat(json.observations?.[12]?.value || current.toString());
    const rate = ((current - yearAgo) / yearAgo) * 100;
    
    const prevMonth = parseFloat(json.observations?.[1]?.value || '0');
    const prevYearAgo = parseFloat(json.observations?.[13]?.value || prevMonth.toString());
    const prevRate = ((prevMonth - prevYearAgo) / prevYearAgo) * 100;
    
    return { value: rate, change: rate - prevRate };
  } catch {
    return { value: 2.7, change: 0 };
  }
};

export const fetchRandomQuote = async (): Promise<QuoteData> => {
  try {
    const res = await fetch(QUOTE_API, { headers: { 'Accept': 'application/json' } });
    if (!res.ok) throw new Error('Quote failed');
    const json = await res.json();
    return { value: json.value, appeared_at: json.appeared_at, source_url: json._embedded?.source?.[0]?.url };
  } catch {
    return { value: "I will fight for you with every breath in my body.", appeared_at: "2017-01-20" };
  }
};

export const fetchMultipleQuotes = async (count: number = 5): Promise<QuoteData[]> => {
  const quotes: QuoteData[] = [];
  for (let i = 0; i < count; i++) {
    quotes.push(await fetchRandomQuote());
  }
  return quotes;
};

export const fetchLatestTruth = async (): Promise<TruthPost | null> => {
  return null;
};