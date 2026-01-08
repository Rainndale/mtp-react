import React from 'react';
import PlanItem from './PlanItem';
import { useApp } from '../../context/AppContext';

const formatDate = (dateStr) => {
    const d = new Date(dateStr + 'T00:00:00');
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

const DayGroup = ({
    date,
    dayIndex,
    plans,
    onDayDragStart,
    onDayDrop,
    onDayDragOver,
    onDayDragLeave,
    onPlanDragStart,
    onPlanClick,
    onAddPlan
}) => {
    const { collapsedDays, toggleDayCollapse, activeTrip } = useApp();
    const isCollapsed = collapsedDays[`${activeTrip.id}_${date}`];

    return (
        <div
            className="day-group"
            data-date={date}
            onDragOver={onDayDragOver}
            onDragLeave={onDayDragLeave}
            onDrop={(e) => onDayDrop(e, date)}
        >
            <div
                className={`day-header glass rounded-lg px-4 py-1.5 mb-2 flex justify-between items-center w-[95%] md:w-[99%] mx-auto ${isCollapsed ? 'collapsed' : ''}`}
                draggable="true"
                onDragStart={(e) => onDayDragStart(e, date)}
                onClick={() => toggleDayCollapse(activeTrip.id, date)}
            >
                <div className="flex items-center">
                    <div>
                        <span className="text-blue-600 text-[10px] font-black uppercase tracking-widest">Day {dayIndex + 1}</span>
                        <h3 className="text-current font-extrabold text-base">{formatDate(date)}</h3>
                    </div>
                </div>
            </div>
            <div className={`day-content-wrapper ${isCollapsed ? 'collapsed' : ''}`}>
                <div className="day-content-inner">
                    <div className="space-y-[18px] pt-4 pb-6">
                        {plans.map(p => (
                            <PlanItem
                                key={p.id}
                                plan={p}
                                onDragStart={onPlanDragStart}
                                onClick={onPlanClick}
                            />
                        ))}

                        <div
                            onClick={() => onAddPlan(date)}
                            className="h-[56px] w-[90.25%] md:w-[94.05%] mx-auto flex items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-700 bg-transparent dark:bg-slate-800/30 rounded-lg text-sm font-medium text-slate-500 dark:text-slate-400 cursor-pointer"
                        >
                            Tap here to add new plan
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DayGroup;
