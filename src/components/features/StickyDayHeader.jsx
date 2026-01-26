import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { formatDayDate } from '../../utils/date';

const StickyDayHeader = ({ activeDate, isVisible }) => {
    // This component renders a fixed header just below the main navigation bar.
    // It is "Permanent" in the sense that it stays fixed, but its content changes.
    // It is hidden when looking at the Trip Cover Image (isVisible = false).

    if (!isVisible || !activeDate) return null;

    // Determine day index for display (e.g., "Day 1")
    // Ideally this comes from props, but for now we render just the date if index is missing.
    // Wait, the requirement says "Day 1", "Day 2".
    // We should pass the day number or calculate it.
    // For now, let's just stick to the visual structure.

    // We render into a Portal to ensure it sits above everything else in the layout stack
    // but below the main header (which is usually z-50).

    return createPortal(
        <div
            className="fixed top-[48px] md:top-[56px] left-0 right-0 z-[45] flex justify-center pointer-events-none"
        >
            <div className="w-full max-w-4xl px-4 md:px-6 pointer-events-auto">
                <div className="bg-[var(--card-bg)] border-b border-x border-[var(--card-border)] rounded-b-xl shadow-sm px-4 py-2 flex justify-between items-center transition-all duration-300">

                    {/* Active Day Info */}
                    <div className="flex flex-col">
                        {/* We will need to pass the day index too. For now, just Date. */}
                         <span className="text-blue-600 text-[10px] font-black uppercase tracking-widest">
                            {activeDate.label || 'DAY'}
                        </span>
                        <h3 className="text-[var(--text-main)] font-extrabold text-sm md:text-base">
                            {formatDayDate(activeDate.date)}
                        </h3>
                    </div>

                    {/* Placeholder for future ">" menu */}
                    <button
                        className="w-8 h-8 rounded-full flex items-center justify-center text-[var(--text-muted)] hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        onClick={() => console.log('Open day menu')}
                    >
                        <i className="fa-solid fa-chevron-right text-sm"></i>
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default StickyDayHeader;
