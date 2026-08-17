import { Head, router } from '@inertiajs/react';
import { Eye, Pencil, Plus, Search, Trash2, Percent } from 'lucide-react';
import { useState } from 'react';

import { DateTimeRangePicker } from '@/components/date-time-picker';
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
    start_time: string | null;
    end_time: string | null;
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

type FormErrors = {
    name?: string;
    discountType?: string;
    appliesTo?: string;
    percentage?: string;
    menuItems?: string;
    startDateTime?: string;
    endDateTime?: string;
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
    const [startDateTime, setStartDateTime] = useState('');
    const [endDateTime, setEndDateTime] = useState('');
    const [appliesTo, setAppliesTo] = useState(filters.applies_to || 'all');
    const [selectedMenuItems, setSelectedMenuItems] = useState<number[]>([]);
    const [editSelectedMenuItems, setEditSelectedMenuItems] = useState<
        number[]
    >([]);
    const [addMenuItemSearch, setAddMenuItemSearch] = useState('');
    const [, setEditMenuItemSearch] = useState('');

    // -----------------------------------------
    // Validation Errors
    // -----------------------------------------

    const [errors, setErrors] = useState<FormErrors>({});

    // -----------------------------------------
    // Validation Helpers
    // -----------------------------------------

    const validateName = (value: string): string => {
        const trimmed = value.trim();

        if (!trimmed) {
            return 'Discount Name is required.';
        }

        if (!/^[a-zA-Z\s]+$/.test(trimmed)) {
            return 'Discount Name must contain letters only.';
        }

        return '';
    };

    const validateDiscountType = (value: string): string => {
        if (!value) {
            return 'Discount Type is required.';
        }

        return '';
    };

    const validateAppliesTo = (value: string): string => {
        if (!value) {
            return 'Please select who this discount applies to.';
        }

        return '';
    };

    const validatePercentage = (value: string): string => {
        if (!value) {
            return 'Percentage is required.';
        }

        const num = Number(value);

        if (isNaN(num) || num < 1 || num > 100) {
            return 'Percentage must be between 1 and 100.';
        }

        return '';
    };

    const validateMenuItems = (items: number[]): string => {
        if (items.length === 0) {
            return 'Please select at least one item.';
        }

        return '';
    };

    const validateStartDateTime = (value: string): string => {
        if (!value) {
            return 'Start Date & Time is required.';
        }

        const selected = new Date(value);
        const now = new Date();

        if (selected < now) {
            return 'Start Date & Time cannot be in the past.';
        }

        return '';
    };

    const validateEndDateTime = (
        endValue: string,
        startValue: string,
    ): string => {
        if (!endValue) {
            return 'End Date & Time is required.';
        }

        if (!startValue) {
            return '';
        }

        const start = new Date(startValue);
        const end = new Date(endValue);

        if (end <= start) {
            return 'End Date & Time must be later than Start Date & Time.';
        }

        return '';
    };

    const filteredAddMenuItems = menuItems.filter((menuItem) =>
        menuItem.name
            .toLowerCase()
            .includes(addMenuItemSearch.toLowerCase()),
    );

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
        setStartDateTime('');
        setEndDateTime('');
        setSelectedMenuItems([]);
        setAddMenuItemSearch('');
        setErrors({});

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
        setStartDateTime(
            discount.start_date && discount.start_time
                ? `${discount.start_date}T${discount.start_time.slice(0, 5)}`
                : discount.start_date
                  ? `${discount.start_date}T00:00`
                  : '',
        );
        setEndDateTime(
            discount.end_date && discount.end_time
                ? `${discount.end_date}T${discount.end_time.slice(0, 5)}`
                : discount.end_date
                  ? `${discount.end_date}T00:00`
                  : '',
        );
        setEditSelectedMenuItems(discount.menu_items || []);
        setEditMenuItemSearch('');

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
        const newErrors: FormErrors = {};

        const nameError = validateName(name);

        if (nameError) {
            newErrors.name = nameError;
        }

        const discountTypeError = validateDiscountType(discountType);

        if (discountTypeError) {
            newErrors.discountType = discountTypeError;
        }

        const appliesToError = validateAppliesTo(appliesTo);

        if (appliesToError) {
            newErrors.appliesTo = appliesToError;
        }

        if (discountType === 'percentage') {
            const percentageError = validatePercentage(percentage);

            if (percentageError) {
                newErrors.percentage = percentageError;
            }
        }

        const menuItemsError = validateMenuItems(selectedMenuItems);

        if (menuItemsError) {
            newErrors.menuItems = menuItemsError;
        }

        const startDateTimeError = validateStartDateTime(startDateTime);

        if (startDateTimeError) {
            newErrors.startDateTime = startDateTimeError;
        }

        const endDateTimeError = validateEndDateTime(
            endDateTime,
            startDateTime,
        );

        if (endDateTimeError) {
            newErrors.endDateTime = endDateTimeError;
        }

        setErrors(newErrors);

        if (Object.keys(newErrors).length > 0) {
            return;
        }

        const formData = new FormData();

        formData.append('name', name);
        formData.append('description', description);
        formData.append('discount_type', discountType);
        formData.append('applies_to', appliesTo);
        formData.append('status', status);
        formData.append('start_date_time', startDateTime);
        formData.append('end_date_time', endDateTime);

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
                setStartDateTime('');
                setEndDateTime('');
                setSelectedMenuItems([]);
                setAddMenuItemSearch('');
            },
        });
    };

    // -----------------------------------------
    // Update Discount
    // -----------------------------------------

    const handleUpdate = () => {
        if (!selectedDiscount || !name.trim() || !startDateTime || !endDateTime) {
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
        formData.append('start_date_time', startDateTime);
        formData.append('end_date_time', endDateTime);

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
                setEditMenuItemSearch('');
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

                                            <th className="p-3">Start Date &amp; Time</th>

                                            <th className="p-3">End Date &amp; Time</th>

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

                                                {/* Start Date & Time */}
                                                <td className="p-3 text-muted-foreground">
                                                    {discount.start_date &&
                                                    discount.start_time
                                                        ? `${discount.start_date} ${discount.start_time.slice(0, 5)}`
                                                        : discount.start_date}
                                                </td>

                                                {/* End Date & Time */}
                                                <td className="p-3 text-muted-foreground">
                                                    {discount.end_date &&
                                                    discount.end_time
                                                        ? `${discount.end_date} ${discount.end_time.slice(0, 5)}`
                                                        : discount.end_date}
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
                                ) => {
                                    const value = event.target.value;
                                    setName(value);

                                    if (errors.name) {
                                        const error = validateName(value);
                                        setErrors((prev) => ({
                                            ...prev,
                                            name: error || undefined,
                                        }));
                                    }
                                }}
                                onBlur={() => {
                                    const error = validateName(name);
                                    setErrors((prev) => ({
                                        ...prev,
                                        name: error || undefined,
                                    }));
                                }}
                                placeholder="Example: Summer Sale"
                                className={
                                    errors.name
                                        ? 'border-red-500'
                                        : name.trim() && !errors.name
                                            ? 'border-green-500'
                                            : ''
                                }
                            />

                            {errors.name && (
                                <p className="mt-1 text-sm text-red-500">
                                    {errors.name}
                                </p>
                            )}
                        </div>

                        {/* Discount Type */}
                        <div>
                            <label className="mb-2 block text-sm font-medium">
                                Discount Type
                            </label>

                            <Select
                                value={discountType}
                                onValueChange={(value) => {
                                    setDiscountType(value);
                                    setErrors((prev) => ({
                                        ...prev,
                                        discountType:
                                            validateDiscountType(value) || undefined,
                                        percentage: value === 'percentage'
                                            ? validatePercentage(percentage) || undefined
                                            : undefined,
                                    }));
                                }}
                            >
                                <SelectTrigger
                                    className={
                                        errors.discountType
                                            ? 'border-red-500'
                                            : discountType && !errors.discountType
                                                ? 'border-green-500'
                                                : ''
                                    }
                                >
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

                            {errors.discountType && (
                                <p className="mt-1 text-sm text-red-500">
                                    {errors.discountType}
                                </p>
                            )}
                        </div>

                        {/* Applies To */}
                        <div>
                            <label className="mb-2 block text-sm font-medium">
                                Applies To
                            </label>

                            <Select
                                value={appliesTo}
                                onValueChange={(value) => {
                                    setAppliesTo(value);
                                    setErrors((prev) => ({
                                        ...prev,
                                        appliesTo:
                                            validateAppliesTo(value) || undefined,
                                    }));
                                }}
                            >
                                <SelectTrigger
                                    className={
                                        errors.appliesTo
                                            ? 'border-red-500'
                                            : appliesTo && !errors.appliesTo
                                                ? 'border-green-500'
                                                : ''
                                    }
                                >
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

                            {errors.appliesTo && (
                                <p className="mt-1 text-sm text-red-500">
                                    {errors.appliesTo}
                                </p>
                            )}
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
                                    ) => {
                                        const value = event.target.value;
                                        setPercentage(value);

                                        if (errors.percentage) {
                                            const error = validatePercentage(value);
                                            setErrors((prev) => ({
                                                ...prev,
                                                percentage: error || undefined,
                                            }));
                                        }
                                    }}
                                    onBlur={() => {
                                        const error = validatePercentage(percentage);
                                        setErrors((prev) => ({
                                            ...prev,
                                            percentage: error || undefined,
                                        }));
                                    }}
                                    placeholder="Example: 15"
                                    className={
                                        errors.percentage
                                            ? 'border-red-500'
                                            : percentage && !errors.percentage
                                                ? 'border-green-500'
                                                : ''
                                    }
                                />

                                {errors.percentage && (
                                    <p className="mt-1 text-sm text-red-500">
                                        {errors.percentage}
                                    </p>
                                )}
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

                            <Input
                                type="text"
                                placeholder="Search menu items..."
                                value={addMenuItemSearch}
                                onChange={(
                                    event: React.ChangeEvent<HTMLInputElement>,
                                ) =>
                                    setAddMenuItemSearch(
                                        event.target.value,
                                    )
                                }
                                className="mb-2"
                            />

                            <div
                                className={
                                    errors.menuItems
                                        ? 'max-h-60 overflow-y-auto rounded-md border border-red-500 p-3'
                                        : selectedMenuItems.length > 0
                                            ? 'max-h-60 overflow-y-auto rounded-md border border-green-500 p-3'
                                            : 'max-h-60 overflow-y-auto rounded-md border p-3'
                                }
                            >
                                {filteredAddMenuItems.length === 0 ? (
                                    <p className="text-sm text-muted-foreground">
                                        No menu items available.
                                    </p>
                                ) : (
                                    <div className="space-y-2">
                                        {filteredAddMenuItems.map(
                                            (menuItem) => (
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
                                                                (prev) => {
                                                                    const next = prev.includes(
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
                                                                        ];
                                                                    setErrors((current) => ({
                                                                        ...current,
                                                                        menuItems:
                                                                            validateMenuItems(next) || undefined,
                                                                    }));

                                                                    return next;
                                                                },
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
                                            ),
                                        )}
                                    </div>
                                )}
                            </div>

                            {errors.menuItems && (
                                <p className="mt-1 text-sm text-red-500">
                                    {errors.menuItems}
                                </p>
                            )}
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

                         {/* Date & Time Range */}
                         <div>
                             <label className="mb-2 block text-sm font-medium">
                                 Date &amp; Time Range
                             </label>
                             <DateTimeRangePicker
                                 startValue={startDateTime}
                                 endValue={endDateTime}
                                 onStartChange={(val) => {
                                     setStartDateTime(val);
                                     setErrors((prev) => ({
                                         ...prev,
                                         startDateTime:
                                             validateStartDateTime(val) ||
                                             undefined,
                                         endDateTime:
                                             validateEndDateTime(
                                                 endDateTime,
                                                 val,
                                             ) || undefined,
                                     }));
                                 }}
                                 onEndChange={(val) => {
                                     setEndDateTime(val);
                                     setErrors((prev) => ({
                                         ...prev,
                                         endDateTime:
                                             validateEndDateTime(
                                                 val,
                                                 startDateTime,
                                             ) || undefined,
                                     }));
                                 }}
                                 startError={errors.startDateTime}
                                 endError={errors.endDateTime}
                                 defaultStartTime="09:00"
                                 defaultEndTime="23:59"
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
                    </div>

                    <DialogFooter>
                        <Button
                            variant="outline"
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
                                        Start Date &amp; Time
                                    </p>

                                    <p className="font-medium">
                                        {selectedDiscount.start_date &&
                                        selectedDiscount.start_time
                                            ? `${selectedDiscount.start_date} ${selectedDiscount.start_time.slice(0, 5)}`
                                            : selectedDiscount.start_date}
                                    </p>
                                </div>

                                <div>
                                    <p className="text-sm text-muted-foreground">
                                        End Date &amp; Time
                                    </p>

                                    <p className="font-medium">
                                        {selectedDiscount.end_date &&
                                        selectedDiscount.end_time
                                            ? `${selectedDiscount.end_date} ${selectedDiscount.end_time.slice(0, 5)}`
                                            : selectedDiscount.end_date}
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
                        <Button onClick={() => setIsViewOpen(false)}>
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
                                ) => {
                                    const value = event.target.value;
                                    setName(value);

                                    if (errors.name) {
                                        const error = validateName(value);
                                        setErrors((prev) => ({
                                            ...prev,
                                            name: error || undefined,
                                        }));
                                    }
                                }}
                                onBlur={() => {
                                    const error = validateName(name);
                                    setErrors((prev) => ({
                                        ...prev,
                                        name: error || undefined,
                                    }));
                                }}
                                placeholder="Example: Summer Sale"
                                className={
                                    errors.name
                                        ? 'border-red-500'
                                        : name.trim() && !errors.name
                                            ? 'border-green-500'
                                            : ''
                                }
                            />

                            {errors.name && (
                                <p className="mt-1 text-sm text-red-500">
                                    {errors.name}
                                </p>
                            )}
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

                        {/* Date & Time Range */}
                        <div>
                            <label className="mb-2 block text-sm font-medium">
                                Date &amp; Time Range
                            </label>
                            <DateTimeRangePicker
                                startValue={startDateTime}
                                endValue={endDateTime}
                                onStartChange={(val) =>
                                    setStartDateTime(val)
                                }
                                onEndChange={(val) =>
                                    setEndDateTime(val)
                                }
                                defaultStartTime="09:00"
                                defaultEndTime="23:59"
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            variant="outline"
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
                            variant="outline"
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
