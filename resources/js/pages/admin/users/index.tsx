import { Head, router } from '@inertiajs/react';
import { Eye, Pencil, Plus, Search, Trash2, Users } from 'lucide-react';
import { useState } from 'react';

import Heading from '@/components/heading';
import StatusToggle from '@/components/status-toggle';

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

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useCan } from '@/hooks/use-can';

import {
    index as usersIndex,
    store as usersStore,
    update as usersUpdate,
    destroy as usersDestroy,
} from '@/routes/admin/users';

import type { PaginatedData } from '@/types';

type Role = {
    id: number;
    name: string;
};

type Branch = {
    id: number;
    name: string;
};

type User = {
    id: number;
    name: string;
    email: string;
    phone: string | null;
    is_active: boolean;
    role_id: number;
    branch_id: number | null;
    role: Role | null;
};

type Props = {
    users: PaginatedData<User>;
    roles: Role[];
    branches: Branch[];
    currentBranchId: number | null;
    filters: {
        search?: string;
        role?: string;
    };
};

export default function UsersIndex({
    users,
    roles,
    branches,
    currentBranchId,
    filters,
}: Props) {
    const can = useCan();

    // -----------------------------------------
    // Search and filters
    // -----------------------------------------

    const [search, setSearch] = useState(filters.search || '');

    // -----------------------------------------
    // Modal states
    // -----------------------------------------

    const [isAddOpen, setIsAddOpen] = useState(false);
    const [isViewOpen, setIsViewOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);

    // -----------------------------------------
    // Selected user
    // -----------------------------------------

    const [selectedUser, setSelectedUser] = useState<User | null>(null);

    // -----------------------------------------
    // Form fields
    // -----------------------------------------

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [roleId, setRoleId] = useState('');
    const [branchId, setBranchId] = useState(
        currentBranchId
            ? String(currentBranchId)
            : branches.length > 0
              ? String(branches[0].id)
              : '',
    );
    const [password, setPassword] = useState('');
    const [passwordConfirmation, setPasswordConfirmation] = useState('');
    const [isActive, setIsActive] = useState(true);

    // -----------------------------------------
    // Search
    // -----------------------------------------

    const handleSearch = (value: string) => {
        setSearch(value);

        router.get(
            usersIndex.url(),
            {
                search: value,
                role: filters.role,
            },
            {
                preserveState: true,
                replace: true,
            },
        );
    };

    // -----------------------------------------
    // Role filter
    // -----------------------------------------

    const handleRoleFilter = (value: string) => {
        router.get(
            usersIndex.url(),
            {
                search,
                role: value === 'all' ? undefined : value,
            },
            {
                preserveState: true,
                replace: true,
            },
        );
    };

    // -----------------------------------------
    // Reset form
    // -----------------------------------------

    const resetForm = () => {
        setName('');
        setEmail('');
        setPhone('');
        setRoleId('');
        setBranchId(
            currentBranchId
                ? String(currentBranchId)
                : branches.length > 0
                  ? String(branches[0].id)
                  : '',
        );
        setPassword('');
        setPasswordConfirmation('');
        setIsActive(true);
    };

    // -----------------------------------------
    // Open Add Modal
    // -----------------------------------------

    const openAddModal = () => {
        resetForm();
        setSelectedUser(null);
        setIsAddOpen(true);
    };

    // -----------------------------------------
    // Open View Modal
    // -----------------------------------------

    const openViewModal = (user: User) => {
        setSelectedUser(user);
        setIsViewOpen(true);
    };

    // -----------------------------------------
    // Open Edit Modal
    // -----------------------------------------

    const openEditModal = (user: User) => {
        setSelectedUser(user);

        setName(user.name);
        setEmail(user.email);
        setPhone(user.phone || '');
        setRoleId(String(user.role_id));
        setBranchId(user.branch_id ? String(user.branch_id) : '');
        setPassword('');
        setPasswordConfirmation('');
        setIsActive(user.is_active);

        setIsEditOpen(true);
    };

    // -----------------------------------------
    // Open Delete Modal
    // -----------------------------------------

    const openDeleteModal = (user: User) => {
        setSelectedUser(user);
        setIsDeleteOpen(true);
    };

    // -----------------------------------------
    // Add User
    // -----------------------------------------

    const handleAdd = () => {
        if (!name.trim() || !email.trim() || !roleId) {
            return;
        }

        router.post(
            usersStore.url(),
            {
                name,
                email,
                phone: phone || null,
                role_id: Number(roleId),
                branch_id: Number(branchId),
                password: password || null,
                password_confirmation: passwordConfirmation || null,
                is_active: isActive,
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
    // Update User
    // -----------------------------------------

    const handleUpdate = () => {
        if (!selectedUser || !name.trim() || !email.trim() || !roleId) {
            return;
        }

        router.put(
            usersUpdate.url(selectedUser.id),
            {
                name,
                email,
                phone: phone || null,
                role_id: Number(roleId),
                branch_id: Number(branchId),
                password: password || null,
                password_confirmation: passwordConfirmation || null,
                is_active: isActive,
            },
            {
                onSuccess: () => {
                    setIsEditOpen(false);
                    setSelectedUser(null);
                    resetForm();
                },
            },
        );
    };

    // -----------------------------------------
    // Toggle User Status
    // -----------------------------------------

    const handleToggleStatus = (user: User) => {
        router.patch(
            `/admin/users/${user.id}/toggle-status`,
            {},
            {
                preserveScroll: true,
            },
        );
    };

    // -----------------------------------------
    // Delete User
    // -----------------------------------------

    const handleDelete = () => {
        if (!selectedUser) {
            return;
        }

        router.delete(usersDestroy.url(selectedUser.id), {
            onSuccess: () => {
                setIsDeleteOpen(false);
                setSelectedUser(null);
            },
        });
    };

    return (
        <>
            <Head title="Users" />

            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl p-4">
                {/* =========================================
                    PAGE HEADER
                ========================================= */}

                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <Heading
                        title="Users"
                        description="Manage system users and their roles."
                        icon={Users}
                    />

                    {can('create users') && (
                        <Button onClick={openAddModal}>
                            <Plus className="mr-2 h-4 w-4" />
                            Add User
                        </Button>
                    )}
                </div>

                {/* =========================================
                    USERS CARD
                ========================================= */}

                <Card>
                    <CardHeader>
                        <CardTitle>System Users</CardTitle>

                        <div className="flex flex-wrap gap-3 pt-4">
                            {/* Search */}

                            <div className="relative max-w-sm flex-1">
                                <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

                                <Input
                                    placeholder="Search users..."
                                    value={search}
                                    onChange={(event) =>
                                        handleSearch(event.target.value)
                                    }
                                    className="pl-9"
                                />
                            </div>

                            {/* Role Filter */}

                            <Select
                                value={filters.role || 'all'}
                                onValueChange={handleRoleFilter}
                            >
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="All Roles" />
                                </SelectTrigger>

                                <SelectContent>
                                    <SelectItem value="all">
                                        All Roles
                                    </SelectItem>

                                    {roles.map((role) => (
                                        <SelectItem
                                            key={role.id}
                                            value={String(role.id)}
                                        >
                                            {role.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </CardHeader>

                    <CardContent>
                        {users.data.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-center">
                                <p className="text-lg font-medium">
                                    No users found
                                </p>

                                <p className="mt-1 text-sm text-muted-foreground">
                                    Try changing your search or add a new user.
                                </p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b text-left">
                                            <th className="p-3">Name</th>

                                            <th className="p-3">Email</th>

                                            <th className="p-3">Phone</th>

                                            <th className="p-3">Role</th>

                                            <th className="p-3">Status</th>

                                            <th className="p-3 text-right">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>

                                    <tbody>
                                        {users.data.map((user) => (
                                            <tr
                                                key={user.id}
                                                className="border-b last:border-0 hover:bg-muted/50"
                                            >
                                                {/* Name */}

                                                <td className="p-3 font-medium">
                                                    {user.name}
                                                </td>

                                                {/* Email */}

                                                <td className="p-3 text-muted-foreground">
                                                    {user.email}
                                                </td>

                                                {/* Phone */}

                                                <td className="p-3 text-muted-foreground">
                                                    {user.phone || '—'}
                                                </td>

                                                {/* Role */}

                                                <td className="p-3">
                                                    <Badge variant="secondary">
                                                        {user.role?.name ||
                                                            'No Role'}
                                                    </Badge>
                                                </td>

                                                {/* Status */}

                                                <td className="p-3">
                                                    <Badge
                                                        variant={
                                                            user.is_active
                                                                ? 'default'
                                                                : 'destructive'
                                                        }
                                                    >
                                                        {user.is_active
                                                            ? 'Active'
                                                            : 'Inactive'}
                                                    </Badge>
                                                </td>

                                                {/* Actions */}

                                                <td className="p-3">
                                                    <div className="flex items-center justify-end gap-2">
                                                        {/* Shared Status Toggle */}

                                                        {can(
                                                            'status users',
                                                        ) && (
                                                            <StatusToggle
                                                                checked={
                                                                    user.is_active
                                                                }
                                                                onCheckedChange={() =>
                                                                    handleToggleStatus(
                                                                        user,
                                                                    )
                                                                }
                                                                onLabel="Active"
                                                                offLabel="Inactive"
                                                                ariaLabel={`Toggle status for ${user.name}`}
                                                            />
                                                        )}

                                                        {/* View */}

                                                        {can('view users') && (
                                                            <Button
                                                                variant="outline"
                                                                size="icon"
                                                                onClick={() =>
                                                                    openViewModal(
                                                                        user,
                                                                    )
                                                                }
                                                                title="View user"
                                                            >
                                                                <Eye className="h-4 w-4" />
                                                            </Button>
                                                        )}

                                                        {/* Edit */}

                                                        {can(
                                                            'update users',
                                                        ) && (
                                                            <Button
                                                                variant="outline"
                                                                size="icon"
                                                                onClick={() =>
                                                                    openEditModal(
                                                                        user,
                                                                    )
                                                                }
                                                                title="Edit user"
                                                            >
                                                                <Pencil className="h-4 w-4" />
                                                            </Button>
                                                        )}

                                                        {/* Delete */}

                                                        {can(
                                                            'delete users',
                                                        ) && (
                                                            <Button
                                                                variant="destructive"
                                                                size="icon"
                                                                onClick={() =>
                                                                    openDeleteModal(
                                                                        user,
                                                                    )
                                                                }
                                                                title="Delete user"
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* =========================================
                            PAGINATION
                        ========================================= */}

                        {users.last_page > 1 && (
                            <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
                                {users.links.map((link, index) => (
                                    <Button
                                        key={index}
                                        variant={
                                            link.active ? 'default' : 'outline'
                                        }
                                        size="sm"
                                        disabled={!link.url}
                                        onClick={() => {
                                            if (link.url) {
                                                router.get(
                                                    link.url,
                                                    {},
                                                    {
                                                        preserveState: true,
                                                    },
                                                );
                                            }
                                        }}
                                    >
                                        <span
                                            dangerouslySetInnerHTML={{
                                                __html: link.label,
                                            }}
                                        />
                                    </Button>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* =========================================
                ADD USER MODAL
            ========================================= */}

            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>Add User</DialogTitle>

                        <DialogDescription>
                            Create a new system user.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        {/* Name */}

                        <div>
                            <label className="mb-2 block text-sm font-medium">
                                Full Name
                            </label>

                            <Input
                                value={name}
                                onChange={(event) =>
                                    setName(event.target.value)
                                }
                                placeholder="Enter full name"
                            />
                        </div>

                        {/* Email */}

                        <div>
                            <label className="mb-2 block text-sm font-medium">
                                Email
                            </label>

                            <Input
                                type="email"
                                value={email}
                                onChange={(event) =>
                                    setEmail(event.target.value)
                                }
                                placeholder="Enter email address"
                            />
                        </div>

                        {/* Phone */}

                        <div>
                            <label className="mb-2 block text-sm font-medium">
                                Phone
                            </label>

                            <Input
                                value={phone}
                                onChange={(event) =>
                                    setPhone(event.target.value)
                                }
                                placeholder="Enter phone number"
                            />
                        </div>

                        {/* Role */}

                        <div>
                            <label className="mb-2 block text-sm font-medium">
                                Role
                            </label>

                            <Select value={roleId} onValueChange={setRoleId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a role" />
                                </SelectTrigger>

                                <SelectContent>
                                    {roles.map((role) => (
                                        <SelectItem
                                            key={role.id}
                                            value={String(role.id)}
                                        >
                                            {role.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Branch */}

                        <div>
                            <label className="mb-2 block text-sm font-medium">
                                Branch
                            </label>

                            <Select
                                value={branchId}
                                onValueChange={setBranchId}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a branch" />
                                </SelectTrigger>

                                <SelectContent>
                                    {branches.map((branch) => (
                                        <SelectItem
                                            key={branch.id}
                                            value={String(branch.id)}
                                        >
                                            {branch.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Password */}

                        <div>
                            <label className="mb-2 block text-sm font-medium">
                                Password
                            </label>

                            <Input
                                type="password"
                                value={password}
                                onChange={(event) =>
                                    setPassword(event.target.value)
                                }
                                placeholder="Leave empty for default password"
                            />

                            <p className="mt-1 text-xs text-muted-foreground">
                                If left empty, the default password will be
                                used.
                            </p>
                        </div>

                        {/* Confirm Password */}

                        <div>
                            <label className="mb-2 block text-sm font-medium">
                                Confirm Password
                            </label>

                            <Input
                                type="password"
                                value={passwordConfirmation}
                                onChange={(event) =>
                                    setPasswordConfirmation(event.target.value)
                                }
                                placeholder="Confirm password"
                            />
                        </div>

                        {/* Active */}

                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                checked={isActive}
                                onChange={(event) =>
                                    setIsActive(event.target.checked)
                                }
                                className="h-4 w-4"
                            />

                            <label className="text-sm font-medium">
                                Active User
                            </label>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setIsAddOpen(false)}
                        >
                            Cancel
                        </Button>

                        <Button onClick={handleAdd}>Add User</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* =========================================
                VIEW USER MODAL
            ========================================= */}

            <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>User Details</DialogTitle>

                        <DialogDescription>
                            View user account information.
                        </DialogDescription>
                    </DialogHeader>

                    {selectedUser && (
                        <div className="space-y-5 py-4">
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div>
                                    <p className="text-sm text-muted-foreground">
                                        Name
                                    </p>

                                    <p className="font-medium">
                                        {selectedUser.name}
                                    </p>
                                </div>

                                <div>
                                    <p className="text-sm text-muted-foreground">
                                        Role
                                    </p>

                                    <Badge variant="secondary">
                                        {selectedUser.role?.name || 'No Role'}
                                    </Badge>
                                </div>

                                <div>
                                    <p className="text-sm text-muted-foreground">
                                        Email
                                    </p>

                                    <p className="font-medium">
                                        {selectedUser.email}
                                    </p>
                                </div>

                                <div>
                                    <p className="text-sm text-muted-foreground">
                                        Phone
                                    </p>

                                    <p className="font-medium">
                                        {selectedUser.phone || 'Not provided'}
                                    </p>
                                </div>

                                <div>
                                    <p className="text-sm text-muted-foreground">
                                        Status
                                    </p>

                                    <Badge
                                        variant={
                                            selectedUser.is_active
                                                ? 'default'
                                                : 'destructive'
                                        }
                                    >
                                        {selectedUser.is_active
                                            ? 'Active'
                                            : 'Inactive'}
                                    </Badge>
                                </div>
                            </div>
                        </div>
                    )}

                    <DialogFooter>
                        <Button onClick={() => setIsViewOpen(false)}>
                            Close
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* =========================================
                EDIT USER MODAL
            ========================================= */}

            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>Edit User</DialogTitle>

                        <DialogDescription>
                            Update the user's account information.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        {/* Name */}

                        <div>
                            <label className="mb-2 block text-sm font-medium">
                                Full Name
                            </label>

                            <Input
                                value={name}
                                onChange={(event) =>
                                    setName(event.target.value)
                                }
                            />
                        </div>

                        {/* Email */}

                        <div>
                            <label className="mb-2 block text-sm font-medium">
                                Email
                            </label>

                            <Input
                                type="email"
                                value={email}
                                onChange={(event) =>
                                    setEmail(event.target.value)
                                }
                            />
                        </div>

                        {/* Phone */}

                        <div>
                            <label className="mb-2 block text-sm font-medium">
                                Phone
                            </label>

                            <Input
                                value={phone}
                                onChange={(event) =>
                                    setPhone(event.target.value)
                                }
                            />
                        </div>

                        {/* Role */}

                        <div>
                            <label className="mb-2 block text-sm font-medium">
                                Role
                            </label>

                            <Select value={roleId} onValueChange={setRoleId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a role" />
                                </SelectTrigger>

                                <SelectContent>
                                    {roles.map((role) => (
                                        <SelectItem
                                            key={role.id}
                                            value={String(role.id)}
                                        >
                                            {role.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Branch */}

                        <div>
                            <label className="mb-2 block text-sm font-medium">
                                Branch
                            </label>

                            <Select
                                value={branchId}
                                onValueChange={setBranchId}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a branch" />
                                </SelectTrigger>

                                <SelectContent>
                                    {branches.map((branch) => (
                                        <SelectItem
                                            key={branch.id}
                                            value={String(branch.id)}
                                        >
                                            {branch.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* New Password */}

                        <div>
                            <label className="mb-2 block text-sm font-medium">
                                New Password
                            </label>

                            <Input
                                type="password"
                                value={password}
                                onChange={(event) =>
                                    setPassword(event.target.value)
                                }
                                placeholder="Leave empty to keep current password"
                            />
                        </div>

                        {/* Confirm New Password */}

                        <div>
                            <label className="mb-2 block text-sm font-medium">
                                Confirm New Password
                            </label>

                            <Input
                                type="password"
                                value={passwordConfirmation}
                                onChange={(event) =>
                                    setPasswordConfirmation(event.target.value)
                                }
                                placeholder="Confirm new password"
                            />
                        </div>

                        {/* Active */}

                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                checked={isActive}
                                onChange={(event) =>
                                    setIsActive(event.target.checked)
                                }
                                className="h-4 w-4"
                            />

                            <label className="text-sm font-medium">
                                Active User
                            </label>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setIsEditOpen(false)}
                        >
                            Cancel
                        </Button>

                        <Button onClick={handleUpdate}>Update User</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* =========================================
                DELETE USER MODAL
            ========================================= */}

            <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete User?</DialogTitle>

                        <DialogDescription>
                            Are you sure you want to delete{' '}
                            <strong>{selectedUser?.name}</strong>? This action
                            cannot be undone.
                        </DialogDescription>
                    </DialogHeader>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setIsDeleteOpen(false)}
                        >
                            Cancel
                        </Button>

                        <Button variant="destructive" onClick={handleDelete}>
                            Delete User
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

UsersIndex.layout = {
    breadcrumbs: [
        {
            title: 'Users',
            href: usersIndex.url(),
        },
    ],
};
