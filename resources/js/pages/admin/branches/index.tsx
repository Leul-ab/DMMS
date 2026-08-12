import { Head, Link, router } from '@inertiajs/react';
import { Building2, Eye, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { useState } from 'react';

import Heading from '@/components/heading';
import InputError from '@/components/input-error';
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
import { cn } from '@/lib/utils';

import {
    index as branchesIndex,
    show as branchesShow,
    store as branchesStore,
    update as branchesUpdate,
    destroy as branchesDestroy,
    toggleStatus as branchesToggleStatus,
} from '@/routes/admin/branches';

import type { PaginatedData } from '@/types';

type AddBranchField = 'name' | 'address' | 'phone' | 'city' | 'country';

type AddBranchFormValues = {
    name: string;
    address: string;
    phone: string;
    city: string;
    country: string;
};

function isValidPhoneNumber(value: string): boolean {
    const trimmed = value.trim();

    if (!/^[\d\s+\-().]+$/.test(trimmed)) {
        return false;
    }

    const digits = trimmed.replace(/\D/g, '');

    return digits.length >= 7 && digits.length <= 15;
}

function validateAddBranchField(
    field: AddBranchField,
    values: AddBranchFormValues,
): string | null {
    switch (field) {
        case 'name':
            return values.name.trim() ? null : 'Branch Name is required.';
        case 'address':
            return values.address.trim() ? null : 'Address is required.';
        case 'phone':
            if (!values.phone.trim()) {
                return 'Phone is required.';
            }

            return isValidPhoneNumber(values.phone)
                ? null
                : 'Please enter a valid phone number.';
        case 'city':
            return values.city.trim() ? null : 'City is required.';
        case 'country':
            return values.country.trim() ? null : 'Country is required.';
    }
}

function validateAllAddBranchFields(
    values: AddBranchFormValues,
): Partial<Record<AddBranchField, string>> {
    const fields: AddBranchField[] = [
        'name',
        'address',
        'phone',
        'city',
        'country',
    ];
    const errors: Partial<Record<AddBranchField, string>> = {};

    for (const field of fields) {
        const error = validateAddBranchField(field, values);

        if (error) {
            errors[field] = error;
        }
    }

    return errors;
}

function getAddFieldInputClassName(
    field: AddBranchField,
    errors: Partial<Record<AddBranchField, string>>,
    touched: Partial<Record<AddBranchField, boolean>>,
    submitAttempted: boolean,
): string {
    const hasError = Boolean(errors[field]);
    const showValidation = touched[field] || submitAttempted;

    if (hasError) {
        return 'border-red-500 focus-visible:border-red-500 focus-visible:ring-red-500/20';
    }

    if (showValidation) {
        return 'border-green-500 focus-visible:border-green-500 focus-visible:ring-green-500/20';
    }

    return '';
}

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

    // Add Branch inline validation (Add modal only)
    const [addErrors, setAddErrors] = useState<
        Partial<Record<AddBranchField, string>>
    >({});
    const [addTouched, setAddTouched] = useState<
        Partial<Record<AddBranchField, boolean>>
    >({});
    const [addSubmitAttempted, setAddSubmitAttempted] = useState(false);

    const getAddFormValues = (): AddBranchFormValues => ({
        name,
        address,
        phone,
        city,
        country,
    });

    const resetAddValidation = () => {
        setAddErrors({});
        setAddTouched({});
        setAddSubmitAttempted(false);
    };

    const revalidateAddField = (
        field: AddBranchField,
        values: AddBranchFormValues,
    ) => {
        const error = validateAddBranchField(field, values);

        setAddErrors((previous) => {
            const next = { ...previous };

            if (error) {
                next[field] = error;
            } else {
                delete next[field];
            }

            return next;
        });
    };

    const shouldRevalidateAddField = (field: AddBranchField) =>
        addTouched[field] || Boolean(addErrors[field]) || addSubmitAttempted;

    const handleAddFieldBlur = (field: AddBranchField) => {
        setAddTouched((previous) => ({ ...previous, [field]: true }));
        revalidateAddField(field, getAddFormValues());
    };

    const handleAddFieldChange = (
        field: AddBranchField,
        value: string,
        setter: (value: string) => void,
    ) => {
        setter(value);

        const values = { ...getAddFormValues(), [field]: value };

        if (shouldRevalidateAddField(field)) {
            revalidateAddField(field, values);
        }
    };

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
        resetAddValidation();
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
        setAddSubmitAttempted(true);

        const values = getAddFormValues();
        const errors = validateAllAddBranchFields(values);

        setAddErrors(errors);

        if (Object.keys(errors).length > 0) {
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

                                            <th className="p-3">Staff</th>

                                            <th className="p-3">Tables</th>

                                            <th className="p-3">Categories</th>

                                            <th className="p-3">Items</th>

                                            <th className="p-3">Orders</th>

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

                                                {/* Staff */}

                                                <td className="p-3">
                                                    {branch.users_count}
                                                </td>

                                                {/* Tables */}

                                                <td className="p-3">
                                                    {branch.tables_count}
                                                </td>

                                                {/* Categories */}

                                                <td className="p-3">
                                                    {branch.menu_categories_count}
                                                </td>

                                                {/* Items */}

                                                <td className="p-3">
                                                    {branch.menu_items_count}
                                                </td>

                                                {/* Orders */}

                                                <td className="p-3">
                                                    {branch.orders_count}
                                                </td>

                                                {/* Status */}

                                                <td className="p-3">
                                                    <Badge
                                                        variant="outline"
                                                        className={
                                                            branch.is_active
                                                                ? 'border-green-600 bg-white text-green-600'
                                                                : 'border-red-600 bg-white text-red-600'
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
                            Create a new restaurant branch. All fields are
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
                                    handleAddFieldChange(
                                        'name',
                                        event.target.value,
                                        setName,
                                    )
                                }
                                onBlur={() => handleAddFieldBlur('name')}
                                placeholder="Enter branch name"
                                aria-invalid={Boolean(addErrors.name)}
                                className={cn(
                                    getAddFieldInputClassName(
                                        'name',
                                        addErrors,
                                        addTouched,
                                        addSubmitAttempted,
                                    ),
                                )}
                            />

                            <InputError message={addErrors.name} className="mt-1" />
                        </div>

                        {/* Address */}

                        <div>
                            <label className="mb-2 block text-sm font-medium">
                                Address *
                            </label>

                            <Input
                                value={address}
                                onChange={(event) =>
                                    handleAddFieldChange(
                                        'address',
                                        event.target.value,
                                        setAddress,
                                    )
                                }
                                onBlur={() => handleAddFieldBlur('address')}
                                placeholder="Enter street address"
                                aria-invalid={Boolean(addErrors.address)}
                                className={cn(
                                    getAddFieldInputClassName(
                                        'address',
                                        addErrors,
                                        addTouched,
                                        addSubmitAttempted,
                                    ),
                                )}
                            />

                            <InputError
                                message={addErrors.address}
                                className="mt-1"
                            />
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                            {/* Phone */}

                            <div>
                                <label className="mb-2 block text-sm font-medium">
                                    Phone *
                                </label>

                                <Input
                                    value={phone}
                                    onChange={(event) =>
                                        handleAddFieldChange(
                                            'phone',
                                            event.target.value,
                                            setPhone,
                                        )
                                    }
                                    onBlur={() => handleAddFieldBlur('phone')}
                                    placeholder="Enter phone number"
                                    aria-invalid={Boolean(addErrors.phone)}
                                    className={cn(
                                        getAddFieldInputClassName(
                                            'phone',
                                            addErrors,
                                            addTouched,
                                            addSubmitAttempted,
                                        ),
                                    )}
                                />

                                <InputError
                                    message={addErrors.phone}
                                    className="mt-1"
                                />
                            </div>

                            {/* City */}

                            <div>
                                <label className="mb-2 block text-sm font-medium">
                                    City *
                                </label>

                                <Input
                                    value={city}
                                    onChange={(event) =>
                                        handleAddFieldChange(
                                            'city',
                                            event.target.value,
                                            setCity,
                                        )
                                    }
                                    onBlur={() => handleAddFieldBlur('city')}
                                    placeholder="Enter city"
                                    aria-invalid={Boolean(addErrors.city)}
                                    className={cn(
                                        getAddFieldInputClassName(
                                            'city',
                                            addErrors,
                                            addTouched,
                                            addSubmitAttempted,
                                        ),
                                    )}
                                />

                                <InputError
                                    message={addErrors.city}
                                    className="mt-1"
                                />
                            </div>

                            {/* Country */}

                            <div>
                                <label className="mb-2 block text-sm font-medium">
                                    Country *
                                </label>

                                <Input
                                    value={country}
                                    onChange={(event) =>
                                        handleAddFieldChange(
                                            'country',
                                            event.target.value,
                                            setCountry,
                                        )
                                    }
                                    onBlur={() => handleAddFieldBlur('country')}
                                    placeholder="Enter country"
                                    aria-invalid={Boolean(addErrors.country)}
                                    className={cn(
                                        getAddFieldInputClassName(
                                            'country',
                                            addErrors,
                                            addTouched,
                                            addSubmitAttempted,
                                        ),
                                    )}
                                />

                                <InputError
                                    message={addErrors.country}
                                    className="mt-1"
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
