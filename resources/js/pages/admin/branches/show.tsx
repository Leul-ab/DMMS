import { Head, Link, router } from '@inertiajs/react';
import {
    ArrowLeft,
    ArrowLeftRight,
    Building2,
    Calendar,
    ChefHat,
    CreditCard,
    ListOrdered,
    MapPin,
    Mail,
    Pencil,
    Phone,
    Table2,
    Users,
    UtensilsCrossed,
} from 'lucide-react';

import Heading from '@/components/heading';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useCan } from '@/hooks/use-can';

import {
    index as branchesIndex,
    switchMethod as branchesSwitch,
} from '@/routes/admin/branches';

type Branch = {
    id: number;
    name: string;
    slug: string;
    address: string | null;
    phone: string | null;
    email: string | null;
    city: string | null;
    state: string | null;
    postal_code: string | null;
    country: string | null;
    tax_rate: string | null;
    currency: string | null;
    description: string | null;
    is_active: boolean;
    created_at: string;
    users_count: number;
    tables_count: number;
    menu_categories_count: number;
    menu_items_count: number;
    orders_count: number;
    customers_count: number;
};

type Props = {
    branch: Branch;
};

function DetailItem({
    icon: Icon,
    label,
    value,
}: {
    icon: typeof MapPin;
    label: string;
    value: React.ReactNode;
}) {
    return (
        <div className="flex items-start gap-3">
            <div className="rounded-lg bg-muted p-2">
                <Icon className="h-4 w-4 text-orange-500" />
            </div>

            <div className="min-w-0">
                <p className="text-sm text-muted-foreground">{label}</p>

                <p className="font-medium break-words">{value || '—'}</p>
            </div>
        </div>
    );
}

export default function BranchShow({ branch }: Props) {
    const can = useCan();

    const stats = [
        {
            icon: Users,
            label: 'Staff',
            value: branch.users_count,
        },
        {
            icon: Table2,
            label: 'Tables',
            value: branch.tables_count,
        },
        {
            icon: ListOrdered,
            label: 'Categories',
            value: branch.menu_categories_count,
        },
        {
            icon: UtensilsCrossed,
            label: 'Menu Items',
            value: branch.menu_items_count,
        },
        {
            icon: ChefHat,
            label: 'Orders',
            value: branch.orders_count,
        },
        {
            icon: CreditCard,
            label: 'Customers',
            value: branch.customers_count,
        },
    ];

    const handleSwitch = () => {
        router.post(
            branchesSwitch.url(branch.id),
            {},
            {
                preserveScroll: true,
            },
        );
    };

    return (
        <>
            <Head title={`${branch.name} - Branches`} />

            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl p-4">
                {/* =========================================
                    PAGE HEADER
                ========================================= */}

                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                        <Button variant="outline" size="icon" asChild>
                            <Link
                                href={branchesIndex.url()}
                                title="Back to branches"
                            >
                                <ArrowLeft className="h-4 w-4" />
                            </Link>
                        </Button>

                        <div>
                            <Heading
                                title={branch.name}
                                description="Branch details and resource usage."
                                icon={Building2}
                            />
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <Badge
                            variant={
                                branch.is_active ? 'default' : 'destructive'
                            }
                        >
                            {branch.is_active ? 'Active' : 'Inactive'}
                        </Badge>

                        {can('view branches') && (
                            <Button
                                variant="outline"
                                onClick={handleSwitch}
                                disabled={!branch.is_active}
                                title={
                                    branch.is_active
                                        ? `Switch to ${branch.name}`
                                        : 'Cannot switch to a deactivated branch'
                                }
                            >
                                <ArrowLeftRight className="mr-2 h-4 w-4" />
                                Switch to this branch
                            </Button>
                        )}

                        {can('update branches') && (
                            <Button asChild>
                                <Link
                                    href={branchesIndex.url()}
                                    title="Edit branch"
                                >
                                    <Pencil className="mr-2 h-4 w-4" />
                                    Edit
                                </Link>
                            </Button>
                        )}
                    </div>
                </div>

                {/* =========================================
                    STATS
                ========================================= */}

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {stats.map((stat) => (
                        <Card key={stat.label}>
                            <CardContent className="flex items-center gap-4 p-6">
                                <div className="rounded-lg bg-orange-100 p-3 text-orange-600">
                                    <stat.icon className="h-5 w-5" />
                                </div>

                                <div>
                                    <p className="text-2xl font-bold">
                                        {stat.value}
                                    </p>

                                    <p className="text-sm text-muted-foreground">
                                        {stat.label}
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* =========================================
                    BRANCH DETAILS
                ========================================= */}

                <Card>
                    <CardHeader>
                        <CardTitle>Branch Information</CardTitle>
                    </CardHeader>

                    <CardContent>
                        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                            <DetailItem
                                icon={Building2}
                                label="Branch Name"
                                value={branch.name}
                            />

                            <DetailItem
                                icon={MapPin}
                                label="Address"
                                value={branch.address}
                            />

                            <DetailItem
                                icon={Phone}
                                label="Phone"
                                value={branch.phone}
                            />

                            <DetailItem
                                icon={Mail}
                                label="Email"
                                value={branch.email}
                            />

                            <DetailItem
                                icon={MapPin}
                                label="City"
                                value={branch.city}
                            />

                            <DetailItem
                                icon={MapPin}
                                label="State / Region"
                                value={branch.state}
                            />

                            <DetailItem
                                icon={MapPin}
                                label="Postal Code"
                                value={branch.postal_code}
                            />

                            <DetailItem
                                icon={MapPin}
                                label="Country"
                                value={branch.country}
                            />

                            <DetailItem
                                icon={ChefHat}
                                label="Tax Rate"
                                value={
                                    branch.tax_rate
                                        ? `${branch.tax_rate}%`
                                        : null
                                }
                            />

                            <DetailItem
                                icon={CreditCard}
                                label="Currency"
                                value={branch.currency}
                            />

                            <DetailItem
                                icon={Calendar}
                                label="Created"
                                value={
                                    branch.created_at
                                        ? new Date(
                                              branch.created_at,
                                          ).toLocaleDateString('en-US', {
                                              year: 'numeric',
                                              month: 'long',
                                              day: 'numeric',
                                          })
                                        : null
                                }
                            />
                        </div>

                        {branch.description && (
                            <div className="mt-6 border-t pt-4">
                                <p className="text-sm text-muted-foreground">
                                    Description
                                </p>

                                <p className="mt-1">{branch.description}</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

BranchShow.layout = {
    breadcrumbs: [
        {
            title: 'Branches',
            href: branchesIndex.url(),
        },
        {
            title: 'Branch Details',
            href: '',
        },
    ],
};
