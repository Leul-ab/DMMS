import { Head, Link, router } from '@inertiajs/react';
import { Search, Eye, Pencil } from 'lucide-react';
import { useState } from 'react';
import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { kitchen as kitchenRoute, show as staffShow, edit as staffEdit } from '@/routes/admin/staff';
import type { PaginatedData } from '@/types';

type Role = { id: number; name: string; slug: string };
type KitchenMember = {
    id: number;
    first_name: string;
    last_name: string;
    employee_id: string;
    email: string;
    photo: string | null;
    role: Role | null;
};

type Props = {
    kitchenStaff: PaginatedData<KitchenMember>;
    roles: Role[];
    filters: { search?: string };
};

export default function KitchenStaff({ kitchenStaff, roles, filters }: Props) {
    const [search, setSearch] = useState(filters.search || '');

    const handleSearch = (value: string) => {
        setSearch(value);
        router.get(kitchenRoute.url(), { search: value }, { preserveState: true, replace: true });
    };

    return (
        <>
            <Head title="Kitchen Staff" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <div className="flex items-center justify-between">
                    <Heading title="Kitchen Staff" description="Manage all kitchen employees" />
                </div>

                <div className="flex items-center gap-3 flex-wrap">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input placeholder="Search kitchen staff..." value={search} onChange={(e) => handleSearch(e.target.value)} className="pl-9" />
                    </div>
                </div>

                <Card>
                    <CardContent className="p-0">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b text-left text-sm text-muted-foreground">
                                    <th className="px-4 py-3 font-medium">Name</th>
                                    <th className="px-4 py-3 font-medium">Employee ID</th>
                                    <th className="px-4 py-3 font-medium">Position</th>
                                    <th className="px-4 py-3 font-medium text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {kitchenStaff.data.length === 0 ? (
                                    <tr><td colSpan={4} className="px-4 py-8 text-center text-sm text-muted-foreground">No kitchen staff found.</td></tr>
                                ) : (
                                    kitchenStaff.data.map((member) => (
                                        <tr key={member.id} className="border-b last:border-0 hover:bg-muted/50">
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-sm font-medium shrink-0">
                                                        {member.photo ? (
                                                            <img src={member.photo} alt="" className="h-8 w-8 rounded-full object-cover" />
                                                        ) : (
                                                            member.first_name?.charAt(0)?.toUpperCase() || '?'
                                                        )}
                                                    </div>
                                                    <span className="text-sm font-medium">{member.first_name} {member.last_name}</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-muted-foreground">{member.employee_id}</td>
                                            <td className="px-4 py-3"><Badge variant="secondary">{member.role?.name}</Badge></td>
                                            <td className="px-4 py-3 text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    <Button variant="ghost" size="icon" asChild title="View Profile">
                                                        <Link href={staffShow.url(member.id)}>
                                                            <Eye className="h-4 w-4" />
                                                        </Link>
                                                    </Button>
                                                    <Button variant="ghost" size="icon" asChild title="Edit">
                                                        <Link href={staffEdit.url(member.id)}>
                                                            <Pencil className="h-4 w-4" />
                                                        </Link>
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

                {kitchenStaff.last_page > 1 && (
                    <div className="flex items-center justify-center gap-2">
                        {kitchenStaff.links.map((link, i) => (
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

KitchenStaff.layout = { breadcrumbs: [{ title: 'Kitchen Staff', href: '/admin/staff/kitchen' }] };
