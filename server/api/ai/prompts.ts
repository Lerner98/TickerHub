/**
 * AI Prompt Templates
 *
 * Structured prompts for Gemini AI to ensure consistent, parseable responses.
 * All prompts request JSON output with strict schemas.
 *
 * @module server/api/ai/prompts
 */

/**
 * Natural Language Search Parser Prompt
 *
 * Converts user queries like "tech stocks that are up" into structured filters.
 */
export const SEARCH_PARSE_PROMPT = `You are a financial search query parser. Convert natural language into structured filters.

User query: "{query}"

Return ONLY valid JSON matching this exact schema:
{
  "type": "stock" | "crypto" | "both",
  "sector": string | null,
  "priceRange": { "min": number | null, "max": number | null } | null,
  "changeDirection": "up" | "down" | "any",
  "symbols": string[],
  "keywords": string[],
  "action": "search" | "compare"
}

SECTOR VALUES (use exactly):
- "technology" - Tech companies (AAPL, MSFT, GOOG, NVDA)
- "financials" - Banks, insurance (JPM, BAC, GS)
- "healthcare" - Pharma, biotech (JNJ, PFE, UNH)
- "energy" - Oil, gas, renewables (XOM, CVX, NEE)
- "consumer" - Retail, consumer goods (AMZN, WMT, PG)
- "industrials" - Manufacturing, aerospace (BA, CAT, GE)
- "semiconductors" - Chip makers (NVDA, AMD, INTC, TSM)
- "communications" - Media, telecom (META, DIS, VZ)
- "utilities" - Electric, water (NEE, DUK, SO)
- "realestate" - REITs (AMT, PLD, SPG)

EXAMPLES:

Query: "tech stocks"
Result: { "type": "stock", "sector": "technology", "changeDirection": "any", "symbols": [], "keywords": [], "action": "search", "priceRange": null }

Query: "bitcoin and ethereum"
Result: { "type": "crypto", "sector": null, "symbols": ["BTC", "ETH"], "changeDirection": "any", "keywords": [], "action": "search", "priceRange": null }

Query: "stocks under $50"
Result: { "type": "stock", "sector": null, "priceRange": { "min": null, "max": 50 }, "changeDirection": "any", "symbols": [], "keywords": [], "action": "search" }

Query: "semiconductor stocks that are up"
Result: { "type": "stock", "sector": "semiconductors", "changeDirection": "up", "symbols": [], "keywords": [], "action": "search", "priceRange": null }

Query: "compare NVDA and AMD"
Result: { "type": "stock", "sector": null, "symbols": ["NVDA", "AMD"], "changeDirection": "any", "keywords": [], "action": "compare", "priceRange": null }

Query: "energy stocks down today"
Result: { "type": "stock", "sector": "energy", "changeDirection": "down", "symbols": [], "keywords": [], "action": "search", "priceRange": null }

Query: "show me crypto"
Result: { "type": "crypto", "sector": null, "changeDirection": "any", "symbols": [], "keywords": [], "action": "search", "priceRange": null }

Query: "AAPL"
Result: { "type": "stock", "sector": null, "symbols": ["AAPL"], "changeDirection": "any", "keywords": [], "action": "search", "priceRange": null }

Query: "what's up with tesla"
Result: { "type": "stock", "sector": null, "symbols": ["TSLA"], "changeDirection": "any", "keywords": [], "action": "search", "priceRange": null }

Respond with ONLY the JSON object, no explanation or markdown.`;


/**
 * AI Stock Summary Prompt
 *
 * Generates sentiment analysis and key insights from news headlines.
 */
export const STOCK_SUMMARY_PROMPT = `You are a senior financial analyst. Analyze the following data for {symbol} ({companyName}) and provide a concise investment summary.

CURRENT DATA:
- Price: ${'{price}'} (${'{changePercent}'}% today)
- Market Cap: ${'{marketCap}'}
- P/E Ratio: ${'{peRatio}'}
- Sector: ${'{sector}'}

NEWS HEADLINES:
{headlines}

ANALYST CONSENSUS:
{analystData}

Respond with ONLY valid JSON matching this exact schema:
{
  "sentiment": {
    "score": <number 1-10, where 1=very bearish, 10=very bullish>,
    "label": "Bearish" | "Somewhat Bearish" | "Neutral" | "Somewhat Bullish" | "Bullish"
  },
  "summary": "<2-3 sentence overview of current situation>",
  "keyPoints": {
    "positive": ["<bullet point>", ...],
    "negative": ["<bullet point>", ...],
    "neutral": ["<bullet point>", ...]
  },
  "catalysts": ["<upcoming event that could move price>", ...],
  "risks": ["<key risk to watch>", ...]
}

Guidelines:
- Be specific, cite actual events from the data provided
- Maximum 3 items per array
- Sentiment score should reflect overall outlook
- Include both short-term and long-term perspectives
- If limited data available, be appropriately cautious

Respond with ONLY the JSON object, no explanation or markdown.`;


/**
 * Market Overview Prompt
 *
 * Summarizes overall market conditions.
 */
export const MARKET_OVERVIEW_PROMPT = `You are a financial market analyst. Summarize the current market conditions based on the following sector performance data.

SECTOR PERFORMANCE:
{sectorData}

TOP MOVERS:
Gainers: {gainers}
Losers: {losers}

Respond with ONLY valid JSON matching this exact schema:
{
  "marketSentiment": "Risk-On" | "Risk-Off" | "Mixed" | "Neutral",
  "summary": "<2-3 sentence market overview>",
  "topThemes": ["<market theme>", "<market theme>"],
  "sectorsToWatch": {
    "bullish": ["<sector name>"],
    "bearish": ["<sector name>"]
  },
  "outlook": "<1 sentence forward outlook>"
}

Respond with ONLY the JSON object, no explanation or markdown.`;


/**
 * Helper to build search prompt with user query
 */
export function buildSearchPrompt(query: string): string {
  return SEARCH_PARSE_PROMPT.replace('{query}', query);
}

/**
 * Helper to build stock summary prompt
 */
export function buildStockSummaryPrompt(data: {
  symbol: string;
  companyName: string;
  price: string;
  changePercent: string;
  marketCap: string;
  peRatio: string;
  sector: string;
  headlines: string;
  analystData: string;
}): string {
  let prompt = STOCK_SUMMARY_PROMPT;

  prompt = prompt.replace('{symbol}', data.symbol);
  prompt = prompt.replace('{companyName}', data.companyName);
  prompt = prompt.replace('{price}', data.price);
  prompt = prompt.replace('{changePercent}', data.changePercent);
  prompt = prompt.replace('{marketCap}', data.marketCap);
  prompt = prompt.replace('{peRatio}', data.peRatio);
  prompt = prompt.replace('{sector}', data.sector);
  prompt = prompt.replace('{headlines}', data.headlines);
  prompt = prompt.replace('{analystData}', data.analystData);

  return prompt;
}

/**
 * Helper to build market overview prompt
 */
export function buildMarketOverviewPrompt(data: {
  sectorData: string;
  gainers: string;
  losers: string;
}): string {
  let prompt = MARKET_OVERVIEW_PROMPT;

  prompt = prompt.replace('{sectorData}', data.sectorData);
  prompt = prompt.replace('{gainers}', data.gainers);
  prompt = prompt.replace('{losers}', data.losers);

  return prompt;
}
