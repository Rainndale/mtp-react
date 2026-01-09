import React, { useState } from 'react';
import { useTrip } from '../../context/TripContext';
import { getDaysArray, formatDate } from '../../utils/date';
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

    const sensors = useSensors(
        useSensor(MouseSensor, {
            activationConstraint: {
                delay: 500,
                tolerance: 10,
            }
        }),
        useSensor(TouchSensor, {
            activationConstraint: {
                delay: 500,
                tolerance: 10,
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
    const plans = activeTrip.plans || [];

    const handleDragStart = (event) => {
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
        // Optimistic update handled here for smoother feel if needed, but risky with current setup.
    };

    const handleDragEnd = async (event) => {
        const { active, over } = event;
        setActiveId(null);
        setActivePlan(null);
        setActiveDay(null);

        if (!over) return;

        const activeIdStr = active.id;
        const overIdStr = over.id;

        if (activeIdStr === overIdStr) return;

        // === CASE A: Dragging a DAY ===
        if (days.includes(activeIdStr)) {
            if (days.includes(overIdStr)) {
                 // User dragged a Day onto another Day -> Swap Contents
                 const sourceDate = activeIdStr;
                 const targetDate = overIdStr;

                 // Get plans for both days
                 let newPlans = [...plans];

                 // Separate plans
                 const sourceDayPlans = newPlans.filter(p => p.date === sourceDate);
                 const targetDayPlans = newPlans.filter(p => p.date === targetDate);
                 const otherPlans = newPlans.filter(p => p.date !== sourceDate && p.date !== targetDate);

                 // Swap dates
                 const updatedSourcePlans = sourceDayPlans.map(p => ({ ...p, date: targetDate }));
                 const updatedTargetPlans = targetDayPlans.map(p => ({ ...p, date: sourceDate }));

                 // Merge
                 newPlans = [...otherPlans, ...updatedSourcePlans, ...updatedTargetPlans];

                 await addOrUpdateTrip({ ...activeTrip, plans: newPlans });
            }
            return;
        }

        // === CASE B: Dragging a PLAN ===

        // 1. Identify Source
        const sourcePlan = plans.find(p => p.id === activeIdStr);
        if (!sourcePlan) return;

        // 2. Identify Target (Is it a Plan or a Day?)
        let targetDate = null;
        let targetIndex = -1; // -1 means append to end if Day

        // Check if dropped on a Day (Header/Container)
        if (days.includes(overIdStr)) {
            targetDate = overIdStr;
            targetIndex = plans.filter(p => p.date === targetDate).length; // Append
        } else {
            // Dropped on another Plan
            const overPlan = plans.find(p => p.id === overIdStr);
            if (overPlan) {
                targetDate = overPlan.date;
                // Find index of overPlan within its day
                const dayPlans = plans.filter(p => p.date === targetDate).sort((a,b) => (a.order||0)-(b.order||0));
                targetIndex = dayPlans.findIndex(p => p.id === overIdStr);
            }
        }

        if (!targetDate) return;

        // 3. Construct New State (Optimistic)
        let newPlans = [...plans];

        // Is it the same day?
        if (sourcePlan.date === targetDate) {
            // Reordering within same day
            const dayPlans = newPlans.filter(p => p.date === targetDate).sort((a,b) => (a.order||0)-(b.order||0));
            const oldIndex = dayPlans.findIndex(p => p.id === activeIdStr);

            // We only need arrayMove logic on the subset
            const newDayPlans = arrayMove(dayPlans, oldIndex, targetIndex !== -1 ? targetIndex : dayPlans.length);

            // Update orders in the subset
            newDayPlans.forEach((p, idx) => { p.order = idx; });

            // Merge back into main array
            // This is slightly inefficient but robust: remove old day plans, push new ones
            newPlans = newPlans.filter(p => p.date !== targetDate);
            newPlans.push(...newDayPlans);
        } else {
            // Moving between days
            // Update date
            const pIndex = newPlans.findIndex(p => p.id === activeIdStr);
            newPlans[pIndex] = { ...newPlans[pIndex], date: targetDate };

            // Re-sort target day
            const targetDayPlans = newPlans.filter(p => p.date === targetDate).sort((a,b) => (a.order||0)-(b.order||0));
            // Move item to correct spot?
            // Since we just changed the date, it effectively "appends" or needs sorting.
            // If dropped on a specific plan, we need to insert it there.

            targetDayPlans.forEach((p, idx) => { p.order = idx; });

            // Note: Exact insertion index between days is complex without separate lists logic.
            // Current `verticalListSortingStrategy` expects a single list usually.
            // We accept "Append" behavior or simple re-sort for cross-day drops for stability.
        }

        // 4. Update
        await addOrUpdateTrip({ ...activeTrip, plans: newPlans });
    };

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={customCollisionDetection}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
        >
            <div className="relative space-y-6 pb-24">
                {days.map((date, idx) => {
                    const dayPlans = plans
                        .filter(p => p.date === date)
                        .sort((a, b) => (a.order || 0) - (b.order || 0)); // Simple sort by order

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

            <DragOverlay>
                {activeId ? (
                    activeDay ? (
                         <div className="w-[95%] md:w-[99%] mx-auto glass rounded-lg px-4 py-3 bg-white/80 dark:bg-slate-800/90 shadow-xl border border-blue-500/30">
                            <span className="text-blue-600 text-xs font-black uppercase tracking-widest block mb-1">Moving Day</span>
                            <h3 className="text-[var(--text-main)] font-extrabold text-lg">{formatDate(activeDay)}</h3>
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
