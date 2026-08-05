import { Head, Link, useForm } from '@inertiajs/react';
import { Percent } from 'lucide-react';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { create as discountsCreate, index as discountsIndex, store as discountsStore } from '@/routes/manager/discounts';

export default function DiscountCreate() {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        description: '',
        discount_type: 'percentage',
        percentage: '',
        fixed_amount: '',
        status: 'active',
        start_date: '',
        end_date: '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(discountsStore.url());
    };

    return (
        <>
            <Head title="Create Discount" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <Heading title="Create Discount" description="Add a new discount or promotion" icon={Percent} />

                <Card className="max-w-2xl">
                    <CardContent className="pt-6">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid gap-2">
                                <Label htmlFor="name">Discount Name</Label>
                                <Input id="name" value={data.name} onChange={(e) => setData('name', e.target.value)} placeholder="e.g. Summer Sale, New Customer" required />
                                <InputError message={errors.name} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="description">Description (optional)</Label>
                                <textarea
                                    id="description"
                                    value={data.description}
                                    onChange={(e) => setData('description', e.target.value)}
                                    placeholder="Brief description of this discount"
                                    rows={3}
                                    className="flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                />
                                <InputError message={errors.description} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="discount_type">Discount Type</Label>
                                <Select value={data.discount_type} onValueChange={(value) => setData('discount_type', value)}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="percentage">Percentage</SelectItem>
                                        <SelectItem value="fixed">Fixed Amount</SelectItem>
                                    </SelectContent>
                                </Select>
                                <InputError message={errors.discount_type} />
                            </div>

                            {data.discount_type === 'percentage' && (
                                <div className="grid gap-2">
                                    <Label htmlFor="percentage">Percentage (%)</Label>
                                    <Input id="percentage" type="number" min="0" max="100" step="0.01" value={data.percentage} onChange={(e) => setData('percentage', e.target.value)} placeholder="15" required />
                                    <InputError message={errors.percentage} />
                                </div>
                            )}

                            {data.discount_type === 'fixed' && (
                                <div className="grid gap-2">
                                    <Label htmlFor="fixed_amount">Fixed Amount</Label>
                                    <Input id="fixed_amount" type="number" min="0" step="0.01" value={data.fixed_amount} onChange={(e) => setData('fixed_amount', e.target.value)} placeholder="10.00" required />
                                    <InputError message={errors.fixed_amount} />
                                </div>
                            )}

                            <div className="grid gap-2">
                                <Label htmlFor="status">Status</Label>
                                <Select value={data.status} onValueChange={(value) => setData('status', value)}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="active">Active</SelectItem>
                                        <SelectItem value="inactive">Inactive</SelectItem>
                                        <SelectItem value="scheduled">Scheduled</SelectItem>
                                        <SelectItem value="expired">Expired</SelectItem>
                                    </SelectContent>
                                </Select>
                                <InputError message={errors.status} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="start_date">Start Date</Label>
                                <Input id="start_date" type="date" value={data.start_date} onChange={(e) => setData('start_date', e.target.value)} required />
                                <InputError message={errors.start_date} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="end_date">End Date</Label>
                                <Input id="end_date" type="date" value={data.end_date} onChange={(e) => setData('end_date', e.target.value)} required />
                                <InputError message={errors.end_date} />
                            </div>

                            <div className="flex items-center gap-4">
                                <Button disabled={processing}>Create Discount</Button>
                                <Link href={discountsIndex.url()} className="text-sm text-muted-foreground hover:text-foreground">
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

DiscountCreate.layout = {
    breadcrumbs: [
        { title: 'Discounts', href: discountsIndex.url() },
        { title: 'Create Discount', href: discountsCreate.url() },
    ],
};
