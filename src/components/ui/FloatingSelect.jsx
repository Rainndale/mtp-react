import React, { useState } from 'react';

const FloatingSelect = ({ label, value, onChange, options = [], children, ...props }) => {
    const [isFocused, setIsFocused] = useState(false);
    const hasValue = value !== undefined && value !== null && value !== '';

    return (
        <div className="relative">
            <select
                value={value}
                onChange={onChange}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                className={`
                    block w-full h-14 px-3 pt-3.5 pb-0
                    text-sm bg-[var(--input-bg)] text-[var(--text-main)]
                    border border-[var(--input-border)] rounded-lg
                    outline-none transition-colors duration-200
                    focus:border-[var(--accent-blue)] focus:ring-1 focus:ring-[var(--accent-blue)]
                    appearance-none
                `}
                {...props}
            >
                {children || options.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
            </select>
            <label
                className={`
                    absolute left-3 transition-all duration-200 pointer-events-none
                    ${(isFocused || hasValue)
                        ? 'top-2.5 text-[11px] font-medium text-[var(--accent-blue)] transform translate-y-0'
                        : 'top-1/2 text-sm text-[var(--text-muted)] transform -translate-y-1/2'}
                `}
            >
                {label}
            </label>
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none text-[var(--text-muted)]">
                 <i className="fa-solid fa-chevron-down text-xs"></i>
            </div>
        </div>
    );
};

export default FloatingSelect;
