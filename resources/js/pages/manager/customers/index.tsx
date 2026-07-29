import { Head, router } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import {
Eye,
Pencil,
Plus,
Search,
Trash2,
} from 'lucide-react';

import Heading from '@/components/heading';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
Card,
CardContent,
CardHeader,
CardTitle,
} from '@/components/ui/card';
import {
Dialog,
DialogContent,
DialogDescription,
DialogFooter,
DialogHeader,
DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

import {
store as customersStore,
update as customersUpdate,
destroy as customersDestroy,
} from '@/routes/manager/customers';

type Customer = {
id: number;
customer_code: string;
name: string;
email: string | null;
phone: string | null;
is_member: boolean;
created_at: string;
};

type Props = {
customers: Customer[];
};

export default function CustomersIndex({ customers }: Props) {
// Search
const [search, setSearch] = useState('');


// Modal states
const [isAddOpen, setIsAddOpen] = useState(false);
const [isViewOpen, setIsViewOpen] = useState(false);
const [isEditOpen, setIsEditOpen] = useState(false);
const [isDeleteOpen, setIsDeleteOpen] = useState(false);

// Selected customer
const [selectedCustomer, setSelectedCustomer] =
    useState<Customer | null>(null);

// Form fields
const [name, setName] = useState('');
const [phone, setPhone] = useState('');
const [email, setEmail] = useState('');
const [isMember, setIsMember] = useState(true);

// Filter customers
const filteredCustomers = useMemo(() => {
    const searchValue = search.toLowerCase();

    return customers.filter((customer) => {
        return (
            customer.name
                .toLowerCase()
                .includes(searchValue) ||
            customer.customer_code
                .toLowerCase()
                .includes(searchValue) ||
            (customer.phone ?? '')
                .toLowerCase()
                .includes(searchValue) ||
            (customer.email ?? '')
                .toLowerCase()
                .includes(searchValue)
        );
    });
}, [customers, search]);

// Open Add Customer modal
const openAddModal = () => {
    setName('');
    setPhone('');
    setEmail('');
    setIsMember(true);
    setIsAddOpen(true);
};

// Open View Customer modal
const openViewModal = (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsViewOpen(true);
};

// Open Edit Customer modal
const openEditModal = (customer: Customer) => {
    setSelectedCustomer(customer);

    setName(customer.name);
    setPhone(customer.phone ?? '');
    setEmail(customer.email ?? '');
    setIsMember(customer.is_member);

    setIsEditOpen(true);
};

// Open Delete Customer modal
const openDeleteModal = (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsDeleteOpen(true);
};

// Add Customer
const handleAdd = () => {
    if (!name.trim() || !phone.trim()) {
        return;
    }

    router.post(
        customersStore().url,
        {
            name,
            phone,
            email: email || null,
            is_member: isMember,
        },
        {
            onSuccess: () => {
                setIsAddOpen(false);

                setName('');
                setPhone('');
                setEmail('');
                setIsMember(true);
            },
        },
    );
};

// Update Customer
const handleUpdate = () => {
    if (!selectedCustomer || !name.trim() || !phone.trim()) {
        return;
    }

    router.put(
        customersUpdate(selectedCustomer.id).url,
        {
            name,
            phone,
            email: email || null,
            is_member: isMember,
        },
        {
            onSuccess: () => {
                setIsEditOpen(false);
                setSelectedCustomer(null);

                setName('');
                setPhone('');
                setEmail('');
                setIsMember(true);
            },
        },
    );
};
const handleToggleMembership = (customer: Customer) => {
    router.patch(
        `/manager/customers/${customer.id}/toggle-membership`,
        {},
        {
            preserveScroll: true,
        },
    );
};
// Delete Customer
const handleDelete = () => {
    if (!selectedCustomer) {
        return;
    }

    router.delete(
        customersDestroy(selectedCustomer.id).url,
        {
            onSuccess: () => {
                setIsDeleteOpen(false);
                setSelectedCustomer(null);
            },
        },
    );
};

return (
    <>
        <Head title="Customer Management" />

        <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl p-4">

            {/* Page Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <Heading
                    title="Customer Management"
                    description="Manage registered customers and members."
                />

                <Button onClick={openAddModal}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Customer
                </Button>
            </div>

            {/* Customer Table Card */}
            <Card>
                <CardHeader>
                    <CardTitle>Registered Customers</CardTitle>

                    {/* Search */}
                    <div className="relative pt-4">
                        <Search className="absolute left-3 top-1/2 mt-2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

                        <Input
                            placeholder="Search by name, customer code, phone, or email..."
                            value={search}
                            onChange={(event) =>
                                setSearch(event.target.value)
                            }
                            className="pl-9"
                        />
                    </div>
                </CardHeader>

                <CardContent>
                    {filteredCustomers.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted text-4xl">
                                👥
                            </div>

                            <p className="mt-5 text-lg font-medium">
                                No customers found
                            </p>

                            <p className="mt-1 text-sm text-muted-foreground">
                                Add a new customer to see them here.
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b text-left">
                                        <th className="p-3">
                                            #
                                        </th>

                                        <th className="p-3">
                                            Customer Code
                                        </th>

                                        <th className="p-3">
                                            Name
                                        </th>

                                        <th className="p-3">
                                            Phone
                                        </th>

                                        <th className="p-3">
                                            Email
                                        </th>

                                        <th className="p-3">
                                            Membership
                                        </th>

                                        <th className="p-3 text-right">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {filteredCustomers.map(
                                        (customer, index) => (
                                            <tr
                                                key={customer.id}
                                                className="border-b last:border-0 hover:bg-muted/50"
                                            >
                                                <td className="p-3 text-muted-foreground">
                                                    {index + 1}
                                                </td>

                                                <td className="p-3 font-medium">
                                                    {customer.customer_code}
                                                </td>

                                                <td className="p-3">
                                                    {customer.name}
                                                </td>

                                                <td className="p-3 text-muted-foreground">
                                                    {customer.phone}
                                                </td>

                                                <td className="p-3 text-muted-foreground">
                                                    {customer.email ||
                                                        'Not provided'}
                                                </td>

                                                <td className="p-3">
    <div className="flex items-center gap-2">
        <button
            type="button"
            onClick={() =>
                handleToggleMembership(customer)
            }
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                customer.is_member
                    ? 'bg-green-500'
                    : 'bg-gray-300'
            }`}
            title={
                customer.is_member
                    ? 'Change to Not a Member'
                    : 'Change to Member'
            }
        >
            <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                    customer.is_member
                        ? 'translate-x-6'
                        : 'translate-x-1'
                }`}
            />
        </button>

        <Badge
            variant={
                customer.is_member
                    ? 'default'
                    : 'secondary'
            }
        >
            {customer.is_member
                ? 'Member'
                : 'Not a Member'}
        </Badge>
    </div>
</td>

                                                <td className="p-3">
                                                    <div className="flex justify-end gap-2">

                                                        {/* View */}
                                                        <Button
                                                            variant="outline"
                                                            size="icon"
                                                            onClick={() =>
                                                                openViewModal(
                                                                    customer,
                                                                )
                                                            }
                                                        >
                                                            <Eye className="h-4 w-4" />
                                                        </Button>

                                                        {/* Edit */}
                                                        <Button
                                                            variant="outline"
                                                            size="icon"
                                                            onClick={() =>
                                                                openEditModal(
                                                                    customer,
                                                                )
                                                            }
                                                        >
                                                            <Pencil className="h-4 w-4" />
                                                        </Button>

                                                        {/* Delete */}
                                                        <Button
                                                            variant="destructive"
                                                            size="icon"
                                                            onClick={() =>
                                                                openDeleteModal(
                                                                    customer,
                                                                )
                                                            }
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>

                                                    </div>
                                                </td>
                                            </tr>
                                        ),
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>

        {/* ========================================= */}
        {/* ADD CUSTOMER MODAL */}
        {/* ========================================= */}

        <Dialog
            open={isAddOpen}
            onOpenChange={setIsAddOpen}
        >
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>
                        Add Customer
                    </DialogTitle>

                    <DialogDescription>
                        Create a new customer. The customer code will be generated automatically.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">

                    {/* Name */}
                    <div>
                        <label className="mb-2 block text-sm font-medium">
                            Full Name
                        </label>

                        <Input
                            value={name}
                            onChange={(event) =>
                                setName(event.target.value)
                            }
                            placeholder="Enter customer name"
                        />
                    </div>

                    {/* Phone */}
                    <div>
                        <label className="mb-2 block text-sm font-medium">
                            Phone Number
                        </label>

                        <Input
                            value={phone}
                            onChange={(event) =>
                                setPhone(event.target.value)
                            }
                            placeholder="Enter phone number"
                        />
                    </div>

                    {/* Email */}
                    <div>
                        <label className="mb-2 block text-sm font-medium">
                            Email
                        </label>

                        <Input
                            type="email"
                            value={email}
                            onChange={(event) =>
                                setEmail(event.target.value)
                            }
                            placeholder="Enter email address (optional)"
                        />
                    </div>

                    {/* Membership */}
                    <div className="flex items-center gap-3">
                        <input
                            id="add-is-member"
                            type="checkbox"
                            checked={isMember}
                            onChange={(event) =>
                                setIsMember(event.target.checked)
                            }
                            className="h-4 w-4"
                        />

                        <label
                            htmlFor="add-is-member"
                            className="text-sm font-medium"
                        >
                            Customer is a member
                        </label>
                    </div>

                </div>

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => setIsAddOpen(false)}
                    >
                        Cancel
                    </Button>

                    <Button onClick={handleAdd}>
                        Add Customer
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>

        {/* ========================================= */}
        {/* VIEW CUSTOMER MODAL */}
        {/* ========================================= */}

        <Dialog
            open={isViewOpen}
            onOpenChange={setIsViewOpen}
        >
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>
                        Customer Details
                    </DialogTitle>

                    <DialogDescription>
                        View customer information.
                    </DialogDescription>
                </DialogHeader>

                {selectedCustomer && (
                    <div className="space-y-4 py-4">

                        {/* Customer Code */}
                        <div className="rounded-lg border bg-muted/30 p-4">
                            <p className="text-sm text-muted-foreground">
                                Customer Code
                            </p>

                            <p className="mt-1 text-lg font-bold">
                                {selectedCustomer.customer_code}
                            </p>
                        </div>

                        {/* Name */}
                        <div>
                            <p className="text-sm text-muted-foreground">
                                Full Name
                            </p>

                            <p className="font-medium">
                                {selectedCustomer.name}
                            </p>
                        </div>

                        {/* Phone */}
                        <div>
                            <p className="text-sm text-muted-foreground">
                                Phone Number
                            </p>

                            <p className="font-medium">
                                {selectedCustomer.phone}
                            </p>
                        </div>

                        {/* Email */}
                        <div>
                            <p className="text-sm text-muted-foreground">
                                Email
                            </p>

                            <p className="font-medium">
                                {selectedCustomer.email ||
                                    'Not provided'}
                            </p>
                        </div>

                        {/* Membership */}
                        <div>
                            <p className="text-sm text-muted-foreground">
                                Membership
                            </p>

                            <div className="mt-1">
                                {selectedCustomer.is_member ? (
                                    <Badge>
                                        Member
                                    </Badge>
                                ) : (
                                    <Badge variant="secondary">
                                        Not a Member
                                    </Badge>
                                )}
                            </div>
                        </div>

                        {/* Registered Date */}
                        <div>
                            <p className="text-sm text-muted-foreground">
                                Registered
                            </p>

                            <p className="font-medium">
                                {new Date(
                                    selectedCustomer.created_at,
                                ).toLocaleDateString()}
                            </p>
                        </div>

                    </div>
                )}

                <DialogFooter>
                    <Button
                        onClick={() => setIsViewOpen(false)}
                    >
                        Close
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>

        {/* ========================================= */}
        {/* EDIT CUSTOMER MODAL */}
        {/* ========================================= */}

        <Dialog
            open={isEditOpen}
            onOpenChange={setIsEditOpen}
        >
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>
                        Edit Customer
                    </DialogTitle>

                    <DialogDescription>
                        Update customer information. The customer code cannot be changed.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">

                    {/* Customer Code - READ ONLY */}
                    <div>
                        <label className="mb-2 block text-sm font-medium">
                            Customer Code
                        </label>

                        <Input
                            value={
                                selectedCustomer?.customer_code || ''
                            }
                            disabled
                        />

                        <p className="mt-1 text-xs text-muted-foreground">
                            Customer codes are generated automatically and cannot be changed.
                        </p>
                    </div>

                    {/* Name */}
                    <div>
                        <label className="mb-2 block text-sm font-medium">
                            Full Name
                        </label>

                        <Input
                            value={name}
                            onChange={(event) =>
                                setName(event.target.value)
                            }
                        />
                    </div>

                    {/* Phone */}
                    <div>
                        <label className="mb-2 block text-sm font-medium">
                            Phone Number
                        </label>

                        <Input
                            value={phone}
                            onChange={(event) =>
                                setPhone(event.target.value)
                            }
                        />
                    </div>

                    {/* Email */}
                    <div>
                        <label className="mb-2 block text-sm font-medium">
                            Email
                        </label>

                        <Input
                            type="email"
                            value={email}
                            onChange={(event) =>
                                setEmail(event.target.value)
                            }
                        />
                    </div>

                    {/* Membership */}
                    <div className="flex items-center gap-3">
                        <input
                            id="edit-is-member"
                            type="checkbox"
                            checked={isMember}
                            onChange={(event) =>
                                setIsMember(event.target.checked)
                            }
                            className="h-4 w-4"
                        />

                        <label
                            htmlFor="edit-is-member"
                            className="text-sm font-medium"
                        >
                            Customer is a member
                        </label>
                    </div>

                </div>

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => setIsEditOpen(false)}
                    >
                        Cancel
                    </Button>

                    <Button onClick={handleUpdate}>
                        Update Customer
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>

        {/* ========================================= */}
        {/* DELETE CUSTOMER MODAL */}
        {/* ========================================= */}

        <Dialog
            open={isDeleteOpen}
            onOpenChange={setIsDeleteOpen}
        >
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>
                        Delete Customer?
                    </DialogTitle>

                    <DialogDescription>
                        Are you sure you want to delete{' '}
                        <strong>
                            {selectedCustomer?.name}
                        </strong>{' '}
                        ({selectedCustomer?.customer_code})?
                        This action cannot be undone.
                    </DialogDescription>
                </DialogHeader>

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() =>
                            setIsDeleteOpen(false)
                        }
                    >
                        Cancel
                    </Button>

                    <Button
                        variant="destructive"
                        onClick={handleDelete}
                    >
                        Delete Customer
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    </>
);
}