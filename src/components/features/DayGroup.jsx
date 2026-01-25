import React, { useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PlanItem from './PlanItem';
import { useTrip } from '../../context/TripContext';
import { formatDate, formatDayDate } from '../../utils/date';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';

const DayGroup = ({ date, dayIndex, plans, onAddPlan, onEditPlan, activeId, isGlobalDragging }) => {
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

    // Main Container Drop Zone (Fallback)
    const {
        setNodeRef: setDropRef,
        isOver
    } = useDroppable({
        id: date,
        data: { type: 'DAY', date }
    });

    // Explicit Header Drop Zone (Ref attached to sticky element)
    const {
        setNodeRef: setHeaderDropRef,
        isOver: isOverHeader
    } = useDroppable({
        id: `header-${date}`,
        data: { type: 'DAY_HEADER', date }
    });

    // Explicit Footer Drop Zone
    const {
        setNodeRef: setFooterDropRef,
        isOver: isOverFooter
    } = useDroppable({
        id: `footer-${date}`,
        data: { type: 'DAY_FOOTER', date }
    });

    // Determine if we should show the swap indicator
    const isDraggingDay = activeId && /^\d{4}-\d{2}-\d{2}$/.test(activeId);
    const showSwapIndicator = isOver && isDraggingDay && !isDragging;

    // Ghost Logic: If dragging, hide the real header (opacity-0) and show a visual ghost
    const showGhost = isDragging || isGlobalDragging;

    const style = {
        // No transform/transition for the container, only opacity if this item is the one being dragged (original)
        opacity: isDragging ? 0.4 : 1,
        zIndex: isDragging ? 20 : 'auto',
        position: 'relative',
    };

    // Shared Header Content
    const HeaderContent = () => (
        <>
            <div className="flex items-center">
                <div>
                    <span className="text-blue-600 text-[10px] font-black uppercase tracking-widest">Day {dayIndex + 1}</span>
                    <h3 className="text-[var(--text-main)] font-extrabold text-base">{formatDayDate(date)}</h3>
                </div>
            </div>
            <div className="text-[var(--text-muted)]">
                    <i className={`fa-solid fa-chevron-${isCollapsed ? 'down' : 'up'} text-xs transition-transform duration-300`}></i>
            </div>
        </>
    );

    return (
        <div
            ref={setDropRef}
            style={style}
            className={`
                day-group mb-2 transition-all duration-200 rounded-lg
                ${showSwapIndicator ? 'border-2 border-dashed border-blue-500 bg-blue-50/50 dark:bg-blue-900/20' : 'border-2 border-transparent'}
            `}
        >
            {/* 1. Real Header (Physics) */}
            {/* Receives Refs. Flows naturally (static) when dragging to fix coordinates. */}
            <div
                id={date}
                ref={(node) => {
                    setDragRef(node);
                    setHeaderDropRef(node);
                }}
                {...attributes}
                {...listeners}
                onClick={() => toggleDayCollapse(activeTrip.id, date)}
                onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); }}
                className={`
                    day-header bg-[var(--card-bg)] border border-[var(--card-border)] rounded-lg px-4 py-1.5 mb-2 flex justify-between items-center
                    w-[95%] md:w-[99%] mx-auto cursor-pointer transition-all duration-200
                    ${!showGhost ? 'sticky top-[48px] md:top-[56px] z-40' : 'opacity-0 pointer-events-none'}
                `}
            >
                <HeaderContent />
            </div>

            {/* 2. Ghost Header (Visual Fixed Overlay) */}
            {/* Rendered OUTSIDE the flow to avoid impacting layout/scrolling. */}
            {/* It mimics the position of where the sticky header WOULD be. */}
            {showGhost && (
                <div
                    className={`
                        day-header bg-[var(--card-bg)] border border-[var(--card-border)] rounded-lg px-4 py-1.5 mb-2 flex justify-between items-center
                        w-[95%] md:w-[99%] mx-auto cursor-pointer transition-all duration-200
                        fixed top-[48px] md:top-[56px] left-0 right-0 max-w-4xl z-50 pointer-events-none
                    `}
                >
                    <HeaderContent />
                </div>
            )}

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
                        ref={setFooterDropRef}
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
