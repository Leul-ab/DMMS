import { Head, Link, router } from '@inertiajs/react';
import { Search, Eye, Pencil, Star } from 'lucide-react';
import { useState } from 'react';
import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { waiters as waitersRoute, show as staffShow, edit as staffEdit } from '@/routes/admin/staff';
import type { PaginatedData } from '@/types';

type Waiter = {
    id: number;
    first_name: string;
    last_name: string;
    employee_id: string;
    email: string;
    phone: string | null;
    photo: string | null;
    role: { name: string } | null;
};

type Props = {
    waiters: PaginatedData<Waiter>;
    filters: { search?: string };
};

export default function Waiters({ waiters, filters }: Props) {
    const [search, setSearch] = useState(filters.search || '');

    const handleSearch = (value: string) => {
        setSearch(value);
        router.get(waitersRoute.url(), { search: value }, { preserveState: true, replace: true });
    };

    return (
        <>
            <Head title="Waiters" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <div className="flex items-center justify-between">
                    <Heading title="Waiters" description="Manage all wait staff" />
                </div>

                <div className="flex items-center gap-3 flex-wrap">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input placeholder="Search waiters..." value={search} onChange={(e) => handleSearch(e.target.value)} className="pl-9" />
                    </div>
                </div>

                <Card>
                    <CardContent className="p-0">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b text-left text-sm text-muted-foreground">
                                    <th className="px-4 py-3 font-medium">Name</th>
                                    <th className="px-4 py-3 font-medium">Employee ID</th>
                                    <th className="px-4 py-3 font-medium">Email</th>
                                    <th className="px-4 py-3 font-medium">Assigned Tables</th>
                                    <th className="px-4 py-3 font-medium">Current Orders</th>
                                    <th className="px-4 py-3 font-medium text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {waiters.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-4 py-8 text-center text-sm text-muted-foreground">
                                            No waiters found.
                                        </td>
                                    </tr>
                                ) : (
                                    waiters.data.map((waiter) => (
                                        <tr key={waiter.id} className="border-b last:border-0 hover:bg-muted/50">
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-sm font-medium shrink-0">
                                                        {waiter.photo ? (
                                                            <img src={waiter.photo} alt="" className="h-8 w-8 rounded-full object-cover" />
                                                        ) : (
                                                            waiter.first_name?.charAt(0)?.toUpperCase() || '?'
                                                        )}
                                                    </div>
                                                    <span className="text-sm font-medium">{waiter.first_name} {waiter.last_name}</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-muted-foreground">{waiter.employee_id}</td>
                                            <td className="px-4 py-3 text-sm text-muted-foreground">{waiter.email}</td>
                                            <td className="px-4 py-3 text-sm text-muted-foreground">—</td>
                                            <td className="px-4 py-3 text-sm text-muted-foreground">0</td>
                                            <td className="px-4 py-3 text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    <Button variant="ghost" size="icon" asChild title="View Profile">
                                                        <Link href={staffShow.url(waiter.id)}>
                                                            <Eye className="h-4 w-4" />
                                                        </Link>
                                                    </Button>
                                                    <Button variant="ghost" size="icon" asChild title="Edit">
                                                        <Link href={staffEdit.url(waiter.id)}>
                                                            <Pencil className="h-4 w-4" />
                                                        </Link>
                                                    </Button>
                                                    <Button variant="ghost" size="icon" title="View Performance">
                                                        <Star className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </CardContent>
                </Card>

                {waiters.last_page > 1 && (
                    <div className="flex items-center justify-center gap-2">
                        {waiters.links.map((link, i) => (
                            <Button key={i} variant={link.active ? 'default' : 'outline'} size="sm" disabled={!link.url} asChild={!!link.url}>
                                {link.url ? <Link href={link.url} dangerouslySetInnerHTML={{ __html: link.label }} /> : <span dangerouslySetInnerHTML={{ __html: link.label }} />}
                            </Button>
                        ))}
                    </div>
                )}
            </div>
        </>
    );
}

Waiters.layout = {
    breadcrumbs: [
        { title: 'Staff Management', href: '/admin/staff' },
        { title: 'Waiters', href: '/admin/staff/waiters' },
    ],
};
