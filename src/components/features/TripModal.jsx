import React, { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import FloatingInput from '../ui/FloatingInput';
import { useTrip } from '../../context/TripContext';
import { formatDate } from '../../utils/date';

const TripModal = ({ isOpen, onClose, tripToEdit }) => {
    const { addOrUpdateTrip, removeTrip } = useTrip();
    const [name, setName] = useState('');
    const [startDate, setStartDate] = useState(null);
    const [endDate, setEndDate] = useState(null);
    const [calMonth, setCalMonth] = useState(new Date().getMonth());
    const [calYear, setCalYear] = useState(new Date().getFullYear());

    // Conflict handling
    const [showConflict, setShowConflict] = useState(false);
    const [pendingTrip, setPendingTrip] = useState(null);

    useEffect(() => {
        if (isOpen) {
            if (tripToEdit) {
                setName(tripToEdit.name);
                setStartDate(tripToEdit.startDate);
                setEndDate(tripToEdit.endDate);
                const d = new Date(tripToEdit.startDate + 'T00:00:00');
                if (!isNaN(d.getTime())) {
                    setCalMonth(d.getMonth());
                    setCalYear(d.getFullYear());
                }
            } else {
                setName('');
                setStartDate(null);
                setEndDate(null);
                setCalMonth(new Date().getMonth());
                setCalYear(new Date().getFullYear());
            }
            setShowConflict(false);
            setPendingTrip(null);
        }
    }, [isOpen, tripToEdit]);

    const handleDayClick = (dateStr) => {
        if (!startDate || (startDate && endDate)) {
            setStartDate(dateStr);
            setEndDate(null);
        } else if (dateStr < startDate) {
            setStartDate(dateStr);
        } else {
            setEndDate(dateStr);
        }
    };

    const changeMonth = (step) => {
        let newMonth = calMonth + step;
        let newYear = calYear;
        if (newMonth < 0) { newMonth = 11; newYear--; }
        else if (newMonth > 11) { newMonth = 0; newYear++; }
        setCalMonth(newMonth);
        setCalYear(newYear);
    };

    const renderCalendar = () => {
        const firstDate = new Date(calYear, calMonth, 1);
        const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
        const firstDayIndex = firstDate.getDay();

        const days = [];
        for (let i = 0; i < firstDayIndex; i++) {
            days.push(<div key={`empty-${i}`} />);
        }

        for (let i = 1; i <= daysInMonth; i++) {
            const m = String(calMonth + 1).padStart(2, '0');
            const d = String(i).padStart(2, '0');
            const dateStr = `${calYear}-${m}-${d}`;

            let classes = "h-10 w-full flex items-center justify-center text-sm relative z-10 transition-all duration-200 rounded-lg cursor-pointer ";
            let before = "";

            if (dateStr === startDate) {
                classes += "text-white font-bold bg-[var(--accent-blue)] rounded-r-none ";
                if (endDate) classes += "rounded-l-lg "; else classes += "rounded-lg ";
            } else if (dateStr === endDate) {
                classes += "text-white font-bold bg-[var(--accent-blue)] rounded-l-none rounded-r-lg ";
            } else if (startDate && endDate && dateStr > startDate && dateStr < endDate) {
                classes += "text-[var(--cal-range-text)] bg-[var(--cal-range-bg)] rounded-none ";
            } else {
                classes += "text-[var(--text-main)] hover:bg-slate-100 dark:hover:bg-slate-800 ";
            }

            // Specific Seamless Capsule logic fixes
            if (dateStr === startDate && endDate) classes = classes.replace('rounded-lg', 'rounded-l-lg');

            days.push(
                <div key={dateStr} onClick={() => handleDayClick(dateStr)} className={classes}>
                    {i}
                </div>
            );
        }
        return days;
    };

    const handleSave = async (force = false) => {
        if (!name || !startDate || !endDate) {
            alert("Please fill all fields"); // Basic validation for now
            return;
        }

        const tripData = {
            id: tripToEdit ? tripToEdit.id : `t_${Date.now()}`,
            name,
            startDate,
            endDate,
            plans: tripToEdit ? tripToEdit.plans : []
        };

        // Check for date conflict logic (cutting off plans)
        if (tripToEdit && !force) {
            const hasOutliers = tripToEdit.plans?.some(p => p.date < startDate || p.date > endDate);
            if (hasOutliers) {
                setPendingTrip(tripData);
                setShowConflict(true);
                return;
            }
        }

        // Clean plans if force
        if (force || (tripToEdit && !force)) { // Logic correction: always filter plans on save
             tripData.plans = (tripData.plans || []).filter(p => p.date >= startDate && p.date <= endDate);
        }

        await addOrUpdateTrip(tripData);
        onClose();
    };

    const handleDelete = async () => {
        if (confirm("Are you sure you want to delete this journey?")) {
            await removeTrip(tripToEdit.id);
            onClose();
        }
    };

    if (showConflict) {
        return (
             <Modal isOpen={isOpen} onClose={onClose}>
                <div className="flex-1 overflow-y-auto min-h-0">
                    <div className="text-center pt-8">
                        <h2 className="text-2xl font-black text-[var(--text-main)] italic uppercase mb-4 leading-none">Date Conflict</h2>
                        <p className="text-[var(--text-muted)] mb-8 text-sm">Changing dates will remove plans outside the window.</p>
                    </div>
                </div>
                <div className="flex-shrink-0 pt-4 mt-auto space-y-2">
                     <button onClick={() => handleSave(true)} className="w-full py-4 bg-[var(--accent-blue)] text-white font-bold rounded-lg text-sm shadow-lg">Save & Remove</button>
                     <button onClick={() => setShowConflict(false)} className="w-full py-4 text-[var(--text-muted)] font-bold text-sm">Back</button>
                </div>
            </Modal>
        )
    }

    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <div className="flex-1 overflow-y-auto min-h-0 -ml-1 pl-1 -mr-2 pr-2 pb-2 scrollbar-hide">
                <h2 className="text-2xl font-black text-[var(--text-main)] italic uppercase tracking-tighter mb-6 text-center leading-none">
                    {tripToEdit ? 'Edit Journey' : 'New Journey'}
                </h2>
                <div className="space-y-6">
                    <FloatingInput label="Trip Name" value={name} onChange={(e) => setName(e.target.value)} />

                    <div>
                        <div className="flex space-x-2 mb-3">
                            <div className={`flex-1 p-3 border rounded-lg text-center transition-all duration-200 ${(!startDate && !endDate) || (startDate && endDate) ? 'border-[var(--accent-blue)] ring-1 ring-[var(--accent-blue)]' : 'border-[var(--input-border)] bg-[var(--input-bg)]'}`}>
                                <span className="text-[10px] text-[var(--text-muted)] block uppercase font-black tracking-widest leading-none mb-1">Start Date</span>
                                <span className="text-sm font-semibold text-[var(--text-main)]">{formatDate(startDate)}</span>
                            </div>
                            <div className={`flex-1 p-3 border rounded-lg text-center transition-all duration-200 ${(startDate && !endDate) ? 'border-[var(--accent-blue)] ring-1 ring-[var(--accent-blue)]' : 'border-[var(--input-border)] bg-[var(--input-bg)]'}`}>
                                <span className="text-[10px] text-[var(--text-muted)] block uppercase font-black tracking-widest leading-none mb-1">End Date</span>
                                <span className="text-sm font-semibold text-[var(--text-main)]">{formatDate(endDate)}</span>
                            </div>
                        </div>

                        <div className="border border-[var(--input-border)] rounded-lg p-4 bg-[var(--input-bg)] overflow-hidden">
                            <div className="flex justify-between items-center mb-4">
                                <button onClick={() => changeMonth(-1)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition text-[var(--text-main)]">
                                    <i className="fa-solid fa-chevron-left text-xs"></i>
                                </button>
                                <span className="font-bold text-xs uppercase tracking-wider text-[var(--text-main)]">
                                    {new Date(calYear, calMonth).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                                </span>
                                <button onClick={() => changeMonth(1)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition text-[var(--text-main)]">
                                    <i className="fa-solid fa-chevron-right text-xs"></i>
                                </button>
                            </div>
                            <div className="grid grid-cols-7 gap-1 mb-2">
                                {['S','M','T','W','T','F','S'].map(d => (
                                    <div key={d} className="text-center text-[10px] font-bold text-[var(--text-muted)]">{d}</div>
                                ))}
                            </div>
                            <div className="grid grid-cols-7 gap-y-1 min-h-[250px] content-start">
                                {renderCalendar()}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex-shrink-0 pt-4 mt-auto">
                <div className="flex space-x-3">
                    {tripToEdit && (
                        <button onClick={handleDelete} className="px-4 text-rose-500 font-bold hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-all text-sm">Delete</button>
                    )}
                    <div className="flex-grow"></div>
                    <button onClick={onClose} className="px-4 text-[var(--text-muted)] font-bold hover:text-[var(--text-main)] transition-all text-sm text-center">Cancel</button>
                    <button onClick={() => handleSave(false)} className="px-8 py-3 bg-[var(--accent-blue)] text-white font-bold rounded-lg transition-all shadow-lg text-sm text-center">Save</button>
                </div>
            </div>
        </Modal>
    );
};

export default TripModal;
