import { Head, Link, useForm } from '@inertiajs/react';
import { Utensils } from 'lucide-react';
import { useRef, useState } from 'react';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { create as itemsCreate, index as itemsIndex, store as itemsStore } from '@/routes/manager/items';

type MenuCategory = {
    id: number;
    name: string;
};

type Props = {
    categories: MenuCategory[];
};

export default function ItemCreate({ categories }: Props) {
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const { data, setData, post, processing, errors, setError, clearErrors } = useForm({
        category_id: '',
        name: '',
        description: '',
        price: '',
        image: null as File | null,
        preparation_time: '',
        is_available: true,
    });

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];

        if (file) {
            // Validate file type
            const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

            if (!allowedTypes.includes(file.type)) {
                setError('image', 'Please choose a JPG, JPEG, PNG, or WebP image.');

                return;
            }

            // Validate file size (2MB)
            if (file.size > 2 * 1024 * 1024) {
                setError('image', 'Image size must not exceed 2 MB.');

                return;
            }

            clearErrors('image');
            setData('image', file);
            const reader = new FileReader();
            reader.onload = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleRemoveImage = () => {
        setData('image', null);
        setImagePreview(null);

        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!data.category_id) {
            setError('category_id', 'Please select a category.');
        }
        if (!data.name.trim()) {
            setError('name', 'Menu item name is required.');
        }
        if (data.price === '' || Number(data.price) < 0) {
            setError('price', 'Price must be zero or greater.');
        }
        if (!data.category_id || !data.name.trim() || data.price === '' || Number(data.price) < 0) {
            return;
        }

        post(itemsStore.url(), {
            forceFormData: true,
        });
    };

    return (
        <>
            <Head title="Create Menu Item" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <Heading title="Create Menu Item" description="Add a new item to the menu" icon={Utensils} />

                <Card className="max-w-2xl">
                    <CardContent className="pt-6">
                        <form onSubmit={handleSubmit} className="space-y-6" encType="multipart/form-data">
                            <div className="grid gap-2">
                                <Label htmlFor="category_id">Category</Label>
                                <Select value={data.category_id} onValueChange={(value) => { setData('category_id', value); clearErrors('category_id'); }}>
                                    <SelectTrigger aria-invalid={!!errors.category_id} aria-describedby={errors.category_id ? 'category-error' : undefined}>
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
                                <InputError id="category-error" message={errors.category_id} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="name">Menu Item Name</Label>
                                <Input id="name" value={data.name} onChange={(e) => { setData('name', e.target.value); clearErrors('name'); }} placeholder="e.g. Pancakes, Chocolate Cake" aria-invalid={!!errors.name} aria-describedby={errors.name ? 'name-error' : undefined} />
                                <InputError id="name-error" message={errors.name} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="description">Description (optional)</Label>
                                <textarea
                                    id="description"
                                    value={data.description}
                                    onChange={(e) => { setData('description', e.target.value); clearErrors('description'); }}
                                    placeholder="Brief description of this item"
                                    rows={3}
                                    aria-invalid={!!errors.description}
                                    aria-describedby={errors.description ? 'description-error' : undefined}
                                    className={`flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 ${errors.description ? 'border-destructive' : ''}`}
                                />
                                <InputError id="description-error" message={errors.description} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="price">Price (ETB)</Label>
                                <Input id="price" type="number" step="0.01" min="0" value={data.price} onChange={(e) => { setData('price', e.target.value); clearErrors('price'); }} placeholder="9.99" aria-invalid={!!errors.price} aria-describedby={errors.price ? 'price-error' : undefined} />
                                <InputError id="price-error" message={errors.price} />
                            </div>

                            {/* Image Upload */}
                            <div className="grid gap-2">
                                <Label htmlFor="image">Menu Item Image</Label>
                                <div className="flex items-start gap-4">
                                    <div className="flex-1">
                                        <Input
                                            ref={fileInputRef}
                                            id="image"
                                            type="file"
                                            accept=".jpg,.jpeg,.png,.webp"
                                            onChange={handleImageChange}
                                            className="cursor-pointer"
                                            aria-invalid={!!errors.image}
                                            aria-describedby={errors.image ? 'image-error' : undefined}
                                        />
                                        <p className="mt-1 text-xs text-muted-foreground">
                                            Accepted formats: JPG, JPEG, PNG, WebP. Max size: 2 MB.
                                        </p>
                                    </div>
                                    {imagePreview && (
                                        <Button
                                            type="button"
                                            variant="destructive"
                                            size="sm"
                                            onClick={handleRemoveImage}
                                        >
                                            Remove
                                        </Button>
                                    )}
                                </div>
                                <InputError id="image-error" message={errors.image} />

                                {/* Image Preview */}
                                {imagePreview && (
                                    <div className="mt-2 overflow-hidden rounded-lg border border-border">
                                        <img
                                            src={imagePreview}
                                            alt="Preview"
                                            className="h-48 w-full object-cover"
                                        />
                                    </div>
                                )}

                                {!imagePreview && (
                                    <div className="mt-2 flex h-36 items-center justify-center rounded-lg border border-dashed border-border bg-muted/30">
                                        <div className="text-center">
                                            <svg className="mx-auto h-10 w-10 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                            <p className="mt-2 text-xs text-muted-foreground">No image selected</p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="preparation_time">Preparation Time (minutes, optional)</Label>
                                <Input id="preparation_time" type="number" min="0" value={data.preparation_time} onChange={(e) => { setData('preparation_time', e.target.value); clearErrors('preparation_time'); }} placeholder="15" aria-invalid={!!errors.preparation_time} aria-describedby={errors.preparation_time ? 'preparation-time-error' : undefined} />
                                <InputError id="preparation-time-error" message={errors.preparation_time} />
                            </div>

                            <div className="flex items-center space-x-2">
                                <Checkbox id="is_available" checked={data.is_available} onCheckedChange={(checked) => setData('is_available', checked === true)} />
                                <Label htmlFor="is_available">Available</Label>
                            </div>

                            <div className="flex items-center gap-4">
                                <Button disabled={processing}>Create Menu Item</Button>
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

ItemCreate.layout = {
    breadcrumbs: [
        { title: 'Menu Items', href: itemsIndex.url() },
        { title: 'Create Menu Item', href: itemsCreate.url() },
    ],
};
