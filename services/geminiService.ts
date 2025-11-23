import { GoogleGenAI, Type, Schema } from "@google/genai";
import { RoastResponse, RoastStyle } from "../types";

const apiKey = process.env.API_KEY;
const ai = new GoogleGenAI({ apiKey: apiKey || '' });

const responseSchemaObj = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      style: { type: Type.STRING, description: "The style of the roast (e.g., 阴阳怪气, 逻辑暴击)" },
      content: { type: Type.STRING, description: "The actual text of the comeback/roast" },
      attackPower: { type: Type.NUMBER, description: "A score from 1 to 100 indicating how harsh the roast is" },
      explanation: { type: Type.STRING, description: "Brief explanation of why this comeback is effective" },
    },
    required: ["style", "content", "attackPower"],
  },
};

export const generateRoasts = async (
  input: string, 
  selectedStyle: RoastStyle | 'ALL', 
  platform: string = '', 
  backgroundInfo: string = ''
): Promise<RoastResponse[]> => {
  if (!apiKey) {
    throw new Error("API Key is missing");
  }

  const model = "gemini-2.5-flash";
  
  const stylePrompt = selectedStyle === 'ALL' 
    ? "Generate 3 distinct responses using different approaches (Logic, Meme, Aggressive), but all must be high-quality internet roasts." 
    : `Generate 3 variations focusing strictly on the '${selectedStyle}' style.`;

  const contextParts = [];
  
  // Determine if we need to use search tools
  const useSearch = !!(platform && (platform.includes('http') || platform.includes('www') || platform.includes('.com') || platform.includes('.cn')));
  
  let toolConfig: any = {};
  
  if (platform) {
    contextParts.push(`Target URL / Platform: "${platform}". IMPORTANT: If this is a URL, assume the content matches the user's input. Analyze the culture of this website/platform (e.g., Bilibili users vs Tieba users vs Zhihu users vs Weibo users) and use specific slang or insults relevant to that community.`);
    
    if (useSearch) {
       toolConfig = { tools: [{ googleSearch: {} }] };
    }
  }
  
  if (backgroundInfo) {
    contextParts.push(`Specific Background Situation: "${backgroundInfo}". Use these specific details to make the comeback personal and devastating.`);
  }

  const contextPrompt = contextParts.length > 0
    ? contextParts.join('\n')
    : `Context: General internet argument.`;

  const prompt = `
    You are a legendary "Internet Roast Master" (网络对线之神) in the Chinese internet community (Zuan/Tieba/Weibo veteran).
    
    Your Persona:
    1.  **Aggressive & Sharp**: You don't hold back. You go straight for the jugular with maximum emotional damage.
    2.  **Master of Slang**: You are fluent in abstract emoji usage (😅, 🤡, 🥵), Tieba/Zhihu culture, and current memes.
    3.  **Logical & Sarcastic**: You dismantle arguments with brutal logic wrapped in thick layers of sarcasm (Yin-Yang Qi).
    4.  **Style**: You are NOT a cute anime girl. You are a battle-hardened keyboard warrior. You are cool, cynical, and ruthless.
    
    Your task is to generate high-quality, humorous, and sharp responses to the following user input.
    
    ${contextPrompt}
    
    User Input (Opponent): "${input}"
    
    Task Requirements:
    1. ${stylePrompt}
    2. The language MUST be Chinese (Simplified).
    3. Use Chinese internet slang appropriately (e.g., 急了, 典, 这就破防了?, 宁就是..., 😅, 也就这种程度).
    4. Do NOT generate hate speech or illegal content. Keep it "Internet Roast" style (playful but sharp).
    5. Return the response as a JSON array matching the following structure:
       [
         {
           "style": "string",
           "content": "string",
           "attackPower": number (1-100),
           "explanation": "string"
         }
       ]
    6. IMPORTANT: Return ONLY the JSON. Do not wrap in markdown code blocks if possible, but if you do, I will parse it.
  `;

  try {
    // Config logic: If tools are used, we CANNOT set responseMimeType or responseSchema.
    const generationConfig: any = {
      temperature: 1.1,
      ...toolConfig
    };

    if (!useSearch) {
      generationConfig.responseMimeType = "application/json";
      generationConfig.responseSchema = responseSchemaObj;
    }

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: generationConfig,
    });

    let text = response.text || "[]";
    
    // Cleanup markdown if present (likely happens when tools are used)
    text = text.replace(/```json/g, '').replace(/```/g, '').trim();
    
    let parsedRoasts: RoastResponse[] = [];
    try {
      parsedRoasts = JSON.parse(text);
    } catch (e) {
      // Fallback: try to find array in text
      const match = text.match(/\[.*\]/s);
      if (match) {
        parsedRoasts = JSON.parse(match[0]);
      } else {
        console.error("Failed to parse JSON:", text);
        // Fallback response so app doesn't crash
        parsedRoasts = [{
          style: "System",
          content: "对方的逻辑过于混乱，系统解析失败... (Parsing Error)",
          attackPower: 0,
          explanation: "Try again."
        }];
      }
    }

    // Extract sources if available
    let sources: { title: string; uri: string }[] = [];
    if (response.candidates?.[0]?.groundingMetadata?.groundingChunks) {
       sources = response.candidates[0].groundingMetadata.groundingChunks
        .map((chunk: any) => chunk.web)
        .filter((web: any) => web)
        .map((web: any) => ({ title: web.title, uri: web.uri }));
    }

    // Attach sources to responses (so the UI can show them on any card)
    if (sources.length > 0) {
      parsedRoasts = parsedRoasts.map(r => ({ ...r, sources }));
    }
    
    return parsedRoasts;
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw new Error("Failed to generate roasts. Please try again.");
  }
};