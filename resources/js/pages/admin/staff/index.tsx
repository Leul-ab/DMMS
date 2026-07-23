import { Head, Link, router, usePage } from '@inertiajs/react';
import { Plus, Pencil, Trash2, Search, Eye, Key, X } from 'lucide-react';
import { useState } from 'react';
import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { index as staffIndex, create as staffCreate, edit as staffEdit, destroy as staffDestroy, show as staffShow } from '@/routes/admin/staff';
import type { PaginatedData } from '@/types';

type Role = { id: number; name: string; slug: string };
type StaffMember = {
    id: number;
    first_name: string;
    last_name: string;
    employee_id: string;
    email: string;
    phone: string | null;
    photo: string | null;
    role: Role | null;
};

type Props = {
    staff: PaginatedData<StaffMember>;
    roles: Role[];
    filters: { search?: string; role?: string };
};

export default function StaffIndex({ staff, roles, filters }: Props) {
    const [search, setSearch] = useState(filters.search || '');
    const [showResetPasswordDialog, setShowResetPasswordDialog] = useState<StaffMember | null>(null);
    const [passwordForm, setPasswordForm] = useState({ password: '', password_confirmation: '' });
    const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({});

    const handleSearch = (value: string) => {
        setSearch(value);
        router.get(staffIndex.url(), { search: value, role: filters.role }, { preserveState: true, replace: true });
    };

    const handleFilter = (key: string, value: string) => {
        router.get(staffIndex.url(), { ...filters, [key]: value === 'all' ? undefined : value, search }, { preserveState: true, replace: true });
    };

    const handleResetPassword = (e: React.FormEvent) => {
        e.preventDefault();
        if (!showResetPasswordDialog) return;
        router.post(`/admin/staff/${showResetPasswordDialog.id}/reset-password`, passwordForm, {
            preserveState: true,
            onError: (err) => setPasswordErrors(err as Record<string, string>),
            onSuccess: () => {
                setShowResetPasswordDialog(null);
                setPasswordForm({ password: '', password_confirmation: '' });
                setPasswordErrors({});
            },
        });
    };

    return (
        <>
            <Head title="Staff Management" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <div className="flex items-center justify-between">
                    <Heading title="Staff Management" description="Manage all restaurant employees" />
                    <Button asChild>
                        <Link href={staffCreate.url()}>
                            <Plus className="mr-2 h-4 w-4" /> Add Staff
                        </Link>
                    </Button>
                </div>

                <div className="flex items-center gap-3 flex-wrap">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input placeholder="Search by name, email, phone or employee ID..." value={search} onChange={(e) => handleSearch(e.target.value)} className="pl-9" />
                    </div>
                    <Select value={filters.role || 'all'} onValueChange={(v) => handleFilter('role', v)}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="All Roles" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Roles</SelectItem>
                            {roles.map((role) => (
                                <SelectItem key={role.id} value={String(role.id)}>{role.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <Card>
                    <CardContent className="p-0">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b text-left text-sm text-muted-foreground">
                                    <th className="px-4 py-3 font-medium">Employee</th>
                                    <th className="px-4 py-3 font-medium">Employee ID</th>
                                    <th className="px-4 py-3 font-medium">Role</th>
                                    <th className="px-4 py-3 font-medium text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {staff.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="px-4 py-8 text-center text-sm text-muted-foreground">
                                            No staff members found.
                                        </td>
                                    </tr>
                                ) : (
                                    staff.data.map((member) => (
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
                                                    <div>
                                                        <div className="text-sm font-medium">{member.first_name} {member.last_name}</div>
                                                        <div className="text-xs text-muted-foreground">{member.email}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-muted-foreground">{member.employee_id || '—'}</td>
                                            <td className="px-4 py-3">
                                                <Badge variant="secondary">{member.role?.name || 'No role'}</Badge>
                                            </td>
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
                                                    <Button variant="ghost" size="icon" title="Reset Password" onClick={() => { setPasswordForm({ password: '', password_confirmation: '' }); setPasswordErrors({}); setShowResetPasswordDialog(member); }}>
                                                        <Key className="h-4 w-4" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" title="Delete" onClick={() => { if (confirm(`Are you sure you want to delete ${member.first_name} ${member.last_name}?`)) { router.delete(staffDestroy.url(member.id)); } }}>
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

                {staff.last_page > 1 && (
                    <div className="flex items-center justify-center gap-2">
                        {staff.links.map((link, i) => (
                            <Button key={i} variant={link.active ? 'default' : 'outline'} size="sm" disabled={!link.url} asChild={!!link.url}>
                                {link.url ? <Link href={link.url} dangerouslySetInnerHTML={{ __html: link.label }} /> : <span dangerouslySetInnerHTML={{ __html: link.label }} />}
                            </Button>
                        ))}
                    </div>
                )}

                {/* Reset Password Dialog */}
                <Dialog open={!!showResetPasswordDialog} onOpenChange={() => { setShowResetPasswordDialog(null); setPasswordForm({ password: '', password_confirmation: '' }); setPasswordErrors({}); }}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Reset Password for {showResetPasswordDialog?.first_name} {showResetPasswordDialog?.last_name}</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleResetPassword} className="space-y-4">
                            <div className="space-y-2">
                                <label htmlFor="reset-password" className="text-sm font-medium">New Password</label>
                                <Input id="reset-password" type="password" value={passwordForm.password} onChange={(e) => setPasswordForm(prev => ({ ...prev, password: e.target.value }))} />
                                {passwordErrors.password && <p className="text-sm text-destructive">{passwordErrors.password}</p>}
                            </div>
                            <div className="space-y-2">
                                <label htmlFor="reset-password-confirm" className="text-sm font-medium">Confirm Password</label>
                                <Input id="reset-password-confirm" type="password" value={passwordForm.password_confirmation} onChange={(e) => setPasswordForm(prev => ({ ...prev, password_confirmation: e.target.value }))} />
                            </div>
                            <div className="flex items-center justify-end gap-2">
                                <Button type="button" variant="outline" onClick={() => { setShowResetPasswordDialog(null); setPasswordForm({ password: '', password_confirmation: '' }); setPasswordErrors({}); }}>
                                    <X className="mr-2 h-4 w-4" /> Cancel
                                </Button>
                                <Button type="submit">
                                    <Key className="mr-2 h-4 w-4" /> Reset Password
                                </Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
        </>
    );
}

StaffIndex.layout = {
    breadcrumbs: [{ title: 'Staff Management', href: staffIndex.url() }],
};
