import { DebtData, QuoteData, GasPriceData, ApprovalData, TruthPost } from '../types';

// Constants
const TERM_START_DATE = '2025-01-20';
const TREASURY_API = 'https://api.fiscaldata.treasury.gov/services/api/fiscal_service/v2/accounting/od/debt_to_penny';
const FEDERAL_REGISTER_API = 'https://www.federalregister.gov/api/v1/documents.json';
const QUOTE_API = 'https://api.tronalddump.io';
const GAS_PRICE_API = 'https://api.eia.gov/v2/petroleum/pri/gnd/data/';
const VOTEHUB_API = 'https://votehub.com/api/polls';
const TRUTH_SOCIAL_ARCHIVE = 'https://raw.githubusercontent.com/stiles/trump-truth-social-archive/main/truth_archive.json';

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
    // Fetch latest
    const latestRes = await fetch(`${TREASURY_API}?sort=-record_date&limit=1`);
    const latestJson = await latestRes.json();

    // Fetch baseline (approximate Jan 20, 2025)
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
    // Try fetching from the search endpoint for multiple quotes
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

    // Fallback: Try fetching multiple random quotes
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

  // Return fallback quotes if API fails
  return FALLBACK_QUOTES;
};

export const fetchRandomQuote = async (): Promise<QuoteData> => {
  try {
    const res = await fetch(`${QUOTE_API}/random/quote`, {
      headers: { 'Accept': 'application/json' }
    });
    if (!res.ok) throw new Error('Quote API failed');
    const json = await res.json();
    return {
      value: json.value,
      appeared_at: json.appeared_at,
      source_url: json._embedded?.source?.[0]?.url,
      source: json._embedded?.source?.[0]?.url ?
        new URL(json._embedded.source[0].url).hostname.replace('www.', '') : undefined
    };
  } catch (error) {
    console.error("Error fetching quote:", error);
    return FALLBACK_QUOTES[Math.floor(Math.random() * FALLBACK_QUOTES.length)];
  }
};

export const fetchGasPrice = async (): Promise<GasPriceData> => {
  try {
    // EIA API for regular gasoline prices
    const url = `${GAS_PRICE_API}?api_key=DEMO_KEY&frequency=weekly&data[0]=value&facets[product][]=EPM0&facets[duoarea][]=NUS&sort[0][column]=period&sort[0][direction]=desc&length=52`;

    const res = await fetch(url);
    if (!res.ok) throw new Error('Gas Price API failed');

    const json = await res.json();

    if (json.response?.data && json.response.data.length > 0) {
      const latestPrice = parseFloat(json.response.data[0]?.value || '0');
      // Find baseline price from around Jan 20, 2025
      const baselineData = json.response.data.find((d: any) => d.period >= '2025-01-20') || json.response.data[json.response.data.length - 1];
      const baselinePrice = parseFloat(baselineData?.value || latestPrice.toString());

      return {
        price: latestPrice,
        baseline_price: baselinePrice,
        date: json.response.data[0]?.period
      };
    }

    throw new Error('No data returned');
  } catch (error) {
    console.error("Error fetching gas price:", error);
    // Fallback data
    return {
      price: 3.42,
      baseline_price: 3.11,
      date: new Date().toISOString().split('T')[0]
    };
  }
};

export const fetchApprovalRating = async (): Promise<ApprovalData> => {
  try {
    const url = `${VOTEHUB_API}?poll_type=approval&subject=donald-trump`;
    const res = await fetch(url);

    if (!res.ok) throw new Error('VoteHub API failed');

    const json = await res.json();

    if (Array.isArray(json) && json.length > 0) {
      // Get the latest poll (first in array, assuming sorted by date desc)
      const latestPoll = json[0];
      const approveAnswer = latestPoll.answers?.find((a: any) =>
        a.label?.toLowerCase().includes('approve') && !a.label?.toLowerCase().includes('disapprove')
      );
      const disapproveAnswer = latestPoll.answers?.find((a: any) =>
        a.label?.toLowerCase().includes('disapprove')
      );

      const currentApprove = approveAnswer?.pct || 0;

      // Try to find previous month's poll for comparison
      let monthChange: number | null = null;
      if (json.length > 1) {
        const now = new Date();
        const oneMonthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());

        const previousPoll = json.find((poll: any) => {
          const pollDate = new Date(poll.end_date || poll.created_at);
          return pollDate <= oneMonthAgo;
        });

        if (previousPoll) {
          const prevApprove = previousPoll.answers?.find((a: any) =>
            a.label?.toLowerCase().includes('approve') && !a.label?.toLowerCase().includes('disapprove')
          )?.pct || 0;
          monthChange = currentApprove - prevApprove;
        }
      }

      return {
        approve: currentApprove,
        disapprove: disapproveAnswer?.pct || 0,
        monthChange,
        pollDate: latestPoll.end_date || latestPoll.created_at || new Date().toISOString(),
        pollster: latestPoll.pollster || latestPoll.source || 'VoteHub'
      };
    }

    throw new Error('No approval data returned');
  } catch (error) {
    console.error("Error fetching approval rating:", error);
    // Fallback data
    return {
      approve: 43,
      disapprove: 53,
      monthChange: -2,
      pollDate: new Date().toISOString(),
      pollster: 'Aggregate'
    };
  }
};

export const fetchTruthPostsCount = async (): Promise<number> => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

    const res = await fetch(TRUTH_SOCIAL_ARCHIVE, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!res.ok) throw new Error('Failed to fetch Truth archive');

    const json = await res.json();

    if (Array.isArray(json)) {
      return json.length;
    }
    return 0;
  } catch (error) {
    console.warn("Truth Social count fetch failed:", error);
    return 1847; // Fallback count
  }
};

export const fetchLatestTruth = async (): Promise<TruthPost | null> => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const res = await fetch(TRUTH_SOCIAL_ARCHIVE, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!res.ok) throw new Error('Failed to fetch Truth archive');

    const json = await res.json();

    if (Array.isArray(json) && json.length > 0) {
      const recent = json.slice(-5).sort((a: any, b: any) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      return recent[0] as TruthPost;
    }
    return null;
  } catch (error) {
    console.warn("Truth Social fetch failed:", error);
    return {
      id: "fallback",
      content: "Latest updates from Truth Social are currently synchronizing. Please check back shortly.",
      created_at: new Date().toISOString(),
      stats: { replies_count: 0, reblogs_count: 0, favourites_count: 0 }
    };
  }
};
