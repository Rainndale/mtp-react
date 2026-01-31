import React from 'react';
import { clsx } from 'clsx';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const PlanItem = ({ plan, onClick, isOverlay = false }) => {
    // DnD Hooks - conditional if we are not the overlay
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({
        id: plan.id,
        data: { type: 'PLAN', plan }
    });

    const style = {
        transform: CSS.Translate.toString(transform),
        transition,
        opacity: isDragging ? 0.3 : 1, // Visual cue for original item when dragging
    };

    const statusColors = {
        'Confirmed': 'bg-[#22c55e]',
        'Tentative': 'bg-[#f59e0b]',
        'Cancelled': 'bg-[#ef4444]',
    };

    const handleMapClick = (e) => {
        e.stopPropagation();
        if (plan.mapLink) {
            window.open(plan.mapLink, '_blank');
        }
    };

    const handleTransitClick = (e) => {
        e.stopPropagation();
        // Placeholder for transit directions - simply searches location on google maps with dir for now if mapLink not specific
        const query = plan.location ? encodeURIComponent(plan.location) : '';
        if (query) {
             window.open(`https://www.google.com/maps/dir/?api=1&destination=${query}`, '_blank');
        }
    };

    const content = (
        <div className="flex flex-col w-full h-full relative">
            {/* Status Strip */}
            <div className={`absolute left-0 top-0 bottom-0 w-1.5 z-[2] ${statusColors[plan.status] || statusColors['Tentative']}`} />

            <div className="flex-grow pl-4 pr-3 pt-3 pb-2 z-10 w-full min-w-0 flex flex-col">
                {/* Header: Time and Cost */}
                <div className="flex justify-between items-start mb-2">
                    <div className="bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 px-2.5 py-0.5 rounded-full text-xs font-bold flex items-center gap-1">
                        <i className="fa-regular fa-clock text-[10px]"></i>
                        <span>{plan.time || '--:--'}</span>
                    </div>
                    {plan.cost && (
                        <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                            {plan.cost}
                        </span>
                    )}
                </div>

                {/* Title */}
                <h5 className="text-[var(--text-main)] font-bold text-base mb-1 truncate leading-tight">
                    {plan.title || 'Untitled Plan'}
                </h5>

                {/* Location (replaces Description) */}
                <div className="text-sm text-[var(--text-muted)] font-medium truncate mb-3 min-h-[20px]">
                    {plan.location || 'No location specified'}
                </div>

                {/* Footer Buttons */}
                <div className="mt-auto border-t border-slate-100 dark:border-slate-800 pt-2 flex items-center">
                    <button
                        onClick={handleMapClick}
                        className="flex-1 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 py-1.5 rounded transition-colors flex items-center justify-center gap-1.5"
                    >
                        <i className="fa-solid fa-map-location-dot"></i>
                        Map
                    </button>
                    <div className="w-px h-4 bg-slate-200 dark:bg-slate-700 mx-1"></div>
                    <button
                         onClick={handleTransitClick}
                         className="flex-1 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 py-1.5 rounded transition-colors flex items-center justify-center gap-1.5"
                    >
                        <i className="fa-solid fa-diamond-turn-right"></i>
                        Transit
                    </button>
                </div>
            </div>
        </div>
    );

    const cardClasses = "relative rounded-2xl bg-[var(--card-bg)] border border-[var(--card-border)] overflow-hidden transition-shadow group w-[90.25%] md:w-[94.05%] mx-auto";

    if (isOverlay) {
         return (
            <div className={`${cardClasses} shadow-2xl scale-105`}>
                 {content}
            </div>
         );
    }

    return (
        <div
            id={plan.id}
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            onClick={onClick}
            onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); }}
            className={clsx(
                cardClasses,
                "hover:shadow-lg cursor-pointer mb-3"
            )}
        >
           {content}
        </div>
    );
};

export default PlanItem;
