import React from 'react';
import { useTrip } from '../../context/TripContext';
import { formatDate } from '../../utils/date'; // We will create this utils file

const Sidebar = ({ isOpen, onClose, onOpenTripModal }) => {
    const { trips, activeTrip, setActiveTripId } = useTrip();

    return (
        <>
            <div
                className={`
                    fixed inset-y-0 left-0 w-80 z-[110] p-6 flex flex-col
                    bg-[var(--sidebar-bg)] border-r border-[var(--card-border)]
                    transition-transform duration-400 ease-[cubic-bezier(0.4,0,0.2,1)]
                    ${isOpen ? 'translate-x-0' : '-translate-x-full'}
                `}
            >
                <div className="flex justify-between items-center mb-10">
                    <h2 className="text-xl font-bold tracking-tight text-[var(--text-main)] flex items-center">
                        <i className="fa-solid fa-earth-americas mr-3 text-blue-500"></i> My Journeys
                    </h2>
                    <button onClick={onClose} className="text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors">
                        <i className="fa-solid fa-xmark text-xl"></i>
                    </button>
                </div>

                <div className="flex-grow overflow-y-auto space-y-3 pr-2 scrollbar-hide">
                    {trips.map(trip => (
                        <div
                            key={trip.id}
                            onClick={() => { setActiveTripId(trip.id); onClose(); }}
                            className={`
                                p-4 rounded-lg cursor-pointer border transition-all duration-200
                                ${activeTrip?.id === trip.id
                                    ? 'border-[var(--card-selected-border)] bg-[var(--card-selected-bg)] shadow-sm'
                                    : 'border-transparent hover:bg-slate-50 dark:hover:bg-slate-800/50'}
                            `}
                        >
                            <h4 className="text-[var(--text-main)] font-bold truncate">{trip.name}</h4>
                            <p className="text-[var(--text-muted)] text-xs mt-1 font-medium">
                                {formatDate(trip.startDate)} - {formatDate(trip.endDate)}
                            </p>
                        </div>
                    ))}
                    {trips.length === 0 && (
                        <p className="text-[var(--text-muted)] text-center text-sm italic">No journeys found.</p>
                    )}
                </div>

                <button
                    onClick={() => { onOpenTripModal(null); onClose(); }}
                    className="mt-6 w-full py-4 bg-[var(--accent-blue)] text-white font-bold rounded-lg transition-all shadow-lg hover:bg-[var(--accent-blue-hover)] flex items-center justify-center"
                >
                    <i className="fa-solid fa-plus mr-2"></i> New Expedition
                </button>
            </div>

            {/* Overlay */}
            {isOpen && (
                <div
                    onClick={onClose}
                    className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-[105] transition-opacity duration-300"
                />
            )}
        </>
    );
};

export default Sidebar;
