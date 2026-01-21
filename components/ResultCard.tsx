import React, { useState } from 'react';
import { GenerationResult, CalendarItem } from '../types';

interface ResultCardProps {
  result: GenerationResult;
  onRegenerate: (id: number, newPrompt: string) => void;
  onOpenCarousel: (result: GenerationResult) => void;
  onSaveToCalendar: (item: Omit<CalendarItem, 'id' | 'createdAt'>) => void;
}

const ResultCard: React.FC<ResultCardProps> = ({ result, onRegenerate, onOpenCarousel, onSaveToCalendar }) => {
  const { design, image } = result;
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedPrompt, setEditedPrompt] = useState(design.fullPrompt);

  const handleCopy = () => {
    navigator.clipboard.writeText(design.fullPrompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleEditClick = () => {
    setEditedPrompt(design.fullPrompt);
    setIsEditing(true);
  };

  const handleRegenerateClick = () => {
    setIsEditing(false);
    onRegenerate(design.id, editedPrompt);
  };

  const handleCancelClick = () => {
    setIsEditing(false);
    setEditedPrompt(design.fullPrompt);
  };

  const handleDownloadClick = () => {
    // Automatically save to calendar when downloading
    onSaveToCalendar({
      type: 'image',
      content: image.imageUrl,
      title: design.headline,
      platform: 'instagram' // Default assumption for visual assets
    });
  };

  return (
    <div className="bg-brand-dark border border-white/10 rounded-xl overflow-hidden flex flex-col h-full shadow-2xl hover:border-brand-gold/30 transition-all duration-500 group/card">
      {/* Image Area */}
      <div className="relative aspect-square w-full bg-black/50 overflow-hidden group">
        {image.loading ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center space-y-3">
            <div className="w-12 h-12 border-2 border-brand-gold border-t-transparent rounded-full animate-spin"></div>
            <p className="text-brand-gold text-xs font-mono animate-pulse">RENDERING ASSET...</p>
          </div>
        ) : image.error ? (
          <div className="absolute inset-0 flex items-center justify-center text-red-400 p-4 text-center text-sm">
            {image.error}
          </div>
        ) : image.imageUrl ? (
          <>
             <img 
              src={image.imageUrl} 
              alt={design.headline} 
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
            />
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex justify-end">
                <a 
                  href={image.imageUrl} 
                  download={`cryptoax07-${design.id}.png`}
                  onClick={handleDownloadClick}
                  className="bg-brand-gold hover:bg-white text-brand-navy px-3 py-1.5 rounded text-[10px] font-bold uppercase tracking-wider transition-colors"
                >
                  Download PNG
                </a>
            </div>
          </>
        ) : null}
      </div>

      {/* Content Area */}
      <div className="p-5 flex flex-col flex-grow relative bg-brand-dark/50">
        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-brand-gold/20 to-transparent"></div>
        
        <div className="flex justify-between items-center mb-4">
            <h3 className="text-brand-gold font-bold text-sm tracking-wider uppercase">Variant 0{design.id} // Concept</h3>
        </div>

        {/* Master Prompt Section */}
        <div className="relative mb-5 group/prompt">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-brand-gold/20 to-brand-slate/20 rounded blur opacity-0 group-hover/prompt:opacity-100 transition duration-500"></div>
            
            {isEditing ? (
                // Edit Mode
                <div className="relative bg-black/80 border border-brand-gold/50 rounded p-3 z-10">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-[10px] font-mono text-brand-gold uppercase tracking-widest">Editing Prompt</span>
                    </div>
                    <textarea 
                        value={editedPrompt}
                        onChange={(e) => setEditedPrompt(e.target.value)}
                        className="w-full bg-transparent text-[11px] font-mono text-white leading-relaxed outline-none resize-none h-32 border-b border-white/10 mb-3 focus:border-brand-gold/50 transition-colors p-1"
                        autoFocus
                    />
                    <div className="flex justify-end gap-2">
                         <button 
                            onClick={handleCancelClick}
                            className="text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded transition-colors text-gray-400 hover:text-white bg-white/5 hover:bg-white/10"
                        >
                            Cancel
                        </button>
                        <button 
                            onClick={handleRegenerateClick}
                            disabled={image.loading}
                            className="text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded transition-colors text-brand-navy bg-brand-gold hover:bg-white"
                        >
                            Regenerate
                        </button>
                    </div>
                </div>
            ) : (
                // Display Mode
                <div className="relative bg-black/40 border border-white/10 rounded p-3">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-[10px] font-mono text-brand-gold/70 uppercase tracking-widest">Master Prompt</span>
                        <div className="flex gap-2">
                            <button 
                                onClick={handleEditClick}
                                disabled={image.loading}
                                className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded transition-colors flex items-center gap-1 bg-white/5 hover:bg-brand-slate text-gray-400 hover:text-white"
                            >
                                EDIT
                            </button>
                            <button 
                                onClick={handleCopy}
                                className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded transition-colors flex items-center gap-1 ${
                                    copied ? 'bg-green-500/20 text-green-400' : 'bg-white/5 hover:bg-brand-gold text-gray-400 hover:text-brand-navy'
                                }`}
                            >
                                {copied ? (
                                <><span>✓</span> COPIED</>
                                ) : (
                                <>COPY</>
                                )}
                            </button>
                        </div>
                    </div>
                    <p className="text-[11px] leading-relaxed font-mono text-gray-300 break-words select-all line-clamp-4 hover:line-clamp-none transition-all cursor-text">
                        {design.fullPrompt}
                    </p>
                </div>
            )}
        </div>

        {/* Breakdown Details */}
        <div className="space-y-3 text-xs font-mono text-gray-500 overflow-y-auto max-h-[150px] scrollbar-thin scrollbar-thumb-white/10 pr-1">
          <div>
            <span className="text-white/20 uppercase block mb-1 text-[10px] tracking-widest">Subject</span>
            <p className="text-gray-400 leading-relaxed">{design.breakdown.subject}</p>
          </div>
          <div>
             <span className="text-white/20 uppercase block mb-1 text-[10px] tracking-widest">Action</span>
             <p className="text-gray-400 leading-relaxed">{design.breakdown.action}</p>
          </div>
          <div className="pt-2 border-t border-white/5">
             <button
               onClick={() => onOpenCarousel(result)}
               disabled={image.loading} 
               className="w-full bg-brand-navy border border-brand-gold/30 hover:border-brand-gold text-brand-gold hover:text-white hover:bg-brand-gold/10 py-2 rounded text-[10px] font-bold uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-2"
             >
                <span className="text-lg">❖</span> Create Carousel
             </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResultCard;