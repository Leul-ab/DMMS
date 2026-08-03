import type { LucideIcon } from 'lucide-react';

export default function Heading({
    title,
    description,
    variant = 'default',
    icon: Icon,
}: {
    title: string;
    description?: string;
    variant?: 'default' | 'small';
    icon?: LucideIcon;
}) {
    return (
        <header className={variant === 'small' ? '' : 'mb-8 space-y-0.5'}>
            <h2
                className={
                    variant === 'small'
                        ? 'mb-0.5 text-base font-medium'
                        : 'flex items-center gap-2 text-2xl font-bold tracking-tight'
                }
            >
                {Icon && <Icon className="h-7 w-7 shrink-0 text-orange-500" />}
                {title}
            </h2>
            {description && (
                <p className="text-base font-medium text-muted-foreground">
                    {description}
                </p>
            )}
        </header>
    );
}
