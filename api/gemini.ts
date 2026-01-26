import { GoogleGenAI, Type } from "@google/genai";

const API_KEY = process.env.GEMINI_API_KEY;

// --- CONSTANTS & PROMPTS (Moved from client) ---

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

**CRITICAL: ENTITY & SAFETY HANDLING**
The Image Generation Model has strict safety filters for "Real People's Names". You must bypass this by describing them instead.

**RULE 1: FAMOUS PEOPLE -> VISUAL DESCRIPTIONS**
*   **NEVER** use the proper name of a celebrity or politician in the 'subject' or 'fullPrompt'.
*   **INSTEAD**, write a generic visual description.
*   *Example:* "Donald Trump" -> "A powerful elderly male figure with distinctive swept-back blond hair, wearing a suit" or "A golden bust of a president".
*   *Example:* "Elon Musk" -> "A visionary tech entrepreneur silhouette" or "A futuristic figure looking at a rocket".
*   *Example:* "Satoshi" -> "A mysterious hooded faceless figure".

**RULE 2: NATIONS -> SYMBOLS & FLAGS**
*   If a country/region is mentioned (USA, China, Europe, etc.), generate specific symbolic imagery.
*   **Flags:** "A massive, tattered cloth flag of the EU/USA rendered in high-contrast gold and black".
*   **Animals:** "A Cybernetic Eagle (USA)", "A Golden Panda (China)", "A Bull (Wall St)".
*   **Landmarks:** "The Capitol Building", "The Eiffel Tower", "The Great Wall".

**CONCEPT STRATEGY (3 DISTINCT VARIANTS):**
*   **Variant 1 (The "Safe" Character):** If a person is in the headline, render them as a **Golden Statue, Marble Bust, or Dramatic Silhouette**. DESCRIBE them visually (do not name them). If no person, use a central Hero Object (Coin, Hardware Wallet).
*   **Variant 2 (The National/Symbolic):** If a country is mentioned, use the **Flag, Map, or National Animal** (Eagle, Bear, Dragon) rendered in Gold/Cyberpunk style. If no country, use a Metaphor (Golden Gavel, Breaking Chains, Hourglass).
*   **Variant 3 (The Grand Scale):** A massive environmental scene. A futuristic city, a vault door, a network grid, or a monumental structure.

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

// Helper to pause execution
const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const getPlatformInstruction = (platform: string): string => {
  const BASE_INSTRUCTION = `You are the CryptoAX07 Marketing Agent. 
    Tone: calm, confident, educational, mentor-like. No hype, no moonboy talk.
    Focus on: Education, Utility, Long-term thinking.`;

  switch (platform) {
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

export default async function handler(request: Request) {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (!API_KEY) {
    return new Response(JSON.stringify({ error: 'Server configuration error: GEMINI_API_KEY is missing.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const { action, payload } = await request.json();
    const ai = new GoogleGenAI({ apiKey: API_KEY });

    switch (action) {
      case 'design-prompts': {
        const { headline } = payload;
        const response = await ai.models.generateContent({
          model: "gemini-1.5-flash", // Reverting to stable 1.5-flash from preview
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
        return new Response(JSON.stringify(parsed.map((p: any) => ({ ...p, headline }))));
      }

      case 'carousel-script': {
        const { headline } = payload;
        const response = await ai.models.generateContent({
          model: "gemini-1.5-flash",
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
        return new Response(text); // Already JSON string
      }

      case 'carousel-prompts': {
        const { breakdown, slides } = payload;
        const inputPayload = {
          masterStyle: {
            environment: breakdown.environment,
            styleAndTech: breakdown.styleAndTech,
            action: breakdown.action,
            subject: breakdown.subject
          },
          slides: slides.map((s: any) => s.text)
        };

        const response = await ai.models.generateContent({
          model: "gemini-1.5-flash",
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
        return new Response(response.text);
      }

      case 'single-carousel-prompt': {
        const { breakdown, slideText } = payload;
        const inputPayloadSingle = {
          masterStyle: {
            environment: breakdown.environment,
            styleAndTech: breakdown.styleAndTech,
            action: breakdown.action,
            subject: breakdown.subject
          },
          slideText: slideText
        };

        const response = await ai.models.generateContent({
          model: "gemini-1.5-flash",
          contents: `Generate 1 image prompt based on this style and text: ${JSON.stringify(inputPayloadSingle)}`,
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
        return new Response(JSON.stringify({ prompt: response.text }));
      }

      case 'generate-image': {
        // Server-side image generation (proxied)
        const { prompt, maxRetries = 1 } = payload; // REDUCED DEFAULT RETRIES

        // Timeout helper
        const withTimeout = <T>(promise: Promise<T>, ms: number): Promise<T> => {
          return Promise.race([
            promise,
            new Promise<T>((_, reject) => setTimeout(() => reject(new Error("Timeout")), ms))
          ]);
        };

        for (let attempt = 0; attempt <= maxRetries; attempt++) {
          try {
            console.log(`Generating image attempt ${attempt + 1}/${maxRetries + 1}...`);

            // Use gemini-2.0-flash-exp but wrap in 25s timeout to let Vercel fail gracefully
            const response = await withTimeout(ai.models.generateContent({
              model: 'gemini-2.0-flash-exp',
              contents: {
                parts: [{ text: prompt }],
              },
              config: {
                // @ts-ignore
                imageConfig: {
                  aspectRatio: "1:1"
                }
              }
            }), 25000); // 25s timeout per attempt

            // Check for inline data (Success case)
            for (const part of response.candidates?.[0]?.content?.parts || []) {
              if (part.inlineData) {
                return new Response(JSON.stringify({ image: `data:image/png;base64,${part.inlineData.data}` }));
              }
            }

            throw new Error("No image data found");

          } catch (error: any) {
            console.error(`Attempt ${attempt + 1} failed:`, error.message);

            if (attempt === maxRetries) throw error;

            // Reduced Wait: 2s, 4s...
            await wait(2000 * Math.pow(2, attempt));
          }
        }
      }

      case 'social-content': {
        const { topic, platform } = payload;
        const systemInstruction = getPlatformInstruction(platform);
        const response = await ai.models.generateContent({
          model: "gemini-1.5-flash",
          contents: `Topic: ${topic}`,
          config: { systemInstruction }
        });
        return new Response(JSON.stringify({ content: response.text }));
      }

      case 'refine-content': {
        const { originalContent, feedback, platform } = payload;
        const systemInstruction = getPlatformInstruction(platform);
        const response = await ai.models.generateContent({
          model: "gemini-1.5-flash",
          contents: `
            ORIGINAL CONTENT:
            ${originalContent}

            USER FEEDBACK: ${feedback}

            TASK: Rewrite the content fully incorporating the user feedback. 
            CRITICAL: 
            1. Maintain the formatting rules for the platform (Plain Text vs Markdown).
            2. Return ONLY the new content text. Do not add conversational filler like "Here is the refined text".
            `,
          config: { systemInstruction }
        });
        return new Response(JSON.stringify({ content: response.text }));
      }

      case 'trending-keywords': {
        // This relied on googleSearch tool. 
        const response = await ai.models.generateContent({
          model: "gemini-2.0-flash-exp",
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
        const jsonString = text.replace(/```json\n?|\n?```/g, '').trim();

        // Grounding metadata
        const sources: Array<{ title: string, uri: string }> = [];
        if (response.candidates?.[0]?.groundingMetadata?.groundingChunks) {
          response.candidates[0].groundingMetadata.groundingChunks.forEach((chunk: any) => {
            if (chunk.web) {
              sources.push({ title: chunk.web.title, uri: chunk.web.uri });
            }
          });
        }
        return new Response(JSON.stringify({ trends: JSON.parse(jsonString), sources }));
      }

      case 'viral-hooks': {
        const response = await ai.models.generateContent({
          model: "gemini-1.5-flash",
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
        return new Response(response.text);
      }

      default:
        return new Response(JSON.stringify({ error: 'Invalid action' }), { status: 400 });
    }

  } catch (error: any) {
    console.error("API Error:", error);
    return new Response(JSON.stringify({ error: error.message || "Internal Server Error" }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
