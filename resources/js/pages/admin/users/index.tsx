import { Head, router } from '@inertiajs/react';
import { Eye, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { useState } from 'react';

import Heading from '@/components/heading';
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
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

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
    slug: string;
};

type User = {
    id: number;
    name: string;
    email: string;
    phone: string | null;
    is_active: boolean;
    role: Role | null;
    created_at: string;
};

type Props = {
    users: PaginatedData<User>;
    roles: Role[];
    filters: {
        search?: string;
        role?: string;
    };
};

export default function UsersIndex({
    users,
    roles,
    filters,
}: Props) {
    // Search
    const [search, setSearch] = useState(
        filters.search || '',
    );

    // Modal states
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [isViewOpen, setIsViewOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);

    // Selected user
    const [selectedUser, setSelectedUser] =
        useState<User | null>(null);

    // Form fields
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [passwordConfirmation, setPasswordConfirmation] =
        useState('');
    const [roleId, setRoleId] = useState('');
    const [isActive, setIsActive] = useState(true);

    // -----------------------------
    // Search
    // -----------------------------

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

    // -----------------------------
    // Role filter
    // -----------------------------

    const handleRoleFilter = (value: string) => {
        router.get(
            usersIndex.url(),
            {
                search,
                role:
                    value === 'all'
                        ? undefined
                        : value,
            },
            {
                preserveState: true,
                replace: true,
            },
        );
    };

    // -----------------------------
    // Open Add Modal
    // -----------------------------

    const openAddModal = () => {
        setName('');
        setEmail('');
        setPhone('');
        setPassword('');
        setPasswordConfirmation('');
        setRoleId('');
        setIsActive(true);

        setIsAddOpen(true);
    };

    // -----------------------------
    // Open View Modal
    // -----------------------------

    const openViewModal = (user: User) => {
        setSelectedUser(user);
        setIsViewOpen(true);
    };

    // -----------------------------
    // Open Edit Modal
    // -----------------------------

    const openEditModal = (user: User) => {
        setSelectedUser(user);

        setName(user.name);
        setEmail(user.email);
        setPhone(user.phone || '');
        setPassword('');
        setPasswordConfirmation('');
        setRoleId(
            user.role
                ? String(user.role.id)
                : '',
        );
        setIsActive(user.is_active);

        setIsEditOpen(true);
    };

    // -----------------------------
    // Open Delete Modal
    // -----------------------------

    const openDeleteModal = (user: User) => {
        setSelectedUser(user);
        setIsDeleteOpen(true);
    };

    // -----------------------------
    // Add User
    // -----------------------------

    const handleAdd = () => {
        if (!name || !email || !roleId) {
            return;
        }

        router.post(
            usersStore().url,
            {
                name,
                email,
                phone: phone || null,
                password: password || undefined,
                password_confirmation:
                    passwordConfirmation ||
                    undefined,
                role_id: Number(roleId),
                is_active: isActive,
            },
            {
                onSuccess: () => {
                    setIsAddOpen(false);

                    setName('');
                    setEmail('');
                    setPhone('');
                    setPassword('');
                    setPasswordConfirmation('');
                    setRoleId('');
                    setIsActive(true);
                },
            },
        );
    };

    // -----------------------------
    // Update User
    // -----------------------------

    const handleUpdate = () => {
        if (!selectedUser || !name || !email || !roleId) {
            return;
        }

        router.put(
            usersUpdate(selectedUser.id).url,
            {
                name,
                email,
                phone: phone || null,
                password: password || undefined,
                password_confirmation:
                    passwordConfirmation ||
                    undefined,
                role_id: Number(roleId),
                is_active: isActive,
            },
            {
                onSuccess: () => {
                    setIsEditOpen(false);
                    setSelectedUser(null);

                    setPassword('');
                    setPasswordConfirmation('');
                },
            },
        );
    };

    // -----------------------------
    // Delete User
    // -----------------------------

    const handleDelete = () => {
        if (!selectedUser) {
            return;
        }

        router.delete(
            usersDestroy(selectedUser.id).url,
            {
                onSuccess: () => {
                    setIsDeleteOpen(false);
                    setSelectedUser(null);
                },
            },
        );
    };

    return (
        <>
            <Head title="User Management" />

            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl p-4">

                {/* Page Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <Heading
                        title="User Management"
                        description="Manage all users and their roles."
                    />

                    <Button onClick={openAddModal}>
                        <Plus className="mr-2 h-4 w-4" />
                        Add User
                    </Button>
                </div>

                {/* Search and Filter */}
                <Card>
                    <CardHeader>
                        <CardTitle>
                            Users
                        </CardTitle>

                        <div className="flex flex-col gap-3 pt-4 sm:flex-row">
                            {/* Search */}
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

                                <Input
                                    placeholder="Search by name or email..."
                                    value={search}
                                    onChange={(event) =>
                                        handleSearch(
                                            event.target.value,
                                        )
                                    }
                                    className="pl-9"
                                />
                            </div>

                            {/* Role Filter */}
                            <Select
                                value={
                                    filters.role ||
                                    'all'
                                }
                                onValueChange={
                                    handleRoleFilter
                                }
                            >
                                <SelectTrigger className="w-full sm:w-[200px]">
                                    <SelectValue placeholder="Filter by role" />
                                </SelectTrigger>

                                <SelectContent>
                                    <SelectItem value="all">
                                        All Roles
                                    </SelectItem>

                                    {roles.map((role) => (
                                        <SelectItem
                                            key={role.id}
                                            value={String(
                                                role.id,
                                            )}
                                        >
                                            {role.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </CardHeader>

                    {/* Users Table */}
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
                                            <th className="p-3">
                                                Name
                                            </th>

                                            <th className="p-3">
                                                Email
                                            </th>

                                            <th className="p-3">
                                                Phone
                                            </th>

                                            <th className="p-3">
                                                Role
                                            </th>

                                            <th className="p-3">
                                                Status
                                            </th>

                                            <th className="p-3 text-right">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>

                                    <tbody>
                                        {users.data.map(
                                            (user) => (
                                                <tr
                                                    key={
                                                        user.id
                                                    }
                                                    className="border-b last:border-0"
                                                >
                                                    <td className="p-3 font-medium">
                                                        {
                                                            user.name
                                                        }
                                                    </td>

                                                    <td className="p-3 text-muted-foreground">
                                                        {
                                                            user.email
                                                        }
                                                    </td>

                                                    <td className="p-3 text-muted-foreground">
                                                        {user.phone ||
                                                            '—'}
                                                    </td>

                                                    <td className="p-3">
                                                        <Badge variant="secondary">
                                                            {user
                                                                .role
                                                                ?.name ||
                                                                'No role'}
                                                        </Badge>
                                                    </td>

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

                                                    <td className="p-3">
                                                        <div className="flex justify-end gap-2">

                                                            {/* View */}
                                                            <Button
                                                                variant="outline"
                                                                size="icon"
                                                                onClick={() =>
                                                                    openViewModal(
                                                                        user,
                                                                    )
                                                                }
                                                            >
                                                                <Eye className="h-4 w-4" />
                                                            </Button>

                                                            {/* Edit */}
                                                            <Button
                                                                variant="outline"
                                                                size="icon"
                                                                onClick={() =>
                                                                    openEditModal(
                                                                        user,
                                                                    )
                                                                }
                                                            >
                                                                <Pencil className="h-4 w-4" />
                                                            </Button>

                                                            {/* Delete */}
                                                            <Button
                                                                variant="destructive"
                                                                size="icon"
                                                                onClick={() =>
                                                                    openDeleteModal(
                                                                        user,
                                                                    )
                                                                }
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>

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

                {/* Pagination */}
                {users.last_page > 1 && (
                    <div className="flex items-center justify-center gap-2">
                        {users.links.map(
                            (link, index) => (
                                <Button
                                    key={index}
                                    variant={
                                        link.active
                                            ? 'default'
                                            : 'outline'
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
                                                    preserveScroll: true,
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
                            ),
                        )}
                    </div>
                )}
            </div>

            {/* =====================================================
                ADD USER MODAL
            ====================================================== */}

            <Dialog
                open={isAddOpen}
                onOpenChange={setIsAddOpen}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            Add New User
                        </DialogTitle>

                        <DialogDescription>
                            Create a new user account and assign a role.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">

                        {/* Name */}
                        <div>
                            <label className="mb-2 block text-sm font-medium">
                                Name
                            </label>

                            <Input
                                value={name}
                                onChange={(event) =>
                                    setName(
                                        event.target.value,
                                    )
                                }
                                placeholder="Enter user name"
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
                                    setEmail(
                                        event.target.value,
                                    )
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
                                    setPhone(
                                        event.target.value,
                                    )
                                }
                                placeholder="Enter phone number"
                            />
                        </div>

                        {/* Role */}
                        <div>
                            <label className="mb-2 block text-sm font-medium">
                                Role
                            </label>

                            <Select
                                value={roleId}
                                onValueChange={setRoleId}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a role" />
                                </SelectTrigger>

                                <SelectContent>
                                    {roles.map((role) => (
                                        <SelectItem
                                            key={role.id}
                                            value={String(
                                                role.id,
                                            )}
                                        >
                                            {role.name}
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
                                    setPassword(
                                        event.target.value,
                                    )
                                }
                                placeholder="Leave empty for default password"
                            />
                        </div>

                        {/* Confirm Password */}
                        <div>
                            <label className="mb-2 block text-sm font-medium">
                                Confirm Password
                            </label>

                            <Input
                                type="password"
                                value={
                                    passwordConfirmation
                                }
                                onChange={(event) =>
                                    setPasswordConfirmation(
                                        event.target.value,
                                    )
                                }
                                placeholder="Confirm password"
                            />
                        </div>

                        {/* Status */}
                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                checked={isActive}
                                onChange={(event) =>
                                    setIsActive(
                                        event.target.checked,
                                    )
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
                            onClick={() =>
                                setIsAddOpen(false)
                            }
                        >
                            Cancel
                        </Button>

                        <Button onClick={handleAdd}>
                            Add User
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* =====================================================
                VIEW USER MODAL
            ====================================================== */}

            <Dialog
                open={isViewOpen}
                onOpenChange={setIsViewOpen}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            User Details
                        </DialogTitle>

                        <DialogDescription>
                            View information about this user.
                        </DialogDescription>
                    </DialogHeader>

                    {selectedUser && (
                        <div className="space-y-4 py-4">

                            <div className="rounded-lg border p-4">
                                <p className="text-sm text-muted-foreground">
                                    Name
                                </p>

                                <p className="font-medium">
                                    {selectedUser.name}
                                </p>
                            </div>

                            <div className="rounded-lg border p-4">
                                <p className="text-sm text-muted-foreground">
                                    Email
                                </p>

                                <p className="font-medium">
                                    {selectedUser.email}
                                </p>
                            </div>

                            <div className="rounded-lg border p-4">
                                <p className="text-sm text-muted-foreground">
                                    Phone
                                </p>

                                <p className="font-medium">
                                    {selectedUser.phone ||
                                        'Not provided'}
                                </p>
                            </div>

                            <div className="rounded-lg border p-4">
                                <p className="text-sm text-muted-foreground">
                                    Role
                                </p>

                                <Badge variant="secondary">
                                    {selectedUser
                                        .role?.name ||
                                        'No role'}
                                </Badge>
                            </div>

                            <div className="rounded-lg border p-4">
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
                    )}

                    <DialogFooter>
                        <Button
                            onClick={() =>
                                setIsViewOpen(false)
                            }
                        >
                            Close
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* =====================================================
                EDIT USER MODAL
            ====================================================== */}

            <Dialog
                open={isEditOpen}
                onOpenChange={setIsEditOpen}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            Edit User
                        </DialogTitle>

                        <DialogDescription>
                            Update this user's account information.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">

                        {/* Name */}
                        <div>
                            <label className="mb-2 block text-sm font-medium">
                                Name
                            </label>

                            <Input
                                value={name}
                                onChange={(event) =>
                                    setName(
                                        event.target.value,
                                    )
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
                                    setEmail(
                                        event.target.value,
                                    )
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
                                    setPhone(
                                        event.target.value,
                                    )
                                }
                            />
                        </div>

                        {/* Role */}
                        <div>
                            <label className="mb-2 block text-sm font-medium">
                                Role
                            </label>

                            <Select
                                value={roleId}
                                onValueChange={setRoleId}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a role" />
                                </SelectTrigger>

                                <SelectContent>
                                    {roles.map((role) => (
                                        <SelectItem
                                            key={role.id}
                                            value={String(
                                                role.id,
                                            )}
                                        >
                                            {role.name}
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
                                    setPassword(
                                        event.target.value,
                                    )
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
                                value={
                                    passwordConfirmation
                                }
                                onChange={(event) =>
                                    setPasswordConfirmation(
                                        event.target.value,
                                    )
                                }
                                placeholder="Confirm new password"
                            />
                        </div>

                        {/* Status */}
                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                checked={isActive}
                                onChange={(event) =>
                                    setIsActive(
                                        event.target.checked,
                                    )
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
                            onClick={() =>
                                setIsEditOpen(false)
                            }
                        >
                            Cancel
                        </Button>

                        <Button onClick={handleUpdate}>
                            Update User
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* =====================================================
                DELETE USER MODAL
            ====================================================== */}

            <Dialog
                open={isDeleteOpen}
                onOpenChange={setIsDeleteOpen}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            Delete User?
                        </DialogTitle>

                        <DialogDescription>
                            Are you sure you want to delete{' '}
                            <strong>
                                {selectedUser?.name}
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
            title: 'User Management',
            href: usersIndex.url(),
        },
    ],
};