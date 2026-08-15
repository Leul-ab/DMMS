import { Head, Link, router, useForm } from '@inertiajs/react';
import { Percent } from 'lucide-react';
import { useState } from 'react';
import { DateTimePicker } from '@/components/date-time-picker';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    index as discountsIndex,
    update as discountsUpdate,
} from '@/routes/manager/discounts';

type Discount = {
    id: number;
    name: string;
    description: string | null;
    discount_type: string;
    applies_to: string;
    percentage: string | null;
    fixed_amount: string | null;
    status: string;
    start_date: string;
    end_date: string;
    start_time: string | null;
    end_time: string | null;
    menu_items: number[];
};

type Props = {
    discount: Discount;
    menuItems: { id: number; name: string }[];
};

const combineDateTime = (
    dateStr: string | null,
    timeStr: string | null,
): string => {
    if (!dateStr) {
        return '';
    }

    const timePart = timeStr ? timeStr.slice(0, 5) : '00:00';

    return `${dateStr}T${timePart}`;
};

export default function DiscountEdit({ discount, menuItems }: Props) {
    const { data, setData, processing, errors } = useForm({
        name: discount.name,
        description: discount.description || '',
        discount_type: discount.discount_type,
        applies_to: discount.applies_to || 'all',
        percentage: discount.percentage || '',
        fixed_amount: discount.fixed_amount || '',
        status: discount.status,
        start_date_time: combineDateTime(
            discount.start_date,
            discount.start_time,
        ),
        end_date_time: combineDateTime(discount.end_date, discount.end_time),
        menu_items: discount.menu_items || [],
    });

    const [menuItemSearch, setMenuItemSearch] = useState('');
    const [nameError, setNameError] = useState('');

    const validateDiscountName = (value: string): string => {
        const trimmed = value.trim();

        if (!trimmed) {
            return 'Discount Name is required.';
        }

        if (!/^[a-zA-Z\s]+$/.test(trimmed)) {
            return 'Discount Name must contain letters only.';
        }

        return '';
    };

    const toggleMenuItem = (id: number) => {
        setData(
            'menu_items',
            data.menu_items.includes(id)
                ? data.menu_items.filter((itemId) => itemId !== id)
                : [...data.menu_items, id],
        );
    };

    const filteredMenuItems = menuItems.filter((menuItem) =>
        menuItem.name.toLowerCase().includes(menuItemSearch.toLowerCase()),
    );

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const nameValidationError = validateDiscountName(data.name);
        setNameError(nameValidationError);

        if (nameValidationError) {
            return;
        }

        const formData = new FormData();
        formData.append('name', data.name);
        formData.append('description', data.description);
        formData.append('discount_type', data.discount_type);
        formData.append('applies_to', data.applies_to);
        formData.append('status', data.status);
        formData.append('start_date_time', data.start_date_time);
        formData.append('end_date_time', data.end_date_time);

        if (data.discount_type === 'percentage') {
            formData.append('percentage', data.percentage);
        } else {
            formData.append('fixed_amount', data.fixed_amount);
        }

        data.menu_items.forEach((id) => {
            formData.append('menu_items[]', String(id));
        });

        formData.append('_method', 'PUT');

        router.post(discountsUpdate.url(discount.id), formData, {
            forceFormData: true,
        });
    };

    return (
        <>
            <Head title={`Edit ${discount.name}`} />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <Heading
                    title={`Edit: ${discount.name}`}
                    description="Update discount details"
                    icon={Percent}
                />

                <Card className="max-w-2xl">
                    <CardContent className="pt-6">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid gap-2">
                                <Label htmlFor="name">Discount Name</Label>
                                <Input
                                    id="name"
                                    value={data.name}
                                    onChange={(e) => {
                                        const value = e.target.value;
                                        setData('name', value);
                                        const error =
                                            validateDiscountName(value);
                                        setNameError(error);
                                    }}
                                    onBlur={() => {
                                        const error = validateDiscountName(
                                            data.name,
                                        );
                                        setNameError(error);
                                    }}
                                    required
                                    className={
                                        nameError
                                            ? 'border-red-500'
                                            : data.name.trim() && !nameError
                                              ? 'border-green-500'
                                              : ''
                                    }
                                />
                                {nameError && (
                                    <p className="mt-1 text-sm text-red-500">
                                        {nameError}
                                    </p>
                                )}
                                <InputError message={errors.name} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="description">
                                    Description (optional)
                                </Label>
                                <textarea
                                    id="description"
                                    value={data.description}
                                    onChange={(e) =>
                                        setData('description', e.target.value)
                                    }
                                    placeholder="Brief description of this discount"
                                    rows={3}
                                    className="flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                                />
                                <InputError message={errors.description} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="discount_type">
                                    Discount Type
                                </Label>
                                <Select
                                    value={data.discount_type}
                                    onValueChange={(value) =>
                                        setData('discount_type', value)
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="percentage">
                                            Percentage
                                        </SelectItem>
                                        <SelectItem value="fixed">
                                            Fixed Amount
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                                <InputError message={errors.discount_type} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="applies_to">Applies To</Label>
                                <Select
                                    value={data.applies_to}
                                    onValueChange={(value) =>
                                        setData('applies_to', value)
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select applies to" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">
                                            All Customers
                                        </SelectItem>
                                        <SelectItem value="members">
                                            Members Only
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                                <InputError message={errors.applies_to} />
                            </div>

                            <div className="grid gap-2">
                                <Label>Select Items</Label>
                                <Input
                                    type="text"
                                    placeholder="Search menu items..."
                                    value={menuItemSearch}
                                    onChange={(e) =>
                                        setMenuItemSearch(e.target.value)
                                    }
                                    className="mb-2"
                                />
                                <div className="max-h-60 overflow-y-auto rounded-md border p-3">
                                    {filteredMenuItems.length === 0 ? (
                                        <p className="text-sm text-muted-foreground">
                                            No menu items available.
                                        </p>
                                    ) : (
                                        <div className="space-y-2">
                                            {filteredMenuItems.map(
                                                (menuItem) => (
                                                    <div
                                                        key={menuItem.id}
                                                        className="flex items-center space-x-2"
                                                    >
                                                        <Checkbox
                                                            id={`edit-menu-item-${menuItem.id}`}
                                                            checked={data.menu_items.includes(
                                                                menuItem.id,
                                                            )}
                                                            onCheckedChange={() =>
                                                                toggleMenuItem(
                                                                    menuItem.id,
                                                                )
                                                            }
                                                        />
                                                        <Label
                                                            htmlFor={`edit-menu-item-${menuItem.id}`}
                                                            className="text-sm font-normal"
                                                        >
                                                            {menuItem.name}
                                                        </Label>
                                                    </div>
                                                ),
                                            )}
                                        </div>
                                    )}
                                </div>
                                <InputError message={errors.menu_items} />
                            </div>

                            {data.discount_type === 'percentage' && (
                                <div className="grid gap-2">
                                    <Label htmlFor="percentage">
                                        Percentage (%)
                                    </Label>
                                    <Input
                                        id="percentage"
                                        type="number"
                                        min="0"
                                        max="100"
                                        step="0.01"
                                        value={data.percentage}
                                        onChange={(e) =>
                                            setData(
                                                'percentage',
                                                e.target.value,
                                            )
                                        }
                                        required
                                    />
                                    <InputError message={errors.percentage} />
                                </div>
                            )}

                            {data.discount_type === 'fixed' && (
                                <div className="grid gap-2">
                                    <Label htmlFor="fixed_amount">
                                        Fixed Amount
                                    </Label>
                                    <Input
                                        id="fixed_amount"
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={data.fixed_amount}
                                        onChange={(e) =>
                                            setData(
                                                'fixed_amount',
                                                e.target.value,
                                            )
                                        }
                                        required
                                    />
                                    <InputError message={errors.fixed_amount} />
                                </div>
                            )}

                            <div className="grid gap-2">
                                <Label htmlFor="status">Status</Label>
                                <Select
                                    value={data.status}
                                    onValueChange={(value) =>
                                        setData('status', value)
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="active">
                                            Active
                                        </SelectItem>
                                        <SelectItem value="inactive">
                                            Inactive
                                        </SelectItem>
                                        <SelectItem value="scheduled">
                                            Scheduled
                                        </SelectItem>
                                        <SelectItem value="expired">
                                            Expired
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                                <InputError message={errors.status} />
                            </div>

                            <div className="grid gap-2">
                            <Label>Date &amp; Time Range</Label>
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label
                                        htmlFor="start_date_time"
                                        className="text-sm text-gray-600"
                                    >
                                        Start Date &amp; Time
                                    </Label>
                                    <DateTimePicker
                                        id="start_date_time"
                                        value={data.start_date_time || ''}
                                        onChange={(val) =>
                                            setData(
                                                'start_date_time',
                                                val,
                                            )
                                        }
                                        error={errors.start_date_time}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label
                                        htmlFor="end_date_time"
                                        className="text-sm text-gray-600"
                                    >
                                        End Date &amp; Time
                                    </Label>
                                    <DateTimePicker
                                        id="end_date_time"
                                        value={data.end_date_time || ''}
                                        onChange={(val) =>
                                            setData(
                                                'end_date_time',
                                                val,
                                            )
                                        }
                                        error={errors.end_date_time}
                                    />
                                </div>
                            </div>
                        </div>

                            <div className="flex items-center gap-4">
                                <Button disabled={processing}>
                                    Update Discount
                                </Button>
                                <Link
                                    href={discountsIndex.url()}
                                    className="text-sm text-muted-foreground hover:text-foreground"
                                >
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

DiscountEdit.layout = {
    breadcrumbs: [
        { title: 'Discounts', href: discountsIndex.url() },
        { title: `Edit Discount`, href: '#' },
    ],
};
