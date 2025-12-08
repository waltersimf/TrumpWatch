import { DebtData, QuoteData, TruthPost } from '../types';

// Constants
const TERM_START_DATE = '2025-01-20';
const TREASURY_API = 'https://api.fiscaldata.treasury.gov/services/api/fiscal_service/v2/accounting/od/debt_to_penny';
const FEDERAL_REGISTER_API = 'https://www.federalregister.gov/api/v1/documents.json';
const QUOTE_API = 'https://api.tronalddump.io/random/quote';
// Note: This is a large file, in a real production app we'd want a proxy or pagination.
// Using a limit query if possible, but raw github doesn't support query params for filtering.
// We will fetch and slice.
const TRUTH_SOCIAL_ARCHIVE = 'https://raw.githubusercontent.com/stiles/trump-truth-social-archive/main/truth_archive.json';

export const fetchNationalDebt = async (): Promise<DebtData> => {
  try {
    // Fetch latest
    const latestRes = await fetch(`${TREASURY_API}?sort=-record_date&limit=1`);
    const latestJson = await latestRes.json();
    
    // Fetch baseline (approximate Jan 20, 2025)
    // We filter for dates greater than or equal to Jan 20 2025, sort ascending, get first one.
    const baselineRes = await fetch(`${TREASURY_API}?filter=record_date:gte:${TERM_START_DATE}&sort=record_date&limit=1`);
    const baselineJson = await baselineRes.json();

    const current = parseFloat(latestJson.data[0]?.tot_pub_debt_out_amt || '0');
    // If we are before Jan 20, 2025, baseline might be empty or future. Fallback to current if empty.
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
    // Filter for EOs by Trump published after the start of the 2nd term
    const url = `${FEDERAL_REGISTER_API}?conditions[presidential_document_type]=executive_order&conditions[president]=donald-trump&conditions[publication_date][gte]=${TERM_START_DATE}`;
    const res = await fetch(url);
    const json = await res.json();
    return json.count || 0;
  } catch (error) {
    console.error("Error fetching EOs:", error);
    // Return 0 explicitly on error to avoid breaking UI, or rethrow
    return 0;
  }
};

export const fetchRandomQuote = async (): Promise<QuoteData> => {
  try {
    const res = await fetch(QUOTE_API, {
      headers: {
        'Accept': 'application/json'
      }
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
    // Fallback quote if API fails
    return {
      value: "I will fight for you with every breath in my body - and I will never, ever let you down.",
      appeared_at: "2017-01-20"
    };
  }
};

export const fetchLatestTruth = async (): Promise<TruthPost | null> => {
  try {
    // NOTE: Fetching a large JSON file client-side is risky. 
    // Ideally this would be a server-side proxy.
    // For this demo, we will attempt it but with a fallback mock if it fails or takes too long.
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout

    const res = await fetch(TRUTH_SOCIAL_ARCHIVE, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!res.ok) throw new Error('Failed to fetch Truth archive');

    const json = await res.json();
    
    // The archive is an array. Get the last element (most recent).
    if (Array.isArray(json) && json.length > 0) {
        // Archives are usually chronological, so last item is newest? 
        // Or sometimes reverse. Let's check dates on the last few to be sure, 
        // or just sort the last 10.
        const recent = json.slice(-5).sort((a: any, b: any) => 
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        return recent[0] as TruthPost;
    }
    return null;
  } catch (error) {
    console.warn("Truth Social fetch failed (likely file size/CORS/timeout), using fallback.", error);
    // Return a static placeholder to ensure UI doesn't look broken
    return {
      id: "fallback",
      content: "Latest updates from Truth Social are currently synchronizing. Please check back shortly.",
      created_at: new Date().toISOString(),
      stats: { replies_count: 0, reblogs_count: 0, favourites_count: 0 }
    };
  }
};