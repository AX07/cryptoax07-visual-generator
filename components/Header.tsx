import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="w-full py-8 text-center border-b border-white/10 bg-brand-navy">
      <h1 className="text-4xl font-extrabold tracking-widest text-white uppercase font-sans mb-2">
        CRYPTO<span className="text-brand-gold">AX07</span>
      </h1>
      <p className="text-brand-goldLight text-sm font-mono tracking-widest uppercase opacity-80">
        Viral Visual Architect Agent
      </p>
    </header>
  );
};

export default Header;