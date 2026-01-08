import React from 'react';
import { useApp } from '../../context/AppContext';
import InstallPrompt from './InstallPrompt';

const Sidebar = () => {
    const {
        sidebarOpen,
        toggleSidebar,
        trips,
        activeTrip,
        setActiveTrip,
        setIsModalOpen
    } = useApp();

    const formatDate = (dateStr) => {
        if (!dateStr) return 'Select Date';
        const d = new Date(dateStr + 'T00:00:00');
        if (isNaN(d.getTime())) return dateStr;
        return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    return (
        <>
            {/* Sidebar */}
            <nav
                className={`sidebar fixed inset-y-0 left-0 w-80 z-[9999] p-6 flex flex-col transition-transform duration-400 ease-out bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
            >
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center">
                        <i className="fa-solid fa-earth-americas mr-3 text-blue-500"></i> My Journeys
                    </h2>
                    <button
                        onClick={toggleSidebar}
                        className="text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors"
                    >
                        <i className="fa-solid fa-xmark text-xl"></i>
                    </button>
                </div>

                <div className="flex-grow overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                    {trips.map(t => {
                        const isSelected = activeTrip?.id === t.id;
                        return (
                            <div
                                key={t.id}
                                onClick={() => {
                                    setActiveTrip(t);
                                    if (window.innerWidth < 768) toggleSidebar();
                                }}
                                className={`p-4 rounded-lg cursor-pointer border transition-all ${
                                    isSelected
                                        ? 'bg-blue-50/50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800 shadow-sm'
                                        : 'bg-transparent border-transparent hover:bg-slate-50 dark:hover:bg-slate-800/50'
                                }`}
                            >
                                <h4 className="text-slate-900 dark:text-slate-100 font-bold truncate">{t.name || 'Untitled Trip'}</h4>
                                <p className="text-slate-500 dark:text-slate-400 text-xs mt-1 font-medium">
                                    {formatDate(t.startDate)} - {formatDate(t.endDate)}
                                </p>
                            </div>
                        );
                    })}
                </div>

                <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                    <button
                        onClick={() => {
                            setIsModalOpen('TRIP_NEW');
                            if (window.innerWidth < 768) toggleSidebar();
                        }}
                        className="w-full py-4 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-lg transition-all shadow-lg flex items-center justify-center"
                    >
                        <i className="fa-solid fa-plus mr-2"></i> New Expedition
                    </button>
                    <InstallPrompt />
                </div>
            </nav>

        </>
    );
};

export default Sidebar;
