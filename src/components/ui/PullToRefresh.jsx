import React, { useState, useEffect, useRef } from 'react';

const PullToRefresh = ({ onRefresh, children }) => {
    // UI State for rendering
    const [pullChange, setPullChange] = useState(0);
    const [refreshing, setRefreshing] = useState(false);

    // Internal refs for event handling to avoid dependency churn and re-binding listeners
    const contentRef = useRef(null);
    const startPointRef = useRef(0);
    const pullChangeRef = useRef(0);
    const refreshingRef = useRef(false);

    // Update the ref when state changes so listeners have latest value
    useEffect(() => {
        refreshingRef.current = refreshing;
    }, [refreshing]);

    // thresholds
    const pullThreshold = 80;
    const maxPull = 160;

    useEffect(() => {
        const element = contentRef.current;
        if (!element) return;

        const handleTouchStart = (e) => {
            const scrollTop = window.scrollY;
            // Only activate if we are at the very top of the page
            if (scrollTop <= 5 && !refreshingRef.current) {
                startPointRef.current = e.touches[0].screenY;
            } else {
                startPointRef.current = 0;
            }
        };

        const handleTouchMove = (e) => {
            // Disable pull to refresh if body has touch-action: none (implies dragging)
            const bodyTouchAction = window.getComputedStyle(document.body).touchAction;
            if (!startPointRef.current || refreshingRef.current || bodyTouchAction === 'none') return;

            const scrollTop = window.scrollY;
            const currentY = e.touches[0].screenY;
            const pullDistance = currentY - startPointRef.current;

            // If we are at the top and pulling down
            if (scrollTop <= 5 && pullDistance > 0) {
                // Prevent default to stop any native scrolling/rubberbanding
                if (e.cancelable) e.preventDefault();

                // Apply resistance (logarithmic or simple division)
                const resistedPull = Math.min(pullDistance * 0.4, maxPull);

                pullChangeRef.current = resistedPull;
                setPullChange(resistedPull);
            }
        };

        const handleTouchEnd = async () => {
            if (!startPointRef.current || refreshingRef.current) return;

            if (pullChangeRef.current >= pullThreshold) {
                setRefreshing(true); // State update
                refreshingRef.current = true; // Immediate ref update for safety
                setPullChange(pullThreshold);
                pullChangeRef.current = pullThreshold;

                try {
                    await onRefresh();
                } finally {
                    // Slight delay to show completion
                    setTimeout(() => {
                        setRefreshing(false);
                        // refreshingRef handled by useEffect, but safe to do here too if needed
                        setPullChange(0);
                        pullChangeRef.current = 0;
                        startPointRef.current = 0;
                    }, 500);
                }
            } else {
                // Snap back
                setPullChange(0);
                pullChangeRef.current = 0;
                startPointRef.current = 0;
            }
        };

        // We use non-passive listeners to allow e.preventDefault()
        element.addEventListener('touchstart', handleTouchStart, { passive: true });
        element.addEventListener('touchmove', handleTouchMove, { passive: false });
        element.addEventListener('touchend', handleTouchEnd, { passive: true });

        return () => {
            element.removeEventListener('touchstart', handleTouchStart);
            element.removeEventListener('touchmove', handleTouchMove);
            element.removeEventListener('touchend', handleTouchEnd);
        };
    }, [onRefresh]); // Only re-bind if onRefresh changes (which should be stable)

    // Calculate rotation based on pull percentage (0 to 360 degrees)
    const rotation = Math.min(pullChange / pullThreshold * 360, 360);

    // Dynamic styles
    const refreshStyle = {
        top: pullChange > 0 ? `${70 + pullChange * 0.5}px` : '-100px',
        opacity: pullChange > 0 ? 1 : 0,
        transform: 'translateX(-50%)',
        transition: refreshing ? 'top 0.2s ease' : (pullChange === 0 ? 'top 0.3s ease, opacity 0.3s' : 'none')
    };

    const iconStyle = {
        transform: refreshing ? 'none' : `rotate(${rotation}deg)`,
        transition: refreshing ? 'none' : 'transform 0.1s linear'
    };

    const contentStyle = {
        transform: `translateY(${pullChange > 0 ? pullChange * 0.2 : 0}px)`, // Slight yield
        transition: pullChange === 0 ? 'transform 0.3s ease' : 'none'
    };

    return (
        <div ref={contentRef} className="relative min-h-[calc(100vh-80px)]">
            {/* Refresh Indicator */}
            <div
                className="fixed left-1/2 z-[100] w-10 h-10 bg-white dark:bg-slate-800 rounded-full shadow-xl flex items-center justify-center border border-slate-100 dark:border-slate-700"
                style={refreshStyle}
            >
                <i
                    className={`fa-solid ${refreshing ? 'fa-spinner animate-spin' : 'fa-arrow-down'} text-indigo-600 text-lg`}
                    style={iconStyle}
                ></i>
            </div>

            {/* Content Wrapper */}
            <div style={contentStyle}>
                {children}
            </div>
        </div>
    );
};

export default PullToRefresh;
