
import { ContentConfig, VerificationResult, NewsItem, TrendItem, DailyStrategy } from "../types";

const GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta';
const GENERATION_MODEL = 'gemini-2.5-flash';
const REASONING_MODEL = 'gemini-2.5-flash';

const getApiKey = () => {
  const storedKey = localStorage.getItem('meridian_api_key');
  const apiKey = storedKey || process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key is missing. Please enter your Gemini API Key in Settings.");
  }
  return apiKey;
};

const geminiUrl = (model: string) => `${GEMINI_BASE_URL}/models/${model}:generateContent`;

const callGemini = async (model: string, body: Record<string, unknown>) => {
  const apiKey = getApiKey();
  const response = await fetch(`${geminiUrl(model)}?key=${apiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    let errorMessage = response.statusText;
    try {
      const errorData = await response.json();
      errorMessage = errorData?.error?.message || errorMessage;
    } catch {
      // ignore parsing error, fallback to status
    }
    throw new Error(errorMessage || 'Gemini API error');
  }

  return response.json();
};

const extractText = (data: any) => {
  if (!data?.candidates?.length) return '';
  const parts = data.candidates[0]?.content?.parts ?? [];
  return parts
    .map((part: any) => part?.text || '')
    .join('')
    .trim();
};

/**
 * Fetches the latest trending news in Web3/Crypto using Google Search Grounding.
 */
export const fetchTrendingNews = async (): Promise<NewsItem[]> => {
  try {
    const prompt = `
      Find the top 5 most important breaking news stories in Web3, Crypto, DeFi, and NFTs from the last 24 hours.
      
      For each story, extract:
      1. A catchy headline.
      2. The source name (e.g., CoinDesk, The Block).
      3. Relative time (e.g., "2 hours ago").
      4. A brief summary (2 sentences max).
      5. An estimated trending score (1.0 to 10.0) based on importance.
      6. An estimated engagement number (e.g., "12.5K").
      7. A category (DeFi, NFT, L2, Regulation, or Market).
      8. The canonical URL for the source article.
      
      Return the output as a strictly valid JSON array of objects.
      The objects must have these keys: "id" (random string), "title", "source", "time", "summary", "trendingScore" (number), "engagement", "verificationStatus" (randomly pick one of "Verified", "Needs Review", "Risky"), "category", "url".

      Do not use markdown code blocks. Just return the JSON string.
    `;

    const response = await callGemini(GENERATION_MODEL, {
      contents: [{ role: 'user', parts: [{ text: prompt }]}],
      tools: [{ googleSearch: {} }]
    });

    const text = extractText(response) || "[]";
    const jsonString = text.replace(/```json\n?|\n?```/g, '').trim();
    
    try {
      const parsed: NewsItem[] = JSON.parse(jsonString);
      return parsed.map(item => ({
        ...item,
        url: item.url || undefined,
      }));
    } catch (e) {
      console.error("Failed to parse news JSON", e);
      return [];
    }

  } catch (error) {
    console.error("Gemini API Error (News):", error);
    return [];
  }
};

/**
 * Fetches current trending keywords and sentiment in Web3/Crypto.
 */
export const fetchCryptoTrends = async (): Promise<TrendItem[]> => {
  try {
    const prompt = `
      Identify the top 6 trending keywords, hashtags, or tickers (e.g., $BTC, #Solana, #Airdrop) in the Crypto/Web3 space right now based on Google Search and Social signals.

      For each trend, provide:
      1. Rank (1-6).
      2. Keyword/Hashtag.
      3. Estimated mentions (e.g. "45K").
      4. Sentiment ("Bullish", "Bearish", or "Neutral").
      5. 24h Change percentage (number only, e.g. 15 or -5).

      Return strictly as a JSON array of objects with keys: "rank", "keyword", "mentions", "sentiment", "change".
      Do not use markdown.
    `;

    const response = await callGemini(GENERATION_MODEL, {
      contents: [{ role: 'user', parts: [{ text: prompt }]}],
      tools: [{ googleSearch: {} }]
    });

    const text = extractText(response) || "[]";
    const jsonString = text.replace(/```json\n?|\n?```/g, '').trim();
    
    try {
      return JSON.parse(jsonString);
    } catch (e) {
      console.error("Failed to parse trends JSON", e);
      return [];
    }
  } catch (error) {
    console.error("Gemini API Error (Trends):", error);
    return [];
  }
};

/**
 * Generates Web3 marketing content based on user configuration.
 */
export const generateMarketingContent = async (config: ContentConfig): Promise<string> => {
  try {
    const prompt = `
      You are an expert Web3 Marketing Agent named Meridian.
      
      Task: Generate content based on the following parameters:
      - Topic: ${config.topic}
      - Style: ${config.style}
      - Tone: ${config.tone}
      - Format: ${config.format}
      - Key Points to Include: ${config.keyPoints}

      Constraint:
      - Use crypto-native terminology where appropriate (e.g., alpha, wagmi, liquidity, bearish/bullish) but keep it readable.
      - If the format is "Twitter Thread", separate tweets with "---".
      - Ensure the content is engaging and optimized for high social media engagement.
      - Do not include hashtags unless asked.
    `;

    const response = await callGemini(GENERATION_MODEL, {
      contents: [{ role: 'user', parts: [{ text: prompt }]}],
    });

    return extractText(response) || "Failed to generate content. Please try again.";
  } catch (error) {
    console.error("Gemini API Error (Generation):", error);
    return "Error: Unable to connect to Meridian AI Core. Please check your API key settings.";
  }
};

/**
 * Performs fact-checking and compliance verification on text.
 */
export const performFactCheck = async (text: string, source?: string): Promise<VerificationResult> => {
  try {
    const prompt = `
      You are a Compliance Officer for a Web3 platform. 
      Analyze the following text for factual accuracy, potential regulatory risks (SEC violations, financial advice), and overall safety.
      Use Google Search to verify claims if necessary.

      Text to Analyze: "${text}"
      ${source ? `Reference Sources: ${source}` : ''}

      Return the response in strictly valid JSON format with the following structure:
      {
        "score": number (0-100, where 100 is perfectly safe/accurate),
        "status": string ("Verified", "Needs Review", or "Risky"),
        "analysis": string (A brief summary of why it received this score),
        "corrections": array of strings (Specific suggestions to fix issues)
      }
      
      Do not include markdown formatting like \`\`\`json in the response, just the raw JSON string.
    `;

    const response = await callGemini(REASONING_MODEL, {
      contents: [{ role: 'user', parts: [{ text: prompt }]}],
      tools: [{ googleSearch: {} }]
    });

    const resultText = extractText(response) || "{}";
    const parsed = JSON.parse(resultText);
    
    return {
      score: parsed.score || 0,
      status: parsed.status || 'Needs Review',
      analysis: parsed.analysis || 'Analysis failed.',
      corrections: parsed.corrections || []
    };

  } catch (error) {
    console.error("Gemini API Error (Fact Check):", error);
    const message = error instanceof Error ? error.message : 'Unknown Gemini error';
    return {
      score: 0,
      status: 'Needs Review',
      analysis: `System error during verification: ${message}`,
      corrections: []
    };
  }
};

/**
 * Generates a daily marketing strategy based on current news and trends.
 */
export const generateDailyStrategy = async (news: NewsItem[]): Promise<DailyStrategy | null> => {
  try {
    const newsContext = news.map(n => `- ${n.title} (${n.category})`).join('\n');
    
    const prompt = `
      As a Head of Web3 Marketing, analyze these top news stories and create a daily strategy executive brief:
      
      News:
      ${newsContext}

      Provide a JSON response with:
      1. "headline": A short, punchy strategy directive (e.g. "Focus on ETH DeFi Narratives").
      2. "marketMood": "Bullish", "Bearish", "Neutral", or "Volatile".
      3. "actionItems": 3 specific marketing actions to take today (short strings).
      4. "focusTopics": 3 key topics/hashtags to create content around.
      
      Return raw JSON only.
    `;

    const response = await callGemini(GENERATION_MODEL, {
      contents: [{ role: 'user', parts: [{ text: prompt }]}],
      generationConfig: { responseMimeType: "application/json" }
    });

    const resultText = extractText(response) || "{}";
    return JSON.parse(resultText);

  } catch (error) {
    console.error("Gemini API Error (Strategy):", error);
    return null;
  }
};
