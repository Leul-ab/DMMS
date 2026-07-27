import {
    ClipboardList,
    Users,
    Utensils,
    DollarSign,
    Clock,
    CheckCircle2,
    Table2,
} from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';

type DashboardStats = {
    totalOrders: number;
    pendingOrders: number;
    completedOrders: number;
  totalRevenue: string | number;
    totalCustomers: number;
    availableTables: number;
    occupiedTables: number;
};

type DashboardStatsProps = {
    stats: DashboardStats;
};

export default function DashboardStats({
    stats,
}: DashboardStatsProps) {
    const statCards = [
        {
            title: 'Total Orders',
            value: stats.totalOrders,
            icon: ClipboardList,
            iconClass: 'text-primary',
            bgClass: 'bg-primary/10',
        },
        {
            title: 'Pending Orders',
            value: stats.pendingOrders,
            icon: Clock,
            iconClass: 'text-yellow-600',
            bgClass: 'bg-yellow-500/10',
        },
        {
            title: 'Completed Orders',
            value: stats.completedOrders,
            icon: CheckCircle2,
            iconClass: 'text-green-600',
            bgClass: 'bg-green-500/10',
        },
        {
            title: 'Total Revenue',
            value: `$${Number(stats.totalRevenue).toFixed(2)}`,
            icon: DollarSign,
            iconClass: 'text-blue-600',
            bgClass: 'bg-blue-500/10',
        },
        {
            title: 'Total Customers',
            value: stats.totalCustomers,
            icon: Users,
            iconClass: 'text-purple-600',
            bgClass: 'bg-purple-500/10',
        },
        {
            title: 'Available Tables',
            value: stats.availableTables,
            icon: Table2,
            iconClass: 'text-green-600',
            bgClass: 'bg-green-500/10',
        },
        {
            title: 'Occupied Tables',
            value: stats.occupiedTables,
            icon: Utensils,
            iconClass: 'text-red-600',
            bgClass: 'bg-red-500/10',
        },
    ];

    return (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {statCards.map((stat) => {
                const Icon = stat.icon;

                return (
                    <Card key={stat.title}>
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">
                                        {stat.title}
                                    </p>

                                    <h3 className="mt-2 text-2xl font-bold">
                                        {stat.value}
                                    </h3>
                                </div>

                                <div
                                    className={`rounded-full p-3 ${stat.bgClass}`}
                                >
                                    <Icon
                                        className={`h-5 w-5 ${stat.iconClass}`}
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                );
            })}
        </div>
    );
}