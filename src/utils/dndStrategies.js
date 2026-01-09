import { closestCorners } from '@dnd-kit/core';

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

        // Use closestCorners on the filtered list
        // This ensures dragging a Day only detects collisions with other Day headers/containers
        // ignoring the Plans inside them.
        return closestCorners({
            ...args,
            droppableContainers: dayContainers,
        });
    }

    // Default behavior for Plans (or anything else)
    // Plans can interact with both Days (to move to that day) and other Plans (to reorder)
    return closestCorners(args);
};
