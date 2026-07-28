import { Head, Link, router } from '@inertiajs/react';
import { Plus, Pencil, Trash2, Search, EyeOff, Eye, DollarSign } from 'lucide-react';
import { useState } from 'react';
import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { index as itemsIndex, create as itemsCreate, edit as itemsEdit, destroy as itemsDestroy, toggleAvailability } from '@/routes/manager/items';
import type { PaginatedData } from '@/types';

type MenuCategory = {
    id: number;
    name: string;
};

type MenuItem = {
    id: number;
    category_id: number;
    name: string;
    slug: string;
    description: string | null;
    price: string;
    image: string | null;
    preparation_time: number | null;
    is_available: boolean;
    featured: boolean;
    category: MenuCategory | null;
};

type Props = {
    items: PaginatedData<MenuItem>;
    categories: MenuCategory[];
    filters: { search?: string; category_id?: string; availability?: string; featured?: string };
};

export default function ItemsIndex({ items, categories, filters }: Props) {
    const [search, setSearch] = useState(filters.search || '');

    const handleSearch = (value: string) => {
        setSearch(value);
        router.get(itemsIndex.url(), { search: value, category_id: filters.category_id, availability: filters.availability, featured: filters.featured }, { preserveState: true, replace: true });
    };

    const handleCategoryFilter = (value: string) => {
        router.get(itemsIndex.url(), { search, category_id: value === 'all' ? undefined : value, availability: filters.availability, featured: filters.featured }, { preserveState: true, replace: true });
    };

    const handleAvailabilityFilter = (value: string) => {
        router.get(itemsIndex.url(), { search, category_id: filters.category_id, availability: value === 'all' ? undefined : value, featured: filters.featured }, { preserveState: true, replace: true });
    };

    const handleDelete = (item: MenuItem) => {
        if (confirm(`Are you sure you want to delete "${item.name}"?`)) {
            router.delete(itemsDestroy.url(item.id));
        }
    };

    const handleToggleAvailability = (item: MenuItem) => {
        router.patch(toggleAvailability.url(item.id));
    };

    const formatPrice = (price: string) => {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(price));
    };

    return (
        <>
            <Head title="Menu Items" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <div className="flex items-center justify-between">
                    <Heading title="Menu Items" description="Manage all menu items" />
                    <Button asChild>
                        <Link href={itemsCreate.url()}>
                            <Plus className="mr-2 h-4 w-4" /> Add Menu Item
                        </Link>
                    </Button>
                </div>

                <div className="flex items-center gap-3 flex-wrap">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            placeholder="Search items..."
                            value={search}
                            onChange={(e) => handleSearch(e.target.value)}
                            className="pl-9"
                        />
                    </div>
                    <Select value={filters.category_id || 'all'} onValueChange={handleCategoryFilter}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="All Categories" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Categories</SelectItem>
                            {categories.map((category) => (
                                <SelectItem key={category.id} value={String(category.id)}>
                                    {category.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Select value={filters.availability || 'all'} onValueChange={handleAvailabilityFilter}>
                        <SelectTrigger className="w-[160px]">
                            <SelectValue placeholder="Availability" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All</SelectItem>
                            <SelectItem value="1">Available</SelectItem>
                            <SelectItem value="0">Unavailable</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <Card>
                    <CardContent className="p-0">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b text-left text-sm text-muted-foreground">
                                    <th className="px-4 py-3 font-medium">Image</th>
                                    <th className="px-4 py-3 font-medium">Name</th>
                                    <th className="px-4 py-3 font-medium">Category</th>
                                    <th className="px-4 py-3 font-medium">Price</th>
                                    <th className="px-4 py-3 font-medium">Prep Time</th>
                                    <th className="px-4 py-3 font-medium">Featured</th>
                                    <th className="px-4 py-3 font-medium">Status</th>
                                    <th className="px-4 py-3 font-medium text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="px-4 py-8 text-center text-sm text-muted-foreground">
                                            No menu items found.
                                        </td>
                                    </tr>
                                ) : (
                                    items.data.map((item) => (
                                        <tr key={item.id} className="border-b last:border-0">
                                            <td className="px-4 py-3">
                                                {item.image ? (
                                                    <img
                                                        src={`/storage/${item.image}`}
                                                        alt={item.name}
                                                        className="h-12 w-12 rounded-md object-cover"
                                                        onError={(e) => {
                                                            const target = e.currentTarget;
                                                            target.style.display = 'none';
                                                            if (target.parentElement) {
                                                                const placeholder = document.createElement('div');
                                                                placeholder.className = 'h-12 w-12 rounded-md bg-muted flex items-center justify-center text-lg';
                                                                placeholder.textContent = '🍽️';
                                                                target.parentElement.appendChild(placeholder);
                                                            }
                                                        }}
                                                    />
                                                ) : (
                                                    <div className="flex h-12 w-12 items-center justify-center rounded-md bg-muted text-lg">
                                                        🍽️
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-sm font-medium">{item.name}</td>
                                            <td className="px-4 py-3">
                                                <Badge variant="secondary">{item.category?.name || 'Uncategorized'}</Badge>
                                            </td>
                                            <td className="px-4 py-3 text-sm font-medium">{formatPrice(item.price)}</td>
                                            <td className="px-4 py-3 text-sm text-muted-foreground">
                                                {item.preparation_time ? `${item.preparation_time} min` : '—'}
                                            </td>
                                            <td className="px-4 py-3">
                                                {item.featured ? (
                                                    <Badge variant="default">Featured</Badge>
                                                ) : (
                                                    <span className="text-sm text-muted-foreground">—</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3">
                                                <Badge variant={item.is_available ? 'default' : 'destructive'}>
                                                    {item.is_available ? 'Available' : 'Unavailable'}
                                                </Badge>
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleToggleAvailability(item)}
                                                        title={item.is_available ? 'Mark as unavailable' : 'Mark as available'}
                                                    >
                                                        {item.is_available ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                                    </Button>
                                                    <Button variant="ghost" size="icon" asChild>
                                                        <Link href={itemsEdit.url(item.id)}>
                                                            <Pencil className="h-4 w-4" />
                                                        </Link>
                                                    </Button>
                                                    <Button variant="ghost" size="icon" onClick={() => handleDelete(item)}>
                                                        <Trash2 className="h-4 w-4 text-destructive" />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </CardContent>
                </Card>

                {items.last_page > 1 && (
                    <div className="flex items-center justify-center gap-2">
                        {items.links.map((link, i) => (
                            <Button key={i} variant={link.active ? 'default' : 'outline'} size="sm" disabled={!link.url} asChild={!!link.url}>
                                {link.url ? <Link href={link.url} dangerouslySetInnerHTML={{ __html: link.label }} /> : <span dangerouslySetInnerHTML={{ __html: link.label }} />}
                            </Button>
                        ))}
                    </div>
                )}
            </div>
        </>
    );
}

ItemsIndex.layout = {
    breadcrumbs: [{ title: 'Menu Items', href: itemsIndex.url() }],
};
