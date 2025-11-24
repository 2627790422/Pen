import { GoogleGenAI, Type, Schema } from "@google/genai";
import { RoastResponse, RoastStyle } from "../types";

const apiKey = process.env.API_KEY;
const ai = new GoogleGenAI({ apiKey: apiKey || '' });

const responseSchemaObj = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      style: { type: Type.STRING, description: "The style of the roast (IN CHINESE)" },
      content: { type: Type.STRING, description: "The actual text of the comeback/roast" },
      attackPower: { type: Type.NUMBER, description: "A score from 1 to 100" },
    },
    required: ["style", "content", "attackPower"],
  },
};

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// List of models to try in order. If one hits a rate limit, we switch to the next.
const MODEL_FALLBACK_LIST = [
  "gemini-2.5-flash", 
  "gemini-flash-lite-latest"
];

// --- PERSONA DEFINITIONS ---

const TIEBA_PERSONA = `
  Role: "Tieba/Zuan Veteran" (贴吧/祖安老哥).
  Goal: Humiliate and emotionally damage (破防) the opponent.
  
  RULES:
  1. MAX AGGRESSION. No politeness. No logic.
  2. USE SLANG NATURALLY (NO QUOTES). e.g. 急了, 典, 孝子, 润, 赢, 乐, 蚌埠住了.
  3. MANDATORY ABSTRACT EMOJIS: 😅, 🤡, 🐢, 🍺, 👴, 👊, 🥵.
  4. DIRECT ATTACK. Be rude, loud, chaotic.
  5. LENGTH CONSTRAINT: Concise. Max 2-3 short sentences. Don't write a novel.
`;

const LOGIC_PERSONA = `
  Role: "Logical Yin Yang Master" (逻辑阴阳师).
  Goal: Expose stupidity through their own logic using sarcasm.
  
  RULES:
  1. FIND THE LOGIC BUG/LOOPHOLE.
  2. ATTACK STRATEGY: Point out flaw -> Mock with sarcasm -> Rhetorical question.
  3. VOCAB: 逻辑闭环, 双标, 不攻自破, 大脑皮层, 重新定义, 幽默, 闹麻了, 天才.
  4. PATTERNS: "按照你的逻辑...", "有没有一种可能...", "建议...".
  5. NO QUOTES around slang.
  6. LENGTH CONSTRAINT: Concise. Max 2 sentences. Punchy sarcasm.
`;

// Helper to generate IDs
const generateId = () => Math.random().toString(36).substr(2, 9);

export const generateRoasts = async (
  input: string, 
  selectedStyle: RoastStyle | 'ALL', 
  backgroundInfo: string = ''
): Promise<RoastResponse[]> => {
  if (!apiKey) {
    throw new Error("API Key is missing");
  }

  // Define specific personas based on style
  let personaInstructions = "";
  let styleInstruction = "";

  if (selectedStyle === RoastStyle.SHORT_PUNCHY) {
    personaInstructions = TIEBA_PERSONA;
    styleInstruction = "Generate 5 responses. Style label MUST be '暴躁老哥' or '一针见血'. Aggressive, Tieba slang/emojis. Immediate 'Emotional Damage'. NO QUOTATION MARKS around slang. KEEP IT SHORT.";
  } else {
    personaInstructions = LOGIC_PERSONA;
    styleInstruction = "Generate 5 responses. Style label MUST be '逻辑鬼才' or '阴阳怪气'. Focus on LOGICAL FLAWS + SARCASM. Sharp, intelligent, minimalist. NO QUOTATION MARKS around slang. KEEP IT SHORT.";
  }

  const contextParts = [];
  if (backgroundInfo) {
    contextParts.push(`Background Context: "${backgroundInfo}". You MUST incorporate this context into the roast.`);
  }

  const prompt = `
    ${personaInstructions}
    ${contextParts.join('\n')}
    
    User Input: "${input}"
    
    Task:
    1. ${styleInstruction}
    2. Language: Chinese (Simplified).
    3. DETECT BAIT (钓鱼/反串): If bait, mock their acting skills (演技) using terms like "串子", "反串", "整活". DO NOT use "钩子/鱼钩".
    4. FORMAT: JSON Array. No markdown formatting inside JSON strings.
    5. Output structure: [{ "style": string (CHINESE), "content": string, "attackPower": number }]
  `;

  const results = await callGeminiWithRetry(prompt, responseSchemaObj);
  
  // Add IDs to results
  return results.map((r: any) => ({ ...r, id: generateId() }));
};

export const regenerateSingleRoast = async (
  input: string,
  currentStyleLabel: string, // The Chinese label from the previous response
  originalContent: string,
  backgroundInfo: string = ''
): Promise<RoastResponse> => {
  
  // Determine which persona to use based on the existing label
  let personaInstructions = LOGIC_PERSONA; // Default fallback
  let specificStyleInstruction = "";

  const isTieba = ['暴躁老哥', '一针见血', '言简意赅', 'Tieba'].some(k => currentStyleLabel.includes(k));

  if (isTieba) {
    personaInstructions = TIEBA_PERSONA;
    specificStyleInstruction = "Style: Aggressive Tieba/Zuan. Focus on better metaphors or stronger emotional damage.";
  } else {
    personaInstructions = LOGIC_PERSONA;
    // Explicitly relax patterns to avoid repetition
    specificStyleInstruction = "Style: Logical Sarcasm (Yin Yang). Focus on sharper irony. IMPORTANT: Do NOT repetitively start with 'According to your logic' (按照你的逻辑). Use varied sentence structures.";
  }

  const contextParts = [];
  if (backgroundInfo) {
    contextParts.push(`Background Context: "${backgroundInfo}". IMPORTANT: Integrate this context.`);
  }

  const prompt = `
    ${personaInstructions}
    ${contextParts.join('\n')}
    
    Target Style Label: "${currentStyleLabel}"
    Original Roast Content: "${originalContent}"
    User Input: "${input}"
    
    Task: REWRITE and OPTIMIZE the "Original Roast Content".
    Requirements:
    1. ${specificStyleInstruction}
    2. Maintain roughly the SAME MEANING as the original roast, but phrase it differently/better. 
    3. Language: Chinese (Simplified).
    4. NO QUOTATION MARKS around slang.
    5. STRICT LENGTH CONTROL: Keep it CONCISE. Similar length to the original (Max 2 sentences). DO NOT expand into paragraphs.
    
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

  const result = await callGeminiWithRetry(prompt, singleItemSchema);
  return { ...result, id: generateId() };
}

// Shared retry logic
async function callGeminiWithRetry(prompt: string, schema: any) {
  let modelIndex = 0;
  let attempt = 0;
  const maxTotalAttempts = 5;

  while (attempt < maxTotalAttempts) {
    const currentModel = MODEL_FALLBACK_LIST[modelIndex];
    
    try {
      const generationConfig: any = {
        temperature: 1.3,
        responseMimeType: "application/json",
        responseSchema: schema,
      };

      const response = await ai.models.generateContent({
        model: currentModel,
        contents: prompt,
        config: generationConfig,
      });

      let text = response.text || (schema.type === Type.ARRAY ? "[]" : "{}");
      text = text.replace(/```json/g, '').replace(/```/g, '').trim();
      
      let parsedData;
      try {
        parsedData = JSON.parse(text);
      } catch (e) {
        // Simple fallback parsing for common JSON errors in LLM output
        const match = schema.type === Type.ARRAY ? text.match(/\[.*\]/s) : text.match(/\{.*\}/s);
        if (match) parsedData = JSON.parse(match[0]);
        else throw new Error("JSON Parse failed");
      }

      return parsedData;

    } catch (error: any) {
      const isRateLimit = 
        error.status === 429 || 
        error.code === 429 ||
        error.response?.status === 429 ||
        error.message?.includes('429') || 
        error.message?.includes('quota') || 
        error.message?.includes('RESOURCE_EXHAUSTED');

      if (isRateLimit) {
        attempt++;
        console.warn(`Rate limit hit on ${currentModel}.`);

        if (modelIndex < MODEL_FALLBACK_LIST.length - 1) {
          modelIndex++;
          console.log(`Switching to backup model: ${MODEL_FALLBACK_LIST[modelIndex]}`);
          await delay(500); 
          continue;
        } else {
          if (attempt < maxTotalAttempts) {
            const waitTime = 2000 * Math.pow(2, attempt - 1);
            console.warn(`All models busy. Retrying primary model in ${waitTime}ms...`);
            modelIndex = 0;
            await delay(waitTime);
            continue;
          } else {
             throw new Error("⚠️ 系统过载 (429): 服务器都在冒烟了，请稍后再试。");
          }
        }
      }
      
      console.error("Gemini API Error:", error);
      throw new Error("生成失败，请检查网络或稍后再试。");
    }
  }
}