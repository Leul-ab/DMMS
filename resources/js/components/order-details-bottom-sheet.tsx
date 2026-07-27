import { useEffect, useState } from 'react';
import { router } from '@inertiajs/react';

type MenuItem = {
    id: number;
    name: string;
    image: string | null;
};

type OrderItem = {
    id: number;
    quantity: number;
    price: string;
    status: string;
    notes: string | null;
    menu_item: MenuItem;
};

type OrderDetail = {
    id: number;
    order_number: string;
    status: string;
    payment_status: string;
    total_amount: string;
    estimated_minutes: number | null;
    created_at: string;
    notes: string | null;
    table: {
        id: number;
        table_number: number;
    } | null;
    order_items: OrderItem[];
};

type Props = {
    orderId: number | null;
    tableNumber: number;
    isOpen: boolean;
    onClose: () => void;
};

export default function OrderDetailsBottomSheet({
    orderId,
    tableNumber,
    isOpen,
    onClose,
}: Props) {
    const [order, setOrder] = useState<OrderDetail | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [touchStart, setTouchStart] = useState<number>(0);
    const [touchEnd, setTouchEnd] = useState<number>(0);

    // Fetch order details when orderId changes
    useEffect(() => {
        if (!orderId || !isOpen) {
            setOrder(null);
            return;
        }

        setLoading(true);
        setError(null);

        fetch(`/api/orders/${orderId}`)
            .then((res) => {
                if (!res.ok) {
                    throw new Error('Failed to fetch order details');
                }
                return res.json();
            })
            .then((data: OrderDetail) => {
                setOrder(data);
                setLoading(false);
            })
            .catch((err) => {
                setError(err.message);
                setLoading(false);
            });
    }, [orderId, isOpen]);

    // Format date/time
    const formatDateTime = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    // Get status color
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending':
                return 'bg-yellow-500';
            case 'received':
                return 'bg-blue-500';
            case 'preparing':
                return 'bg-purple-500';
            case 'served':
                return 'bg-teal-500';
            case 'completed':
                return 'bg-green-500';
            case 'cancelled':
                return 'bg-red-500';
            default:
                return 'bg-gray-500';
        }
    };

    // Determine if order can be modified
    const isOrderModifiable = (status: string) => {
        return !['served', 'completed', 'cancelled'].includes(status);
    };

    // Handle overlay click (click outside to close)
    const handleOverlayClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    // Handle escape key
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };

        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [isOpen, onClose]);

    // Prevent body scroll when sheet is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    // Handle "Add to Order" button click
    const handleAddToOrder = () => {
        onClose();
        router.visit(`/menu?table=${tableNumber}&add_to_order=${orderId}`);
    };

    // Swipe down to close handlers
    const handleTouchStart = (e: React.TouchEvent) => {
        setTouchStart(e.touches[0].clientY);
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        setTouchEnd(e.touches[0].clientY);
    };

    const handleTouchEnd = () => {
        if (touchStart - touchEnd > 80) {
            // Swipe up - do nothing
            return;
        }
        if (touchEnd - touchStart > 100) {
            // Swipe down - close
            onClose();
        }
        setTouchStart(0);
        setTouchEnd(0);
    };

    if (!isOpen) return null;

    return (
        <>
            {/* Overlay */}
            <div
                className="fixed inset-0 z-[60] bg-black/50 transition-opacity duration-300"
                onClick={handleOverlayClick}
            />

            {/* Bottom Sheet */}
            <div
                className="fixed bottom-0 left-0 right-0 z-[70] transform transition-transform duration-300 ease-out translate-y-0"
                style={{
                    maxHeight: '85vh',
                    overflowY: 'auto',
                }}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
            >
                <div className="mx-auto w-full max-w-2xl rounded-t-3xl bg-white shadow-2xl">
                    {/* Drag Handle */}
                    <div className="flex justify-center pt-3 pb-1">
                        <div className="h-1.5 w-12 rounded-full bg-gray-300" />
                    </div>

                    {/* Loading State */}
                    {loading && (
                        <div className="flex items-center justify-center py-20">
                            <div className="h-8 w-8 animate-spin rounded-full border-4 border-orange-500 border-t-transparent" />
                            <span className="ml-3 text-gray-500">Loading order details...</span>
                        </div>
                    )}

                    {/* Error State */}
                    {error && (
                        <div className="px-6 py-20 text-center">
                            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-3xl">
                                ⚠️
                            </div>
                            <p className="mt-4 font-bold text-red-600">Failed to load order</p>
                            <p className="mt-1 text-sm text-gray-500">{error}</p>
                            <button
                                type="button"
                                onClick={onClose}
                                className="mt-6 rounded-xl bg-gray-900 px-6 py-3 font-bold text-white transition hover:bg-orange-500"
                            >
                                Close
                            </button>
                        </div>
                    )}

                    {/* Order Content */}
                    {!loading && !error && order && (
                        <>
                            {/* Header */}
                            <div className="flex items-center justify-between border-b border-gray-100 px-6 pb-4 pt-2">
                                <div>
                                    <h2 className="text-xl font-black text-gray-900">
                                        Order {order.order_number}
                                    </h2>
                                    <p className="mt-1 text-xs text-gray-400">
                                        Order ID: #{order.id}
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-lg font-bold text-gray-500 transition hover:bg-gray-200 hover:text-gray-700"
                                >
                                    ✕
                                </button>
                            </div>

                            {/* Order Information */}
                            <div className="border-b border-gray-100 px-6 py-5">
                                <div className="flex flex-wrap items-center gap-4">
                                    {order.table && (
                                        <div className="flex items-center gap-2 rounded-full bg-orange-50 px-4 py-2">
                                            <span className="text-lg">🍽️</span>
                                            <span className="text-sm font-bold text-gray-700">
                                                Table {order.table.table_number}
                                            </span>
                                        </div>
                                    )}

                                    <div className="flex items-center gap-2 text-sm text-gray-500">
                                        <span>📅</span>
                                        <span>{formatDateTime(order.created_at)}</span>
                                    </div>

                                    <span
                                        className={`ml-auto rounded-full ${getStatusColor(
                                            order.status
                                        )} px-4 py-1.5 text-xs font-bold capitalize text-white`}
                                    >
                                        {order.status}
                                    </span>
                                </div>
                            </div>

                            {/* Items */}
                            <div className="px-6 py-5">
                                <h3 className="mb-4 text-lg font-black text-gray-900">
                                    Ordered Items ({order.order_items.length})
                                </h3>

                                <div className="space-y-3">
                                    {order.order_items.map((item) => (
                                        <div
                                            key={item.id}
                                            className="rounded-2xl border border-gray-100 bg-stone-50 p-4"
                                        >
                                            <div className="flex items-center justify-between gap-4">
                                                <div className="flex items-center gap-4">
                                                    {/* Item Image */}
                                                    <div className="h-14 w-14 flex-shrink-0 overflow-hidden rounded-xl bg-stone-200">
                                                        {item.menu_item.image ? (
                                                            <img
                                                                src={`/storage/${item.menu_item.image}`}
                                                                alt={item.menu_item.name}
                                                                className="h-full w-full object-cover"
                                                            />
                                                        ) : (
                                                            <div className="flex h-full items-center justify-center text-2xl">
                                                                🍽️
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div>
                                                        <h4 className="font-bold text-gray-900">
                                                            {item.menu_item.name}
                                                        </h4>
                                                        <p className="mt-0.5 text-sm text-gray-500">
                                                            Qty: {item.quantity} × {Number(item.price).toFixed(2)} ETB
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="text-right">
                                                    <p className="font-bold text-gray-900">
                                                        {(Number(item.price) * item.quantity).toFixed(2)} ETB
                                                    </p>
                                                    <p className="text-xs text-gray-400">
                                                        Unit: {Number(item.price).toFixed(2)} ETB
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Item Notes */}
                                            {item.notes && (
                                                <div className="mt-3 rounded-xl bg-yellow-50 border border-yellow-100 px-3 py-2">
                                                    <p className="text-xs font-semibold text-yellow-700">Special Instructions:</p>
                                                    <p className="text-sm text-yellow-800 mt-0.5">{item.notes}</p>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Order Notes (Special Instructions for whole order) */}
                            {order.notes && (
                                <div className="border-t border-gray-100 px-6 py-4">
                                    <div className="rounded-xl bg-blue-50 border border-blue-100 px-4 py-3">
                                        <p className="text-xs font-semibold text-blue-700">Order Notes:</p>
                                        <p className="text-sm text-blue-800 mt-0.5">{order.notes}</p>
                                    </div>
                                </div>
                            )}

                            {/* Total */}
                            <div className="border-t border-gray-200 px-6 py-5">
                                <div className="flex items-center justify-between">
                                    <span className="text-lg font-bold text-gray-900">Total Amount</span>
                                    <span className="text-2xl font-black text-orange-500">
                                        {Number(order.total_amount).toFixed(2)} ETB
                                    </span>
                                </div>
                            </div>

                            {/* Add to Order / Disabled Message */}
                            <div className="border-t border-gray-100 px-6 py-5">
                                {isOrderModifiable(order.status) ? (
                                    <button
                                        type="button"
                                        onClick={handleAddToOrder}
                                        className="block w-full rounded-xl bg-orange-500 px-6 py-4 text-center font-black text-white transition hover:bg-orange-400 active:scale-[0.98] shadow-lg"
                                    >
                                        + Add to Order
                                    </button>
                                ) : (
                                    <div className="rounded-xl bg-gray-100 px-6 py-4 text-center">
                                        <p className="text-sm font-semibold text-gray-500">
                                            This order can no longer be modified.
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Bottom safe area padding */}
                            <div className="h-4" />
                        </>
                    )}
                </div>
            </div>
        </>
    );
}
