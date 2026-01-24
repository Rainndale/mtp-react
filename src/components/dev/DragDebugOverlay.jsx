import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

// Global mutable state for performance (avoiding react context overhead for high-freq drag events)
export const dragDebugState = {
    logs: [],
    activeId: null,
    overId: null,
    activeType: null,
    overType: null,
    targetDate: null,
    action: null,
    timestamp: 0
};

// Helper to push log
export const logDragEvent = (msg, data = {}) => {
    const entry = {
        time: new Date().toISOString().split('T')[1].replace('Z', ''),
        msg,
        ...data
    };
    dragDebugState.logs.unshift(entry);
    if (dragDebugState.logs.length > 50) dragDebugState.logs.pop();
};

const DragDebugOverlay = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [tick, setTick] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            if (isOpen) setTick(t => t + 1);
        }, 100);
        return () => clearInterval(interval);
    }, [isOpen]);

    const handleCopy = () => {
        const text = JSON.stringify(dragDebugState.logs, null, 2);
        navigator.clipboard.writeText(text).then(() => {
            alert('Logs copied to clipboard!');
        }).catch(err => {
            console.error('Failed to copy', err);
            // Fallback
            console.log(text);
            alert('Could not copy to clipboard. Logs printed to console.');
        });
    };

    return createPortal(
        <div className="fixed bottom-4 right-4 z-[9999] font-mono text-xs">
            {/* Toggle Dot */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-12 h-12 rounded-full bg-red-600 hover:bg-red-700 text-white shadow-lg flex items-center justify-center transition-transform hover:scale-110"
                title="Debug Drag & Drop"
            >
                {isOpen ? 'X' : 'BUG'}
            </button>

            {/* Panel */}
            {isOpen && (
                <div className="absolute bottom-14 right-0 w-80 bg-slate-900/90 text-green-400 p-4 rounded-lg shadow-xl backdrop-blur-sm border border-slate-700 max-h-[60vh] overflow-y-auto">
                    <div className="flex justify-between items-center mb-2 border-b border-slate-700 pb-2">
                        <h4 className="font-bold text-white">DnD Debugger</h4>
                        <button onClick={handleCopy} className="bg-blue-600 text-white px-2 py-1 rounded text-[10px] uppercase tracking-wider hover:bg-blue-500">
                            Copy Logs
                        </button>
                    </div>

                    <div className="space-y-1 mb-4">
                        <div className="grid grid-cols-[80px_1fr]">
                            <span className="text-slate-400">Active:</span>
                            <span className="text-yellow-300 truncate">{dragDebugState.activeId || '-'}</span>
                        </div>
                        <div className="grid grid-cols-[80px_1fr]">
                            <span className="text-slate-400">Over:</span>
                            <span className="text-yellow-300 truncate">{dragDebugState.overId || '-'}</span>
                        </div>
                        <div className="grid grid-cols-[80px_1fr]">
                            <span className="text-slate-400">Type:</span>
                            <span>{dragDebugState.overType || '-'}</span>
                        </div>
                        <div className="grid grid-cols-[80px_1fr]">
                            <span className="text-slate-400">Action:</span>
                            <span className="text-pink-400 font-bold">{dragDebugState.action || '-'}</span>
                        </div>
                    </div>

                    <div className="space-y-1 border-t border-slate-700 pt-2">
                        {dragDebugState.logs.map((log, i) => (
                            <div key={i} className="text-[10px] opacity-80 hover:opacity-100 border-l-2 border-slate-600 pl-2">
                                <span className="text-slate-500 mr-2">[{log.time}]</span>
                                <span className="text-white">{log.msg}</span>
                                {log.detail && <div className="text-slate-400 pl-4">{log.detail}</div>}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>,
        document.body
    );
};

export default DragDebugOverlay;
