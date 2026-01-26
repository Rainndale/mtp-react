import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useTrip } from '../../context/TripContext';
import { getDaysArray, formatDayDate } from '../../utils/date';
import DayGroup from './DayGroup';
import { DndContext, DragOverlay, useSensor, useSensors, MouseSensor, TouchSensor } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import PlanItem from './PlanItem';
import { customCollisionDetection } from '../../utils/dndStrategies';

const ItineraryList = ({ onOpenPlanModal, onEditPlan }) => {
    const { activeTrip, addOrUpdateTrip, isDayCollapsed } = useTrip();
    const [activeId, setActiveId] = useState(null);
    const [overId, setOverId] = useState(null);
    const [activePlan, setActivePlan] = useState(null);
    const [activeDay, setActiveDay] = useState(null); // For dragging days
    const [dragWidth, setDragWidth] = useState(null);

    // Initialize localPlans directly from activeTrip to prevent flash of empty content
    const [localPlans, setLocalPlans] = useState(() => {
        if (!activeTrip?.plans) return [];
        return [...activeTrip.plans].sort((a, b) => {
            if (a.date !== b.date) return a.date.localeCompare(b.date);
            return (a.order || 0) - (b.order || 0);
        });
    });

    // Sync local state with context when not dragging
    React.useEffect(() => {
        if (!activeId && activeTrip?.plans) {
            const sortedPlans = [...activeTrip.plans].sort((a, b) => {
                if (a.date !== b.date) return a.date.localeCompare(b.date);
                return (a.order || 0) - (b.order || 0);
            });
            setLocalPlans(sortedPlans);
        }
    }, [activeTrip, activeId]);

    // Lock body scroll during drag
    React.useEffect(() => {
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
    const plans = localPlans;

    // --- Global Sortable Context Calculation ---
    // We only include plans from EXPANDED days to ensure the SortableContext matches the visual DOM.
    // If we included hidden plans, dnd-kit would try to sort them and get confused about positions.
    const visiblePlans = useMemo(() => {
        return localPlans.filter(p => !isDayCollapsed(activeTrip.id, p.date));
    }, [localPlans, activeTrip.id, isDayCollapsed]); // Recalculate if collapse state changes

    const visiblePlanIds = useMemo(() => visiblePlans.map(p => p.id), [visiblePlans]);


    const handleDragStart = (event) => {
        const { active } = event;
        setActiveId(active.id);
        setOverId(null);

        if (active.rect.current?.initial?.width) {
            setDragWidth(active.rect.current.initial.width);
        } else {
             const node = document.getElementById(active.id);
             if (node) {
                 setDragWidth(node.getBoundingClientRect().width);
             }
        }

        if (days.includes(active.id)) {
            setActiveDay(active.id);
            setActivePlan(null);
        } else {
            const plan = plans.find(p => p.id === active.id);
            if (plan) setActivePlan(plan);
            setActiveDay(null);
        }
    };

    const handleDragOver = (event) => {
        const { active, over } = event;
        setOverId(over?.id || null);

        if (!over) return;

        const activeId = active.id;
        const overId = over.id;

        if (activeId === overId) return;

        const activeType = active.data.current?.type;
        const overType = over.data.current?.type;

        // 1. Handling PLAN Dragging
        if (activeType === 'PLAN') {
            const activePlan = plans.find(p => p.id === activeId);
            if (!activePlan) return;

            const currentDate = activePlan.date;
            let targetDate = null;

            if (overType === 'DAY') {
                targetDate = overId;
            } else if (overType === 'PLAN') {
                const overPlan = plans.find(p => p.id === overId);
                if (overPlan) {
                    targetDate = overPlan.date;
                }
            }

            if (!targetDate) return;

            setLocalPlans((prevPlans) => {
                const activeIndex = prevPlans.findIndex(p => p.id === activeId);
                const overIndex = prevPlans.findIndex(p => p.id === overId);

                let newPlans = [...prevPlans];

                // Identify migration
                const isMigration = currentDate !== targetDate;

                // 1. Update the date if it has changed (Inter-day Move)
                if (isMigration) {
                    newPlans[activeIndex] = { ...newPlans[activeIndex], date: targetDate };
                }

                // 2. Handle Plan Reordering (Standard Sortable behavior)
                // If over a Plan, we just move the item in the big list.
                if (overType === 'PLAN' && overIndex !== -1) {
                     return arrayMove(newPlans, activeIndex, overIndex);
                }

                // 3. Handle Day Container Drop (Dropping into empty or non-empty day container)
                if (overType === 'DAY') {
                     // Logic: If dragging over a Day, we usually want to append to the end of that day.

                     // Find the last item of the target day
                     const lastPlanIndex = newPlans.findLastIndex(p => p.date === targetDate && p.id !== activeId);

                     if (lastPlanIndex !== -1) {
                         // Move to after the last item of that day
                         // Note: arrayMove works by index.
                         // But we need to be careful. The "activeIndex" might have changed relative to "lastPlanIndex".

                         // It's safer to remove and insert.
                         const [movedItem] = newPlans.splice(activeIndex, 1);

                         // Recalculate insertion point (findLastIndex might have shifted)
                         const adjustedLastIndex = newPlans.findLastIndex(p => p.date === targetDate);
                         newPlans.splice(adjustedLastIndex + 1, 0, movedItem);

                         return newPlans;
                     } else {
                         // The day is effectively empty (or only contained the active item).
                         // We should place it as the FIRST item of that day.
                         // Or, since the list is sorted by date, we find the LAST item of the PREVIOUS day?
                         // Actually, we just need to ensure the order is correct relative to other days.

                         // Ideally, we move it to the correct "slot" for that day in the big list.
                         // If the day is empty, its slot is after (Day-1 plans) and before (Day+1 plans).

                         // BUT: `localPlans` is just a list. We sort it by date anyway in render?
                         // No, `localPlans` IS the source of truth for order.

                         // So we must move the item to the correct block.
                         // Find the index where this day's block starts.
                         // Since the day is empty, we find the first plan that has a date > targetDate.
                         const nextDayPlanIndex = newPlans.findIndex(p => p.date > targetDate);

                         const [movedItem] = newPlans.splice(activeIndex, 1);

                         if (nextDayPlanIndex !== -1) {
                             // Insert before the next day's plans
                             // Note: nextDayPlanIndex might have shifted if activeIndex < nextDayPlanIndex
                             const adjustedNextIndex = newPlans.findIndex(p => p.date > targetDate);
                             newPlans.splice(adjustedNextIndex, 0, movedItem);
                         } else {
                             // No later plans, append to end
                             newPlans.push(movedItem);
                         }
                         return newPlans;
                     }
                }

                return newPlans;
            });
        }
    };

    const handleDragEnd = async (event) => {
        const { active, over } = event;
        setActiveId(null);
        setOverId(null);
        setActivePlan(null);
        setActiveDay(null);
        setDragWidth(null);

        if (!over) {
             setLocalPlans(activeTrip.plans);
             return;
        }

        const activeIdStr = active.id;
        const overIdStr = over.id;

        // Handle Day Reordering (Day vs Day)
        if (days.includes(activeIdStr)) {
            // Find target date if dropping over a Plan instead of a Day Container
            let targetDate = null;
            if (days.includes(overIdStr)) {
                targetDate = overIdStr;
            } else {
                const overPlan = localPlans.find(p => p.id === overIdStr);
                if (overPlan) {
                    targetDate = overPlan.date;
                }
            }

            if (targetDate && activeIdStr !== targetDate) {
                 const sourceDate = activeIdStr;

                 let newPlans = [...localPlans];

                 const sourceDayPlans = newPlans.filter(p => p.date === sourceDate);
                 const targetDayPlans = newPlans.filter(p => p.date === targetDate);
                 const otherPlans = newPlans.filter(p => p.date !== sourceDate && p.date !== targetDate);

                 const updatedSourcePlans = sourceDayPlans.map(p => ({ ...p, date: targetDate }));
                 const updatedTargetPlans = targetDayPlans.map(p => ({ ...p, date: sourceDate }));

                 newPlans = [...otherPlans, ...updatedSourcePlans, ...updatedTargetPlans];

                 setLocalPlans(newPlans);
                 await addOrUpdateTrip({ ...activeTrip, plans: newPlans });
            } else {
                 setLocalPlans([...localPlans]);
            }
            return;
        }

        // Handle Plan Finalization
        // Normalize Order for ALL plans
        const finalPlans = [...localPlans];
        days.forEach(day => {
            const dayPlans = finalPlans.filter(p => p.date === day);
            dayPlans.forEach((p, idx) => {
                const planIndex = finalPlans.findIndex(fp => fp.id === p.id);
                finalPlans[planIndex] = { ...finalPlans[planIndex], order: idx };
            });
        });

        await addOrUpdateTrip({ ...activeTrip, plans: finalPlans });
    };

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={customCollisionDetection}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
            accessibility={{ restoreFocus: false }}
        >
            <div className="relative space-y-6 pb-24">
                <SortableContext items={visiblePlanIds} strategy={verticalListSortingStrategy}>
                    {days.map((date, idx) => {
                        const dayPlans = plans.filter(p => p.date === date);

                        // Determine if this day should show a drop indicator
                        let isOverThisDay = false;
                        if (overId) {
                             if (overId === date) {
                                 isOverThisDay = true;
                             } else {
                                 const overPlan = plans.find(p => p.id === overId);
                                 if (overPlan && overPlan.date === date) {
                                     isOverThisDay = true;
                                 }
                             }
                        }

                        const isDaySwapTarget = activeDay && activeDay !== date;
                        const showDropIndicator = isOverThisDay && isDaySwapTarget;

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
