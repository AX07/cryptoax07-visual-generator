import React from 'react';

interface SidebarProps {
  activeView: 'visual' | 'writer' | 'research' | 'calendar' | 'swipe';
  onNavigate: (view: 'visual' | 'writer' | 'research' | 'calendar' | 'swipe') => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeView, onNavigate }) => {
  return (
    <aside className="w-20 md:w-64 fixed left-0 top-0 h-full bg-brand-dark border-r border-white/10 flex flex-col z-40">
      {/* Logo Area */}
      <div className="h-20 flex items-center justify-center md:justify-start md:px-6 border-b border-white/5 bg-brand-navy">
        <div className="w-10 h-10 bg-brand-gold rounded-sm flex items-center justify-center font-bold text-brand-navy text-xl">
            AX
        </div>
        <span className="hidden md:block ml-3 font-bold text-white tracking-widest">
            CRYPTO<span className="text-brand-gold">AX07</span>
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-grow py-8 space-y-2">
        <button
          onClick={() => onNavigate('swipe')}
          className={`w-full flex items-center px-4 md:px-6 py-4 transition-all duration-300 border-r-2 ${
            activeView === 'swipe'
              ? 'border-brand-gold bg-white/5 text-white'
              : 'border-transparent text-gray-500 hover:text-white hover:bg-white/5'
          }`}
        >
          <span className="text-xl">🔥</span>
          <span className="hidden md:block ml-4 text-xs font-bold uppercase tracking-widest">Idea Swipe</span>
        </button>

        <button
          onClick={() => onNavigate('visual')}
          className={`w-full flex items-center px-4 md:px-6 py-4 transition-all duration-300 border-r-2 ${
            activeView === 'visual'
              ? 'border-brand-gold bg-white/5 text-white'
              : 'border-transparent text-gray-500 hover:text-white hover:bg-white/5'
          }`}
        >
          <span className="text-xl">👁️</span>
          <span className="hidden md:block ml-4 text-xs font-bold uppercase tracking-widest">Visual Generator</span>
        </button>

        <button
          onClick={() => onNavigate('writer')}
          className={`w-full flex items-center px-4 md:px-6 py-4 transition-all duration-300 border-r-2 ${
            activeView === 'writer'
              ? 'border-brand-gold bg-white/5 text-white'
              : 'border-transparent text-gray-500 hover:text-white hover:bg-white/5'
          }`}
        >
          <span className="text-xl">✍️</span>
          <span className="hidden md:block ml-4 text-xs font-bold uppercase tracking-widest">Content Writer</span>
        </button>

        <button
          onClick={() => onNavigate('research')}
          className={`w-full flex items-center px-4 md:px-6 py-4 transition-all duration-300 border-r-2 ${
            activeView === 'research'
              ? 'border-brand-gold bg-white/5 text-white'
              : 'border-transparent text-gray-500 hover:text-white hover:bg-white/5'
          }`}
        >
          <span className="text-xl">🔍</span>
          <span className="hidden md:block ml-4 text-xs font-bold uppercase tracking-widest">Keyword Search</span>
        </button>

        <button
          onClick={() => onNavigate('calendar')}
          className={`w-full flex items-center px-4 md:px-6 py-4 transition-all duration-300 border-r-2 ${
            activeView === 'calendar'
              ? 'border-brand-gold bg-white/5 text-white'
              : 'border-transparent text-gray-500 hover:text-white hover:bg-white/5'
          }`}
        >
          <span className="text-xl">📅</span>
          <span className="hidden md:block ml-4 text-xs font-bold uppercase tracking-widest">Schedule</span>
        </button>
      </nav>

      {/* Footer Info */}
      <div className="p-6 border-t border-white/5 hidden md:block">
        <div className="text-[10px] text-gray-600 font-mono">
            STATUS: <span className="text-green-500">ONLINE</span>
            <br />
            VERSION: 2.4.0
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;