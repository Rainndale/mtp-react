import React from 'react';
import { useTrip } from '../../context/TripContext';

const Header = ({ onToggleSidebar, onEditTrip }) => {
    const { activeTrip, isDarkMode, toggleTheme } = useTrip();

    return (
        <header className="fixed top-0 left-0 right-0 h-14 md:h-16 glass !border-t-0 !border-x-0 z-50 px-4 md:px-8 flex items-center justify-between">
            <button
                onClick={onToggleSidebar}
                className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-slate-100/20 transition-colors"
            >
                <i className="fa-solid fa-bars-staggered text-xl text-blue-600"></i>
            </button>

            <div className="absolute left-1/2 -translate-x-1/2 max-w-[60%] text-center text-sm md:text-lg font-bold tracking-tight text-[var(--text-main)] uppercase truncate px-4">
                {activeTrip ? activeTrip.name : 'VOYAGER'}
            </div>

            <div className="flex items-center space-x-2">
                <button
                    onClick={toggleTheme}
                    className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-slate-100/20 transition-colors"
                >
                    <i className={`fa-solid ${isDarkMode ? 'fa-sun text-amber-400' : 'fa-moon text-[var(--text-muted)]'}`}></i>
                </button>
                {activeTrip && (
                    <button
                        onClick={() => onEditTrip(activeTrip)}
                        className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-slate-100/20 transition-colors"
                    >
                        <i className="fa-solid fa-pen-to-square text-[var(--text-muted)]"></i>
                    </button>
                )}
            </div>
        </header>
    );
};

export default Header;
