import React, { useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PlanItem from './PlanItem';
import { useTrip } from '../../context/TripContext';
import { formatDate } from '../../utils/date';
import { useSortable, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const DayGroup = ({ date, dayIndex, plans, onAddPlan, onEditPlan, activeId }) => {
    const { activeTrip, isDayCollapsed, toggleDayCollapse } = useTrip();
    const isCollapsed = isDayCollapsed(activeTrip.id, date);

    // DnD Sortable for the Day
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
        isOver
    } = useSortable({
        id: date,
        data: { type: 'DAY', date }
    });

    // Determine if we should show the swap indicator
    // Logic: If something is hovering over this day (isOver) AND the active dragged item is ALSO a Day (date string check)
    // Note: strict date string check might need regex or context, but `ItineraryList` handles `activeId` being a day.
    // If activeId looks like a date 'YYYY-MM-DD', it is a day.
    const isDraggingDay = activeId && /^\d{4}-\d{2}-\d{2}$/.test(activeId);
    const showSwapIndicator = isOver && isDraggingDay && !isDragging;

    const style = {
        transform: CSS.Translate.toString(transform),
        transition,
        zIndex: isDragging ? 20 : 'auto', // Higher z-index when dragging
        opacity: isDragging ? 0.4 : 1, // Visual cue for the item being moved
        position: 'relative', // Needed for z-index
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`
                day-group mb-2 transition-all duration-200 rounded-lg
                ${showSwapIndicator ? 'border-2 border-dashed border-blue-500 bg-blue-50/50 dark:bg-blue-900/20' : 'border-2 border-transparent'}
            `}
        >
            <div
                {...attributes}
                {...listeners}
                onClick={() => toggleDayCollapse(activeTrip.id, date)}
                className={`
                    day-header glass rounded-lg px-4 py-1.5 mb-2 flex justify-between items-center
                    w-[95%] md:w-[99%] mx-auto cursor-pointer transition-all duration-200
                    ${isCollapsed ? 'opacity-60' : ''}
                    sticky top-[48px] md:top-[56px] z-40 touch-none
                `}
            >
                <div className="flex items-center">
                    <div>
                        <span className="text-blue-600 text-[10px] font-black uppercase tracking-widest">Day {dayIndex + 1}</span>
                        <h3 className="text-[var(--text-main)] font-extrabold text-base">{formatDate(date)}</h3>
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
                    marginBottom: isCollapsed ? 0 : 24 // space-y-6 equivalent
                }}
                transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
                className="overflow-hidden"
            >
                <div className="space-y-[18px] pt-4 pb-6 min-h-[50px]">
                    <SortableContext items={plans.map(p => p.id)} strategy={verticalListSortingStrategy}>
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
                        className="h-[56px] w-[90.25%] md:w-[94.05%] mx-auto flex items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-700 bg-transparent dark:bg-slate-800/30 rounded-lg text-sm font-medium text-slate-500 dark:text-slate-400 cursor-pointer hover:border-[var(--accent-blue)] hover:text-[var(--accent-blue)] transition-colors"
                    >
                        Tap here to add new plan
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default DayGroup;
