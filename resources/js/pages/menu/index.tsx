
import { Link, router } from '@inertiajs/react';
import { useState } from 'react';

type Category = {
    id: number;
    name: string;
    description: string | null;
};

type MenuItem = {
    id: number;
    category_id: number;
    name: string;
    description: string | null;
    price: string;
    image: string | null;
    preparation_time: number | null;
};

type CartItem = MenuItem & {
    quantity: number;
};

type RestaurantTable = {
    id: number;
    table_number: number;
    qr_code: string;
    status: string;
};

type Props = {
    categories: Category[];
    menuItems: MenuItem[];
    selectedCategory: number | null;
    table: RestaurantTable | null;
};

export default function MenuIndex({
    categories,
    menuItems,
    selectedCategory,
    table,
}: Props) {
    const [cart, setCart] = useState<CartItem[]>([]);
   

const [successMessage, setSuccessMessage] = useState<string | null>(
    null
);

const [isPlacingOrder, setIsPlacingOrder] = useState(false);

    // Add item to cart
    const addToCart = (item: MenuItem) => {
        setCart((currentCart) => {
            const existingItem = currentCart.find(
                (cartItem) => cartItem.id === item.id
            );

            if (existingItem) {
                return currentCart.map((cartItem) =>
                    cartItem.id === item.id
                        ? {
                              ...cartItem,
                              quantity: cartItem.quantity + 1,
                          }
                        : cartItem
                );
            }

            return [
                ...currentCart,
                {
                    ...item,
                    quantity: 1,
                },
            ];
        });
    };

    // Increase quantity
    const increaseQuantity = (itemId: number) => {
        setCart((currentCart) =>
            currentCart.map((item) =>
                item.id === itemId
                    ? {
                          ...item,
                          quantity: item.quantity + 1,
                      }
                    : item
            )
        );
    };

    // Decrease quantity
    const decreaseQuantity = (itemId: number) => {
        setCart((currentCart) =>
            currentCart
                .map((item) =>
                    item.id === itemId
                        ? {
                              ...item,
                              quantity: item.quantity - 1,
                          }
                        : item
                )
                .filter((item) => item.quantity > 0)
        );
    };

    // Remove item
    const removeFromCart = (itemId: number) => {
        setCart((currentCart) =>
            currentCart.filter((item) => item.id !== itemId)
        );
    };

    // Calculate total
    const cartTotal = cart.reduce(
        (total, item) =>
            total + Number(item.price) * item.quantity,
        0
    );

    // Calculate total quantity
    const cartQuantity = cart.reduce(
        (total, item) => total + item.quantity,
        0
    );

    // Place order
    const placeOrder = () => {
    if (!table) {
        alert(
            'Please scan a table QR code before placing an order.'
        );
        return;
    }

    if (cart.length === 0) {
        alert(
            'Please add at least one item to your order.'
        );
        return;
    }

    setIsPlacingOrder(true);

    router.post(
        '/orders',
        {
            table_id: table.id,
            items: cart.map((item) => ({
                id: item.id,
                quantity: item.quantity,
            })),
        },
        {
            onSuccess: () => {
                setCart([]);

                setSuccessMessage(
                    'Your order has been placed successfully!'
                );

                setIsPlacingOrder(false);

                window.scrollTo({
                    top: 0,
                    behavior: 'smooth',
                });

                setTimeout(() => {
                    setSuccessMessage(null);
                }, 5000);
            },

            onError: (errors) => {
                console.error(errors);

                setIsPlacingOrder(false);

                alert(
                    'There was a problem placing your order.'
                );
            },
        }
    );
};
    return (
        <div className="min-h-screen bg-stone-50 text-gray-900">
            {successMessage && (
    <div className="fixed left-1/2 top-6 z-[100] w-[90%] max-w-md -translate-x-1/2">
        <div className="flex items-center gap-4 rounded-2xl border border-green-200 bg-white p-4 shadow-2xl">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-green-100 text-xl text-green-600">
                ✓
            </div>

            <div className="flex-1">
                <p className="font-bold text-gray-900">
                    Order Confirmed
                </p>

                <p className="mt-1 text-sm text-gray-500">
                    {successMessage}
                </p>
            </div>

            <button
                type="button"
                onClick={() => setSuccessMessage(null)}
                className="text-xl text-gray-400 transition hover:text-gray-700"
            >
                ×
            </button>
        </div>
    </div>
)}
            {/* ================= HEADER ================= */}
            <header className="sticky top-0 z-50 border-b border-stone-200 bg-white/95 backdrop-blur">
                <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 lg:px-8">
                    {/* Restaurant Logo */}
                    <div>
                        <h1 className="text-2xl font-black tracking-tight">
                            DINE<span className="text-orange-500">.</span>
                        </h1>

                        <p className="text-xs font-medium uppercase tracking-widest text-gray-500">
                            Digital Menu
                        </p>
                    </div>

                    {/* Table Information */}
                    {table && (
                        <div className="flex items-center gap-3 rounded-full bg-orange-50 px-4 py-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-500 text-sm font-bold text-white">
                                {table.table_number}
                            </div>

                            <div className="hidden sm:block">
                                <p className="text-xs text-gray-500">
                                    Your table
                                </p>

                                <p className="text-sm font-bold">
                                    Table {table.table_number}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Cart Counter */}
                    {cartQuantity > 0 && (
                        <a
                            href="#your-order"
                            className="relative flex items-center gap-2 rounded-full bg-gray-900 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-orange-500"
                        >
                            <span>🛒</span>

                            <span className="hidden sm:inline">
                                Your Order
                            </span>

                            <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-orange-500 px-1 text-xs">
                                {cartQuantity}
                            </span>
                        </a>
                    )}
                </div>
            </header>

            {/* ================= HERO ================= */}
            <section className="relative overflow-hidden bg-gray-900">
                <div className="mx-auto max-w-7xl px-5 py-16 lg:px-8 lg:py-24">
                    <div className="max-w-2xl">
                        <p className="mb-4 font-semibold uppercase tracking-widest text-orange-400">
                            Welcome to our restaurant
                        </p>

                        <h2 className="text-4xl font-black leading-tight text-white sm:text-5xl lg:text-6xl">
                            Delicious food,
                            <br />
                            made for you.
                        </h2>

                        <p className="mt-6 max-w-xl text-lg leading-relaxed text-gray-300">
                            Explore our menu, choose your favorite dishes,
                            and place your order directly from your table.
                        </p>

                        {table && (
                            <div className="mt-8 inline-flex items-center gap-3 rounded-full border border-white/20 bg-white/10 px-5 py-3 text-white backdrop-blur">
                                <span className="text-xl">🍽️</span>

                                <span>
                                    You are ordering from{' '}
                                    <strong>
                                        Table {table.table_number}
                                    </strong>
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Decorative Circle */}
                <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-orange-500/20 blur-3xl" />
            </section>

            {/* ================= MAIN CONTENT ================= */}
            <main className="mx-auto max-w-7xl px-5 py-12 lg:px-8">
                {/* Category Navigation */}
                <section className="mb-12">
                    <div className="mb-5">
                        <h2 className="text-2xl font-black">
                            Explore Our Menu
                        </h2>

                        <p className="mt-1 text-gray-500">
                            Choose a category to discover delicious dishes.
                        </p>
                    </div>

                    <div className="flex gap-3 overflow-x-auto pb-3">
                        <Link
                            href="/menu"
                            className={`whitespace-nowrap rounded-full px-6 py-3 text-sm font-bold transition ${
                                selectedCategory === null
                                    ? 'bg-gray-900 text-white shadow-lg'
                                    : 'border border-gray-200 bg-white text-gray-700 hover:border-orange-400 hover:text-orange-500'
                            }`}
                        >
                            All Items
                        </Link>

                        {categories.map((category) => (
                            <Link
                                key={category.id}
                                href={`/menu?category=${category.id}`}
                                className={`whitespace-nowrap rounded-full px-6 py-3 text-sm font-bold transition ${
                                    selectedCategory === category.id
                                        ? 'bg-gray-900 text-white shadow-lg'
                                        : 'border border-gray-200 bg-white text-gray-700 hover:border-orange-400 hover:text-orange-500'
                                }`}
                            >
                                {category.name}
                            </Link>
                        ))}
                    </div>
                </section>

                {/* ================= MENU ITEMS ================= */}
                {menuItems.length > 0 ? (
                    <section>
                        <div className="grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
                            {menuItems.map((item) => (
                                <article
                                    key={item.id}
                                    className="group overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl"
                                >
                                    {/* Food Image */}
                                    <div className="relative overflow-hidden">
                                        {item.image ? (
                                            <img
                                                src={`/storage/${item.image}`}
                                                alt={item.name}
                                                className="h-60 w-full object-cover transition duration-500 group-hover:scale-105"
                                            />
                                        ) : (
                                            <div className="flex h-60 items-center justify-center bg-stone-100">
                                                <div className="text-center">
                                                    <span className="text-5xl">
                                                        🍽️
                                                    </span>

                                                    <p className="mt-2 text-sm text-gray-400">
                                                        No image available
                                                    </p>
                                                </div>
                                            </div>
                                        )}

                                        {/* Preparation Time */}
                                        {item.preparation_time && (
                                            <div className="absolute right-4 top-4 rounded-full bg-white/95 px-3 py-1.5 text-xs font-bold shadow">
                                                ⏱ {item.preparation_time} min
                                            </div>
                                        )}
                                    </div>

                                    {/* Food Details */}
                                    <div className="p-6">
                                        <div className="flex items-start justify-between gap-4">
                                            <h3 className="text-xl font-black">
                                                {item.name}
                                            </h3>

                                            <span className="whitespace-nowrap text-lg font-black text-orange-500">
                                                {Number(
                                                    item.price
                                                ).toFixed(2)}{' '}
                                                ETB
                                            </span>
                                        </div>

                                        {item.description && (
                                            <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-gray-500">
                                                {item.description}
                                            </p>
                                        )}

                                        <button
                                            type="button"
                                            onClick={() =>
                                                addToCart(item)
                                            }
                                            className="mt-6 w-full rounded-xl bg-gray-900 px-5 py-3.5 font-bold text-white transition hover:bg-orange-500 active:scale-[0.98]"
                                        >
                                            + Add to Order
                                        </button>
                                    </div>
                                </article>
                            ))}
                        </div>
                    </section>
                ) : (
                    <div className="rounded-2xl border border-gray-100 bg-white p-16 text-center shadow-sm">
                        <div className="text-6xl">🍽️</div>

                        <h2 className="mt-5 text-2xl font-black">
                            No menu items available
                        </h2>

                        <p className="mt-2 text-gray-500">
                            Please check back later.
                        </p>
                    </div>
                )}

                {/* ================= ORDER / CART ================= */}
                {cart.length > 0 && (
                    <section
                        id="your-order"
                        className="mt-20 scroll-mt-24"
                    >
                        <div className="mb-6">
                            <p className="font-semibold uppercase tracking-widest text-orange-500">
                                Almost there
                            </p>

                            <h2 className="mt-1 text-3xl font-black">
                                Your Order
                            </h2>

                            {table && (
                                <p className="mt-2 text-gray-500">
                                    Ordering for Table{' '}
                                    <strong>
                                        {table.table_number}
                                    </strong>
                                </p>
                            )}
                        </div>

                        <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
                            {/* Cart Items */}
                            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                                <div className="space-y-6">
                                    {cart.map((item) => (
                                        <div
                                            key={item.id}
                                            className="flex gap-4 border-b border-gray-100 pb-6 last:border-0 last:pb-0"
                                        >
                                            {/* Thumbnail */}
                                            <div className="h-24 w-24 flex-shrink-0 overflow-hidden rounded-xl bg-stone-100">
                                                {item.image ? (
                                                    <img
                                                        src={`/storage/${item.image}`}
                                                        alt={item.name}
                                                        className="h-full w-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="flex h-full items-center justify-center text-3xl">
                                                        🍽️
                                                    </div>
                                                )}
                                            </div>

                                            {/* Details */}
                                            <div className="min-w-0 flex-1">
                                                <h3 className="font-bold">
                                                    {item.name}
                                                </h3>

                                                <p className="mt-1 text-sm text-gray-500">
                                                    {Number(
                                                        item.price
                                                    ).toFixed(2)}{' '}
                                                    ETB each
                                                </p>

                                                {/* Quantity Controls */}
                                                <div className="mt-3 flex items-center gap-3">
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            decreaseQuantity(
                                                                item.id
                                                            )
                                                        }
                                                        className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 font-bold transition hover:bg-gray-100"
                                                    >
                                                        −
                                                    </button>

                                                    <span className="w-6 text-center font-bold">
                                                        {item.quantity}
                                                    </span>

                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            increaseQuantity(
                                                                item.id
                                                            )
                                                        }
                                                        className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-900 font-bold text-white transition hover:bg-orange-500"
                                                    >
                                                        +
                                                    </button>

                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            removeFromCart(
                                                                item.id
                                                            )
                                                        }
                                                        className="ml-2 text-sm font-semibold text-red-500 transition hover:text-red-700"
                                                    >
                                                        Remove
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Item Total */}
                                            <div className="text-right font-black">
                                                {(
                                                    Number(item.price) *
                                                    item.quantity
                                                ).toFixed(2)}{' '}
                                                ETB
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Order Summary */}
                            <div className="h-fit rounded-2xl bg-gray-900 p-7 text-white shadow-xl lg:sticky lg:top-24">
                                <h3 className="text-xl font-black">
                                    Order Summary
                                </h3>

                                <div className="mt-6 space-y-4 border-b border-white/10 pb-6">
                                    <div className="flex justify-between text-gray-300">
                                        <span>
                                            Items ({cartQuantity})
                                        </span>

                                        <span>
                                            {cartTotal.toFixed(2)} ETB
                                        </span>
                                    </div>

                                    <div className="flex justify-between text-gray-300">
                                        <span>Table</span>

                                        <span>
                                            {table
                                                ? `Table ${table.table_number}`
                                                : 'Not selected'}
                                        </span>
                                    </div>
                                </div>

                                <div className="mt-6 flex items-center justify-between">
                                    <span className="text-lg font-bold">
                                        Total
                                    </span>

                                    <span className="text-2xl font-black text-orange-400">
                                        {cartTotal.toFixed(2)} ETB
                                    </span>
                                </div>

                                <button
    type="button"
    onClick={placeOrder}
    disabled={isPlacingOrder}
    className="mt-7 w-full rounded-xl bg-orange-500 px-5 py-4 font-black text-white transition hover:bg-orange-400 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
>
    {isPlacingOrder ? (
        <span className="flex items-center justify-center gap-2">
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
            Placing Order...
        </span>
    ) : (
        'Place Order →'
    )}
</button>

                                <p className="mt-4 text-center text-xs text-gray-400">
                                    Your order will be sent directly to
                                    the restaurant.
                                </p>
                            </div>
                        </div>
                    </section>
                )}
            </main>

            {/* ================= FOOTER ================= */}
            <footer className="mt-20 border-t border-gray-200 bg-white">
                <div className="mx-auto max-w-7xl px-5 py-8 text-center lg:px-8">
                    <p className="font-black">
                        DINE<span className="text-orange-500">.</span>
                    </p>

                    <p className="mt-2 text-sm text-gray-500">
                        Thank you for dining with us.
                    </p>
                </div>
            </footer>
        </div>
    );
}

