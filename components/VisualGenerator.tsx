import React, { useState, useEffect } from 'react';
import InputSection from './InputSection';
import ResultCard from './ResultCard';
import CarouselModal from './CarouselModal';
import { generateDesignPrompts, generateImageFromPrompt } from '../services/geminiService';
import { GenerationResult, DesignPrompt, CalendarItem } from '../types';

interface VisualGeneratorProps {
  onSaveToCalendar: (item: Omit<CalendarItem, 'id' | 'createdAt'>) => void;
  initialTopic?: string;
  autoGenerate?: boolean;
  onAutoGenerateComplete?: () => void;
}

const VisualGenerator: React.FC<VisualGeneratorProps> = ({ 
    onSaveToCalendar, 
    initialTopic, 
    autoGenerate, 
    onAutoGenerateComplete 
}) => {
  const [results, setResults] = useState<GenerationResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentHeadline, setCurrentHeadline] = useState('');
  
  // Carousel State
  const [isCarouselOpen, setIsCarouselOpen] = useState(false);
  const [selectedResultForCarousel, setSelectedResultForCarousel] = useState<GenerationResult | null>(null);

  // Auto Generate Logic
  useEffect(() => {
    if (autoGenerate && initialTopic && initialTopic !== currentHeadline) {
        handleGenerate(initialTopic);
        if (onAutoGenerateComplete) onAutoGenerateComplete();
    }
  }, [autoGenerate, initialTopic]);

  const handleGenerate = async (headline: string) => {
    setLoading(true);
    setCurrentHeadline(headline);
    setResults([]);

    try {
      const prompts = await generateDesignPrompts(headline);
      
      const initialResults: GenerationResult[] = prompts.map((p) => ({
        design: p,
        image: { promptId: p.id, imageUrl: '', loading: true }
      }));
      setResults(initialResults);

      // Execute sequentially to avoid rate limits
      for (const prompt of prompts) {
         await fetchImageForPrompt(prompt);
         // Add a small safety delay between images even if sequential
         await new Promise(r => setTimeout(r, 2000));
      }

    } catch (error: any) {
      console.error("Failed to generate workflow:", error);
      alert("Failed to generate concepts. " + (error.message || "Please check your configuration."));
    } finally {
      setLoading(false); 
    }
  };

  const fetchImageForPrompt = async (prompt: DesignPrompt) => {
    try {
      const base64Image = await generateImageFromPrompt(prompt.fullPrompt);
      
      setResults(prev => prev.map(item => {
        if (item.design.id === prompt.id) {
          return {
            ...item,
            image: { ...item.image, imageUrl: base64Image, loading: false }
          };
        }
        return item;
      }));
    } catch (error: any) {
      console.error("Error fetching image for prompt:", prompt.id, error);
      
      // Extract meaningful error info (e.g. "403 Forbidden")
      const errorMsg = error.message?.includes("403") 
        ? "Access Denied (403). Check API Key Domain Restrictions." 
        : error.message || "Generation Failed";

      setResults(prev => prev.map(item => {
        if (item.design.id === prompt.id) {
          return {
            ...item,
            image: { ...item.image, loading: false, error: errorMsg }
          };
        }
        return item;
      }));
    }
  };

  const handleRegenerate = async (id: number, newPrompt: string) => {
    setResults(prev => prev.map(item => {
      if (item.design.id === id) {
        return {
          ...item,
          design: { ...item.design, fullPrompt: newPrompt },
          image: { ...item.image, loading: true, error: undefined }
        };
      }
      return item;
    }));

    try {
      const base64Image = await generateImageFromPrompt(newPrompt);
      
      setResults(prev => prev.map(item => {
        if (item.design.id === id) {
          return {
            ...item,
            image: { ...item.image, imageUrl: base64Image, loading: false }
          };
        }
        return item;
      }));
    } catch (error: any) {
      console.error("Error regenerating image:", id, error);
      setResults(prev => prev.map(item => {
        if (item.design.id === id) {
          return {
            ...item,
            image: { ...item.image, loading: false, error: error.message || "Regeneration Failed" }
          };
        }
        return item;
      }));
    }
  };

  const openCarouselModal = (result: GenerationResult) => {
    setSelectedResultForCarousel(result);
    setIsCarouselOpen(true);
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 pb-20">
        <div className="flex flex-col items-center justify-center min-h-[40vh]">
          <h2 className="text-3xl md:text-5xl font-bold text-center text-white mb-6">
             VISUAL DOMINANCE <br />
             <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-gold via-white to-brand-gold">
               PROTOCOL
             </span>
          </h2>
          <p className="text-gray-400 text-center max-w-lg mb-8 font-light">
            Generate high-contrast, cinematic assets for your crypto narrative. 
            Alpha-grade aesthetics powered by AI.
          </p>
          
          <InputSection onSubmit={handleGenerate} isLoading={loading} initialValue={initialTopic} />
        </div>

        {results.length > 0 && (
          <div className="mt-16 animate-fade-in-up">
            <div className="flex items-center space-x-4 mb-8">
              <div className="h-[1px] flex-grow bg-white/10"></div>
              <h3 className="text-brand-gold font-mono uppercase tracking-widest text-sm">
                Generated Assets: "{currentHeadline}"
              </h3>
              <div className="h-[1px] flex-grow bg-white/10"></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {results.map((result) => (
                <ResultCard 
                  key={result.design.id} 
                  result={result} 
                  onRegenerate={handleRegenerate}
                  onOpenCarousel={openCarouselModal}
                  onSaveToCalendar={onSaveToCalendar}
                />
              ))}
            </div>
          </div>
        )}

      <CarouselModal 
        isOpen={isCarouselOpen}
        onClose={() => setIsCarouselOpen(false)}
        result={selectedResultForCarousel}
        onSaveToCalendar={onSaveToCalendar}
      />
    </div>
  );
};

export default VisualGenerator;