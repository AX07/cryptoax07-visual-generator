import { DesignPrompt } from "../types";

const CALL_API_URL = '/api/gemini';

async function callApi<T>(action: string, payload: any): Promise<T> {
  const response = await fetch(CALL_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, payload }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `API Error: ${response.statusText}`);
  }

  return response.json();
}

export const generateDesignPrompts = async (headline: string): Promise<DesignPrompt[]> => {
  return callApi<DesignPrompt[]>('design-prompts', { headline });
};

export const generateCarouselScript = async (headline: string): Promise<string[]> => {
  return callApi<string[]>('carousel-script', { headline });
};

export const generateCarouselPrompts = async (
  breakdown: DesignPrompt['breakdown'],
  slides: { id: number; text: string }[]
): Promise<string[]> => {
  return callApi<string[]>('carousel-prompts', { breakdown, slides });
};

export const generateSingleCarouselPrompt = async (
  breakdown: DesignPrompt['breakdown'],
  slideText: string
): Promise<string> => {
  const res = await callApi<{ prompt: string }>('single-carousel-prompt', { breakdown, slideText });
  return res.prompt;
};

export const generateImageFromPrompt = async (prompt: string, maxRetries = 3): Promise<string> => {
  const res = await callApi<{ image: string }>('generate-image', { prompt, maxRetries });
  return res.image;
};

export const generateSocialContent = async (topic: string, platform: string): Promise<string> => {
  const res = await callApi<{ content: string }>('social-content', { topic, platform });
  return res.content;
};

export const refineSocialContent = async (originalContent: string, feedback: string, platform: string): Promise<string> => {
  const res = await callApi<{ content: string }>('refine-content', { originalContent, feedback, platform });
  return res.content;
};

export const generateTrendingKeywords = async (): Promise<{
  trends: Array<{ category: string, keywords: string[] }>,
  sources: Array<{ title: string, uri: string }>
}> => {
  return callApi<{
    trends: Array<{ category: string, keywords: string[] }>,
    sources: Array<{ title: string, uri: string }>
  }>('trending-keywords', {});
};

export const generateViralHooks = async (): Promise<string[]> => {
  return callApi<string[]>('viral-hooks', {});
};