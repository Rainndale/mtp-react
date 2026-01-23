import React, { useEffect } from 'react';
import { useTrip } from '../../context/TripContext';
import InstallPrompt from './InstallPrompt';
import { formatDate } from '../../utils/date';

const Sidebar = ({ isOpen, onClose, onOpenTripModal }) => {
    const { trips, activeTrip, setActiveTripId } = useTrip();

    useEffect(() => {
        if (isOpen) {
            const originalStyle = document.body.style.overflow;
            document.body.style.overflow = 'hidden';
            return () => {
                document.body.style.overflow = originalStyle;
            };
        }
    }, [isOpen]);

    return (
        <>
            <div
                className={`fixed inset-0 bg-black/50 z-[9998] transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                onClick={onClose}
            ></div>
            <nav
                className={`sidebar fixed inset-y-0 left-0 w-full md:w-80 !z-[9999] px-6 pb-6 pt-[calc(1.5rem+env(safe-area-inset-top))] flex flex-col transition-transform duration-400 ease-out bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
            >
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center">
                        <i className="fa-solid fa-earth-americas mr-3 text-blue-500"></i> My Journeys
                    </h2>
                    <button
                        onClick={onClose}
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
                                    setActiveTripId(t.id);
                                    onClose();
                                }}
                                className={`p-4 rounded-lg cursor-pointer border transition-all flex items-center justify-between group ${
                                    isSelected
                                        ? 'bg-blue-50/50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800 shadow-sm'
                                        : 'bg-transparent border-transparent hover:bg-slate-50 dark:hover:bg-slate-800/50'
                                }`}
                            >
                                <div className="min-w-0 flex-1 pr-2">
                                    <h4 className="text-slate-900 dark:text-slate-100 font-bold truncate">{t.name || 'Untitled Trip'}</h4>
                                    <p className="text-slate-500 dark:text-slate-400 text-xs mt-1 font-medium">
                                        {formatDate(t.startDate)} - {formatDate(t.endDate)}
                                    </p>
                                </div>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setActiveTripId(t.id);
                                        onOpenTripModal(t);
                                        onClose();
                                    }}
                                    className="text-slate-400 p-2"
                                >
                                    <i className="fa-solid fa-pen-to-square"></i>
                                </button>
                            </div>
                        );
                    })}
                </div>

                <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                    <button
                        onClick={() => {
                            onOpenTripModal();
                            onClose();
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
