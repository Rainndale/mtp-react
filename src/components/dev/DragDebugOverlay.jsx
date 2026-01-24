import React, { useState, useEffect } from 'react';

// Global debug state (simple implementation for temp debugging)
export const dragDebugState = {
    activeId: null,
    overId: null,
    activeType: null,
    overType: null,
    activeRect: null,
    overRect: null,
    decision: null,
    timestamp: null
};

const DragDebugOverlay = () => {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        const log = JSON.stringify(dragDebugState, null, 2);
        navigator.clipboard.writeText(log).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    return (
        <div
            onClick={handleCopy}
            title="Click to copy drag debug info"
            className={`
                fixed bottom-4 right-4 w-4 h-4 rounded-full cursor-pointer z-[9999] shadow-lg transition-all
                ${copied ? 'bg-blue-500 scale-125' : 'bg-green-500 hover:scale-110'}
            `}
        >
            {copied && (
                <div className="absolute bottom-6 right-0 bg-black text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                    Log Copied!
                </div>
            )}
        </div>
    );
};

export default DragDebugOverlay;
