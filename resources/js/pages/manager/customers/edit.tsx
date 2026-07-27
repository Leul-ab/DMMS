import { Head, Link, useForm } from '@inertiajs/react';
import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

type Customer = {
    id: number;
    customer_code: string;
    name: string;
    phone: string;
    email: string | null;
    is_member: boolean;
};

type Props = {
    customer: Customer;
};

export default function EditCustomer({ customer }: Props) {
    const { data, setData, put, processing, errors } = useForm({
        customer_code: customer.customer_code,
        name: customer.name,
        phone: customer.phone,
        email: customer.email ?? '',
        is_member: customer.is_member,
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();

        put(`/manager/customers/${customer.id}`);
    };

    return (
        <>
            <Head title="Edit Customer" />

            <div className="flex h-full flex-1 flex-col gap-6 p-4">
                <Heading
                    title="Edit Customer"
                    description="Update customer information."
                />

                <Card className="max-w-2xl">
                    <CardContent className="p-6">
                        <form
                            onSubmit={submit}
                            className="space-y-6"
                        >
                            {/* Customer Code */}
                            <div className="space-y-2">
                                <label
                                    htmlFor="customer_code"
                                    className="text-sm font-medium"
                                >
                                    Customer Code
                                </label>

                                <input
                                    id="customer_code"
                                    type="text"
                                    value={data.customer_code}
                                    onChange={(e) =>
                                        setData(
                                            'customer_code',
                                            e.target.value
                                        )
                                    }
                                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                />

                                {errors.customer_code && (
                                    <p className="text-sm text-red-500">
                                        {errors.customer_code}
                                    </p>
                                )}
                            </div>

                            {/* Name */}
                            <div className="space-y-2">
                                <label
                                    htmlFor="name"
                                    className="text-sm font-medium"
                                >
                                    Full Name
                                </label>

                                <input
                                    id="name"
                                    type="text"
                                    value={data.name}
                                    onChange={(e) =>
                                        setData(
                                            'name',
                                            e.target.value
                                        )
                                    }
                                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                />

                                {errors.name && (
                                    <p className="text-sm text-red-500">
                                        {errors.name}
                                    </p>
                                )}
                            </div>

                            {/* Phone */}
                            <div className="space-y-2">
                                <label
                                    htmlFor="phone"
                                    className="text-sm font-medium"
                                >
                                    Phone Number
                                </label>

                                <input
                                    id="phone"
                                    type="text"
                                    value={data.phone}
                                    onChange={(e) =>
                                        setData(
                                            'phone',
                                            e.target.value
                                        )
                                    }
                                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                />

                                {errors.phone && (
                                    <p className="text-sm text-red-500">
                                        {errors.phone}
                                    </p>
                                )}
                            </div>

                            {/* Email */}
                            <div className="space-y-2">
                                <label
                                    htmlFor="email"
                                    className="text-sm font-medium"
                                >
                                    Email
                                </label>

                                <input
                                    id="email"
                                    type="email"
                                    value={data.email}
                                    onChange={(e) =>
                                        setData(
                                            'email',
                                            e.target.value
                                        )
                                    }
                                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                />

                                {errors.email && (
                                    <p className="text-sm text-red-500">
                                        {errors.email}
                                    </p>
                                )}
                            </div>

                            {/* Membership */}
                            <div className="flex items-center gap-3">
                                <input
                                    id="is_member"
                                    type="checkbox"
                                    checked={data.is_member}
                                    onChange={(e) =>
                                        setData(
                                            'is_member',
                                            e.target.checked
                                        )
                                    }
                                    className="h-4 w-4"
                                />

                                <label
                                    htmlFor="is_member"
                                    className="text-sm font-medium"
                                >
                                    Customer is a member
                                </label>
                            </div>

                            {/* Buttons */}
                            <div className="flex gap-3 pt-4">
                                <Button
                                    type="submit"
                                    disabled={processing}
                                >
                                    {processing
                                        ? 'Updating...'
                                        : 'Update Customer'}
                                </Button>

                                <Button
                                    type="button"
                                    variant="outline"
                                    asChild
                                >
                                    <Link href="/manager/customers">
                                        Cancel
                                    </Link>
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}