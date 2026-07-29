import { Link, router, useForm } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import MyBooking from '@/pages/booking/my-booking';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { CheckCircle2, Copy } from 'lucide-react';

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
    is_available: boolean;
    category: Category | null;
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
    availableTables: RestaurantTable[];
    booking_success?: boolean;
    customer_code?: string;
};

export default function MenuIndex({
    categories,
    menuItems,
    selectedCategory,
    table,
    availableTables,
    booking_success = false,
    customer_code = '',
}: Props) {
    const [cart, setCart] = useState<CartItem[]>([]);
   const [showMemberForm, setShowMemberForm] = useState(false);
   const [tableError, setTableError] = useState<string | null>(null);
const {
    data: memberData,
    setData: setMemberData,
    post: registerMember,
    processing: isRegistering,
    errors: memberErrors,
    reset: resetMemberForm,
} = useForm({
    name: '',
    phone: '',
    email: '',
});

    const [isPlacingOrder, setIsPlacingOrder] = useState(false);
    const [showMyBooking, setShowMyBooking] = useState(false);
    const [hasActiveBooking, setHasActiveBooking] = useState(false);
    const [showRegistrationSuccess, setShowRegistrationSuccess] = useState(false);
    const [registeredCustomerCode, setRegisteredCustomerCode] = useState('');
    const [copied, setCopied] = useState(false);
    const [showBookingSuccess, setShowBookingSuccess] = useState(false);
    const [bookingCodeCopied, setBookingCodeCopied] = useState(false);

    // Show booking success dialog when redirected from booking
    useEffect(() => {
        if (booking_success && customer_code) {
            setShowBookingSuccess(true);
        }
    }, [booking_success, customer_code]);

    // Check for active booking on mount
    useEffect(() => {
        const checkActiveBooking = async () => {
            try {
                const response = await fetch('/api/active-booking');
                const data = await response.json();
                setHasActiveBooking(!!data.booking);
            } catch {
                setHasActiveBooking(false);
            }
        };
        checkActiveBooking();
        const interval = setInterval(checkActiveBooking, 15000);
        return () => clearInterval(interval);
    }, []);

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

                toast.success('You successfully placed an order.');

                setIsPlacingOrder(false);

                window.scrollTo({
                    top: 0,
                    behavior: 'smooth',
                });
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

    const handleRegisterMember = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!memberData.name.trim() || !memberData.phone.trim()) {
            return;
        }

        try {
            const getXsrfToken = () => {
                const match = document.cookie.match(new RegExp('(^|;\\s*)(XSRF-TOKEN)=([^;]*)'));
                return match ? decodeURIComponent(match[3]) : '';
            };

            const response = await fetch('/customer/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-XSRF-TOKEN': getXsrfToken(),
                },
                body: JSON.stringify({
                    name: memberData.name,
                    phone: memberData.phone,
                    email: memberData.email || null,
                }),
            });

            if (response.status === 422) {
                const errorData = await response.json();
                const firstError = Object.values(errorData.errors)[0]?.[0] || 'Validation failed.';
                alert(firstError);
                return;
            }

            const data = await response.json();

            if (data.success) {
                setShowMemberForm(false);
                resetMemberForm();
                setRegisteredCustomerCode(data.customer_code);
                setShowRegistrationSuccess(true);
                setCopied(false);
            } else {
                alert(data.message || 'Registration failed. Please try again.');
            }
        } catch (e) {
            console.error(e);
            alert('Registration failed. Please try again.');
        }
    };

    const handleCopyCode = async () => {
        try {
            await navigator.clipboard.writeText(registeredCustomerCode);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = registeredCustomerCode;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleCopyBookingCode = async () => {
        try {
            await navigator.clipboard.writeText(customer_code);
            setBookingCodeCopied(true);
            toast.success('Customer code copied successfully.');
            setTimeout(() => setBookingCodeCopied(false), 2000);
        } catch {
            const textArea = document.createElement('textarea');
            textArea.value = customer_code;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            setBookingCodeCopied(true);
            toast.success('Customer code copied successfully.');
            setTimeout(() => setBookingCodeCopied(false), 2000);
        }
    };

    const handleMyOrderClick = () => {
        if (!table) {
            setTableError(
                'Please select a table before viewing your order.'
            );
            return;
        }

        setTableError(null);
        router.get(`/my-order?table=${table.table_number}`);
    };

    return (
    <div className="min-h-screen bg-stone-50 text-gray-900">

        {/* ================= BOOKING SUCCESS DIALOG ================= */}
        {showBookingSuccess && (
            <div className="fixed inset-0 z-[400] flex items-center justify-center bg-black/60 p-4">
                <div className="w-full max-w-md animate-[fadeIn_0.3s_ease-out] scale-100 transform rounded-3xl bg-white p-8 shadow-2xl text-center transition-all duration-300">
                    {/* Success Icon */}
                    <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
                        <span className="text-4xl font-black text-green-600">✓</span>
                    </div>

                    {/* Title */}
                    <h2 className="mt-5 text-2xl font-black text-gray-900">
                        Booking Successful!
                    </h2>

                    <p className="mt-3 text-sm text-gray-500 leading-relaxed">
                        Your table has been booked successfully.
                    </p>

                    {/* Customer Code Card */}
                    <div className="mt-6 mx-auto max-w-[240px] rounded-2xl border-2 border-dashed border-orange-300 bg-orange-50 px-6 py-5">
                        <p className="text-xs font-semibold text-orange-500 uppercase tracking-wider mb-1">
                            Customer Code
                        </p>
                        <p className="text-2xl font-black tracking-wider text-orange-600 font-mono">
                            {customer_code}
                        </p>
                    </div>

                    {/* Warning */}
                    <p className="mt-4 text-xs text-gray-400 leading-relaxed">
                        ⚠ Please save this code carefully.<br />
                        You will need it to view your booking details later.
                    </p>

                    {/* Buttons */}
                    <div className="mt-6 flex gap-3">
                        <button
                            type="button"
                            onClick={handleCopyBookingCode}
                            className="flex-1 rounded-xl border-2 border-orange-500 bg-white px-5 py-3.5 font-bold text-orange-600 transition hover:bg-orange-50 flex items-center justify-center gap-2"
                        >
                            <Copy className="h-4 w-4" />
                            {bookingCodeCopied ? 'Copied!' : 'Copy Customer Code'}
                        </button>

                        <Link
                            href="/menu"
                            className="flex-1 rounded-xl bg-orange-500 px-5 py-3.5 font-bold text-white transition hover:bg-orange-600 text-center"
                            onClick={() => setShowBookingSuccess(false)}
                        >
                            Go to Menu
                        </Link>
                    </div>
                </div>
            </div>
        )}

        {/* ================= REGISTRATION SUCCESS MODAL ================= */}
        {showRegistrationSuccess && (
            <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/60 p-4">
                <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl text-center">
                    {/* Success Icon */}
                    <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
                        <CheckCircle2 className="h-10 w-10 text-green-600" />
                    </div>

                    {/* Title */}
                    <h2 className="mt-5 text-2xl font-black text-gray-900">
                        Registration Successful
                    </h2>

                    <p className="mt-3 text-sm text-gray-500 leading-relaxed">
                        Congratulations! You have successfully become a member.
                    </p>

                    <p className="mt-1 text-sm text-gray-500">
                        Your Customer Code is:
                    </p>

                    {/* Customer Code Box */}
                    <div className="mt-4 mx-auto max-w-[220px] rounded-xl border-2 border-dashed border-orange-300 bg-orange-50 px-6 py-4">
                        <p className="text-xs font-semibold text-orange-500 uppercase tracking-wider mb-1">
                            Customer Code
                        </p>
                        <p className="text-2xl font-black tracking-wider text-orange-600 font-mono">
                            {registeredCustomerCode}
                        </p>
                    </div>

                    <p className="mt-4 text-xs text-gray-400 leading-relaxed">
                        Please save this code. You will need it for future bookings, orders, and member verification.
                    </p>

                    {/* Buttons */}
                    <div className="mt-6 flex gap-3">
                        <button
                            type="button"
                            onClick={handleCopyCode}
                            className="flex-1 rounded-xl border-2 border-orange-500 bg-white px-5 py-3.5 font-bold text-orange-600 transition hover:bg-orange-50 flex items-center justify-center gap-2"
                        >
                            {copied ? (
                                <>
                                    <CheckCircle2 className="h-4 w-4" />
                                    Copied!
                                </>
                            ) : (
                                <>
                                    <Copy className="h-4 w-4" />
                                    Copy Code
                                </>
                            )}
                        </button>

                        <button
                            type="button"
                            onClick={() => setShowRegistrationSuccess(false)}
                            className="flex-1 rounded-xl bg-orange-500 px-5 py-3.5 font-bold text-white transition hover:bg-orange-600"
                        >
                            Continue
                        </button>
                    </div>
                </div>
            </div>
        )}

        {/* ================= MEMBER REGISTRATION MODAL ================= */}
        {showMemberForm && (
            <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 p-4">

                <div className="w-full max-w-md rounded-3xl bg-white p-7 shadow-2xl">

                    {/* Modal Header */}
                    <div className="flex items-start justify-between">

                        <div>
                            <p className="font-semibold uppercase tracking-widest text-orange-500">
                                Join Us
                            </p>

                            <h2 className="mt-1 text-2xl font-black text-gray-900">
                                Become a Member
                            </h2>

                            <p className="mt-2 text-sm text-gray-500">
                                Register with us to become a member.
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={() => {
                                setShowMemberForm(false);
                                resetMemberForm();
                            }}
                            className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-xl text-gray-500 hover:bg-gray-200"
                        >
                            ×
                        </button>

                    </div>

                    {/* Registration Form */}
                    <form
                        className="mt-6 space-y-5"
                        onSubmit={handleRegisterMember}
                    >
                        {/* Name */}
                        <div>
                            <label className="mb-2 block text-sm font-bold text-gray-700">
                                Full Name
                            </label>

                            <input
                                type="text"
                                value={memberData.name}
                                onChange={(e) =>
                                    setMemberData(
                                        'name',
                                        e.target.value
                                    )
                                }
                                placeholder="Enter your full name"
                                className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-orange-500"
                            />

                            {memberErrors.name && (
                                <p className="mt-1 text-sm text-red-500">
                                    {memberErrors.name}
                                </p>
                            )}
                        </div>

                        {/* Phone */}
                        <div>
                            <label className="mb-2 block text-sm font-bold text-gray-700">
                                Phone Number
                            </label>

                            <input
                                type="tel"
                                value={memberData.phone}
                                onChange={(e) =>
                                    setMemberData(
                                        'phone',
                                        e.target.value
                                    )
                                }
                                placeholder="Enter your phone number"
                                className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-orange-500"
                            />

                            {memberErrors.phone && (
                                <p className="mt-1 text-sm text-red-500">
                                    {memberErrors.phone}
                                </p>
                            )}
                        </div>

                        {/* Email */}
                        <div>
                            <label className="mb-2 block text-sm font-bold text-gray-700">
                                Email Address
                                <span className="ml-1 font-normal text-gray-400">
                                    (Optional)
                                </span>
                            </label>

                            <input
                                type="email"
                                value={memberData.email}
                                onChange={(e) =>
                                    setMemberData(
                                        'email',
                                        e.target.value
                                    )
                                }
                                placeholder="Enter your email address"
                                className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-orange-500"
                            />

                            {memberErrors.email && (
                                <p className="mt-1 text-sm text-red-500">
                                    {memberErrors.email}
                                </p>
                            )}
                        </div>

                        {/* Buttons */}
                        <div className="flex gap-3 pt-2">

                            <button
                                type="button"
                                onClick={() => {
                                    setShowMemberForm(false);
                                    resetMemberForm();
                                }}
                                className="flex-1 rounded-xl border border-gray-200 px-5 py-3.5 font-bold text-gray-700 hover:bg-gray-100"
                            >
                                Cancel
                            </button>

                            <button
                                type="submit"
                                disabled={isRegistering}
                                className="flex-1 rounded-xl bg-orange-500 px-5 py-3.5 font-bold text-white hover:bg-orange-600 disabled:opacity-60"
                            >
                                {isRegistering
                                    ? 'Registering...'
                                    : 'Become a Member'}
                            </button>

                        </div>
                    </form>

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

                    {/* Table Selector Dropdown */}
                    {availableTables.length > 0 ? (
                        <div className="flex items-center gap-3">
                            <div className="hidden items-center gap-2 text-sm text-gray-500 sm:flex">
                                <span>🍽️</span>
                                <span>Select table:</span>
                            </div>
                            <Select
                                value={table ? String(table.table_number) : ''}
                                onValueChange={(value) => {
                                    router.get(`/menu?table=${value}`, {}, { preserveScroll: true });
                                }}
                            >
                                <SelectTrigger className="w-[140px] rounded-full border-orange-200 bg-orange-50 font-bold text-gray-900 hover:bg-orange-100">
                                    <SelectValue placeholder="Choose table" />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl">
                                    {availableTables.map((t) => (
                                        <SelectItem
                                            key={t.id}
                                            value={String(t.table_number)}
                                            className="font-semibold"
                                        >
                                            Table {t.table_number}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    ) : !table ? (
                        <div className="flex items-center gap-2 rounded-full bg-red-50 px-4 py-2 text-sm text-red-600">
                            <span>No tables available</span>
                        </div>
                    ) : null}
                        {/* Booking Button */}
                        <a
                            href="/booking"
                            className="rounded-full bg-blue-500 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-blue-600"
                        >
                            🗓️ Book a Table
                        </a>
                        {/* Become a Member Button */}
                        <button
                            type="button"
                            onClick={() => setShowMemberForm(true)}
                            className="rounded-full bg-orange-500 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-orange-600"
                        >
                            👤 Become a Member
                        </button>
                    {/* My Booking Button */}
                    {hasActiveBooking && (
                        <button
                            type="button"
                            onClick={() => setShowMyBooking(true)}
                            className="rounded-full bg-orange-500 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-orange-600"
                        >
                            📋 My Booking
                        </button>
                    )}
                    {/* My Order Button - Navigates directly to orders page */}
                    <button
                        type="button"
                        onClick={handleMyOrderClick}
                        className="relative flex items-center gap-2 rounded-full bg-gray-900 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-orange-500"
                    >
                        <span>🛒</span>

                        <span className="hidden sm:inline">
                            My Order
                        </span>

                        <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-orange-500 px-1 text-xs">
                            {cartQuantity}
                        </span>
                    </button>
                </div>
            </header>
                {tableError && (
    <div className="fixed left-1/2 top-24 z-[100] -translate-x-1/2 rounded-xl bg-red-500 px-6 py-3 text-sm font-semibold text-white shadow-lg">
        {tableError}
    </div>
)}
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
                                    className="group flex flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl"
                                >
                                    {/* Food Image */}
                                    <div className="relative overflow-hidden">
                                        {item.image ? (
                                            <img
                                                src={`/storage/${item.image}`}
                                                alt={item.name}
                                                className="h-60 w-full object-cover transition duration-500 group-hover:scale-105"
                                                onError={(e) => {
                                                    const target = e.currentTarget;
                                                    target.style.display = 'none';
                                                    const parent = target.parentElement;
                                                    if (parent) {
                                                        const placeholder = document.createElement('div');
                                                        placeholder.className = 'flex h-60 items-center justify-center bg-stone-100';
                                                        placeholder.innerHTML = '<div class="text-center"><span class="text-5xl">🍽️</span><p class="mt-2 text-sm text-gray-400">No image available</p></div>';
                                                        parent.appendChild(placeholder);
                                                    }
                                                }}
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

                                        {/* Availability Badge */}
                                        <div className={`absolute left-4 top-4 rounded-full px-3 py-1.5 text-xs font-bold shadow ${
                                            item.is_available
                                                ? 'bg-green-500 text-white'
                                                : 'bg-red-500 text-white'
                                        }`}>
                                            {item.is_available ? '🟢 Available' : '🔴 Unavailable'}
                                        </div>

                                        {/* Preparation Time */}
                                        {item.preparation_time && (
                                            <div className="absolute right-4 top-4 rounded-full bg-white/95 px-3 py-1.5 text-xs font-bold shadow">
                                                ⏱ {item.preparation_time} min
                                            </div>
                                        )}
                                    </div>

                                    {/* Food Details */}
                                    <div className="flex flex-1 flex-col p-6">
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

                                        {/* Category */}
                                        {item.category && (
                                            <p className="mt-2 text-sm font-medium text-gray-400">
                                                Category: {item.category.name}
                                            </p>
                                        )}

                                        {item.description && (
                                            <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-gray-500">
                                                {item.description}
                                            </p>
                                        )}

                                        {/* Spacer */}
                                        <div className="flex-1" />

                                        {/* Order Button - only if available */}
                                        {item.is_available ? (
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    addToCart(item)
                                                }
                                                className="mt-6 w-full rounded-xl bg-gray-900 px-5 py-3.5 font-bold text-white transition hover:bg-orange-500 active:scale-[0.98]"
                                            >
                                                + Add to Order
                                            </button>
                                        ) : (
                                            <div className="mt-6 w-full rounded-xl bg-gray-200 px-5 py-3.5 text-center text-sm font-bold text-gray-500 cursor-not-allowed">
                                                Currently Unavailable
                                            </div>
                                        )}
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

            {/* My Booking Modal */}
            {showMyBooking && (
                <MyBooking onClose={() => setShowMyBooking(false)} />
            )}

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
