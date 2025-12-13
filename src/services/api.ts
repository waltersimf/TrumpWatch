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

// API Endpoints
const TREASURY_API = 'https://api.fiscaldata.treasury.gov/services/api/fiscal_service/v2/accounting/od/debt_to_penny';
const FEDERAL_REGISTER_API = 'https://www.federalregister.gov/api/v1/documents.json';
const QUOTE_API = 'https://api.tronalddump.io/random/quote';
const EIA_GAS_API = 'https://api.eia.gov/v2/petroleum/pri/gnd/data/';
const COINGECKO_API = 'https://api.coingecko.com/api/v3/simple/price';
const METALS_API = 'https://api.metals.dev/v1/latest';

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
    const res = await fetch('https://query1.finance.yahoo.com/v8/finance/chart/SPY?interval=1d&range=1d');
    const json = await res.json();
    const quote = json.chart?.result?.[0]?.meta;
    const currentPrice = (quote?.regularMarketPrice || 0) * 10;
    const previousClose = (quote?.previousClose || currentPrice) * 10;
    
    return {
      value: currentPrice,
      change: currentPrice - previousClose,
      changePercent: ((currentPrice - previousClose) / previousClose) * 100
    };
  } catch {
    return { value: 5950, change: 0, changePercent: 0 };
  }
};

export const fetchBitcoin = async (): Promise<BitcoinData> => {
  try {
    const res = await fetch(`${COINGECKO_API}?ids=bitcoin&vs_currencies=usd&include_24hr_change=true`);
    const json = await res.json();
    return {
      value: json.bitcoin?.usd || 0,
      change: (json.bitcoin?.usd || 0) - BITCOIN_BASELINE_JAN20,
      changePercent: json.bitcoin?.usd_24h_change || 0
    };
  } catch {
    return { value: 100000, change: 0, changePercent: 0 };
  }
};

export const fetchGold = async (): Promise<GoldData> => {
  try {
    const res = await fetch(`${METALS_API}?api_key=demo&base=USD&currencies=XAU`);
    const json = await res.json();
    const goldPrice = json.rates?.XAU ? (1 / json.rates.XAU) : 2650;
    return {
      value: goldPrice,
      change: goldPrice - GOLD_BASELINE_JAN20,
      changePercent: 0
    };
  } catch {
    return { value: 2650, change: 0, changePercent: 0 };
  }
};

export const fetchUnemployment = async (): Promise<UnemploymentData> => {
  // Mock data implies change is 0 or undefined (optional in updated types)
  return { value: 4.1, change: 0 };
};

export const fetchInflation = async (): Promise<InflationData> => {
  return { value: 2.9, change: 0 };
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