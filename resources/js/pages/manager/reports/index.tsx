import { Head, router } from '@inertiajs/react';
import {
BarChart3,
CalendarDays,
ShoppingCart,
Table2,
UtensilsCrossed,
Wallet,
} from 'lucide-react';

type ReportTab =
| 'revenue'
| 'orders'
| 'top-tables'
| 'top-foods'
| 'sales';

type Period =
| 'daily'
| 'weekly'
| 'monthly'
| 'annual';

type ReportRow = Record<
string,
string | number | null

> ;

interface ReportsProps {
activeTab: ReportTab;
period: Period;
reportData: ReportRow[];
}

const tabs = [
{
id: 'revenue' as ReportTab,
label: 'Revenue',
icon: Wallet,
},
{
id: 'orders' as ReportTab,
label: 'Orders',
icon: ShoppingCart,
},
{
id: 'top-tables' as ReportTab,
label: 'Top Tables',
icon: Table2,
},
{
id: 'top-foods' as ReportTab,
label: 'Top Foods',
icon: UtensilsCrossed,
},
{
id: 'sales' as ReportTab,
label: 'Sales',
icon: BarChart3,
},
];

const periods = [
{
id: 'daily' as Period,
label: 'Daily',
},
{
id: 'weekly' as Period,
label: 'Weekly',
},
{
id: 'monthly' as Period,
label: 'Monthly',
},
{
id: 'annual' as Period,
label: 'Annual',
},
];

const columnsByTab: Record<
ReportTab,
{ key: string; label: string }[]

> = {
 revenue: [
 {
 key: 'period',
 label: 'Period',
},
{
 key: 'total_orders',
 label: 'Total Orders',
 },
 {
 key: 'revenue',
label: 'Revenue',
 },
 ],


orders: [
    {
        key: 'period',
        label: 'Period',
    },
    {
        key: 'total_orders',
        label: 'Total Orders',
    },
    {
        key: 'completed',
        label: 'Completed',
    },
    {
        key: 'pending',
        label: 'Pending',
    },
    {
        key: 'cancelled',
        label: 'Cancelled',
    },
],

'top-tables': [
    {
        key: 'period',
        label: 'Period',
    },
    {
        key: 'table_number',
        label: 'Table',
    },
    {
        key: 'times_used',
        label: 'Times Used',
    },
    {
        key: 'revenue',
        label: 'Revenue',
    },
],

'top-foods': [
    {
        key: 'period',
        label: 'Period',
    },
    {
        key: 'food',
        label: 'Food',
    },
    {
        key: 'category',
        label: 'Category',
    },
    {
        key: 'quantity_ordered',
        label: 'Quantity Ordered',
    },
    {
        key: 'revenue',
        label: 'Revenue',
    },
],

sales: [
    {
        key: 'period',
        label: 'Period',
    },
    {
        key: 'food',
        label: 'Food Item',
    },
    {
        key: 'quantity_sold',
        label: 'Quantity Sold',
    },
    {
        key: 'unit_price',
        label: 'Unit Price',
    },
    {
        key: 'total_sales',
        label: 'Total Sales',
    },
],


};

export default function Reports({
activeTab,
period,
reportData,
}: ReportsProps) {
const activeTabLabel =
tabs.find(
(tab) => tab.id === activeTab,
)?.label ?? 'Revenue';


const periodLabel =
    periods.find(
        (item) => item.id === period,
    )?.label ?? 'Daily';

const columns =
    columnsByTab[activeTab];

const changeTab = (
    tab: ReportTab,
) => {
    router.get(
        '/manager/reports',
        {
            tab,
            period,
        },
        {
            preserveState: true,
            preserveScroll: true,
        },
    );
};

const changePeriod = (
    newPeriod: Period,
) => {
    router.get(
        '/manager/reports',
        {
            tab: activeTab,
            period: newPeriod,
        },
        {
            preserveState: true,
            preserveScroll: true,
        },
    );
};

const formatValue = (
    key: string,
    value: string | number | null,
) => {
    if (
        value === null ||
        value === undefined
    ) {
        return '-';
    }

    if (
        key === 'revenue' ||
        key === 'total_sales' ||
        key === 'unit_price'
    ) {
        return `${Number(value).toLocaleString()} ETB`;
    }

    return String(value);
};

return (
    <>
        <Head title="Reports" />

        <div className="flex flex-1 flex-col gap-6 overflow-x-auto py-4 pr-4 pl-2 md:py-6 md:pr-6 md:pl-2">
            {/* Page Header */}
            <div>
                <h1 className="text-2xl font-bold tracking-tight">
                    Reports
                </h1>

                <p className="mt-1 text-sm text-muted-foreground">
                    View and analyze your restaurant performance.
                </p>
            </div>

            {/* Tabs */}
            <div className="border-b">
                <div className="flex gap-1 overflow-x-auto">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;

                        const isActive =
                            activeTab === tab.id;

                        return (
                            <button
                                key={tab.id}
                                type="button"
                                onClick={() =>
                                    changeTab(tab.id)
                                }
                                className={`flex items-center gap-2 whitespace-nowrap border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
                                    isActive
                                        ? 'border-primary text-primary'
                                        : 'border-transparent text-muted-foreground hover:border-muted-foreground/30 hover:text-foreground'
                                }`}
                            >
                                <Icon className="h-4 w-4" />

                                {tab.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Header + Period Filter */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h2 className="text-lg font-semibold">
                        {activeTabLabel} Reports
                    </h2>

                    <p className="text-sm text-muted-foreground">
                        Showing{' '}
                        {periodLabel.toLowerCase()}{' '}
                        report data.
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <CalendarDays className="h-4 w-4 text-muted-foreground" />

                    <select
                        value={period}
                        onChange={(event) =>
                            changePeriod(
                                event.target.value as Period,
                            )
                        }
                        className="rounded-md border bg-background px-3 py-2 text-sm font-medium outline-none focus:ring-2 focus:ring-primary"
                    >
                        {periods.map((item) => (
                            <option
                                key={item.id}
                                value={item.id}
                            >
                                {item.label}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Report Table */}
            <div className="overflow-hidden rounded-lg border">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="border-b bg-muted/40">
                            <tr>
                                {columns.map((column) => (
                                    <th
                                        key={column.key}
                                        className="px-6 py-4 font-semibold"
                                    >
                                        {column.label}
                                    </th>
                                ))}
                            </tr>
                        </thead>

                        <tbody className="divide-y">
                            {reportData.length > 0 ? (
                                reportData.map(
                                    (row, rowIndex) => (
                                        <tr
                                            key={rowIndex}
                                            className="transition-colors hover:bg-muted/30"
                                        >
                                            {columns.map(
                                                (column) => (
                                                    <td
                                                        key={
                                                            column.key
                                                        }
                                                        className={`px-6 py-4 ${
                                                            column.key ===
                                                            columns[0]
                                                                .key
                                                                ? 'font-medium'
                                                                : 'text-muted-foreground'
                                                        }`}
                                                    >
                                                        {formatValue(
                                                            column.key,
                                                            row[
                                                                column.key
                                                            ],
                                                        )}
                                                    </td>
                                                ),
                                            )}
                                        </tr>
                                    ),
                                )
                            ) : (
                                <tr>
                                    <td
                                        colSpan={
                                            columns.length
                                        }
                                        className="px-6 py-12 text-center text-muted-foreground"
                                    >
                                        No report data available
                                        for this period.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </>
);


}

Reports.layout = {
    breadcrumbs: [
        {
            title: 'Reports',
            href: '/manager/reports',
        },
    ],
};
