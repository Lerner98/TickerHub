/**
 * Gemini AI Client
 *
 * Wrapper for Google Generative AI (Gemini) with:
 * - Rate limiting (15 RPM free tier)
 * - Response caching
 * - Error handling with fallback support
 * - Structured JSON output parsing
 *
 * @module server/api/ai/geminiClient
 */

import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
import { cache } from '../../lib/cache';
import { log, logError } from '../../lib/logger';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const hasGemini = GEMINI_API_KEY.length > 0;

// Rate limiting: 15 requests per minute for free tier
const RATE_LIMIT_WINDOW = 60_000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 15;
let requestCount = 0;
let windowStart = Date.now();

// Cache TTLs - Longer duration to conserve API quota
const AI_RESPONSE_CACHE_TTL = 2 * 60 * 60 * 1000; // 2 hours

let genAI: GoogleGenerativeAI | null = null;
let model: GenerativeModel | null = null;

if (hasGemini) {
  genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  // Use gemini-2.5-flash - current free tier model (10 RPM, 250 requests/day)
  // Quota resets daily - lazy loading pattern conserves usage
  model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    generationConfig: {
      temperature: 0.1, // Low temperature for consistent structured output
      topP: 0.8,
      maxOutputTokens: 4096, // Increased to prevent truncation of longer responses
    },
  });
  log('Gemini AI client initialized (gemini-2.5-flash)', 'ai', 'info');
}

/**
 * Check if we're within rate limits
 */
function checkRateLimit(): boolean {
  const now = Date.now();

  // Reset window if expired
  if (now - windowStart > RATE_LIMIT_WINDOW) {
    requestCount = 0;
    windowStart = now;
  }

  return requestCount < MAX_REQUESTS_PER_WINDOW;
}

/**
 * Increment request counter
 */
function recordRequest(): void {
  requestCount++;
}

/**
 * Generate content from Gemini
 *
 * @param prompt - The prompt to send to Gemini
 * @param cacheKey - Optional cache key for response caching
 * @returns Generated text or null on error
 */
export async function generateContent(
  prompt: string,
  cacheKey?: string
): Promise<string | null> {
  if (!model) {
    log('Gemini not configured, skipping AI request', 'ai', 'debug');
    return null;
  }

  // Check cache first
  if (cacheKey) {
    const cached = cache.get<string>(cacheKey, AI_RESPONSE_CACHE_TTL);
    if (cached) {
      log(`AI response from cache: ${cacheKey}`, 'ai', 'debug');
      return cached;
    }
  }

  // Rate limit check
  if (!checkRateLimit()) {
    log('Gemini rate limit exceeded, try again later', 'ai', 'warn');
    return null;
  }

  try {
    recordRequest();

    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    // Cache the response
    if (cacheKey && text) {
      cache.set(cacheKey, text);
    }

    log(`Gemini response generated (${text.length} chars)`, 'ai', 'debug');
    return text;

  } catch (error) {
    logError(error as Error, 'Gemini content generation failed');
    return null;
  }
}

/**
 * Extract and validate JSON from a potentially messy response string
 * Handles markdown code blocks, truncated responses, and various edge cases
 */
function extractJSON(text: string): string | null {
  let jsonStr = text.trim();

  // Step 1: Handle ```json ... ``` or ``` ... ``` code blocks
  const codeBlockMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) {
    jsonStr = codeBlockMatch[1].trim();
  } else {
    // Handle unclosed code block (response was truncated mid-block)
    const unclosedMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*)/);
    if (unclosedMatch) {
      jsonStr = unclosedMatch[1].trim();
    }
  }

  // Step 2: Strip any remaining backticks
  jsonStr = jsonStr.replace(/^`+/, '').replace(/`+$/, '').trim();

  // Step 3: Find the JSON object/array with balanced braces
  const startIdx = jsonStr.indexOf('{');
  const arrayStartIdx = jsonStr.indexOf('[');

  // Determine if we're looking for an object or array
  const isArray = arrayStartIdx !== -1 && (startIdx === -1 || arrayStartIdx < startIdx);
  const openChar = isArray ? '[' : '{';
  const closeChar = isArray ? ']' : '}';
  const actualStartIdx = isArray ? arrayStartIdx : startIdx;

  if (actualStartIdx === -1) {
    return null;
  }

  // Find matching closing brace with balance tracking
  let depth = 0;
  let inString = false;
  let escapeNext = false;
  let endIdx = -1;

  for (let i = actualStartIdx; i < jsonStr.length; i++) {
    const char = jsonStr[i];

    if (escapeNext) {
      escapeNext = false;
      continue;
    }

    if (char === '\\') {
      escapeNext = true;
      continue;
    }

    if (char === '"') {
      inString = !inString;
      continue;
    }

    if (inString) continue;

    if (char === openChar) {
      depth++;
    } else if (char === closeChar) {
      depth--;
      if (depth === 0) {
        endIdx = i;
        break;
      }
    }
  }

  // If we found a complete JSON structure, extract it
  if (endIdx !== -1) {
    return jsonStr.substring(actualStartIdx, endIdx + 1);
  }

  // JSON was truncated - try to repair it by closing open structures
  // This is a best-effort approach for truncated Gemini responses
  let truncatedJson = jsonStr.substring(actualStartIdx);

  // Count unclosed braces/brackets
  depth = 0;
  let bracketDepth = 0;
  inString = false;
  escapeNext = false;

  for (let i = 0; i < truncatedJson.length; i++) {
    const char = truncatedJson[i];

    if (escapeNext) {
      escapeNext = false;
      continue;
    }

    if (char === '\\') {
      escapeNext = true;
      continue;
    }

    if (char === '"') {
      inString = !inString;
      continue;
    }

    if (inString) continue;

    if (char === '{') depth++;
    else if (char === '}') depth--;
    else if (char === '[') bracketDepth++;
    else if (char === ']') bracketDepth--;
  }

  // If we're in a string, close it
  if (inString) {
    truncatedJson += '"';
  }

  // Add closing brackets/braces
  truncatedJson += ']'.repeat(Math.max(0, bracketDepth));
  truncatedJson += '}'.repeat(Math.max(0, depth));

  return truncatedJson;
}

/**
 * Generate and parse JSON response from Gemini
 *
 * Extracts JSON from the response, handling markdown code blocks
 * and truncated responses with best-effort repair
 *
 * @template T - Expected response type
 * @param prompt - The prompt expecting JSON response
 * @param cacheKey - Optional cache key
 * @returns Parsed JSON object or null on error
 */
export async function generateJSON<T>(
  prompt: string,
  cacheKey?: string
): Promise<T | null> {
  const text = await generateContent(prompt, cacheKey);

  if (!text) return null;

  try {
    const jsonStr = extractJSON(text);

    if (!jsonStr) {
      log(`No JSON structure found in Gemini response: ${text.substring(0, 200)}`, 'ai', 'warn');
      return null;
    }

    // Parse JSON
    const parsed = JSON.parse(jsonStr) as T;
    return parsed;

  } catch (error) {
    // Log both the error and a sample of the response for debugging
    logError(error as Error, `Failed to parse Gemini JSON response: ${text.substring(0, 300)}`);
    return null;
  }
}

/**
 * Check if Gemini is configured and available
 */
export function isGeminiConfigured(): boolean {
  return hasGemini;
}

/**
 * Get Gemini service status
 */
export function getGeminiStatus(): {
  configured: boolean;
  available: boolean;
  requestsRemaining: number;
} {
  const now = Date.now();
  if (now - windowStart > RATE_LIMIT_WINDOW) {
    requestCount = 0;
    windowStart = now;
  }

  return {
    configured: hasGemini,
    available: hasGemini && checkRateLimit(),
    requestsRemaining: MAX_REQUESTS_PER_WINDOW - requestCount,
  };
}
