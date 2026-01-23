import { closestCorners, pointerWithin, rectIntersection, closestCenter } from '@dnd-kit/core';

export const customCollisionDetection = (args) => {
    const { active, droppableContainers, pointerCoordinates } = args;

    // Check if the active item is a 'DAY'
    // We safely access data.current just in case
    const activeType = active.data.current?.type;

    if (activeType === 'DAY') {
        // Filter candidates: Only allow 'DAY' containers to be drop targets
        const dayContainers = droppableContainers.filter(
            (container) => container.data.current?.type === 'DAY'
        );

        // Use pointerWithin on the filtered list
        // This ensures dragging a Day only detects collisions when the pointer is
        // explicitly INSIDE another Day container, providing more precise target detection.
        return pointerWithin({
            ...args,
            droppableContainers: dayContainers,
        });
    }

    // Default behavior for Plans (or anything else)
    // Plans can interact with both Days (to move to that day) and other Plans (to reorder)

    // First, try pointerWithin to see if we are directly over a Plan or Day
    const collisions = pointerWithin(args);

    // If we have no collisions, return empty
    if (collisions.length === 0) return collisions;

    // Check if we strictly hit a Plan (highest priority)
    const overPlan = collisions.find(c => c.data.droppableContainer.data.current?.type === 'PLAN');
    if (overPlan) {
        return [overPlan];
    }

    // If we didn't hit a Plan, check if we hit a Day (container)
    const overDay = collisions.find(c => c.data.droppableContainer.data.current?.type === 'DAY');

    if (overDay) {
        // We are inside a Day container, but not directly over a Plan (likely in a gap).
        // To prevent flickering and ensure we "make space" properly, we should find the
        // closest Plan within this Day to the pointer.

        const dayId = overDay.data.droppableContainer.id;

        // Filter all droppables to find Plans belonging to this Day
        const plansInDay = droppableContainers.filter(c =>
            c.data.current?.type === 'PLAN' &&
            c.data.current?.plan?.date === dayId
        );

        // If there are plans in this day, find the closest one
        if (plansInDay.length > 0) {
            const closestPlan = closestCenter({
                ...args,
                droppableContainers: plansInDay
            });

            if (closestPlan.length > 0) {
                // Return the closest plan as the collision target
                return closestPlan;
            }
        }

        // If no plans in the day (empty day), or calculation failed, fall back to the Day container
        return [overDay];
    }

    // Fallback (unlikely to reach here if collisions found, but safe)
    return collisions;
};
