import { Link } from '@inertiajs/react';
import { LucideIcon, ArrowRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

type StatCardProps = {
    title: string;
    value: string | number;
    icon: LucideIcon;
    iconClassName?: string;
    href?: string;
};

export default function StatCard({
    title,
    value,
    icon: Icon,
    iconClassName = 'text-primary',
    href,
}: StatCardProps) {
    const content = (
        <CardContent className="p-6">
            <div className="flex items-center justify-between gap-4">
                <div>
                    <p className="text-sm font-medium text-muted-foreground">
                        {title}
                    </p>

                    <h3 className="mt-2 text-2xl font-bold">
                        {value}
                    </h3>

                    {href && (
                        <div className="mt-3 flex items-center gap-1 text-xs font-medium text-muted-foreground">
                            <span>View details</span>
                            <ArrowRight className="h-3.5 w-3.5" />
                        </div>
                    )}
                </div>

                <div className="rounded-2xl bg-primary/10 p-3">
                    <Icon
                        className={`h-6 w-6 ${iconClassName}`}
                    />
                </div>
            </div>
        </CardContent>
    );

    if (href) {
        return (
            <Link
                href={href}
                className="group block outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
                <Card className="h-full cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
                    {content}
                </Card>
            </Link>
        );
    }

    return (
        <Card className="h-full">
            {content}
        </Card>
    );
}