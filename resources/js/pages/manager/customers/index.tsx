import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import Heading from '@/components/heading';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

type Customer = {
    id: number;
    customer_code: string;
    name: string;
    email: string | null;
    phone: string | null;
    created_at: string;
};

type Props = {
    customers: Customer[];
    filters: {
        search: string;
    };
};

export default function CustomersIndex({ customers, filters }: Props) {
    const [search, setSearch] = useState(filters.search || '');

    const handleSearch = (value: string) => {
        setSearch(value);
        router.get(
            '/manager/customers',
            { search: value || undefined },
            { preserveState: true, replace: true }
        );
    };

    return (
        <>
            <Head title="Registered Members" />

            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl p-4">
                <Heading
                    title="Registered Members"
                    description="View all customers who have registered as members."
                />

                {customers.length === 0 ? (
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center py-16">
                            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted text-4xl">
                                👥
                            </div>

                            <h3 className="mt-5 text-lg font-semibold">
                                No Members Yet
                            </h3>

                            <p className="mt-1 text-sm text-muted-foreground">
                                {filters.search
                                    ? 'No members match your search. Try a different search term.'
                                    : 'Customers who register as members will appear here.'}
                            </p>
                        </CardContent>
                    </Card>
                ) : (
                    <Card>
                        <CardContent className="p-0">
                            <div className="border-b p-4">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        placeholder="Search by customer code, name, phone, or email..."
                                        value={search}
                                        onChange={(event) =>
                                            handleSearch(event.target.value)
                                        }
                                        className="max-w-sm pl-9"
                                    />
                                </div>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b text-left text-sm text-muted-foreground">
                                            <th className="px-6 py-4 font-medium">
                                                Customer Code
                                            </th>

                                            <th className="px-6 py-4 font-medium">
                                                #
                                            </th>

                                            <th className="px-6 py-4 font-medium">
                                                Name
                                            </th>

                                            <th className="px-6 py-4 font-medium">
                                                Phone
                                            </th>

                                            <th className="px-6 py-4 font-medium">
                                                Email
                                            </th>

                                            <th className="px-6 py-4 font-medium">
                                                Membership
                                            </th>

                                            <th className="px-6 py-4 font-medium">
                                                Registered
                                            </th>
                                        </tr>
                                    </thead>

                                    <tbody>
                                        {customers.map((customer, index) => (
                                            <tr
                                                key={customer.id}
                                                className="border-b last:border-0 hover:bg-muted/50"
                                            >
                                                <td className="px-6 py-4">
                                                    <code className="rounded-md bg-muted px-2 py-1 font-mono text-sm font-bold tracking-wide text-foreground">
                                                        {customer.customer_code}
                                                    </code>
                                                </td>

                                                <td className="px-6 py-4 text-sm text-muted-foreground">
                                                    {index + 1}
                                                </td>

                                                <td className="px-6 py-4 text-sm font-medium">
                                                    {customer.name}
                                                </td>

                                                <td className="px-6 py-4 text-sm text-muted-foreground">
                                                    {customer.phone}
                                                </td>

                                                <td className="px-6 py-4 text-sm text-muted-foreground">
                                                    {customer.email || 'Not provided'}
                                                </td>

                                                <td className="px-6 py-4">
                                                    <Badge>
                                                        Member
                                                    </Badge>
                                                </td>

                                                <td className="px-6 py-4 text-sm text-muted-foreground">
                                                    {new Date(
                                                        customer.created_at
                                                    ).toLocaleDateString()}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </>
    );
}
