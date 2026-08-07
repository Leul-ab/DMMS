import { Head, Link, useForm } from '@inertiajs/react';
import { useState } from 'react';
import { UserPlus } from 'lucide-react';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { emailRule, phoneRule, requiredRule, validateFields } from '@/lib/form-validation';

export default function CreateCustomer() {
    const { data, setData, post, processing, errors } = useForm({
        customer_code: '',
        name: '',
        phone: '',
        email: '',
        is_member: true,
    });

    const [clientErrors, setClientErrors] = useState<Record<string, string>>({});

    const validateForm = () => {
        const nextErrors = validateFields(data, {
            customer_code: [requiredRule('Customer code is required.')],
            name: [requiredRule('Customer name is required.')],
            phone: [phoneRule()],
            email: [emailRule()],
        });

        setClientErrors(nextErrors);
        return Object.keys(nextErrors).length === 0;
    };

    const handleFieldChange = (field: string, value: string | boolean) => {
        setData(field as never, value as never);
        if (clientErrors[field]) {
            setClientErrors((prev) => ({ ...prev, [field]: '' }));
        }
    };

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm()) {
            return;
        }

        post('/manager/customers');
    };

    return (
        <>
            <Head title="Add Customer" />

            <div className="flex h-full flex-1 flex-col gap-6 p-4">
                <Heading
                    title="Add Customer"
                    description="Create a new customer record."
                    icon={UserPlus}
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
                                        handleFieldChange('customer_code', e.target.value)
                                    }
                                    placeholder="Enter customer code"
                                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                    aria-invalid={Boolean(errors.customer_code || clientErrors.customer_code)}
                                />

                                <InputError message={errors.customer_code || clientErrors.customer_code} />
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
                                        handleFieldChange('name', e.target.value)
                                    }
                                    placeholder="Enter customer name"
                                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                    aria-invalid={Boolean(errors.name || clientErrors.name)}
                                />

                                <InputError message={errors.name || clientErrors.name} />
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
                                        handleFieldChange('phone', e.target.value)
                                    }
                                    placeholder="Enter phone number"
                                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                    aria-invalid={Boolean(errors.phone || clientErrors.phone)}
                                />

                                <InputError message={errors.phone || clientErrors.phone} />
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
                                        handleFieldChange('email', e.target.value)
                                    }
                                    placeholder="Enter email address"
                                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                    aria-invalid={Boolean(errors.email || clientErrors.email)}
                                />

                                <InputError message={errors.email || clientErrors.email} />
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
                                        ? 'Saving...'
                                        : 'Create Customer'}
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
