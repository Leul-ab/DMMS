import { Head, Link, router } from '@inertiajs/react';
import {
    Building2,
    ChevronRight,
    Globe,
    Palette,
    Pencil,
    Plus,
    Search,
    Trash2,
    Users,
} from 'lucide-react';
import { useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { PaginatedData } from '@/types';

type Restaurant = {
    id: number;
    name: string;
    slug: string;
    logo_url: string | null;
    primary_color: string;
    secondary_color: string;
    accent_color: string;
    font_family: string;
    owner_email: string | null;
    plan: string;
    is_active: boolean;
    branches_count: number;
    users_count: number;
    created_at: string;
};

type Stats = {
    total: number;
    active: number;
    pro: number;
    users: number;
};

type Props = {
    restaurants: PaginatedData<Restaurant>;
    stats: Stats;
    filters: { search?: string; status?: string; plan?: string };
};

const PLAN_LABELS: Record<string, { label: string; color: string }> = {
    starter:    { label: 'Starter',    color: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300' },
    pro:        { label: 'Pro',        color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' },
    enterprise: { label: 'Enterprise', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300' },
};

export default function RestaurantsIndex({ restaurants, stats, filters }: Props) {
    const [search, setSearch] = useState(filters.search ?? '');
    const [deleteTarget, setDeleteTarget] = useState<Restaurant | null>(null);

    const listUrl = () => '/super-admin/restaurants';

    const handleSearch = (value: string) => {
        setSearch(value);
        router.get(listUrl(), { search: value, status: filters.status, plan: filters.plan }, {
            preserveState: true, replace: true,
        });
    };

    const handleStatusFilter = (value: string) => {
        router.get(listUrl(), { search, status: value === 'all' ? undefined : value, plan: filters.plan }, {
            preserveState: true, replace: true,
        });
    };

    const handlePlanFilter = (value: string) => {
        router.get(listUrl(), { search, status: filters.status, plan: value === 'all' ? undefined : value }, {
            preserveState: true, replace: true,
        });
    };

    const handleToggle = (restaurant: Restaurant) => {
        router.patch(`/super-admin/restaurants/${restaurant.id}/toggle-status`, {}, { preserveScroll: true });
    };

    const handleDelete = () => {
        if (!deleteTarget) return;
        router.delete(`/super-admin/restaurants/${deleteTarget.id}`, {
            onSuccess: () => setDeleteTarget(null),
        });
    };

    return (
        <>
            <Head title="Restaurants — Super Admin" />

            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-6">

                {/* ── Header ── */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Restaurants</h1>
                        <p className="text-sm text-muted-foreground mt-1">Manage all SaaS tenants from one place.</p>
                    </div>
                    <Button asChild>
                        <Link href="/super-admin/restaurants/create">
                            <Plus className="mr-2 h-4 w-4" />
                            New Restaurant
                        </Link>
                    </Button>
                </div>

                {/* ── Stats ── */}
                <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                    {[
                        { label: 'Total Restaurants', value: stats.total,  icon: Globe,     color: 'text-blue-500',   bg: 'bg-blue-50 dark:bg-blue-950/30' },
                        { label: 'Active',            value: stats.active,  icon: Building2, color: 'text-green-500',  bg: 'bg-green-50 dark:bg-green-950/30' },
                        { label: 'Pro / Enterprise',  value: stats.pro,    icon: Palette,   color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-950/30' },
                        { label: 'Total Users',       value: stats.users,  icon: Users,     color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-950/30' },
                    ].map((s) => (
                        <Card key={s.label}>
                            <CardContent className="flex items-center gap-4 p-5">
                                <div className={`rounded-xl p-3 ${s.bg}`}>
                                    <s.icon className={`h-5 w-5 ${s.color}`} />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold">{s.value}</p>
                                    <p className="text-xs text-muted-foreground">{s.label}</p>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* ── Table ── */}
                <Card>
                    <CardHeader>
                        <CardTitle>All Restaurants</CardTitle>
                        <div className="flex flex-wrap gap-3 pt-3">
                            {/* Search */}
                            <div className="relative max-w-sm flex-1">
                                <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    placeholder="Search by name or email…"
                                    value={search}
                                    onChange={(e) => handleSearch(e.target.value)}
                                    className="pl-9"
                                />
                            </div>
                            {/* Status filter */}
                            <Select value={filters.status ?? 'all'} onValueChange={handleStatusFilter}>
                                <SelectTrigger className="w-[150px]">
                                    <SelectValue placeholder="Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Status</SelectItem>
                                    <SelectItem value="active">Active</SelectItem>
                                    <SelectItem value="inactive">Inactive</SelectItem>
                                </SelectContent>
                            </Select>
                            {/* Plan filter */}
                            <Select value={filters.plan ?? 'all'} onValueChange={handlePlanFilter}>
                                <SelectTrigger className="w-[150px]">
                                    <SelectValue placeholder="Plan" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Plans</SelectItem>
                                    <SelectItem value="starter">Starter</SelectItem>
                                    <SelectItem value="pro">Pro</SelectItem>
                                    <SelectItem value="enterprise">Enterprise</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </CardHeader>

                    <CardContent>
                        {restaurants.data.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-16 text-center">
                                <Building2 className="h-12 w-12 text-muted-foreground/30 mb-3" />
                                <p className="font-medium">No restaurants found</p>
                                <p className="text-sm text-muted-foreground mt-1">Create your first restaurant to get started.</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b text-left text-muted-foreground">
                                            <th className="p-3 font-medium">Restaurant</th>
                                            <th className="p-3 font-medium">Branding</th>
                                            <th className="p-3 font-medium">Owner</th>
                                            <th className="p-3 font-medium">Plan</th>
                                            <th className="p-3 font-medium">Stats</th>
                                            <th className="p-3 font-medium">Status</th>
                                            <th className="p-3 font-medium text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {restaurants.data.map((r) => (
                                            <tr key={r.id} className="border-b last:border-0 hover:bg-muted/40 transition-colors">
                                                {/* Name + logo */}
                                                <td className="p-3">
                                                    <div className="flex items-center gap-3">
                                                        <div
                                                            className="flex size-9 shrink-0 items-center justify-center rounded-lg text-white text-xs font-bold shadow-sm overflow-hidden"
                                                            style={{ background: `linear-gradient(135deg, ${r.primary_color}, ${r.secondary_color})` }}
                                                        >
                                                            {r.logo_url
                                                                ? <img src={r.logo_url} alt={r.name} className="size-9 object-cover" />
                                                                : r.name.slice(0, 2).toUpperCase()
                                                            }
                                                        </div>
                                                        <div>
                                                            <p className="font-semibold">{r.name}</p>
                                                            <p className="text-xs text-muted-foreground">{r.slug}</p>
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* Color swatches + font */}
                                                <td className="p-3">
                                                    <div className="flex items-center gap-1.5">
                                                        <span
                                                            className="inline-block size-5 rounded-full border border-white/50 shadow-sm"
                                                            style={{ background: r.primary_color }}
                                                            title={`Primary: ${r.primary_color}`}
                                                        />
                                                        <span
                                                            className="inline-block size-5 rounded-full border border-white/50 shadow-sm"
                                                            style={{ background: r.secondary_color }}
                                                            title={`Secondary: ${r.secondary_color}`}
                                                        />
                                                        <span
                                                            className="inline-block size-5 rounded-full border border-white/50 shadow-sm"
                                                            style={{ background: r.accent_color }}
                                                            title={`Accent: ${r.accent_color}`}
                                                        />
                                                        <span className="ml-1 text-xs text-muted-foreground">{r.font_family}</span>
                                                    </div>
                                                </td>

                                                {/* Owner */}
                                                <td className="p-3 text-muted-foreground text-xs">{r.owner_email ?? '—'}</td>

                                                {/* Plan */}
                                                <td className="p-3">
                                                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${PLAN_LABELS[r.plan]?.color ?? ''}`}>
                                                        {PLAN_LABELS[r.plan]?.label ?? r.plan}
                                                    </span>
                                                </td>

                                                {/* Stats */}
                                                <td className="p-3 text-muted-foreground text-xs">
                                                    {r.branches_count} branch{r.branches_count !== 1 ? 'es' : ''} · {r.users_count} user{r.users_count !== 1 ? 's' : ''}
                                                </td>

                                                {/* Status */}
                                                <td className="p-3">
                                                    <button
                                                        onClick={() => handleToggle(r)}
                                                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold cursor-pointer transition-colors ${
                                                            r.is_active
                                                                ? 'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400'
                                                                : 'bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400'
                                                        }`}
                                                    >
                                                        <span className={`size-1.5 rounded-full ${r.is_active ? 'bg-green-500' : 'bg-red-500'}`} />
                                                        {r.is_active ? 'Active' : 'Suspended'}
                                                    </button>
                                                </td>

                                                {/* Actions */}
                                                <td className="p-3">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <Button variant="outline" size="icon" asChild title="Edit restaurant">
                                                            <Link href={`/super-admin/restaurants/${r.id}/edit`}>
                                                                <Pencil className="h-4 w-4" />
                                                            </Link>
                                                        </Button>
                                                        <Button
                                                            variant="destructive"
                                                            size="icon"
                                                            onClick={() => setDeleteTarget(r)}
                                                            title="Delete restaurant"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* Pagination */}
                        {restaurants.last_page > 1 && (
                            <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
                                {restaurants.links.map((link, i) => (
                                    <Button
                                        key={i}
                                        variant={link.active ? 'default' : 'outline'}
                                        size="sm"
                                        disabled={!link.url}
                                        onClick={() => link.url && router.get(link.url, {}, { preserveState: true })}
                                    >
                                        <span dangerouslySetInnerHTML={{ __html: link.label }} />
                                    </Button>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Delete confirmation */}
            <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Restaurant</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete <strong>{deleteTarget?.name}</strong>? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
                        <Button variant="destructive" onClick={handleDelete}>Delete</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

RestaurantsIndex.layout = {
    breadcrumbs: [
        { title: 'Super Admin', href: '/super-admin' },
        { title: 'Restaurants', href: '/super-admin/restaurants' },
    ],
};
