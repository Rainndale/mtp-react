import React from 'react';
import { useApp } from '../../context/AppContext';

const PlanItem = ({ plan, onDragStart, onClick }) => {
    return (
        <div
            draggable="true"
            data-id={plan.id}
            data-order={plan.order}
            onDragStart={(e) => onDragStart(e, plan.id)}
            onClick={() => onClick(plan.id)}
            className="plan-item h-20 rounded-lg p-2 flex items-center cursor-pointer transition-all group w-[90.25%] md:w-[94.05%] mx-auto hover:shadow-md"
        >
            <div className={`status-fin fin-${plan.status || 'Tentative'}`}></div>
            <div className="flex-grow pl-2 z-10 overflow-hidden w-full min-w-0">
                <h5 className="text-current font-bold transition-colors text-base mb-1 truncate">{plan.title}</h5>
                <div className="flex items-center text-sm text-muted font-medium w-full overflow-hidden min-w-0">
                    <span className="whitespace-nowrap flex-shrink-0 mr-1">{plan.time || '--:--'} &middot;</span>
                    <div className="marquee-container">
                        <div className="marquee-content location-text">{plan.location || 'No location specified'}</div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PlanItem;
