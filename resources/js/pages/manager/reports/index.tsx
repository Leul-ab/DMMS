import { Head } from '@inertiajs/react';
import Heading from '@/components/heading';
import {
Card,
CardContent,
CardHeader,
CardTitle,
} from '@/components/ui/card';
import {
DollarSign,
ShoppingBag,
CheckCircle2,
Clock,
XCircle,
UtensilsCrossed,
Table2,
TrendingUp,
} from 'lucide-react';

type RevenueDetails = {
revenue: number;
orders: number;
};

type Revenue = {
daily: number;
weekly: number;
monthly: number;
annual: number;
};

type OrderPeriodStatistics = {
total: number;
completed: number;
pending: number;
cancelled: number;
};

type OrderStatistics = {
today: OrderPeriodStatistics;
this_week: OrderPeriodStatistics;
};

type PopularMenuItem = {
menu_item_id: number;
name: string;
quantity: number;
};

type MostUsedTable = {
table_number: number;
orders: number;
};

type TablePerformance = {
total: number;
available: number;
occupied: number;
usageRate: number;
mostUsed: MostUsedTable[];
};

type ReportsIndexProps = {
revenue: Revenue;
revenueDetails: {
today: RevenueDetails;
this_week: RevenueDetails;
this_month: RevenueDetails;
this_year: RevenueDetails;
};
orderStatistics: OrderStatistics;
popularMenuItems: PopularMenuItem[];
tablePerformance: TablePerformance;
};

export default function ReportsIndex({
revenue,
revenueDetails,
orderStatistics,
popularMenuItems,
tablePerformance,
}: ReportsIndexProps) {
const formatCurrency = (amount: number) => {
return `${Number(amount).toLocaleString()} ETB`;
};


return (
    <>
        <Head title="Reports" />

        <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
            <Heading
                title="Reports & Analytics"
                description="Monitor restaurant sales, orders, popular menu items, and table performance."
            />

            {/* Sales / Revenue Summary */}
            <div>
                <h2 className="mb-4 text-xl font-semibold">
                    Sales & Revenue Summary
                </h2>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">
                                Daily Revenue
                            </CardTitle>
                            <DollarSign className="h-5 w-5 text-muted-foreground" />
                        </CardHeader>

                        <CardContent>
                            <div className="text-2xl font-bold">
                                {formatCurrency(revenue.daily)}
                            </div>

                            <p className="mt-1 text-sm text-muted-foreground">
                                {revenueDetails.today.orders} paid and completed orders
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">
                                Weekly Revenue
                            </CardTitle>
                            <TrendingUp className="h-5 w-5 text-muted-foreground" />
                        </CardHeader>

                        <CardContent>
                            <div className="text-2xl font-bold">
                                {formatCurrency(revenue.weekly)}
                            </div>

                            <p className="mt-1 text-sm text-muted-foreground">
                                {revenueDetails.this_week.orders} paid and completed orders
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">
                                Monthly Revenue
                            </CardTitle>
                            <DollarSign className="h-5 w-5 text-muted-foreground" />
                        </CardHeader>

                        <CardContent>
                            <div className="text-2xl font-bold">
                                {formatCurrency(revenue.monthly)}
                            </div>

                            <p className="mt-1 text-sm text-muted-foreground">
                                {revenueDetails.this_month.orders} paid and completed orders
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">
                                Annual Revenue
                            </CardTitle>
                            <TrendingUp className="h-5 w-5 text-muted-foreground" />
                        </CardHeader>

                        <CardContent>
                            <div className="text-2xl font-bold">
                                {formatCurrency(revenue.annual)}
                            </div>

                            <p className="mt-1 text-sm text-muted-foreground">
                                {revenueDetails.this_year.orders} paid and completed orders
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Revenue Details */}
            <Card>
                <CardHeader>
                    <CardTitle>Revenue Details</CardTitle>
                </CardHeader>

                <CardContent>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <div className="rounded-lg border p-4">
                            <p className="text-sm text-muted-foreground">
                                Today
                            </p>
                            <p className="mt-1 text-lg font-semibold">
                                {formatCurrency(revenueDetails.today.revenue)}
                            </p>
                            <p className="text-sm text-muted-foreground">
                                {revenueDetails.today.orders} completed orders
                            </p>
                        </div>

                        <div className="rounded-lg border p-4">
                            <p className="text-sm text-muted-foreground">
                                This Week
                            </p>
                            <p className="mt-1 text-lg font-semibold">
                                {formatCurrency(revenueDetails.this_week.revenue)}
                            </p>
                            <p className="text-sm text-muted-foreground">
                                {revenueDetails.this_week.orders} completed orders
                            </p>
                        </div>

                        <div className="rounded-lg border p-4">
                            <p className="text-sm text-muted-foreground">
                                This Month
                            </p>
                            <p className="mt-1 text-lg font-semibold">
                                {formatCurrency(revenueDetails.this_month.revenue)}
                            </p>
                            <p className="text-sm text-muted-foreground">
                                {revenueDetails.this_month.orders} completed orders
                            </p>
                        </div>

                        <div className="rounded-lg border p-4">
                            <p className="text-sm text-muted-foreground">
                                This Year
                            </p>
                            <p className="mt-1 text-lg font-semibold">
                                {formatCurrency(revenueDetails.this_year.revenue)}
                            </p>
                            <p className="text-sm text-muted-foreground">
                                {revenueDetails.this_year.orders} completed orders
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Order Statistics */}
            <div>
                <h2 className="mb-4 text-xl font-semibold">
                    Order Statistics
                </h2>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card>
                        <CardContent className="flex items-center gap-4 p-6">
                            <ShoppingBag className="h-8 w-8" />
                            <div>
                                <p className="text-sm text-muted-foreground">
                                    Total Orders Today
                                </p>
                                <p className="text-2xl font-bold">
                                    {orderStatistics.today.total}
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="flex items-center gap-4 p-6">
                            <CheckCircle2 className="h-8 w-8" />
                            <div>
                                <p className="text-sm text-muted-foreground">
                                    Completed Orders
                                </p>
                                <p className="text-2xl font-bold">
                                    {orderStatistics.today.completed}
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="flex items-center gap-4 p-6">
                            <Clock className="h-8 w-8" />
                            <div>
                                <p className="text-sm text-muted-foreground">
                                    Pending Orders
                                </p>
                                <p className="text-2xl font-bold">
                                    {orderStatistics.today.pending}
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="flex items-center gap-4 p-6">
                            <XCircle className="h-8 w-8" />
                            <div>
                                <p className="text-sm text-muted-foreground">
                                    Cancelled Orders
                                </p>
                                <p className="text-2xl font-bold">
                                    {orderStatistics.today.cancelled}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Popular Menu Items */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <UtensilsCrossed className="h-5 w-5" />
                        Popular Menu Items
                    </CardTitle>
                </CardHeader>

                <CardContent>
                    {popularMenuItems.length > 0 ? (
                        <div className="space-y-3">
                            {popularMenuItems.map((item, index) => (
                                <div
                                    key={item.menu_item_id}
                                    className="flex items-center justify-between rounded-lg border p-4"
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="font-semibold">
                                            #{index + 1}
                                        </span>

                                        <span className="font-medium">
                                            {item.name}
                                        </span>
                                    </div>

                                    <span className="text-sm text-muted-foreground">
                                        {item.quantity} orders
                                    </span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-muted-foreground">
                            No menu item sales data available yet.
                        </p>
                    )}
                </CardContent>
            </Card>

            {/* Table Performance */}
            <div>
                <h2 className="mb-4 text-xl font-semibold">
                    Table Performance
                </h2>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center gap-3">
                                <Table2 className="h-6 w-6" />
                                <div>
                                    <p className="text-sm text-muted-foreground">
                                        Total Tables
                                    </p>
                                    <p className="text-2xl font-bold">
                                        {tablePerformance.total}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-6">
                            <p className="text-sm text-muted-foreground">
                                Available Tables
                            </p>
                            <p className="mt-1 text-2xl font-bold">
                                {tablePerformance.available}
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-6">
                            <p className="text-sm text-muted-foreground">
                                Occupied Tables
                            </p>
                            <p className="mt-1 text-2xl font-bold">
                                {tablePerformance.occupied}
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-6">
                            <p className="text-sm text-muted-foreground">
                                Table Usage Rate
                            </p>
                            <p className="mt-1 text-2xl font-bold">
                                {tablePerformance.usageRate}%
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Most Used Tables */}
            <Card>
                <CardHeader>
                    <CardTitle>Most Used Tables</CardTitle>
                </CardHeader>

                <CardContent>
                    {tablePerformance.mostUsed.length > 0 ? (
                        <div className="space-y-3">
                            {tablePerformance.mostUsed.map((table, index) => (
                                <div
                                    key={table.table_number}
                                    className="flex items-center justify-between rounded-lg border p-4"
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="font-semibold">
                                            #{index + 1}
                                        </span>

                                        <span className="font-medium">
                                            Table {table.table_number}
                                        </span>
                                    </div>

                                    <span className="text-sm text-muted-foreground">
                                        {table.orders} completed orders
                                    </span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-muted-foreground">
                            No table usage data available yet.
                        </p>
                    )}
                </CardContent>
            </Card>
        </div>
    </>
);


}
