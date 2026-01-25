import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useTrip } from '../../context/TripContext';
import { getDaysArray, formatDayDate } from '../../utils/date';
import DayGroup from './DayGroup';
import { DndContext, DragOverlay, useSensor, useSensors, MouseSensor, TouchSensor } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import PlanItem from './PlanItem';
import { customCollisionDetection } from '../../utils/dndStrategies';

const ItineraryList = ({ onOpenPlanModal, onEditPlan }) => {
    const { activeTrip, addOrUpdateTrip } = useTrip();
    const [activeId, setActiveId] = useState(null);
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
                let newPlans = [...prevPlans];

                // Identify migration
                const isMigration = currentDate !== targetDate;

                // 1. Update the date if it has changed
                if (isMigration) {
                    newPlans[activeIndex] = { ...newPlans[activeIndex], date: targetDate };
                }

                // 2. Handle Plan Reordering
                if (overType === 'PLAN') {
                     const overIndex = prevPlans.findIndex(p => p.id === overId);

                     if (overIndex !== -1) {
                         // EDGE CASE HANDLING FOR INTER-DAY FIRST/LAST ITEMS
                         if (isMigration) {
                             // Get plans for the target day to identify first/last
                             // Note: prevPlans has the old state, newPlans has updated date.
                             // We check prevPlans for structure of target day *before* our insertion affects it visually?
                             // No, logic is based on current 'over' target.

                             const targetDayPlans = prevPlans.filter(p => p.date === targetDate);
                             if (targetDayPlans.length > 0) {
                                 const firstPlanId = targetDayPlans[0].id;
                                 const lastPlanId = targetDayPlans[targetDayPlans.length - 1].id;

                                 const isMovingDown = activeIndex < overIndex;
                                 const isMovingUp = activeIndex > overIndex;

                                 // CASE: Moving Down to Top Item -> Force "Before" (Index - 1)
                                 if (overId === firstPlanId && isMovingDown) {
                                      // Only if we are visually above? dnd-kit usually handles this,
                                      // but arrayMove defaults to 'after' for Down moves.
                                      // We force it before.
                                      return arrayMove(newPlans, activeIndex, overIndex - 1);
                                 }

                                 // CASE: Moving Up to Last Item -> Force "After" (Index + 1)
                                 if (overId === lastPlanId && isMovingUp) {
                                      // arrayMove defaults to 'before' for Up moves.
                                      // We force it after.
                                      return arrayMove(newPlans, activeIndex, overIndex + 1);
                                 }
                             }
                         }

                         // Standard behavior for everything else (Middle items, Same day)
                         return arrayMove(newPlans, activeIndex, overIndex);
                     }
                }

                // 3. Handle Day Container Drop (Bottom Append)
                if (overType === 'DAY') {
                     // Check if active item is ALREADY the last item of the target day (visually)
                     const plansInTargetDay = newPlans.filter(p => p.date === targetDate);
                     const lastPlan = plansInTargetDay[plansInTargetDay.length - 1];

                     // If it's already the last item...
                     if (lastPlan && lastPlan.id === activeId) {
                         // If we performed a migration (date change), we must return newPlans to save that state.
                         if (isMigration) {
                             return newPlans;
                         }
                         // Otherwise, if date is same and position is same, do nothing (prevent infinite re-render).
                         return prevPlans;
                     }

                     // Find the last plan of the target day (excluding active item) to insert after
                     const lastPlanIndex = newPlans.findLastIndex(p => p.date === targetDate && p.id !== activeId);

                     if (lastPlanIndex !== -1) {
                         const [movedItem] = newPlans.splice(activeIndex, 1);
                         // Re-calculate last index (should be the same as lastPlanIndex if we just removed activeId, unless activeId was before it)
                         const adjustedLastIndex = newPlans.findLastIndex(p => p.date === targetDate);
                         // Insert after
                         newPlans.splice(adjustedLastIndex + 1, 0, movedItem);
                         return newPlans;
                     }
                     // If day is empty (except for active item which we just moved via date change),
                     // it's already in the right place (index 0 of that day).
                     // But we must return newPlans if isMigration happened.
                     if (isMigration) return newPlans;
                }

                return newPlans;
            });
        }
    };

    const handleDragEnd = async (event) => {
        const { active, over } = event;
        setActiveId(null);
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
            if (days.includes(overIdStr) && activeIdStr !== overIdStr) {
                 const sourceDate = activeIdStr;
                 const targetDate = overIdStr;

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

        // Handle Plan Finalization (Just saving the state from DragOver)
        // Normalize Order
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
                {days.map((date, idx) => {
                    const dayPlans = plans
                        .filter(p => p.date === date);

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
                        />
                    );
                })}
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
