import { Link } from '@inertiajs/react';
import { ArrowRight, LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

type StatCardProps = {
    title: string;
    value: string | number;
    icon: LucideIcon;
    iconClassName?: string;
    iconBgClassName?: string;
    href?: string;
    featured?: boolean;
};

export default function StatCard({
    title,
    value,
    icon: Icon,
    iconClassName = 'text-orange-600',
    iconBgClassName = 'bg-orange-50',
    href,
    featured = false,
}: StatCardProps) {
    const content = (
        <div
            className={cn(
                'flex h-full items-center justify-between gap-4 p-6',
                featured && 'flex-col items-start justify-center'
            )}
        >
            <div>
                <p
                    className={cn(
                        'text-sm font-semibold',
                        featured
                            ? 'text-orange-100'
                            : 'text-amber-600/80'
                    )}
                >
                    {title}
                </p>

                <h3
                    className={cn(
                        'mt-2 text-3xl font-black tracking-tight',
                        featured ? 'text-white' : 'text-stone-800'
                    )}
                >
                    {value}
                </h3>

                {href && (
                    <div
                        className={cn(
                            'mt-3 flex items-center gap-1 text-xs font-medium',
                            featured ? 'text-orange-200' : 'text-muted-foreground'
                        )}
                    >
                        <span>View details</span>
                        <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                    </div>
                )}
            </div>

            <div
                className={cn(
                    'rounded-2xl p-3.5 transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-6',
                    featured
                        ? 'bg-white/15 backdrop-blur-sm'
                        : iconBgClassName
                )}
            >
                <Icon
                    className={cn(
                        'h-7 w-7',
                        featured ? 'text-white' : iconClassName
                    )}
                />
            </div>
        </div>
    );

    if (href) {
        return (
            <Link
                href={href}
                className="group block h-full outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2"
            >
                <div
                    className={cn(
                        'h-full rounded-2xl border transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl',
                        featured
                            ? 'border-orange-400/50 bg-gradient-to-br from-orange-500 to-orange-600 shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40'
                            : 'border-orange-100/80 bg-white shadow-sm hover:border-orange-200 hover:shadow-orange-200/40'
                    )}
                >
                    {content}
                </div>
            </Link>
        );
    }

    return (
        <div
            className={cn(
                'h-full rounded-2xl border transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl',
                featured
                    ? 'border-orange-400/50 bg-gradient-to-br from-orange-500 to-orange-600 shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40'
                    : 'border-orange-100/80 bg-white shadow-sm hover:border-orange-200 hover:shadow-orange-200/40'
            )}
        >
            {content}
        </div>
    );
}
