import React, { useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PlanItem from './PlanItem';
import { useTrip } from '../../context/TripContext';
import { formatDate, formatDayDate } from '../../utils/date';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';

const DayGroup = ({ date, dayIndex, plans, onAddPlan, onEditPlan, activeId }) => {
    const { activeTrip, isDayCollapsed, toggleDayCollapse } = useTrip();
    const isCollapsed = isDayCollapsed(activeTrip.id, date);

    // DnD Hooks - Split Draggable (Header) and Droppable (Container)
    const {
        attributes,
        listeners,
        setNodeRef: setDragRef,
        isDragging
    } = useDraggable({
        id: date,
        data: { type: 'DAY', date }
    });

    const {
        setNodeRef: setDropRef,
        isOver
    } = useDroppable({
        id: date,
        data: { type: 'DAY', date }
    });

    // Determine if we should show the swap indicator
    const isDraggingDay = activeId && /^\d{4}-\d{2}-\d{2}$/.test(activeId);
    const showSwapIndicator = isOver && isDraggingDay && !isDragging;

    const style = {
        // No transform/transition for the container, only opacity if this item is the one being dragged (original)
        opacity: isDragging ? 0.4 : 1,
        zIndex: isDragging ? 20 : 'auto',
        position: 'relative',
    };

    return (
        <div
            ref={setDropRef}
            style={style}
            className={`
                day-group mb-6 transition-all duration-200
                ${showSwapIndicator ? 'rounded-lg border-2 border-dashed border-indigo-600 bg-indigo-50/50 dark:bg-indigo-900/20' : ''}
            `}
        >
            {/* Sticky Header: Contains Badge + Date Text */}
            <div
                id={date}
                ref={setDragRef}
                {...attributes}
                {...listeners}
                onClick={() => toggleDayCollapse(activeTrip.id, date)}
                onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); }}
                className={`
                    flex items-center cursor-pointer group
                    ${isDragging ? '' : 'sticky top-[48px] md:top-[56px] z-40 bg-[var(--bg-color)] py-2'}
                `}
            >
                {/* Badge Column (Sticky with Header) */}
                <div className="flex flex-col items-center mr-4 w-6 flex-shrink-0">
                    <div className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold shadow-md">
                        {dayIndex + 1}
                    </div>
                </div>

                {/* Date Text Column */}
                <div className="flex-1 min-w-0 flex justify-between items-start">
                    <div>
                        <span className="text-indigo-600 text-[10px] font-black uppercase tracking-widest block mb-1">
                            Day {dayIndex + 1}
                        </span>
                        <h3 className="text-[var(--text-main)] font-extrabold text-xl leading-none">
                            {formatDayDate(date)}
                        </h3>
                    </div>
                    <div className="text-[var(--text-muted)] pt-2">
                        <i className={`fa-solid fa-chevron-${isCollapsed ? 'down' : 'up'} text-xs transition-transform duration-300`}></i>
                    </div>
                </div>
            </div>

            {/* Body Content: Line + Plans */}
            <motion.div
                initial={false}
                animate={{
                    height: isCollapsed ? 0 : 'auto',
                    opacity: isCollapsed ? 0 : 1,
                }}
                transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
                className="overflow-hidden"
            >
                <div className="flex min-h-[20px]">
                    {/* Timeline Line Column (Static relative to plans) */}
                    <div className="flex flex-col items-center mr-4 w-6 flex-shrink-0 relative">
                        {/* Line runs from very top (connecting to sticky header) to bottom */}
                        <div className="w-0.5 bg-indigo-100 dark:bg-indigo-900/50 absolute top-0 bottom-0 left-1/2 -translate-x-1/2"></div>
                    </div>

                    {/* Plans Column */}
                    <div className="flex-1 min-w-0 pb-4 space-y-4">
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
                            className="h-[56px] w-full flex items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-700 bg-transparent dark:bg-slate-800/30 rounded-2xl text-sm font-medium text-slate-500 dark:text-slate-400 cursor-pointer hover:border-[var(--accent-blue)] hover:text-[var(--accent-blue)] transition-colors relative z-10"
                        >
                            Tap here to add new plan
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default DayGroup;
