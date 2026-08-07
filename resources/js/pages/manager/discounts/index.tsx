import { Head, router } from '@inertiajs/react';
import { Eye, Pencil, Plus, Search, Trash2, Percent } from 'lucide-react';
import { useState } from 'react';

import Heading from '@/components/heading';
import StatusToggle from '@/components/status-toggle';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useCan } from '@/hooks/use-can';

import {
    index as discountsIndex,
    store as discountsStore,
    update as discountsUpdate,
    destroy as discountsDestroy,
} from '@/routes/manager/discounts';

import type { PaginatedData } from '@/types';

type Discount = {
    id: number;
    branch_id: number;
    name: string;
    description: string | null;
    discount_type: string;
    applies_to: string;
    percentage: string | null;
    fixed_amount: string | null;
    status: string;
    start_date: string;
    end_date: string;
    menu_items?: number[];
};

type Props = {
    discounts: PaginatedData<Discount>;
    filters: {
        search?: string;
        discount_type?: string;
        applies_to?: string;
        status?: string;
    };
    menuItems: { id: number; name: string }[];
};

export default function DiscountsIndex({
    discounts,
    filters,
    menuItems,
}: Props) {
    const can = useCan();

    // -----------------------------------------
    // Search
    // -----------------------------------------

    const [search, setSearch] = useState(filters.search || '');

    // -----------------------------------------
    // Modal States
    // -----------------------------------------

    const [isAddOpen, setIsAddOpen] = useState(false);
    const [isViewOpen, setIsViewOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);

    // -----------------------------------------
    // Selected Discount
    // -----------------------------------------

    const [selectedDiscount, setSelectedDiscount] = useState<Discount | null>(
        null,
    );

    // -----------------------------------------
    // Form Fields
    // -----------------------------------------

    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [discountType, setDiscountType] = useState('percentage');
    const [percentage, setPercentage] = useState('');
    const [fixedAmount, setFixedAmount] = useState('');
    const [status, setStatus] = useState('active');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [appliesTo, setAppliesTo] = useState(filters.applies_to || 'all');
    const [selectedMenuItems, setSelectedMenuItems] = useState<number[]>([]);
    const [editSelectedMenuItems, setEditSelectedMenuItems] = useState<
        number[]
    >([]);

    // -----------------------------------------
    // Search
    // -----------------------------------------

    const handleSearch = (value: string) => {
        setSearch(value);

        router.get(
            discountsIndex.url(),
            {
                search: value,
                discount_type: filters.discount_type,
                applies_to: filters.applies_to,
                status: filters.status,
            },
            {
                preserveState: true,
                replace: true,
            },
        );
    };

    // -----------------------------------------
    // Type Filter
    // -----------------------------------------

    const handleTypeFilter = (value: string) => {
        router.get(
            discountsIndex.url(),
            {
                search,
                discount_type: value === 'all' ? undefined : value,
                applies_to: filters.applies_to,
                status: filters.status,
            },
            {
                preserveState: true,
                replace: true,
            },
        );
    };

    // -----------------------------------------
    // Status Filter
    // -----------------------------------------

    const handleStatusFilter = (value: string) => {
        router.get(
            discountsIndex.url(),
            {
                search,
                discount_type: filters.discount_type,
                applies_to: filters.applies_to,
                status: value === 'all' ? undefined : value,
            },
            {
                preserveState: true,
                replace: true,
            },
        );
    };

    const handleAppliesToFilter = (value: string) => {
        router.get(
            discountsIndex.url(),
            {
                search,
                discount_type: filters.discount_type,
                status: filters.status,
                applies_to: value === 'all' ? undefined : value,
            },
            {
                preserveState: true,
                replace: true,
            },
        );
    };

    // -----------------------------------------
    // Open Add Modal
    // -----------------------------------------

    const openAddModal = () => {
        setSelectedDiscount(null);

        setName('');
        setDescription('');
        setDiscountType('percentage');
        setAppliesTo('all');
        setPercentage('');
        setFixedAmount('');
        setStatus('active');
        setStartDate('');
        setEndDate('');
        setSelectedMenuItems([]);

        setIsAddOpen(true);
    };

    // -----------------------------------------
    // Open View Modal
    // -----------------------------------------

    const openViewModal = (discount: Discount) => {
        setSelectedDiscount(discount);
        setIsViewOpen(true);
    };

    // -----------------------------------------
    // Open Edit Modal
    // -----------------------------------------

    const openEditModal = (discount: Discount) => {
        setSelectedDiscount(discount);

        setName(discount.name);
        setDescription(discount.description || '');
        setDiscountType(discount.discount_type);
        setAppliesTo(discount.applies_to);
        setPercentage(discount.percentage || '');
        setFixedAmount(discount.fixed_amount || '');
        setStatus(discount.status);
        setStartDate(discount.start_date);
        setEndDate(discount.end_date);
        setEditSelectedMenuItems(discount.menu_items || []);

        setIsEditOpen(true);
    };

    // -----------------------------------------
    // Open Delete Modal
    // -----------------------------------------

    const openDeleteModal = (discount: Discount) => {
        setSelectedDiscount(discount);
        setIsDeleteOpen(true);
    };

    // -----------------------------------------
    // Add Discount
    // -----------------------------------------

    const handleAdd = () => {
        if (!name.trim() || !startDate || !endDate) {
            return;
        }

        if (discountType === 'percentage' && !percentage) {
            return;
        }

        if (discountType === 'fixed' && !fixedAmount) {
            return;
        }

        const formData = new FormData();

        formData.append('name', name);
        formData.append('description', description);
        formData.append('discount_type', discountType);
        formData.append('applies_to', appliesTo);
        formData.append('status', status);
        formData.append('start_date', startDate);
        formData.append('end_date', endDate);

        selectedMenuItems.forEach((id) => {
            formData.append('menu_items[]', String(id));
        });

        if (discountType === 'percentage') {
            formData.append('percentage', percentage);
        }

        if (discountType === 'fixed') {
            formData.append('fixed_amount', fixedAmount);
        }

        router.post(discountsStore.url(), formData, {
            forceFormData: true,

            onSuccess: () => {
                setIsAddOpen(false);

                setName('');
                setDescription('');
                setDiscountType('percentage');
                setAppliesTo('all');
                setPercentage('');
                setFixedAmount('');
                setStatus('active');
                setStartDate('');
                setEndDate('');
                setSelectedMenuItems([]);
            },
        });
    };

    // -----------------------------------------
    // Update Discount
    // -----------------------------------------

    const handleUpdate = () => {
        if (!selectedDiscount || !name.trim() || !startDate || !endDate) {
            return;
        }

        if (discountType === 'percentage' && !percentage) {
            return;
        }

        if (discountType === 'fixed' && !fixedAmount) {
            return;
        }

        const formData = new FormData();

        formData.append('name', name);
        formData.append('description', description);
        formData.append('discount_type', discountType);
        formData.append('applies_to', appliesTo);
        formData.append('status', status);
        formData.append('start_date', startDate);
        formData.append('end_date', endDate);

        editSelectedMenuItems.forEach((id) => {
            formData.append('menu_items[]', String(id));
        });

        if (discountType === 'percentage') {
            formData.append('percentage', percentage);
        } else {
            formData.append('percentage', '');
        }

        if (discountType === 'fixed') {
            formData.append('fixed_amount', fixedAmount);
        } else {
            formData.append('fixed_amount', '');
        }

        formData.append('_method', 'PUT');

        router.post(discountsUpdate.url(selectedDiscount.id), formData, {
            forceFormData: true,

            onSuccess: () => {
                setIsEditOpen(false);
                setSelectedDiscount(null);
                setEditSelectedMenuItems([]);
            },
        });
    };

    // -----------------------------------------
    // Toggle Status
    // -----------------------------------------

    const handleToggleStatus = (discount: Discount) => {
        router.patch(
            `/manager/discounts/${discount.id}/toggle-status`,
            {},
            {
                preserveScroll: true,
            },
        );
    };

    // -----------------------------------------
    // Delete Discount
    // -----------------------------------------

    const handleDelete = () => {
        if (!selectedDiscount) {
            return;
        }

        router.delete(discountsDestroy.url(selectedDiscount.id), {
            onSuccess: () => {
                setIsDeleteOpen(false);
                setSelectedDiscount(null);
            },
        });
    };

    // -----------------------------------------
    // Format Discount Value
    // -----------------------------------------

    const formatDiscountValue = (discount: Discount) => {
        if (discount.discount_type === 'percentage' && discount.percentage) {
            return `${discount.percentage}%`;
        }

        if (discount.discount_type === 'fixed' && discount.fixed_amount) {
            return new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD',
            }).format(Number(discount.fixed_amount));
        }

        return '—';
    };

    // -----------------------------------------
    // Status Badge Variant
    // -----------------------------------------

    const getStatusVariant = (
        status: string,
    ): 'default' | 'secondary' | 'destructive' | 'outline' => {
        switch (status) {
            case 'active':
                return 'default';
            case 'inactive':
                return 'secondary';
            case 'expired':
                return 'destructive';
            case 'scheduled':
                return 'outline';
            default:
                return 'secondary';
        }
    };

    return (
        <>
            <Head title="Discounts" />

            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl p-4">
                {/* Page Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <Heading
                        title="Discounts"
                        description="Manage all discounts and promotions."
                        icon={Percent}
                    />

                    {can('create discounts') && (
                        <Button onClick={openAddModal}>
                            <Plus className="mr-2 h-4 w-4" />
                            Add Discount
                        </Button>
                    )}
                </div>

                {/* Discounts Card */}
                <Card>
                    <CardHeader>
                        <CardTitle>Discounts</CardTitle>

                        {/* Filters */}
                        <div className="flex flex-wrap items-center gap-3 pt-4">
                            {/* Search */}
                            <div className="relative max-w-sm flex-1">
                                <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

                                <Input
                                    placeholder="Search discounts..."
                                    value={search}
                                    onChange={(event) =>
                                        handleSearch(event.target.value)
                                    }
                                    className="pl-9"
                                />
                            </div>

                            {/* Type Filter */}
                            <Select
                                value={filters.discount_type || 'all'}
                                onValueChange={handleTypeFilter}
                            >
                                <SelectTrigger className="w-[160px]">
                                    <SelectValue placeholder="All Types" />
                                </SelectTrigger>

                                <SelectContent>
                                    <SelectItem value="all">
                                        All Types
                                    </SelectItem>

                                    <SelectItem value="percentage">
                                        Percentage
                                    </SelectItem>

                                    <SelectItem value="fixed">
                                        Fixed Amount
                                    </SelectItem>
                                </SelectContent>
                            </Select>

                            {/* Applies To Filter */}
                            <Select
                                value={filters.applies_to || 'all'}
                                onValueChange={handleAppliesToFilter}
                            >
                                <SelectTrigger className="w-[160px]">
                                    <SelectValue placeholder="All Applies To" />
                                </SelectTrigger>

                                <SelectContent>
                                    <SelectItem value="all">
                                        All Customers
                                    </SelectItem>

                                    <SelectItem value="members">
                                        Members Only
                                    </SelectItem>
                                </SelectContent>
                            </Select>

                            {/* Status Filter */}
                            <Select
                                value={filters.status || 'all'}
                                onValueChange={handleStatusFilter}
                            >
                                <SelectTrigger className="w-[160px]">
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

                                    <SelectItem value="scheduled">
                                        Scheduled
                                    </SelectItem>

                                    <SelectItem value="expired">
                                        Expired
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </CardHeader>

                    <CardContent>
                        {discounts.data.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-center">
                                <p className="text-lg font-medium">
                                    No discounts found
                                </p>

                                <p className="mt-1 text-sm text-muted-foreground">
                                    Try changing your filters or add a new
                                    discount.
                                </p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b text-left">
                                            <th className="p-3">Name</th>

                                            <th className="p-3">Description</th>

                                            <th className="p-3">Type</th>

                                            <th className="p-3">
                                                Discount Value
                                            </th>

                                            <th className="p-3">Applies To</th>

                                            <th className="p-3">Start Date</th>

                                            <th className="p-3">End Date</th>

                                            <th className="p-3">Status</th>

                                            <th className="p-3 text-right">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>

                                    <tbody>
                                        {discounts.data.map((discount) => (
                                            <tr
                                                key={discount.id}
                                                className="border-b last:border-0 hover:bg-muted/50"
                                            >
                                                {/* Name */}
                                                <td className="p-3 font-medium">
                                                    {discount.name}
                                                </td>

                                                {/* Description */}
                                                <td className="p-3 text-muted-foreground">
                                                    {discount.description
                                                        ? discount.description
                                                              .length > 50
                                                            ? `${discount.description.slice(0, 50)}...`
                                                            : discount.description
                                                        : '—'}
                                                </td>

                                                {/* Type */}
                                                <td className="p-3">
                                                    <Badge variant="secondary">
                                                        {discount.discount_type ===
                                                        'percentage'
                                                            ? 'Percentage'
                                                            : 'Fixed Amount'}
                                                    </Badge>
                                                </td>

                                                {/* Discount Value */}
                                                <td className="p-3 font-medium">
                                                    {formatDiscountValue(
                                                        discount,
                                                    )}
                                                </td>

                                                {/* Applies To */}
                                                <td className="p-3">
                                                    <Badge
                                                        variant={
                                                            discount.applies_to ===
                                                            'members'
                                                                ? 'outline'
                                                                : 'secondary'
                                                        }
                                                    >
                                                        {discount.applies_to ===
                                                        'members'
                                                            ? 'Members Only'
                                                            : 'All Customers'}
                                                    </Badge>
                                                </td>

                                                {/* Start Date */}
                                                <td className="p-3 text-muted-foreground">
                                                    {discount.start_date}
                                                </td>

                                                {/* End Date */}
                                                <td className="p-3 text-muted-foreground">
                                                    {discount.end_date}
                                                </td>

                                                {/* Status */}
                                                <td className="p-3">
                                                    <Badge
                                                        variant={getStatusVariant(
                                                            discount.status,
                                                        )}
                                                    >
                                                        {discount.status
                                                            .charAt(0)
                                                            .toUpperCase() +
                                                            discount.status.slice(
                                                                1,
                                                            )}
                                                    </Badge>
                                                </td>

                                                {/* Actions */}
                                                <td className="p-3">
                                                    <div className="flex items-center justify-end gap-2">
                                                        {/* Toggle */}
                                                        {(discount.status ===
                                                            'active' ||
                                                            discount.status ===
                                                                'inactive') &&
                                                            can(
                                                                'toggle discount status',
                                                            ) && (
                                                                <StatusToggle
                                                                    checked={
                                                                        discount.status ===
                                                                        'active'
                                                                    }
                                                                    onCheckedChange={() =>
                                                                        handleToggleStatus(
                                                                            discount,
                                                                        )
                                                                    }
                                                                    onLabel="Active"
                                                                    offLabel="Inactive"
                                                                    ariaLabel={
                                                                        discount.status ===
                                                                        'active'
                                                                            ? 'Deactivate discount'
                                                                            : 'Activate discount'
                                                                    }
                                                                />
                                                            )}

                                                        {/* View */}
                                                        {can(
                                                            'view discounts',
                                                        ) && (
                                                            <Button
                                                                variant="outline"
                                                                size="icon"
                                                                onClick={() =>
                                                                    openViewModal(
                                                                        discount,
                                                                    )
                                                                }
                                                                title="View discount"
                                                            >
                                                                <Eye className="h-4 w-4" />
                                                            </Button>
                                                        )}

                                                        {/* Edit */}
                                                        {can(
                                                            'update discounts',
                                                        ) && (
                                                            <Button
                                                                variant="outline"
                                                                size="icon"
                                                                onClick={() =>
                                                                    openEditModal(
                                                                        discount,
                                                                    )
                                                                }
                                                                title="Edit discount"
                                                            >
                                                                <Pencil className="h-4 w-4" />
                                                            </Button>
                                                        )}

                                                        {/* Delete */}
                                                        {can(
                                                            'delete discounts',
                                                        ) && (
                                                            <Button
                                                                variant="destructive"
                                                                size="icon"
                                                                onClick={() =>
                                                                    openDeleteModal(
                                                                        discount,
                                                                    )
                                                                }
                                                                title="Delete discount"
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

                        {/* Pagination */}
                        {discounts.last_page > 1 && (
                            <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
                                {discounts.links.map((link, index) => (
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
                ADD DISCOUNT MODAL
            ========================================= */}

            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>Add Discount</DialogTitle>

                        <DialogDescription>
                            Create a new discount or promotion.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        {/* Name */}
                        <div>
                            <label className="mb-2 block text-sm font-medium">
                                Discount Name
                            </label>

                            <Input
                                value={name}
                                onChange={(
                                    event: React.ChangeEvent<HTMLInputElement>,
                                ) => setName(event.target.value)}
                                placeholder="Example: Summer Sale"
                            />
                        </div>

                        {/* Description */}
                        <div>
                            <label className="mb-2 block text-sm font-medium">
                                Description
                            </label>

                            <textarea
                                value={description}
                                onChange={(
                                    event: React.ChangeEvent<HTMLTextAreaElement>,
                                ) => setDescription(event.target.value)}
                                placeholder="Describe this discount..."
                                rows={3}
                                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                            />
                        </div>

                        {/* Discount Type */}
                        <div>
                            <label className="mb-2 block text-sm font-medium">
                                Discount Type
                            </label>

                            <Select
                                value={discountType}
                                onValueChange={setDiscountType}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select type" />
                                </SelectTrigger>

                                <SelectContent>
                                    <SelectItem value="percentage">
                                        Percentage
                                    </SelectItem>

                                    <SelectItem value="fixed">
                                        Fixed Amount
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Applies To */}
                        <div>
                            <label className="mb-2 block text-sm font-medium">
                                Applies To
                            </label>

                            <Select
                                value={appliesTo}
                                onValueChange={setAppliesTo}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select applies to" />
                                </SelectTrigger>

                                <SelectContent>
                                    <SelectItem value="all">
                                        All Customers
                                    </SelectItem>

                                    <SelectItem value="members">
                                        Members Only
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Percentage */}
                        {discountType === 'percentage' && (
                            <div>
                                <label className="mb-2 block text-sm font-medium">
                                    Percentage (%)
                                </label>

                                <Input
                                    type="number"
                                    min="0"
                                    max="100"
                                    step="0.01"
                                    value={percentage}
                                    onChange={(
                                        event: React.ChangeEvent<HTMLInputElement>,
                                    ) => setPercentage(event.target.value)}
                                    placeholder="Example: 15"
                                />
                            </div>
                        )}

                        {/* Fixed Amount */}
                        {discountType === 'fixed' && (
                            <div>
                                <label className="mb-2 block text-sm font-medium">
                                    Fixed Amount
                                </label>

                                <Input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={fixedAmount}
                                    onChange={(
                                        event: React.ChangeEvent<HTMLInputElement>,
                                    ) => setFixedAmount(event.target.value)}
                                    placeholder="Example: 10.00"
                                />
                            </div>
                        )}

                        {/* Select Items */}
                        <div>
                            <label className="mb-2 block text-sm font-medium">
                                Select Items
                            </label>

                            <div className="max-h-60 overflow-y-auto rounded-md border p-3">
                                {menuItems.length === 0 ? (
                                    <p className="text-sm text-muted-foreground">
                                        No menu items available.
                                    </p>
                                ) : (
                                    <div className="space-y-2">
                                        {menuItems.map((menuItem) => (
                                            <div
                                                key={menuItem.id}
                                                className="flex items-center space-x-2"
                                            >
                                                <Checkbox
                                                    id={`add-menu-item-${menuItem.id}`}
                                                    checked={selectedMenuItems.includes(
                                                        menuItem.id,
                                                    )}
                                                    onCheckedChange={() => {
                                                        setSelectedMenuItems(
                                                            (prev) =>
                                                                prev.includes(
                                                                    menuItem.id,
                                                                )
                                                                    ? prev.filter(
                                                                          (
                                                                              id,
                                                                          ) =>
                                                                              id !==
                                                                              menuItem.id,
                                                                      )
                                                                    : [
                                                                          ...prev,
                                                                          menuItem.id,
                                                                      ],
                                                        );
                                                    }}
                                                />
                                                <label
                                                    htmlFor={`add-menu-item-${menuItem.id}`}
                                                    className="text-sm font-normal"
                                                >
                                                    {menuItem.name}
                                                </label>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Status */}
                        <div>
                            <label className="mb-2 block text-sm font-medium">
                                Status
                            </label>

                            <Select value={status} onValueChange={setStatus}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select status" />
                                </SelectTrigger>

                                <SelectContent>
                                    <SelectItem value="active">
                                        Active
                                    </SelectItem>

                                    <SelectItem value="inactive">
                                        Inactive
                                    </SelectItem>

                                    <SelectItem value="scheduled">
                                        Scheduled
                                    </SelectItem>

                                    <SelectItem value="expired">
                                        Expired
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Start Date */}
                        <div>
                            <label className="mb-2 block text-sm font-medium">
                                Start Date
                            </label>

                            <Input
                                type="date"
                                value={startDate}
                                onChange={(
                                    event: React.ChangeEvent<HTMLInputElement>,
                                ) => setStartDate(event.target.value)}
                            />
                        </div>

                        {/* End Date */}
                        <div>
                            <label className="mb-2 block text-sm font-medium">
                                End Date
                            </label>

                            <Input
                                type="date"
                                value={endDate}
                                onChange={(
                                    event: React.ChangeEvent<HTMLInputElement>,
                                ) => setEndDate(event.target.value)}
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            variant="destructive"
                            onClick={() => setIsAddOpen(false)}
                        >
                            Cancel
                        </Button>

                        <Button onClick={handleAdd}>Add Discount</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* =========================================
                VIEW DISCOUNT MODAL
            ========================================= */}

            <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
                <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>Discount Details</DialogTitle>

                        <DialogDescription>
                            View discount information.
                        </DialogDescription>
                    </DialogHeader>

                    {selectedDiscount && (
                        <div className="space-y-5 py-4">
                            {/* Details */}
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div>
                                    <p className="text-sm text-muted-foreground">
                                        Name
                                    </p>

                                    <p className="font-medium">
                                        {selectedDiscount.name}
                                    </p>
                                </div>

                                <div>
                                    <p className="text-sm text-muted-foreground">
                                        Type
                                    </p>

                                    <Badge variant="secondary">
                                        {selectedDiscount.discount_type ===
                                        'percentage'
                                            ? 'Percentage'
                                            : 'Fixed Amount'}
                                    </Badge>
                                </div>

                                <div>
                                    <p className="text-sm text-muted-foreground">
                                        Discount Value
                                    </p>

                                    <p className="font-medium">
                                        {selectedDiscount.discount_type ===
                                        'percentage'
                                            ? `${selectedDiscount.percentage}%`
                                            : new Intl.NumberFormat('en-US', {
                                                  style: 'currency',
                                                  currency: 'USD',
                                              }).format(
                                                  Number(
                                                      selectedDiscount.fixed_amount ||
                                                          0,
                                                  ),
                                              )}
                                    </p>
                                </div>

                                <div>
                                    <p className="text-sm text-muted-foreground">
                                        Status
                                    </p>

                                    <Badge
                                        variant={getStatusVariant(
                                            selectedDiscount.status,
                                        )}
                                    >
                                        {selectedDiscount.status
                                            .charAt(0)
                                            .toUpperCase() +
                                            selectedDiscount.status.slice(1)}
                                    </Badge>
                                </div>

                                <div>
                                    <p className="text-sm text-muted-foreground">
                                        Start Date
                                    </p>

                                    <p className="font-medium">
                                        {selectedDiscount.start_date}
                                    </p>
                                </div>

                                <div>
                                    <p className="text-sm text-muted-foreground">
                                        End Date
                                    </p>

                                    <p className="font-medium">
                                        {selectedDiscount.end_date}
                                    </p>
                                </div>
                            </div>

                            {/* Description */}
                            <div>
                                <p className="text-sm text-muted-foreground">
                                    Description
                                </p>

                                <p className="mt-1 text-sm">
                                    {selectedDiscount.description ||
                                        'No description provided.'}
                                </p>
                            </div>
                        </div>
                    )}

                    <DialogFooter>
                        <Button variant="destructive" onClick={() => setIsViewOpen(false)}>
                            Close
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* =========================================
                EDIT DISCOUNT MODAL
            ========================================= */}

            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>Edit Discount</DialogTitle>

                        <DialogDescription>
                            Update the discount information.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        {/* Name */}
                        <div>
                            <label className="mb-2 block text-sm font-medium">
                                Discount Name
                            </label>

                            <Input
                                value={name}
                                onChange={(
                                    event: React.ChangeEvent<HTMLInputElement>,
                                ) => setName(event.target.value)}
                            />
                        </div>

                        {/* Description */}
                        <div>
                            <label className="mb-2 block text-sm font-medium">
                                Description
                            </label>

                            <textarea
                                value={description}
                                onChange={(
                                    event: React.ChangeEvent<HTMLTextAreaElement>,
                                ) => setDescription(event.target.value)}
                                rows={3}
                                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                            />
                        </div>

                        {/* Discount Type */}
                        <div>
                            <label className="mb-2 block text-sm font-medium">
                                Discount Type
                            </label>

                            <Select
                                value={discountType}
                                onValueChange={setDiscountType}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select type" />
                                </SelectTrigger>

                                <SelectContent>
                                    <SelectItem value="percentage">
                                        Percentage
                                    </SelectItem>

                                    <SelectItem value="fixed">
                                        Fixed Amount
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Applies To */}
                        <div>
                            <label className="mb-2 block text-sm font-medium">
                                Applies To
                            </label>

                            <Select
                                value={appliesTo}
                                onValueChange={setAppliesTo}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select applies to" />
                                </SelectTrigger>

                                <SelectContent>
                                    <SelectItem value="all">
                                        All Customers
                                    </SelectItem>

                                    <SelectItem value="members">
                                        Members Only
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Percentage */}
                        {discountType === 'percentage' && (
                            <div>
                                <label className="mb-2 block text-sm font-medium">
                                    Percentage (%)
                                </label>

                                <Input
                                    type="number"
                                    min="0"
                                    max="100"
                                    step="0.01"
                                    value={percentage}
                                    onChange={(
                                        event: React.ChangeEvent<HTMLInputElement>,
                                    ) => setPercentage(event.target.value)}
                                />
                            </div>
                        )}

                        {/* Fixed Amount */}
                        {discountType === 'fixed' && (
                            <div>
                                <label className="mb-2 block text-sm font-medium">
                                    Fixed Amount
                                </label>

                                <Input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={fixedAmount}
                                    onChange={(
                                        event: React.ChangeEvent<HTMLInputElement>,
                                    ) => setFixedAmount(event.target.value)}
                                />
                            </div>
                        )}

                        {/* Select Items */}
                        <div>
                            <label className="mb-2 block text-sm font-medium">
                                Select Items
                            </label>

                            <div className="max-h-60 overflow-y-auto rounded-md border p-3">
                                {menuItems.length === 0 ? (
                                    <p className="text-sm text-muted-foreground">
                                        No menu items available.
                                    </p>
                                ) : (
                                    <div className="space-y-2">
                                        {menuItems.map((menuItem) => (
                                            <div
                                                key={menuItem.id}
                                                className="flex items-center space-x-2"
                                            >
                                                <Checkbox
                                                    id={`edit-menu-item-${menuItem.id}`}
                                                    checked={editSelectedMenuItems.includes(
                                                        menuItem.id,
                                                    )}
                                                    onCheckedChange={() => {
                                                        setEditSelectedMenuItems(
                                                            (prev) =>
                                                                prev.includes(
                                                                    menuItem.id,
                                                                )
                                                                    ? prev.filter(
                                                                          (
                                                                              id,
                                                                          ) =>
                                                                              id !==
                                                                              menuItem.id,
                                                                      )
                                                                    : [
                                                                          ...prev,
                                                                          menuItem.id,
                                                                      ],
                                                        );
                                                    }}
                                                />
                                                <label
                                                    htmlFor={`edit-menu-item-${menuItem.id}`}
                                                    className="text-sm font-normal"
                                                >
                                                    {menuItem.name}
                                                </label>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Status */}
                        <div>
                            <label className="mb-2 block text-sm font-medium">
                                Status
                            </label>

                            <Select value={status} onValueChange={setStatus}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select status" />
                                </SelectTrigger>

                                <SelectContent>
                                    <SelectItem value="active">
                                        Active
                                    </SelectItem>

                                    <SelectItem value="inactive">
                                        Inactive
                                    </SelectItem>

                                    <SelectItem value="scheduled">
                                        Scheduled
                                    </SelectItem>

                                    <SelectItem value="expired">
                                        Expired
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Start Date */}
                        <div>
                            <label className="mb-2 block text-sm font-medium">
                                Start Date
                            </label>

                            <Input
                                type="date"
                                value={startDate}
                                onChange={(
                                    event: React.ChangeEvent<HTMLInputElement>,
                                ) => setStartDate(event.target.value)}
                            />
                        </div>

                        {/* End Date */}
                        <div>
                            <label className="mb-2 block text-sm font-medium">
                                End Date
                            </label>

                            <Input
                                type="date"
                                value={endDate}
                                onChange={(
                                    event: React.ChangeEvent<HTMLInputElement>,
                                ) => setEndDate(event.target.value)}
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            variant="destructive"
                            onClick={() => setIsEditOpen(false)}
                        >
                            Cancel
                        </Button>

                        <Button onClick={handleUpdate}>Update Discount</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* =========================================
                DELETE DISCOUNT MODAL
            ========================================= */}

            <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Discount?</DialogTitle>

                        <DialogDescription>
                            Are you sure you want to delete{' '}
                            <strong>{selectedDiscount?.name}</strong>? This
                            action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>

                    <DialogFooter>
                        <Button
                            variant="destructive"
                            onClick={() => setIsDeleteOpen(false)}
                        >
                            Cancel
                        </Button>

                        <Button variant="destructive" onClick={handleDelete}>
                            Delete Discount
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

DiscountsIndex.layout = {
    breadcrumbs: [
        {
            title: 'Discounts',
            href: discountsIndex.url(),
        },
    ],
};
