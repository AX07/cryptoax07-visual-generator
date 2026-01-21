import React, { useState, useEffect } from 'react';
import InputSection from './InputSection';
import { generateSocialContent, refineSocialContent } from '../services/geminiService';
import { CalendarItem } from '../types';

const platforms = [
  { id: 'instagram', label: 'Instagram', icon: '📸' },
  { id: 'twitter', label: 'Twitter / X', icon: '🐦' },
  { id: 'linkedin', label: 'LinkedIn', icon: '💼' },
  { id: 'blog', label: 'Blog', icon: '📝' },
];

interface ContentWriterProps {
    initialTopic?: string;
    onSaveToCalendar: (item: Omit<CalendarItem, 'id' | 'createdAt'>) => void;
    autoGenerate?: boolean;
    onAutoGenerateComplete?: () => void;
}

const ContentWriter: React.FC<ContentWriterProps> = ({ 
    initialTopic, 
    onSaveToCalendar,
    autoGenerate,
    onAutoGenerateComplete 
}) => {
  const [activePlatform, setActivePlatform] = useState('instagram');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [topic, setTopic] = useState('');
  
  // Editor State
  const [isEditing, setIsEditing] = useState(false);
  const [refinementPrompt, setRefinementPrompt] = useState('');
  const [isRefining, setIsRefining] = useState(false);
  const [justCopied, setJustCopied] = useState(false);

  useEffect(() => {
    if (initialTopic) {
        setTopic(initialTopic);
    }
  }, [initialTopic]);

  // Auto Generate Logic
  useEffect(() => {
    if (autoGenerate && initialTopic) {
        handleGenerate(initialTopic);
        if (onAutoGenerateComplete) onAutoGenerateComplete();
    }
  }, [autoGenerate, initialTopic]);

  const handleGenerate = async (inputTopic: string) => {
    setLoading(true);
    setTopic(inputTopic);
    setContent('');
    setIsEditing(false); 
    try {
      const generatedText = await generateSocialContent(inputTopic, activePlatform);
      setContent(generatedText);
    } catch (e) {
      console.error(e);
      setContent("Error generating content. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleRefine = async () => {
    if (!refinementPrompt.trim()) return;
    setIsRefining(true);
    try {
        const newContent = await refineSocialContent(content, refinementPrompt, activePlatform);
        setContent(newContent);
        setRefinementPrompt('');
    } catch (e) {
        console.error(e);
    } finally {
        setIsRefining(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setJustCopied(true);
    setTimeout(() => setJustCopied(false), 2000);
    
    // Auto-save to calendar on copy
    onSaveToCalendar({
      type: 'text',
      content: content,
      title: topic || 'Generated Content',
      platform: activePlatform
    });
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-4 pb-20">
      <div className="flex flex-col items-center justify-center pt-20 pb-10">
        <h2 className="text-3xl md:text-5xl font-bold text-center text-white mb-6">
            NARRATIVE <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-gold via-white to-brand-gold">
            ENGINE
            </span>
        </h2>
        <p className="text-gray-400 text-center max-w-lg mb-8 font-light">
            Craft high-impact educational content for every platform. 
            One concept, omnipresent distribution.
        </p>
      </div>

      {/* Platform Tabs */}
      <div className="flex justify-center mb-8">
        <div className="inline-flex bg-brand-dark border border-white/10 rounded-lg p-1">
          {platforms.map((p) => (
            <button
              key={p.id}
              onClick={() => setActivePlatform(p.id)}
              className={`flex items-center gap-2 px-6 py-3 rounded-md text-sm font-bold uppercase tracking-wider transition-all ${
                activePlatform === p.id
                  ? 'bg-brand-gold text-brand-navy shadow-lg'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <span>{p.icon}</span>
              <span className="hidden md:inline">{p.label}</span>
            </button>
          ))}
        </div>
      </div>

      <InputSection 
        onSubmit={handleGenerate} 
        isLoading={loading} 
        initialValue={initialTopic || ''}
      />

      {/* Output Area */}
      {(content || loading) && (
        <div className="mt-12 animate-fade-in-up">
           <div className="flex items-center justify-between mb-4">
              <span className="text-brand-gold font-mono uppercase tracking-widest text-sm">
                {isEditing ? 'Behind the Scenes // Editor' : `Generated Output // ${platforms.find(p => p.id === activePlatform)?.label}`}
              </span>
              
              {!loading && !isEditing && (
                <div className="flex gap-2">
                    <button 
                        onClick={handleCopy}
                        className={`text-xs font-bold uppercase tracking-wider px-4 py-2 rounded transition-colors border ${
                            justCopied 
                            ? 'bg-green-500/20 text-green-400 border-green-500/30' 
                            : 'bg-white/10 hover:bg-green-500/20 hover:text-green-400 text-white border-white/5'
                        }`}
                    >
                        {justCopied ? 'Saved to Calendar!' : 'Copy to Clipboard'}
                    </button>
                    <button 
                        onClick={() => setIsEditing(true)}
                        className="text-xs font-bold uppercase tracking-wider px-4 py-2 rounded bg-brand-navy border border-brand-gold/30 hover:bg-brand-gold/10 text-brand-gold transition-colors"
                    >
                        Edit / Refine
                    </button>
                </div>
              )}
           </div>
           
           {/* Preview Mode */}
           {!isEditing && (
                <div className="bg-brand-dark border border-white/10 rounded-xl p-8 min-h-[300px] shadow-2xl relative">
                    {loading ? (
                        <div className="absolute inset-0 flex flex-col items-center justify-center space-y-4">
                            <div className="w-12 h-12 border-2 border-brand-gold border-t-transparent rounded-full animate-spin"></div>
                            <p className="text-brand-gold text-sm font-mono animate-pulse">WRITING CONTENT...</p>
                        </div>
                    ) : (
                        <div className="prose prose-invert prose-headings:text-brand-gold prose-p:text-gray-300 prose-li:text-gray-300 max-w-none">
                            <pre className="whitespace-pre-wrap font-sans text-sm md:text-base leading-relaxed text-gray-200">{content}</pre>
                        </div>
                    )}
                </div>
           )}

           {/* Editor Mode */}
           {isEditing && (
               <div className="bg-black/40 border border-brand-gold/30 rounded-xl p-6 shadow-[0_0_30px_rgba(0,0,0,0.5)] animate-fade-in">
                    <div className="flex justify-between items-center mb-4">
                        <p className="text-gray-500 text-xs font-mono">EDITING RAW MARKDOWN</p>
                    </div>

                    <textarea 
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        className="w-full h-96 bg-brand-dark border border-white/10 rounded-lg p-6 text-sm font-mono text-gray-300 focus:border-brand-gold/50 outline-none resize-none leading-relaxed shadow-inner"
                        spellCheck={false}
                    />

                    {/* AI Refinement Section */}
                    <div className="mt-6 pt-6 border-t border-white/10">
                        <label className="block text-brand-gold text-xs font-bold uppercase tracking-widest mb-3">
                            AI Refinement Agent
                        </label>
                        <div className="flex gap-3">
                            <div className="relative flex-grow group">
                                <div className="absolute -inset-0.5 bg-gradient-to-r from-brand-gold/20 to-brand-slate/20 rounded-md blur opacity-0 group-hover:opacity-100 transition duration-500"></div>
                                <input 
                                    type="text" 
                                    value={refinementPrompt}
                                    onChange={(e) => setRefinementPrompt(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleRefine()}
                                    placeholder="Give instructions... (e.g. 'Make it punchier', 'Add 3 emojis', 'Focus more on Bitcoin')"
                                    className="relative w-full bg-brand-dark border border-white/10 rounded-md px-4 py-3 text-sm text-white focus:border-brand-gold/50 outline-none transition-colors placeholder-gray-600"
                                />
                            </div>
                            <button 
                                onClick={handleRefine}
                                disabled={isRefining || !refinementPrompt.trim()}
                                className="bg-brand-gold text-brand-navy px-6 py-2 rounded-md text-xs font-bold uppercase tracking-wider hover:bg-white hover:shadow-[0_0_15px_rgba(212,175,55,0.4)] transition-all disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap min-w-[120px] flex items-center justify-center"
                            >
                                {isRefining ? (
                                    <div className="w-4 h-4 border-2 border-brand-navy border-t-transparent rounded-full animate-spin"></div>
                                ) : (
                                    'Regenerate'
                                )}
                            </button>
                        </div>
                        <p className="mt-2 text-[10px] text-gray-500 font-mono">
                            Use the AI to iterate on the specific tone or structure. Manual edits above will be overwritten if you regenerate.
                        </p>
                    </div>

                    <div className="mt-8 flex justify-end gap-4">
                        <button 
                            onClick={() => setIsEditing(false)}
                            className="text-white text-xs font-bold uppercase tracking-wider px-6 py-3 rounded hover:bg-white/5 border border-transparent hover:border-white/10 transition-colors"
                        >
                            Save & Preview Final
                        </button>
                    </div>
               </div>
           )}
        </div>
      )}
    </div>
  );
};

export default ContentWriter;