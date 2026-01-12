import React, { useState, useRef, useCallback } from 'react';
import { useTrip } from '../../context/TripContext';
import { getDaysArray, formatDate, formatDayDate } from '../../utils/date';
import DayGroup from './DayGroup';
import { DndContext, DragOverlay, useSensor, useSensors, MouseSensor, TouchSensor } from '@dnd-kit/core';
import { arrayMove, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import PlanItem from './PlanItem';
import { customCollisionDetection } from '../../utils/dndStrategies';

const ItineraryList = ({ onOpenPlanModal, onEditPlan }) => {
    const { activeTrip, addOrUpdateTrip } = useTrip();
    const [activeId, setActiveId] = useState(null);
    const [activePlan, setActivePlan] = useState(null);
    const [activeDay, setActiveDay] = useState(null); // For dragging days
    const dragStartTime = useRef(0);

    // Initialize localPlans directly from activeTrip to prevent flash of empty content
    const [localPlans, setLocalPlans] = useState(() => {
        if (!activeTrip?.plans) return [];
        return [...activeTrip.plans].sort((a, b) => {
            if (a.date !== b.date) return a.date.localeCompare(b.date);
            return (a.order || 0) - (b.order || 0);
        });
    });

    // Modifier to enforce a 200ms delay on drag movement after activation (popup)
    const movementDelayModifier = useCallback(({ transform }) => {
        if (Date.now() - dragStartTime.current < 200) {
            return {
                ...transform,
                x: 0,
                y: 0,
            };
        }
        return transform;
    }, []);

    // Sync local state with context when not dragging
    // We strictly avoid syncing IF we just dropped an item and are waiting for the async update to return
    // However, since activeId becomes null immediately, we might sync back to old state.
    // Ideally, we trust optimistic update and only sync if activeTrip.plans actually changes from external source.
    // For now, simple check:
    React.useEffect(() => {
        if (!activeId && activeTrip?.plans) {
            const sortedPlans = [...activeTrip.plans].sort((a, b) => {
                if (a.date !== b.date) return a.date.localeCompare(b.date);
                return (a.order || 0) - (b.order || 0);
            });
            // Only update if different? Deep comparison is expensive.
            // But usually this runs when activeTrip changes.
            // If we just called addOrUpdateTrip, activeTrip will eventually update to match localPlans.
            // If we setLocalPlans here, we might revert momentarily if activeTrip is stale?
            // Yes, but React state updates are batched/fast.
            setLocalPlans(sortedPlans);
        }
    }, [activeTrip, activeId]);

    // Lock body scroll during drag to prevent background scrolling on mobile
    // Using explicit touchmove listener is more robust than style.touchAction on iOS for active drags
    React.useEffect(() => {
        const preventScroll = (e) => {
            if (activeId) {
                e.preventDefault();
            }
        };

        if (activeId) {
            // "passive: false" is required to allow preventDefault()
            document.addEventListener('touchmove', preventScroll, { passive: false });
            // Also adding touch-action: none as a fallback layer
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
        dragStartTime.current = Date.now();
        const { active } = event;
        setActiveId(active.id);

        // Check if it's a Day (active.id is a date string in 'YYYY-MM-DD' format usually, check against days array)
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

        // Only handle PLAN moving over PLAN or DAY (for insertion)
        if (activeType === 'PLAN') {
            const activePlan = plans.find(p => p.id === activeId);
            if (!activePlan) return;

            // Find source and destination details
            const sourceDate = activePlan.date;
            let targetDate = null;

            if (overType === 'DAY') {
                targetDate = overId;
            } else if (overType === 'PLAN') {
                const overPlan = plans.find(p => p.id === overId);
                if (overPlan) targetDate = overPlan.date;
            }

            if (!targetDate) return;

            // If we are moving to a different day, or reordering within the same day
            setLocalPlans((prevPlans) => {
                const activeIndex = prevPlans.findIndex(p => p.id === activeId);
                const overIndex = prevPlans.findIndex(p => p.id === overId);

                let newPlans = [...prevPlans];

                // 1. Update Date if changed
                if (sourceDate !== targetDate) {
                    newPlans[activeIndex] = { ...newPlans[activeIndex], date: targetDate };
                }

                // 2. Move item if over another plan
                if (overIndex !== -1) {
                    return arrayMove(newPlans, activeIndex, overIndex);
                }

                // 3. If over a Day header, ensure it's at the end of that day's list?
                // Actually, if we just updated the date, it stays in its original index in the array
                // but appears in the new day.
                // To be safe, if dropping on a Day header, maybe move it to the end of the array?
                // But array order != display order if filtered.
                // However, if we append to end of array, it is guaranteed to be last in filter
                // (assuming other items are earlier).
                // Let's just leave it at current index if overIndex is -1, but update date.
                // Visual sort is based on array order.
                return newPlans;
            });
        }
    };

    const handleDragEnd = async (event) => {
        const { active, over } = event;
        setActiveId(null);
        setActivePlan(null);
        setActiveDay(null);

        if (!over) {
             setLocalPlans(activeTrip.plans); // Revert
             return;
        }

        const activeIdStr = active.id;
        const overIdStr = over.id;

        // === CASE A: Dragging a DAY ===
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
                 // Sync just in case
                 setLocalPlans([...localPlans]);
            }
            return;
        }

        // === CASE B: Dragging a PLAN ===
        const finalPlans = [...localPlans];

        // Recalculate order for every day
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
            modifiers={[movementDelayModifier]}
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
                        // Removed sort logic here to rely on array order for Drag and Drop 'Make Space' feature

                    return (
                        <DayGroup
                            key={date}
                            date={date}
                            dayIndex={idx}
                            plans={dayPlans}
                            onAddPlan={() => onOpenPlanModal(date)}
                            onEditPlan={onEditPlan}
                            activeId={activeId}
                        />
                    );
                })}
            </div>

            <DragOverlay dropAnimation={null} zIndex={100}>
                {activeId ? (
                    activeDay ? (
                         <div className="w-[95%] md:w-[99%] mx-auto bg-[var(--card-bg)] border border-[var(--card-border)] rounded-lg px-4 py-3 shadow-2xl scale-105 transition-transform">
                            <span className="text-blue-600 text-[10px] font-black uppercase tracking-widest block mb-1">Day {days.indexOf(activeDay) + 1}</span>
                            <h3 className="text-[var(--text-main)] font-extrabold text-base">{formatDayDate(activeDay)}</h3>
                        </div>
                    ) : (
                        activePlan && (
                            <div className="w-full max-w-[97vw]">
                                <PlanItem plan={activePlan} isOverlay />
                            </div>
                        )
                    )
                ) : null}
            </DragOverlay>
        </DndContext>
    );
};

export default ItineraryList;
