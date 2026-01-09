import React, { useState } from 'react';

const FloatingInput = ({ label, value, onChange, type = "text", ...props }) => {
    const [isFocused, setIsFocused] = useState(false);
    const hasValue = value !== undefined && value !== null && value !== '';

    return (
        <div className="relative">
            <input
                type={type}
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
                    ${hasValue ? 'border-[var(--input-border)]' : ''}
                `}
                placeholder=" "
                {...props}
            />
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
        </div>
    );
};

export default FloatingInput;
