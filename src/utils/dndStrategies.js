import { closestCorners, pointerWithin, rectIntersection } from '@dnd-kit/core';

export const customCollisionDetection = (args) => {
    const { active, droppableContainers } = args;

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
    // FIX: Changed from closestCorners to pointerWithin to prevent jumping to distant containers (like first day)
    return pointerWithin(args);
};
