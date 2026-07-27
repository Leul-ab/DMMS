import { Head, Link, useForm } from '@inertiajs/react';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { index as itemsIndex, edit as itemsEdit, update as itemsUpdate } from '@/routes/manager/items';
import { useState, useRef } from 'react';

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
    item: MenuItem;
    categories: MenuCategory[];
};

export default function ItemEdit({ item, categories }: Props) {
    const { data, setData, put, processing, errors } = useForm({
        category_id: String(item.category_id),
        name: item.name,
        description: item.description || '',
        price: item.price,
        image: '' as string | File,
        preparation_time: item.preparation_time ? String(item.preparation_time) : '',
        is_available: item.is_available,
        featured: item.featured,
        remove_image: false,
    });

    const [preview, setPreview] = useState<string | null>(null);
    const [removeExistingImage, setRemoveExistingImage] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setData('image', file);
            setRemoveExistingImage(false);
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleRemoveImage = () => {
        setData('image', '');
        setData('remove_image', true);
        setPreview(null);
        setRemoveExistingImage(true);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put(itemsUpdate.url(item.id));
    };

    const existingImageUrl = item.image && !removeExistingImage ? `/storage/${item.image}` : null;

    return (
        <>
            <Head title={`Edit ${item.name}`} />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <Heading title={`Edit: ${item.name}`} description="Update menu item details" />

                <Card className="max-w-2xl">
                    <CardContent className="pt-6">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid gap-2">
                                <Label htmlFor="category_id">Category</Label>
                                <Select value={data.category_id} onValueChange={(value) => setData('category_id', value)}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a category" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {categories.map((category) => (
                                            <SelectItem key={category.id} value={String(category.id)}>
                                                {category.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <InputError message={errors.category_id} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="name">Name</Label>
                                <Input id="name" value={data.name} onChange={(e) => setData('name', e.target.value)} placeholder="e.g. Pancakes, Chocolate Cake" required />
                                <InputError message={errors.name} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="description">Description (optional)</Label>
                                <textarea
                                    id="description"
                                    value={data.description}
                                    onChange={(e) => setData('description', e.target.value)}
                                    placeholder="Brief description of this item"
                                    rows={3}
                                    className="flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                />
                                <InputError message={errors.description} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="price">Price</Label>
                                <Input id="price" type="number" step="0.01" min="0" value={data.price} onChange={(e) => setData('price', e.target.value)} placeholder="9.99" required />
                                <InputError message={errors.price} />
                            </div>

                            {/* Menu Item Image */}
                            <div className="grid gap-2">
                                <Label htmlFor="image">Menu Item Image (optional)</Label>
                                <div className="flex items-center gap-4">
                                    <Input
                                        ref={fileInputRef}
                                        id="image"
                                        type="file"
                                        accept="image/jpeg,image/jpg,image/png,image/webp"
                                        onChange={handleImageChange}
                                        className="cursor-pointer"
                                    />
                                    {(preview || existingImageUrl) && (
                                        <Button type="button" variant="destructive" size="sm" onClick={handleRemoveImage}>
                                            Remove Image
                                        </Button>
                                    )}
                                </div>
                                <p className="text-xs text-muted-foreground">Accepted formats: JPG, JPEG, PNG, WebP. Max size: 2MB.</p>
                                <InputError message={errors.image} />

                                {/* Image Preview - show new preview or existing image */}
                                {(preview || existingImageUrl) && (
                                    <div className="relative mt-2 overflow-hidden rounded-lg border">
                                        <img
                                            src={preview || existingImageUrl || ''}
                                            alt="Preview"
                                            className="h-48 w-full object-cover"
                                        />
                                    </div>
                                )}
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="preparation_time">Preparation Time (minutes, optional)</Label>
                                <Input id="preparation_time" type="number" min="0" value={data.preparation_time} onChange={(e) => setData('preparation_time', e.target.value)} placeholder="15" />
                                <InputError message={errors.preparation_time} />
                            </div>

                            <div className="flex items-center space-x-2">
                                <Checkbox id="is_available" checked={data.is_available} onCheckedChange={(checked) => setData('is_available', checked === true)} />
                                <Label htmlFor="is_available">Available</Label>
                            </div>

                            <div className="flex items-center space-x-2">
                                <Checkbox id="featured" checked={data.featured} onCheckedChange={(checked) => setData('featured', checked === true)} />
                                <Label htmlFor="featured">Featured</Label>
                            </div>

                            <div className="flex items-center gap-4">
                                <Button disabled={processing}>Update Menu Item</Button>
                                <Link href={itemsIndex.url()} className="text-sm text-muted-foreground hover:text-foreground">
                                    Cancel
                                </Link>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

ItemEdit.layout = {
    breadcrumbs: [
        { title: 'Menu Items', href: itemsIndex.url() },
        { title: `Edit Item`, href: '#' },
    ],
};
