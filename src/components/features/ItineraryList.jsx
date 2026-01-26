import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useTrip } from '../../context/TripContext';
import { getDaysArray, formatDayDate } from '../../utils/date';
import DayGroup from './DayGroup';
import { DndContext, DragOverlay, useSensor, useSensors, MouseSensor, TouchSensor, closestCenter } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import PlanItem from './PlanItem';

const ItineraryList = ({ onOpenPlanModal, onEditPlan }) => {
    const { activeTrip, addOrUpdateTrip, isDayCollapsed } = useTrip();
    const [activeId, setActiveId] = useState(null);
    const [activePlan, setActivePlan] = useState(null);
    const [activeDay, setActiveDay] = useState(null);
    const [overId, setOverId] = useState(null);
    const [dragWidth, setDragWidth] = useState(null);

    // Initialize localPlans directly from activeTrip
    const [localPlans, setLocalPlans] = useState(() => {
        if (!activeTrip?.plans) return [];
        return [...activeTrip.plans].sort((a, b) => {
            if (a.date !== b.date) return a.date.localeCompare(b.date);
            return (a.order || 0) - (b.order || 0);
        });
    });

    // Sync local state with context when not dragging
    useEffect(() => {
        if (!activeId && activeTrip?.plans) {
            const sortedPlans = [...activeTrip.plans].sort((a, b) => {
                if (a.date !== b.date) return a.date.localeCompare(b.date);
                return (a.order || 0) - (b.order || 0);
            });
            setLocalPlans(sortedPlans);
        }
    }, [activeTrip, activeId]);

    // Lock body scroll during drag
    useEffect(() => {
        const preventScroll = (e) => {
            if (activeId) {
                e.preventDefault();
            }
        };

        if (activeId) {
            document.addEventListener('touchmove', preventScroll, { passive: false });
            document.body.style.touchAction = 'none';
        } else {
            document.removeEventListener('touchmove', preventScroll);
            document.body.style.touchAction = '';
        }

        return () => {
            document.removeEventListener('touchmove', preventScroll);
            document.body.style.touchAction = '';
        };
    }, [activeId]);

    const sensors = useSensors(
        useSensor(MouseSensor, {
            activationConstraint: {
                delay: 500,
                tolerance: 5,
            }
        }),
        useSensor(TouchSensor, {
            activationConstraint: {
                delay: 500,
                tolerance: 5,
            }
        })
    );

    if (!activeTrip) {
        return (
             <div className="flex flex-col items-center justify-center py-24 text-center">
                <div className="flex items-center justify-center mb-8">
                    <i className="fa-solid fa-map-location-dot text-7xl text-slate-300 dark:text-slate-700 animate-float"></i>
                </div>
                <h3 className="text-2xl font-black text-[var(--text-main)] mb-2 italic uppercase tracking-tighter">No active itinerary</h3>
                <p className="text-[var(--text-muted)] text-sm mb-8 max-w-xs mx-auto">Your next adventure is waiting to be mapped out. Start your expedition today.</p>
            </div>
        );
    }

    const days = getDaysArray(activeTrip.startDate, activeTrip.endDate);

    const handleDragStart = (event) => {
        const { active } = event;
        setActiveId(active.id);

        if (active.rect.current?.initial?.width) {
            setDragWidth(active.rect.current.initial.width);
        } else {
             const node = document.getElementById(active.id);
             if (node) {
                 setDragWidth(node.getBoundingClientRect().width);
             }
        }

        if (active.data.current?.type === 'DAY') {
            setActiveDay(active.id);
            setActivePlan(null);
        } else if (active.data.current?.type === 'PLAN') {
            const plan = localPlans.find(p => p.id === active.id);
            if (plan) setActivePlan(plan);
            setActiveDay(null);
        }
    };

    const handleDragOver = (event) => {
        const { over } = event;
        setOverId(over ? over.id : null);
    };

    const handleDragEnd = async (event) => {
        const { active, over } = event;
        setActiveId(null);
        setActivePlan(null);
        setActiveDay(null);
        setOverId(null);
        setDragWidth(null);

        if (!over) return;
        if (active.id === over.id) return;

        // 1. Handle Day Reordering (Swapping Day Contents)
        if (active.data.current?.type === 'DAY') {
             const sourceDate = active.id;
             let targetDate = null;

             const overType = over.data.current?.type;

             if (overType === 'DAY') {
                 targetDate = over.id;
             } else if (overType === 'PLAN') {
                 // If dropping over a plan, find its date
                 const overPlan = localPlans.find(p => p.id === over.id);
                 if (overPlan) {
                     targetDate = overPlan.date;
                 }
             }

             if (targetDate && sourceDate !== targetDate) {
                 const sourcePlans = localPlans.filter(p => p.date === sourceDate);
                 const targetPlans = localPlans.filter(p => p.date === targetDate);
                 const otherPlans = localPlans.filter(p => p.date !== sourceDate && p.date !== targetDate);

                 // Swap dates
                 const updatedSourcePlans = sourcePlans.map(p => ({ ...p, date: targetDate }));
                 const updatedTargetPlans = targetPlans.map(p => ({ ...p, date: sourceDate }));

                 const newPlans = [...otherPlans, ...updatedSourcePlans, ...updatedTargetPlans];

                 setLocalPlans(newPlans);
                 await addOrUpdateTrip({ ...activeTrip, plans: newPlans });
             }
             return;
        }

        // 2. Handle Plan Reordering (Same Day Only)
        if (active.data.current?.type === 'PLAN') {
             // Ensure we are dropping over another Plan (or valid target)
             // And ensure we are in the SAME Day container.

             const activeContainerId = active.data.current?.sortable?.containerId;
             const overContainerId = over.data.current?.sortable?.containerId;

             // If not dropping on a sortable item or containers don't match -> Snap back
             if (!overContainerId || activeContainerId !== overContainerId) {
                 return;
             }

             // We are in the same day. Perform reorder.
             const oldIndex = localPlans.findIndex(p => p.id === active.id);
             const newIndex = localPlans.findIndex(p => p.id === over.id);

             if (oldIndex !== newIndex) {
                 const reorderedPlans = arrayMove(localPlans, oldIndex, newIndex);

                 // Normalize 'order' property for the affected day
                 // Use the containerId (which is the date) to filter
                 const dayDate = activeContainerId;
                 const dayPlans = reorderedPlans.filter(p => p.date === dayDate);

                 // Update order index based on the new array position relative to the day
                 // Wait, dayPlans is strictly the plans for this day.
                 // We need to ensure their 'order' matches their index in 'dayPlans'

                 // But reorderedPlans is the global list.
                 // We need to re-calculate 'order' for the subset that is 'dayPlans'.
                 // However, arrayMove on the global list might mix things up if the global list wasn't sorted exactly by day blocks?
                 // But localPlans is sorted by date then order.
                 // So the Day's plans are contiguous.
                 // arrayMove within that contiguous block preserves the day block.

                 // Let's explicitly update the order fields.
                 dayPlans.forEach((p, idx) => {
                     const globalIndex = reorderedPlans.findIndex(gp => gp.id === p.id);
                     if (globalIndex !== -1) {
                         reorderedPlans[globalIndex] = { ...reorderedPlans[globalIndex], order: idx };
                     }
                 });

                 setLocalPlans(reorderedPlans);
                 await addOrUpdateTrip({ ...activeTrip, plans: reorderedPlans });
             }
        }
    };

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
            accessibility={{ restoreFocus: false }}
        >
            <div className="relative space-y-6 pb-24">
                <SortableContext items={days} strategy={verticalListSortingStrategy}>
                    {days.map((date, idx) => {
                        const dayPlans = localPlans.filter(p => p.date === date);

                        // Show drop indicator ONLY when dragging a DAY and hovering over a different day
                        const isOverThisDay = overId === date || (overId && localPlans.find(p => p.id === overId)?.date === date);
                        const showDropIndicator = !!activeDay && isOverThisDay && activeDay !== date;

                        return (
                            <DayGroup
                                key={date}
                                date={date}
                                dayIndex={idx}
                                plans={dayPlans}
                                onAddPlan={() => onOpenPlanModal(date)}
                                onEditPlan={onEditPlan}
                                activeId={activeId}
                                isGlobalDragging={!!activeId}
                                showDropIndicator={showDropIndicator}
                            />
                        );
                    })}
                </SortableContext>
            </div>

            {createPortal(
                <DragOverlay dropAnimation={null} zIndex={100} style={{ width: dragWidth }}>
                    {activeId ? (
                        activeDay ? (
                             <div className="w-full bg-[var(--card-bg)] border border-[var(--card-border)] rounded-lg px-4 py-3 shadow-2xl scale-105 transition-transform">
                                <span className="text-blue-600 text-[10px] font-black uppercase tracking-widest block mb-1">Day {days.indexOf(activeDay) + 1}</span>
                                <h3 className="text-[var(--text-main)] font-extrabold text-base">{formatDayDate(activeDay)}</h3>
                            </div>
                        ) : (
                            activePlan && (
                                <div className="w-full">
                                    <PlanItem plan={activePlan} isOverlay />
                                </div>
                            )
                        )
                    ) : null}
                </DragOverlay>,
                document.body
            )}
        </DndContext>
    );
};

export default ItineraryList;
