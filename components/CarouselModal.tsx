import React, { useState, useEffect } from 'react';
import { CarouselSlide, GenerationResult, CalendarItem } from '../types';
import { generateCarouselScript, generateImageFromPrompt, generateCarouselPrompts, generateSingleCarouselPrompt } from '../services/geminiService';

interface CarouselModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: GenerationResult | null;
  onSaveToCalendar: (item: Omit<CalendarItem, 'id' | 'createdAt'>) => void;
}

const CarouselModal: React.FC<CarouselModalProps> = ({ isOpen, onClose, result, onSaveToCalendar }) => {
  const [loadingScript, setLoadingScript] = useState(false);
  const [generatingImages, setGeneratingImages] = useState(false);
  const [slides, setSlides] = useState<CarouselSlide[]>([]);
  const [savedSlides, setSavedSlides] = useState<number[]>([]);

  // Reset when opening
  useEffect(() => {
    if (isOpen && result) {
      setSlides([]);
      setSavedSlides([]);
      fetchScript();
    }
  }, [isOpen, result]);

  const fetchScript = async () => {
    if (!result) return;
    setLoadingScript(true);
    try {
      const scriptPoints = await generateCarouselScript(result.design.headline);
      const initialSlides = scriptPoints.map((text, index) => ({
        id: index,
        text: text,
        imageUrl: '',
        loading: false
      }));
      setSlides(initialSlides);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingScript(false);
    }
  };

  const handleTextChange = (id: number, newText: string) => {
    setSlides(prev => prev.map(s => s.id === id ? { ...s, text: newText } : s));
  };

  const generateCarouselImages = async () => {
    if (!result) return;
    setGeneratingImages(true);
    
    // We update state to show loading for all
    setSlides(prev => prev.map(s => ({ ...s, loading: true })));

    try {
        // Step 1: Generate unique prompts for each slide based on its text
        const uniquePrompts = await generateCarouselPrompts(result.design.breakdown, slides);

        // Step 2: Generate images Sequentially to avoid Rate Limits
        for (let index = 0; index < slides.length; index++) {
            const slide = slides[index];
            try {
                const specificPrompt = uniquePrompts[index] || `${result.design.fullPrompt} Text: '${slide.text}'`;
                
                // Generate
                const url = await generateImageFromPrompt(specificPrompt);
                
                // Update specific slide
                setSlides(prev => prev.map(s => s.id === slide.id ? { 
                    ...s, 
                    imageUrl: url, 
                    loading: false, 
                    prompt: specificPrompt 
                } : s));

                // Add delay between slides to respect rate limits
                if (index < slides.length - 1) {
                    await new Promise(r => setTimeout(r, 2000));
                }

            } catch (e) {
                console.error("Error generating slide", index, e);
                // Mark as failed but keep previous state/text
                setSlides(prev => prev.map(s => s.id === slide.id ? { ...s, loading: false } : s));
            }
        }

    } catch (error) {
        console.error("Failed carousel generation flow", error);
        setSlides(prev => prev.map(s => ({ ...s, loading: false })));
    } finally {
        setGeneratingImages(false);
    }
  };

  const regenerateSlide = async (slide: CarouselSlide) => {
    if(!result) return;
    
    // Set this slide to loading
    setSlides(prev => prev.map(s => s.id === slide.id ? { ...s, loading: true } : s));

    try {
        // Generate a new prompt specifically for this slide (in case text changed or user wants variation)
        const newPrompt = await generateSingleCarouselPrompt(result.design.breakdown, slide.text);
        
        // Generate image
        const newUrl = await generateImageFromPrompt(newPrompt);

        setSlides(prev => prev.map(s => s.id === slide.id ? { 
            ...s, 
            imageUrl: newUrl, 
            prompt: newPrompt, 
            loading: false 
        } : s));

    } catch (e) {
        console.error("Error regenerating slide", e);
        setSlides(prev => prev.map(s => s.id === slide.id ? { ...s, loading: false } : s));
    }
  };

  const handleDownloadAndSave = (slide: CarouselSlide) => {
    if (!result) return;
    // Trigger Save to Calendar
    onSaveToCalendar({
        type: 'image',
        content: slide.imageUrl,
        title: `${result.design.headline} - Slide ${slide.id + 1}`,
        platform: 'instagram'
    });
    
    // Visual feedback
    if(!savedSlides.includes(slide.id)) {
        setSavedSlides(prev => [...prev, slide.id]);
    }
  };

  const handleSaveAllToCalendar = () => {
      if(!result) return;
      slides.forEach(slide => {
          if(slide.imageUrl && !slide.loading) {
              onSaveToCalendar({
                  type: 'image',
                  content: slide.imageUrl,
                  title: `${result.design.headline} - Slide ${slide.id + 1}`,
                  platform: 'instagram'
              });
              if(!savedSlides.includes(slide.id)) {
                  setSavedSlides(prev => [...prev, slide.id]);
              }
          }
      });
  };

  if (!isOpen || !result) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm animate-fade-in">
      <div className="bg-brand-navy border border-brand-gold/20 w-full max-w-6xl max-h-[90vh] overflow-hidden rounded-2xl flex flex-col shadow-[0_0_50px_rgba(0,0,0,0.8)]">
        
        {/* Header */}
        <div className="p-6 border-b border-white/10 flex justify-between items-center bg-brand-dark">
            <div>
                <h2 className="text-xl font-bold text-white uppercase tracking-widest">
                    Carousel Builder <span className="text-brand-gold">// {result.design.headline}</span>
                </h2>
                <p className="text-gray-400 text-xs font-mono mt-1">Based on Variant 0{result.design.id} Aesthetics</p>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
        </div>

        {/* Body */}
        <div className="flex-grow overflow-y-auto p-6">
            
            {loadingScript ? (
                <div className="flex flex-col items-center justify-center h-64 space-y-4">
                    <div className="w-12 h-12 border-2 border-brand-gold border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-brand-gold text-sm font-mono animate-pulse">ANALYZING CONCEPT & WRITING SCRIPT...</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {slides.map((slide, index) => (
                        <div key={slide.id} className="bg-brand-dark/50 border border-white/5 rounded-lg p-4 flex flex-col gap-4 relative group/card">
                            <div className="flex justify-between items-center">
                                <span className="text-xs font-bold text-brand-gold uppercase tracking-wider">Slide 0{index + 1}</span>
                                {slide.imageUrl && !slide.loading && (
                                    <button 
                                        onClick={() => regenerateSlide(slide)}
                                        className="text-gray-500 hover:text-white transition-colors"
                                        title="Regenerate this specific slide"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                                    </button>
                                )}
                            </div>

                            {/* Text Input */}
                            <div className="relative group">
                                <label className="block text-[10px] text-gray-500 mb-1 uppercase tracking-widest">Subheading Text</label>
                                <input 
                                    type="text" 
                                    value={slide.text}
                                    onChange={(e) => handleTextChange(slide.id, e.target.value)}
                                    className="w-full bg-black/40 border border-white/10 rounded px-3 py-2 text-sm text-white font-mono focus:border-brand-gold/50 outline-none transition-colors"
                                />
                            </div>

                            {/* Image Preview */}
                            <div className="aspect-square bg-black/60 rounded overflow-hidden relative border border-white/5">
                                {slide.loading ? (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                                        <div className="w-8 h-8 border-2 border-brand-gold border-t-transparent rounded-full animate-spin mb-2"></div>
                                        <span className="text-[10px] text-brand-gold font-mono">RENDERING...</span>
                                    </div>
                                ) : slide.imageUrl ? (
                                    <div className="relative w-full h-full group/img">
                                        <img src={slide.imageUrl} alt={`Slide ${index + 1}`} className="w-full h-full object-cover" />
                                        
                                        {/* Overlay Actions */}
                                        <div className="absolute inset-0 bg-black/80 opacity-0 group-hover/img:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                                            <a 
                                                href={slide.imageUrl} 
                                                download={`carousel-${result.design.id}-slide-${index+1}.png`}
                                                onClick={() => handleDownloadAndSave(slide)}
                                                className="bg-brand-gold text-brand-navy px-3 py-1.5 text-xs font-bold uppercase rounded hover:bg-white flex items-center gap-1"
                                            >
                                                <span>⬇</span> Download
                                            </a>
                                            <button 
                                                onClick={() => regenerateSlide(slide)}
                                                className="bg-white/10 text-white border border-white/20 px-3 py-1.5 text-xs font-bold uppercase rounded hover:bg-white/20 flex items-center gap-1"
                                            >
                                                <span>↻</span> Regenerate
                                            </button>
                                            
                                            {savedSlides.includes(slide.id) && (
                                                <span className="text-[9px] text-green-400 font-mono mt-1">✓ SAVED TO CALENDAR</span>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="absolute inset-0 flex items-center justify-center text-gray-600 text-xs font-mono text-center px-4">
                                        WAITING FOR GENERATION
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-white/10 bg-brand-dark flex justify-between gap-4">
            <div className="flex gap-4">
                 <button 
                    onClick={handleSaveAllToCalendar}
                    disabled={slides.length === 0 || generatingImages}
                    className="px-6 py-2 rounded text-xs font-bold uppercase tracking-wider text-brand-gold border border-brand-gold/30 hover:bg-brand-gold hover:text-brand-navy transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Save All to Schedule
                </button>
            </div>
            
            <div className="flex gap-4">
                <button 
                    onClick={onClose}
                    className="px-6 py-2 rounded text-xs font-bold uppercase tracking-wider text-gray-400 hover:text-white transition-colors"
                >
                    Close
                </button>
                <button 
                    onClick={generateCarouselImages}
                    disabled={loadingScript || generatingImages || slides.length === 0}
                    className={`px-8 py-2 rounded text-xs font-bold uppercase tracking-wider transition-all ${
                        loadingScript || generatingImages 
                        ? 'bg-gray-700 text-gray-500 cursor-not-allowed' 
                        : 'bg-brand-gold text-brand-navy hover:bg-white shadow-[0_0_15px_rgba(212,175,55,0.3)]'
                    }`}
                >
                    {generatingImages ? 'Generating Assets...' : 'Confirm & Generate Slides'}
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default CarouselModal;