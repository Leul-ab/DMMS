import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import {
    Eye,
    Pencil,
    Plus,
    Search,
    Trash2,
} from 'lucide-react';

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
    index as categoriesIndex,
    store as categoriesStore,
    update as categoriesUpdate,
    destroy as categoriesDestroy,
} from '@/routes/manager/categories';

import type { PaginatedData } from '@/types';

type MenuCategory = {
    id: number;
    name: string;
    slug: string;
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

export default function CategoriesIndex({
    categories,
    filters,
}: Props) {
    const [search, setSearch] = useState(
        filters.search || '',
    );

    // Modal states
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [isViewOpen, setIsViewOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);

    // Selected category
    const [selectedCategory, setSelectedCategory] =
        useState<MenuCategory | null>(null);

    // Form fields
    const [name, setName] = useState('');
    const [slug, setSlug] = useState('');
    const [description, setDescription] = useState('');
    const [sortOrder, setSortOrder] = useState('');
    const [isActive, setIsActive] = useState(true);
    const [image, setImage] = useState<File | null>(null);

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
        setSlug('');
        setDescription('');
        setSortOrder('');
        setIsActive(true);
        setImage(null);
        setSelectedCategory(null);

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
        setSlug(category.slug || '');
        setDescription(
            category.description || '',
        );
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
        if (!name.trim()) {
            return;
        }

        const formData = new FormData();

        formData.append('name', name);

        if (slug) {
            formData.append('slug', slug);
        }

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

        router.post(
            categoriesStore.url(),
            formData,
            {
                forceFormData: true,

                onSuccess: () => {
                    setIsAddOpen(false);

                    setName('');
                    setSlug('');
                    setDescription('');
                    setSortOrder('');
                    setIsActive(true);
                    setImage(null);
                },
            },
        );
    };

    // -----------------------------------------
    // Update Category
    // -----------------------------------------

    const handleUpdate = () => {
        if (!selectedCategory || !name.trim()) {
            return;
        }

        const formData = new FormData();

        formData.append('name', name);

        if (slug) {
            formData.append('slug', slug);
        }

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
        formData.append(
            '_method',
            'PUT',
        );

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

                {/* Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <Heading
                        title="Menu Categories"
                        description="Manage your menu categories."
                    />

                    <Button onClick={openAddModal}>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Category
                    </Button>
                </div>

                {/* Categories Card */}
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
                                                Slug
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
                                                    key={
                                                        category.id
                                                    }
                                                    className="border-b last:border-0"
                                                >
                                                    <td className="p-3 font-medium">
                                                        {
                                                            category.name
                                                        }
                                                    </td>

                                                    <td className="p-3 text-muted-foreground">
                                                        {
                                                            category.slug
                                                        }
                                                    </td>

                                                    <td className="p-3 text-muted-foreground">
                                                        {
                                                            category.menu_items_count
                                                        }
                                                    </td>

                                                    <td className="p-3 text-muted-foreground">
                                                        {
                                                            category.sort_order
                                                        }
                                                    </td>

                                                    <td className="p-3">
                                                        <Badge
                                                            variant={
                                                                category.is_active
                                                                    ? 'default'
                                                                    : 'destructive'
                                                            }
                                                        >
                                                            {category.is_active
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
                                                                        category,
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
                                                                        category,
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
                                                                        category,
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

                        {/* Pagination */}
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
                                placeholder="Example: Breakfast"
                            />
                        </div>

                        {/* Slug */}
                        <div>
                            <label className="mb-2 block text-sm font-medium">
                                Slug
                            </label>

                            <Input
                                value={slug}
                                onChange={(
                                    event: React.ChangeEvent<HTMLInputElement>,
                                ) =>
                                    setSlug(
                                        event.target.value,
                                    )
                                }
                                placeholder="Example: breakfast"
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
                                placeholder="Example: 1"
                            />
                        </div>

                        {/* Image */}
                        <div>
                            <label className="mb-2 block text-sm font-medium">
                                Category Image
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
                                        {
                                            selectedCategory.name
                                        }
                                    </p>
                                </div>

                                <div>
                                    <p className="text-sm text-muted-foreground">
                                        Slug
                                    </p>

                                    <p className="font-medium">
                                        {
                                            selectedCategory.slug
                                        }
                                    </p>
                                </div>

                                <div>
                                    <p className="text-sm text-muted-foreground">
                                        Menu Items
                                    </p>

                                    <p className="font-medium">
                                        {
                                            selectedCategory.menu_items_count
                                        }
                                    </p>
                                </div>

                                <div>
                                    <p className="text-sm text-muted-foreground">
                                        Sort Order
                                    </p>

                                    <p className="font-medium">
                                        {
                                            selectedCategory.sort_order
                                        }
                                    </p>
                                </div>

                                <div>
                                    <p className="text-sm text-muted-foreground">
                                        Status
                                    </p>

                                    <Badge
                                        variant={
                                            selectedCategory.is_active
                                                ? 'default'
                                                : 'destructive'
                                        }
                                    >
                                        {selectedCategory.is_active
                                            ? 'Active'
                                            : 'Inactive'}
                                    </Badge>
                                </div>
                            </div>

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

                        {/* Slug */}
                        <div>
                            <label className="mb-2 block text-sm font-medium">
                                Slug
                            </label>

                            <Input
                                value={slug}
                                onChange={(
                                    event: React.ChangeEvent<HTMLInputElement>,
                                ) =>
                                    setSlug(
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