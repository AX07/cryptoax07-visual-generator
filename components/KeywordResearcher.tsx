import React, { useState, useEffect } from 'react';
import { generateTrendingKeywords } from '../services/geminiService';

interface KeywordResearcherProps {
  onSelectKeyword: (keyword: string) => void;
}

const KeywordResearcher: React.FC<KeywordResearcherProps> = ({ onSelectKeyword }) => {
  const [trends, setTrends] = useState<Array<{category: string, keywords: string[]}>>([]);
  const [sources, setSources] = useState<Array<{title: string, uri: string}>>([]);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchTrends = async () => {
    setLoading(true);
    setSources([]);
    try {
      const data = await generateTrendingKeywords();
      setTrends(data.trends);
      setSources(data.sources);
      setLastUpdated(new Date());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrends();
  }, []);

  return (
    <div className="w-full max-w-7xl mx-auto px-4 pb-20">
      <div className="flex flex-col items-center justify-center pt-20 pb-10">
        <h2 className="text-3xl md:text-5xl font-bold text-center text-white mb-6">
            SIGNAL <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-gold via-white to-brand-gold">
            INTELLIGENCE
            </span>
        </h2>
        <p className="text-gray-400 text-center max-w-lg mb-8 font-light">
            Real-time market analysis. Identify high-value narratives before they become noise.
        </p>
        
        <button 
            onClick={fetchTrends}
            disabled={loading}
            className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-brand-gold hover:text-white transition-colors disabled:opacity-50"
        >
            <span className={`text-lg ${loading ? 'animate-spin' : ''}`}>↻</span> 
            {loading ? 'Scanning Network...' : 'Refresh Data'}
        </button>
      </div>

      {loading && !trends.length ? (
        <div className="flex flex-col items-center justify-center h-64 space-y-4">
            <div className="w-16 h-16 border-2 border-brand-gold border-t-transparent rounded-full animate-spin"></div>
            <p className="text-brand-gold text-sm font-mono animate-pulse">ACCESSING LIVE NEWS FEED...</p>
        </div>
      ) : (
        <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-fade-in-up">
                {trends.map((group, index) => (
                    <div key={index} className="bg-brand-dark border border-white/10 rounded-xl p-6 hover:border-brand-gold/30 transition-all group">
                        <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/5">
                            <h3 className="text-white font-bold uppercase tracking-widest text-sm">{group.category}</h3>
                            <span className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]"></span>
                        </div>
                        <div className="space-y-3">
                            {group.keywords.map((keyword, kIndex) => (
                                <button
                                    key={kIndex}
                                    onClick={() => onSelectKeyword(keyword)}
                                    className="w-full text-left p-3 rounded bg-white/5 hover:bg-brand-gold hover:text-brand-navy transition-all duration-300 group/btn flex justify-between items-center"
                                >
                                    <span className="font-mono text-sm">{keyword}</span>
                                    <span className="opacity-0 group-hover/btn:opacity-100 transform translate-x-2 group-hover/btn:translate-x-0 transition-all text-xs font-bold">
                                        DRAFT →
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {/* Sources Section */}
            {sources.length > 0 && (
                <div className="mt-12 pt-8 border-t border-white/5 animate-fade-in">
                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-4 text-center">Data Sources</h4>
                    <div className="flex flex-wrap justify-center gap-4">
                        {sources.slice(0, 5).map((source, i) => (
                            <a 
                                key={i} 
                                href={source.uri} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-[10px] text-brand-gold/70 hover:text-brand-gold border border-brand-gold/20 rounded px-2 py-1 bg-black/20"
                            >
                                {source.title}
                            </a>
                        ))}
                    </div>
                </div>
            )}
        </>
      )}
      
      {lastUpdated && (
        <div className="mt-12 text-center text-[10px] font-mono text-gray-600">
            LAST SYNC: {lastUpdated.toLocaleTimeString()} // SOURCE: GOOGLE SEARCH GROUNDING
        </div>
      )}
    </div>
  );
};

export default KeywordResearcher;