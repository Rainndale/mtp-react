import React, { useRef, useEffect, useState } from 'react';
import { clsx } from 'clsx';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const PlanItem = ({ plan, onClick, isOverlay = false }) => {
    const marqueeRef = useRef(null);
    const containerRef = useRef(null);
    const [isMarquee, setIsMarquee] = useState(false);

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

    // Marquee check
    useEffect(() => {
        const checkMarquee = () => {
            if (marqueeRef.current && containerRef.current) {
                setIsMarquee(marqueeRef.current.scrollWidth > containerRef.current.clientWidth);
            }
        };
        checkMarquee();
        window.addEventListener('resize', checkMarquee);
        return () => window.removeEventListener('resize', checkMarquee);
    }, [plan.location]);

    const statusColors = {
        'Confirmed': 'bg-[#10b981]',
        'Tentative': 'bg-[#f59e0b]',
        'Cancelled': 'bg-[#ef4444]',
    };

    const content = (
        <>
            <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-lg z-[2] ${statusColors[plan.status] || statusColors['Tentative']}`} />

            <div className="flex-grow pl-2 z-10 overflow-hidden w-full min-w-0">
                <h5 className="text-[var(--text-main)] font-bold transition-colors text-sm md:text-base mb-1 truncate">
                    {plan.title || 'Untitled Plan'}
                </h5>

                <div className="flex items-center text-xs md:text-sm text-[var(--text-muted)] font-medium w-full overflow-hidden min-w-0">
                    <span className="whitespace-nowrap flex-shrink-0 mr-1">{plan.time || '--:--'} &middot;</span>

                    <div ref={containerRef} className={`relative overflow-hidden flex-grow flex min-w-0 ${isMarquee ? 'marquee-container marquee-active' : ''}`}>
                         <div ref={marqueeRef} className="marquee-content whitespace-nowrap">
                             {plan.location || 'No location specified'}
                         </div>
                         {/* Duplicate for seamless loop if active */}
                         {isMarquee && (
                             <div className="marquee-content whitespace-nowrap pl-8" aria-hidden="true">
                                 {plan.location || 'No location specified'}
                             </div>
                         )}
                    </div>
                </div>
            </div>
        </>
    );

    if (isOverlay) {
         // Static render for Drag Overlay (no listeners/refs)
         return (
            <div className="h-16 md:h-20 rounded-lg p-2 flex items-center bg-[var(--card-bg)] border border-[var(--card-border)] w-full shadow-2xl scale-105 transition-transform overflow-hidden relative">
                 {content}
            </div>
         );
    }

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            onClick={onClick}
            className={clsx(
                "relative h-16 md:h-20 rounded-lg p-2 flex items-center cursor-pointer transition-all group w-[90.25%] md:w-[94.05%] mx-auto hover:shadow-md bg-[var(--card-bg)] border border-[var(--card-border)] overflow-visible",
                // pseudo-element logic for hit area handled by structure in React usually differently,
                // but preserving the look
            )}
        >
           {content}
        </div>
    );
};

export default PlanItem;
