import { closestCenter, pointerWithin } from '@dnd-kit/core';

export const customCollisionDetection = (args) => {
    const { active, droppableContainers, pointerCoordinates } = args;

    if (!pointerCoordinates) return [];

    // 1. Strict Pointer Within PLAN
    // If we are strictly over a plan, we want to target that plan.
    const pointerOverPlan = pointerWithin({
        ...args,
        droppableContainers: droppableContainers.filter(
            (c) => c.data.current?.type === 'PLAN'
        )
    });

    if (pointerOverPlan.length > 0) {
        return pointerOverPlan;
    }

    // 2. Strict Pointer Within DAY
    // If we are not over a plan, but over a Day (header or empty space), target the Day.
    const pointerOverDay = pointerWithin({
        ...args,
        droppableContainers: droppableContainers.filter(
            (c) => c.data.current?.type === 'DAY'
        )
    });

    if (pointerOverDay.length > 0) {
        return pointerOverDay;
    }

    // 3. Fallback: Closest Center for PLANS
    // If we are in "no man's land" (e.g. between items), find the closest plan to snap to.
    const closestPlan = closestCenter({
        ...args,
        droppableContainers: droppableContainers.filter(
            (c) => c.data.current?.type === 'PLAN'
        )
    });

    return closestPlan;
};
