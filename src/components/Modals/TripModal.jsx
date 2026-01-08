import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';

const formatDate = (dateStr) => {
    if (!dateStr) return 'Select Date';
    const d = new Date(dateStr + 'T00:00:00');
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

const TripModal = () => {
    const { isModalOpen, setIsModalOpen, handleSaveTrip, handleDeleteTrip, activeTrip } = useApp();

    // Internal State
    const [name, setName] = useState('');
    const [startDate, setStartDate] = useState(null);
    const [endDate, setEndDate] = useState(null);
    const [calMonth, setCalMonth] = useState(new Date().getMonth());
    const [calYear, setCalYear] = useState(new Date().getFullYear());
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [showDateConflict, setShowDateConflict] = useState(false);

    useEffect(() => {
        if (isModalOpen === 'TRIP_NEW') {
            setName(''); setStartDate(null); setEndDate(null);
            const d = new Date(); setCalMonth(d.getMonth()); setCalYear(d.getFullYear());
            setShowDeleteConfirm(false); setShowDateConflict(false);
        } else if (isModalOpen === 'TRIP_EDIT' && activeTrip) {
            setName(activeTrip.name); setStartDate(activeTrip.startDate); setEndDate(activeTrip.endDate);
            const d = new Date(activeTrip.startDate);
            if (!isNaN(d.getTime())) { setCalMonth(d.getMonth()); setCalYear(d.getFullYear()); }
            setShowDeleteConfirm(false); setShowDateConflict(false);
        }
    }, [isModalOpen, activeTrip]);

    const handleDayClick = (dateStr) => {
        if (!startDate || (startDate && endDate)) {
            setStartDate(dateStr); setEndDate(null);
        } else if (dateStr < startDate) {
            setStartDate(dateStr);
        } else {
            setEndDate(dateStr);
        }
    };

    const changeMonth = (step) => {
        let m = calMonth + step;
        let y = calYear;
        if (m < 0) { m = 11; y--; }
        else if (m > 11) { m = 0; y++; }
        setCalMonth(m); setCalYear(y);
    };

    const renderCalendar = () => {
        const firstDate = new Date(calYear, calMonth, 1);
        const firstDayIndex = firstDate.getDay();
        const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
        const days = [];

        // Empty slots
        for (let i = 0; i < firstDayIndex; i++) {
            days.push(<div key={`empty-${i}`}></div>);
        }

        // Days
        for (let i = 1; i <= daysInMonth; i++) {
            const mStr = String(calMonth + 1).padStart(2, '0');
            const dStr = String(i).padStart(2, '0');
            const dateStr = `${calYear}-${mStr}-${dStr}`;

            let classes = "calendar-day-btn";
            let extra = "";

            if (dateStr === startDate) {
                classes += " is-start";
                if (endDate) classes += " has-end";
            } else if (dateStr === endDate) {
                classes += " is-end";
                if (startDate) classes += " has-start";
            } else if (startDate && endDate && dateStr > startDate && dateStr < endDate) {
                classes += " in-range";
            }

            days.push(
                <div key={dateStr} className={classes} onClick={() => handleDayClick(dateStr)}>
                   {i}
                </div>
            );
        }
        return days;
    };

    const onSave = async (force = false) => {
        if (!name || !startDate || !endDate) return; // Add notification logic later

        const id = (isModalOpen === 'TRIP_EDIT' && activeTrip) ? activeTrip.id : `t_${Date.now()}`;
        const existingPlans = (isModalOpen === 'TRIP_EDIT' && activeTrip?.plans) ? activeTrip.plans : [];

        // Conflict Check
        if (!force && isModalOpen === 'TRIP_EDIT' && existingPlans.some(p => p.date < startDate || p.date > endDate)) {
            setShowDateConflict(true);
            return;
        }

        const newTrip = {
            id,
            name,
            startDate,
            endDate,
            plans: existingPlans.filter(p => p.date >= startDate && p.date <= endDate)
        };

        await handleSaveTrip(newTrip);
        setIsModalOpen(false);
    };

    const onDelete = async () => {
        if (activeTrip) {
            await handleDeleteTrip(activeTrip.id);
            setIsModalOpen(false);
        }
    };

    if (!isModalOpen || (isModalOpen !== 'TRIP_NEW' && isModalOpen !== 'TRIP_EDIT')) return null;

    return (
        <div id="modal-container" className="fixed inset-0 z-[150] flex items-center justify-center p-4">
            <div id="modal-backdrop" onClick={() => setIsModalOpen(false)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-md"></div>
            <div id="modal-content" className="relative w-full max-w-md bg-[var(--modal-bg)] p-6 rounded-lg shadow-2xl max-h-[85vh] flex flex-col animate-slide-up border border-[var(--card-border)]">

                {/* VIEW: DELETE CONFIRMATION */}
                {showDeleteConfirm ? (
                    <>
                        <div className="flex-1 overflow-y-auto min-h-0 -ml-1 pl-1 -mr-2 pr-2">
                            <div className="text-center">
                                <div className="w-20 h-20 bg-rose-50 dark:bg-rose-900/20 rounded-lg flex items-center justify-center mx-auto mb-6">
                                    <i className="fa-solid fa-trash-can text-3xl text-rose-500"></i>
                                </div>
                                <h2 className="text-2xl font-black text-current italic uppercase mb-4 text-center leading-none">Abort Journey?</h2>
                            </div>
                        </div>
                        <div className="flex-shrink-0 pt-4 mt-auto">
                            <button onClick={onDelete} className="w-full py-4 bg-rose-600 text-white font-bold rounded-lg text-sm mb-2 shadow-lg">Delete Permanently</button>
                            <button onClick={() => setShowDeleteConfirm(false)} className="w-full py-4 text-slate-400 font-bold hover:text-current transition-all text-sm text-center">Keep Journey</button>
                        </div>
                    </>
                ) : showDateConflict ? (
                    /* VIEW: DATE CONFLICT */
                    <>
                        <div className="flex-1 overflow-y-auto min-h-0 -ml-1 pl-1 -mr-2 pr-2">
                            <div className="text-center">
                                <h2 className="text-2xl font-black text-current italic uppercase mb-4 text-center leading-none">Date Conflict</h2>
                                <p className="text-muted mb-8 text-sm text-center">Changing dates will remove plans outside the window.</p>
                            </div>
                        </div>
                        <div className="flex-shrink-0 pt-4 mt-auto">
                            <button onClick={() => onSave(true)} className="w-full py-4 bg-accent text-white font-bold rounded-lg text-sm mb-2 shadow-lg">Save & Remove</button>
                            <button onClick={() => setShowDateConflict(false)} className="w-full py-4 text-muted font-bold text-sm text-center">Back</button>
                        </div>
                    </>
                ) : (
                    /* VIEW: FORM */
                    <>
                         <div className="flex-1 overflow-y-auto min-h-0 -ml-1 pl-1 -mr-2 pr-2">
                            <h2 className="text-2xl font-black text-current italic uppercase tracking-tighter mb-6 text-center leading-none">
                                {isModalOpen === 'TRIP_EDIT' ? 'Edit Journey' : 'New Journey'}
                            </h2>
                            <div className="space-y-6">
                                <div className="floating-group">
                                    <input
                                        type="text"
                                        placeholder=" "
                                        autoComplete="off"
                                        className="floating-input"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                    />
                                    <label className="floating-label">Trip Name</label>
                                </div>
                                <div>
                                    <div className="flex space-x-2 mb-3">
                                        <div className={`flex-1 p-3 border border-[var(--input-border)] rounded-lg text-center bg-[var(--input-bg)] transition-all duration-200 ${(!startDate && !endDate) || (startDate && endDate) ? 'date-box-active' : ''}`}>
                                            <span className="text-[10px] text-muted block uppercase font-black tracking-widest leading-none mb-1">Start Date</span>
                                            <span className="text-sm font-semibold">{formatDate(startDate)}</span>
                                        </div>
                                        <div className={`flex-1 p-3 border border-[var(--input-border)] rounded-lg text-center bg-[var(--input-bg)] transition-all duration-200 ${(startDate && !endDate) ? 'date-box-active' : ''}`}>
                                            <span className="text-[10px] text-muted block uppercase font-black tracking-widest leading-none mb-1">End Date</span>
                                            <span className="text-sm font-semibold">{formatDate(endDate)}</span>
                                        </div>
                                    </div>
                                    <div className="border border-[var(--input-border)] rounded-lg p-4 bg-[var(--input-bg)] overflow-hidden">
                                        <div className="flex justify-between items-center mb-4">
                                            <button onClick={() => changeMonth(-1)} className="p-1 hover:bg-slate-100/10 rounded-full transition"><i className="fa-solid fa-chevron-left text-xs"></i></button>
                                            <span className="font-bold text-xs uppercase tracking-wider">{new Date(calYear, calMonth).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
                                            <button onClick={() => changeMonth(1)} className="p-1 hover:bg-slate-100/10 rounded-full transition"><i className="fa-solid fa-chevron-right text-xs"></i></button>
                                        </div>
                                        <div className="grid grid-cols-7 gap-1 mb-2">
                                            {['S','M','T','W','T','F','S'].map(d => <div key={d} className="text-center text-[10px] font-bold text-muted">{d}</div>)}
                                        </div>
                                        <div id="calendar-days-grid" className="grid grid-cols-7 gap-y-1 min-h-[250px] content-start">
                                            {renderCalendar()}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="flex-shrink-0 pt-4 mt-auto">
                            <div className="flex space-x-3">
                                {isModalOpen === 'TRIP_EDIT' && (
                                    <button onClick={() => setShowDeleteConfirm(true)} className="px-4 text-rose-500 font-bold hover:bg-rose-50 rounded-lg transition-all text-sm">Delete</button>
                                )}
                                <div className="flex-grow"></div>
                                <button onClick={() => setIsModalOpen(false)} className="px-4 text-muted font-bold hover:text-current transition-all text-sm text-center">Cancel</button>
                                <button onClick={() => onSave(false)} className="px-8 py-3 bg-accent text-white font-bold rounded-lg transition-all shadow-lg text-sm text-center">Save</button>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default TripModal;
