import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import RealTimeClock from './RealTimeClock';
import Icon from './Icon';
import AurisChat from './AurisChat';

const Layout = ({ children, userConfig, onAddHabit, habits = [] }) => {
    const location = useLocation();
    const [aurisOpen, setAurisOpen] = useState(false);

    // Map path to view name for header
    const viewName = {
        '/': 'dashboard',
        '/habits': 'habits',
        '/logs': 'logs',
        '/analytics': 'analytics',
        '/settings': 'settings'
    }[location.pathname] || 'unknown';

    // Compute daily streak: consecutive days with at least one log
    const streak = (() => {
        const dates = [...new Set(habits.flatMap(h => (h.logs || []).map(l => l.date)))].sort((a, b) => new Date(b) - new Date(a));
        let count = 0;
        for (let i = 0; i < dates.length; i++) {
            const expectedDate = new Date();
            expectedDate.setDate(expectedDate.getDate() - i);
            const expectedStr = expectedDate.toISOString().split('T')[0];
            if (dates.includes(expectedStr)) count++;
            else break;
        }
        return count;
    })();

    return (
        <div className="flex h-screen overflow-hidden bg-bg-main text-text-primary font-sans transition-colors duration-300">
            <Sidebar userConfig={userConfig} onOpenAuris={() => setAurisOpen(true)} />
            <AurisChat isOpen={aurisOpen} onClose={() => setAurisOpen(false)} habits={habits} />

            <main className="flex-1 overflow-y-auto custom-scrollbar bg-bg-main relative transition-colors duration-300">
                <header className="h-20 border-b border-border-color flex items-center justify-between px-10 sticky top-0 bg-bg-main/80 backdrop-blur-xl z-20 transition-colors duration-300">
                    <div className="flex items-center gap-4">
                        <h2 className="text-[10px] font-mono text-text-secondary uppercase tracking-[0.4em]">
                            {viewName}
                        </h2>
                        <div className="h-4 w-[1px] bg-border-color"></div>
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-success/10 border border-success/30">
                                <Icon name="flame" size={12} className="text-success" />
                                <span className="text-[10px] font-mono font-bold text-success uppercase tracking-wider">{streak} day streak</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setAurisOpen(true)}
                            className="group relative flex items-center gap-2 py-2 px-5 rounded-xl border border-accent/20 bg-accent/5 text-text-primary font-bold text-[10px] uppercase tracking-wider transition-all hover:bg-accent/10 hover:border-accent/40 hover:scale-105 active:scale-95 h-10 overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-accent/0 via-accent/5 to-accent/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 -translate-x-full group-hover:translate-x-full" />
                            <Icon name="brain" size={14} className="text-accent relative z-10 animate-pulse" />
                            <span className="relative z-10">Auris AI</span>
                            <div className="absolute -inset-px rounded-xl border border-accent/20 group-hover:border-accent/50 transition-colors pointer-events-none" />
                        </button>
                        <RealTimeClock />
                        <button
                            onClick={onAddHabit}
                            className="px-5 py-2.5 bg-accent text-bg-main text-[10px] font-black rounded-lg hover:opacity-90 transition-all uppercase tracking-widest hover:scale-105 active:scale-95 h-10"
                        >
                            New Stream
                        </button>
                    </div>
                </header>

                <div className="p-10 max-w-7xl mx-auto min-h-[calc(100vh-5rem)]">
                    {children}
                </div>
            </main>
        </div>
    );
};

export default Layout;
