import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export default function InputError({
    message,
    className = '',
    ...props
}: HTMLAttributes<HTMLParagraphElement> & { message?: string }) {
    return message ? (
        <p
            {...props}
            role="alert"
            aria-live="polite"
            className={cn('text-sm text-destructive', className)}
        >
            {message}
        </p>
    ) : null;
}
