import React, { useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PlanItem from './PlanItem';
import { useTrip } from '../../context/TripContext';
import { formatDate, formatDayDate } from '../../utils/date';
import { useSortable, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const DayGroup = ({ date, dayIndex, plans, onAddPlan, onEditPlan, activeId, isGlobalDragging, showDropIndicator }) => {
    const { activeTrip, isDayCollapsed, toggleDayCollapse } = useTrip();
    const isCollapsed = isDayCollapsed(activeTrip.id, date);

    // Switch to useSortable for the Day itself (to allow Day reordering)
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({
        id: date,
        data: { type: 'DAY', date }
    });

    const style = {
        transform: CSS.Translate.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
        zIndex: isDragging ? 20 : 'auto',
        position: 'relative',
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`
                day-group mb-2 transition-colors duration-200 rounded-lg
                ${showDropIndicator ? 'border-2 border-dashed border-blue-500 bg-blue-50/50 dark:bg-blue-900/20' : 'border-2 border-transparent'}
            `}
        >
            {/* Header (Drag Handle) */}
            <div
                id={date}
                {...attributes}
                {...listeners}
                onClick={() => toggleDayCollapse(activeTrip.id, date)}
                onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); }}
                className={`
                    day-header bg-[var(--card-bg)] border border-[var(--card-border)] rounded-lg px-4 py-1.5 mb-2 flex justify-between items-center
                    w-[95%] md:w-[99%] mx-auto cursor-pointer transition-colors duration-200
                `}
            >
                <div className="flex items-center">
                    <div>
                        <span className="text-blue-600 text-[10px] font-black uppercase tracking-widest">Day {dayIndex + 1}</span>
                        <h3 className="text-[var(--text-main)] font-extrabold text-base">{formatDayDate(date)}</h3>
                    </div>
                </div>
                <div className="text-[var(--text-muted)]">
                     <i className={`fa-solid fa-chevron-${isCollapsed ? 'down' : 'up'} text-xs transition-transform duration-300`}></i>
                </div>
            </div>

            <motion.div
                initial={false}
                animate={{
                    height: isCollapsed ? 0 : 'auto',
                    opacity: isCollapsed ? 0 : 1,
                    marginBottom: isCollapsed ? 0 : 24
                }}
                transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
                className="overflow-hidden"
            >
                <div className="space-y-[18px] pt-4 pb-6 min-h-[50px]">
                    {/* Explicit ID for SortableContext ensures isolation */}
                    <SortableContext id={date} items={plans.map(p => p.id)} strategy={verticalListSortingStrategy}>
                        {plans.map(plan => (
                            <PlanItem
                                key={plan.id}
                                plan={plan}
                                onClick={() => onEditPlan(plan)}
                            />
                        ))}
                    </SortableContext>

                    <div
                        onClick={() => onAddPlan(date)}
                        className={`
                            h-[56px] w-[90.25%] md:w-[94.05%] mx-auto flex items-center justify-center border-2 border-dashed
                            border-slate-200 dark:border-slate-700 bg-transparent dark:bg-slate-800/30 text-slate-500 dark:text-slate-400
                            rounded-lg text-sm font-medium cursor-pointer hover:border-[var(--accent-blue)] hover:text-[var(--accent-blue)] transition-colors
                        `}
                    >
                        Tap here to add new plan
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default DayGroup;
