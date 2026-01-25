import { closestCorners, pointerWithin } from '@dnd-kit/core';

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
        return pointerWithin({
            ...args,
            droppableContainers: dayContainers,
        });
    }

    // Default behavior for Plans: Use closestCorners
    // This allows for better targeting of plans across days and lists
    return closestCorners(args);
};
