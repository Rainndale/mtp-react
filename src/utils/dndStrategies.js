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
        return pointerWithin({
            ...args,
            droppableContainers: dayContainers,
        });
    }

    // Default behavior for Plans (or anything else)

    // First, try pointerWithin to see if we are directly over a Target
    const collisions = pointerWithin(args);

    // If we have no collisions, return empty
    if (collisions.length === 0) return collisions;

    // PRIORITY 1: Explicit Header or Footer Targets
    // If the user is hovering over the explicit "Top" or "Bottom" zones, they MUST win.
    const overHeaderOrFooter = collisions.find(c => {
        const type = c.data.droppableContainer.data.current?.type;
        return type === 'DAY_HEADER' || type === 'DAY_FOOTER';
    });

    if (overHeaderOrFooter) {
        return [overHeaderOrFooter];
    }

    // PRIORITY 2: Plans
    // If we didn't hit a header/footer, check if we hit a Plan.
    const overPlan = collisions.find(c => c.data.droppableContainer.data.current?.type === 'PLAN');
    if (overPlan) {
        return [overPlan];
    }

    // PRIORITY 3: Day Container (Background/Gaps)
    const overDay = collisions.find(c => c.data.droppableContainer.data.current?.type === 'DAY');

    if (overDay) {
        // We are inside a Day container, but not directly over a Plan, Header, or Footer.
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
