import { Head, Link, router } from '@inertiajs/react';
import { Plus, Pencil, Trash2, Search } from 'lucide-react';
import { useState } from 'react';
import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { index as categoriesIndex, create as categoriesCreate, edit as categoriesEdit, destroy as categoriesDestroy } from '@/routes/manager/categories';
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
    filters: { search?: string };
};

export default function CategoriesIndex({ categories, filters }: Props) {
    const [search, setSearch] = useState(filters.search || '');

    const handleSearch = (value: string) => {
        setSearch(value);
        router.get(categoriesIndex.url(), { search: value }, { preserveState: true, replace: true });
    };

    const handleDelete = (category: MenuCategory) => {
        if (confirm(`Are you sure you want to delete "${category.name}"?`)) {
            router.delete(categoriesDestroy.url(category.id));
        }
    };

    return (
        <>
            <Head title="Menu Categories" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <div className="flex items-center justify-between">
                    <Heading title="Menu Categories" description="Manage your menu categories" />
                    <Button asChild>
                        <Link href={categoriesCreate.url()}>
                            <Plus className="mr-2 h-4 w-4" /> Add Category
                        </Link>
                    </Button>
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            placeholder="Search categories..."
                            value={search}
                            onChange={(e) => handleSearch(e.target.value)}
                            className="pl-9"
                        />
                    </div>
                </div>

                <Card>
                    <CardContent className="p-0">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b text-left text-sm text-muted-foreground">
                                    <th className="px-4 py-3 font-medium">Name</th>
                                    <th className="px-4 py-3 font-medium">Slug</th>
                                    <th className="px-4 py-3 font-medium">Items</th>
                                    <th className="px-4 py-3 font-medium">Order</th>
                                    <th className="px-4 py-3 font-medium">Status</th>
                                    <th className="px-4 py-3 font-medium text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {categories.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-4 py-8 text-center text-sm text-muted-foreground">
                                            No categories found.
                                        </td>
                                    </tr>
                                ) : (
                                    categories.data.map((category) => (
                                        <tr key={category.id} className="border-b last:border-0">
                                            <td className="px-4 py-3 text-sm font-medium">{category.name}</td>
                                            <td className="px-4 py-3 text-sm text-muted-foreground">{category.slug}</td>
                                            <td className="px-4 py-3 text-sm text-muted-foreground">{category.menu_items_count}</td>
                                            <td className="px-4 py-3 text-sm text-muted-foreground">{category.sort_order}</td>
                                            <td className="px-4 py-3">
                                                <Badge variant={category.is_active ? 'default' : 'destructive'}>
                                                    {category.is_active ? 'Active' : 'Inactive'}
                                                </Badge>
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    <Button variant="ghost" size="icon" asChild>
                                                        <Link href={categoriesEdit.url(category.id)}>
                                                            <Pencil className="h-4 w-4" />
                                                        </Link>
                                                    </Button>
                                                    <Button variant="ghost" size="icon" onClick={() => handleDelete(category)}>
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

                {categories.last_page > 1 && (
                    <div className="flex items-center justify-center gap-2">
                        {categories.links.map((link, i) => (
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

CategoriesIndex.layout = {
    breadcrumbs: [{ title: 'Menu Categories', href: categoriesIndex.url() }],
};
