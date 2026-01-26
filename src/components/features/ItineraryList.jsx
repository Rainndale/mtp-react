import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useTrip } from '../../context/TripContext';
import { getDaysArray, formatDayDate } from '../../utils/date';
import DayGroup from './DayGroup';
import StickyDayHeader from './StickyDayHeader';
import { DndContext, DragOverlay, useSensor, useSensors, MouseSensor, TouchSensor } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import PlanItem from './PlanItem';
import { customCollisionDetection } from '../../utils/dndStrategies';

const ItineraryList = ({ onOpenPlanModal, onEditPlan }) => {
    const { activeTrip, addOrUpdateTrip } = useTrip();
    const [activeId, setActiveId] = useState(null);
    const [overId, setOverId] = useState(null);
    const [activePlan, setActivePlan] = useState(null);
    const [activeDay, setActiveDay] = useState(null); // For dragging days
    const [dragWidth, setDragWidth] = useState(null);

    // Scroll Spy State
    const [activeDateInfo, setActiveDateInfo] = useState(null);
    const [isStickyVisible, setIsStickyVisible] = useState(false);
    const observerRef = React.useRef(null);

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

    // --- Scroll Spy Logic ---
    React.useEffect(() => {
        // Disconnect existing observer
        if (observerRef.current) observerRef.current.disconnect();

        // 1. Observe the Trip Header (Image) to toggle visibility
        // We assume the header is an element with id="trip-header-hero" or similar.
        // If not, we can observe the FIRST day group and check its position.

        // Actually, a simpler way is to observe ALL DayGroups.
        // Logic: The first DayGroup that is INTERSECTING the viewport top area is the active one.

        const handleIntersect = (entries) => {
             // We want to find the day that is currently "stuck" to the top.
             // This corresponds to an element that has its top edge ABOVE the viewport threshold
             // but its bottom edge BELOW the threshold.

             // Or simpler: Find the first visible element.

             // Let's use a threshold near the top (e.g., 60px down).

             // Strategy:
             // 1. If any DayGroup is intersecting the top area (0px to 100px), set it as active.
             // 2. BUT we also need to know if we are ABOVE all days (at the cover image).

             // Better Strategy: Observe sentinel elements? No.
             // Let's observe the DayGroups with a negative rootMargin.
        };

        // Let's implement a scroll listener instead for simplicity and robustness with varying heights.
        // Observers are better for performance but "Current Sticky Header" logic is often easier with scroll calculation.

        const handleScroll = () => {
            const headerOffset = 60; // Approximate height of the fixed Trip Menu + Sticky Header
            const visibilityThreshold = headerOffset + 40; // Point where we decide a day is "active"

            // 1. Find which day is effectively "active" (covering the top area)
            let currentDay = days[0];

            for (const date of days) {
                const el = document.getElementById(date);
                if (el) {
                    const rect = el.getBoundingClientRect();
                    // If the top of this day has passed the threshold (is above or near it), it is the active candidate.
                    if (rect.top <= visibilityThreshold) {
                         currentDay = date;
                    } else {
                        break;
                    }
                }
            }

            // 2. Check if the Active Day's header is visible in the viewport.
            // We want to hide the Sticky Header if the Static Header is right there.
            const currentDayEl = document.getElementById(currentDay);
            let shouldShowSticky = false;

            if (currentDayEl) {
                // The header is the first child, or roughly the top ~50px of the container.
                // We can check the container's position directly.
                const rect = currentDayEl.getBoundingClientRect();

                // Logic:
                // If the Day's Top is visible (below the Trip Menu), we see the Static Header -> HIDE Sticky.
                // If the Day's Top is scrolled up (above the Trip Menu), we lost context -> SHOW Sticky.

                // rect.top > headerOffset: The header is starting below the menu (Visible)
                // rect.top <= headerOffset: The header has scrolled under the menu (Hidden)

                if (rect.top <= headerOffset) {
                    shouldShowSticky = true;
                } else {
                    shouldShowSticky = false;
                }

                // Special Case: The Cover Image.
                // If we are at the very top (currentDay is the first day), and rect.top is huge (cover image visible),
                // the logic `rect.top > headerOffset` correctly hides the sticky.
            }

            // 3. Update State
            setIsStickyVisible(shouldShowSticky);

            const dayIndex = days.indexOf(currentDay);
            setActiveDateInfo({
                date: currentDay,
                label: `DAY ${dayIndex + 1}`
            });
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        // Initial check
        handleScroll();

        return () => window.removeEventListener('scroll', handleScroll);
    }, [days]); // Re-run if days change

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
            <StickyDayHeader
                activeDate={activeDateInfo}
                isVisible={isStickyVisible && !activeId} // Hide when global dragging (optional, but cleaner)
            />

            <div className="relative space-y-6 pb-24">
                {days.map((date, idx) => {
                    const dayPlans = plans.filter(p => p.date === date);

                    // Determine if this day should show a drop indicator
                    let isOverThisDay = false;
                    if (overId) {
                         if (overId === date) {
                             isOverThisDay = true;
                         } else {
                             // If over a plan, check if that plan belongs to this day
                             // We check localPlans because they reflect the current visual state
                             const overPlan = plans.find(p => p.id === overId);
                             if (overPlan && overPlan.date === date) {
                                 isOverThisDay = true;
                             }
                         }
                    }

                    // Check if we are migrating from another day
                    // activePlan holds the original snapshot, so activePlan.date is the source date
                    // const isMigrationTarget = activePlan && activePlan.date !== date; // Disabled for Plans as per request
                    const isDaySwapTarget = activeDay && activeDay !== date;

                    // Only show drop indicator for Day reordering, not Plan migration
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
