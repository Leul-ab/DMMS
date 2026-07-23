import { Head, Link, router } from '@inertiajs/react';
import { Plus, Pencil, Trash2, Save, X, Shield, Check } from 'lucide-react';
import { useState } from 'react';
import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { index as rolesIndex, store as rolesStore, update as rolesUpdate, destroy as rolesDestroy } from '@/routes/admin/roles';
import type { PaginatedData } from '@/types';

type Permission = { id: number; name: string; slug: string; description: string | null };
type Role = { id: number; name: string; slug: string; description: string | null; users_count: number; permissions: Permission[] };

type Props = { roles: PaginatedData<Role> };

const PERMISSION_GROUPS = [
    {
        name: 'Menu Management',
        permissions: ['menu.view', 'menu.create', 'menu.edit', 'menu.delete'],
    },
    {
        name: 'Staff Management',
        permissions: ['staff.view', 'staff.create', 'staff.edit', 'staff.delete', 'staff.assign_shift'],
    },
    {
        name: 'Order Management',
        permissions: ['orders.view', 'orders.create', 'orders.edit', 'orders.cancel'],
    },
    {
        name: 'Kitchen Management',
        permissions: ['kitchen.view', 'kitchen.update_status'],
    },
    {
        name: 'Reports',
        permissions: ['reports.view', 'reports.export'],
    },
    {
        name: 'Tables',
        permissions: ['tables.view', 'tables.assign', 'tables.manage'],
    },
];

export default function RolesIndex({ roles }: Props) {
    const [showCreate, setShowCreate] = useState(false);
    const [editingRole, setEditingRole] = useState<Role | null>(null);
    const [form, setForm] = useState({ name: '', slug: '', description: '' });
    const [errors, setErrors] = useState<Record<string, string>>({});

    const [selectedPermissions, setSelectedPermissions] = useState<Set<string>>(new Set());
    const [showPermissionsDialog, setShowPermissionsDialog] = useState(false);
    const [permissionRole, setPermissionRole] = useState<Role | null>(null);
    const [savingPermissions, setSavingPermissions] = useState(false);

    const resetForm = () => {
        setForm({ name: '', slug: '', description: '' });
        setErrors({});
    };

    const openCreate = () => {
        resetForm();
        setEditingRole(null);
        setShowCreate(true);
    };

    const openEdit = (role: Role) => {
        setForm({ name: role.name, slug: role.slug, description: role.description || '' });
        setEditingRole(role);
        setErrors({});
        setShowCreate(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingRole) {
            router.put(rolesUpdate.url(editingRole.id), form, {
                onError: (err) => setErrors(err as Record<string, string>),
                onSuccess: () => { setShowCreate(false); resetForm(); },
            });
        } else {
            router.post(rolesStore.url(), form, {
                onError: (err) => setErrors(err as Record<string, string>),
                onSuccess: () => { setShowCreate(false); resetForm(); },
            });
        }
    };

    const handleDelete = (role: Role) => {
        if (confirm(`Are you sure you want to delete the role "${role.name}"?`)) {
            router.delete(rolesDestroy.url(role.id), {
                onError: (err) => alert(err.message || 'Cannot delete this role.'),
            });
        }
    };

    const openPermissions = (role: Role) => {
        setPermissionRole(role);
        setSelectedPermissions(new Set(role.permissions?.map(p => p.slug) || []));
        setShowPermissionsDialog(true);
    };

    const togglePermission = (permission: string) => {
        const newPermissions = new Set(selectedPermissions);
        if (newPermissions.has(permission)) {
            newPermissions.delete(permission);
        } else {
            newPermissions.add(permission);
        }
        setSelectedPermissions(newPermissions);
    };

    const toggleGroup = (groupPermissions: string[], enable: boolean) => {
        const newPermissions = new Set(selectedPermissions);
        groupPermissions.forEach(p => {
            if (enable) {
                newPermissions.add(p);
            } else {
                newPermissions.delete(p);
            }
        });
        setSelectedPermissions(newPermissions);
    };

    const savePermissions = () => {
        if (!permissionRole) return;
        setSavingPermissions(true);
        router.put(rolesUpdate.url(permissionRole.id), {
            ...form,
            permissions: Array.from(selectedPermissions),
        }, {
            onSuccess: () => {
                setShowPermissionsDialog(false);
                setPermissionRole(null);
                setSavingPermissions(false);
            },
            onError: () => setSavingPermissions(false),
        });
    };

    const generateSlug = (name: string) => {
        setForm(prev => ({ ...prev, name, slug: name.toLowerCase().replace(/\s+/g, '_') }));
    };

    return (
        <>
            <Head title="Roles & Permissions" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <div className="flex items-center justify-between">
                    <Heading title="Roles & Permissions" description="Manage employee roles and their permissions" />
                    <Button onClick={openCreate}>
                        <Plus className="mr-2 h-4 w-4" /> Add Role
                    </Button>
                </div>

                <Card>
                    <CardContent className="p-0">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b text-left text-sm text-muted-foreground">
                                    <th className="px-4 py-3 font-medium">Role Name</th>
                                    <th className="px-4 py-3 font-medium">Slug</th>
                                    <th className="px-4 py-3 font-medium">Description</th>
                                    <th className="px-4 py-3 font-medium text-center">Staff Count</th>
                                    <th className="px-4 py-3 font-medium text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {roles.data.length === 0 ? (
                                    <tr><td colSpan={5} className="px-4 py-8 text-center text-sm text-muted-foreground">No roles found.</td></tr>
                                ) : roles.data.map((role) => (
                                    <tr key={role.id} className="border-b last:border-0 hover:bg-muted/50">
                                        <td className="px-4 py-3 text-sm font-medium">
                                            <div className="flex items-center gap-2">
                                                <Shield className="h-4 w-4 text-muted-foreground" />
                                                {role.name}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3"><Badge variant="secondary">{role.slug}</Badge></td>
                                        <td className="px-4 py-3 text-sm text-muted-foreground">{role.description || '—'}</td>
                                        <td className="px-4 py-3 text-center text-sm">{role.users_count}</td>
                                        <td className="px-4 py-3 text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <Button variant="ghost" size="sm" onClick={() => openPermissions(role)}>
                                                    <Shield className="mr-1 h-4 w-4" /> Permissions
                                                </Button>
                                                <Button variant="ghost" size="icon" onClick={() => openEdit(role)}>
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" onClick={() => handleDelete(role)}>
                                                    <Trash2 className="h-4 w-4 text-destructive" />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </CardContent>
                </Card>

                {roles.last_page > 1 && (
                    <div className="flex items-center justify-center gap-2">
                        {roles.links.map((link, i) => (
                            <Button key={i} variant={link.active ? 'default' : 'outline'} size="sm" disabled={!link.url} asChild={!!link.url}>
                                {link.url ? <Link href={link.url} dangerouslySetInnerHTML={{ __html: link.label }} /> : <span dangerouslySetInnerHTML={{ __html: link.label }} />}
                            </Button>
                        ))}
                    </div>
                )}

                {/* Create/Edit Role Dialog */}
                <Dialog open={showCreate} onOpenChange={setShowCreate}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{editingRole ? 'Edit Role' : 'Create Role'}</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <label htmlFor="name" className="text-sm font-medium">Role Name</label>
                                <Input id="name" value={form.name} onChange={(e) => generateSlug(e.target.value)} />
                                {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
                            </div>
                            <div className="space-y-2">
                                <label htmlFor="slug" className="text-sm font-medium">Slug</label>
                                <Input id="slug" value={form.slug} onChange={(e) => setForm(prev => ({ ...prev, slug: e.target.value }))} />
                                {errors.slug && <p className="text-sm text-destructive">{errors.slug}</p>}
                            </div>
                            <div className="space-y-2">
                                <label htmlFor="description" className="text-sm font-medium">Description</label>
                                <Input id="description" value={form.description} onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))} />
                            </div>
                            <div className="flex items-center justify-end gap-2">
                                <Button type="button" variant="outline" onClick={() => { setShowCreate(false); resetForm(); }}>
                                    <X className="mr-2 h-4 w-4" /> Cancel
                                </Button>
                                <Button type="submit">
                                    <Save className="mr-2 h-4 w-4" /> {editingRole ? 'Update' : 'Create'}
                                </Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* Permissions Dialog */}
                <Dialog open={showPermissionsDialog} onOpenChange={setShowPermissionsDialog}>
                    <DialogContent className="max-w-2xl">
                        <DialogHeader>
                            <DialogTitle>Permissions for {permissionRole?.name}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 max-h-[60vh] overflow-y-auto">
                            {PERMISSION_GROUPS.map((group) => (
                                <Card key={group.name}>
                                    <CardHeader className="py-3">
                                        <div className="flex items-center justify-between">
                                            <CardTitle className="text-sm">{group.name}</CardTitle>
                                            <div className="flex items-center gap-2">
                                                <Button variant="ghost" size="sm" onClick={() => toggleGroup(group.permissions, true)}>
                                                    <Check className="mr-1 h-3 w-3" /> All
                                                </Button>
                                                <Button variant="ghost" size="sm" onClick={() => toggleGroup(group.permissions, false)}>
                                                    <X className="mr-1 h-3 w-3" /> None
                                                </Button>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="py-2">
                                        <div className="grid grid-cols-2 gap-2">
                                            {group.permissions.map((perm) => (
                                                <label
                                                    key={perm}
                                                    className={`flex items-center gap-3 p-2 rounded-md cursor-pointer transition-colors ${
                                                        selectedPermissions.has(perm)
                                                            ? 'bg-primary/10 text-primary'
                                                            : 'hover:bg-muted'
                                                    }`}
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedPermissions.has(perm)}
                                                        onChange={() => togglePermission(perm)}
                                                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                                    />
                                                    <span className="text-sm capitalize">
                                                        {perm.replace(/\./g, ' - ').replace(/_/g, ' ')}
                                                    </span>
                                                </label>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                        <Separator />
                        <div className="flex items-center justify-end gap-2">
                            <Button variant="outline" onClick={() => setShowPermissionsDialog(false)}>
                                <X className="mr-2 h-4 w-4" /> Cancel
                            </Button>
                            <Button onClick={savePermissions} disabled={savingPermissions}>
                                <Save className="mr-2 h-4 w-4" /> {savingPermissions ? 'Saving...' : 'Save Permissions'}
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
        </>
    );
}

RolesIndex.layout = { breadcrumbs: [{ title: 'Roles & Permissions', href: '/admin/roles' }] };
