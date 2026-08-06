import { Head, Link, router } from '@inertiajs/react';
import { Building2, Eye, Pencil, Plus, Search, Trash2 } from 'lucide-react';
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
    index as branchesIndex,
    show as branchesShow,
    store as branchesStore,
    update as branchesUpdate,
    destroy as branchesDestroy,
    toggleStatus as branchesToggleStatus,
} from '@/routes/admin/branches';

import type { PaginatedData } from '@/types';

type Branch = {
    id: number;
    name: string;
    slug: string;
    address: string | null;
    phone: string | null;
    email: string | null;
    city: string | null;
    state: string | null;
    postal_code: string | null;
    country: string | null;
    tax_rate: string | null;
    currency: string | null;
    description: string | null;
    is_active: boolean;
    users_count: number;
    tables_count: number;
    menu_categories_count: number;
    menu_items_count: number;
    orders_count: number;
};

type Props = {
    branches: PaginatedData<Branch>;
    filters: {
        search?: string;
        status?: string;
    };
};

export default function BranchesIndex({ branches, filters }: Props) {
    const can = useCan();

    // -----------------------------------------
    // Search and filters
    // -----------------------------------------

    const [search, setSearch] = useState(filters.search || '');

    // -----------------------------------------
    // Modal states
    // -----------------------------------------

    const [isAddOpen, setIsAddOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);

    // -----------------------------------------
    // Selected branch
    // -----------------------------------------

    const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);

    // -----------------------------------------
    // Form fields
    // -----------------------------------------

    const [name, setName] = useState('');
    const [address, setAddress] = useState('');
    const [phone, setPhone] = useState('');
    const [city, setCity] = useState('');
    const [country, setCountry] = useState('');
    const [isActive, setIsActive] = useState(true);

    // -----------------------------------------
    // Search
    // -----------------------------------------

    const handleSearch = (value: string) => {
        setSearch(value);

        router.get(
            branchesIndex.url(),
            {
                search: value,
                status: filters.status,
            },
            {
                preserveState: true,
                replace: true,
            },
        );
    };

    // -----------------------------------------
    // Status filter
    // -----------------------------------------

    const handleStatusFilter = (value: string) => {
        router.get(
            branchesIndex.url(),
            {
                search,
                status: value === 'all' ? undefined : value,
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
        setAddress('');
        setPhone('');
        setCity('');
        setCountry('');
        setIsActive(true);
    };

    // -----------------------------------------
    // Open Add Modal
    // -----------------------------------------

    const openAddModal = () => {
        resetForm();
        setSelectedBranch(null);
        setIsAddOpen(true);
    };

    // -----------------------------------------
    // Open Edit Modal
    // -----------------------------------------

    const openEditModal = (branch: Branch) => {
        setSelectedBranch(branch);

        setName(branch.name);
        setAddress(branch.address || '');
        setPhone(branch.phone || '');
        setCity(branch.city || '');
        setCountry(branch.country || '');
        setIsActive(branch.is_active);

        setIsEditOpen(true);
    };

    // -----------------------------------------
    // Open Delete Modal
    // -----------------------------------------

    const openDeleteModal = (branch: Branch) => {
        setSelectedBranch(branch);
        setIsDeleteOpen(true);
    };

    // -----------------------------------------
    // Add Branch
    // -----------------------------------------

    const handleAdd = () => {
        if (!name.trim() || !address.trim()) {
            return;
        }

        router.post(
            branchesStore.url(),
            {
                name,
                address,
                phone: phone || null,
                city: city || null,
                country: country || null,
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
    // Update Branch
    // -----------------------------------------

    const handleUpdate = () => {
        if (!selectedBranch || !name.trim() || !address.trim()) {
            return;
        }

        router.put(
            branchesUpdate.url(selectedBranch.id),
            {
                name,
                address,
                phone: phone || null,
                city: city || null,
                country: country || null,
                is_active: isActive,
            },
            {
                onSuccess: () => {
                    setIsEditOpen(false);
                    setSelectedBranch(null);
                    resetForm();
                },
            },
        );
    };

    // -----------------------------------------
    // Toggle Branch Status
    // -----------------------------------------

    const handleToggleStatus = (branch: Branch) => {
        router.patch(
            branchesToggleStatus.url(branch.id),
            {},
            {
                preserveScroll: true,
            },
        );
    };

    // -----------------------------------------
    // Delete Branch
    // -----------------------------------------

    const handleDelete = () => {
        if (!selectedBranch) {
            return;
        }

        router.delete(branchesDestroy.url(selectedBranch.id), {
            onSuccess: () => {
                setIsDeleteOpen(false);
                setSelectedBranch(null);
            },
        });
    };

    return (
        <>
            <Head title="Branches" />

            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl p-4">
                {/* =========================================
                    PAGE HEADER
                ========================================= */}

                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <Heading
                        title="Branches"
                        description="Manage restaurant locations and their data."
                        icon={Building2}
                    />

                    {can('create branches') && (
                        <Button onClick={openAddModal}>
                            <Plus className="mr-2 h-4 w-4" />
                            Add Branch
                        </Button>
                    )}
                </div>

                {/* =========================================
                    BRANCHES CARD
                ========================================= */}

                <Card>
                    <CardHeader>
                        <CardTitle>Restaurant Branches</CardTitle>

                        <div className="flex flex-wrap gap-3 pt-4">
                            {/* Search */}

                            <div className="relative max-w-sm flex-1">
                                <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

                                <Input
                                    placeholder="Search branches..."
                                    value={search}
                                    onChange={(event) =>
                                        handleSearch(event.target.value)
                                    }
                                    className="pl-9"
                                />
                            </div>

                            {/* Status Filter */}

                            <Select
                                value={filters.status || 'all'}
                                onValueChange={handleStatusFilter}
                            >
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="All Statuses" />
                                </SelectTrigger>

                                <SelectContent>
                                    <SelectItem value="all">
                                        All Statuses
                                    </SelectItem>

                                    <SelectItem value="active">
                                        Active
                                    </SelectItem>

                                    <SelectItem value="inactive">
                                        Inactive
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </CardHeader>

                    <CardContent>
                        {branches.data.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-center">
                                <p className="text-lg font-medium">
                                    No branches found
                                </p>

                                <p className="mt-1 text-sm text-muted-foreground">
                                    Try changing your search or add a new
                                    branch.
                                </p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b text-left">
                                            <th className="p-3">Name</th>

                                            <th className="p-3">Address</th>

                                            <th className="p-3">Phone</th>

                                            <th className="p-3">Data</th>

                                            <th className="p-3">Status</th>

                                            <th className="p-3 text-right">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>

                                    <tbody>
                                        {branches.data.map((branch) => (
                                            <tr
                                                key={branch.id}
                                                className="border-b last:border-0 hover:bg-muted/50"
                                            >
                                                {/* Name */}

                                                <td className="p-3">
                                                    <Link
                                                        href={branchesShow.url(
                                                            branch.id,
                                                        )}
                                                        className="font-medium hover:text-orange-600"
                                                    >
                                                        {branch.name}
                                                    </Link>
                                                </td>

                                                {/* Address */}

                                                <td className="p-3 text-muted-foreground">
                                                    {[
                                                        branch.address,
                                                        branch.city,
                                                    ]
                                                        .filter(Boolean)
                                                        .join(', ') || '—'}
                                                </td>

                                                {/* Phone */}

                                                <td className="p-3 text-muted-foreground">
                                                    {branch.phone || '—'}
                                                </td>

                                                {/* Data counts */}

                                                <td className="p-3 text-muted-foreground">
                                                    {branch.users_count} staff ·{' '}
                                                    {branch.tables_count} tables
                                                    ·{' '}
                                                    {
                                                        branch.menu_categories_count
                                                    }{' '}
                                                    categories ·{' '}
                                                    {branch.menu_items_count}{' '}
                                                    items ·{' '}
                                                    {branch.orders_count} orders
                                                </td>

                                                {/* Status */}

                                                <td className="p-3">
                                                    <Badge
                                                        variant={
                                                            branch.is_active
                                                                ? 'default'
                                                                : 'destructive'
                                                        }
                                                    >
                                                        {branch.is_active
                                                            ? 'Active'
                                                            : 'Inactive'}
                                                    </Badge>
                                                </td>

                                                {/* Actions */}

                                                <td className="p-3">
                                                    <div className="flex items-center justify-end gap-2">
                                                        {/* Shared Status Toggle */}

                                                        {can(
                                                            'status branches',
                                                        ) && (
                                                            <StatusToggle
                                                                checked={
                                                                    branch.is_active
                                                                }
                                                                onCheckedChange={() =>
                                                                    handleToggleStatus(
                                                                        branch,
                                                                    )
                                                                }
                                                                onLabel="Active"
                                                                offLabel="Inactive"
                                                                ariaLabel={`Toggle status for ${branch.name}`}
                                                            />
                                                        )}

                                                        {/* View */}

                                                        {can(
                                                            'show branches',
                                                        ) && (
                                                            <Button
                                                                variant="outline"
                                                                size="icon"
                                                                asChild
                                                            >
                                                                <Link
                                                                    href={branchesShow.url(
                                                                        branch.id,
                                                                    )}
                                                                    title="View branch"
                                                                >
                                                                    <Eye className="h-4 w-4" />
                                                                </Link>
                                                            </Button>
                                                        )}

                                                        {/* Edit */}

                                                        {can(
                                                            'update branches',
                                                        ) && (
                                                            <Button
                                                                variant="outline"
                                                                size="icon"
                                                                onClick={() =>
                                                                    openEditModal(
                                                                        branch,
                                                                    )
                                                                }
                                                                title="Edit branch"
                                                            >
                                                                <Pencil className="h-4 w-4" />
                                                            </Button>
                                                        )}

                                                        {/* Delete */}

                                                        {can(
                                                            'delete branches',
                                                        ) && (
                                                            <Button
                                                                variant="destructive"
                                                                size="icon"
                                                                onClick={() =>
                                                                    openDeleteModal(
                                                                        branch,
                                                                    )
                                                                }
                                                                title="Delete branch"
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

                        {branches.last_page > 1 && (
                            <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
                                {branches.links.map((link, index) => (
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
                ADD BRANCH MODAL
            ========================================= */}

            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle>Add Branch</DialogTitle>

                        <DialogDescription>
                            Create a new restaurant branch. Name and address are
                            required.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        {/* Name */}

                        <div>
                            <label className="mb-2 block text-sm font-medium">
                                Branch Name *
                            </label>

                            <Input
                                value={name}
                                onChange={(event) =>
                                    setName(event.target.value)
                                }
                                placeholder="Enter branch name"
                            />
                        </div>

                        {/* Address */}

                        <div>
                            <label className="mb-2 block text-sm font-medium">
                                Address *
                            </label>

                            <Input
                                value={address}
                                onChange={(event) =>
                                    setAddress(event.target.value)
                                }
                                placeholder="Enter street address"
                            />
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
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

                            {/* City */}

                            <div>
                                <label className="mb-2 block text-sm font-medium">
                                    City
                                </label>

                                <Input
                                    value={city}
                                    onChange={(event) =>
                                        setCity(event.target.value)
                                    }
                                    placeholder="Enter city"
                                />
                            </div>

                            {/* Country */}

                            <div>
                                <label className="mb-2 block text-sm font-medium">
                                    Country
                                </label>

                                <Input
                                    value={country}
                                    onChange={(event) =>
                                        setCountry(event.target.value)
                                    }
                                    placeholder="Enter country"
                                />
                            </div>
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
                                Active Branch
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

                        <Button onClick={handleAdd}>Add Branch</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* =========================================
                EDIT BRANCH MODAL
            ========================================= */}

            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle>Edit Branch</DialogTitle>

                        <DialogDescription>
                            Update the branch details.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        {/* Name */}

                        <div>
                            <label className="mb-2 block text-sm font-medium">
                                Branch Name *
                            </label>

                            <Input
                                value={name}
                                onChange={(event) =>
                                    setName(event.target.value)
                                }
                            />
                        </div>

                        {/* Address */}

                        <div>
                            <label className="mb-2 block text-sm font-medium">
                                Address *
                            </label>

                            <Input
                                value={address}
                                onChange={(event) =>
                                    setAddress(event.target.value)
                                }
                            />
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
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

                            {/* City */}

                            <div>
                                <label className="mb-2 block text-sm font-medium">
                                    City
                                </label>

                                <Input
                                    value={city}
                                    onChange={(event) =>
                                        setCity(event.target.value)
                                    }
                                />
                            </div>

                            {/* Country */}

                            <div>
                                <label className="mb-2 block text-sm font-medium">
                                    Country
                                </label>

                                <Input
                                    value={country}
                                    onChange={(event) =>
                                        setCountry(event.target.value)
                                    }
                                />
                            </div>
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
                                Active Branch
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

                        <Button onClick={handleUpdate}>Update Branch</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* =========================================
                DELETE BRANCH MODAL
            ========================================= */}

            <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Branch?</DialogTitle>

                        <DialogDescription>
                            Are you sure you want to delete{' '}
                            <strong>{selectedBranch?.name}</strong>? This action
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
                            Delete Branch
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

BranchesIndex.layout = {
    breadcrumbs: [
        {
            title: 'Branches',
            href: branchesIndex.url(),
        },
    ],
};
