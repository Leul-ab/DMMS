import * as React from 'react';

import { cn } from '@/lib/utils';

export const ETHIOPIAN_PHONE_PATTERN = /^\+2519\d{8}$/;

/**
 * Ethiopian mobile numbers are stored as +251 followed by 9 digits,
 * where the first local digit must be 9. Example: +251912345678.
 */
export function isValidEthiopianPhone(value: string): boolean {
    return ETHIOPIAN_PHONE_PATTERN.test(value);
}

/**
 * Normalize a phone number to the canonical +2519XXXXXXXX format,
 * mirroring App\Support\PhoneHelper::normalize on the backend.
 */
export function normalizeEthiopianPhone(value: string): string {
    if (!value) {
        return '';
    }

    const hasPlus = value.startsWith('+');
    const digits = value.replace(/\D/g, '');

    if (!digits) {
        return '';
    }

    if (hasPlus) {
        return '+' + digits;
    }

    if (digits.startsWith('0')) {
        return '+251' + digits.slice(1);
    }

    if (digits.startsWith('251')) {
        return '+' + digits;
    }

    return '+251' + digits;
}

/**
 * Returns a human-readable validation error for an Ethiopian phone number,
 * or an empty string when the value is valid (or empty).
 */
export function getPhoneValidationError(value: string): string {
    if (!value) {
        return '';
    }

    const local = value.startsWith('+251')
        ? value.slice(4)
        : value.replace(/\D/g, '');

    if (!/^\d+$/.test(local)) {
        return 'Phone number must contain digits only.';
    }

    if (local.length !== 9) {
        return 'Phone number must be exactly 9 digits.';
    }

    if (local[0] !== '9') {
        return 'Phone number must start with 9.';
    }

    return '';
}

interface PhoneInputProps {
    id?: string;
    value: string;
    onChange: (value: string) => void;
    onBlur?: () => void;
    error?: string;
    placeholder?: string;
    disabled?: boolean;
    required?: boolean;
    className?: string;
    prefixClassName?: string;
    inputClassName?: string;
    name?: string;
    onKeyDown?: React.KeyboardEventHandler<HTMLInputElement>;
}

export function PhoneInput({
    id,
    value,
    onChange,
    onBlur,
    error,
    placeholder = '912345678',
    disabled,
    required,
    className,
    prefixClassName,
    inputClassName,
    name,
    onKeyDown,
}: PhoneInputProps) {
    const local = value.startsWith('+251') ? value.slice(4) : value;

    const clientError = getPhoneValidationError(value);
    const displayError = error ?? (required && !value ? 'Phone number is required.' : clientError);

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const digits = event.target.value.replace(/\D/g, '').slice(0, 9);

        onChange(digits ? '+251' + digits : '');
    };

    return (
        <div className="w-full">
            <div
                className={cn(
                    'flex h-9 items-center rounded-md border border-input bg-transparent focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/20',
                    disabled && 'cursor-not-allowed opacity-50',
                    displayError && 'border-destructive',
                    className,
                )}
            >
                <span
                    className={cn(
                        'select-none whitespace-nowrap border-r border-input px-3 text-sm text-muted-foreground',
                        prefixClassName,
                    )}
                >
                    +251
                </span>
                <input
                    id={id}
                    name={name}
                    type="tel"
                    inputMode="numeric"
                    autoComplete="tel-national"
                    value={local}
                    onChange={handleChange}
                    onBlur={onBlur}
                    onKeyDown={onKeyDown}
                    disabled={disabled}
                    placeholder={placeholder}
                    aria-invalid={displayError ? true : undefined}
                    className={cn(
                        'h-full w-full min-w-0 bg-transparent px-3 text-sm text-foreground outline-none placeholder:text-muted-foreground',
                        inputClassName,
                    )}
                />
            </div>
            {displayError && (
                <p className="mt-1 text-sm text-red-500">{displayError}</p>
            )}
        </div>
    );
}

export default PhoneInput;
