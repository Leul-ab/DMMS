import { Head, Link, useForm } from '@inertiajs/react';
import { useRef, useState } from 'react';
import { Utensils } from 'lucide-react';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { create as itemsCreate, index as itemsIndex, store as itemsStore } from '@/routes/manager/items';
import { positiveNumberRule, requiredRule, validateFields } from '@/lib/form-validation';

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

    const { data, setData, post, processing, errors } = useForm({
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
                return;
            }
            // Validate file size (2MB)
            if (file.size > 2 * 1024 * 1024) {
                return;
            }
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

    const [clientErrors, setClientErrors] = useState<Record<string, string>>({});

    const validateForm = () => {
        const nextErrors = validateFields(data, {
            category_id: [requiredRule('Please select a category.')],
            name: [requiredRule('Menu item name is required.')],
            price: [requiredRule('Price is required.'), positiveNumberRule()],
            preparation_time: [positiveNumberRule()],
        });

        setClientErrors(nextErrors);
        return Object.keys(nextErrors).length === 0;
    };

    const handleFieldChange = (field: string, value: string | number | File | null) => {
        setData(field as never, value as never);
        if (clientErrors[field]) {
            setClientErrors((prev) => ({ ...prev, [field]: '' }));
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm()) {
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
                                <Select value={data.category_id} onValueChange={(value) => handleFieldChange('category_id', value)}>
                                    <SelectTrigger aria-invalid={Boolean(errors.category_id || clientErrors.category_id)}>
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
                                <InputError message={errors.category_id || clientErrors.category_id} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="name">Menu Item Name</Label>
                                <Input id="name" value={data.name} onChange={(e) => handleFieldChange('name', e.target.value)} placeholder="e.g. Pancakes, Chocolate Cake" required aria-invalid={Boolean(errors.name || clientErrors.name)} />
                                <InputError message={errors.name || clientErrors.name} />
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
                                <Label htmlFor="price">Price (ETB)</Label>
                                <Input id="price" type="number" step="0.01" min="0" value={data.price} onChange={(e) => handleFieldChange('price', e.target.value)} placeholder="9.99" required aria-invalid={Boolean(errors.price || clientErrors.price)} />
                                <InputError message={errors.price || clientErrors.price} />
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
                                <InputError message={errors.image || clientErrors.image} />

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
                                <Input id="preparation_time" type="number" min="0" value={data.preparation_time} onChange={(e) => handleFieldChange('preparation_time', e.target.value)} placeholder="15" aria-invalid={Boolean(errors.preparation_time || clientErrors.preparation_time)} />
                                <InputError message={errors.preparation_time || clientErrors.preparation_time} />
                            </div>

                            <div className="flex items-center space-x-2">
                                <input
                                    id="is_available"
                                    type="checkbox"
                                    checked={data.is_available}
                                    onChange={(e) => setData('is_available', e.target.checked)}
                                    className="h-4 w-4 rounded border-input"
                                />
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
