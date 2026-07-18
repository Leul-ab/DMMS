import { Head, Link, router, usePage } from '@inertiajs/react';
import { Plus, Pencil, Trash2, Search } from 'lucide-react';
import { useState } from 'react';
import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { index as usersIndex, create as usersCreate, edit as usersEdit, destroy as usersDestroy } from '@/routes/admin/users';
import type { PaginatedData } from '@/types';

type Role = { id: number; name: string; slug: string };
type User = { id: number; name: string; email: string; phone: string | null; is_active: boolean; role: Role | null; created_at: string };

type Props = {
    users: PaginatedData<User>;
    roles: Role[];
    filters: { search?: string; role?: string };
};

export default function UsersIndex({ users, roles, filters }: Props) {
    const [search, setSearch] = useState(filters.search || '');

    const handleSearch = (value: string) => {
        setSearch(value);
        router.get(usersIndex.url(), { search: value, role: filters.role }, { preserveState: true, replace: true });
    };

    const handleRoleFilter = (value: string) => {
        router.get(usersIndex.url(), { search, role: value === 'all' ? undefined : value }, { preserveState: true, replace: true });
    };

    return (
        <>
            <Head title="User Management" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <div className="flex items-center justify-between">
                    <Heading title="User Management" description="Manage all users and their roles" />
                    <Button asChild>
                        <Link href={usersCreate.url()}>
                            <Plus className="mr-2 h-4 w-4" /> Add User
                        </Link>
                    </Button>
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input placeholder="Search by name or email..." value={search} onChange={(e) => handleSearch(e.target.value)} className="pl-9" />
                    </div>
                    <Select value={filters.role || 'all'} onValueChange={handleRoleFilter}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="All Roles" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Roles</SelectItem>
                            {roles.map((role) => (
                                <SelectItem key={role.id} value={String(role.id)}>
                                    {role.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <Card>
                    <CardContent className="p-0">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b text-left text-sm text-muted-foreground">
                                    <th className="px-4 py-3 font-medium">Name</th>
                                    <th className="px-4 py-3 font-medium">Email</th>
                                    <th className="px-4 py-3 font-medium">Phone</th>
                                    <th className="px-4 py-3 font-medium">Role</th>
                                    <th className="px-4 py-3 font-medium">Status</th>
                                    <th className="px-4 py-3 font-medium text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-4 py-8 text-center text-sm text-muted-foreground">
                                            No users found.
                                        </td>
                                    </tr>
                                ) : (
                                    users.data.map((user) => (
                                        <tr key={user.id} className="border-b last:border-0">
                                            <td className="px-4 py-3 text-sm font-medium">{user.name}</td>
                                            <td className="px-4 py-3 text-sm text-muted-foreground">{user.email}</td>
                                            <td className="px-4 py-3 text-sm text-muted-foreground">{user.phone || '—'}</td>
                                            <td className="px-4 py-3">
                                                <Badge variant="secondary">{user.role?.name || 'No role'}</Badge>
                                            </td>
                                            <td className="px-4 py-3">
                                                <Badge variant={user.is_active ? 'default' : 'destructive'}>
                                                    {user.is_active ? 'Active' : 'Inactive'}
                                                </Badge>
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    <Button variant="ghost" size="icon" asChild>
                                                        <Link href={usersEdit.url(user.id)}>
                                                            <Pencil className="h-4 w-4" />
                                                        </Link>
                                                    </Button>
                                                    <Button variant="ghost" size="icon" onClick={() => { if (confirm('Are you sure you want to delete this user?')) { router.delete(usersDestroy.url(user.id)); } }}>
                                                        <Trash2 className="h-4 w-4 text-destructive" />
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

                {users.last_page > 1 && (
                    <div className="flex items-center justify-center gap-2">
                        {users.links.map((link, i) => (
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

UsersIndex.layout = {
    breadcrumbs: [{ title: 'User Management', href: usersIndex.url() }],
};
