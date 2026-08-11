import { Head, router } from '@inertiajs/react';
import {
    Eye,
    Pencil,
    Plus,
    Search,
    Trash2,
    Utensils,
} from 'lucide-react';
import { useState } from 'react';

import Heading from '@/components/heading';
import StatusToggle from '@/components/status-toggle';

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
import { useCan } from '@/hooks/use-can';

import {
index as itemsIndex,
store as itemsStore,
update as itemsUpdate,
destroy as itemsDestroy,
toggleAvailability,
} from '@/routes/manager/items';

import type { PaginatedData } from '@/types';

type MenuCategory = {
id: number;
name: string;
};

type MenuItem = {
    id: number;
    category_id: number;
    name: string;
    description: string | null;
    price: string;
    image: string | null;
    preparation_time: number | null;
    is_available: boolean;
    category: MenuCategory | null;
};

type Props = {
    items: PaginatedData<MenuItem>;
    categories: MenuCategory[];
    filters: {
        search?: string;
        category_id?: string;
        availability?: string;
    };
};

export default function ItemsIndex({
items,
categories,
filters,
}: Props) {
const can = useCan();

// -----------------------------------------
// Search
// -----------------------------------------


const [search, setSearch] = useState(
    filters.search || '',
);

// -----------------------------------------
// Modal States
// -----------------------------------------

const [isAddOpen, setIsAddOpen] = useState(false);
const [isViewOpen, setIsViewOpen] = useState(false);
const [isEditOpen, setIsEditOpen] = useState(false);
const [isDeleteOpen, setIsDeleteOpen] = useState(false);

// -----------------------------------------
// Selected Item
// -----------------------------------------

const [selectedItem, setSelectedItem] =
    useState<MenuItem | null>(null);

// -----------------------------------------
// Form Fields
// -----------------------------------------

const [categoryId, setCategoryId] = useState('');
const [name, setName] = useState('');
const [description, setDescription] = useState('');
const [price, setPrice] = useState('');
const [preparationTime, setPreparationTime] =
    useState('');
const [isAvailable, setIsAvailable] =
    useState(true);
const [image, setImage] = useState<File | null>(
    null,
);

// -----------------------------------------
// Search
// -----------------------------------------

const handleSearch = (value: string) => {
    setSearch(value);

    router.get(
        itemsIndex.url(),
        {
            search: value,
            category_id:
                filters.category_id,
            availability:
                filters.availability,
        },
        {
            preserveState: true,
            replace: true,
        },
    );
};

// -----------------------------------------
// Category Filter
// -----------------------------------------

const handleCategoryFilter = (
    value: string,
) => {
    router.get(
        itemsIndex.url(),
        {
            search,
            category_id:
                value === 'all'
                    ? undefined
                    : value,
            availability:
                filters.availability,
        },
        {
            preserveState: true,
            replace: true,
        },
    );
};

// -----------------------------------------
// Availability Filter
// -----------------------------------------

const handleAvailabilityFilter = (
    value: string,
) => {
    router.get(
        itemsIndex.url(),
        {
            search,
            category_id:
                filters.category_id,
            availability:
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

// -----------------------------------------
// Open Add Modal
// -----------------------------------------

const openAddModal = () => {
    setSelectedItem(null);

    setCategoryId('');
    setName('');
    setDescription('');
    setPrice('');
    setPreparationTime('');
    setIsAvailable(true);
    setImage(null);

    setIsAddOpen(true);
};

// -----------------------------------------
// Open View Modal
// -----------------------------------------

const openViewModal = (
    item: MenuItem,
) => {
    setSelectedItem(item);
    setIsViewOpen(true);
};

// -----------------------------------------
// Open Edit Modal
// -----------------------------------------

const openEditModal = (
    item: MenuItem,
) => {
    setSelectedItem(item);

    setCategoryId(
        String(item.category_id),
    );
    setName(item.name);
    setDescription(
        item.description || '',
    );
    setPrice(item.price);
    setPreparationTime(
        item.preparation_time
            ? String(
                  item.preparation_time,
              )
            : '',
    );
    setIsAvailable(
        item.is_available,
    );
    setImage(null);

    setIsEditOpen(true);
};

// -----------------------------------------
// Open Delete Modal
// -----------------------------------------

const openDeleteModal = (
    item: MenuItem,
) => {
    setSelectedItem(item);
    setIsDeleteOpen(true);
};

// -----------------------------------------
// Add Menu Item
// -----------------------------------------

const handleAdd = () => {
    if (
        !categoryId ||
        !name.trim() ||
        !price
    ) {
        return;
    }

    const formData = new FormData();

    formData.append(
        'category_id',
        categoryId,
    );

    formData.append('name', name);

    if (description) {
        formData.append(
            'description',
            description,
        );
    }

    formData.append('price', price);

    if (preparationTime) {
        formData.append(
            'preparation_time',
            preparationTime,
        );
    }

    formData.append(
        'is_available',
        isAvailable ? '1' : '0',
    );

    if (image) {
        formData.append('image', image);
    }

    router.post(
        itemsStore.url(),
        formData,
        {
            forceFormData: true,

            onSuccess: () => {
                setIsAddOpen(false);

                setCategoryId('');
                setName('');
                setDescription('');
                setPrice('');
                setPreparationTime('');
                setIsAvailable(true);
                setImage(null);
            },
        },
    );
};

// -----------------------------------------
// Update Menu Item
// -----------------------------------------

const handleUpdate = () => {
    if (
        !selectedItem ||
        !categoryId ||
        !name.trim() ||
        !price
    ) {
        return;
    }

    const formData = new FormData();

    formData.append(
        'category_id',
        categoryId,
    );

    formData.append('name', name);

    if (description) {
        formData.append(
            'description',
            description,
        );
    }

    formData.append('price', price);

    if (preparationTime) {
        formData.append(
            'preparation_time',
            preparationTime,
        );
    }

    formData.append(
        'is_available',
        isAvailable ? '1' : '0',
    );

    if (image) {
        formData.append('image', image);
    }

    formData.append(
        '_method',
        'PUT',
    );

    router.post(
        itemsUpdate.url(
            selectedItem.id,
        ),
        formData,
        {
            forceFormData: true,

            onSuccess: () => {
                setIsEditOpen(false);
                setSelectedItem(null);
                setImage(null);
            },
        },
    );
};

// -----------------------------------------
// Toggle Availability
// -----------------------------------------

const handleToggleAvailability = (
    item: MenuItem,
) => {
    router.patch(
        toggleAvailability.url(
            item.id,
        ),
        {},
        {
            preserveScroll: true,
        },
    );
};

// -----------------------------------------
// Delete Menu Item
// -----------------------------------------

const handleDelete = () => {
    if (!selectedItem) {
        return;
    }

    router.delete(
        itemsDestroy.url(
            selectedItem.id,
        ),
        {
            onSuccess: () => {
                setIsDeleteOpen(false);
                setSelectedItem(null);
            },
        },
    );
};

// -----------------------------------------
// Format Price
// -----------------------------------------

const formatPrice = (
    itemPrice: string,
) => {
    return new Intl.NumberFormat(
        'en-US',
        {
            style: 'currency',
            currency: 'USD',
        },
    ).format(Number(itemPrice));
};

return (
    <>
        <Head title="Menu Items" />

        <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl p-4">

            {/* Page Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <Heading
                    title="Menu Items"
                    description="Manage all menu items."
                    icon={Utensils}
                />

                {can('create menu items') && (
                    <Button
                        onClick={openAddModal}
                    >
                        <Plus className="mr-2 h-4 w-4" />
                        Add Menu Item
                    </Button>
                )}
            </div>

            {/* Items Card */}
            <Card>
                <CardHeader>
                    <CardTitle>
                        Menu Items
                    </CardTitle>

                    {/* Filters */}
                    <div className="flex flex-wrap items-center gap-3 pt-4">

                        {/* Search */}
                        <div className="relative max-w-sm flex-1">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

                            <Input
                                placeholder="Search items..."
                                value={search}
                                onChange={(
                                    event,
                                ) =>
                                    handleSearch(
                                        event
                                            .target
                                            .value,
                                    )
                                }
                                className="pl-9"
                            />
                        </div>

                        {/* Category */}
                        <Select
                            value={
                                filters.category_id ||
                                'all'
                            }
                            onValueChange={
                                handleCategoryFilter
                            }
                        >
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="All Categories" />
                            </SelectTrigger>

                            <SelectContent>
                                <SelectItem value="all">
                                    All Categories
                                </SelectItem>

                                {categories.map(
                                    (
                                        category,
                                    ) => (
                                        <SelectItem
                                            key={
                                                category.id
                                            }
                                            value={String(
                                                category.id,
                                            )}
                                        >
                                            {
                                                category.name
                                            }
                                        </SelectItem>
                                    ),
                                )}
                            </SelectContent>
                        </Select>

                        {/* Availability */}
                        <Select
                            value={
                                filters.availability ||
                                'all'
                            }
                            onValueChange={
                                handleAvailabilityFilter
                            }
                        >
                            <SelectTrigger className="w-[160px]">
                                <SelectValue placeholder="Availability" />
                            </SelectTrigger>

                            <SelectContent>
                                <SelectItem value="all">
                                    All
                                </SelectItem>

                                <SelectItem value="1">
                                    Available
                                </SelectItem>

                                <SelectItem value="0">
                                    Unavailable
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardHeader>

                <CardContent>
                    {items.data.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <p className="text-lg font-medium">
                                No menu items found
                            </p>

                            <p className="mt-1 text-sm text-muted-foreground">
                                Try changing your filters or add a new menu item.
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b text-left">
                                        <th className="p-3">
                                            Image
                                        </th>

                                        <th className="p-3">
                                            Name
                                        </th>

                                        <th className="p-3">
                                            Category
                                        </th>

                                        <th className="p-3">
                                            Price
                                        </th>

                                        <th className="p-3">
                                            Prep Time
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
                                    {items.data.map(
                                        (item) => (
                                            <tr
                                                key={
                                                    item.id
                                                }
                                                className="border-b last:border-0 hover:bg-muted/50"
                                            >
                                                {/* Image */}
                                                <td className="p-3">
                                                    {item.image ? (
                                                        <img
                                                            src={`/storage/${item.image}`}
                                                            alt={
                                                                item.name
                                                            }
                                                            className="h-12 w-12 rounded-md object-cover"
                                                            onError={(
                                                                event,
                                                            ) => {
                                                                event.currentTarget.style.display =
                                                                    'none';
                                                            }}
                                                        />
                                                    ) : (
                                                        <div className="flex h-12 w-12 items-center justify-center rounded-md bg-muted text-lg">
                                                            🍽️
                                                        </div>
                                                    )}
                                                </td>

                                                {/* Name */}
                                                <td className="p-3 font-medium">
                                                    {
                                                        item.name
                                                    }
                                                </td>

                                                {/* Category */}
                                                <td className="p-3">
                                                    <Badge variant="secondary">
                                                        {item
                                                            .category
                                                            ?.name ||
                                                            'Uncategorized'}
                                                    </Badge>
                                                </td>

                                                {/* Price */}
                                                <td className="p-3 font-medium">
                                                    {formatPrice(
                                                        item.price,
                                                    )}
                                                </td>

                                                {/* Preparation Time */}
                                                <td className="p-3 text-muted-foreground">
                                                    {item.preparation_time
                                                        ? `${item.preparation_time} min`
                                                        : '—'}
                                                </td>

                                                {/* Status */}
                                                <td className="p-3">
                                                    <Badge
                                                        variant={
                                                            item.is_available
                                                                ? 'default'
                                                                : 'destructive'
                                                        }
                                                    >
                                                        {item.is_available
                                                            ? 'Available'
                                                            : 'Unavailable'}
                                                    </Badge>
                                                </td>

                                                {/* Actions */}
                                                <td className="p-3">
                                                    <div className="flex items-center justify-end gap-2">

                                                        {/* Toggle */}
                                                        {can('status menu items') && (
                                                            <StatusToggle
                                                                checked={
                                                                    item.is_available
                                                                }
                                                                onCheckedChange={() =>
                                                                    handleToggleAvailability(
                                                                        item,
                                                                    )
                                                                }
                                                                onLabel="Mark unavailable"
                                                                offLabel="Mark available"
                                                                ariaLabel={
                                                                    item.is_available
                                                                        ? 'Mark item unavailable'
                                                                        : 'Mark item available'
                                                                }
                                                            />
                                                        )}

                                                        {/* View */}
                                                        {can('view menu items') && (
                                                            <Button
                                                                variant="outline"
                                                                size="icon"
                                                                onClick={() =>
                                                                    openViewModal(
                                                                        item,
                                                                    )
                                                                }
                                                                title="View menu item"
                                                            >
                                                                <Eye className="h-4 w-4" />
                                                            </Button>
                                                        )}

                                                        {/* Edit */}
                                                        {can('update menu items') && (
                                                            <Button
                                                                variant="outline"
                                                                size="icon"
                                                                onClick={() =>
                                                                    openEditModal(
                                                                        item,
                                                                    )
                                                                }
                                                                title="Edit menu item"
                                                            >
                                                                <Pencil className="h-4 w-4" />
                                                            </Button>
                                                        )}

                                                        {/* Delete */}
                                                        {can('delete menu items') && (
                                                            <Button
                                                                variant="destructive"
                                                                size="icon"
                                                                onClick={() =>
                                                                    openDeleteModal(
                                                                        item,
                                                                    )
                                                                }
                                                                title="Delete menu item"
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

                    {/* Pagination */}
                    {items.last_page > 1 && (
                        <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
                            {items.links.map(
                                (
                                    link,
                                    index,
                                ) => (
                                    <Button
                                        key={
                                            index
                                        }
                                        variant={
                                            link.active
                                                ? 'default'
                                                : 'outline'
                                        }
                                        size="sm"
                                        disabled={
                                            !link.url
                                        }
                                        onClick={() => {
                                            if (
                                                link.url
                                            ) {
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
                                ),
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>

        {/* =========================================
            ADD MENU ITEM MODAL
        ========================================= */}

        <Dialog
            open={isAddOpen}
            onOpenChange={setIsAddOpen}
        >
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[550px]">
                <DialogHeader>
                    <DialogTitle>
                        Add Menu Item
                    </DialogTitle>

                    <DialogDescription>
                        Create a new menu item.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">

                    {/* Category */}
                    <div>
                        <label className="mb-2 block text-sm font-medium">
                            Category
                        </label>

                        <Select
                            value={categoryId}
                            onValueChange={
                                setCategoryId
                            }
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select category" />
                            </SelectTrigger>

                            <SelectContent>
                                {categories.map(
                                    (
                                        category,
                                    ) => (
                                        <SelectItem
                                            key={
                                                category.id
                                            }
                                            value={String(
                                                category.id,
                                            )}
                                        >
                                            {
                                                category.name
                                            }
                                        </SelectItem>
                                    ),
                                )}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Name */}
                    <div>
                        <label className="mb-2 block text-sm font-medium">
                            Item Name
                        </label>

                        <Input
                            value={name}
                            onChange={(
                                event,
                            ) =>
                                setName(
                                    event.target
                                        .value,
                                )
                            }
                            placeholder="Example: Chicken Burger"
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label className="mb-2 block text-sm font-medium">
                            Description
                        </label>

                        <textarea
                            value={
                                description
                            }
                            onChange={(
                                event,
                            ) =>
                                setDescription(
                                    event
                                        .target
                                        .value,
                                )
                            }
                            placeholder="Describe this menu item..."
                            rows={4}
                            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                        />
                    </div>

                    {/* Price */}
                    <div>
                        <label className="mb-2 block text-sm font-medium">
                            Price
                        </label>

                        <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={price}
                            onChange={(
                                event,
                            ) =>
                                setPrice(
                                    event.target
                                        .value,
                                )
                            }
                            placeholder="Example: 10.99"
                        />
                    </div>

                    {/* Preparation Time */}
                    <div>
                        <label className="mb-2 block text-sm font-medium">
                            Preparation Time (minutes)
                        </label>

                        <Input
                            type="number"
                            min="0"
                            max="1440"
                            value={
                                preparationTime
                            }
                            onChange={(
                                event,
                            ) =>
                                setPreparationTime(
                                    event.target
                                        .value,
                                )
                            }
                            placeholder="Example: 20"
                        />
                    </div>

                    {/* Image */}
                    <div>
                        <label className="mb-2 block text-sm font-medium">
                            Item Image
                        </label>

                        <Input
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            onChange={(
                                event,
                            ) =>
                                setImage(
                                    event.target
                                        .files?.[0] ||
                                        null,
                                )
                            }
                        />
                    </div>

                    {/* Available */}
                    <div className="flex items-center gap-3">
                        <StatusToggle
                            checked={
                                isAvailable
                            }
                            onCheckedChange={() =>
                                setIsAvailable(
                                    !isAvailable,
                                )
                            }
                            onLabel="Available"
                            offLabel="Unavailable"
                            ariaLabel="Toggle item availability"
                        />

                        <label className="text-sm font-medium">
                            {isAvailable
                                ? 'Available'
                                : 'Unavailable'}
                        </label>
                    </div>
                </div>

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() =>
                            setIsAddOpen(
                                false,
                            )
                        }
                    >
                        Cancel
                    </Button>

                    <Button
                        onClick={handleAdd}
                        disabled={
                            !categoryId ||
                            !name.trim() ||
                            !price
                        }
                    >
                        Add Menu Item
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>

        {/* =========================================
            VIEW MENU ITEM MODAL
        ========================================= */}

        <Dialog
            open={isViewOpen}
            onOpenChange={
                setIsViewOpen
            }
        >
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[550px]">
                <DialogHeader>
                    <DialogTitle>
                        Menu Item Details
                    </DialogTitle>

                    <DialogDescription>
                        View menu item information.
                    </DialogDescription>
                </DialogHeader>

                {selectedItem && (
                    <div className="space-y-5 py-4">

                        {/* Image */}
                        {selectedItem.image && (
                            <div className="flex justify-center">
                                <img
                                    src={`/storage/${selectedItem.image}`}
                                    alt={
                                        selectedItem.name
                                    }
                                    className="h-48 w-full rounded-lg object-cover"
                                />
                            </div>
                        )}

                        {/* Details */}
                        <div className="grid gap-4 sm:grid-cols-2">

                            <div>
                                <p className="text-sm text-muted-foreground">
                                    Name
                                </p>

                                <p className="font-medium">
                                    {
                                        selectedItem.name
                                    }
                                </p>
                            </div>

                            <div>
                                <p className="text-sm text-muted-foreground">
                                    Category
                                </p>

                                <p className="font-medium">
                                    {selectedItem
                                        .category
                                        ?.name ||
                                        'Uncategorized'}
                                </p>
                            </div>

                            <div>
                                <p className="text-sm text-muted-foreground">
                                    Price
                                </p>

                                <p className="font-medium">
                                    {formatPrice(
                                        selectedItem.price,
                                    )}
                                </p>
                            </div>

                            <div>
                                <p className="text-sm text-muted-foreground">
                                    Preparation Time
                                </p>

                                <p className="font-medium">
                                    {selectedItem.preparation_time
                                        ? `${selectedItem.preparation_time} minutes`
                                        : 'Not specified'}
                                </p>
                            </div>

                            <div>
                                <p className="text-sm text-muted-foreground">
                                    Status
                                </p>

                                <Badge
                                    variant={
                                        selectedItem.is_available
                                            ? 'default'
                                            : 'destructive'
                                    }
                                >
                                    {selectedItem.is_available
                                        ? 'Available'
                                        : 'Unavailable'}
                                </Badge>
                            </div>
                        </div>

                        {/* Description */}
                        <div>
                            <p className="text-sm text-muted-foreground">
                                Description
                            </p>

                            <p className="mt-1 text-sm">
                                {selectedItem.description ||
                                    'No description provided.'}
                            </p>
                        </div>
                    </div>
                )}

                <DialogFooter>
                    <Button
                        onClick={() =>
                            setIsViewOpen(
                                false,
                            )
                        }
                    >
                        Close
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>

        {/* =========================================
            EDIT MENU ITEM MODAL
        ========================================= */}

        <Dialog
            open={isEditOpen}
            onOpenChange={
                setIsEditOpen
            }
        >
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[550px]">
                <DialogHeader>
                    <DialogTitle>
                        Edit Menu Item
                    </DialogTitle>

                    <DialogDescription>
                        Update the menu item information.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">

                    {/* Category */}
                    <div>
                        <label className="mb-2 block text-sm font-medium">
                            Category
                        </label>

                        <Select
                            value={
                                categoryId
                            }
                            onValueChange={
                                setCategoryId
                            }
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select category" />
                            </SelectTrigger>

                            <SelectContent>
                                {categories.map(
                                    (
                                        category,
                                    ) => (
                                        <SelectItem
                                            key={
                                                category.id
                                            }
                                            value={String(
                                                category.id,
                                            )}
                                        >
                                            {
                                                category.name
                                            }
                                        </SelectItem>
                                    ),
                                )}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Name */}
                    <div>
                        <label className="mb-2 block text-sm font-medium">
                            Item Name
                        </label>

                        <Input
                            value={name}
                            onChange={(
                                event,
                            ) =>
                                setName(
                                    event.target
                                        .value,
                                )
                            }
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label className="mb-2 block text-sm font-medium">
                            Description
                        </label>

                        <textarea
                            value={
                                description
                            }
                            onChange={(
                                event,
                            ) =>
                                setDescription(
                                    event
                                        .target
                                        .value,
                                )
                            }
                            rows={4}
                            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                        />
                    </div>

                    {/* Price */}
                    <div>
                        <label className="mb-2 block text-sm font-medium">
                            Price
                        </label>

                        <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={price}
                            onChange={(
                                event,
                            ) =>
                                setPrice(
                                    event.target
                                        .value,
                                )
                            }
                        />
                    </div>

                    {/* Preparation Time */}
                    <div>
                        <label className="mb-2 block text-sm font-medium">
                            Preparation Time (minutes)
                        </label>

                        <Input
                            type="number"
                            min="0"
                            max="1440"
                            value={
                                preparationTime
                            }
                            onChange={(
                                event,
                            ) =>
                                setPreparationTime(
                                    event.target
                                        .value,
                                )
                            }
                        />
                    </div>

                    {/* Replace Image */}
                    <div>
                        <label className="mb-2 block text-sm font-medium">
                            Replace Image
                        </label>

                        <Input
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            onChange={(
                                event,
                            ) =>
                                setImage(
                                    event.target
                                        .files?.[0] ||
                                        null,
                                )
                            }
                        />
                    </div>

                    {/* Current Image */}
                    {selectedItem?.image &&
                        !image && (
                            <p className="text-sm text-muted-foreground">
                                Current image will remain unless you upload a new one.
                            </p>
                        )}

                    {/* Available */}
                    <div className="flex items-center gap-3">
                        <StatusToggle
                            checked={
                                isAvailable
                            }
                            onCheckedChange={() =>
                                setIsAvailable(
                                    !isAvailable,
                                )
                            }
                            onLabel="Available"
                            offLabel="Unavailable"
                            ariaLabel="Toggle item availability"
                        />

                        <label className="text-sm font-medium">
                            {isAvailable
                                ? 'Available'
                                : 'Unavailable'}
                        </label>
                    </div>
                </div>

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() =>
                            setIsEditOpen(
                                false,
                            )
                        }
                    >
                        Cancel
                    </Button>

                    <Button
                        onClick={
                            handleUpdate
                        }
                        disabled={
                            !categoryId ||
                            !name.trim() ||
                            !price
                        }
                    >
                        Update Menu Item
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>

        {/* =========================================
            DELETE MENU ITEM MODAL
        ========================================= */}

        <Dialog
            open={isDeleteOpen}
            onOpenChange={
                setIsDeleteOpen
            }
        >
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>
                        Delete Menu Item?
                    </DialogTitle>

                    <DialogDescription>
                        Are you sure you want to delete{' '}
                        <strong>
                            {
                                selectedItem?.name
                            }
                        </strong>
                        ? This action cannot be undone.
                    </DialogDescription>
                </DialogHeader>

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() =>
                            setIsDeleteOpen(
                                false,
                            )
                        }
                    >
                        Cancel
                    </Button>

                    <Button
                        variant="destructive"
                        onClick={
                            handleDelete
                        }
                    >
                        Delete Menu Item
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    </>
);


}

ItemsIndex.layout = {
breadcrumbs: [
{
title: 'Menu Items',
href: itemsIndex.url(),
},
],
};
