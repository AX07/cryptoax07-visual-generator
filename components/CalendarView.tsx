import React, { useState } from 'react';
import { CalendarItem } from '../types';

interface CalendarViewProps {
  items: CalendarItem[];
  onUpdateItem: (item: CalendarItem) => void;
  onDeleteItem: (id: string) => void;
}

const CalendarView: React.FC<CalendarViewProps> = ({ items, onUpdateItem, onDeleteItem }) => {
  // Simple state for current month view (default to now)
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedItem, setSelectedItem] = useState<CalendarItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [dateInput, setDateInput] = useState('');
  const [copied, setCopied] = useState(false);

  // Filtering
  const unscheduledItems = items.filter(i => !i.scheduledDate);
  const scheduledItems = items.filter(i => !!i.scheduledDate);

  // Helper to get days in month
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const days = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay(); // 0 is Sunday
    return { days, firstDay, year, month };
  };

  const { days, firstDay, year, month } = getDaysInMonth(currentDate);

  const monthNames = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleScheduleClick = (item: CalendarItem) => {
    setSelectedItem(item);
    setDateInput(item.scheduledDate || new Date().toISOString().split('T')[0]);
    setIsModalOpen(true);
    setCopied(false);
  };

  const saveSchedule = () => {
    if (selectedItem && dateInput) {
      onUpdateItem({ ...selectedItem, scheduledDate: dateInput });
      setIsModalOpen(false);
      setSelectedItem(null);
    }
  };

  const removeFromSchedule = (item: CalendarItem) => {
    onUpdateItem({ ...item, scheduledDate: undefined });
  };

  const handleCopyText = () => {
    if (selectedItem) {
        navigator.clipboard.writeText(selectedItem.content);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }
  };

  const renderCalendarGrid = () => {
    const grid = [];
    
    // Empty cells for padding before 1st day
    for (let i = 0; i < firstDay; i++) {
        grid.push(<div key={`pad-${i}`} className="bg-brand-dark/30 border border-white/5 h-32 md:h-40"></div>);
    }

    // Days
    for (let d = 1; d <= days; d++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        const dayItems = scheduledItems.filter(i => i.scheduledDate === dateStr);
        const isToday = new Date().toISOString().split('T')[0] === dateStr;

        grid.push(
            <div key={d} className={`border border-white/10 p-2 h-32 md:h-40 flex flex-col relative group ${isToday ? 'bg-white/5 ring-1 ring-brand-gold/30' : 'bg-brand-dark/50'}`}>
                <span className={`text-xs font-mono mb-2 ${isToday ? 'text-brand-gold font-bold' : 'text-gray-500'}`}>{d}</span>
                
                <div className="flex-grow overflow-y-auto space-y-1 scrollbar-none">
                    {dayItems.map(item => (
                        <div 
                            key={item.id} 
                            className="bg-brand-navy border border-white/10 rounded p-1.5 flex gap-2 items-start group/item cursor-pointer hover:border-brand-gold/50 transition-colors"
                            onClick={() => handleScheduleClick(item)}
                        >
                            {item.type === 'image' ? (
                                <img src={item.content} alt="thumb" className="w-6 h-6 object-cover rounded-sm flex-shrink-0" />
                            ) : (
                                <span className="text-xs">📝</span>
                            )}
                            <div className="overflow-hidden">
                                <p className="text-[9px] text-gray-300 leading-tight font-medium truncate">{item.title}</p>
                                <p className="text-[8px] text-gray-500 uppercase">{item.platform}</p>
                            </div>
                        </div>
                    ))}
                </div>
                
                {/* Add button on hover - optional complexity, keeping simple for now */}
            </div>
        );
    }

    return grid;
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 pb-20 pt-10 h-screen flex flex-col md:flex-row gap-6">
      
      {/* Sidebar: Staging Area */}
      <div className="w-full md:w-1/4 bg-brand-dark border border-white/10 rounded-xl p-4 flex flex-col h-[calc(100vh-6rem)]">
        <h3 className="text-brand-gold text-xs font-bold uppercase tracking-widest mb-4 flex justify-between items-center">
            Staging Area 
            <span className="bg-white/10 text-white px-2 py-0.5 rounded-full text-[9px]">{unscheduledItems.length}</span>
        </h3>
        <p className="text-[10px] text-gray-500 mb-4">Assets generated but not yet scheduled.</p>

        <div className="flex-grow overflow-y-auto space-y-3 pr-2 scrollbar-thin scrollbar-thumb-white/10">
            {unscheduledItems.length === 0 ? (
                <div className="text-center py-10 text-gray-600 text-xs italic">
                    No unscheduled assets. <br/> Generate visual or text content to populate.
                </div>
            ) : (
                unscheduledItems.map(item => (
                    <div key={item.id} className="bg-brand-navy border border-white/10 p-3 rounded-lg hover:border-brand-gold/30 transition-all group">
                        <div className="flex justify-between items-start mb-2">
                             <span className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded border ${
                                 item.type === 'image' ? 'border-purple-500/30 text-purple-400' : 'border-blue-500/30 text-blue-400'
                             }`}>
                                {item.type}
                             </span>
                             <button onClick={() => onDeleteItem(item.id)} className="text-gray-600 hover:text-red-400">×</button>
                        </div>
                        
                        {item.type === 'image' && (
                            <div className="h-24 w-full bg-black/50 mb-2 rounded overflow-hidden">
                                <img src={item.content} className="w-full h-full object-cover" alt="asset" />
                            </div>
                        )}
                        
                        <p className="text-xs text-white font-medium line-clamp-2 mb-2" title={item.title}>{item.title}</p>
                        
                        {item.type === 'text' && (
                             <p className="text-[10px] text-gray-500 line-clamp-3 mb-2 font-mono bg-black/20 p-1 rounded">{item.content}</p>
                        )}

                        <button 
                            onClick={() => handleScheduleClick(item)}
                            className="w-full bg-white/5 hover:bg-brand-gold hover:text-brand-navy text-brand-gold text-[10px] font-bold uppercase py-2 rounded transition-colors"
                        >
                            Schedule Post
                        </button>
                    </div>
                ))
            )}
        </div>
      </div>

      {/* Main Area: Calendar */}
      <div className="flex-grow flex flex-col h-[calc(100vh-6rem)]">
        <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl text-white font-bold uppercase tracking-wider">
                {monthNames[month]} <span className="text-brand-gold">{year}</span>
            </h2>
            <div className="flex gap-2">
                <button onClick={handlePrevMonth} className="px-3 py-1 bg-brand-dark border border-white/10 text-white rounded hover:border-brand-gold/50">←</button>
                <button onClick={handleNextMonth} className="px-3 py-1 bg-brand-dark border border-white/10 text-white rounded hover:border-brand-gold/50">→</button>
            </div>
        </div>

        {/* Days Header */}
        <div className="grid grid-cols-7 mb-2 text-center">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                <div key={d} className="text-[10px] uppercase font-bold text-gray-500 tracking-widest">{d}</div>
            ))}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-7 flex-grow auto-rows-fr bg-brand-dark/20 border border-white/10 rounded-lg overflow-hidden">
            {renderCalendarGrid()}
        </div>
      </div>

      {/* Schedule Modal */}
      {isModalOpen && selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-brand-dark border border-brand-gold/30 p-6 rounded-xl w-full max-w-md shadow-2xl">
                <h3 className="text-lg font-bold text-white mb-1">Schedule Asset</h3>
                <p className="text-xs text-brand-gold mb-4 uppercase tracking-widest">{selectedItem.title}</p>
                
                {/* Preview and Actions */}
                <div className="mb-4 bg-black/30 p-2 rounded border border-white/5">
                    {selectedItem.type === 'image' ? (
                        <div className="space-y-2">
                            <div className="h-40 w-full rounded overflow-hidden bg-black/50 flex items-center justify-center">
                                <img src={selectedItem.content} alt="preview" className="h-full object-contain" />
                            </div>
                            <a 
                                href={selectedItem.content} 
                                download={`cryptoax07-calendar-${selectedItem.id}.png`}
                                className="block w-full text-center bg-white/5 hover:bg-white/10 text-white text-xs font-bold uppercase py-2 rounded border border-white/10 transition-colors"
                            >
                                Download Image
                            </a>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            <div className="h-40 w-full rounded overflow-y-auto bg-black/20 p-2 text-xs text-gray-300 font-mono scrollbar-thin scrollbar-thumb-white/10">
                                {selectedItem.content}
                            </div>
                            <button 
                                onClick={handleCopyText}
                                className={`block w-full text-center text-xs font-bold uppercase py-2 rounded border border-white/10 transition-colors ${
                                    copied ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-white/5 hover:bg-white/10 text-white'
                                }`}
                            >
                                {copied ? 'Copied to Clipboard!' : 'Copy Text'}
                            </button>
                        </div>
                    )}
                </div>

                <div className="mb-6">
                    <label className="block text-[10px] text-gray-500 uppercase mb-2">Publish Date</label>
                    <input 
                        type="date" 
                        value={dateInput}
                        onChange={(e) => setDateInput(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 text-white px-4 py-3 rounded font-mono focus:border-brand-gold outline-none"
                    />
                </div>

                <div className="flex gap-3 justify-end">
                    <button 
                        onClick={() => {
                            if(selectedItem.scheduledDate) removeFromSchedule(selectedItem);
                            setIsModalOpen(false);
                        }}
                        className="text-xs text-red-400 hover:text-red-300 font-bold uppercase mr-auto"
                    >
                        {selectedItem.scheduledDate ? 'Unschedule' : 'Cancel'}
                    </button>

                    <button 
                        onClick={() => setIsModalOpen(false)}
                        className="px-4 py-2 rounded text-xs font-bold uppercase text-gray-400 hover:text-white"
                    >
                        Close
                    </button>
                    <button 
                        onClick={saveSchedule}
                        className="px-6 py-2 rounded text-xs font-bold uppercase bg-brand-gold text-brand-navy hover:bg-white"
                    >
                        Confirm Date
                    </button>
                </div>
            </div>
        </div>
      )}

    </div>
  );
};

export default CalendarView;