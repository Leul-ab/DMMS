import { Head, router } from '@inertiajs/react';
import {
    CheckSquare,
    ChevronDown,
    ChevronUp,
    Clock,
    Eye,
    KeyRound,
    LoaderCircle,
    Pencil,
    Plus,
    Search,
    ShieldCheck,
    Trash2,
    Users,
} from 'lucide-react';
import { useLayoutEffect, useState } from 'react';

import Heading from '@/components/heading';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

import { Card, CardContent } from '@/components/ui/card';

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
import { useCan } from '@/hooks/use-can';

import {
    index as rolesIndex,
    store as rolesStore,
    update as rolesUpdate,
    destroy as rolesDestroy,
} from '@/routes/admin/roles';

// -----------------------------------------
// Types
// -----------------------------------------

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
    created_at: string | null;
    users_count: number;
    permissions_count: number;
    permissions: string[];
};

type Props = {
    roles: RoleData[];
    permissionGroups: PermissionGroup[];
};

// -----------------------------------------
// Permission picker
// -----------------------------------------

function PermissionPicker({
    permissionGroups,
    selectedPermissions,
    onTogglePermission,
    onToggleGroup,
    onToggleSelectAll,
}: {
    permissionGroups: PermissionGroup[];
    selectedPermissions: string[];
    onTogglePermission: (name: string) => void;
    onToggleGroup: (group: PermissionGroup) => void;
    onToggleSelectAll: () => void;
}) {
    const [search, setSearch] = useState('');
    const [collapsedGroups, setCollapsedGroups] = useState<
        Record<string, boolean>
    >({});

    const term = search.trim().toLowerCase();
    const isSearching = term.length > 0;

    const filteredGroups = permissionGroups
        .map((group) => ({
            ...group,
            permissions: group.permissions.filter((permission) =>
                permission.name.toLowerCase().includes(term),
            ),
        }))
        .filter((group) => group.permissions.length > 0);

    const allPermissionNames = permissionGroups.flatMap((group) =>
        group.permissions.map((permission) => permission.name),
    );

    const allSelected =
        allPermissionNames.length > 0 &&
        allPermissionNames.every((name) => selectedPermissions.includes(name));

    const toggleCollapsed = (groupName: string) => {
        setCollapsedGroups((prev) => ({
            ...prev,
            [groupName]: !prev[groupName],
        }));
    };

    const isExpanded = (groupName: string) =>
        isSearching ? true : !collapsedGroups[groupName];

    return (
        <div>
            {/* Header */}
            <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="relative flex-1">
                    <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

                    <Input
                        placeholder="Search permissions..."
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        className="pl-9"
                    />
                </div>

                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={onToggleSelectAll}
                >
                    <CheckSquare className="h-4 w-4" />
                    {allSelected ? 'Clear All' : 'Select All'}
                </Button>
            </div>

            {/* Selected counter */}
            <p className="mb-3 text-xs text-muted-foreground">
                {selectedPermissions.length} of {allPermissionNames.length}{' '}
                permissions selected
            </p>

            {/* Groups */}
            <div className="max-h-[45vh] space-y-3 overflow-y-auto pr-1">
                {filteredGroups.map((group) => {
                    const groupNames = group.permissions.map(
                        (permission) => permission.name,
                    );

                    const isGroupFullySelected = groupNames.every((name) =>
                        selectedPermissions.includes(name),
                    );

                    const hasGroupSelection = groupNames.some((name) =>
                        selectedPermissions.includes(name),
                    );

                    const expanded = isExpanded(group.group);

                    return (
                        <div key={group.group} className="rounded-lg border">
                            <div className="flex items-center justify-between p-3">
                                <div className="flex items-center gap-2">
                                    <Checkbox
                                        checked={
                                            isGroupFullySelected
                                                ? true
                                                : hasGroupSelection
                                                  ? 'indeterminate'
                                                  : false
                                        }
                                        onCheckedChange={() =>
                                            onToggleGroup(group)
                                        }
                                    />

                                    <span className="text-sm font-semibold">
                                        {group.group}
                                    </span>

                                    <span className="text-xs text-muted-foreground">
                                        {
                                            groupNames.filter((name) =>
                                                selectedPermissions.includes(
                                                    name,
                                                ),
                                            ).length
                                        }
                                        /{groupNames.length}
                                    </span>
                                </div>

                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => toggleCollapsed(group.group)}
                                    title={
                                        expanded
                                            ? 'Collapse group'
                                            : 'Expand group'
                                    }
                                >
                                    {expanded ? (
                                        <ChevronUp className="h-4 w-4" />
                                    ) : (
                                        <ChevronDown className="h-4 w-4" />
                                    )}
                                </Button>
                            </div>

                            {expanded && (
                                <div className="grid gap-2 border-t p-3 sm:grid-cols-2">
                                    {group.permissions.map((permission) => (
                                        <label
                                            key={permission.id}
                                            className="flex cursor-pointer items-start gap-2 rounded-md p-1 hover:bg-muted/50"
                                        >
                                            <Checkbox
                                                checked={selectedPermissions.includes(
                                                    permission.name,
                                                )}
                                                onCheckedChange={() =>
                                                    onTogglePermission(
                                                        permission.name,
                                                    )
                                                }
                                                className="mt-0.5"
                                            />

                                            <span className="text-sm">
                                                {permission.name}
                                            </span>
                                        </label>
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                })}

                {filteredGroups.length === 0 && (
                    <div className="rounded-lg border border-dashed py-10 text-center text-sm text-muted-foreground">
                        No permissions match your search.
                    </div>
                )}
            </div>
        </div>
    );
}

// -----------------------------------------
// Create / Edit dialog
// -----------------------------------------

function RoleFormDialog({
    open,
    onOpenChange,
    mode,
    role,
    permissionGroups,
    onSave,
    submitting,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    mode: 'create' | 'edit';
    role: RoleData | null;
    permissionGroups: PermissionGroup[];
    onSave: (payload: {
        name: string;
        description: string | null;
        permissions: string[];
    }) => void;
    submitting: boolean;
}) {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [selectedPermissions, setSelectedPermissions] = useState<string[]>(
        [],
    );

    const isEdit = mode === 'edit';

    const reset = () => {
        setName(role?.name ?? '');
        setDescription(role?.description ?? '');
        setSelectedPermissions(role?.permissions ?? []);
    };

    useLayoutEffect(() => {
        if (open) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            reset();
        }
    }, [open, role?.id]);

    const handleOpenChange = (next: boolean) => {
        onOpenChange(next);
    };

    const togglePermission = (permissionName: string) => {
        setSelectedPermissions((prev) =>
            prev.includes(permissionName)
                ? prev.filter((item) => item !== permissionName)
                : [...prev, permissionName],
        );
    };

    const toggleGroup = (group: PermissionGroup) => {
        const groupNames = group.permissions.map(
            (permission) => permission.name,
        );

        setSelectedPermissions((prev) => {
            const allSelected = groupNames.every((item) => prev.includes(item));

            if (allSelected) {
                return prev.filter((item) => !groupNames.includes(item));
            }

            return [...new Set([...prev, ...groupNames])];
        });
    };

    const toggleSelectAll = () => {
        setSelectedPermissions((prev) => {
            const allPermissionNames = permissionGroups.flatMap((group) =>
                group.permissions.map((permission) => permission.name),
            );

            const allSelected = allPermissionNames.every((item) =>
                prev.includes(item),
            );

            return allSelected
                ? []
                : [...new Set([...prev, ...allPermissionNames])];
        });
    };

    const handleSave = () => {
        if (!name.trim()) {
            return;
        }

        onSave({
            name: name.trim(),
            description: description || null,
            permissions: selectedPermissions,
        });
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>
                        {isEdit ? 'Edit Role' : 'Add Role'}
                    </DialogTitle>

                    <DialogDescription>
                        {isEdit
                            ? 'Update the role details and its permissions.'
                            : 'Create a new role and assign permissions to it.'}
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
                            onChange={(event) => setName(event.target.value)}
                            placeholder="e.g. Cashier"
                        />

                        <p className="mt-1 text-xs text-muted-foreground">
                            {isEdit
                                ? `Slug: ${role?.slug}`
                                : 'The slug is generated automatically from the name.'}
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
                                setDescription(event.target.value)
                            }
                            placeholder="e.g. Handles cash transactions"
                        />
                    </div>

                    {/* Permissions */}
                    <div>
                        <label className="mb-2 block text-sm font-medium">
                            Permissions
                        </label>

                        <PermissionPicker
                            permissionGroups={permissionGroups}
                            selectedPermissions={selectedPermissions}
                            onTogglePermission={togglePermission}
                            onToggleGroup={toggleGroup}
                            onToggleSelectAll={toggleSelectAll}
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={submitting}
                    >
                        Cancel
                    </Button>

                    <Button
                        onClick={handleSave}
                        disabled={submitting || !name.trim()}
                    >
                        {submitting && (
                            <LoaderCircle className="h-4 w-4 animate-spin" />
                        )}
                        {isEdit ? 'Update Role' : 'Create Role'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

// -----------------------------------------
// Page
// -----------------------------------------

export default function RolesIndex({ roles, permissionGroups }: Props) {
    const can = useCan();

    // -----------------------------------------
    // Search
    // -----------------------------------------

    const [search, setSearch] = useState('');

    // -----------------------------------------
    // Modal states
    // -----------------------------------------

    const [isFormOpen, setIsFormOpen] = useState(false);
    const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
    const [isShowOpen, setIsShowOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);

    // -----------------------------------------
    // Selected role
    // -----------------------------------------

    const [selectedRole, setSelectedRole] = useState<RoleData | null>(null);

    // -----------------------------------------
    // Submitting
    // -----------------------------------------

    const [isSubmitting, setIsSubmitting] = useState(false);

    // -----------------------------------------
    // Filtered roles
    // -----------------------------------------

    const filteredRoles = roles.filter((role) => {
        const term = search.trim().toLowerCase();

        return (
            role.name.toLowerCase().includes(term) ||
            role.slug.toLowerCase().includes(term) ||
            (role.description ?? '').toLowerCase().includes(term)
        );
    });

    // -----------------------------------------
    // Modal helpers
    // -----------------------------------------

    const openCreateModal = () => {
        setSelectedRole(null);
        setFormMode('create');
        setIsFormOpen(true);
    };

    const openEditModal = (role: RoleData) => {
        setSelectedRole(role);
        setFormMode('edit');
        setIsFormOpen(true);
    };

    const openShowModal = (role: RoleData) => {
        setSelectedRole(role);
        setIsShowOpen(true);
    };

    const openDeleteModal = (role: RoleData) => {
        setSelectedRole(role);
        setIsDeleteOpen(true);
    };

    // -----------------------------------------
    // Submit handlers
    // -----------------------------------------

    const handleCreate = (payload: {
        name: string;
        description: string | null;
        permissions: string[];
    }) => {
        router.post(rolesStore.url(), payload, {
            onSuccess: () => {
                setIsFormOpen(false);
                setSelectedRole(null);
            },
            onStart: () => setIsSubmitting(true),
            onFinish: () => setIsSubmitting(false),
        });
    };

    const handleUpdate = (payload: {
        name: string;
        description: string | null;
        permissions: string[];
    }) => {
        if (!selectedRole) {
            return;
        }

        router.put(rolesUpdate.url(selectedRole.id), payload, {
            onSuccess: () => {
                setIsFormOpen(false);
                setSelectedRole(null);
            },
            onStart: () => setIsSubmitting(true),
            onFinish: () => setIsSubmitting(false),
        });
    };

    const handleDelete = () => {
        if (!selectedRole) {
            return;
        }

        router.delete(rolesDestroy.url(selectedRole.id), {
            onSuccess: () => {
                setIsDeleteOpen(false);
                setSelectedRole(null);
            },
            onStart: () => setIsSubmitting(true),
            onFinish: () => setIsSubmitting(false),
        });
    };

    const handleFormSave = (payload: {
        name: string;
        description: string | null;
        permissions: string[];
    }) => {
        if (formMode === 'edit') {
            handleUpdate(payload);
        } else {
            handleCreate(payload);
        }
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

                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                        <div className="relative">
                            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

                            <Input
                                placeholder="Search roles..."
                                value={search}
                                onChange={(event) =>
                                    setSearch(event.target.value)
                                }
                                className="pl-9"
                            />
                        </div>

                        {can('create roles') && (
                            <Button onClick={openCreateModal}>
                                <Plus className="h-4 w-4" />
                                Add Role
                            </Button>
                        )}
                    </div>
                </div>

                {/* =========================================
                    ROLES GRID
                ========================================= */}

                {filteredRoles.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                        <ShieldCheck className="h-10 w-10 text-muted-foreground" />

                        <p className="mt-3 text-lg font-medium">
                            No roles found
                        </p>

                        <p className="mt-1 text-sm text-muted-foreground">
                            Try changing your search or add a new role.
                        </p>
                    </div>
                ) : (
                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                        {filteredRoles.map((role) => (
                            <Card
                                key={role.id}
                                className="gap-0 py-5 transition-shadow hover:shadow-md"
                            >
                                <CardContent className="flex flex-col">
                                    {/* Header */}
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-100">
                                                <ShieldCheck className="h-5 w-5 text-red-600" />
                                            </div>

                                            <div>
                                                <h3 className="text-lg font-semibold">
                                                    {role.name}
                                                </h3>

                                                <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                                                    <Clock className="h-3.5 w-3.5" />
                                                    Created{' '}
                                                    {role.created_at ?? '—'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Description */}
                                    <p className="mt-4 min-h-10 text-sm text-muted-foreground">
                                        {role.description ||
                                            'No description provided.'}
                                    </p>

                                    {/* Stats */}
                                    <div className="mt-4 flex flex-wrap items-center gap-2">
                                        <Badge
                                            variant="secondary"
                                            className="gap-1"
                                        >
                                            <Users className="h-3.5 w-3.5" />
                                            {role.users_count}{' '}
                                            {role.users_count === 1
                                                ? 'user'
                                                : 'users'}
                                        </Badge>

                                        <Badge
                                            variant="outline"
                                            className="gap-1"
                                        >
                                            <KeyRound className="h-3.5 w-3.5" />
                                            {role.permissions_count}{' '}
                                            {role.permissions_count === 1
                                                ? 'permission'
                                                : 'permissions'}
                                        </Badge>
                                        <div className="ml-auto flex items-center gap-1">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() =>
                                                    openShowModal(role)
                                                }
                                            >
                                                <Eye className="h-4 w-4" />
                                            </Button>
                                            {can('update roles') &&
                                                role.slug !== 'super_admin' && (
                                                    <Button
                                                        variant="outline"
                                                        size="icon"
                                                        onClick={() =>
                                                            openEditModal(role)
                                                        }
                                                        title="Edit role"
                                                    >
                                                        <Pencil className="h-4 w-4" />
                                                    </Button>
                                                )}

                                            {can('delete roles') &&
                                                role.slug !== 'super_admin' && (
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
                                    </div>

                                    {/* Footer */}
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>

            {/* =========================================
                CREATE / EDIT ROLE MODAL
            ========================================= */}

            <RoleFormDialog
                open={isFormOpen}
                onOpenChange={setIsFormOpen}
                mode={formMode}
                role={selectedRole}
                permissionGroups={permissionGroups}
                onSave={handleFormSave}
                submitting={isSubmitting}
            />

            {/* =========================================
                SHOW ROLE MODAL
            ========================================= */}

            <Dialog open={isShowOpen} onOpenChange={setIsShowOpen}>
                <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>{selectedRole?.name}</DialogTitle>

                        <DialogDescription>
                            {selectedRole?.description ||
                                'No description provided.'}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-5 py-4">
                        {/* Meta */}
                        <div className="flex flex-wrap items-center gap-2">
                            <Badge variant="secondary" className="gap-1">
                                <Users className="h-3.5 w-3.5" />
                                {selectedRole?.users_count ?? 0}{' '}
                                {(selectedRole?.users_count ?? 0) === 1
                                    ? 'user'
                                    : 'users'}
                            </Badge>

                            <Badge variant="outline" className="gap-1">
                                <KeyRound className="h-3.5 w-3.5" />
                                {selectedRole?.permissions_count ?? 0}{' '}
                                {(selectedRole?.permissions_count ?? 0) === 1
                                    ? 'permission'
                                    : 'permissions'}
                            </Badge>
                        </div>

                        {/* Assigned permissions */}
                        <div>
                            <h4 className="mb-3 text-sm font-medium">
                                Assigned permissions
                            </h4>

                            {permissionGroups.map((group) => {
                                const assigned = group.permissions.filter(
                                    (permission) =>
                                        selectedRole?.permissions.includes(
                                            permission.name,
                                        ),
                                );

                                if (assigned.length === 0) {
                                    return null;
                                }

                                return (
                                    <div
                                        key={group.group}
                                        className="mb-3 rounded-lg border p-3"
                                    >
                                        <div className="mb-2 text-sm font-semibold">
                                            {group.group}
                                        </div>

                                        <div className="flex flex-wrap gap-1.5">
                                            {assigned.map((permission) => (
                                                <Badge
                                                    key={permission.id}
                                                    variant="outline"
                                                    className="text-xs"
                                                >
                                                    {permission.name}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}

                            {selectedRole?.permissions_count === 0 && (
                                <p className="text-sm text-muted-foreground">
                                    No permissions assigned to this role.
                                </p>
                            )}
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* =========================================
                DELETE ROLE MODAL
            ========================================= */}

            <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Role?</DialogTitle>

                        <DialogDescription>
                            Are you sure you want to delete the role{' '}
                            <strong>{selectedRole?.name}</strong>? This action
                            cannot be undone.
                        </DialogDescription>
                    </DialogHeader>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setIsDeleteOpen(false)}
                            disabled={isSubmitting}
                        >
                            Cancel
                        </Button>

                        <Button
                            variant="destructive"
                            onClick={handleDelete}
                            disabled={isSubmitting}
                        >
                            {isSubmitting && (
                                <LoaderCircle className="h-4 w-4 animate-spin" />
                            )}
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
