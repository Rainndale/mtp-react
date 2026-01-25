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

    // If we are over a Day, analyze geometry using Smart Anchors
    if (dayCollisions.length > 0) {
        const closestDay = dayCollisions[0]; // Usually just one
        const dayId = closestDay.data.droppableContainer.id;

        if (pointerCoordinates) {
            const ZONE_BUFFER = 150; // Large buffer for fast drags/hysteresis

            // --- HEADER LOGIC ---
            // Find the explicit header droppable for this day
            const headerDroppable = droppableContainers.find(c => c.id === `header-${dayId}`);
            if (headerDroppable && headerDroppable.rect.current) {
                const hRect = headerDroppable.rect.current;
                // Check if pointer is ON the header OR in the buffer zone BELOW it
                // Zone: [Header Top - small buffer, Header Bottom + ZONE_BUFFER]
                if (
                    pointerCoordinates.y >= (hRect.top - 20) &&
                    pointerCoordinates.y <= (hRect.bottom + ZONE_BUFFER)
                ) {
                    return [{ ...closestDay, data: { droppableContainer: headerDroppable } }];
                }
            }

            // --- FOOTER LOGIC ---
            // Find the explicit footer droppable for this day
            const footerDroppable = droppableContainers.find(c => c.id === `footer-${dayId}`);
            if (footerDroppable && footerDroppable.rect.current) {
                const fRect = footerDroppable.rect.current;
                // Check if pointer is ON the footer OR in the buffer zone ABOVE it
                // Zone: [Footer Top - ZONE_BUFFER, Footer Bottom + small buffer]
                if (
                    pointerCoordinates.y >= (fRect.top - ZONE_BUFFER) &&
                    pointerCoordinates.y <= (fRect.bottom + 20)
                ) {
                    return [{ ...closestDay, data: { droppableContainer: footerDroppable } }];
                }
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
