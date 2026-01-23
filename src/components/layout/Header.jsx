import React from 'react';
import { useTrip } from '../../context/TripContext';

const Header = ({ onToggleSidebar, onEditTrip }) => {
    const { activeTrip, toggleTheme, isDarkMode } = useTrip();

    return (
        <header className="fixed top-0 left-0 right-0 h-14 md:h-16 bg-[var(--card-bg)] border-b border-[var(--card-border)] z-50 px-4 md:px-8 flex items-center justify-between transition-colors duration-[400ms]">
            <button onClick={onToggleSidebar} className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-slate-100/20 transition-colors">
                <i className="fa-solid fa-bars-staggered text-xl text-blue-600"></i>
            </button>
            <div id="trip-header-title" className="absolute left-1/2 -translate-x-1/2 max-w-[60%] text-center text-sm md:text-lg font-bold tracking-tight text-[var(--text-main)] uppercase truncate px-4">
                {activeTrip ? activeTrip.name : 'VOYAGER'}
            </div>
            <div className="flex items-center space-x-2">
                <button id="theme-toggle-btn" onClick={toggleTheme} className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-slate-100/20 transition-colors">
                    <i id="theme-icon" className={`fa-solid ${isDarkMode ? 'fa-sun text-amber-400' : 'fa-moon text-slate-400'}`}></i>
                </button>
            </div>
        </header>
    );
};

export default Header;
