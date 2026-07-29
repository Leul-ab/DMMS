import React from 'react';

type StatusToggleProps = {
    checked: boolean;
    onCheckedChange: () => void;
    onLabel?: string;
    offLabel?: string;
    ariaLabel?: string;
    disabled?: boolean;
};

export default function StatusToggle({
    checked,
    onCheckedChange,
    onLabel = 'Active',
    offLabel = 'Inactive',
    ariaLabel,
    disabled = false,
}: StatusToggleProps) {
    return (
        <button
            type="button"
            role="switch"
            aria-checked={checked}
            aria-label={
                ariaLabel ||
                (checked ? onLabel : offLabel)
            }
            disabled={disabled}
            onClick={onCheckedChange}
            className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
                checked
                    ? 'bg-green-500'
                    : 'bg-gray-300 dark:bg-gray-600'
            }`}
            title={checked ? onLabel : offLabel}
        >
            <span
                className={`pointer-events-none inline-block h-3.5 w-3.5 rounded-full bg-white shadow-sm transition-transform duration-200 ${
                    checked
                        ? 'translate-x-4'
                        : 'translate-x-0.5'
                }`}
            />
        </button>
    );
}