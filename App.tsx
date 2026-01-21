import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import VisualGenerator from './components/VisualGenerator';
import ContentWriter from './components/ContentWriter';
import KeywordResearcher from './components/KeywordResearcher';
import CalendarView from './components/CalendarView';
import SwipeView from './components/SwipeView';
import { CalendarItem } from './types';

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<'visual' | 'writer' | 'research' | 'calendar' | 'swipe'>('swipe'); // Default to Swipe for workflow start
  const [prefilledTopic, setPrefilledTopic] = useState<string>('');
  
  // Workflow Automation State
  const [autoGenerateVisual, setAutoGenerateVisual] = useState(false);
  const [autoGenerateText, setAutoGenerateText] = useState(false);
  
  // Calendar State
  const [calendarItems, setCalendarItems] = useState<CalendarItem[]>([]);

  // Swipe View State
  const [approvedIdeas, setApprovedIdeas] = useState<string[]>([]);

  const handleKeywordSelect = (keyword: string) => {
    setPrefilledTopic(keyword);
    setActiveView('writer');
  };

  const handleSaveToCalendar = (item: Omit<CalendarItem, 'id' | 'createdAt'>) => {
    const newItem: CalendarItem = {
      ...item,
      id: Date.now().toString(),
      createdAt: Date.now(),
    };
    setCalendarItems(prev => [newItem, ...prev]);
    console.log("Saved to calendar", newItem);
  };

  const handleUpdateItem = (updatedItem: CalendarItem) => {
    setCalendarItems(prev => prev.map(item => item.id === updatedItem.id ? updatedItem : item));
  };

  const handleDeleteItem = (id: string) => {
    setCalendarItems(prev => prev.filter(item => item.id !== id));
  };

  // Swipe Workflow Functions
  const handleApproveIdea = (idea: string) => {
    setApprovedIdeas(prev => [...prev, idea]);
  };

  const handleDismissIdea = (idea: string) => {
    setApprovedIdeas(prev => prev.filter(i => i !== idea));
  };

  const handleRunWorkflow = (idea: string) => {
    setPrefilledTopic(idea);
    setAutoGenerateVisual(true);
    setAutoGenerateText(true); // Will trigger when user visits writer
    setActiveView('visual');
  };

  // Helper to get list of completed titles to show "Done" status in Swipe View
  const completedTitles = calendarItems.map(i => i.title);

  return (
    <div className="min-h-screen flex bg-brand-navy selection:bg-brand-gold selection:text-brand-navy">
      <Sidebar activeView={activeView} onNavigate={setActiveView} />
      
      <main className="flex-grow ml-20 md:ml-64 relative">
        {/* Top Gradient Line */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-navy via-brand-gold to-brand-navy opacity-30"></div>

        {activeView === 'swipe' && (
          <SwipeView 
            approvedIdeas={approvedIdeas}
            onApproveIdea={handleApproveIdea}
            onDismissIdea={handleDismissIdea}
            onRunWorkflow={handleRunWorkflow}
            completedIdeas={completedTitles}
          />
        )}

        {activeView === 'visual' && (
          <VisualGenerator 
            onSaveToCalendar={handleSaveToCalendar}
            initialTopic={prefilledTopic}
            autoGenerate={autoGenerateVisual}
            onAutoGenerateComplete={() => setAutoGenerateVisual(false)}
          />
        )}
        
        {activeView === 'writer' && (
          <ContentWriter 
            initialTopic={prefilledTopic} 
            onSaveToCalendar={handleSaveToCalendar} 
            autoGenerate={autoGenerateText}
            onAutoGenerateComplete={() => setAutoGenerateText(false)}
          />
        )}
        
        {activeView === 'research' && (
          <KeywordResearcher onSelectKeyword={handleKeywordSelect} />
        )}

        {activeView === 'calendar' && (
          <CalendarView 
            items={calendarItems} 
            onUpdateItem={handleUpdateItem}
            onDeleteItem={handleDeleteItem}
          />
        )}
      </main>
    </div>
  );
};

export default App;