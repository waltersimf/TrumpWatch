import { DebtData, QuoteData, GasPriceData, SP500Data, UnemploymentData, InflationData, BitcoinData, GoldData } from '../types';

// Constants
const TERM_START_DATE = '2025-01-20';
const TREASURY_API = 'https://api.fiscaldata.treasury.gov/services/api/fiscal_service/v2/accounting/od/debt_to_penny';
const FEDERAL_REGISTER_API = 'https://www.federalregister.gov/api/v1/documents.json';
const QUOTE_API = 'https://api.tronalddump.io';
const GAS_PRICE_API = 'https://api.eia.gov/v2/petroleum/pri/gnd/data/';
const FRED_API = 'https://api.stlouisfed.org/fred/series/observations';
const FRED_API_KEY = '82376aa22a515252bb9e18ddd772b3e0';
const COINGECKO_API = 'https://api.coingecko.com/api/v3/simple/price';
const METALS_API = 'https://api.metals.dev/v1/latest';

// Fallback quotes if API fails
const FALLBACK_QUOTES: QuoteData[] = [
  {
    value: "I know words. I have the best words.",
    appeared_at: "2015-12-30",
    source: "Campaign Rally, 2015"
  },
  {
    value: "I will fight for you with every breath in my body - and I will never, ever let you down.",
    appeared_at: "2017-01-20",
    source: "Inauguration Speech, 2017"
  },
  {
    value: "We will make America great again!",
    appeared_at: "2015-06-16",
    source: "Campaign Announcement, 2015"
  },
  {
    value: "Despite the constant negative press covfefe",
    appeared_at: "2017-05-31",
    source: "Twitter, 2017"
  },
  {
    value: "I think I am, actually humble. I think I'm much more humble than you would understand.",
    appeared_at: "2016-07-17",
    source: "60 Minutes Interview, 2016"
  },
  {
    value: "Part of the beauty of me is that I am very rich.",
    appeared_at: "2011-03-17",
    source: "Good Morning America, 2011"
  },
  {
    value: "I have never seen a thin person drinking Diet Coke.",
    appeared_at: "2012-10-14",
    source: "Twitter, 2012"
  }
];

export const fetchNationalDebt = async (): Promise<DebtData> => {
  try {
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
  } catch (error) {
    console.error("Error fetching debt:", error);
    throw new Error("Failed to load Treasury data");
  }
};

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

export const fetchMultipleQuotes = async (count: number = 7): Promise<QuoteData[]> => {
  const quotes: QuoteData[] = [];

  try {
    const searchRes = await fetch(`${QUOTE_API}/search/quote?query=the&page=0&size=${count}`, {
      headers: { 'Accept': 'application/json' }
    });

    if (searchRes.ok) {
      const json = await searchRes.json();
      if (json._embedded?.quotes && json._embedded.quotes.length > 0) {
        for (const q of json._embedded.quotes.slice(0, count)) {
          quotes.push({
            value: q.value,
            appeared_at: q.appeared_at,
            source_url: q._embedded?.source?.[0]?.url,
            source: q._embedded?.source?.[0]?.url ? new URL(q._embedded.source[0].url).hostname : undefined
          });
        }
        return quotes;
      }
    }

    const promises = Array(count).fill(null).map(() =>
      fetch(`${QUOTE_API}/random/quote`, {
        headers: { 'Accept': 'application/json' }
      }).then(res => res.json()).catch(() => null)
    );

    const results = await Promise.all(promises);
    for (const json of results) {
      if (json && json.value) {
        quotes.push({
          value: json.value,
          appeared_at: json.appeared_at,
          source_url: json._embedded?.source?.[0]?.url,
          source: json._embedded?.source?.[0]?.url ?
            new URL(json._embedded.source[0].url).hostname.replace('www.', '') : undefined
        });
      }
    }

    if (quotes.length > 0) {
      return quotes;
    }
  } catch (error) {
    console.error("Error fetching quotes:", error);
  }

  return FALLBACK_QUOTES;
};

export const fetchGasPrice = async (): Promise<GasPriceData> => {
  try {
    const url = `${GAS_PRICE_API}?api_key=DEMO_KEY&frequency=weekly&data[0]=value&facets[product][]=EPM0&facets[duoarea][]=NUS&sort[0][column]=period&sort[0][direction]=desc&length=52`;

    const res = await fetch(url);
    if (!res.ok) throw new Error('Gas Price API failed');

    const json = await res.json();

    if (json.response?.data && json.response.data.length > 0) {
      const latestPrice = parseFloat(json.response.data[0]?.value || '0');

      return {
        price: latestPrice,
        baseline_price: 3.08, // Fixed baseline for Jan 20, 2025
        date: json.response.data[0]?.period
      };
    }

    throw new Error('No data returned');
  } catch (error) {
    console.error("Error fetching gas price:", error);
    return {
      price: 3.42,
      baseline_price: 3.08,
      date: new Date().toISOString().split('T')[0]
    };
  }
};

// S&P 500 via FRED API
export const fetchSP500 = async (): Promise<SP500Data> => {
  try {
    // Get latest 2 observations to calculate change
    const url = `${FRED_API}?series_id=SP500&api_key=${FRED_API_KEY}&file_type=json&limit=2&sort_order=desc`;
    const res = await fetch(url);

    if (!res.ok) throw new Error('FRED API failed');

    const json = await res.json();
    const observations = json.observations;

    if (observations && observations.length >= 1) {
      const latestValue = parseFloat(observations[0].value);
      const previousValue = observations.length >= 2 ? parseFloat(observations[1].value) : latestValue;

      const change = latestValue - previousValue;
      const changePercent = previousValue > 0 ? (change / previousValue) * 100 : 0;

      return {
        price: latestValue,
        change: change,
        changePercent: changePercent
      };
    }

    throw new Error('No S&P 500 data from FRED');
  } catch (error) {
    console.error("Error fetching S&P 500:", error);
    return {
      price: 6051,
      change: 15,
      changePercent: 0.25
    };
  }
};

// Unemployment via FRED API
export const fetchUnemployment = async (): Promise<UnemploymentData> => {
  try {
    const url = `${FRED_API}?series_id=UNRATE&api_key=${FRED_API_KEY}&file_type=json&limit=1&sort_order=desc`;
    const res = await fetch(url);

    if (!res.ok) throw new Error('FRED API failed');

    const json = await res.json();
    const observations = json.observations;

    if (observations && observations.length > 0) {
      return {
        rate: parseFloat(observations[0].value),
        date: observations[0].date
      };
    }

    throw new Error('No unemployment data from FRED');
  } catch (error) {
    console.error("Error fetching unemployment:", error);
    return {
      rate: 4.2,
      date: new Date().toISOString().split('T')[0]
    };
  }
};

// Inflation (CPI) via FRED API - calculate Year-over-Year
export const fetchInflation = async (): Promise<InflationData> => {
  try {
    // Get 13 months of data to calculate YoY
    const url = `${FRED_API}?series_id=CPIAUCSL&api_key=${FRED_API_KEY}&file_type=json&limit=13&sort_order=desc`;
    const res = await fetch(url);

    if (!res.ok) throw new Error('FRED API failed');

    const json = await res.json();
    const observations = json.observations;

    if (observations && observations.length >= 13) {
      const latestCPI = parseFloat(observations[0].value);
      const yearAgoCPI = parseFloat(observations[12].value);

      const yoyChange = ((latestCPI - yearAgoCPI) / yearAgoCPI) * 100;

      return {
        rate: parseFloat(yoyChange.toFixed(1)),
        date: observations[0].date
      };
    }

    throw new Error('No CPI data from FRED');
  } catch (error) {
    console.error("Error fetching inflation:", error);
    return {
      rate: 2.7,
      date: new Date().toISOString().split('T')[0]
    };
  }
};

export const fetchBitcoin = async (): Promise<BitcoinData> => {
  try {
    const url = `${COINGECKO_API}?ids=bitcoin&vs_currencies=usd&include_24hr_change=true`;
    const res = await fetch(url);

    if (!res.ok) throw new Error('CoinGecko API failed');

    const json = await res.json();

    if (json.bitcoin) {
      return {
        price: json.bitcoin.usd || 0,
        change24h: json.bitcoin.usd_24h_change || 0
      };
    }

    throw new Error('No Bitcoin data');
  } catch (error) {
    console.error("Error fetching Bitcoin:", error);
    return {
      price: 101000,
      change24h: 1.5
    };
  }
};

export const fetchGold = async (): Promise<GoldData> => {
  try {
    const url = `${METALS_API}?api_key=demo&currency=USD&unit=ounce`;
    const res = await fetch(url);

    if (!res.ok) throw new Error('Metals API failed');

    const json = await res.json();

    if (json.metals?.gold) {
      return {
        price: json.metals.gold,
        date: json.timestamp || new Date().toISOString()
      };
    }

    throw new Error('No Gold data');
  } catch (error) {
    console.error("Error fetching Gold:", error);
    return {
      price: 2680,
      date: new Date().toISOString()
    };
  }
};
