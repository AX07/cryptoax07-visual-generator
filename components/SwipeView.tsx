import React, { useState, useEffect } from 'react';
import { generateViralHooks } from '../services/geminiService';

interface SwipeViewProps {
  approvedIdeas: string[];
  onApproveIdea: (idea: string) => void;
  onDismissIdea: (idea: string) => void;
  onRunWorkflow: (idea: string) => void;
  completedIdeas: string[]; // List of titles that are in the calendar
}

const SwipeView: React.FC<SwipeViewProps> = ({ 
    approvedIdeas, 
    onApproveIdea, 
    onDismissIdea, 
    onRunWorkflow,
    completedIdeas 
}) => {
  const [stack, setStack] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [ideaToEdit, setIdeaToEdit] = useState('');
  const [originalIdea, setOriginalIdea] = useState('');

  useEffect(() => {
    if (stack.length === 0) {
        fetchHooks();
    }
  }, []);

  const fetchHooks = async () => {
    setLoading(true);
    try {
        const hooks = await generateViralHooks();
        // Filter out already approved ideas to avoid duplicates
        const freshHooks = hooks.filter(h => !approvedIdeas.includes(h));
        setStack(freshHooks);
    } catch (e) {
        console.error(e);
    } finally {
        setLoading(false);
    }
  };

  const handleSwipeLeft = () => {
    if (stack.length > 0) {
        setStack(prev => prev.slice(1));
    }
  };

  const handleSwipeRight = () => {
    if (stack.length > 0) {
        onApproveIdea(stack[0]);
        setStack(prev => prev.slice(1));
    }
  };

  const openEditModal = (idea: string) => {
    setOriginalIdea(idea);
    setIdeaToEdit(idea);
    setIsEditModalOpen(true);
  };

  const handleConfirmRun = () => {
    // If name changed, we might need to update the approved list, 
    // but simplified: we just run the workflow with the new text.
    onRunWorkflow(ideaToEdit);
    setIsEditModalOpen(false);
  };

  const currentCard = stack[0];

  return (
    <div className="w-full max-w-7xl mx-auto px-4 pb-20 pt-10 flex flex-col md:flex-row gap-8 h-screen">
      
      {/* Left: The Swiper */}
      <div className="flex-grow flex flex-col items-center justify-center relative">
        <h2 className="absolute top-0 text-3xl font-bold text-white uppercase tracking-widest mb-10">
            Idea <span className="text-brand-gold">Filter</span>
        </h2>
        
        {loading && !currentCard ? (
             <div className="flex flex-col items-center justify-center space-y-4">
                <div className="w-16 h-16 border-2 border-brand-gold border-t-transparent rounded-full animate-spin"></div>
                <p className="text-brand-gold text-sm font-mono animate-pulse">MINING VIRAL HOOKS...</p>
            </div>
        ) : currentCard ? (
            <div className="relative w-full max-w-md aspect-[3/4] md:aspect-square bg-brand-dark border border-white/10 rounded-2xl shadow-2xl flex flex-col items-center justify-center p-10 animate-fade-in transition-all duration-300">
                <div className="absolute top-4 right-4 text-xs font-mono text-gray-600">
                    {stack.length} Remaining
                </div>
                
                <h3 className="text-4xl md:text-5xl font-bold text-center text-white leading-tight uppercase font-sans">
                    {currentCard}
                </h3>

                <div className="absolute bottom-10 flex gap-8">
                    <button 
                        onClick={handleSwipeLeft}
                        className="w-16 h-16 rounded-full border-2 border-red-500/50 text-red-500 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all duration-300 text-2xl"
                    >
                        ✕
                    </button>
                    <button 
                        onClick={handleSwipeRight}
                        className="w-16 h-16 rounded-full border-2 border-green-500/50 text-green-500 flex items-center justify-center hover:bg-green-500 hover:text-white transition-all duration-300 text-2xl"
                    >
                        ✓
                    </button>
                </div>
            </div>
        ) : (
            <div className="text-center">
                <p className="text-gray-500 mb-4">No more cards in stack.</p>
                <button onClick={fetchHooks} className="text-brand-gold font-bold uppercase tracking-wider text-sm hover:text-white">
                    Reload Hooks
                </button>
            </div>
        )}
      </div>

      {/* Right: Approved List (Stored on Top) */}
      <div className="w-full md:w-1/3 bg-brand-dark/50 border-l border-white/5 p-6 overflow-y-auto h-full">
        <h3 className="text-brand-gold text-xs font-bold uppercase tracking-widest mb-6 flex justify-between items-center">
            Approved Queue 
            <span className="bg-white/10 text-white px-2 py-0.5 rounded-full text-[9px]">{approvedIdeas.length}</span>
        </h3>

        <div className="space-y-4">
            {approvedIdeas.length === 0 ? (
                <p className="text-gray-600 text-xs italic text-center py-10">
                    Swipe Right to save ideas here.
                </p>
            ) : (
                approvedIdeas.map((idea, index) => {
                    const isCompleted = completedIdeas.includes(idea) || completedIdeas.some(c => c.includes(idea)); // loose match
                    
                    return (
                        <div key={index} className={`bg-brand-navy border ${isCompleted ? 'border-green-500/30' : 'border-white/10'} p-4 rounded-lg group transition-all`}>
                            <p className={`text-lg font-bold uppercase mb-3 ${isCompleted ? 'text-green-400' : 'text-white'}`}>
                                {idea}
                            </p>
                            
                            <div className="flex gap-2">
                                {isCompleted ? (
                                    <button 
                                        onClick={() => onDismissIdea(idea)}
                                        className="flex-grow bg-white/5 hover:bg-red-500/20 hover:text-red-400 text-gray-400 py-2 rounded text-[10px] font-bold uppercase tracking-wider transition-colors"
                                    >
                                        Dismiss
                                    </button>
                                ) : (
                                    <>
                                        <button 
                                            onClick={() => onDismissIdea(idea)}
                                            className="px-3 py-2 rounded text-[10px] font-bold uppercase tracking-wider bg-white/5 hover:bg-red-500/20 text-gray-500 hover:text-red-400 transition-colors"
                                        >
                                            Delete
                                        </button>
                                        <button 
                                            onClick={() => openEditModal(idea)}
                                            className="flex-grow bg-brand-gold text-brand-navy py-2 rounded text-[10px] font-bold uppercase tracking-wider hover:bg-white transition-colors flex items-center justify-center gap-2"
                                        >
                                            <span>🚀</span> Launch Protocol
                                        </button>
                                    </>
                                )}
                            </div>
                            {isCompleted && (
                                <p className="mt-2 text-[9px] text-green-500 font-mono text-center">
                                    ASSET SAVED TO CALENDAR
                                </p>
                            )}
                        </div>
                    );
                })
            )}
        </div>
      </div>

      {/* Edit/Launch Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-brand-dark border border-brand-gold/30 p-6 rounded-xl w-full max-w-lg shadow-2xl">
                <h3 className="text-lg font-bold text-white mb-4 uppercase">Initialize Workflow</h3>
                
                <div className="mb-6">
                    <label className="block text-[10px] text-gray-500 uppercase mb-2">Refine Headline</label>
                    <input 
                        type="text" 
                        value={ideaToEdit}
                        onChange={(e) => setIdeaToEdit(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 text-white px-4 py-3 rounded font-mono text-lg focus:border-brand-gold outline-none"
                    />
                </div>

                <div className="bg-brand-gold/10 p-4 rounded mb-6 border border-brand-gold/20">
                    <p className="text-[10px] text-brand-gold uppercase font-bold mb-2">Automated Actions:</p>
                    <ul className="text-[11px] text-gray-300 space-y-1 font-mono">
                        <li>1. Generate 3 Visual Design Prompts</li>
                        <li>2. Generate Social Media Caption</li>
                        <li>3. Prepare Assets for Calendar</li>
                    </ul>
                </div>

                <div className="flex gap-3 justify-end">
                    <button 
                        onClick={() => setIsEditModalOpen(false)}
                        className="px-4 py-2 rounded text-xs font-bold uppercase text-gray-400 hover:text-white"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={handleConfirmRun}
                        className="px-6 py-2 rounded text-xs font-bold uppercase bg-brand-gold text-brand-navy hover:bg-white shadow-[0_0_15px_rgba(212,175,55,0.4)]"
                    >
                        Generate All Assets
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default SwipeView;