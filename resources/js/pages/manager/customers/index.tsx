
import { Head, router } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import {
    Eye,
    Pencil,
    Plus,
    Search,
    Trash2,
    Users,
} from 'lucide-react';

import Heading from '@/components/heading';
import StatusToggle from '@/components/status-toggle';
import { useCan } from '@/hooks/use-can';

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

export default function CustomersIndex({
    customers,
}: Props) {
    const can = useCan();

    // =========================================
    // SEARCH
    // =========================================

    const [search, setSearch] = useState('');

    // =========================================
    // MODAL STATES
    // =========================================

    const [isAddOpen, setIsAddOpen] =
        useState(false);

    const [isViewOpen, setIsViewOpen] =
        useState(false);

    const [isEditOpen, setIsEditOpen] =
        useState(false);

    const [isDeleteOpen, setIsDeleteOpen] =
        useState(false);

    // =========================================
    // SELECTED CUSTOMER
    // =========================================

    const [selectedCustomer, setSelectedCustomer] =
        useState<Customer | null>(null);

    // =========================================
    // FORM FIELDS
    // =========================================

    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [isMember, setIsMember] = useState(true);

    // =========================================
    // FILTER CUSTOMERS
    // =========================================

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

    // =========================================
    // OPEN ADD CUSTOMER MODAL
    // =========================================

    const openAddModal = () => {
        setName('');
        setPhone('');
        setEmail('');
        setIsMember(true);

        setIsAddOpen(true);
    };

    // =========================================
    // OPEN VIEW CUSTOMER MODAL
    // =========================================

    const openViewModal = (
        customer: Customer,
    ) => {
        setSelectedCustomer(customer);
        setIsViewOpen(true);
    };

    // =========================================
    // OPEN EDIT CUSTOMER MODAL
    // =========================================

    const openEditModal = (
        customer: Customer,
    ) => {
        setSelectedCustomer(customer);

        setName(customer.name);
        setPhone(customer.phone ?? '');
        setEmail(customer.email ?? '');
        setIsMember(customer.is_member);

        setIsEditOpen(true);
    };

    // =========================================
    // OPEN DELETE CUSTOMER MODAL
    // =========================================

    const openDeleteModal = (
        customer: Customer,
    ) => {
        setSelectedCustomer(customer);
        setIsDeleteOpen(true);
    };

    // =========================================
    // TOGGLE MEMBERSHIP
    // =========================================

    const handleToggleMembership = (
        customer: Customer,
    ) => {
        router.patch(
            `/manager/customers/${customer.id}/toggle-membership`,
            {},
            {
                preserveScroll: true,
            },
        );
    };

    // =========================================
    // ADD CUSTOMER
    // =========================================

    const handleAdd = () => {
        if (
            !name.trim() ||
            !phone.trim()
        ) {
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

    // =========================================
    // UPDATE CUSTOMER
    // =========================================

    const handleUpdate = () => {
        if (
            !selectedCustomer ||
            !name.trim() ||
            !phone.trim()
        ) {
            return;
        }

        router.put(
            customersUpdate(
                selectedCustomer.id,
            ).url,
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

    // =========================================
    // DELETE CUSTOMER
    // =========================================

    const handleDelete = () => {
        if (!selectedCustomer) {
            return;
        }

        router.delete(
            customersDestroy(
                selectedCustomer.id,
            ).url,
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

                {/* =========================================
                    PAGE HEADER
                ========================================= */}

                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <Heading
                        title="Customer Management"
                        description="Manage registered customers and members."
                        icon={Users}
                    />

                    {can('create customers') && (
                        <Button
                            onClick={openAddModal}
                        >
                            <Plus className="mr-2 h-4 w-4" />
                            Add Customer
                        </Button>
                    )}
                </div>

                {/* =========================================
                    CUSTOMER TABLE CARD
                ========================================= */}

                <Card>
                    <CardHeader>
                        <CardTitle>
                            Registered Customers
                        </CardTitle>

                        {/* Search */}
                        <div className="relative pt-4">
                            <Search className="absolute left-3 top-1/2 mt-2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

                            <Input
                                placeholder="Search by name, customer code, phone, or email..."
                                value={search}
                                onChange={(event) =>
                                    setSearch(
                                        event.target.value,
                                    )
                                }
                                className="pl-9"
                            />
                        </div>
                    </CardHeader>

                    <CardContent>
                        {filteredCustomers.length ===
                        0 ? (
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
                                                Customer Code
                                            </th>

                                            <th className="p-3">
                                                Full Name
                                            </th>

                                            <th className="p-3">
                                                Phone Number
                                            </th>

                                            <th className="p-3">
                                                Email
                                            </th>

                                            <th className="p-3">
                                                Registration Date
                                            </th>

                                            <th className="p-3">
                                                Status
                                            </th>

                                            <th className="p-3 text-right">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>

                                    <tbody>
                                        {filteredCustomers.map(
                                            (
                                                customer,
                                            ) => (
                                                <tr
                                                    key={
                                                        customer.id
                                                    }
                                                    className="border-b last:border-0 hover:bg-muted/50"
                                                >
                                                    {/* Customer Code */}
                                                    <td className="p-3">
                                                        <span className="font-mono font-bold text-orange-600">
                                                            {
                                                                customer.customer_code
                                                            }
                                                        </span>
                                                    </td>

                                                    {/* Name */}
                                                    <td className="p-3 font-medium">
                                                        {
                                                            customer.name
                                                        }
                                                    </td>

                                                    {/* Phone */}
                                                    <td className="p-3 text-muted-foreground">
                                                        {
                                                            customer.phone
                                                        }
                                                    </td>

                                                    {/* Email */}
                                                    <td className="p-3 text-muted-foreground">
                                                        {customer.email ||
                                                            'Not provided'}
                                                    </td>

                                                    {/* Registration Date */}
                                                    <td className="p-3 text-muted-foreground">
                                                        {new Date(
                                                            customer.created_at,
                                                        ).toLocaleDateString(
                                                            'en-US',
                                                            {
                                                                year: 'numeric',
                                                                month: 'short',
                                                                day: 'numeric',
                                                            },
                                                        )}
                                                    </td>

                                                    {/* =========================================
                                                        STATUS

                                                        MEMBER:
                                                        Black background

                                                        NOT A MEMBER:
                                                        Red background
                                                    ========================================= */}

                                                    <td className="p-3">
                                                        <Badge
                                                            className={
                                                                customer.is_member
                                                                    ? 'bg-black text-white hover:bg-black'
                                                                    : 'bg-red-500 text-white hover:bg-red-500'
                                                            }
                                                        >
                                                            {customer.is_member
                                                                ? 'Member'
                                                                : 'Not a Member'}
                                                        </Badge>
                                                    </td>

                                                    {/* Actions */}
                                                    <td className="p-3">
                                                        <div className="flex items-center justify-end gap-2">

                                                            {/* Toggle */}
                                                            {can('status customers') && (
                                                                <StatusToggle
                                                                    checked={
                                                                        customer.is_member
                                                                    }
                                                                    onCheckedChange={() =>
                                                                        handleToggleMembership(
                                                                            customer,
                                                                        )
                                                                    }
                                                                    onLabel="Change to Not a Member"
                                                                    offLabel="Change to Member"
                                                                    ariaLabel={
                                                                        customer.is_member
                                                                            ? 'Change customer to not a member'
                                                                            : 'Change customer to member'
                                                                    }
                                                                />
                                                            )}

                                                            {/* View */}
                                                            {can('view customers') && (
                                                                <Button
                                                                    variant="outline"
                                                                    size="icon"
                                                                    onClick={() =>
                                                                        openViewModal(
                                                                            customer,
                                                                        )
                                                                    }
                                                                    title="View Customer"
                                                                >
                                                                    <Eye className="h-4 w-4" />
                                                                </Button>
                                                            )}

                                                            {/* Edit */}
                                                            {can('update customers') && (
                                                                <Button
                                                                    variant="outline"
                                                                    size="icon"
                                                                    onClick={() =>
                                                                        openEditModal(
                                                                            customer,
                                                                        )
                                                                    }
                                                                    title="Edit Customer"
                                                                >
                                                                    <Pencil className="h-4 w-4" />
                                                                </Button>
                                                            )}

                                                            {/* Delete */}
                                                            {can('delete customers') && (
                                                                <Button
                                                                    variant="destructive"
                                                                    size="icon"
                                                                    onClick={() =>
                                                                        openDeleteModal(
                                                                            customer,
                                                                        )
                                                                    }
                                                                    title="Delete Customer"
                                                                >
                                                                    <Trash2 className="h-4 w-4" />
                                                                </Button>
                                                            )}
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

            {/* =========================================
                ADD CUSTOMER MODAL
            ========================================= */}

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

                        {/* Full Name */}
                        <div>
                            <label className="mb-2 block text-sm font-medium">
                                Full Name
                            </label>

                            <Input
                                value={name}
                                onChange={(
                                    event,
                                ) =>
                                    setName(
                                        event.target
                                            .value,
                                    )
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
                                onChange={(
                                    event,
                                ) =>
                                    setPhone(
                                        event.target
                                            .value,
                                    )
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
                                onChange={(
                                    event,
                                ) =>
                                    setEmail(
                                        event.target
                                            .value,
                                    )
                                }
                                placeholder="Enter email address (optional)"
                            />
                        </div>

                        {/* Membership */}
                        <div className="flex items-center gap-3">
                            <StatusToggle
                                checked={isMember}
                                onCheckedChange={() =>
                                    setIsMember(
                                        !isMember,
                                    )
                                }
                                onLabel="Member"
                                offLabel="Not a Member"
                                ariaLabel="Toggle customer membership"
                            />

                            <label className="text-sm font-medium">
                                {isMember
                                    ? 'Member'
                                    : 'Not a Member'}
                            </label>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            variant="destructive"
                            onClick={() =>
                                setIsAddOpen(false)
                            }
                        >
                            Cancel
                        </Button>

                        <Button
                            onClick={handleAdd}
                        >
                            Add Customer
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* =========================================
                VIEW CUSTOMER MODAL
            ========================================= */}

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

                            <div className="rounded-lg border bg-muted/30 p-4">
                                <p className="text-sm text-muted-foreground">
                                    Customer Code
                                </p>

                                <p className="mt-1 text-lg font-bold">
                                    {
                                        selectedCustomer.customer_code
                                    }
                                </p>
                            </div>

                            <div>
                                <p className="text-sm text-muted-foreground">
                                    Full Name
                                </p>

                                <p className="font-medium">
                                    {
                                        selectedCustomer.name
                                    }
                                </p>
                            </div>

                            <div>
                                <p className="text-sm text-muted-foreground">
                                    Phone Number
                                </p>

                                <p className="font-medium">
                                    {
                                        selectedCustomer.phone
                                    }
                                </p>
                            </div>

                            <div>
                                <p className="text-sm text-muted-foreground">
                                    Email
                                </p>

                                <p className="font-medium">
                                    {selectedCustomer.email ||
                                        'Not provided'}
                                </p>
                            </div>

                            <div>
                                <p className="text-sm text-muted-foreground">
                                    Membership
                                </p>

                                <div className="mt-1">
                                    <Badge
                                        className={
                                            selectedCustomer.is_member
                                                ? 'bg-black text-white hover:bg-black'
                                                : 'bg-red-500 text-white hover:bg-red-500'
                                        }
                                    >
                                        {selectedCustomer.is_member
                                            ? 'Member'
                                            : 'Not a Member'}
                                    </Badge>
                                </div>
                            </div>

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
                            variant="destructive"
                            onClick={() =>
                                setIsViewOpen(false)
                            }
                        >
                            Close
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* =========================================
                EDIT CUSTOMER MODAL
            ========================================= */}

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

                        {/* Customer Code */}
                        <div>
                            <label className="mb-2 block text-sm font-medium">
                                Customer Code
                            </label>

                            <Input
                                value={
                                    selectedCustomer?.customer_code ||
                                    ''
                                }
                                disabled
                            />

                            <p className="mt-1 text-xs text-muted-foreground">
                                Customer codes are generated automatically and cannot be changed.
                            </p>
                        </div>

                        {/* Full Name */}
                        <div>
                            <label className="mb-2 block text-sm font-medium">
                                Full Name
                            </label>

                            <Input
                                value={name}
                                onChange={(
                                    event,
                                ) =>
                                    setName(
                                        event.target
                                            .value,
                                    )
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
                                onChange={(
                                    event,
                                ) =>
                                    setPhone(
                                        event.target
                                            .value,
                                    )
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
                                onChange={(
                                    event,
                                ) =>
                                    setEmail(
                                        event.target
                                            .value,
                                    )
                                }
                            />
                        </div>

                        {/* Membership Toggle */}
                        <div className="flex items-center gap-3">
                            <StatusToggle
                                checked={isMember}
                                onCheckedChange={() =>
                                    setIsMember(
                                        !isMember,
                                    )
                                }
                                onLabel="Member"
                                offLabel="Not a Member"
                                ariaLabel="Toggle customer membership"
                            />

                            <label className="text-sm font-medium">
                                {isMember
                                    ? 'Member'
                                    : 'Not a Member'}
                            </label>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            variant="destructive"
                            onClick={() =>
                                setIsEditOpen(false)
                            }
                        >
                            Cancel
                        </Button>

                        <Button
                            onClick={handleUpdate}
                        >
                            Update Customer
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* =========================================
                DELETE CUSTOMER MODAL
            ========================================= */}

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
                                {
                                    selectedCustomer?.name
                                }
                            </strong>{' '}
                            (
                            {
                                selectedCustomer?.customer_code
                            }
                            )? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>

                    <DialogFooter>
                        <Button
                            variant="destructive"
                            onClick={() =>
                                setIsDeleteOpen(
                                    false,
                                )
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

