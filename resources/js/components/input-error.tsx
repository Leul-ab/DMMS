import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export default function InputError({
    message,
    className = '',
    ...props
}: HTMLAttributes<HTMLParagraphElement> & { message?: string }) {
    if (!message) {
        return null;
    }

    return (
        <p
            {...props}
            role="alert"
            aria-live="polite"
            className={cn(
                'min-h-5 text-sm text-red-600 dark:text-red-400',
                className,
            )}
        >
            {message}
        </p>
    );
}
