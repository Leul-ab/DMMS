
import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import {
    Pencil,
    Plus,
    Search,
    ShieldCheck,
    Trash2,
} from 'lucide-react';

import Heading from '@/components/heading';
import { useCan } from '@/hooks/use-can';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';

import { Checkbox } from '@/components/ui/checkbox';

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

import { Input } from '@/components/ui/input';

import {
    index as rolesIndex,
    store as rolesStore,
    update as rolesUpdate,
    destroy as rolesDestroy,
} from '@/routes/admin/roles';

type Permission = {
    id: number;
    name: string;
    group: string | null;
};

type PermissionGroup = {
    group: string;
    permissions: Permission[];
};

type RoleData = {
    id: number;
    name: string;
    slug: string;
    description: string | null;
    permissions_count: number;
    permissions: string[];
};

type Props = {
    roles: RoleData[];
    permissionGroups: PermissionGroup[];
};

export default function RolesIndex({
    roles,
    permissionGroups,
}: Props) {
    const can = useCan();

    // -----------------------------------------
    // Search
    // -----------------------------------------

    const [search, setSearch] = useState('');

    // -----------------------------------------
    // Modal states
    // -----------------------------------------

    const [isAddOpen, setIsAddOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);

    // -----------------------------------------
    // Selected role
    // -----------------------------------------

    const [selectedRole, setSelectedRole] =
        useState<RoleData | null>(null);

    // -----------------------------------------
    // Form fields
    // -----------------------------------------

    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [selectedPermissions, setSelectedPermissions] =
        useState<string[]>([]);

    // -----------------------------------------
    // Search
    // -----------------------------------------

    const filteredRoles = roles.filter((role) => {
        const term = search.toLowerCase();

        return (
            role.name.toLowerCase().includes(term) ||
            role.slug.toLowerCase().includes(term) ||
            (role.description ?? '')
                .toLowerCase()
                .includes(term)
        );
    });

    // -----------------------------------------
    // Permission helpers
    // -----------------------------------------

    const togglePermission = (permissionName: string) => {
        setSelectedPermissions((prev) =>
            prev.includes(permissionName)
                ? prev.filter((name) => name !== permissionName)
                : [...prev, permissionName],
        );
    };

    const toggleGroup = (group: PermissionGroup) => {
        const groupNames = group.permissions.map(
            (permission) => permission.name,
        );

        const allSelected = groupNames.every((name) =>
            selectedPermissions.includes(name),
        );

        setSelectedPermissions((prev) => {
            if (allSelected) {
                return prev.filter(
                    (name) => !groupNames.includes(name),
                );
            }

            return [...new Set([...prev, ...groupNames])];
        });
    };

    const isGroupFullySelected = (group: PermissionGroup) =>
        group.permissions.every((permission) =>
            selectedPermissions.includes(permission.name),
        );

    const hasGroupSelection = (group: PermissionGroup) =>
        group.permissions.some((permission) =>
            selectedPermissions.includes(permission.name),
        );

    // -----------------------------------------
    // Reset form
    // -----------------------------------------

    const resetForm = () => {
        setName('');
        setDescription('');
        setSelectedPermissions([]);
    };

    // -----------------------------------------
    // Open Add Modal
    // -----------------------------------------

    const openAddModal = () => {
        resetForm();
        setSelectedRole(null);
        setIsAddOpen(true);
    };

    // -----------------------------------------
    // Open Edit Modal
    // -----------------------------------------

    const openEditModal = (role: RoleData) => {
        setSelectedRole(role);

        setName(role.name);
        setDescription(role.description ?? '');
        setSelectedPermissions(role.permissions);

        setIsEditOpen(true);
    };

    // -----------------------------------------
    // Open Delete Modal
    // -----------------------------------------

    const openDeleteModal = (role: RoleData) => {
        setSelectedRole(role);
        setIsDeleteOpen(true);
    };

    // -----------------------------------------
    // Add Role
    // -----------------------------------------

    const handleAdd = () => {
        if (!name.trim()) {
            return;
        }

        router.post(
            rolesStore.url(),
            {
                name: name.trim(),
                description: description || null,
                permissions: selectedPermissions,
            },
            {
                onSuccess: () => {
                    setIsAddOpen(false);
                    resetForm();
                },
            },
        );
    };

    // -----------------------------------------
    // Update Role
    // -----------------------------------------

    const handleUpdate = () => {
        if (!selectedRole || !name.trim()) {
            return;
        }

        router.put(
            rolesUpdate.url(selectedRole.id),
            {
                name: name.trim(),
                description: description || null,
                permissions: selectedPermissions,
            },
            {
                onSuccess: () => {
                    setIsEditOpen(false);
                    setSelectedRole(null);
                    resetForm();
                },
            },
        );
    };

    // -----------------------------------------
    // Delete Role
    // -----------------------------------------

    const handleDelete = () => {
        if (!selectedRole) {
            return;
        }

        router.delete(rolesDestroy.url(selectedRole.id), {
            onSuccess: () => {
                setIsDeleteOpen(false);
                setSelectedRole(null);
            },
        });
    };

    return (
        <>
            <Head title="Roles" />

            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl p-4">

                {/* =========================================
                    PAGE HEADER
                ========================================= */}

                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <Heading
                        title="Roles"
                        description="Manage system roles and their permissions."
                        icon={ShieldCheck}
                    />

                    {can('create roles') && (
                        <Button onClick={openAddModal}>
                            <Plus className="mr-2 h-4 w-4" />
                            Add Role
                        </Button>
                    )}
                </div>

                {/* =========================================
                    ROLES CARD
                ========================================= */}

                <Card>
                    <CardHeader>
                        <CardTitle>
                            System Roles
                        </CardTitle>

                        <div className="relative max-w-sm pt-4">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

                            <Input
                                placeholder="Search roles..."
                                value={search}
                                onChange={(event) =>
                                    setSearch(
                                        event.target.value,
                                    )
                                }
                                className="pl-9"
                            />
                        </div>
                    </CardHeader>

                    <CardContent>
                        {filteredRoles.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-center">
                                <p className="text-lg font-medium">
                                    No roles found
                                </p>

                                <p className="mt-1 text-sm text-muted-foreground">
                                    Try changing your search or add a new role.
                                </p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b text-left">
                                            <th className="p-3">
                                                Role
                                            </th>

                                            <th className="p-3">
                                                Slug
                                            </th>

                                            <th className="p-3">
                                                Description
                                            </th>

                                            <th className="p-3">
                                                Permissions
                                            </th>

                                            <th className="p-3 text-right">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>

                                    <tbody>
                                        {filteredRoles.map(
                                            (role) => (
                                                <tr
                                                    key={role.id}
                                                    className="border-b last:border-0 hover:bg-muted/50"
                                                >
                                                    {/* Role */}
                                                    <td className="p-3 font-medium">
                                                        {role.name}
                                                    </td>

                                                    {/* Slug */}
                                                    <td className="p-3">
                                                        <Badge variant="secondary">
                                                            {role.slug}
                                                        </Badge>
                                                    </td>

                                                    {/* Description */}
                                                    <td className="max-w-xs p-3 text-muted-foreground">
                                                        {role.description ||
                                                            '—'}
                                                    </td>

                                                    {/* Permissions */}
                                                    <td className="p-3">
                                                        <div className="flex max-w-md flex-wrap items-center gap-1.5">
                                                            {role.permissions.slice(0, 4).map(
                                                                (
                                                                    permission,
                                                                ) => (
                                                                    <Badge
                                                                        key={permission}
                                                                        variant="outline"
                                                                        className="text-xs"
                                                                    >
                                                                        {permission}
                                                                    </Badge>
                                                                ),
                                                            )}

                                                            {role.permissions_count >
                                                                4 && (
                                                                <span className="text-xs text-muted-foreground">
                                                                    +
                                                                    {role.permissions_count -
                                                                        4}{' '}
                                                                    more
                                                                </span>
                                                            )}

                                                            {role.permissions_count ===
                                                                0 && (
                                                                <span className="text-xs text-muted-foreground">
                                                                    No permissions
                                                                </span>
                                                            )}
                                                        </div>
                                                    </td>

                                                    {/* Actions */}
                                                    <td className="p-3">
                                                        <div className="flex items-center justify-end gap-2">
                                                            {can('update roles') &&
                                                                role.slug !==
                                                                    'super_admin' && (
                                                                    <Button
                                                                        variant="outline"
                                                                        size="icon"
                                                                        onClick={() =>
                                                                            openEditModal(
                                                                                role,
                                                                            )
                                                                        }
                                                                        title="Edit role"
                                                                    >
                                                                        <Pencil className="h-4 w-4" />
                                                                    </Button>
                                                                )}

                                                            {can('delete roles') &&
                                                                role.slug !==
                                                                    'super_admin' && (
                                                                    <Button
                                                                        variant="destructive"
                                                                        size="icon"
                                                                        onClick={() =>
                                                                            openDeleteModal(
                                                                                role,
                                                                            )
                                                                        }
                                                                        title="Delete role"
                                                                    >
                                                                        <Trash2 className="h-4 w-4" />
                                                                    </Button>
                                                                )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ),
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* =========================================
                ADD ROLE MODAL
            ========================================= */}

            <Dialog
                open={isAddOpen}
                onOpenChange={setIsAddOpen}
            >
                <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>
                            Add Role
                        </DialogTitle>

                        <DialogDescription>
                            Create a new role and assign permissions to it.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-5 py-4">

                        {/* Name */}
                        <div>
                            <label className="mb-2 block text-sm font-medium">
                                Role Name
                            </label>

                            <Input
                                value={name}
                                onChange={(event) =>
                                    setName(
                                        event.target.value,
                                    )
                                }
                                placeholder="e.g. Cashier"
                            />

                            <p className="mt-1 text-xs text-muted-foreground">
                                The slug is generated automatically from the name.
                            </p>
                        </div>

                        {/* Description */}
                        <div>
                            <label className="mb-2 block text-sm font-medium">
                                Description
                            </label>

                            <Input
                                value={description}
                                onChange={(event) =>
                                    setDescription(
                                        event.target.value,
                                    )
                                }
                                placeholder="e.g. Handles cash transactions"
                            />
                        </div>

                        {/* Permissions */}
                        <div>
                            <label className="mb-2 block text-sm font-medium">
                                Permissions
                            </label>

                            <div className="space-y-4">
                                {permissionGroups.map(
                                    (group) => (
                                        <div
                                            key={group.group}
                                            className="rounded-lg border p-4"
                                        >
                                            <div className="mb-3 flex items-center justify-between">
                                                <span className="text-sm font-semibold">
                                                    {group.group}
                                                </span>

                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        toggleGroup(group)
                                                    }
                                                    className="text-xs font-medium text-orange-600 hover:underline"
                                                >
                                                    {isGroupFullySelected(group)
                                                        ? 'Deselect all'
                                                        : hasGroupSelection(group)
                                                          ? 'Select all'
                                                          : 'Select all'}
                                                </button>
                                            </div>

                                            <div className="grid gap-2 sm:grid-cols-2">
                                                {group.permissions.map(
                                                    (permission) => (
                                                        <label
                                                            key={permission.id}
                                                            className="flex cursor-pointer items-start gap-2 rounded-md p-1 hover:bg-muted/50"
                                                        >
                                                            <Checkbox
                                                                checked={selectedPermissions.includes(
                                                                    permission.name,
                                                                )}
                                                                onCheckedChange={() =>
                                                                    togglePermission(
                                                                        permission.name,
                                                                    )
                                                                }
                                                                className="mt-0.5"
                                                            />

                                                            <span className="text-sm">
                                                                {
                                                                    permission.name
                                                                }
                                                            </span>
                                                        </label>
                                                    ),
                                                )}
                                            </div>
                                        </div>
                                    ),
                                )}
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() =>
                                setIsAddOpen(false)
                            }
                        >
                            Cancel
                        </Button>

                        <Button onClick={handleAdd}>
                            Add Role
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* =========================================
                EDIT ROLE MODAL
            ========================================= */}

            <Dialog
                open={isEditOpen}
                onOpenChange={setIsEditOpen}
            >
                <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>
                            Edit Role
                        </DialogTitle>

                        <DialogDescription>
                            Update the role details and its permissions.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-5 py-4">

                        {/* Name */}
                        <div>
                            <label className="mb-2 block text-sm font-medium">
                                Role Name
                            </label>

                            <Input
                                value={name}
                                onChange={(event) =>
                                    setName(
                                        event.target.value,
                                    )
                                }
                            />

                            <p className="mt-1 text-xs text-muted-foreground">
                                Slug: {selectedRole?.slug}
                            </p>
                        </div>

                        {/* Description */}
                        <div>
                            <label className="mb-2 block text-sm font-medium">
                                Description
                            </label>

                            <Input
                                value={description}
                                onChange={(event) =>
                                    setDescription(
                                        event.target.value,
                                    )
                                }
                            />
                        </div>

                        {/* Permissions */}
                        <div>
                            <label className="mb-2 block text-sm font-medium">
                                Permissions
                            </label>

                            <div className="space-y-4">
                                {permissionGroups.map(
                                    (group) => (
                                        <div
                                            key={group.group}
                                            className="rounded-lg border p-4"
                                        >
                                            <div className="mb-3 flex items-center justify-between">
                                                <span className="text-sm font-semibold">
                                                    {group.group}
                                                </span>

                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        toggleGroup(group)
                                                    }
                                                    className="text-xs font-medium text-orange-600 hover:underline"
                                                >
                                                    {isGroupFullySelected(group)
                                                        ? 'Deselect all'
                                                        : 'Select all'}
                                                </button>
                                            </div>

                                            <div className="grid gap-2 sm:grid-cols-2">
                                                {group.permissions.map(
                                                    (permission) => (
                                                        <label
                                                            key={permission.id}
                                                            className="flex cursor-pointer items-start gap-2 rounded-md p-1 hover:bg-muted/50"
                                                        >
                                                            <Checkbox
                                                                checked={selectedPermissions.includes(
                                                                    permission.name,
                                                                )}
                                                                onCheckedChange={() =>
                                                                    togglePermission(
                                                                        permission.name,
                                                                    )
                                                                }
                                                                className="mt-0.5"
                                                            />

                                                            <span className="text-sm">
                                                                {
                                                                    permission.name
                                                                }
                                                            </span>
                                                        </label>
                                                    ),
                                                )}
                                            </div>
                                        </div>
                                    ),
                                )}
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() =>
                                setIsEditOpen(false)
                            }
                        >
                            Cancel
                        </Button>

                        <Button onClick={handleUpdate}>
                            Update Role
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* =========================================
                DELETE ROLE MODAL
            ========================================= */}

            <Dialog
                open={isDeleteOpen}
                onOpenChange={setIsDeleteOpen}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            Delete Role?
                        </DialogTitle>

                        <DialogDescription>
                            Are you sure you want to delete the role{' '}
                            <strong>
                                {selectedRole?.name}
                            </strong>
                            ? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() =>
                                setIsDeleteOpen(false)
                            }
                        >
                            Cancel
                        </Button>

                        <Button
                            variant="destructive"
                            onClick={handleDelete}
                        >
                            Delete Role
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

RolesIndex.layout = {
    breadcrumbs: [
        {
            title: 'Roles',
            href: rolesIndex.url(),
        },
    ],
};
