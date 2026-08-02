
import { Head, router } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import {
    KeyRound,
    Pencil,
    Plus,
    Search,
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
    index as permissionsIndex,
    store as permissionsStore,
    update as permissionsUpdate,
    destroy as permissionsDestroy,
} from '@/routes/admin/permissions';

type Permission = {
    id: number;
    name: string;
    guard_name: string;
    group: string | null;
};

type Props = {
    permissions: Permission[];
};

export default function PermissionsIndex({
    permissions,
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
    // Selected permission
    // -----------------------------------------

    const [selectedPermission, setSelectedPermission] =
        useState<Permission | null>(null);

    // -----------------------------------------
    // Form fields
    // -----------------------------------------

    const [name, setName] = useState('');
    const [group, setGroup] = useState('');

    // -----------------------------------------
    // Filtered permissions
    // -----------------------------------------

    const filteredPermissions = useMemo(() => {
        const term = search.toLowerCase();

        return permissions.filter((permission) => {
            return (
                permission.name
                    .toLowerCase()
                    .includes(term) ||
                (permission.group ?? '')
                    .toLowerCase()
                    .includes(term)
            );
        });
    }, [permissions, search]);

    const existingGroups = useMemo(() => {
        return Array.from(
            new Set(
                permissions
                    .map((permission) => permission.group)
                    .filter((group): group is string => Boolean(group)),
            ),
        ).sort();
    }, [permissions]);

    // -----------------------------------------
    // Reset form
    // -----------------------------------------

    const resetForm = () => {
        setName('');
        setGroup('');
    };

    // -----------------------------------------
    // Open Add Modal
    // -----------------------------------------

    const openAddModal = () => {
        resetForm();
        setSelectedPermission(null);
        setIsAddOpen(true);
    };

    // -----------------------------------------
    // Open Edit Modal
    // -----------------------------------------

    const openEditModal = (permission: Permission) => {
        setSelectedPermission(permission);

        setName(permission.name);
        setGroup(permission.group ?? '');

        setIsEditOpen(true);
    };

    // -----------------------------------------
    // Open Delete Modal
    // -----------------------------------------

    const openDeleteModal = (permission: Permission) => {
        setSelectedPermission(permission);
        setIsDeleteOpen(true);
    };

    // -----------------------------------------
    // Add Permission
    // -----------------------------------------

    const handleAdd = () => {
        if (!name.trim()) {
            return;
        }

        router.post(
            permissionsStore.url(),
            {
                name: name.trim(),
                group: group || null,
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
    // Update Permission
    // -----------------------------------------

    const handleUpdate = () => {
        if (!selectedPermission || !name.trim()) {
            return;
        }

        router.put(
            permissionsUpdate.url(selectedPermission.id),
            {
                name: name.trim(),
                group: group || null,
            },
            {
                onSuccess: () => {
                    setIsEditOpen(false);
                    setSelectedPermission(null);
                    resetForm();
                },
            },
        );
    };

    // -----------------------------------------
    // Delete Permission
    // -----------------------------------------

    const handleDelete = () => {
        if (!selectedPermission) {
            return;
        }

        router.delete(
            permissionsDestroy.url(selectedPermission.id),
            {
                onSuccess: () => {
                    setIsDeleteOpen(false);
                    setSelectedPermission(null);
                },
            },
        );
    };

    return (
        <>
            <Head title="Permissions" />

            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl p-4">

                {/* =========================================
                    PAGE HEADER
                ========================================= */}

                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <Heading
                        title="Permissions"
                        description="Manage the permissions that roles can be granted."
                        icon={KeyRound}
                    />

                    {can('create permissions') && (
                        <Button onClick={openAddModal}>
                            <Plus className="mr-2 h-4 w-4" />
                            Add Permission
                        </Button>
                    )}
                </div>

                {/* =========================================
                    PERMISSIONS CARD
                ========================================= */}

                <Card>
                    <CardHeader>
                        <CardTitle>
                            System Permissions
                        </CardTitle>

                        <div className="relative max-w-sm pt-4">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

                            <Input
                                placeholder="Search permissions..."
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
                        {filteredPermissions.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-center">
                                <p className="text-lg font-medium">
                                    No permissions found
                                </p>

                                <p className="mt-1 text-sm text-muted-foreground">
                                    Try changing your search or add a new permission.
                                </p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b text-left">
                                            <th className="p-3">
                                                Permission
                                            </th>

                                            <th className="p-3">
                                                Group
                                            </th>

                                            <th className="p-3 text-right">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>

                                    <tbody>
                                        {filteredPermissions.map(
                                            (permission) => (
                                                <tr
                                                    key={permission.id}
                                                    className="border-b last:border-0 hover:bg-muted/50"
                                                >
                                                    {/* Name */}
                                                    <td className="p-3 font-medium">
                                                        {permission.name}
                                                    </td>

                                                    {/* Group */}
                                                    <td className="p-3">
                                                        {permission.group ? (
                                                            <Badge variant="secondary">
                                                                {
                                                                    permission.group
                                                                }
                                                            </Badge>
                                                        ) : (
                                                            <span className="text-xs text-muted-foreground">
                                                                Ungrouped
                                                            </span>
                                                        )}
                                                    </td>

                                                    {/* Actions */}
                                                    <td className="p-3">
                                                        <div className="flex items-center justify-end gap-2">
                                                            {can('update permissions') && (
                                                                <Button
                                                                    variant="outline"
                                                                    size="icon"
                                                                    onClick={() =>
                                                                        openEditModal(
                                                                            permission,
                                                                        )
                                                                    }
                                                                    title="Edit permission"
                                                                >
                                                                    <Pencil className="h-4 w-4" />
                                                                </Button>
                                                            )}

                                                            {can('delete permissions') && (
                                                                <Button
                                                                    variant="destructive"
                                                                    size="icon"
                                                                    onClick={() =>
                                                                        openDeleteModal(
                                                                            permission,
                                                                        )
                                                                    }
                                                                    title="Delete permission"
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
                ADD PERMISSION MODAL
            ========================================= */}

            <Dialog
                open={isAddOpen}
                onOpenChange={setIsAddOpen}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            Add Permission
                        </DialogTitle>

                        <DialogDescription>
                            Create a new permission.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">

                        {/* Name */}
                        <div>
                            <label className="mb-2 block text-sm font-medium">
                                Permission Name
                            </label>

                            <Input
                                value={name}
                                onChange={(event) =>
                                    setName(
                                        event.target.value,
                                    )
                                }
                                placeholder="e.g. view reports"
                            />

                            <p className="mt-1 text-xs text-muted-foreground">
                                Use the format: action resource, e.g.{' '}
                                <code className="text-xs">view reports</code>.
                            </p>
                        </div>

                        {/* Group */}
                        <div>
                            <label className="mb-2 block text-sm font-medium">
                                Group
                            </label>

                            <Input
                                value={group}
                                onChange={(event) =>
                                    setGroup(
                                        event.target.value,
                                    )
                                }
                                placeholder="e.g. Reports"
                                list="permission-groups"
                            />

                            <datalist id="permission-groups">
                                {existingGroups.map((existingGroup) => (
                                    <option
                                        key={existingGroup}
                                        value={existingGroup}
                                    />
                                ))}
                            </datalist>
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
                            Add Permission
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* =========================================
                EDIT PERMISSION MODAL
            ========================================= */}

            <Dialog
                open={isEditOpen}
                onOpenChange={setIsEditOpen}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            Edit Permission
                        </DialogTitle>

                        <DialogDescription>
                            Update the permission details.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">

                        {/* Name */}
                        <div>
                            <label className="mb-2 block text-sm font-medium">
                                Permission Name
                            </label>

                            <Input
                                value={name}
                                onChange={(event) =>
                                    setName(
                                        event.target.value,
                                    )
                                }
                            />

                            <p className="mt-1 text-xs text-amber-600">
                                Warning: renaming a permission that is referenced
                                by the application's routes will affect access control
                                until it is renamed back.
                            </p>
                        </div>

                        {/* Group */}
                        <div>
                            <label className="mb-2 block text-sm font-medium">
                                Group
                            </label>

                            <Input
                                value={group}
                                onChange={(event) =>
                                    setGroup(
                                        event.target.value,
                                    )
                                }
                                list="permission-groups-edit"
                            />

                            <datalist id="permission-groups-edit">
                                {existingGroups.map((existingGroup) => (
                                    <option
                                        key={existingGroup}
                                        value={existingGroup}
                                    />
                                ))}
                            </datalist>
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
                            Update Permission
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* =========================================
                DELETE PERMISSION MODAL
            ========================================= */}

            <Dialog
                open={isDeleteOpen}
                onOpenChange={setIsDeleteOpen}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            Delete Permission?
                        </DialogTitle>

                        <DialogDescription>
                            Are you sure you want to delete the permission{' '}
                            <strong>
                                {selectedPermission?.name}
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
                            Delete Permission
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

PermissionsIndex.layout = {
    breadcrumbs: [
        {
            title: 'Permissions',
            href: permissionsIndex.url(),
        },
    ],
};
