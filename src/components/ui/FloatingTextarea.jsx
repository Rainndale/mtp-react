import React, { useState, useEffect, useRef } from 'react';

const FloatingTextarea = ({ label, value, onChange, onFocus, onBlur, ...props }) => {
    const [isFocused, setIsFocused] = useState(false);
    const hasValue = value !== undefined && value !== null && value !== '';
    const textareaRef = useRef(null);

    const autoResize = () => {
        const el = textareaRef.current;
        if (el) {
            el.style.height = 'auto';
            el.style.height = (el.scrollHeight + 2) + 'px';
        }
    };

    useEffect(() => {
        autoResize();
    }, [value]);

    const handleFocus = (e) => {
        setIsFocused(true);
        if (onFocus) onFocus(e);
    };

    const handleBlur = (e) => {
        setIsFocused(false);
        if (onBlur) onBlur(e);
    };

    return (
        <div className="relative">
            <textarea
                ref={textareaRef}
                value={value}
                onChange={(e) => { onChange(e); autoResize(); }}
                onFocus={handleFocus}
                onBlur={handleBlur}
                className={`
                    block w-full min-h-[120px] px-3 pt-6 pb-2
                    text-sm bg-[var(--input-bg)] text-[var(--text-main)]
                    border border-[var(--input-border)] rounded-lg
                    outline-none transition-colors duration-200 resize-none overflow-hidden
                    focus:border-[var(--accent-blue)] focus:ring-1 focus:ring-[var(--accent-blue)]
                `}
                placeholder=" "
                {...props}
            />
            <label
                className={`
                    absolute left-3 transition-all duration-200 pointer-events-none
                    ${(isFocused || hasValue)
                        ? 'top-2.5 text-[11px] font-medium text-[var(--accent-blue)] transform translate-y-0'
                        : 'top-6 text-sm text-[var(--text-muted)] transform -translate-y-1/2'}
                `}
            >
                {label}
            </label>
        </div>
    );
};

export default FloatingTextarea;
