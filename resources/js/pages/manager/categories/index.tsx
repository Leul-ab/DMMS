
import { Head, router } from '@inertiajs/react';
import {
    Eye,
    Pencil,
    Plus,
    Search,
    Tags,
    Trash2,
} from 'lucide-react';
import { useState } from 'react';

import Heading from '@/components/heading';
import InputError from '@/components/input-error';
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
import { useCan } from '@/hooks/use-can';
import { cn } from '@/lib/utils';

import {
    index as categoriesIndex,
    store as categoriesStore,
    update as categoriesUpdate,
    destroy as categoriesDestroy,
} from '@/routes/manager/categories';

import type { PaginatedData } from '@/types';

type MenuCategory = {
    id: number;
    name: string;
    description: string | null;
    image: string | null;
    sort_order: number;
    is_active: boolean;
    menu_items_count: number;
};

type Props = {
    categories: PaginatedData<MenuCategory>;
    filters: {
        search?: string;
    };
};

type AddCategoryField = 'name' | 'sortOrder' | 'image';

type AddCategoryFormValues = {
    name: string;
    sortOrder: string;
    image: File | null;
};

const ALLOWED_IMAGE_TYPES = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
];

const MAX_IMAGE_SIZE = 2 * 1024 * 1024;

function getNextSortOrder(categories: MenuCategory[]): string {
    if (categories.length === 0) {
        return '1';
    }

    const maxOrder = Math.max(
        ...categories.map((category) => category.sort_order),
    );

    return String(maxOrder + 1);
}

function isValidSortOrder(value: string): boolean {
    const trimmed = value.trim();

    if (trimmed === '') {
        return false;
    }

    if (!/^\d+$/.test(trimmed)) {
        return false;
    }

    return Number(trimmed) >= 0;
}

function validateAddCategoryImage(file: File | null): string | null {
    if (!file) {
        return null;
    }

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
        return 'Image must be a JPG, PNG, or WebP file.';
    }

    if (file.size > MAX_IMAGE_SIZE) {
        return 'Image must not exceed 2MB.';
    }

    return null;
}

function validateAddCategoryField(
    field: AddCategoryField,
    values: AddCategoryFormValues,
): string | null {
    switch (field) {
        case 'name': {
            const trimmedName = values.name.trim();

            if (!trimmedName) {
                return 'Category Name is required.';
            }

            if (!/^[a-zA-Z\s]+$/.test(trimmedName)) {
                return 'Category Name must contain letters only.';
            }

            return null;
        }
        case 'sortOrder':
            return isValidSortOrder(values.sortOrder)
                ? null
                : 'Sort Order must be a valid number.';
        case 'image':
            return validateAddCategoryImage(values.image);
    }
}

function validateAllAddCategoryFields(
    values: AddCategoryFormValues,
): Partial<Record<AddCategoryField, string>> {
    const errors: Partial<Record<AddCategoryField, string>> = {};

    for (const field of ['name', 'sortOrder'] as const) {
        const error = validateAddCategoryField(field, values);

        if (error) {
            errors[field] = error;
        }
    }

    if (values.image) {
        const imageError = validateAddCategoryImage(values.image);

        if (imageError) {
            errors.image = imageError;
        }
    }

    return errors;
}

function getAddCategoryFieldInputClassName(
    field: 'name' | 'sortOrder',
    errors: Partial<Record<AddCategoryField, string>>,
    touched: Partial<Record<AddCategoryField, boolean>>,
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

function getAddCategoryImageInputClassName(
    error: string | undefined,
): string {
    if (error) {
        return 'border-red-500 focus-visible:border-red-500 focus-visible:ring-red-500/20';
    }

    return '';
}

export default function CategoriesIndex({
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
    // Modal states
    // -----------------------------------------

    const [isAddOpen, setIsAddOpen] = useState(false);
    const [isViewOpen, setIsViewOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);

    // -----------------------------------------
    // Selected category
    // -----------------------------------------

    const [selectedCategory, setSelectedCategory] =
        useState<MenuCategory | null>(null);

    // -----------------------------------------
    // Form fields
    // -----------------------------------------

    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [sortOrder, setSortOrder] = useState('');
    const [isActive, setIsActive] = useState(true);
    const [image, setImage] = useState<File | null>(null);

    // Add Category inline validation (Add modal only)
    const [addErrors, setAddErrors] = useState<
        Partial<Record<AddCategoryField, string>>
    >({});
    const [addTouched, setAddTouched] = useState<
        Partial<Record<AddCategoryField, boolean>>
    >({});
    const [addSubmitAttempted, setAddSubmitAttempted] = useState(false);

    const getAddFormValues = (
        sortOrderValue = sortOrder,
        imageValue = image,
    ): AddCategoryFormValues => ({
        name,
        sortOrder: sortOrderValue,
        image: imageValue,
    });

    const resetAddValidation = () => {
        setAddErrors({});
        setAddTouched({});
        setAddSubmitAttempted(false);
    };

    const revalidateAddField = (
        field: AddCategoryField,
        values: AddCategoryFormValues,
    ) => {
        const error = validateAddCategoryField(field, values);

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

    const shouldRevalidateAddField = (field: AddCategoryField) =>
        addTouched[field] ||
        Boolean(addErrors[field]) ||
        addSubmitAttempted;

    const handleAddFieldBlur = (field: AddCategoryField) => {
        setAddTouched((previous) => ({ ...previous, [field]: true }));
        revalidateAddField(field, getAddFormValues());
    };

    const handleAddNameChange = (value: string) => {
        setName(value);

        const values = getAddFormValues();
        values.name = value;

        if (shouldRevalidateAddField('name')) {
            revalidateAddField('name', values);
        }
    };

    const handleAddSortOrderChange = (value: string) => {
        setSortOrder(value);

        const values = getAddFormValues(value);

        if (shouldRevalidateAddField('sortOrder')) {
            revalidateAddField('sortOrder', values);
        }
    };

    const handleAddSortOrderBlur = () => {
        setAddTouched((previous) => ({ ...previous, sortOrder: true }));

        let currentSortOrder = sortOrder;

        if (!currentSortOrder.trim()) {
            currentSortOrder = getNextSortOrder(categories.data);
            setSortOrder(currentSortOrder);
        }

        revalidateAddField(
            'sortOrder',
            getAddFormValues(currentSortOrder),
        );
    };

    const handleAddImageChange = (
        event: React.ChangeEvent<HTMLInputElement>,
    ) => {
        const file = event.target.files?.[0] || null;

        setImage(file);
        setAddTouched((previous) => ({ ...previous, image: true }));

        const values = getAddFormValues(sortOrder, file);

        if (shouldRevalidateAddField('image') || file) {
            revalidateAddField('image', values);
        }
    };

    // -----------------------------------------
    // Search
    // -----------------------------------------

    const handleSearch = (value: string) => {
        setSearch(value);

        router.get(
            categoriesIndex.url(),
            {
                search: value,
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
        setName('');
        setDescription('');
        setSortOrder('');
        setIsActive(true);
        setImage(null);
        setSelectedCategory(null);
        resetAddValidation();

        setIsAddOpen(true);
    };

    // -----------------------------------------
    // Open View Modal
    // -----------------------------------------

    const openViewModal = (
        category: MenuCategory,
    ) => {
        setSelectedCategory(category);
        setIsViewOpen(true);
    };

    // -----------------------------------------
    // Open Edit Modal
    // -----------------------------------------

    const openEditModal = (
        category: MenuCategory,
    ) => {
        setSelectedCategory(category);

        setName(category.name);
        setDescription(category.description || '');
        setSortOrder(
            category.sort_order.toString(),
        );
        setIsActive(category.is_active);
        setImage(null);

        setIsEditOpen(true);
    };

    // -----------------------------------------
    // Open Delete Modal
    // -----------------------------------------

    const openDeleteModal = (
        category: MenuCategory,
    ) => {
        setSelectedCategory(category);
        setIsDeleteOpen(true);
    };

    // -----------------------------------------
    // Add Category
    // -----------------------------------------

    const handleAdd = () => {
        setAddSubmitAttempted(true);

        let currentSortOrder = sortOrder;

        if (!currentSortOrder.trim()) {
            currentSortOrder = getNextSortOrder(categories.data);
            setSortOrder(currentSortOrder);
        }

        const values = getAddFormValues(currentSortOrder);
        const errors = validateAllAddCategoryFields(values);

        setAddErrors(errors);

        if (Object.keys(errors).length > 0) {
            return;
        }

        const formData = new FormData();

        formData.append('name', name.trim());

        if (description) {
            formData.append(
                'description',
                description,
            );
        }

        formData.append(
            'sort_order',
            currentSortOrder,
        );

        formData.append(
            'is_active',
            isActive ? '1' : '0',
        );

        if (image) {
            formData.append('image', image);
        }

        router.post(
            categoriesStore.url(),
            formData,
            {
                forceFormData: true,

                onSuccess: () => {
                    setIsAddOpen(false);

                    setName('');
                    setDescription('');
                    setSortOrder('');
                    setIsActive(true);
                    setImage(null);
                    resetAddValidation();
                },
            },
        );
    };

    // -----------------------------------------
    // Update Category
    // -----------------------------------------

    const handleUpdate = () => {
        if (
            !selectedCategory ||
            !name.trim()
        ) {
            return;
        }

        const formData = new FormData();

        formData.append('name', name);

        if (description) {
            formData.append(
                'description',
                description,
            );
        }

        if (sortOrder) {
            formData.append(
                'sort_order',
                sortOrder,
            );
        }

        formData.append(
            'is_active',
            isActive ? '1' : '0',
        );

        if (image) {
            formData.append('image', image);
        }

        // Laravel PUT with FormData
        formData.append('_method', 'PUT');

        router.post(
            categoriesUpdate.url(
                selectedCategory.id,
            ),
            formData,
            {
                forceFormData: true,

                onSuccess: () => {
                    setIsEditOpen(false);
                    setSelectedCategory(null);
                    setImage(null);
                },
            },
        );
    };

    // -----------------------------------------
    // Toggle Category Status
    // -----------------------------------------

    const handleToggleStatus = (
        category: MenuCategory,
    ) => {
        router.patch(
            `/manager/categories/${category.id}/toggle-status`,
            {},
            {
                preserveScroll: true,
            },
        );
    };

    // -----------------------------------------
    // Delete Category
    // -----------------------------------------

    const handleDelete = () => {
        if (!selectedCategory) {
            return;
        }

        router.delete(
            categoriesDestroy.url(
                selectedCategory.id,
            ),
            {
                onSuccess: () => {
                    setIsDeleteOpen(false);
                    setSelectedCategory(null);
                },
            },
        );
    };

    return (
        <>
            <Head title="Menu Categories" />

            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl p-4">

                {/* =========================================
                    PAGE HEADER
                ========================================= */}

                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <Heading
                        title="Menu Categories"
                        description="Manage your menu categories."
                        icon={Tags}
                    />

                    {can('create menu categories') && (
                        <Button onClick={openAddModal}>
                            <Plus className="mr-2 h-4 w-4" />
                            Add Category
                        </Button>
                    )}
                </div>

                {/* =========================================
                    CATEGORIES CARD
                ========================================= */}

                <Card>
                    <CardHeader>
                        <CardTitle>
                            Menu Categories
                        </CardTitle>

                        {/* Search */}
                        <div className="pt-4">
                            <div className="relative max-w-sm">
                                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

                                <Input
                                    placeholder="Search categories..."
                                    value={search}
                                    onChange={(
                                        event: React.ChangeEvent<HTMLInputElement>,
                                    ) =>
                                        handleSearch(
                                            event.target.value,
                                        )
                                    }
                                    className="pl-9"
                                />
                            </div>
                        </div>
                    </CardHeader>

                    <CardContent>
                        {categories.data.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-center">
                                <p className="text-lg font-medium">
                                    No categories found
                                </p>

                                <p className="mt-1 text-sm text-muted-foreground">
                                    Try changing your search or add a new category.
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
                                                Items
                                            </th>

                                            <th className="p-3">
                                                Order
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
                                        {categories.data.map(
                                            (category) => (
                                                <tr
                                                    key={category.id}
                                                    className="border-b last:border-0 hover:bg-muted/50"
                                                >
                                                    <td className="p-3 font-medium">
                                                        {category.name}
                                                    </td>

                                                    <td className="p-3 text-muted-foreground">
                                                        {category.menu_items_count}
                                                    </td>

                                                    <td className="p-3 text-muted-foreground">
                                                        {category.sort_order}
                                                    </td>

                                                    {/* Status */}
                                                    <td className="p-3">
                                                        <Badge
                                                            variant="outline"
                                                            className={
                                                                category.is_active
                                                                    ? 'border-green-600 bg-white text-green-600'
                                                                    : 'border-red-600 bg-white text-red-600'
                                                            }
                                                        >
                                                            {category.is_active
                                                                ? 'Active'
                                                                : 'Inactive'}
                                                        </Badge>
                                                    </td>

                                                    {/* Actions */}
                                                    <td className="p-3">
                                                        <div className="flex items-center justify-end gap-2">

                                                            {/* Reusable Status Toggle */}
                                                            {can('status menu categories') && (
                                                                <StatusToggle
                                                                    checked={
                                                                        category.is_active
                                                                    }
                                                                    onCheckedChange={() =>
                                                                        handleToggleStatus(
                                                                            category,
                                                                        )
                                                                    }
                                                                    onLabel="Active"
                                                                    offLabel="Inactive"
                                                                    ariaLabel={
                                                                        category.is_active
                                                                            ? 'Deactivate category'
                                                                            : 'Activate category'
                                                                    }
                                                                />
                                                            )}

                                                            {/* Show */}
                                                            {can('view menu categories') && (
                                                                <Button
                                                                    variant="outline"
                                                                    size="icon"
                                                                    onClick={() =>
                                                                        openViewModal(
                                                                            category,
                                                                        )
                                                                    }
                                                                    title="View category"
                                                                >
                                                                    <Eye className="h-4 w-4" />
                                                                </Button>
                                                            )}

                                                            {/* Edit */}
                                                            {can('update menu categories') && (
                                                                <Button
                                                                    variant="outline"
                                                                    size="icon"
                                                                    onClick={() =>
                                                                        openEditModal(
                                                                            category,
                                                                        )
                                                                    }
                                                                    title="Edit category"
                                                                >
                                                                    <Pencil className="h-4 w-4" />
                                                                </Button>
                                                            )}

                                                            {/* Delete */}
                                                            {can('delete menu categories') && (
                                                                <Button
                                                                    variant="destructive"
                                                                    size="icon"
                                                                    onClick={() =>
                                                                        openDeleteModal(
                                                                            category,
                                                                        )
                                                                    }
                                                                    title="Delete category"
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

                        {/* =========================================
                            PAGINATION
                        ========================================= */}

                        {categories.last_page > 1 && (
                            <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
                                {categories.links.map(
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
                ADD CATEGORY MODAL
            ========================================= */}

            <Dialog
                open={isAddOpen}
                onOpenChange={setIsAddOpen}
            >
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>
                            Add Menu Category
                        </DialogTitle>

                        <DialogDescription>
                            Create a new menu category.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">

                        {/* Category Name */}
                        <div>
                            <label className="mb-2 block text-sm font-medium">
                                Category Name
                            </label>

                            <Input
                                value={name}
                                onChange={(
                                    event: React.ChangeEvent<HTMLInputElement>,
                                ) =>
                                    handleAddNameChange(
                                        event.target.value,
                                    )
                                }
                                onBlur={() =>
                                    handleAddFieldBlur('name')
                                }
                                placeholder="Example: Breakfast"
                                aria-invalid={Boolean(addErrors.name)}
                                className={cn(
                                    getAddCategoryFieldInputClassName(
                                        'name',
                                        addErrors,
                                        addTouched,
                                        addSubmitAttempted,
                                    ),
                                )}
                            />

                            <InputError
                                message={addErrors.name}
                                className="mt-1"
                            />
                        </div>

                        {/* Sort Order */}
                        <div>
                            <label className="mb-2 block text-sm font-medium">
                                Sort Order
                            </label>

                            <Input
                                type="number"
                                min="0"
                                value={sortOrder}
                                onChange={(
                                    event: React.ChangeEvent<HTMLInputElement>,
                                ) =>
                                    handleAddSortOrderChange(
                                        event.target.value,
                                    )
                                }
                                onBlur={handleAddSortOrderBlur}
                                placeholder="Example: 1"
                                aria-invalid={Boolean(
                                    addErrors.sortOrder,
                                )}
                                className={cn(
                                    getAddCategoryFieldInputClassName(
                                        'sortOrder',
                                        addErrors,
                                        addTouched,
                                        addSubmitAttempted,
                                    ),
                                )}
                            />

                            <InputError
                                message={addErrors.sortOrder}
                                className="mt-1"
                            />
                        </div>

                        {/* Category Image */}
                        <div>
                            <label className="mb-2 block text-sm font-medium">
                                Category Image
                            </label>

                            <Input
                                type="file"
                                accept="image/jpeg,image/png,image/webp"
                                onChange={handleAddImageChange}
                                aria-invalid={Boolean(addErrors.image)}
                                className={cn(
                                    getAddCategoryImageInputClassName(
                                        addErrors.image,
                                    ),
                                )}
                            />

                            <InputError
                                message={addErrors.image}
                                className="mt-1"
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
                                ) =>
                                    setDescription(
                                        event.target.value,
                                    )
                                }
                                placeholder="Describe this category..."
                                rows={4}
                                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                            />
                        </div>

                        {/* Active Category */}
                        <div className="flex items-center gap-2">
                            <StatusToggle
                                checked={isActive}
                                onCheckedChange={() =>
                                    setIsActive(!isActive)
                                }
                                onLabel="Active"
                                offLabel="Inactive"
                                ariaLabel={
                                    isActive
                                        ? 'Deactivate category'
                                        : 'Activate category'
                                }
                            />
                            <label className="text-sm font-medium">
                                Active Category
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
                            Add Category
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* =========================================
                VIEW CATEGORY MODAL
            ========================================= */}

            <Dialog
                open={isViewOpen}
                onOpenChange={setIsViewOpen}
            >
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>
                            Category Details
                        </DialogTitle>

                        <DialogDescription>
                            View menu category information.
                        </DialogDescription>
                    </DialogHeader>

                    {selectedCategory && (
                        <div className="space-y-4 py-4">

                            {/* Image */}
                            {selectedCategory.image && (
                                <div className="flex justify-center">
                                    <img
                                        src={`/storage/${selectedCategory.image}`}
                                        alt={
                                            selectedCategory.name
                                        }
                                        className="h-40 w-full rounded-lg object-cover"
                                    />
                                </div>
                            )}

                            <div className="grid gap-4 sm:grid-cols-2">

                                <div>
                                    <p className="text-sm text-muted-foreground">
                                        Name
                                    </p>

                                    <p className="font-medium">
                                        {selectedCategory.name}
                                    </p>
                                </div>



                                <div>
                                    <p className="text-sm text-muted-foreground">
                                        Menu Items
                                    </p>

                                    <p className="font-medium">
                                        {selectedCategory.menu_items_count}
                                    </p>
                                </div>

                                <div>
                                    <p className="text-sm text-muted-foreground">
                                        Sort Order
                                    </p>

                                    <p className="font-medium">
                                        {selectedCategory.sort_order}
                                    </p>
                                </div>

                                <div>
                                    <p className="text-sm text-muted-foreground">
                                        Status
                                    </p>

                                    <Badge
                                                        variant="outline"
                                                        className={
                                                            selectedCategory.is_active
                                                                ? 'border-green-600 bg-white text-green-600'
                                                                : 'border-red-600 bg-white text-red-600'
                                                        }
                                                    >
                                                        {selectedCategory.is_active
                                                            ? 'Active'
                                                            : 'Inactive'}
                                                    </Badge>
                                </div>
                            </div>

                            {/* Description */}
                            <div>
                                <p className="text-sm text-muted-foreground">
                                    Description
                                </p>

                                <p className="mt-1 text-sm">
                                    {selectedCategory.description ||
                                        'No description provided.'}
                                </p>
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

            {/* =========================================
                EDIT CATEGORY MODAL
            ========================================= */}

            <Dialog
                open={isEditOpen}
                onOpenChange={setIsEditOpen}
            >
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>
                            Edit Menu Category
                        </DialogTitle>

                        <DialogDescription>
                            Update the category information.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">

                        {/* Name */}
                        <div>
                            <label className="mb-2 block text-sm font-medium">
                                Category Name
                            </label>

                            <Input
                                value={name}
                                onChange={(
                                    event: React.ChangeEvent<HTMLInputElement>,
                                ) =>
                                    setName(
                                        event.target.value,
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
                                value={description}
                                onChange={(
                                    event: React.ChangeEvent<HTMLTextAreaElement>,
                                ) =>
                                    setDescription(
                                        event.target.value,
                                    )
                                }
                                rows={4}
                                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                            />
                        </div>

                        {/* Sort Order */}
                        <div>
                            <label className="mb-2 block text-sm font-medium">
                                Sort Order
                            </label>

                            <Input
                                type="number"
                                min="0"
                                value={sortOrder}
                                onChange={(
                                    event: React.ChangeEvent<HTMLInputElement>,
                                ) =>
                                    setSortOrder(
                                        event.target.value,
                                    )
                                }
                            />
                        </div>

                        {/* Image */}
                        <div>
                            <label className="mb-2 block text-sm font-medium">
                                Replace Image
                            </label>

                            <Input
                                type="file"
                                accept="image/*"
                                onChange={(
                                    event: React.ChangeEvent<HTMLInputElement>,
                                ) =>
                                    setImage(
                                        event.target.files?.[0] ||
                                            null,
                                    )
                                }
                            />
                        </div>

                        {/* Active */}
                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                checked={isActive}
                                onChange={(
                                    event: React.ChangeEvent<HTMLInputElement>,
                                ) =>
                                    setIsActive(
                                        event.target.checked,
                                    )
                                }
                                className="h-4 w-4"
                            />

                            <label className="text-sm font-medium">
                                Active Category
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
                            Update Category
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* =========================================
                DELETE CATEGORY MODAL
            ========================================= */}

            <Dialog
                open={isDeleteOpen}
                onOpenChange={setIsDeleteOpen}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            Delete Category?
                        </DialogTitle>

                        <DialogDescription>
                            Are you sure you want to delete{' '}
                            <strong>
                                {selectedCategory?.name}
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
                            Delete Category
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

CategoriesIndex.layout = {
    breadcrumbs: [
        {
            title: 'Menu Categories',
            href: categoriesIndex.url(),
        },
    ],
};

