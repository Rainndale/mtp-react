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

    // Initialize localPlans directly from activeTrip
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

            // Scenario A: Dropping over another PLAN
            if (overType === 'PLAN') {
                const overPlan = plans.find(p => p.id === overId);
                if (!overPlan) return;

                setLocalPlans((prevPlans) => {
                    const activeIndex = prevPlans.findIndex(p => p.id === activeId);
                    const overIndex = prevPlans.findIndex(p => p.id === overId);

                    if (activeIndex === -1 || overIndex === -1) return prevPlans;

                    const newPlans = [...prevPlans];

                    // Update date if crossing days
                    if (newPlans[activeIndex].date !== overPlan.date) {
                         newPlans[activeIndex] = { ...newPlans[activeIndex], date: overPlan.date };
                    }

                    // Geometry-Aware Insertion Logic
                    const activeNode = active.rect.current?.translated;
                    const overNode = document.getElementById(overId);

                    if (activeNode && overNode) {
                        const overRect = overNode.getBoundingClientRect();
                        const activeCenterY = activeNode.top + activeNode.height / 2;
                        const overCenterY = overRect.top + overRect.height / 2;

                        const isBelow = activeCenterY > overCenterY;
                        const isMovingDown = activeIndex < overIndex;

                        let newOverIndex = overIndex;

                        if (isMovingDown) {
                            // Moving Down
                            // If Below (Bottom Half) -> Target = overIndex (visually after)
                            // If Above (Top Half) -> Target = overIndex - 1 (visually before)
                            newOverIndex = isBelow ? overIndex : overIndex - 1;
                        } else {
                            // Moving Up
                            // If Below (Bottom Half) -> Target = overIndex + 1 (visually after)
                            // If Above (Top Half) -> Target = overIndex (visually before)
                            newOverIndex = isBelow ? overIndex + 1 : overIndex;
                        }

                        // Boundary check
                        if (newOverIndex < 0) newOverIndex = 0;
                        if (newOverIndex >= newPlans.length) newOverIndex = newPlans.length - 1;

                        return arrayMove(newPlans, activeIndex, newOverIndex);
                    }

                    // Fallback to standard behavior if geometry fails
                    return arrayMove(newPlans, activeIndex, overIndex);
                });
            }

            // Scenario B: Dropping over a DAY CONTAINER (Empty day or header)
            else if (overType === 'DAY') {
                const overDayDate = overId; // The ID of the Day Group is the date string

                setLocalPlans((prevPlans) => {
                    const activeIndex = prevPlans.findIndex(p => p.id === activeId);
                    if (activeIndex === -1) return prevPlans;

                    const newPlans = [...prevPlans];
                    const activeItem = newPlans[activeIndex];

                    // Update date if moving between days
                    if (activeItem.date !== overDayDate) {
                        activeItem.date = overDayDate;
                    }

                    // Remove from old position
                    const [movedItem] = newPlans.splice(activeIndex, 1);

                    // Smart Insertion Logic for Day Container
                    // Find plans belonging to the target day
                    const dayPlans = newPlans.filter(p => p.date === overDayDate);

                    let insertIndex = newPlans.length; // Default to end

                    if (dayPlans.length > 0 && active.rect.current?.translated) {
                        const activeRect = active.rect.current.translated;
                        const activeCenterY = activeRect.top + activeRect.height / 2;

                        // Find the first plan that is below the cursor (visually)
                        // This implies we should insert *before* that plan
                        const targetPlan = dayPlans.find(p => {
                            const node = document.getElementById(p.id);
                            if (!node) return false;
                            const rect = node.getBoundingClientRect();
                            const planCenterY = rect.top + rect.height / 2;
                            return activeCenterY < planCenterY;
                        });

                        if (targetPlan) {
                            // Insert before target plan
                            insertIndex = newPlans.findIndex(p => p.id === targetPlan.id);
                        } else {
                            // Below all plans -> Insert after the last plan of that day
                            const lastPlan = dayPlans[dayPlans.length - 1];
                            const lastIndex = newPlans.findIndex(p => p.id === lastPlan.id);
                            insertIndex = lastIndex + 1;
                        }
                    } else if (dayPlans.length > 0) {
                        // Fallback: Append to end of day if geometry not available
                         const lastPlan = dayPlans[dayPlans.length - 1];
                         const lastIndex = newPlans.findIndex(p => p.id === lastPlan.id);
                         insertIndex = lastIndex + 1;
                    } else {
                        // Day is empty, logic allows pushing to end (which is effectively index 0 relative to day, but end of array)
                        // We need to ensure we don't just push if the array has other days' plans?
                        // If dayPlans is empty, inserting at `newPlans.length` puts it at the very bottom of the global list.
                        // Ideally we should insert it where the day *should* be?
                        // But `plans` is sorted by date/order in `useEffect`.
                        // For transient drag state, appending is usually fine as it will render in the correct day group.
                        // Wait, if I append to end, and Day 1 is empty, but Day 2 has plans.
                        // Day 1 item is now after Day 2 items in `plans` array.
                        // `DayGroup` renders `plans.filter(p => p.date === date)`.
                        // So the order in the global array doesn't affect *which* day it renders in, only order within day if we rely on array order.
                        // So appending is fine for rendering.
                        insertIndex = newPlans.length;
                    }

                    // Insert at calculated index
                    newPlans.splice(insertIndex, 0, movedItem);

                    return newPlans;
                });
            }
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

        // Handling Day Reordering (Day vs Day)
        if (days.includes(activeIdStr)) {
            const overIdStr = over.id;
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
        const finalPlans = [...localPlans];
        const daysArray = getDaysArray(activeTrip.startDate, activeTrip.endDate);

        daysArray.forEach(day => {
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
