import { Head, Link, useForm } from '@inertiajs/react';
import { Tags } from 'lucide-react';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import StatusToggle from '@/components/status-toggle';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { create as categoriesCreate, index as categoriesIndex, store as categoriesStore } from '@/routes/manager/categories';

export default function CategoryCreate() {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        description: '',
        sort_order: 0,
        is_active: true,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(categoriesStore.url());
    };

    return (
        <>
            <Head title="Create Category" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <Heading title="Create Category" description="Add a new menu category" icon={Tags} />

                <Card className="max-w-2xl">
                    <CardContent className="pt-6">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid gap-2">
                                <Label htmlFor="name">Name</Label>
                                <Input id="name" value={data.name} onChange={(e) => setData('name', e.target.value)} placeholder="e.g. Breakfast, Lunch, Desserts" required />
                                <InputError message={errors.name} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="description">Description (optional)</Label>
                                <textarea
                                    id="description"
                                    value={data.description}
                                    onChange={(e) => setData('description', e.target.value)}
                                    placeholder="Brief description of this category"
                                    rows={3}
                                    className="flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                />
                                <InputError message={errors.description} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="sort_order">Sort Order</Label>
                                <Input id="sort_order" type="number" min={0} value={data.sort_order} onChange={(e) => setData('sort_order', Number(e.target.value))} placeholder="0" />
                                <InputError message={errors.sort_order} />
                            </div>

                            <div className="flex items-center justify-between">
                                <label className="text-sm font-medium">
                                    Active Category
                                </label>
                                <StatusToggle
                                    checked={data.is_active}
                                    onCheckedChange={() =>
                                        setData('is_active', !data.is_active)
                                    }
                                    onLabel="Active"
                                    offLabel="Inactive"
                                    ariaLabel="Toggle active category status"
                                />
                            </div>

                            <div className="flex items-center gap-4">
                                <Button disabled={processing}>Create Category</Button>
                                <Link href={categoriesIndex.url()} className="text-sm text-muted-foreground hover:text-foreground">
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

CategoryCreate.layout = {
    breadcrumbs: [
        { title: 'Menu Categories', href: categoriesIndex.url() },
        { title: 'Create Category', href: categoriesCreate.url() },
    ],
};
