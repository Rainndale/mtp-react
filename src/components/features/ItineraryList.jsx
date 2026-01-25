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

                // 1. Update the date if it has changed
                if (currentDate !== targetDate) {
                    newPlans[activeIndex] = { ...newPlans[activeIndex], date: targetDate };
                }

                // 2. Handle Plan Reordering with precise splice logic to avoid off-by-one errors
                if (overType === 'PLAN') {
                    const overRect = over.rect;
                    const activeRect = active.rect.current.translated;

                    // Only perform precise calculation if rects are available
                    if (overRect && activeRect) {
                        const overCenterY = overRect.top + overRect.height / 2;
                        const activeCenterY = activeRect.top + activeRect.height / 2;

                        // If active is below over (visually), we insert after
                        const isBelow = activeCenterY > overCenterY;

                        // Remove from old position
                        const [movedItem] = newPlans.splice(activeIndex, 1);

                        // Find index of target in the reduced array
                        const adjustedOverIndex = newPlans.findIndex(p => p.id === overId);

                        // Calculate insertion index
                        // If we are below the target center, we put it AFTER (index + 1)
                        // If we are above the target center, we put it BEFORE (index)
                        const insertIndex = isBelow ? adjustedOverIndex + 1 : adjustedOverIndex;

                        if (insertIndex >= 0 && insertIndex <= newPlans.length) {
                            newPlans.splice(insertIndex, 0, movedItem);
                            return newPlans;
                        }
                    }
                }

                // Fallback / Standard arrayMove for same-list if rects missing or Day collision
                const overIndex = prevPlans.findIndex(p => p.id === overId);
                if (overType === 'PLAN' && overIndex !== -1) {
                     return arrayMove(newPlans, activeIndex, overIndex);
                }

                // If overType is 'DAY' (Bottom append logic usually), we just let the date update handle it (implicitly appends due to sort order usually, or we can force push)
                if (overType === 'DAY') {
                     // If we are dragging into a Day container, we usually want it at the end if it's not handled by Plan collision
                     // But we already updated the date.
                     // To be safe, we can move it to the end of that day's items in the array?
                     // Actually, if we just updated date, its position in array remains `activeIndex` (unless we sort).
                     // But `localPlans` is used for rendering.
                     // Let's just remove and push to end of list (or just leave it and let SortableContext handle next move).
                     // Better: Move to the end of the plans *for that day*.

                     // However, finding the index after the last plan of targetDate:
                     const lastPlanIndex = newPlans.findLastIndex(p => p.date === targetDate);
                     if (lastPlanIndex !== -1 && lastPlanIndex !== activeIndex) {
                         const [movedItem] = newPlans.splice(activeIndex, 1);
                         // Find new index of last plan
                         const adjustedLastIndex = newPlans.findLastIndex(p => p.date === targetDate);
                         newPlans.splice(adjustedLastIndex + 1, 0, movedItem);
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
