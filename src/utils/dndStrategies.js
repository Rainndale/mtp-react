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

    // First, try standard pointerWithin to see what we are explicitly hovering
    const collisions = pointerWithin(args);

    // If we have no collisions, return empty
    if (collisions.length === 0) return collisions;

    // PRIORITY 1: Explicit PLAN Collisions
    // If the user is strictly hovering a Plan, we MUST respect that to allow precise reordering/swapping.
    // This fixes the "Skipping Plans" issue where a large geometric zone would override the plans inside it.
    const overPlan = collisions.find(c => c.data.droppableContainer.data.current?.type === 'PLAN');
    if (overPlan) {
        return [overPlan];
    }

    // PRIORITY 2: Explicit Header/Footer Collisions
    // If the user hits the actual Header/Footer elements (if visible/detectable)
    const overHeaderOrFooter = collisions.find(c => {
        const type = c.data.droppableContainer.data.current?.type;
        return type === 'DAY_HEADER' || type === 'DAY_FOOTER';
    });

    if (overHeaderOrFooter) {
        return [overHeaderOrFooter];
    }

    // PRIORITY 3: Day Container (Geometric Fallback)
    // If we hit the Day Container (background/gap) but missed specific items,
    // we use Geometry to catch "Fast Drags" or edge cases.
    const overDay = collisions.find(c => c.data.droppableContainer.data.current?.type === 'DAY');

    if (overDay) {
        const dayId = overDay.data.droppableContainer.id;
        const containerRect = overDay.data.droppableContainer.rect.current;

        // GEOMETRIC SAFETY NET
        if (containerRect && pointerCoordinates) {
            // We use the "Smart Anchor" concept here but only as a fallback.
            // Since we disabled sticky headers during drag, containerRect.top is physical and stable.

            const relativeY = pointerCoordinates.y - containerRect.top;
            const ZONE_BUFFER = 150; // Large buffer to catch fast drags
            const containerHeight = containerRect.height;

            // Check Top Zone (Header Fallback)
            if (relativeY >= -50 && relativeY < ZONE_BUFFER) {
                const headerDroppable = droppableContainers.find(c => c.id === `header-${dayId}`);
                if (headerDroppable) return [{ ...overDay, data: { droppableContainer: headerDroppable } }];
            }

            // Check Bottom Zone (Footer Fallback)
            if (relativeY > (containerHeight - ZONE_BUFFER) && relativeY <= (containerHeight + 50)) {
                const footerDroppable = droppableContainers.find(c => c.id === `footer-${dayId}`);
                if (footerDroppable) return [{ ...overDay, data: { droppableContainer: footerDroppable } }];
            }
        }

        // If geometry didn't match (middle of day), try to find closest plan
        const plansInDay = droppableContainers.filter(c =>
            c.data.current?.type === 'PLAN' &&
            c.data.current?.plan?.date === dayId
        );

        if (plansInDay.length > 0) {
            const closestPlan = closestCenter({
                ...args,
                droppableContainers: plansInDay
            });

            if (closestPlan.length > 0) {
                return closestPlan;
            }
        }

        return [overDay];
    }

    return collisions;
};
