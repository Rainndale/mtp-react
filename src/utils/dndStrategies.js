import { closestCorners, pointerWithin, rectIntersection } from '@dnd-kit/core';

export const customCollisionDetection = (args) => {
    const { active, droppableContainers, pointerCoordinates } = args;

    if (!active || !pointerCoordinates) return closestCorners(args);

    const activeType = active.data.current?.type;

    if (activeType === 'PLAN') {
        const dayContainers = droppableContainers.filter(
            (container) => container.data.current?.type === 'DAY'
        );

        const collidingDay = pointerWithin({
            ...args,
            droppableContainers: dayContainers
        });

        if (collidingDay && collidingDay.length > 0) {
            const dayContainerId = collidingDay[0].id;
            const dayContainer = droppableContainers.find(c => c.id === dayContainerId);

            if (dayContainer) {
                const targetDate = dayContainer.data.current?.date;

                // Robust filtering: Match plans by their 'date' property
                // This ensures we only consider plans that belong to the target day
                const plansInDay = droppableContainers.filter(c => {
                    return c.data.current?.type === 'PLAN' &&
                           c.data.current?.plan?.date === targetDate;
                }).sort((a, b) => a.rect.current.top - b.rect.current.top);

                if (plansInDay.length === 0) {
                    return [{ id: dayContainerId }];
                }

                const firstPlan = plansInDay[0];
                const lastPlan = plansInDay[plansInDay.length - 1];

                // Top Padding Check (Project to First Item)
                // If pointer is above the top of the first item
                if (pointerCoordinates.y < firstPlan.rect.current.top) {
                     return [{ id: firstPlan.id }];
                }

                // Bottom Padding Check (Project to Container -> Append)
                // If pointer is below the bottom of the last item
                if (pointerCoordinates.y > lastPlan.rect.current.bottom) {
                    return [{ id: dayContainerId }];
                }

                // Middle Zone: Use closestCorners restricted to these plans
                return closestCorners({
                    ...args,
                    droppableContainers: plansInDay
                });
            }
        }
    }

    return closestCorners(args);
};
