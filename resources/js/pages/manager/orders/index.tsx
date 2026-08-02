import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import Heading from '@/components/heading';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardHeader,
} from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Pencil,
    Trash2,
    Plus,
    Minus,
    CreditCard,
    Clock,
    Utensils,
    User,
    Phone,
    FileText,
    ClipboardList,
} from 'lucide-react';

type MenuItem = {
    id: number;
    name: string;
    price: string | number;
};

type OrderItem = {
    id: number;
    quantity: number;
    price: string;
    status: string;
    menu_item: MenuItem;
};

type RestaurantTable = {
    id: number;
    table_number: number;
};

type Order = {
    id: number;
    order_number: string;
    status: string;
    payment_status: string;
    payment_submitted_at: string | null;
    total_amount: string;
    estimated_minutes: number | null;
    customer_name: string | null;
    customer_phone: string | null;
    notes: string | null;
    special_instructions: string | null;
    created_at: string;
    table: RestaurantTable | null;
    order_items: OrderItem[];
};

type EditItem = {
    menu_item_id: number;
    quantity: number;
};

type Props = {
    orders: Order[];
    tables: RestaurantTable[];
    menuItems: MenuItem[];
};

const statusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    confirmed: 'bg-blue-100 text-blue-800',
    preparing: 'bg-purple-100 text-purple-800',
    ready: 'bg-green-100 text-green-800',
    served: 'bg-indigo-100 text-indigo-800',
    completed: 'bg-gray-100 text-gray-800',
    cancelled: 'bg-red-100 text-red-800',
};

const statusLabels: Record<string, string> = {
    pending: 'Pending',
    confirmed: 'Confirmed',
    preparing: 'Preparing',
    ready: 'Ready',
    served: 'Served',
    completed: 'Completed',
    cancelled: 'Cancelled',
};

const paymentColors: Record<string, string> = {
    unpaid: 'bg-yellow-100 text-yellow-800',
    pending: 'bg-orange-100 text-orange-800',
    paid: 'bg-green-100 text-green-800',
};

const paymentLabels: Record<string, string> = {
    unpaid: 'Unpaid',
    pending: 'Payment Pending',
    paid: 'Paid',
};

export default function OrdersIndex({
    orders,
    tables,
    menuItems,
}: Props) {
    const [editingOrder, setEditingOrder] =
        useState<Order | null>(null);

    const [deletingOrder, setDeletingOrder] =
        useState<Order | null>(null);

    const [editTableId, setEditTableId] =
        useState<number | ''>('');

    const [editCustomerName, setEditCustomerName] =
        useState('');

    const [editCustomerPhone, setEditCustomerPhone] =
        useState('');

    const [editEstimatedMinutes, setEditEstimatedMinutes] =
        useState<number | ''>('');

    const [editNotes, setEditNotes] =
        useState('');

    const [editItems, setEditItems] =
        useState<EditItem[]>([]);

    const [processing, setProcessing] =
        useState(false);

    /*
     * Open edit modal.
     */
    const openEditModal = (order: Order) => {
        setEditingOrder(order);

        setEditTableId(
            order.table?.id ?? ''
        );

        setEditCustomerName(
            order.customer_name ?? ''
        );

        setEditCustomerPhone(
            order.customer_phone ?? ''
        );

        setEditEstimatedMinutes(
            order.estimated_minutes ?? ''
        );

        setEditNotes(
            order.notes ?? ''
        );

        setEditItems(
            order.order_items.map((item) => ({
                menu_item_id: item.menu_item.id,
                quantity: item.quantity,
            }))
        );
    };

    /*
     * Close edit modal.
     */
    const closeEditModal = () => {
        setEditingOrder(null);
        setEditItems([]);
    };

    /*
     * Add a new menu item to the order.
     */
    const addItem = () => {
        if (menuItems.length === 0) {
            return;
        }

        setEditItems([
            ...editItems,
            {
                menu_item_id: menuItems[0].id,
                quantity: 1,
            },
        ]);
    };

    /*
     * Remove menu item from order.
     */
    const removeItem = (index: number) => {
        setEditItems(
            editItems.filter(
                (_, itemIndex) =>
                    itemIndex !== index
            )
        );
    };

    /*
     * Change menu item.
     */
    const changeItem = (
        index: number,
        menuItemId: number
    ) => {
        const updatedItems = [...editItems];

        updatedItems[index] = {
            ...updatedItems[index],
            menu_item_id: menuItemId,
        };

        setEditItems(updatedItems);
    };

    /*
     * Change item quantity.
     */
    const changeQuantity = (
        index: number,
        quantity: number
    ) => {
        const updatedItems = [...editItems];

        updatedItems[index] = {
            ...updatedItems[index],
            quantity: Math.max(1, quantity),
        };

        setEditItems(updatedItems);
    };

    /*
     * Update order.
     */
    const updateOrder = () => {
        if (!editingOrder) {
            return;
        }

        if (!editTableId) {
            alert('Please select a table.');
            return;
        }

        if (editItems.length === 0) {
            alert(
                'Please add at least one menu item.'
            );
            return;
        }

        setProcessing(true);

        router.put(
            `/manager/orders/${editingOrder.id}`,
            {
                table_id: editTableId,
                customer_name:
                    editCustomerName || null,
                customer_phone:
                    editCustomerPhone || null,
                estimated_minutes:
                    editEstimatedMinutes || null,
                notes: editNotes || null,
                items: editItems,
            },
            {
                preserveScroll: true,
                onFinish: () => {
                    setProcessing(false);
                },
                onSuccess: () => {
                    closeEditModal();
                },
            }
        );
    };

    /*
     * Delete order.
     */
    const deleteOrder = () => {
        if (!deletingOrder) {
            return;
        }

        setProcessing(true);

        router.delete(
            `/manager/orders/${deletingOrder.id}`,
            {
                preserveScroll: true,
                onFinish: () => {
                    setProcessing(false);
                },
                onSuccess: () => {
                    setDeletingOrder(null);
                },
            }
        );
    };

    /*
     * Verify payment.
     */
    const verifyPayment = (
        orderId: number
    ) => {
        router.patch(
            `/manager/orders/${orderId}/verify-payment`,
            {},
            {
                preserveScroll: true,
            }
        );
    };

    return (
        <>
            <Head title="Customer Orders" />

            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl p-4">
                <Heading
                    title="Customer Orders"
                    description="Manage customer orders, edit order details, and verify payments."
                    icon={ClipboardList}
                />

                {orders.length === 0 ? (
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center py-16">
                            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted text-4xl">
                                🍽️
                            </div>

                            <h3 className="mt-5 text-lg font-semibold">
                                No Orders Yet
                            </h3>

                            <p className="mt-1 text-sm text-muted-foreground">
                                Customer orders will appear here once placed.
                            </p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                        {orders.map((order) => (
                            <Card
                                key={order.id}
                                className="overflow-hidden"
                            >
                                {/* Card Header */}
                                <CardHeader className="border-b bg-muted/30">
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <h3 className="text-lg font-bold">
                                                {order.order_number}
                                            </h3>

                                            <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                                                <Utensils className="size-4" />

                                                Table{' '}
                                                {order.table?.table_number ??
                                                    'Unknown'}
                                            </p>
                                        </div>

                                        <Badge
                                            className={`capitalize ${
                                                statusColors[
                                                    order.status
                                                ] ?? ''
                                            }`}
                                        >
                                            {statusLabels[
                                                order.status
                                            ] ?? order.status}
                                        </Badge>
                                    </div>

                                    <div className="mt-3 flex flex-wrap gap-2">
                                        <Badge
                                            className={`capitalize ${
                                                paymentColors[
                                                    order.payment_status
                                                ] ?? ''
                                            }`}
                                        >
                                            {
                                                paymentLabels[
                                                    order.payment_status
                                                ] ??
                                                    order.payment_status
                                            }
                                        </Badge>

                                        {order.estimated_minutes !==
                                            null && (
                                            <Badge
                                                variant="outline"
                                            >
                                                <Clock className="mr-1 size-3" />

                                                {
                                                    order.estimated_minutes
                                                }{' '}
                                                min
                                            </Badge>
                                        )}
                                    </div>
                                </CardHeader>

                                <CardContent className="space-y-5 p-5">
                                    {/* Customer */}
                                    {(order.customer_name ||
                                        order.customer_phone) && (
                                        <div className="rounded-lg bg-muted/50 p-3">
                                            <h4 className="mb-2 text-sm font-semibold">
                                                Customer
                                            </h4>

                                            {order.customer_name && (
                                                <p className="flex items-center gap-2 text-sm">
                                                    <User className="size-4 text-muted-foreground" />

                                                    {
                                                        order.customer_name
                                                    }
                                                </p>
                                            )}

                                            {order.customer_phone && (
                                                <p className="mt-1 flex items-center gap-2 text-sm">
                                                    <Phone className="size-4 text-muted-foreground" />

                                                    {
                                                        order.customer_phone
                                                    }
                                                </p>
                                            )}
                                        </div>
                                    )}

                                    {/* Order Items */}
                                    <div>
                                        <h4 className="mb-3 text-sm font-semibold">
                                            Order Items
                                        </h4>

                                        <div className="space-y-2">
                                            {order.order_items.map(
                                                (item) => (
                                                    <div
                                                        key={item.id}
                                                        className="flex items-center justify-between rounded-lg border p-3"
                                                    >
                                                        <div>
                                                            <p className="text-sm font-medium">
                                                                {
                                                                    item
                                                                        .menu_item
                                                                        .name
                                                                }
                                                            </p>

                                                            <p className="text-xs text-muted-foreground">
                                                                {
                                                                    item.quantity
                                                                }{' '}
                                                                ×{' '}
                                                                {Number(
                                                                    item.price
                                                                ).toFixed(
                                                                    2
                                                                )}{' '}
                                                                ETB
                                                            </p>
                                                        </div>

                                                        <span className="text-sm font-semibold">
                                                            {(
                                                                Number(
                                                                    item.price
                                                                ) *
                                                                item.quantity
                                                            ).toFixed(
                                                                2
                                                            )}{' '}
                                                            ETB
                                                        </span>
                                                    </div>
                                                )
                                            )}
                                        </div>
                                    </div>

                                    {/* Special Instructions */}
                                    {order.special_instructions && (
                                        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                                            <div className="flex gap-2">
                                                <FileText className="size-4 text-amber-700" />

                                                <div>
                                                    <p className="text-sm font-semibold text-amber-900">
                                                        Additional Instructions
                                                    </p>

                                                    <p className="mt-1 whitespace-pre-line text-sm text-amber-800">
                                                        {
                                                            order.special_instructions
                                                        }
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Notes */}
                                    {order.notes && (
                                        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3">
                                            <div className="flex gap-2">
                                                <FileText className="size-4 text-yellow-700" />

                                                <div>
                                                    <p className="text-sm font-semibold text-yellow-900">
                                                        Notes
                                                    </p>

                                                    <p className="mt-1 text-sm text-yellow-800">
                                                        {
                                                            order.notes
                                                        }
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Total */}
                                    <div className="flex items-center justify-between border-t pt-4">
                                        <span className="font-semibold">
                                            Total
                                        </span>

                                        <span className="text-xl font-bold">
                                            {Number(
                                                order.total_amount
                                            ).toFixed(2)}{' '}
                                            ETB
                                        </span>
                                    </div>

                                    {/* Payment Verification */}
                                    {order.payment_status ===
                                        'pending' && (
                                        <div className="rounded-lg border border-orange-200 bg-orange-50 p-4">
                                            <p className="text-sm font-semibold text-orange-900">
                                                Payment Submitted
                                            </p>

                                            <p className="mt-1 text-xs text-orange-800">
                                                The customer says they
                                                have paid. Verify the
                                                payment.
                                            </p>

                                            <Button
                                                className="mt-3 w-full"
                                                onClick={() =>
                                                    verifyPayment(
                                                        order.id
                                                    )
                                                }
                                            >
                                                <CreditCard className="mr-2 size-4" />

                                                Verify Payment
                                            </Button>
                                        </div>
                                    )}

                                    {order.payment_status ===
                                        'paid' && (
                                        <div className="rounded-lg border border-green-200 bg-green-50 p-3">
                                            <p className="text-sm font-semibold text-green-800">
                                                ✓ Payment Verified
                                            </p>
                                        </div>
                                    )}

                                    {/* Edit and Delete */}
                                    <div className="flex gap-2 border-t pt-4">
                                        <Button
                                            variant="outline"
                                            className="flex-1"
                                            onClick={() =>
                                                openEditModal(
                                                    order
                                                )
                                            }
                                        >
                                            <Pencil className="mr-2 size-4" />

                                            Edit
                                        </Button>

                                        <Button
                                            variant="destructive"
                                            className="flex-1"
                                            onClick={() =>
                                                setDeletingOrder(
                                                    order
                                                )
                                            }
                                        >
                                            <Trash2 className="mr-2 size-4" />

                                            Delete
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>

            {/* ========================= */}
            {/* EDIT ORDER MODAL */}
            {/* ========================= */}

            <Dialog
                open={!!editingOrder}
                onOpenChange={(open) => {
                    if (!open) {
                        closeEditModal();
                    }
                }}
            >
                <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>
                            Edit Order{' '}
                            {editingOrder?.order_number}
                        </DialogTitle>

                        <DialogDescription>
                            Update the customer information, table,
                            notes, and order items.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-5 py-4">
                        {/* Table */}
                        <div>
                            <label className="mb-2 block text-sm font-medium">
                                Table
                            </label>

                            <select
                                value={editTableId}
                                onChange={(e) =>
                                    setEditTableId(
                                        Number(
                                            e.target.value
                                        )
                                    )
                                }
                                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                            >
                                <option value="">
                                    Select Table
                                </option>

                                {tables.map((table) => (
                                    <option
                                        key={table.id}
                                        value={table.id}
                                    >
                                        Table{' '}
                                        {
                                            table.table_number
                                        }
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Customer Name */}
                        <div>
                            <label className="mb-2 block text-sm font-medium">
                                Customer Name
                            </label>

                            <input
                                type="text"
                                value={
                                    editCustomerName
                                }
                                onChange={(e) =>
                                    setEditCustomerName(
                                        e.target.value
                                    )
                                }
                                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                                placeholder="Customer name"
                            />
                        </div>

                        {/* Customer Phone */}
                        <div>
                            <label className="mb-2 block text-sm font-medium">
                                Customer Phone
                            </label>

                            <input
                                type="text"
                                value={
                                    editCustomerPhone
                                }
                                onChange={(e) =>
                                    setEditCustomerPhone(
                                        e.target.value
                                    )
                                }
                                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                                placeholder="Phone number"
                            />
                        </div>

                        {/* Estimated Time */}
                        <div>
                            <label className="mb-2 block text-sm font-medium">
                                Estimated Preparation Time
                            </label>

                            <input
                                type="number"
                                min="0"
                                value={
                                    editEstimatedMinutes
                                }
                                onChange={(e) =>
                                    setEditEstimatedMinutes(
                                        e.target.value
                                            ? Number(
                                                  e.target
                                                      .value
                                              )
                                            : ''
                                    )
                                }
                                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                                placeholder="Minutes"
                            />
                        </div>

                        {/* Order Items */}
                        <div>
                            <div className="mb-3 flex items-center justify-between">
                                <label className="text-sm font-medium">
                                    Order Items
                                </label>

                                <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    onClick={addItem}
                                >
                                    <Plus className="mr-1 size-4" />

                                    Add Item
                                </Button>
                            </div>

                            <div className="space-y-3">
                                {editItems.map(
                                    (item, index) => (
                                        <div
                                            key={index}
                                            className="flex gap-2"
                                        >
                                            <select
                                                value={
                                                    item.menu_item_id
                                                }
                                                onChange={(
                                                    e
                                                ) =>
                                                    changeItem(
                                                        index,
                                                        Number(
                                                            e
                                                                .target
                                                                .value
                                                        )
                                                    )
                                                }
                                                className="flex-1 rounded-md border bg-background px-3 py-2 text-sm"
                                            >
                                                {menuItems.map(
                                                    (
                                                        menuItem
                                                    ) => (
                                                        <option
                                                            key={
                                                                menuItem.id
                                                            }
                                                            value={
                                                                menuItem.id
                                                            }
                                                        >
                                                            {
                                                                menuItem.name
                                                            }{' '}
                                                            -{' '}
                                                            {Number(
                                                                menuItem.price
                                                            ).toFixed(
                                                                2
                                                            )}{' '}
                                                            ETB
                                                        </option>
                                                    )
                                                )}
                                            </select>

                                            <div className="flex items-center rounded-md border">
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() =>
                                                        changeQuantity(
                                                            index,
                                                            item.quantity -
                                                                1
                                                        )
                                                    }
                                                >
                                                    <Minus className="size-4" />
                                                </Button>

                                                <span className="w-8 text-center text-sm">
                                                    {
                                                        item.quantity
                                                    }
                                                </span>

                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() =>
                                                        changeQuantity(
                                                            index,
                                                            item.quantity +
                                                                1
                                                        )
                                                    }
                                                >
                                                    <Plus className="size-4" />
                                                </Button>
                                            </div>

                                            <Button
                                                type="button"
                                                variant="destructive"
                                                size="icon"
                                                onClick={() =>
                                                    removeItem(
                                                        index
                                                    )
                                                }
                                            >
                                                <Trash2 className="size-4" />
                                            </Button>
                                        </div>
                                    )
                                )}
                            </div>
                        </div>

                        {/* Notes */}
                        <div>
                            <label className="mb-2 block text-sm font-medium">
                                Order Notes
                            </label>

                            <textarea
                                value={editNotes}
                                onChange={(e) =>
                                    setEditNotes(
                                        e.target.value
                                    )
                                }
                                rows={3}
                                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                                placeholder="Special instructions..."
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={
                                closeEditModal
                            }
                            disabled={processing}
                        >
                            Cancel
                        </Button>

                        <Button
                            type="button"
                            onClick={updateOrder}
                            disabled={processing}
                        >
                            {processing
                                ? 'Saving...'
                                : 'Save Changes'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ========================= */}
            {/* DELETE CONFIRMATION */}
            {/* ========================= */}

            <Dialog
                open={!!deletingOrder}
                onOpenChange={(open) => {
                    if (!open) {
                        setDeletingOrder(null);
                    }
                }}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            Delete Order?
                        </DialogTitle>

                        <DialogDescription>
                            Are you sure you want to delete order{' '}
                            <strong>
                                {deletingOrder?.order_number}
                            </strong>
                            ? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() =>
                                setDeletingOrder(null)
                            }
                            disabled={processing}
                        >
                            Cancel
                        </Button>

                        <Button
                            variant="destructive"
                            onClick={deleteOrder}
                            disabled={processing}
                        >
                            {processing
                                ? 'Deleting...'
                                : 'Delete Order'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
