export interface DesignPrompt {
  id: number;
  headline: string;
  fullPrompt: string;
  breakdown: {
    subject: string;
    action: string;
    environment: string;
    styleAndTech: string;
    typographyInstruction: string;
  };
}

export interface GeneratedImage {
  promptId: number;
  imageUrl: string;
  loading: boolean;
  error?: string;
}

export interface GenerationResult {
  design: DesignPrompt;
  image: GeneratedImage;
}

export interface CarouselSlide {
  id: number;
  text: string;
  imageUrl: string;
  loading: boolean;
  prompt?: string;
}

export interface CalendarItem {
  id: string;
  type: 'image' | 'text';
  content: string; // Image URL or Text Body
  title: string; // Headline or Topic
  platform?: string; // 'instagram', 'twitter', etc.
  scheduledDate?: string; // ISO String YYYY-MM-DD
  createdAt: number;
}