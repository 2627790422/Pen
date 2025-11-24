import { GoogleGenAI, Type, Schema } from "@google/genai";
import { RoastResponse, RoastStyle } from "../types";

const API_KEY = process.env.API_KEY;

// 1. Primary Client (Google Official)
const primaryAI = new GoogleGenAI({ 
  apiKey: API_KEY
});

// 2. Fallback Client (Reverse Proxy)
// Strategy: First send to Google, if no response, send to www.yangjiehui.xyz
const fallbackAI = new GoogleGenAI({ 
  apiKey: API_KEY,
  baseUrl: 'https://www.yangjiehui.xyz'
} as any);

const CLIENTS = [primaryAI, fallbackAI];

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const MODEL_FALLBACK_LIST = [
  "gemini-2.5-flash", 
  "gemini-flash-lite-latest"
];

// --- PERSONA DEFINITIONS ---

// 1. TIEBA / ZUAN (Short & Punchy)
const SHORT_PUNCHY_PERSONA = `
  Role: "Vicious Tieba Veteran" (嘴臭极致的贴吧老哥/祖安钢琴家).
  Goal: Inflict MAX EMOTIONAL DAMAGE. Pure humiliation, no mercy.
  RULES:
  1. TONE: Extremely aggressive, vulgar (borderline), and condescending.
  2. STRATEGY: "Precision Strike" (精准破防).
     - Do NOT use generic insults like "You are stupid".
     - ATTACK THE SPECIFIC CONTENT.
     - If they mention money -> Mock their poverty.
     - If they mention logic -> Mock their brain rot.
     - If they simp -> Mock their lack of self-worth (Licking Dog).
  3. VOCABULARY: Use creative, hurtful metaphors and "Abstract" Tieba culture.
     - Example: "Your brain is smoother than a polished marble."
     - Example: "Did you download a virus into your head?"
     - Example: "Go check if your family tree is a circle."
  4. BAN: Do NOT spam generic keywords like "急了/典/乐" unless necessary. BE CREATIVE and SPECIFIC.
  5. LENGTH: 1 short, devastating sentence.
  6. NO QUOTES around slang.
`;

// 2. LOGIC MASTER (Logic Genius)
const LOGIC_MASTER_PERSONA = `
  Role: "Internet Logic Genius" (逻辑鬼才/阴阳师).
  Goal: Use the opponent's own logic against them using sarcastic metaphors.
  RULES:
  1. TONE: Colloquial, mocking, "pretending to be polite but actually scathing".
  2. STRATEGY: "Reductio ad absurdum" but use DAILY LIFE METAPHORS.
     - Do NOT use academic terms like "strawman". 
     - Instead say: "According to your logic, chefs must lay eggs to cook eggs?"
  3. PATTERNS: Use "Internet Logic" (e.g., "Are you trying to say...", "So according to you...").
  4. BAN: Do NOT use formal/bookish language.
  5. LENGTH: 1 sharp sentence.
  6. NO QUOTES around slang.
`;

// 3. SUN_BAR (Abstract)
const SUN_BAR_PERSONA = `
  Role: "Sun Bar Abstract Artist" (孙吧抽象带哥).
  Goal: Pure chaos and disdain.
  RULES:
  1. MANDATORY EMOJIS: 👴, 🍺, 😅, 🐢, 👊, 🥵.
  2. SLANG: MUST use Chinese characters: "乐", "崩", "典", "孝", "赢", "急", "批". DO NOT USE PINYIN (e.g., No "Le", "Beng").
  3. TONE: Treat everyone as a "Simp" (龟男/沸羊羊) or "Clown".
  4. LENGTH: Short, abstract.
`;

// 4. ANTI_MI (Genshin)
const ANTI_MI_PERSONA = `
  Role: "Anti-Genshin Warrior" (米黑/猴王).
  Goal: Mock "OP" (Original God players) and Hoyoverse fans.
  RULES:
  1. KEYWORDS: OP, YuanP, Dark (黑暗降临), 648, Krypton Gold, Teyvat.
  2. TONE: Mock their devotion to a game.
  3. LENGTH: Short.
`;

// 5. ANTI_FAIRY (Gender)
const ANTI_FAIRY_PERSONA = `
  Role: "Anti-Fairy Specialist" (专治小仙女).
  Goal: Mock radical gender double standards.
  RULES:
  1. KEYWORDS: T0, Little Fairy, Sisters, Girls help girls, Guo Nan.
  2. TONE: Expose double standards.
  3. LENGTH: Short.
`;

// 6. MESUGAKI (Imp)
const MESUGAKI_PERSONA = `
  Role: "Mesugaki" (雌小鬼).
  Goal: Condescending provocation.
  RULES:
  1. KEYWORDS: MUST use Chinese characters: "杂鱼~" (Small Fry), "大叔" (Uncle), "就这?" (Is that all?), "好弱❤". DO NOT USE PINYIN (No "Zayu").
  2. TONE: Playful but insulting. Use "❤" at end.
  3. LENGTH: Short.
`;

// Helper to generate IDs
const generateId = () => Math.random().toString(36).substr(2, 9);

/**
 * AI-Based Context Analyzer
 */
export const analyzeContextWithAI = async (text: string): Promise<string> => {
  if (!API_KEY || !text.trim() || text.length < 5) return "";

  const prompt = `
    You are a veteran "Internet Troll Profiler". Your goal is to Identify the EXACT specific "Enemy Archetype" of the person who wrote the following text from a derogatory perspective.
    
    Input: "${text}"

    Task:
    1. ANALYZE SPECIFICS: What specific game, brand, ideology, or logical fallacy are they showing?
       - If they talk about Apple -> "Blind iSheep" (not just "Tech fan").
       - If they talk about morals -> "Hypocritical Saint" (not just "Person").
       
    2. IDENTIFY IDENTITY (Derogatory Slang):
       - Create a specific, mocking label. Use terms like: 结晶, 孝子, 卫兵, 普信, 甚至, 懂哥, ☁️玩家.
       
    3. IDENTIFY STATE: 
       - Are they triggered (急了)? Acting victim (装受害者)? Projecting (自我介绍)?

    4. GUESS PLATFORM/SCENE:
       - Only if context implies it (e.g. "Video" -> Bilibili, "Post" -> Weibo/RedBook). 
       - If unknown, OMIT IT.

    Output Format: "[Scene if known] [Adjective/State] [Specific Mocking Identity]"
    
    Rules:
    - NO GENERIC LABELS like "Netizen" or "Opponent".
    - BE HIGH RESOLUTION.
    - Max 20 Chinese characters.
    - Output TEXT ONLY.
  `;

  // Try Primary, then Fallback
  for (const client of CLIENTS) {
    try {
      const response = await client.models.generateContent({
        model: "gemini-flash-lite-latest",
        contents: prompt,
        config: { temperature: 0.7 }
      });
      return response.text?.trim() || "";
    } catch (e) {
      console.warn(`Context analysis failed with client ${client === primaryAI ? 'Primary' : 'Fallback'}, trying next...`, e);
      if (client === CLIENTS[CLIENTS.length - 1]) return ""; // All failed
    }
  }
  return "";
};

/**
 * Streaming Generator
 */
export const generateRoasts = async (
  input: string, 
  selectedStyle: RoastStyle | 'ALL', 
  backgroundInfo: string = '',
  onRoastFound: (roast: RoastResponse) => void
): Promise<void> => {
  if (!API_KEY) throw new Error("API Key is missing");

  let persona = "";
  let styleLabel = "";

  // Map selection to Persona
  switch (selectedStyle) {
    case RoastStyle.LOGIC_MASTER:
    case 'ALL':
      persona = LOGIC_MASTER_PERSONA;
      styleLabel = "逻辑鬼才";
      break;
    case RoastStyle.SUN_BAR:
      persona = SUN_BAR_PERSONA;
      styleLabel = "孙吧哥";
      break;
    case RoastStyle.ANTI_MI:
      persona = ANTI_MI_PERSONA;
      styleLabel = "专治OP";
      break;
    case RoastStyle.ANTI_FAIRY:
      persona = ANTI_FAIRY_PERSONA;
      styleLabel = "专治T0";
      break;
    case RoastStyle.MESUGAKI:
      persona = MESUGAKI_PERSONA;
      styleLabel = "雌小鬼";
      break;
    case RoastStyle.SHORT_PUNCHY:
    default:
      persona = SHORT_PUNCHY_PERSONA;
      styleLabel = "一针见血";
      break;
  }

  const contextParts = [];
  if (backgroundInfo) {
    contextParts.push(`Enemy Profile / Background: "${backgroundInfo}". \nIMPORTANT: Use this to inform your insults (e.g. if 'Genshin Fan', use Anti-Mi keywords), but DO NOT explicitly quote the background. Internalize it.`);
  }

  const prompt = `
    ${persona}
    ${contextParts.join('\n')}
    
    User Input: "${input}"
    
    Task:
    1. Generate 5 unique responses based on the Persona.
    2. Style Label: "${styleLabel}".
    3. DETECT BAIT (钓鱼/串子): If bait, mock their acting skills (演技).
    4. STREAMING MODE: Output each response as a standalone JSON object on a new line.
    5. CRITICAL: ONE SENTENCE PER RESPONSE ONLY. NO LISTS.
    6. Language: Chinese (Simplified). Use Characters, NOT Pinyin.
    
    CRITICAL OUTPUT RULES:
    - NO MARKDOWN. NO \`\`\`json.
    - NO ARRAYS. Do not start with [.
    - JUST RAW JSON OBJECTS, ONE PER LINE.
    
    Example Output:
    {"style": "${styleLabel}", "content": "...", "attackPower": 88}
  `;

  // Try Primary, then Fallback
  let lastError;
  for (const client of CLIENTS) {
    try {
      await callGeminiStreamWithRetry(client, prompt, onRoastFound);
      return; // Success
    } catch (e: any) {
      console.warn(`Generate roasts failed with client ${client === primaryAI ? 'Primary' : 'Fallback'}`, e);
      lastError = e;
      // Continue to next client
    }
  }
  throw lastError || new Error("生成失败，请检查网络或稍后再试。");
};

export const regenerateSingleRoast = async (
  input: string,
  currentStyleLabel: string, 
  originalContent: string,
  backgroundInfo: string = ''
): Promise<RoastResponse> => {
  
  // Determine persona from existing label to maintain consistency
  let persona = LOGIC_MASTER_PERSONA;
  if (['一针见血', '暴躁老哥'].some(s => currentStyleLabel.includes(s))) persona = SHORT_PUNCHY_PERSONA;
  else if (['孙吧', '抽象'].some(s => currentStyleLabel.includes(s))) persona = SUN_BAR_PERSONA;
  else if (['OP', '米', '原神'].some(s => currentStyleLabel.includes(s))) persona = ANTI_MI_PERSONA;
  else if (['仙女', 'T0'].some(s => currentStyleLabel.includes(s))) persona = ANTI_FAIRY_PERSONA;
  else if (['雌小鬼', '杂鱼'].some(s => currentStyleLabel.includes(s))) persona = MESUGAKI_PERSONA;

  const contextParts = [];
  if (backgroundInfo) {
    contextParts.push(`Enemy Profile / Background: "${backgroundInfo}". Internalize it.`);
  }

  const prompt = `
    ${persona}
    ${contextParts.join('\n')}
    
    Target Style Label: "${currentStyleLabel}"
    Original Roast Content: "${originalContent}"
    User Input: "${input}"
    
    Task: REWRITE and OPTIMIZE the "Original Roast Content".
    Requirements:
    1. Better wording, sharper attack.
    2. Maintain the persona strictly.
    3. ONE SENTENCE MAX. Keep it punchy.
    4. Language: Chinese (Simplified). Use Characters, NOT Pinyin.
    
    Output Format: JSON Object (NOT Array)
    { "style": "${currentStyleLabel}", "content": "Rewritten Text", "attackPower": 88 }
  `;
  
  const singleItemSchema = {
    type: Type.OBJECT,
    properties: {
      style: { type: Type.STRING },
      content: { type: Type.STRING },
      attackPower: { type: Type.NUMBER },
    },
    required: ["style", "content", "attackPower"],
  };

  // Try Primary, then Fallback
  let lastError;
  for (const client of CLIENTS) {
    try {
      return await callGeminiSingleWithRetry(client, prompt, singleItemSchema);
    } catch (e: any) {
      console.warn(`Regenerate failed with client ${client === primaryAI ? 'Primary' : 'Fallback'}`, e);
      lastError = e;
      // Continue to next client
    }
  }
  throw lastError || new Error("刷新失败，请检查网络。");
}

// --- SHARED RETRY LOGIC FOR STREAMING ---
async function callGeminiStreamWithRetry(
  client: GoogleGenAI,
  prompt: string, 
  onRoastFound: (roast: RoastResponse) => void
) {
  let modelIndex = 0;
  let attempt = 0;
  const maxTotalAttempts = 5;

  while (attempt < maxTotalAttempts) {
    const currentModel = MODEL_FALLBACK_LIST[modelIndex];
    
    try {
      const responseStream = await client.models.generateContentStream({
        model: currentModel,
        contents: prompt,
        config: {
          temperature: 1.3,
          responseMimeType: "text/plain", 
        },
      });

      let buffer = "";
      let count = 0;
      
      for await (const chunk of responseStream) {
        const textChunk = chunk.text;
        if (!textChunk) continue;

        buffer += textChunk;
        
        let startIndex = buffer.indexOf('{');
        while (startIndex !== -1) {
          let balance = 0;
          let endIndex = -1;
          let insideString = false;
          let escape = false;

          for (let i = startIndex; i < buffer.length; i++) {
            const char = buffer[i];
            if (escape) { escape = false; continue; }
            if (char === '\\') { escape = true; continue; }
            if (char === '"') { insideString = !insideString; continue; }
            if (!insideString) {
              if (char === '{') balance++;
              else if (char === '}') {
                balance--;
                if (balance === 0) { endIndex = i; break; }
              }
            }
          }

          if (endIndex !== -1) {
            let jsonStr = buffer.substring(startIndex, endIndex + 1);
            if (jsonStr.trim().endsWith(',')) jsonStr = jsonStr.trim().slice(0, -1);
            
            try {
              const obj = JSON.parse(jsonStr);
              if (obj && obj.content) {
                 onRoastFound({ ...obj, id: generateId() });
                 count++;
                 if (count > 0) await delay(800); 
              }
            } catch (e) { }
            
            buffer = buffer.substring(endIndex + 1);
            startIndex = buffer.indexOf('{');
          } else {
            break;
          }
        }
      }
      return; 
    } catch (error: any) {
      if (handleRateLimit(error, modelIndex)) {
        attempt++;
        if (modelIndex < MODEL_FALLBACK_LIST.length - 1) modelIndex++;
        else { await delay(2000 * Math.pow(2, attempt)); modelIndex = 0; }
        continue;
      }
      // If it's not a rate limit error (e.g. network), throw it so the client-switcher can try the next client
      throw error;
    }
  }
}

async function callGeminiSingleWithRetry(
  client: GoogleGenAI, 
  prompt: string, 
  schema: any
): Promise<RoastResponse> {
  let modelIndex = 0;
  let attempt = 0;
  const maxTotalAttempts = 5;

  while (attempt < maxTotalAttempts) {
    const currentModel = MODEL_FALLBACK_LIST[modelIndex];
    try {
      const response = await client.models.generateContent({
        model: currentModel,
        contents: prompt,
        config: { temperature: 1.3, responseMimeType: "application/json", responseSchema: schema },
      });

      let text = response.text || "{}";
      text = text.replace(/```json/g, '').replace(/```/g, '').trim();
      let parsedData;
      try {
        parsedData = JSON.parse(text);
      } catch (e) {
        const match = text.match(/\{.*\}/s);
        if (match) parsedData = JSON.parse(match[0]);
        else throw new Error("JSON Parse failed");
      }
      return { ...parsedData, id: generateId() };

    } catch (error: any) {
      if (handleRateLimit(error, modelIndex)) {
        attempt++;
        if (modelIndex < MODEL_FALLBACK_LIST.length - 1) modelIndex++;
        else { await delay(2000 * Math.pow(2, attempt)); modelIndex = 0; }
        continue;
      }
      throw error;
    }
  }
  throw new Error("Failed after retries");
}

function handleRateLimit(error: any, modelIndex: number): boolean {
  const isRateLimit = error.status === 429 || error.code === 429 || error.message?.includes('429') || error.message?.includes('quota') || error.message?.includes('RESOURCE_EXHAUSTED');
  if (isRateLimit) return true;
  return false;
}