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

    // 1. Identify valid candidates (Day Containers) for Geometric Analysis
    // We prioritize finding WHICH DAY the pointer is over, then check WHERE in that day it is.
    const dayCollisions = pointerWithin({
        ...args,
        droppableContainers: droppableContainers.filter(c => c.data.current?.type === 'DAY')
    });

    // If we are over a Day, analyze geometry
    if (dayCollisions.length > 0) {
        const closestDay = dayCollisions[0]; // Usually just one
        const containerRect = closestDay.data.droppableContainer.rect.current;
        const dayId = closestDay.data.droppableContainer.id;

        if (containerRect && pointerCoordinates) {
            // STICKY HEADER OFFSET ADJUSTMENT
            // The DayGroup header is sticky at approx 56px (md) or 48px (mobile) from top.
            // If the container Top is ABOVE this threshold (scrolled up), the visual header is STUCK at that threshold.
            // We must detect the collision relative to this VISUAL location, not the physical container top.

            // Assume header sticks at roughly 56px from viewport top.
            const STICKY_OFFSET = 56;

            // The visual start of the header zone is either the physical top OR the sticky position (max of the two)
            const visualTop = Math.max(containerRect.top, STICKY_OFFSET);

            // Calculate Y relative to the VISUAL header top
            const relativeY = pointerCoordinates.y - visualTop;

            // ZONE DEFINITIONS
            const HEADER_ZONE_HEIGHT = 150;
            const FOOTER_ZONE_HEIGHT = 150;
            const containerHeight = containerRect.height;
            const containerBottom = containerRect.top + containerHeight;

            // Check Top Zone (Header)
            // We allow a small negative buffer (-20) just in case the pointer is slightly above the sticky header
            if (relativeY >= -20 && relativeY < HEADER_ZONE_HEIGHT) {
                // Find the explicit header droppable for this day to return it as a collision
                const headerDroppable = droppableContainers.find(c => c.id === `header-${dayId}`);
                if (headerDroppable) return [{ ...closestDay, data: { droppableContainer: headerDroppable } }];
            }

            // Check Bottom Zone (Footer)
            // Footer is not sticky, so we measure from physical bottom
            const distFromBottom = containerBottom - pointerCoordinates.y;

            if (distFromBottom >= 0 && distFromBottom < FOOTER_ZONE_HEIGHT) {
                // Find the explicit footer droppable
                const footerDroppable = droppableContainers.find(c => c.id === `footer-${dayId}`);
                if (footerDroppable) return [{ ...closestDay, data: { droppableContainer: footerDroppable } }];
            }
        }
    }

    // If not in a specialized zone, proceed to standard collision detection

    // First, try pointerWithin
    const collisions = pointerWithin(args);

    // If we have no collisions, return empty
    if (collisions.length === 0) return collisions;

    // PRIORITY 1: Explicit Header or Footer Targets (Fallback for tight hover)
    const overHeaderOrFooter = collisions.find(c => {
        const type = c.data.droppableContainer.data.current?.type;
        return type === 'DAY_HEADER' || type === 'DAY_FOOTER';
    });

    if (overHeaderOrFooter) {
        return [overHeaderOrFooter];
    }

    // PRIORITY 2: Plans
    const overPlan = collisions.find(c => c.data.droppableContainer.data.current?.type === 'PLAN');
    if (overPlan) {
        return [overPlan];
    }

    // PRIORITY 3: Day Container (Background/Gaps)
    const overDay = collisions.find(c => c.data.droppableContainer.data.current?.type === 'DAY');

    if (overDay) {
        const dayId = overDay.data.droppableContainer.id;
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
