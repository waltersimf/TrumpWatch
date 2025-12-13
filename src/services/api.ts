import { DebtData, QuoteData, TruthPost } from '../types';

// ============ CONSTANTS ============
const TERM_START_DATE = '2025-01-20';

// Baselines (official data from Jan 20, 2025)
const GAS_BASELINE_JAN20 = 3.08;      // EIA weekly data
const SP500_BASELINE_JAN20 = 5996.66; // S&P 500 close on Jan 17, 2025
const BITCOIN_BASELINE_JAN20 = 101000; // ~$101k on inauguration
const GOLD_BASELINE_JAN20 = 2750;      // Gold price Jan 2025
const UNEMPLOYMENT_BASELINE_JAN20 = 4.0; // BLS January 2025
const INFLATION_BASELINE_JAN20 = 2.9;   // CPI January 2025

// API Endpoints
const TREASURY_API = 'https://api.fiscaldata.treasury.gov/services/api/fiscal_service/v2/accounting/od/debt_to_penny';
const FEDERAL_REGISTER_API = 'https://www.federalregister.gov/api/v1/documents.json';
const QUOTE_API = 'https://api.tronalddump.io/random/quote';
const EIA_GAS_API = 'https://api.eia.gov/v2/petroleum/pri/gnd/data/';
const COINGECKO_API = 'https://api.coingecko.com/api/v3/simple/price';
const METALS_API = 'https://api.metals.dev/v1/latest';

// ============ TYPES ============
export interface GasData {
  current_price: number;
  baseline_price: number;
  change: number;
}

export interface MarketData {
  sp500: { value: number; change: number; changePercent: number };
  bitcoin: { value: number; change: number; changePercent: number };
  gold: { value: number; change: number };
}

export interface EconomicData {
  unemployment: { value: number; change: number };
  inflation: { value: number; change: number };
}

// ============ NATIONAL DEBT ============
export const fetchNationalDebt = async (): Promise<DebtData> => {
  try {
    // Fetch latest
    const latestRes = await fetch(`${TREASURY_API}?sort=-record_date&limit=1`);
    const latestJson = await latestRes.json();
    
    // Fetch baseline (Jan 20, 2025)
    const baselineRes = await fetch(`${TREASURY_API}?filter=record_date:gte:${TERM_START_DATE}&sort=record_date&limit=1`);
    const baselineJson = await baselineRes.json();

    const current = parseFloat(latestJson.data[0]?.tot_pub_debt_out_amt || '0');
    const baseline = parseFloat(baselineJson.data[0]?.tot_pub_debt_out_amt || current.toString());

    return {
      total_debt: current,
      record_date: latestJson.data[0]?.record_date,
      baseline_debt: baseline
    };
  } catch (error) {
    console.error("Error fetching debt:", error);
    throw new Error("Failed to load Treasury data");
  }
};

// ============ GAS PRICE ============
export const fetchGasPrice = async (): Promise<GasData> => {
  try {
    // EIA API - weekly retail gas prices
    const url = `${EIA_GAS_API}?api_key=DEMO_KEY&frequency=weekly&data[0]=value&facets[product][]=EPM0&facets[duoarea][]=NUS&sort[0][column]=period&sort[0][direction]=desc&length=1`;
    
    const res = await fetch(url);
    const json = await res.json();
    
    const currentPrice = parseFloat(json.response?.data?.[0]?.value || '0');
    
    // If API returns valid data
    if (currentPrice > 0) {
      return {
        current_price: currentPrice,
        baseline_price: GAS_BASELINE_JAN20,
        change: parseFloat((currentPrice - GAS_BASELINE_JAN20).toFixed(2))
      };
    }
    
    throw new Error('Invalid gas price data');
  } catch (error) {
    console.warn("EIA API failed, using fallback:", error);
    // Fallback to realistic current price
    const fallbackPrice = 2.95;
    return {
      current_price: fallbackPrice,
      baseline_price: GAS_BASELINE_JAN20,
      change: parseFloat((fallbackPrice - GAS_BASELINE_JAN20).toFixed(2))
    };
  }
};

// ============ EXECUTIVE ORDERS ============
export const fetchExecutiveOrdersCount = async (): Promise<number> => {
  try {
    const url = `${FEDERAL_REGISTER_API}?conditions[presidential_document_type]=executive_order&conditions[president]=donald-trump&conditions[publication_date][gte]=${TERM_START_DATE}`;
    const res = await fetch(url);
    const json = await res.json();
    return json.count || 0;
  } catch (error) {
    console.error("Error fetching EOs:", error);
    return 0;
  }
};

// ============ S&P 500 ============
export const fetchSP500 = async (): Promise<{ value: number; change: number; changePercent: number }> => {
  try {
    // Yahoo Finance API for SPY ETF (tracks S&P 500)
    const res = await fetch('https://query1.finance.yahoo.com/v8/finance/chart/SPY?interval=1d&range=1d');
    const json = await res.json();
    
    const quote = json.chart?.result?.[0]?.meta;
    const currentPrice = quote?.regularMarketPrice || 0;
    const previousClose = quote?.previousClose || currentPrice;
    
    // SPY trades at ~1/10th of S&P 500, so multiply by 10 for approximate index value
    const sp500Value = currentPrice * 10;
    const dailyChange = (currentPrice - previousClose) * 10;
    const dailyChangePercent = previousClose > 0 ? ((currentPrice - previousClose) / previousClose) * 100 : 0;
    
    return {
      value: Math.round(sp500Value * 100) / 100,
      change: Math.round(dailyChange * 100) / 100,
      changePercent: Math.round(dailyChangePercent * 100) / 100
    };
  } catch (error) {
    console.error("Error fetching S&P 500:", error);
    // Fallback
    return { value: 5950, change: 0, changePercent: 0 };
  }
};

// ============ BITCOIN ============
export const fetchBitcoin = async (): Promise<{ value: number; change: number; changePercent: number }> => {
  try {
    const res = await fetch(`${COINGECKO_API}?ids=bitcoin&vs_currencies=usd&include_24hr_change=true`);
    const json = await res.json();
    
    const currentPrice = json.bitcoin?.usd || 0;
    const change24h = json.bitcoin?.usd_24h_change || 0;
    
    return {
      value: Math.round(currentPrice),
      change: Math.round(currentPrice - BITCOIN_BASELINE_JAN20),
      changePercent: Math.round(change24h * 100) / 100
    };
  } catch (error) {
    console.error("Error fetching Bitcoin:", error);
    return { value: 100000, change: 0, changePercent: 0 };
  }
};

// ============ GOLD ============
export const fetchGold = async (): Promise<{ value: number; change: number }> => {
  try {
    // Try metals.dev API
    const res = await fetch(`${METALS_API}?api_key=demo&base=USD&currencies=XAU`);
    const json = await res.json();
    
    // XAU is price per troy ounce
    const goldPrice = json.rates?.XAU ? (1 / json.rates.XAU) : 0;
    
    if (goldPrice > 0) {
      return {
        value: Math.round(goldPrice),
        change: Math.round(goldPrice - GOLD_BASELINE_JAN20)
      };
    }
    throw new Error('Invalid gold data');
  } catch (error) {
    console.warn("Gold API failed, trying alternative:", error);
    
    // Fallback: try to get from a different source or use cached value
    try {
      const fallbackRes = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=tether-gold&vs_currencies=usd');
      const fallbackJson = await fallbackRes.json();
      const goldPrice = fallbackJson['tether-gold']?.usd || 2650;
      
      return {
        value: Math.round(goldPrice),
        change: Math.round(goldPrice - GOLD_BASELINE_JAN20)
      };
    } catch {
      return { value: 2650, change: 0 };
    }
  }
};

// ============ UNEMPLOYMENT (BLS) ============
export const fetchUnemployment = async (): Promise<{ value: number; change: number }> => {
  try {
    // BLS API - Unemployment Rate (Series LNS14000000)
    const currentYear = new Date().getFullYear();
    const res = await fetch('https://api.bls.gov/publicAPI/v2/timeseries/data/LNS14000000', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        seriesid: ['LNS14000000'],
        startyear: currentYear.toString(),
        endyear: currentYear.toString()
      })
    });
    
    const json = await res.json();
    const data = json.Results?.series?.[0]?.data;
    
    if (data && data.length > 0) {
      // Latest month's unemployment rate
      const latestRate = parseFloat(data[0].value);
      return {
        value: latestRate,
        change: parseFloat((latestRate - UNEMPLOYMENT_BASELINE_JAN20).toFixed(1))
      };
    }
    throw new Error('No unemployment data');
  } catch (error) {
    console.error("Error fetching unemployment:", error);
    // Fallback to recent known value
    return { value: 4.1, change: 0.1 };
  }
};

// ============ INFLATION / CPI (BLS) ============
export const fetchInflation = async (): Promise<{ value: number; change: number }> => {
  try {
    // BLS API - CPI (Series CUUR0000SA0)
    const currentYear = new Date().getFullYear();
    const res = await fetch('https://api.bls.gov/publicAPI/v2/timeseries/data/CUUR0000SA0', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        seriesid: ['CUUR0000SA0'],
        startyear: (currentYear - 1).toString(),
        endyear: currentYear.toString()
      })
    });
    
    const json = await res.json();
    const data = json.Results?.series?.[0]?.data;
    
    if (data && data.length >= 13) {
      // Calculate year-over-year inflation
      const currentCPI = parseFloat(data[0].value);
      const yearAgoCPI = parseFloat(data[12].value);
      const yoyInflation = ((currentCPI - yearAgoCPI) / yearAgoCPI) * 100;
      
      return {
        value: parseFloat(yoyInflation.toFixed(1)),
        change: parseFloat((yoyInflation - INFLATION_BASELINE_JAN20).toFixed(1))
      };
    }
    throw new Error('No inflation data');
  } catch (error) {
    console.error("Error fetching inflation:", error);
    return { value: 2.9, change: 0 };
  }
};

// ============ RANDOM QUOTE ============
export const fetchRandomQuote = async (): Promise<QuoteData> => {
  try {
    const res = await fetch(QUOTE_API, {
      headers: { 'Accept': 'application/json' }
    });
    if (!res.ok) throw new Error('Quote API failed');
    const json = await res.json();
    return {
      value: json.value,
      appeared_at: json.appeared_at,
      source_url: json._embedded?.source?.[0]?.url
    };
  } catch (error) {
    console.error("Error fetching quote:", error);
    return {
      value: "I will fight for you with every breath in my body - and I will never, ever let you down.",
      appeared_at: "2017-01-20"
    };
  }
};

// ============ FETCH MULTIPLE QUOTES ============
export const fetchMultipleQuotes = async (count: number = 5): Promise<QuoteData[]> => {
  const quotes: QuoteData[] = [];
  const uniqueValues = new Set<string>();
  
  for (let i = 0; i < count + 3; i++) { // Fetch extra in case of duplicates
    try {
      const quote = await fetchRandomQuote();
      if (!uniqueValues.has(quote.value)) {
        uniqueValues.add(quote.value);
        quotes.push(quote);
      }
      if (quotes.length >= count) break;
    } catch {
      continue;
    }
  }
  
  // Fallback quotes if API fails
  const fallbackQuotes: QuoteData[] = [
    { value: "Despite the constant negative press covfefe", appeared_at: "2017-05-31" },
    { value: "I will build a great wall – and nobody builds walls better than me, believe me.", appeared_at: "2015-06-16" },
    { value: "I have the best words.", appeared_at: "2015-12-30" },
    { value: "I'm, like, a really smart person.", appeared_at: "2016-01-18" },
    { value: "I think I am, actually humble. I think I'm much more humble than you would understand.", appeared_at: "2016-07-17" },
  ];
  
  while (quotes.length < count) {
    const fallback = fallbackQuotes[quotes.length % fallbackQuotes.length];
    if (!uniqueValues.has(fallback.value)) {
      quotes.push(fallback);
      uniqueValues.add(fallback.value);
    } else {
      break;
    }
  }
  
  return quotes;
};

// ============ TRUTH SOCIAL (Archived - no longer updating) ============
export const fetchLatestTruth = async (): Promise<TruthPost | null> => {
  // Truth Social archive was discontinued Oct 26, 2025
  // Return null to hide this section or show placeholder
  return null;
};

// ============ FETCH ALL DATA ============
export const fetchAllData = async () => {
  const [debt, gas, eoCount, sp500, bitcoin, gold, unemployment, inflation, quotes] = await Promise.allSettled([
    fetchNationalDebt(),
    fetchGasPrice(),
    fetchExecutiveOrdersCount(),
    fetchSP500(),
    fetchBitcoin(),
    fetchGold(),
    fetchUnemployment(),
    fetchInflation(),
    fetchMultipleQuotes(7)
  ]);

  return {
    debt: debt.status === 'fulfilled' ? debt.value : null,
    gas: gas.status === 'fulfilled' ? gas.value : null,
    eoCount: eoCount.status === 'fulfilled' ? eoCount.value : 0,
    sp500: sp500.status === 'fulfilled' ? sp500.value : null,
    bitcoin: bitcoin.status === 'fulfilled' ? bitcoin.value : null,
    gold: gold.status === 'fulfilled' ? gold.value : null,
    unemployment: unemployment.status === 'fulfilled' ? unemployment.value : null,
    inflation: inflation.status === 'fulfilled' ? inflation.value : null,
    quotes: quotes.status === 'fulfilled' ? quotes.value : []
  };
};