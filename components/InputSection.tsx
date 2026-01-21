import React, { useState, useEffect } from 'react';

interface InputSectionProps {
  onSubmit: (headline: string) => void;
  isLoading: boolean;
  initialValue?: string;
}

const InputSection: React.FC<InputSectionProps> = ({ onSubmit, isLoading, initialValue }) => {
  const [input, setInput] = useState(initialValue || '');

  useEffect(() => {
    if (initialValue) {
        setInput(initialValue);
    }
  }, [initialValue]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      onSubmit(input);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto mt-12 px-4">
      <form onSubmit={handleSubmit} className="relative group">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-brand-gold to-brand-slate rounded-lg blur opacity-30 group-hover:opacity-75 transition duration-1000 group-hover:duration-200"></div>
        <div className="relative flex items-center bg-brand-dark rounded-lg p-1">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="ENTER HEADLINE..."
            className="w-full bg-transparent text-white px-6 py-4 outline-none font-mono text-lg placeholder-gray-600 uppercase"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className={`px-8 py-3 rounded-md font-bold uppercase tracking-wider transition-all duration-300 ${
              isLoading || !input.trim()
                ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                : 'bg-brand-gold text-brand-navy hover:bg-white hover:shadow-[0_0_20px_rgba(212,175,55,0.5)]'
            }`}
          >
            {isLoading ? 'Processing...' : 'Generate'}
          </button>
        </div>
      </form>
      <p className="mt-4 text-center text-gray-500 text-xs font-mono">
        ENTER A CONCEPT (E.G. "SILENCE IS GOLDEN", "BEAR MARKET BUILDER")
      </p>
    </div>
  );
};

export default InputSection;