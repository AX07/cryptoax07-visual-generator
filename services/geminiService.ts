import { GoogleGenAI, Type } from "@google/genai";
import { DesignPrompt } from "../types";

// User provided API key fallback for browser environment
const API_KEY = (typeof process !== 'undefined' && process.env?.API_KEY) || "AIzaSyCDfANidIyw-BruJ-3GlHw08QKgOsEKhlc";

const SYSTEM_INSTRUCTION = `
**ACT AS:** Expert Visual Director for a Luxury Media Brand (CryptoAX07).

**YOUR GOAL:** 
I will provide you with a short text Headline. You must generate 3 distinct, "Prompt-Engineered" descriptions.

**CRITICAL RULE: CONSISTENT VISUAL DNA**
All 3 variants MUST share the exact same aesthetic. They should look like they belong in the same gallery.
1. **Camera:** Always "85mm lens, f/1.8 aperture, shallow depth of field".
2. **Render:** Always "Unreal Engine 5, Octane Render, 8K, Hyper-realistic".
3. **Lighting:** Always "Cinematic rim lighting, volumetric atmosphere, dark vignette".
4. **Color Palette:** Deep Navy/Black Void background with Gold/Silver Hero objects.

**STRICT TYPOGRAPHY RULES (GOLD KEYWORD STRATEGY):**
1. **EXACT TEXT:** You MUST include the exact headline provided.
2. **FONT:** "Massive, Bold Condensed Sans-Serif" (e.g., Impact, Helvetica Bold).
3. **COLOR SPLIT (CRITICAL):** 
   - Identify the single most **impactful keyword** in the headline. 
   - This keyword MUST be **Vibrant Metallic Gold**.
   - All other words MUST be **Stark White**.
   - *Example:* "BEAR MARKET" -> "BEAR" (Gold), "MARKET" (White).
   - *Example:* "TRUST THE CODE" -> "CODE" (Gold), "TRUST THE" (White).
4. **SHADOW:** You MUST specify a "**Heavy, soft, diffuse black drop shadow**" for maximum readability.
5. **FORBIDDEN:** Do **NOT** generate "text boxes", "rectangular background plates", "glitch effects", or "banners".

**CONCEPT STRATEGY (3 DISTINCT METAPHORS):**
*   **Variant 1 (The Literal):** A high-fidelity physical representation (e.g., A solid Gold Bitcoin, A Diamond, A Ledger Nano).
*   **Variant 2 (The Symbolic):** A conceptual object (e.g., An Hourglass, A Chess King, A Golden Key, A Bull Statue).
*   **Variant 3 (The Architectural):** A monumental structure (e.g., A Vault Door, A Monolith, A Stone Pillar, A Bridge).

**THE "GOLD STANDARD" PROMPT STRUCTURE (EXTERNAL TOOL READY):**
Construct the 'fullPrompt' as a seamless, high-density comma-separated description.
Format: "[Subject detailed description], [Action and motion details], [Environment and lighting], [Style, Camera, Render settings], Text: '[Exact Headline]' [Typography instruction with Gold Keyword]"

**OUTPUT FORMAT:**
Return a JSON Array of 3 objects adhering to the schema.
`;

const CAROUSEL_SCRIPT_INSTRUCTION = `
**ACT AS:** Senior Crypto Educator & Copywriter.
**GOAL:** Break down a crypto concept into 4 sequential, educational subheadings for an Instagram Carousel.
**CONSTRAINT:** The text will be rendered ON an image. IT MUST BE EXTREMELY SHORT.
**RULES:**
1. Generate exactly 4 short sentences.
2. MAX 6 WORDS per sentence.
3. No filler words.
4. Focus on value, truth, or insight.
5. Tone: Serious, Educational, "Alpha".
`;

export const generateDesignPrompts = async (headline: string): Promise<DesignPrompt[]> => {
  try {
    const ai = new GoogleGenAI({ apiKey: API_KEY });
    
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Generate 3 visual master prompts for the headline: "${headline}"`,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.INTEGER },
              breakdown: {
                type: Type.OBJECT,
                properties: {
                  subject: { 
                    type: Type.STRING, 
                    description: "Highly detailed description of the Single Hero Object including texture, imperfections, material" 
                  },
                  action: { 
                    type: Type.STRING, 
                    description: "Description of subtle motion blur, floating particles, light spills" 
                  },
                  environment: { 
                    type: Type.STRING, 
                    description: "Background details (Dark Void), gradients, vignettes" 
                  },
                  styleAndTech: { 
                    type: Type.STRING, 
                    description: "Camera, Lighting, and Render settings" 
                  },
                  typographyInstruction: {
                    type: Type.STRING,
                    description: "Instruction for text. MUST SPECIFY: 'Bold Sans-Serif, [Keyword] in Metallic Gold, rest in White'."
                  }
                },
                required: ["subject", "action", "environment", "styleAndTech", "typographyInstruction"],
              },
              fullPrompt: { 
                type: Type.STRING, 
                description: "The combined prompt string. Format: [Subject], [Action], [Environment], [Style], Text: [Typography instruction with Gold Keyword]" 
              }
            },
            required: ["id", "breakdown", "fullPrompt"],
          },
        },
      },
    });

    const text = response.text;
    if (!text) throw new Error("No response from Gemini");

    const parsed = JSON.parse(text);
    return parsed.map((p: any) => ({ ...p, headline }));
  } catch (error) {
    console.error("Error generating prompts:", error);
    throw error;
  }
};

export const generateCarouselScript = async (headline: string): Promise<string[]> => {
  try {
    const ai = new GoogleGenAI({ apiKey: API_KEY });
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Generate 4 educational carousel slides for the concept: "${headline}"`,
      config: {
        systemInstruction: CAROUSEL_SCRIPT_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response");
    return JSON.parse(text);
  } catch (error) {
    console.error("Error generating script", error);
    return ["Understand the basics", "Look for the utility", "Don't trust, verify", "Long term vision"];
  }
};

export const generateCarouselPrompts = async (
  breakdown: DesignPrompt['breakdown'],
  slides: { id: number; text: string }[]
): Promise<string[]> => {
  try {
    const ai = new GoogleGenAI({ apiKey: API_KEY });
    
    // Construct the input payload for the model
    const inputPayload = {
      masterStyle: {
        environment: breakdown.environment,
        styleAndTech: breakdown.styleAndTech,
        action: breakdown.action,
        subject: breakdown.subject
      },
      slides: slides.map(s => s.text)
    };

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Generate 4 image prompts based on this style and these texts: ${JSON.stringify(inputPayload)}`,
      config: {
        systemInstruction: `
          **ACT AS:** Visual Consistency AI.
          **GOAL:** Generate 4 new image prompts that match a Master Style but illustrate specific texts.
          
          **INPUT DATA:**
          1. Master Style (Environment, Style settings, original Subject).
          2. Slide Texts (The text to appear on each image).

          **GENERATION RULES:**
          1. **KEEP CONSISTENT:** Use the EXACT "Environment", "StyleAndTech" and "Lighting" provided in the Master Style.
          2. **EVOLVE SUBJECT:** Create a NEW Subject/Object for each slide that metaphorically represents the Slide Text. It must use the same materials (Gold/Silver) and aesthetic as the Master Style.
          3. **TEXT:** The prompt must include: Text: 'SLIDE_TEXT' Bold Sans-Serif, Important words in Gold, rest in White.
          4. **FORMAT:** Output a comma-separated string for each prompt.

          **OUTPUT:**
          Return a JSON Array of 4 strings (the full prompts).
        `,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response for carousel prompts");
    return JSON.parse(text);
  } catch (error) {
    console.error("Error generating carousel prompts:", error);
    // Fallback: just return the original prompt structure with new text if AI fails
    return slides.map(s => `${breakdown.styleAndTech}, ${breakdown.environment}, Subject representing ${s.text}, Text: '${s.text}'`);
  }
};

export const generateSingleCarouselPrompt = async (
  breakdown: DesignPrompt['breakdown'],
  slideText: string
): Promise<string> => {
    try {
        const ai = new GoogleGenAI({ apiKey: API_KEY });
        const inputPayload = {
            masterStyle: {
                environment: breakdown.environment,
                styleAndTech: breakdown.styleAndTech,
                action: breakdown.action,
                subject: breakdown.subject
            },
            slideText: slideText
        };

        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: `Generate 1 image prompt based on this style and text: ${JSON.stringify(inputPayload)}`,
            config: {
                systemInstruction: `
                **ACT AS:** Visual Consistency AI.
                **GOAL:** Generate 1 image prompt matching the Master Style for the provided text.
                **RULES:**
                1. Use EXACT Master Style settings.
                2. Create a metaphorical Subject for the text.
                3. Include: Text: '${slideText}' Bold Sans-Serif, Gold keywords.
                4. Output ONLY the raw prompt string.
                `,
            }
        });

        return response.text || `${breakdown.styleAndTech}, ${breakdown.environment}, Subject representing ${slideText}, Text: '${slideText}'`;
    } catch (error) {
        console.error("Error generating single prompt:", error);
        return `${breakdown.styleAndTech}, ${breakdown.environment}, Subject representing ${slideText}, Text: '${slideText}'`;
    }
}

export const generateImageFromPrompt = async (prompt: string): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey: API_KEY });
    console.log("Generating image for prompt:", prompt.substring(0, 50) + "...");

    // Using gemini-2.5-flash-image
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [{ text: prompt }],
      },
      config: {
        imageConfig: {
          aspectRatio: "1:1",
        }
      }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    
    throw new Error("No image data found in response");
  } catch (error: any) {
    console.error("Error generating image:", error);
    if (error.message?.includes('429')) {
        throw new Error("Rate limit exceeded. Please wait a moment.");
    }
    throw error;
  }
};

// Helper function to get platform-specific instructions
const getPlatformInstruction = (platform: string): string => {
    const BASE_INSTRUCTION = `You are the CryptoAX07 Marketing Agent. 
    Tone: calm, confident, educational, mentor-like. No hype, no moonboy talk.
    Focus on: Education, Utility, Long-term thinking.`;

    switch(platform) {
        case 'instagram':
            return `${BASE_INSTRUCTION}
            **TASK:** Write a Caption for an Instagram Carousel.
            **FORMATTING RULES (CRITICAL):**
            1. **PLAIN TEXT ONLY**: Do NOT use Markdown headers (like # or ##).
            2. **EMOJIS**: Use emojis 📸 🚀 💎 🧠 liberally to structure the post and replace bullet points.
            3. **LAYOUT**:
               - HOOK: A punchy first line.
               - [Empty Line]
               - SLIDE BREAKDOWN: Brief description of what is on the 5 slides.
               - [Empty Line]
               - CAPTION BODY: The educational value.
               - [Empty Line]
               - CTA: Soft call to action.
               - [Empty Line]
               - HASHTAGS: #Crypto #Education ...
            `;
        case 'twitter':
             return `${BASE_INSTRUCTION}
            **TASK:** Write a Twitter/X Thread.
            **FORMATTING RULES (CRITICAL):**
            1. **PLAIN TEXT ONLY**: No Markdown headers.
            2. **EMOJIS**: Use emojis in every tweet to catch attention.
            3. **THREAD FORMAT**: Separate each tweet with "---" and number them (e.g. 1/6, 2/6).
            4. **HOOK**: The first tweet must be a strong hook.
            `;
        case 'linkedin':
             return `${BASE_INSTRUCTION}
            **TASK:** Write a LinkedIn Authority Post.
            **FORMATTING RULES (CRITICAL):**
            1. **PLAIN TEXT ONLY**: No Markdown headers.
            2. **EMOJIS**: Use emojis moderately as bullet points (e.g. 👉, 💡).
            3. **LAYOUT**: Professional spacing. Short paragraphs (1-2 sentences).
            4. **STRUCTURE**: Hook -> Insight/Problem -> Solution/Framework -> Takeaway -> CTA.
            `;
        case 'blog':
            return `${BASE_INSTRUCTION}
            **TASK:** Write a Blog Post Outline & Intro.
            **FORMATTING RULES:**
            1. **MARKDOWN ALLOWED**: Use H1, H2, H3, Bold (**text**), Italic.
            2. **STRUCTURE**: Standard blog format.
            `;
        default:
            return BASE_INSTRUCTION;
    }
};

export const generateSocialContent = async (topic: string, platform: string): Promise<string> => {
    try {
        const ai = new GoogleGenAI({ apiKey: API_KEY });
        const systemInstruction = getPlatformInstruction(platform);

        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: `Topic: ${topic}`,
            config: {
                systemInstruction: systemInstruction
            }
        });

        return response.text || "Failed to generate content.";
    } catch (error) {
        console.error("Error generating social content:", error);
        throw error;
    }
}

export const refineSocialContent = async (originalContent: string, feedback: string, platform: string): Promise<string> => {
    try {
        const ai = new GoogleGenAI({ apiKey: API_KEY });
        const systemInstruction = getPlatformInstruction(platform);

        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: `
            ORIGINAL CONTENT:
            ${originalContent}

            USER FEEDBACK: ${feedback}

            TASK: Rewrite the content fully incorporating the user feedback. 
            CRITICAL: 
            1. Maintain the formatting rules for the platform (Plain Text vs Markdown).
            2. Return ONLY the new content text. Do not add conversational filler like "Here is the refined text".
            `,
            config: {
                systemInstruction: systemInstruction
            }
        });
        return response.text || originalContent;
    } catch (error) {
        console.error("Error refining content:", error);
        throw error;
    }
};

export const generateTrendingKeywords = async (): Promise<{
  trends: Array<{category: string, keywords: string[]}>,
  sources: Array<{title: string, uri: string}>
}> => {
  try {
    const ai = new GoogleGenAI({ apiKey: API_KEY });
    
    // Removed responseMimeType and responseSchema because they conflict with Google Search tool
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash", 
      contents: `Find the top 10 trending news topics and keywords in Cryptocurrency, Bitcoin, and Blockchain happening right now.
      
      RETURN FORMAT:
      You MUST return a VALID JSON string (and nothing else) with this exact structure:
      [
        { "category": "Category Name", "keywords": ["keyword1", "keyword2"] }
      ]
      
      Do not include markdown backticks or explanations. Just the JSON.`,
      config: {
        tools: [{ googleSearch: {} }],
      }
    });

    const text = response.text || "[]";
    
    // Manually clean and parse JSON
    const jsonString = text.replace(/```json\n?|\n?```/g, '').trim();
    let trends = [];
    try {
        trends = JSON.parse(jsonString);
    } catch (e) {
        console.warn("Raw text from search:", text);
        console.error("Failed to parse JSON from trending keywords", e);
    }

    // Extract Sources from Grounding Metadata
    const sources: Array<{title: string, uri: string}> = [];
    if (response.candidates?.[0]?.groundingMetadata?.groundingChunks) {
        response.candidates[0].groundingMetadata.groundingChunks.forEach((chunk: any) => {
            if (chunk.web) {
                sources.push({ title: chunk.web.title, uri: chunk.web.uri });
            }
        });
    }
    
    return { trends, sources };

  } catch (error) {
    console.error("Error fetching trending keywords:", error);
    // Fallback static data
    return {
        trends: [
            { category: "Market Sentiment", keywords: ["Bitcoin Halving Aftermath", "ETF Inflows", "Altcoin Season"] },
            { category: "Technology", keywords: ["Layer 2 Scaling", "ZK-Rollups", "Account Abstraction"] },
            { category: "Regulation", keywords: ["SEC vs Coinbase", "MiCA Regulation", "Stablecoin Laws"] }
        ],
        sources: []
    };
  }
};

export const generateViralHooks = async (): Promise<string[]> => {
  try {
    const ai = new GoogleGenAI({ apiKey: API_KEY });
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Generate 15 highly engaging, short "Hooks" or "Titles" for Crypto/Finance content.
      They should be punchy, alpha-focused, and suitable for visual headlines.
      Examples: "Silence is Golden", "Bear Market Builder", "Trust the Code", "Money is Energy".
      Return ONLY a JSON array of strings.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        }
      }
    });
    
    const text = response.text;
    if(!text) return [];
    return JSON.parse(text);
  } catch (error) {
    console.error("Error generating hooks", error);
    return ["Bitcoin is Truth", "Code is Law", "Inflation Thief", "Digital Gold", "Future of Money"];
  }
};