import { GoogleGenAI, Type, Schema } from "@google/genai";
import { RoastResponse, RoastStyle } from "../types";

const apiKey = process.env.API_KEY;
const ai = new GoogleGenAI({ apiKey: apiKey || '' });

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// List of models to try in order.
const MODEL_FALLBACK_LIST = [
  "gemini-2.5-flash", 
  "gemini-flash-lite-latest"
];

// --- PERSONA DEFINITIONS ---

// 1. MAIN: SHORT & PUNCHY (Tieba/Aggressive)
const SHORT_PUNCHY_PERSONA = `
  Role: "Legendary Keyboard Warrior" (祖安/贴吧老哥).
  Goal: Pure Domination.
  Style: Direct insults, specific metaphors, high aggression.
  Rules: 
  - Attack the specific topic (Money? Poor. Game? Noob. Looks? Ugly).
  - Use raw aggression. 
  - NO GENERIC SLANG like "急了/典". Use creative insults.
  - Max 1 sharp sentence.
`;

// 2. MAIN: LOGIC GENIUS (Yin Yang)
const LOGIC_MASTER_PERSONA = `
  Role: "Logical Yin Yang Master" (逻辑阴阳师).
  Goal: Intellectual humiliation via Sarcasm.
  Style: Cold logic, rhetorical questions, mirroring words.
  Rules:
  - Find the logical fallacy.
  - Use "Is it possible..." (有没有一种可能).
  - Mock their intelligence.
  - Max 1 sharp sentence.
`;

// 3. SUB: SUN BAR BRO (Abstract)
const SUN_BAR_PERSONA = `
  Role: "Sun Bar Abstract Artist" (孙吧老哥/抽象大帝).
  Goal: Create chaos and mock the user's lifestyle/relationships.
  Style: Abstract, Emoji Spam, Anti-Simp.
  Keywords: 🐢 (Turtle/Cuck), 🤡 (Clown), 🍺 (Beer), 😅 (Sweat), 幕刃 (Women-slang), 郭楠 (Incels), 沸羊羊.
  Rules:
  - Must use AT LEAST 2 abstract emojis per sentence.
  - Tone: "Le" (乐), "Beng" (崩).
  - Mock them for being a "Licking Dog" (舔狗) or "Turtle" (Cuck).
  - Max 1 sentence.
`;

// 4. SUB: ANTI-MI (Anti-Genshin/Fan)
const ANTI_MI_PERSONA = `
  Role: "Genshin/MiHoYo Hater" (米黑/反OP战士).
  Goal: Specifically roast Genshin Impact fans (OP).
  Target: The input is assumed to be from a MiHoYo fan.
  Keywords: OP, 黑暗降临, 4399, 塞尔达 (Zelda), 纯度, 孝子 (Filial Son), 648, 开放世界.
  Rules:
  - Mock them for defending a mobile game like it's a religion.
  - Mention "Copying Zelda".
  - Mock their "Culture Export" claims.
  - Tone: Disgusted, Superior.
  - Max 1 sentence.
`;

// 5. SUB: ANTI-FAIRY (Anti-XXN)
const ANTI_FAIRY_PERSONA = `
  Role: "Little Fairy Buster" (小仙女克星/T0打拳宗师).
  Goal: Counter radical "Little Fairy" (XXN) logic.
  Target: The input is assumed to be from a radical "Feminist/XXN".
  Keywords: T0, 抛开事实不谈, 普信男, 绝绝子, 甚至, 独立的女性, 喝奶茶.
  Rules:
  - Use their own logic against them (Magic vs Magic).
  - Mock "Double Standards".
  - Mock "Writing Essays" (写小作文).
  - Tone: Mocking their entitlement.
  - Max 1 sentence.
`;

// 6. SUB: MESUGAKI (Little Devil)
const MESUGAKI_PERSONA = `
  Role: "Mesugaki" (雌小鬼).
  Goal: Condescending teasing to make the user feel small.
  Keywords: 杂鱼 (Zayu/Small Fry), ❤, 大叔 (Uncle), 就这? (Is that it?), 啊哈哈~.
  Rules:
  - End sentences with ❤ or ~.
  - Call the user "Weak", "Impotent", "Loser".
  - Laugh at their desperation.
  - Tone: Playful but viciously arrogant.
  - Max 1 sentence.
`;


// Helper to generate IDs
const generateId = () => Math.random().toString(36).substr(2, 9);

/**
 * AI-Based Context Analyzer
 * Uses Flash Lite for speed and lower cost.
 */
export const analyzeContextWithAI = async (text: string): Promise<string> => {
  if (!apiKey || !text.trim() || text.length < 5) return "";

  const prompt = `
    You are a veteran "Internet Troll Profiler". Your goal is to Identify the EXACT specific "Enemy Archetype" of the person who wrote the following text from a derogatory perspective.
    
    Input: "${text}"

    Task:
    1. ANALYZE SPECIFICS: What specific game, brand, ideology, or logical fallacy are they showing?
       - If they talk about Apple -> "Blind iSheep" (not just "Tech fan").
       - If they talk about morals -> "Hypocritical Saint" (not just "Person").
       - If they use aggressive logic -> "Pseudo-Intellectual" (not just "Debater").
       
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
    - BE HIGH RESOLUTION. If they mention a specific character, label them a fan of that character.
    - Max 20 Chinese characters.
    - Output TEXT ONLY.
  `;

  try {
    // Use the fastest model specifically for this background task
    const response = await ai.models.generateContent({
      model: "gemini-flash-lite-latest",
      contents: prompt,
      config: {
        temperature: 0.7,
        maxOutputTokens: 30,
      }
    });
    return response.text?.trim() || "";
  } catch (e) {
    console.warn("Context analysis failed", e);
    return "";
  }
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
  if (!apiKey) {
    throw new Error("API Key is missing");
  }

  // Select Persona
  let persona = "";
  let styleLabel = "";

  switch (selectedStyle) {
    case RoastStyle.SHORT_PUNCHY:
      persona = SHORT_PUNCHY_PERSONA;
      styleLabel = "一针见血";
      break;
    case RoastStyle.LOGIC_MASTER:
      persona = LOGIC_MASTER_PERSONA;
      styleLabel = "逻辑鬼才";
      break;
    case RoastStyle.SUN_BAR:
      persona = SUN_BAR_PERSONA;
      styleLabel = "孙吧老哥";
      break;
    case RoastStyle.ANTI_MI:
      persona = ANTI_MI_PERSONA;
      styleLabel = "米卫兵克星";
      break;
    case RoastStyle.ANTI_FAIRY:
      persona = ANTI_FAIRY_PERSONA;
      styleLabel = "仙女克星";
      break;
    case RoastStyle.MESUGAKI:
      persona = MESUGAKI_PERSONA;
      styleLabel = "雌小鬼";
      break;
    default:
      persona = SHORT_PUNCHY_PERSONA;
      styleLabel = "一针见血";
  }

  const contextParts = [];
  if (backgroundInfo) {
    contextParts.push(`Enemy Profile / Background: "${backgroundInfo}". \nIMPORTANT: Internalize this knowledge. Do NOT quote it directly.`);
  }

  const prompt = `
    ${persona}
    ${contextParts.join('\n')}
    
    User Input: "${input}"
    
    Task:
    1. Generate 5 responses using the defined persona.
    2. Style Label in JSON must be: "${styleLabel}".
    3. Language: Chinese (Simplified).
    4. DETECT BAIT: If bait, mock their acting.
    5. FORMAT: NDJSON (One JSON object per line).
    6. CRITICAL: ONE SENTENCE PER RESPONSE. NO LISTS.
    
    CRITICAL OUTPUT RULES:
    - NO MARKDOWN. NO \`\`\`json.
    - NO ARRAYS. Do not start with [.
    - NO COMMAS between objects.
    - JUST RAW JSON OBJECTS, ONE PER LINE.
    
    Example Output:
    {"style": "${styleLabel}", "content": "...", "attackPower": 88}
  `;

  await callGeminiStreamWithRetry(prompt, onRoastFound);
};

export const regenerateSingleRoast = async (
  input: string,
  currentStyleLabel: string, 
  originalContent: string,
  backgroundInfo: string = ''
): Promise<RoastResponse> => {
  
  // Deduce Persona from Label for regeneration context
  let persona = SHORT_PUNCHY_PERSONA;
  if (currentStyleLabel.includes('逻辑')) persona = LOGIC_MASTER_PERSONA;
  else if (currentStyleLabel.includes('孙')) persona = SUN_BAR_PERSONA;
  else if (currentStyleLabel.includes('米') || currentStyleLabel.includes('OP')) persona = ANTI_MI_PERSONA;
  else if (currentStyleLabel.includes('仙') || currentStyleLabel.includes('拳')) persona = ANTI_FAIRY_PERSONA;
  else if (currentStyleLabel.includes('雌') || currentStyleLabel.includes('杂鱼')) persona = MESUGAKI_PERSONA;

  const contextParts = [];
  if (backgroundInfo) {
    contextParts.push(`Enemy Profile / Background: "${backgroundInfo}".`);
  }

  const prompt = `
    ${persona}
    ${contextParts.join('\n')}
    
    Target Style Label: "${currentStyleLabel}"
    Original Roast Content: "${originalContent}"
    User Input: "${input}"
    
    Task: REWRITE and OPTIMIZE the "Original Roast Content".
    Requirements:
    1. Keep the Persona's specific flavor (e.g. Emojis for Sun Bar, 'Zayu' for Mesugaki).
    2. Maintain roughly the SAME MEANING but polished.
    3. Language: Chinese (Simplified).
    4. NO QUOTATION MARKS around slang.
    5. STRICT LENGTH CONTROL: Keep it CONCISE. Max 1-2 short sentences.
    
    Output Format: JSON Object (NOT Array)
    { "style": "${currentStyleLabel}", "content": "Rewritten/Polished Text", "attackPower": 88 }
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

  return await callGeminiSingleWithRetry(prompt, singleItemSchema);
}

// --- SHARED RETRY LOGIC FOR STREAMING ---
async function callGeminiStreamWithRetry(
  prompt: string, 
  onRoastFound: (roast: RoastResponse) => void
) {
  let modelIndex = 0;
  let attempt = 0;
  const maxTotalAttempts = 5;

  while (attempt < maxTotalAttempts) {
    const currentModel = MODEL_FALLBACK_LIST[modelIndex];
    
    try {
      const responseStream = await ai.models.generateContentStream({
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
        
        // Robust Greedy JSON Parser
        let startIndex = buffer.indexOf('{');
        while (startIndex !== -1) {
          let balance = 0;
          let endIndex = -1;
          let insideString = false;
          let escape = false;

          for (let i = startIndex; i < buffer.length; i++) {
            const char = buffer[i];
            
            if (escape) {
              escape = false;
              continue;
            }
            if (char === '\\') {
              escape = true;
              continue;
            }
            if (char === '"') {
              insideString = !insideString;
              continue;
            }

            if (!insideString) {
              if (char === '{') balance++;
              else if (char === '}') {
                balance--;
                if (balance === 0) {
                  endIndex = i;
                  break;
                }
              }
            }
          }

          if (endIndex !== -1) {
            // Found a complete object
            let jsonStr = buffer.substring(startIndex, endIndex + 1);
            
            // Clean up potential trailing formatting errors (commas, etc)
            if (jsonStr.trim().endsWith(',')) {
              jsonStr = jsonStr.trim().slice(0, -1);
            }
            
            try {
              const obj = JSON.parse(jsonStr);
              if (obj && obj.content && obj.style) {
                 onRoastFound({ ...obj, id: generateId() });
                 count++;
                 
                 // AESTHETIC DELAY:
                 // First item immediate, subsequent delayed
                 if (count > 0) {
                    await delay(800); 
                 }
              }
            } catch (e) {
              // Ignore parse errors for partial/malformed chunks, just skip
            }
            
            // Advance buffer past this object
            buffer = buffer.substring(endIndex + 1);
            
            // Look for next object in the remaining buffer
            startIndex = buffer.indexOf('{');
          } else {
            // Incomplete object, wait for more chunks
            break;
          }
        }
      }
      return; // Success

    } catch (error: any) {
      if (handleRateLimit(error, modelIndex)) {
        attempt++;
        if (modelIndex < MODEL_FALLBACK_LIST.length - 1) {
          modelIndex++;
        } else {
           await delay(2000 * Math.pow(2, attempt));
           modelIndex = 0; 
        }
        continue;
      }
      console.error("Gemini Stream Error:", error);
      throw new Error("生成失败，请检查网络或稍后再试。");
    }
  }
}

async function callGeminiSingleWithRetry(prompt: string, schema: any): Promise<RoastResponse> {
  let modelIndex = 0;
  let attempt = 0;
  const maxTotalAttempts = 5;

  while (attempt < maxTotalAttempts) {
    const currentModel = MODEL_FALLBACK_LIST[modelIndex];
    
    try {
      const response = await ai.models.generateContent({
        model: currentModel,
        contents: prompt,
        config: {
          temperature: 1.3,
          responseMimeType: "application/json",
          responseSchema: schema,
        },
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
        if (modelIndex < MODEL_FALLBACK_LIST.length - 1) {
           modelIndex++;
        } else {
           await delay(2000 * Math.pow(2, attempt));
           modelIndex = 0;
        }
        continue;
      }
      throw new Error("生成失败，请检查网络或稍后再试。");
    }
  }
  throw new Error("Failed after retries");
}

function handleRateLimit(error: any, modelIndex: number): boolean {
  const isRateLimit = 
    error.status === 429 || 
    error.code === 429 ||
    error.response?.status === 429 ||
    error.message?.includes('429') || 
    error.message?.includes('quota') || 
    error.message?.includes('RESOURCE_EXHAUSTED');

  if (isRateLimit) {
    console.warn(`Rate limit hit on ${MODEL_FALLBACK_LIST[modelIndex]}.`);
    return true;
  }
  return false;
}