import { Head, Link } from '@inertiajs/react';
import {
    ChefHat,
    History,
} from 'lucide-react';

import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';

type Stats = {
    newOrders: number;
    historyOrders: number;
};

type Props = {
    stats: Stats;
};

export default function KitchenDashboard({
    stats,
}: Props) {
    const cards = [
        {
            title: 'New Orders',
            description:
                'View and manage active kitchen orders.',
            count: stats.newOrders,
            href: '/kitchen/orders/new',
            icon: ChefHat,
        },
        {
            title: 'Order History',
            description:
                'View completed and cancelled orders.',
            count: stats.historyOrders,
            href: '/kitchen/orders/history',
            icon: History,
        },
    ];

    return (
        <>
            <Head title="Kitchen Dashboard" />

            <div className="flex h-full flex-1 flex-col gap-6 p-6">
                {/* Page Header */}
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight">
                        Kitchen Dashboard
                    </h1>

                    <p className="text-muted-foreground">
                        Manage and track restaurant orders
                        from the kitchen.
                    </p>
                </div>

                {/* Dashboard Cards */}
                <div className="grid gap-4 sm:grid-cols-2">
                    {cards.map((card) => {
                        const Icon = card.icon;

                        return (
                            <Link
                                key={card.title}
                                href={card.href}
                                className="group"
                            >
                                <Card className="transition-shadow group-hover:shadow-md">
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0">
                                        <CardTitle className="text-sm font-medium">
                                            {card.title}
                                        </CardTitle>

                                        <Icon className="size-5 text-muted-foreground" />
                                    </CardHeader>

                                    <CardContent>
                                        <div className="text-3xl font-bold">
                                            {card.count}
                                        </div>

                                        <p className="mt-1 text-xs text-muted-foreground">
                                            {card.description}
                                        </p>
                                    </CardContent>
                                </Card>
                            </Link>
                        );
                    })}
                </div>
            </div>
        </>
    );
}