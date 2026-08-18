import { Link, router, useForm } from '@inertiajs/react';
import {
    ShoppingBag,
    Plus,
    Minus,
    Trash2,
    Copy,
    CheckCircle2,
    Clock,
    ChefHat,
    X,
    ArrowRight,
    Utensils,
    UserPlus,
    Bell,
    Calendar,
    Package,
    Search,
    Sparkles,
    Star,
    Timer,
    Pill,
    Leaf,
    Flame,
    MessageSquareText,
} from 'lucide-react';
import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import PhoneInput, {
    isValidEthiopianPhone,
} from '@/components/phone-input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from '@/components/ui/sheet';
import MyBooking from '@/pages/booking/my-booking';

type Category = {
    id: number;
    name: string;
    description: string | null;
};

type Discount = {
    id: number;
    name: string | null;
    description: string | null;
    discount_type: string;
    percentage: string | null;
    fixed_amount: string | null;
    applies_to: string;
    start_date: string | null;
    start_time: string | null;
};

type MemberNotification = {
    id: number;
    read_at: string | null;
    discount: Discount | null;
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
    discounts: Discount[];
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

type BookingData = {
    id: number;
    customer_name: string;
    tables: number[];
    booked_at: string;
    expires_at: string;
    expires_in_seconds: number;
    payment_status: string;
};

type Props = {
    categories: Category[];
    menuItems: MenuItem[];
    selectedCategory: number | null;
    table: RestaurantTable | null;
    availableTables: RestaurantTable[];
    booking_success?: boolean;
    booking_data?: BookingData | null;
    customer_phone?: string;
    tableError?: string | null;
    order_id?: number | null;
    isMember?: boolean;
    memberUnreadCount?: number;
    memberNotifications?: MemberNotification[];
};

const formatCountdown = (seconds: number): string => {
    if (seconds <= 0) {
        return 'Expired';
    }

    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;

    return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const formatAvailableAt = (discount: Discount | null): string => {
    if (!discount?.start_date) {
        return '—';
    }

    return discount.start_time
        ? `${discount.start_date} ${discount.start_time}`
        : discount.start_date;
};

const getCategoryIcon = (name: string) => {
    const lower = name.toLowerCase();

    if (lower.includes('appetizer') || lower.includes('starter')) {
        return <Leaf className="h-4 w-4" />;
    }

    if (lower.includes('main') || lower.includes('entree')) {
        return <Flame className="h-4 w-4" />;
    }

    if (lower.includes('dessert')) {
        return <Sparkles className="h-4 w-4" />;
    }

    if (lower.includes('drink') || lower.includes('beverage')) {
        return <Pill className="h-4 w-4" />;
    }

    return <Utensils className="h-4 w-4" />;
};

export function MenuView({
    basePath = '/menu',
    allowTableSelection = true,
    categories,
    menuItems,
    selectedCategory,
    table,
    availableTables,
    booking_success = false,
    booking_data = null,
    customer_phone = '',
    tableError: propTableError = null,
    order_id = null,
    isMember = false,
    memberUnreadCount = 0,
    memberNotifications = [],
}: Props & { basePath?: string; allowTableSelection?: boolean }) {
    const [cart, setCart] = useState<CartItem[]>([]);
    const [showMemberForm, setShowMemberForm] = useState(false);
    const [showMemberVerify, setShowMemberVerify] = useState(false);
    const [showMemberNotifications, setShowMemberNotifications] =
        useState(false);
    const [localNotifications, setLocalNotifications] = useState<
        MemberNotification[]
    >(memberNotifications ?? []);
    const [localUnreadCount, setLocalUnreadCount] = useState<number>(
        memberUnreadCount ?? 0,
    );
    const [memberVerifyPhone, setMemberVerifyPhone] = useState('');
    const [memberVerifyError, setMemberVerifyError] = useState('');
    const [isVerifyingMember, setIsVerifyingMember] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [tableError, setTableError] = useState<string | null>(propTableError);
    const [animatingItems, setAnimatingItems] = useState<Set<number>>(
        new Set(),
    );
    const [visibleItems, setVisibleItems] = useState<Set<number>>(new Set());
    const cartBtnRef = useRef<HTMLButtonElement>(null);
    const [cartOpen, setCartOpen] = useState(false);
    const categoryScrollRef = useRef<HTMLDivElement>(null);

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

    const [specialInstructions, setSpecialInstructions] = useState('');
    const [isPlacingOrder, setIsPlacingOrder] = useState(false);
    const [showMyBooking, setShowMyBooking] = useState(false);
    const [hasActiveBooking, setHasActiveBooking] = useState(false);
    const [showRegistrationSuccess, setShowRegistrationSuccess] =
        useState(false);
    const [registeredCustomerPhone, setRegisteredCustomerPhone] = useState('');
    const [copied, setCopied] = useState(false);
    const [showBookingSuccess, setShowBookingSuccess] = useState(false);
    // Snapshot of the confirmation data so it survives re-renders where the
    // transient flash prop (booking_data) has reverted to null.
    const [bookingConfirm, setBookingConfirm] = useState<BookingData | null>(
        null,
    );
    const [countdown, setCountdown] = useState(
        bookingConfirm?.expires_in_seconds ?? 300,
    );

    useEffect(() => {
        if (booking_success && customer_phone && booking_data) {
            setBookingConfirm(booking_data);
            setShowBookingSuccess(true);
            setCountdown(booking_data.expires_in_seconds ?? 300);
        }
    }, [booking_success, customer_phone, booking_data]);

    useEffect(() => {
        if (!showBookingSuccess) {
            return;
        }

        const interval = setInterval(() => {
            setCountdown((prev) => Math.max(0, prev - 1));
        }, 1000);

        return () => clearInterval(interval);
    }, [showBookingSuccess]);

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

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        const id = Number(
                            entry.target.getAttribute('data-item-id'),
                        );

                        if (id) {
                            setVisibleItems((prev) => new Set(prev).add(id));
                        }
                    }
                });
            },
            { threshold: 0.1 },
        );
        document
            .querySelectorAll('[data-item-id]')
            .forEach((el) => observer.observe(el));

        return () => observer.disconnect();
    }, [menuItems]);

    const addToCart = useCallback((item: MenuItem) => {
        setAnimatingItems((prev) => new Set(prev).add(item.id));
        setTimeout(() => {
            setAnimatingItems((prev) => {
                const next = new Set(prev);
                next.delete(item.id);

                return next;
            });
        }, 600);
        setCart((currentCart) => {
            const existingItem = currentCart.find(
                (cartItem) => cartItem.id === item.id,
            );

            if (existingItem) {
                return currentCart.map((cartItem) =>
                    cartItem.id === item.id
                        ? { ...cartItem, quantity: cartItem.quantity + 1 }
                        : cartItem,
                );
            }

            return [...currentCart, { ...item, quantity: 1 }];
        });
        toast.success(`${item.name} added to order`, {
            duration: 2000,
            icon: <CheckCircle2 className="h-4 w-4 text-green-500" />,
        });
    }, []);

    const increaseQuantity = (itemId: number) => {
        setCart((currentCart) =>
            currentCart.map((item) =>
                item.id === itemId
                    ? { ...item, quantity: item.quantity + 1 }
                    : item,
            ),
        );
    };

    const decreaseQuantity = (itemId: number) => {
        setCart((currentCart) =>
            currentCart
                .map((item) =>
                    item.id === itemId
                        ? { ...item, quantity: item.quantity - 1 }
                        : item,
                )
                .filter((item) => item.quantity > 0),
        );
    };

    const removeFromCart = (itemId: number) => {
        setCart((currentCart) =>
            currentCart.filter((item) => item.id !== itemId),
        );
        toast.info('Item removed from order');
    };

    const cartTotal = cart.reduce(
        (total, item) => total + Number(item.price) * item.quantity,
        0,
    );
    const cartQuantity = cart.reduce((total, item) => total + item.quantity, 0);

    const placeOrder = () => {
        if (!table) {
            setTableError(
                allowTableSelection
                    ? 'Please select a table from the dropdown above before placing your order.'
                    : 'No table assigned. Please scan the QR code on your table.',
            );
            setTimeout(() => setTableError(null), 4000);

            return;
        }

        if (cart.length === 0) {
            toast.error('Please add at least one item to your order.');

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
                customer_phone: customer_phone || null,
                special_instructions: specialInstructions.trim() || null,
                source: basePath.replace(/^\//, ''),
                order_id: order_id || undefined,
            },
            {
                onSuccess: () => {
                    setCart([]);
                    setCartOpen(false);
                    toast.success('Order placed successfully!', {
                        duration: 4000,
                        icon: (
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                        ),
                    });
                    setIsPlacingOrder(false);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                },
                onError: (errors) => {
                    console.error(errors);
                    setIsPlacingOrder(false);
                    toast.error('Failed to place order. Please try again.');
                },
            },
        );
    };

    const handleRegisterMember = async (e: React.FormEvent) => {
        e.preventDefault();

        if (
            !memberData.name.trim() ||
            !isValidEthiopianPhone(memberData.phone)
        ) {
            return;
        }

        try {
            const getXsrfToken = () => {
                const match = document.cookie.match(
                    new RegExp('(^|;\\s*)(XSRF-TOKEN)=([^;]*)'),
                );

                return match ? decodeURIComponent(match[3]) : '';
            };
            const response = await fetch('/customer/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
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
                const firstError =
                    (Object.values(errorData.errors)[0] as string[])?.[0] ||
                    'Validation failed.';
                toast.error(firstError);

                return;
            }

            const data = await response.json();

            if (data.success) {
                setShowMemberForm(false);
                resetMemberForm();
                setRegisteredCustomerPhone(data.customer.phone);
                setShowRegistrationSuccess(true);
                setCopied(false);
            } else {
                toast.error(data.message || 'Registration failed.');
            }
        } catch {
            toast.error('Registration failed. Please try again.');
        }
    };

    const handleVerifyMember = async (e: React.FormEvent) => {
        e.preventDefault();
        setMemberVerifyError('');

        if (!isValidEthiopianPhone(memberVerifyPhone)) {
            setMemberVerifyError(
                'Please enter a valid phone number starting with 9 (9 digits).',
            );

            return;
        }

        setIsVerifyingMember(true);

        try {
            const getXsrfToken = () => {
                const match = document.cookie.match(
                    new RegExp('(^|;\\s*)(XSRF-TOKEN)=([^;]*)'),
                );

                return match ? decodeURIComponent(match[3]) : '';
            };
            const response = await fetch('/customer/verify-member', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-XSRF-TOKEN': getXsrfToken(),
                },
                body: JSON.stringify({
                    phone: memberVerifyPhone.trim(),
                }),
            });
            const data = await response.json();

            if (data.success) {
                setShowMemberVerify(false);
                setMemberVerifyPhone('');
                toast.success(
                    `Welcome ${data.customer.name}! Member discounts unlocked.`,
                );

                const url = new URL(window.location.href);
                url.searchParams.set('customer_phone', data.customer.phone);
                window.location.href = url.toString();
            } else {
                setMemberVerifyError(data.message || 'Verification failed.');
            }
        } catch {
            setMemberVerifyError('Verification failed. Please try again.');
        } finally {
            setIsVerifyingMember(false);
        }
    };

    const handleMarkNotificationRead = async (id: number) => {
        try {
            const getXsrfToken = () => {
                const match = document.cookie.match(
                    new RegExp('(^|;\\s*)(XSRF-TOKEN)=([^;]*)'),
                );

                return match ? decodeURIComponent(match[3]) : '';
            };
            const response = await fetch(
                `/customer/member-notifications/${id}/read`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Accept: 'application/json',
                        'X-XSRF-TOKEN': getXsrfToken(),
                    },
                    body: JSON.stringify({ customer_phone: customer_phone }),
                },
            );
            const data = await response.json();

            if (data.success) {
                setLocalNotifications((prev) =>
                    prev.map((n) =>
                        n.id === id
                            ? { ...n, read_at: new Date().toISOString() }
                            : n,
                    ),
                );
                setLocalUnreadCount(
                    typeof data.unread_count === 'number'
                        ? data.unread_count
                        : Math.max(0, localUnreadCount - 1),
                );
            }
        } catch {
            /* ignore network errors */
        }
    };

    const handleCopyPhone = async () => {
        try {
            await navigator.clipboard.writeText(registeredCustomerPhone);
            setCopied(true);
            toast.success('Phone number copied!');
            setTimeout(() => setCopied(false), 2000);
        } catch {
            const textArea = document.createElement('textarea');
            textArea.value = registeredCustomerPhone;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            setCopied(true);
            toast.success('Phone number copied!');
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleMyOrderClick = () => {
        if (!table) {
            setTableError(
                allowTableSelection
                    ? 'Please select a table before viewing your order.'
                    : 'No table assigned. Please scan the QR code on your table.',
            );
            setTimeout(() => setTableError(null), 4000);

            return;
        }

        setTableError(null);
        router.get(
            `${basePath.startsWith('/customer') ? '/customer-my-order' : '/my-order'}?table=${table.table_number}`,
        );
    };

    const filteredItems = searchQuery
        ? menuItems.filter(
              (item) =>
                  item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  item.description
                      ?.toLowerCase()
                      .includes(searchQuery.toLowerCase()),
          )
        : menuItems;

    const renderCartContent = (inSheet = false) => (
        <div className="flex h-full flex-col">
            {!inSheet && (
                <div className="flex items-center justify-between border-b border-red-200/60 p-4">
                    <div>
                        <h3 className="text-lg font-bold text-stone-800">
                            Your Order
                        </h3>
                        <p className="text-sm text-red-600">
                            {cartQuantity} item{cartQuantity !== 1 ? 's' : ''}
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={() => setCartOpen(false)}
                        className="flex h-8 w-8 items-center justify-center rounded-full bg-red-100 text-red-600 transition hover:bg-red-200"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>
            )}

            <div className="flex-1 overflow-y-auto p-4">
                {cart.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-100">
                            <ShoppingBag className="h-7 w-7 text-red-500" />
                        </div>
                        <p className="font-semibold text-stone-800">
                            Your order is empty
                        </p>
                        <p className="mt-1 text-sm text-red-600">
                            Browse the menu and add items to get started.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {cart.map((item) => (
                            <div
                                key={item.id}
                                className="group flex items-center gap-3 rounded-xl border border-red-200/60 bg-white p-3 shadow-sm transition hover:border-red-400 hover:shadow-md hover:shadow-red-200/30"
                            >
                                <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-red-100">
                                    {item.image ? (
                                        <img
                                            src={`/storage/${item.image}`}
                                            alt={item.name}
                                            className="h-full w-full object-cover"
                                        />
                                    ) : (
                                        <div className="flex h-full items-center justify-center text-red-400">
                                            <Utensils className="h-5 w-5" />
                                        </div>
                                    )}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-sm font-bold text-stone-800">
                                        {item.name}
                                    </p>
                                    <p className="text-xs text-red-600">
                                        {Number(item.price).toFixed(2)} ETB
                                    </p>
                                    <div className="mt-2 flex items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={() =>
                                                decreaseQuantity(item.id)
                                            }
                                            className="flex h-6 w-6 items-center justify-center rounded-full border border-red-200 text-red-700 transition hover:border-red-400 hover:bg-red-100"
                                        >
                                            <Minus className="h-3 w-3" />
                                        </button>
                                        <span className="w-5 text-center text-sm font-bold text-stone-800">
                                            {item.quantity}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() =>
                                                increaseQuantity(item.id)
                                            }
                                            className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-r from-red-500 to-red-600 text-white shadow-sm transition hover:from-red-600 hover:to-red-700 active:scale-90"
                                        >
                                            <Plus className="h-3 w-3" />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() =>
                                                removeFromCart(item.id)
                                            }
                                            className="ml-auto text-red-400 transition hover:text-red-500"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                                <div className="text-right text-sm font-bold text-red-600">
                                    {(
                                        Number(item.price) * item.quantity
                                    ).toFixed(2)}{' '}
                                    ETB
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {cart.length > 0 && (
                <div className="border-t border-red-200/60 bg-gradient-to-t from-white to-red-50/30 p-4">
                    {/* Additional Instructions (Mobile) */}
                    <div className="mb-3">
                        <label
                            htmlFor="special-instructions-mobile"
                            className="flex items-center gap-2 text-sm font-bold text-stone-800"
                        >
                            <MessageSquareText className="h-4 w-4 text-red-500" />
                            Additional Instructions
                        </label>
                        <textarea
                            id="special-instructions-mobile"
                            value={specialInstructions}
                            onChange={(e) => {
                                if (e.target.value.length <= 500) {
                                    setSpecialInstructions(e.target.value);
                                }
                            }}
                            rows={3}
                            maxLength={500}
                            placeholder={`Example:\n• No onions\n• Extra spicy\n• Less sugar\n• Separate the sauce\n• Allergy: No peanuts`}
                            className="mt-2 w-full resize-y rounded-xl border border-red-200 bg-white px-4 py-3 text-sm text-stone-700 placeholder:text-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-500/30 focus:outline-none"
                        />
                        <div className="mt-1 flex items-center justify-between text-xs">
                            <span className="text-red-500">Optional</span>
                            <span
                                className={`font-semibold ${specialInstructions.length >= 500 ? 'text-red-500' : 'text-red-500'}`}
                            >
                                {specialInstructions.length} / 500
                            </span>
                        </div>
                    </div>

                    <div className="mb-3 space-y-2">
                        <div className="flex items-center justify-between text-sm text-red-700">
                            <span>Subtotal ({cartQuantity} items)</span>
                            <span>{cartTotal.toFixed(2)} ETB</span>
                        </div>
                        {table && (
                            <div className="flex items-center justify-between text-sm text-red-700">
                                <span>Table</span>
                                <span className="font-semibold">
                                    Table {table.table_number}
                                </span>
                            </div>
                        )}
                        <Separator className="bg-red-200/40" />
                        <div className="flex items-center justify-between">
                            <span className="font-bold text-stone-800">
                                Total
                            </span>
                            <span className="text-xl font-black text-red-600 drop-shadow-sm">
                                {cartTotal.toFixed(2)} ETB
                            </span>
                        </div>
                    </div>
                    <Button
                        type="button"
                        onClick={placeOrder}
                        disabled={isPlacingOrder}
                        className="w-full shadow-lg shadow-red-500/25"
                        size="lg"
                    >
                        {isPlacingOrder ? (
                            <span className="flex items-center gap-2">
                                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                Placing Order...
                            </span>
                        ) : (
                            <span className="flex items-center gap-2">
                                Place Order
                                <ArrowRight className="h-4 w-4" />
                            </span>
                        )}
                    </Button>
                </div>
            )}
        </div>
    );

    return (
        <div className="min-h-screen bg-gradient-to-b from-red-50 via-red-50/30 to-white text-stone-800 selection:bg-red-200 selection:text-red-900">
            {/* ================= TOAST ERROR ================= */}
            {tableError && (
                <div className="fixed top-24 left-1/2 z-[100] -translate-x-1/2 animate-in rounded-2xl bg-red-500 px-6 py-3 text-sm font-semibold text-white shadow-xl fade-in slide-in-from-top-2">
                    <span className="flex items-center gap-2">
                        <X className="h-4 w-4" />
                        {tableError}
                    </span>
                </div>
            )}

            {/* ================= BOOKING CONFIRMED DIALOG ================= */}
            <Dialog
                open={showBookingSuccess}
                onOpenChange={(open) => {
                    setShowBookingSuccess(open);

                    if (!open) {
                        setBookingConfirm(null);
                    }
                }}
            >
                <DialogContent className="border-red-200 sm:max-w-md">
                    <DialogHeader className="text-center">
                        <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                            <CheckCircle2 className="h-8 w-8 text-green-600" />
                        </div>
                        <DialogTitle className="text-2xl font-black text-stone-800">
                            Booking Confirmed!
                        </DialogTitle>
                        <DialogDescription className="text-red-600">
                            Your table has been booked successfully.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="rounded-2xl border border-red-200/60 bg-red-50/50 p-5">
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-red-600">
                                    Booking ID
                                </span>
                                <span className="text-sm font-bold text-stone-800">
                                    #{bookingConfirm?.id}
                                </span>
                            </div>
                            <Separator className="bg-red-200/40" />
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-red-600">
                                    Customer
                                </span>
                                <span className="text-sm font-bold text-stone-800">
                                    {bookingConfirm?.customer_name}
                                </span>
                            </div>
                            <Separator className="bg-red-200/40" />
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-red-600">
                                    Phone Number
                                </span>
                                <Badge
                                    variant="secondary"
                                    className="bg-red-200 font-mono font-bold text-red-800"
                                >
                                    {customer_phone}
                                </Badge>
                            </div>
                            <Separator className="bg-red-200/40" />
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-red-600">
                                    Table
                                </span>
                                <span className="text-sm font-bold text-stone-800">
                                    {bookingConfirm?.tables?.join(', ') ||
                                        'N/A'}
                                </span>
                            </div>
                            <Separator className="bg-red-200/40" />
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-red-600">
                                    Date
                                </span>
                                <span className="text-sm font-bold text-stone-800">
                                    {bookingConfirm?.booked_at
                                        ? new Date(
                                              bookingConfirm.booked_at,
                                          ).toLocaleDateString('en-US', {
                                              year: 'numeric',
                                              month: 'short',
                                              day: 'numeric',
                                          })
                                        : '—'}
                                </span>
                            </div>
                            <Separator className="bg-red-200/40" />
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-red-600">
                                    Time
                                </span>
                                <span className="text-sm font-bold text-stone-800">
                                    {bookingConfirm?.booked_at
                                        ? new Date(
                                              bookingConfirm.booked_at,
                                          ).toLocaleTimeString('en-US', {
                                              hour: '2-digit',
                                              minute: '2-digit',
                                          })
                                        : '—'}
                                </span>
                            </div>
                            <Separator className="bg-red-200/40" />
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-red-600">
                                    Expires In
                                </span>
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-red-100 px-3 py-1 text-sm font-bold text-red-700">
                                    <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
                                    {formatCountdown(countdown)}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-xl bg-red-100 p-4">
                        <div className="flex items-start gap-3">
                            <span className="mt-0.5 font-bold text-red-700">
                                !
                            </span>
                            <div>
                                <p className="text-sm font-bold text-red-800">
                                    Save Your Phone Number
                                </p>
                                <p className="mt-1 text-xs text-red-600">
                                    Your phone number is required to manage your
                                    booking. Please save it.
                                </p>
                            </div>
                        </div>
                    </div>

                    {bookingConfirm && countdown > 0 && bookingConfirm.payment_status !== 'paid' && (
                        <Button
                            onClick={async () => {
                                try {
                                    const getXsrfToken = () => {
                                        const match = document.cookie.match(
                                            new RegExp('(^|;\\s*)(XSRF-TOKEN)=([^;]*)'),
                                        );

                                        return match ? decodeURIComponent(match[3]) : '';
                                    };
                                    const response = await fetch(`/booking/${bookingConfirm.id}/pay`, {
                                        method: 'POST',
                                        headers: {
                                            'Content-Type': 'application/json',
                                            'X-XSRF-TOKEN': getXsrfToken(),
                                        },
                                    });
                                    const data = await response.json();

                                    if (data.success) {
                                        toast.success('Payment confirmed successfully!');
                                        setBookingConfirm({
                                            ...bookingConfirm,
                                            payment_status: 'paid',
                                        });
                                    } else {
                                        toast.error(data.message || 'Payment failed.');
                                    }
                                } catch {
                                    toast.error('Payment failed. Please try again.');
                                }
                            }}
                            className="w-full bg-green-600 hover:bg-green-700 text-white"
                        >
                            <CheckCircle2 className="mr-2 h-4 w-4" />
                            Pay Now
                        </Button>
                    )}

                    {bookingConfirm && bookingConfirm.payment_status === 'paid' && (
                        <div className="rounded-xl bg-green-50 p-4 text-center">
                            <CheckCircle2 className="mx-auto h-8 w-8 text-green-600" />
                            <p className="mt-2 text-sm font-bold text-green-700">
                                Payment Confirmed
                            </p>
                            <p className="text-xs text-green-600">
                                Your booking payment has been received.
                            </p>
                        </div>
                    )}

                    <DialogFooter className="gap-2">
                        <Button
                            variant="outline"
                            onClick={() => {
                                setShowBookingSuccess(false);
                                setBookingConfirm(null);
                            }}
                            className="flex-1 border-red-200 text-red-700 hover:bg-red-50 hover:text-red-700"
                        >
                            Done
                        </Button>
                        <Button
                            onClick={() => {
                                setShowBookingSuccess(false);
                                setBookingConfirm(null);
                                setShowMyBooking(true);
                            }}
                            className="flex-1"
                        >
                            View My Booking
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ================= REGISTRATION SUCCESS DIALOG ================= */}
            <Dialog
                open={showRegistrationSuccess}
                onOpenChange={setShowRegistrationSuccess}
            >
                <DialogContent className="border-red-200 sm:max-w-md">
                    <DialogHeader className="text-center">
                        <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                            <CheckCircle2 className="h-8 w-8 text-green-600" />
                        </div>
                        <DialogTitle className="text-2xl font-black text-stone-800">
                            Registration Successful!
                        </DialogTitle>
                        <DialogDescription className="text-red-600">
                            Welcome to our family! You are now a valued member.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="mx-auto max-w-[220px] rounded-xl border-2 border-dashed border-red-300 bg-red-50 px-6 py-4 text-center">
                        <p className="mb-1 text-xs font-semibold tracking-wider text-red-500 uppercase">
                            Phone Number
                        </p>
                        <p className="font-mono text-2xl font-black tracking-wider text-red-600">
                            {registeredCustomerPhone}
                        </p>
                    </div>

                    <p className="text-center text-xs text-red-500">
                        Save this phone number. You'll need it for future
                        bookings, orders, and member verification.
                    </p>

                    <DialogFooter className="gap-2">
                        <Button
                            variant="outline"
                            onClick={handleCopyPhone}
                            className="flex-1 border-red-200 text-red-700 hover:bg-red-50 hover:text-red-700"
                        >
                            {copied ? (
                                <span className="flex items-center gap-2">
                                    <CheckCircle2 className="h-4 w-4" /> Copied!
                                </span>
                            ) : (
                                <span className="flex items-center gap-2">
                                    <Copy className="h-4 w-4" /> Copy Phone
                                </span>
                            )}
                        </Button>
                        <Button
                            onClick={() => setShowRegistrationSuccess(false)}
                            className="flex-1"
                        >
                            Continue
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ================= MEMBER REGISTRATION DIALOG ================= */}
            <Dialog
                open={showMemberForm}
                onOpenChange={(open) => {
                    setShowMemberForm(open);

                    if (!open) {
                        resetMemberForm();
                    }
                }}
            >
                <DialogContent className="border-red-200 sm:max-w-md">
                    <DialogHeader>
                        <Badge
                            variant="secondary"
                            className="mb-1 w-fit bg-red-100 text-red-700"
                        >
                            Join Us
                        </Badge>
                        <DialogTitle className="text-2xl font-black text-stone-800">
                            Become a Member
                        </DialogTitle>
                        <DialogDescription className="text-red-600">
                            Register to enjoy exclusive perks and faster
                            ordering.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleRegisterMember} className="space-y-4">
                        <div>
                            <label className="mb-1.5 block text-sm font-bold text-stone-700">
                                Full Name
                            </label>
                            <Input
                                type="text"
                                value={memberData.name}
                                onChange={(e) =>
                                    setMemberData('name', e.target.value)
                                }
                                placeholder="Enter your full name"
                                className="border-red-200 focus-visible:border-red-500 focus-visible:ring-red-500/20"
                            />
                            {memberErrors.name && (
                                <p className="mt-1 text-sm text-red-500">
                                    {memberErrors.name}
                                </p>
                            )}
                        </div>
                        <div>
                            <label className="mb-1.5 block text-sm font-bold text-stone-700">
                                Phone Number
                            </label>
                            <PhoneInput
                                value={memberData.phone}
                                onChange={(value) =>
                                    setMemberData('phone', value)
                                }
                                required
                                className="border-red-200 focus-within:border-red-500 focus-within:ring-red-500/20"
                                inputClassName="text-stone-700 placeholder:text-red-400"
                            />
                            {memberErrors.phone && (
                                <p className="mt-1 text-sm text-red-500">
                                    {memberErrors.phone}
                                </p>
                            )}
                        </div>
                        <div>
                            <label className="mb-1.5 block text-sm font-bold text-stone-700">
                                Email Address{' '}
                                <span className="font-normal text-red-400">
                                    (Optional)
                                </span>
                            </label>
                            <Input
                                type="email"
                                value={memberData.email}
                                onChange={(e) =>
                                    setMemberData('email', e.target.value)
                                }
                                placeholder="Enter your email address"
                                className="border-red-200 focus-visible:border-red-500 focus-visible:ring-red-500/20"
                            />
                            {memberErrors.email && (
                                <p className="mt-1 text-sm text-red-500">
                                    {memberErrors.email}
                                </p>
                            )}
                        </div>
                        <DialogFooter className="gap-2 pt-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                    setShowMemberForm(false);
                                    resetMemberForm();
                                }}
                                className="flex-1 border-red-200 text-red-700 hover:bg-red-50 hover:text-red-700"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={isRegistering}
                                className="flex-1"
                            >
                                {isRegistering
                                    ? 'Registering...'
                                    : 'Become a Member'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* ================= MEMBER DISCOUNT VERIFICATION DIALOG ================= */}
            <Dialog
                open={showMemberVerify}
                onOpenChange={(open) => {
                    setShowMemberVerify(open);

                    if (!open) {
                        setMemberVerifyPhone('');
                        setMemberVerifyError('');
                    }
                }}
            >
                <DialogContent className="border-red-200 sm:max-w-md">
                    <DialogHeader>
                        <Badge
                            variant="secondary"
                            className="mb-1 w-fit bg-red-100 text-red-700"
                        >
                            <Star className="mr-1 h-3 w-3" />
                            Member Discount
                        </Badge>
                        <DialogTitle className="text-2xl font-black text-stone-800">
                            Verify Membership
                        </DialogTitle>
                        <DialogDescription className="text-red-600">
                            Enter your phone number to verify membership and
                            unlock exclusive member discounts.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleVerifyMember} className="space-y-4">
                        <div>
                            <label className="mb-1.5 block text-sm font-bold text-stone-700">
                                Phone Number
                            </label>
                            <PhoneInput
                                value={memberVerifyPhone}
                                onChange={(value) =>
                                    setMemberVerifyPhone(value)
                                }
                                required
                                error={memberVerifyError}
                                className="border-red-200 focus-within:border-red-500 focus-within:ring-red-500/20"
                                inputClassName="text-stone-700 placeholder:text-red-400"
                            />
                        </div>
                        <DialogFooter className="gap-2 pt-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                    setShowMemberVerify(false);
                                    setMemberVerifyPhone('');
                                    setMemberVerifyError('');
                                }}
                                className="flex-1 border-red-200 text-red-700 hover:bg-red-50 hover:text-red-700"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={isVerifyingMember}
                                className="flex-1"
                            >
                                {isVerifyingMember
                                    ? 'Verifying...'
                                    : 'Check Discount'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* ================= HEADER ================= */}
            <header className="sticky top-0 z-50 border-b border-red-200/60 bg-white/80 shadow-sm backdrop-blur-xl">
                <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
                    <Link
                        href={basePath}
                        className="group flex items-center gap-2"
                    >
                        <img
                            src="/mamaskitchen-logo.png"
                            alt="Mama's Kitchen Logo"
                            className="h-10 w-auto object-contain"
                        />
                        <div className="flex flex-col leading-none">
                            <span className="text-[10px] font-semibold tracking-[0.2em] text-stone-500 uppercase">
                                Digital Menu
                            </span>
                        </div>
                    </Link>

                    <nav className="flex items-center gap-1.5 sm:gap-2.5">
                        {allowTableSelection ? (
                            availableTables.length > 0 ? (
                                <Select
                                    value={
                                        table ? String(table.table_number) : ''
                                    }
                                    onValueChange={(value) => {
                                        router.get(
                                            `${basePath}?table=${value}`,
                                            {},
                                            { preserveScroll: true },
                                        );
                                    }}
                                >
                                    <SelectTrigger className="h-9 w-fit gap-1 rounded-full border-red-200 bg-red-50/80 px-3 text-sm font-semibold text-red-700 hover:bg-red-100 hover:text-red-700 [&>svg]:ml-0">
                                        <Utensils className="h-3.5 w-3.5 shrink-0" />
                                        <span className="hidden sm:inline">
                                            {table
                                                ? `Table ${table.table_number}`
                                                : 'Choose Table'}
                                        </span>
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl border-red-200">
                                        {availableTables.map((t) => (
                                            <SelectItem
                                                key={t.id}
                                                value={String(t.table_number)}
                                                className="font-semibold text-stone-700 focus:bg-red-50 focus:text-red-700"
                                            >
                                                Table {t.table_number}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            ) : (
                                <Badge
                                    variant="secondary"
                                    className="bg-red-50 whitespace-nowrap text-red-600"
                                >
                                    No tables
                                </Badge>
                            )
                        ) : table ? (
                            <div className="flex items-center gap-1.5 rounded-full border border-red-300 bg-red-100/80 px-3 py-1.5 text-sm font-bold text-red-700 shadow-sm">
                                <Utensils className="h-3.5 w-3.5" />
                                <span className="xs:inline hidden">Table</span>
                                {table.table_number}
                                <Badge
                                    variant="secondary"
                                    className="bg-red-200 px-1.5 py-0 text-[10px] text-red-800"
                                >
                                    QR
                                </Badge>
                            </div>
                        ) : null}

                        <a
                            href={
                                basePath.startsWith('/customer')
                                    ? '/customer-booking'
                                    : '/booking'
                            }
                        >
                            <Button
                                variant="ghost"
                                size="sm"
                                className="rounded-full text-red-600 hover:bg-red-100 hover:text-red-700"
                            >
                                <Calendar className="h-3.5 w-3.5" />
                                <span className="hidden sm:inline">
                                    Book a Table
                                </span>
                            </Button>
                        </a>

                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={handleMyOrderClick}
                            className="rounded-full text-red-600 hover:bg-red-100 hover:text-red-700"
                        >
                            <Package className="h-3.5 w-3.5" />
                            <span className="hidden sm:inline">My Order</span>
                        </Button>

                        {hasActiveBooking && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setShowMyBooking(true)}
                                className="rounded-full text-red-600 hover:bg-red-100 hover:text-red-700"
                            >
                                My Booking
                            </Button>
                        )}
                    </nav>
                </div>
            </header>

            {/* ================= FLOATING CART BUTTON ================= */}
            {createPortal(
                <Sheet open={cartOpen} onOpenChange={setCartOpen}>
                    <SheetTrigger asChild>
                        <button
                            type="button"
                            className={
                                'fixed right-4 bottom-4 z-[60] flex h-11 items-center gap-2 rounded-full bg-gradient-to-r from-red-500 to-red-600 pr-3 pl-4 text-sm font-bold text-white shadow-xl shadow-red-500/40 transition-all hover:from-red-600 hover:to-red-700 hover:shadow-2xl hover:shadow-red-500/50 active:scale-90 sm:right-6 sm:bottom-6' +
                                (cartOpen
                                    ? ' pointer-events-none scale-0 opacity-0'
                                    : ' scale-100 opacity-100')
                            }
                        >
                            <ShoppingBag className="h-4 w-4" />
                            <span>Cart</span>
                            {cartQuantity > 0 && (
                                <span className="flex h-5 min-w-5 animate-in items-center justify-center rounded-full bg-white px-1 text-[10px] font-bold text-red-600 ring-2 ring-red-300 zoom-in">
                                    {cartQuantity}
                                </span>
                            )}
                        </button>
                    </SheetTrigger>
                    <SheetContent
                        side="right"
                        className="flex w-full flex-col border-l-red-200 p-0 sm:max-w-sm"
                    >
                        <SheetHeader className="border-b border-red-200/60 bg-gradient-to-r from-red-50 to-red-50 p-4">
                            <SheetTitle className="flex items-center justify-between text-stone-800">
                                <span>Your Order</span>
                                {cartQuantity > 0 && (
                                    <Badge
                                        variant="secondary"
                                        className="bg-red-100 text-red-700"
                                    >
                                        {cartQuantity} items
                                    </Badge>
                                )}
                            </SheetTitle>
                        </SheetHeader>
                        {renderCartContent()}
                    </SheetContent>
                </Sheet>,
                document.body,
            )}

            {/* ================= HERO ================= */}
            <section className="relative overflow-hidden bg-gradient-to-br from-red-950 via-red-900 to-red-900">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyek0zNiAyNHYySDI0di0yaDEyeiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />
                <div className="absolute -top-40 -right-40 h-[500px] w-[500px] animate-pulse rounded-full bg-red-500/15 blur-3xl" />
                <div
                    className="absolute -bottom-40 -left-40 h-[400px] w-[400px] animate-pulse rounded-full bg-red-500/10 blur-3xl"
                    style={{ animationDelay: '1s' }}
                />

                <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-28">
                    <div className="max-w-2xl">
                        <Badge
                            variant="secondary"
                            className="mb-6 animate-in bg-red-500/15 text-red-200 backdrop-blur-sm fill-mode-both fade-in slide-in-from-left-4"
                        >
                            <Sparkles className="mr-1 h-3 w-3" />
                            Welcome to our restaurant
                        </Badge>

                        {/* Logo + Heading row */}
                        <div className="flex items-center gap-6 sm:gap-8">
                            {/* Circular logo */}
                            <div
                                className="shrink-0 animate-in fill-mode-both fade-in slide-in-from-left-4"
                                style={{ animationDelay: '50ms' }}
                            >
                                <div className="flex h-24 w-24 items-center justify-center sm:h-32 sm:w-32">
                                    <img
                                        src="/mamaskitchen-logo.png"
                                        alt="Mama's Kitchen Logo"
                                        className="h-full w-full object-contain"
                                    />
                                </div>
                            </div>

                            {/* Heading text */}
                            <h2
                                className="animate-in text-4xl leading-tight font-black text-white fill-mode-both fade-in slide-in-from-bottom-4 sm:text-5xl lg:text-6xl"
                                style={{ animationDelay: '100ms' }}
                            >
                                Delicious food,
                                <br />
                                <span className="bg-gradient-to-r from-red-200 via-red-300 to-red-200 bg-clip-text text-transparent">
                                    made for you.
                                </span>
                            </h2>
                        </div>

                        <p
                            className="mt-5 max-w-xl animate-in text-base leading-relaxed text-red-200/80 fill-mode-both fade-in slide-in-from-bottom-4 sm:text-lg"
                            style={{ animationDelay: '200ms' }}
                        >
                            Explore our menu, choose your favorite dishes, and
                            order directly from your table. Every dish is
                            crafted with passion and the finest ingredients.
                        </p>

                        <div
                            className="mt-8 flex animate-in flex-wrap gap-3 fill-mode-both fade-in slide-in-from-bottom-4"
                            style={{ animationDelay: '300ms' }}
                        >
                            <Button
                                type="button"
                                onClick={() =>
                                    document
                                        .getElementById('menu-section')
                                        ?.scrollIntoView({ behavior: 'smooth' })
                                }
                                className="rounded-full shadow-lg shadow-red-500/30"
                            >
                                <ChefHat className="h-4 w-4" />
                                Explore Menu
                                <ArrowRight className="h-4 w-4" />
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setShowMemberForm(true)}
                                className="rounded-full border-red-300/30 bg-white/10 text-white backdrop-blur-sm transition hover:bg-white/20 hover:text-white"
                            >
                                <UserPlus className="h-4 w-4" />
                                Join as Member
                            </Button>
                            <div className="relative">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setShowMemberVerify(true)}
                                    className="relative rounded-full border-red-300/30 bg-white/10 text-white backdrop-blur-sm transition hover:bg-white/20 hover:text-white"
                                >
                                    <Star className="h-4 w-4" />
                                    Member Discount
                                    <Bell className="h-4 w-4" />
                                    {localUnreadCount > 0 && (
                                        <span className="absolute -top-1.5 -right-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white ring-2 ring-red-300">
                                            {localUnreadCount}
                                        </span>
                                    )}
                                </Button>

                                {showMemberNotifications && isMember && (
                                    <>
                                        <div
                                            className="fixed inset-0 z-[70]"
                                            onClick={() =>
                                                setShowMemberNotifications(
                                                    false,
                                                )
                                            }
                                        />
                                        <div className="absolute right-0 z-[80] mt-2 w-80 rounded-xl border border-red-200 bg-white p-3 text-stone-700 shadow-xl">
                                            <div className="mb-2 flex items-center justify-between">
                                                <span className="text-sm font-bold text-stone-800">
                                                    Member Notifications
                                                </span>
                                                {localUnreadCount > 0 && (
                                                    <span className="rounded-full bg-red-600 px-2 py-0.5 text-[10px] font-bold text-white">
                                                        {localUnreadCount} new
                                                    </span>
                                                )}
                                            </div>

                                            {localNotifications.length ===
                                            0 ? (
                                                <p className="text-sm text-stone-400">
                                                    No notifications yet.
                                                </p>
                                            ) : (
                                                <ul className="max-h-80 space-y-2 overflow-y-auto">
                                                    {localNotifications.map(
                                                        (n) => (
                                                            <li
                                                                key={n.id}
                                                                onClick={() =>
                                                                    handleMarkNotificationRead(
                                                                        n.id,
                                                                    )
                                                                }
                                                                className={`cursor-pointer rounded-lg border p-3 transition ${
                                                                    n.read_at
                                                                        ? 'border-stone-100 bg-stone-50'
                                                                        : 'border-red-200 bg-red-50'
                                                                }`}
                                                            >
                                                                <div className="flex items-center justify-between gap-2">
                                                                    <span className="font-semibold text-stone-800">
                                                                        {n.discount
                                                                            ?.name ??
                                                                            'Member Discount'}
                                                                    </span>
                                                                    {!n.read_at && (
                                                                        <span className="rounded-full bg-red-600 px-2 py-0.5 text-[10px] font-bold text-white">
                                                                            NEW
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                {n.discount
                                                                    ?.description && (
                                                                    <p className="mt-1 text-sm text-stone-500">
                                                                        {
                                                                            n
                                                                                .discount
                                                                                .description
                                                                        }
                                                                    </p>
                                                                )}
                                                                <div className="mt-1 text-sm font-bold text-red-600">
                                                                    {n.discount
                                                                        ?.discount_type ===
                                                                    'percentage'
                                                                        ? `${n.discount?.percentage}% off`
                                                                        : n.discount
                                                                              ?.fixed_amount
                                                                          ? `$${n.discount.fixed_amount} off`
                                                                          : ''}
                                                                </div>
                                                                <div className="mt-1 text-xs text-stone-400">
                                                                    Available:{' '}
                                                                    {formatAvailableAt(
                                                                        n.discount,
                                                                    )}
                                                                </div>
                                                                <div className="mt-1 text-xs font-medium text-stone-400">
                                                                    {n.read_at
                                                                        ? 'Read'
                                                                        : 'Unread'}
                                                                </div>
                                                            </li>
                                                        ),
                                                    )}
                                                </ul>
                                            )}
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ================= MAIN CONTENT ================= */}
            <main
                className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8"
                id="menu-section"
            >
                {/* Search + Categories header */}
                <div className="mb-8 space-y-6">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h2 className="text-3xl font-black tracking-tight text-stone-800">
                                Explore Our Menu
                            </h2>
                            <p className="mt-1 text-red-600">
                                Discover dishes crafted to perfection.
                            </p>
                        </div>
                        <div className="relative w-full sm:w-72">
                            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-red-400" />
                            <Input
                                type="text"
                                placeholder="Search dishes..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="h-10 rounded-full border-red-200 bg-white pl-9 text-stone-700 placeholder:text-red-400 focus-visible:border-red-500 focus-visible:ring-red-500/20"
                            />
                        </div>
                    </div>

                    <div
                        ref={categoryScrollRef}
                        className="flex scrollbar-none gap-2 overflow-x-auto pb-2"
                    >
                        <Link
                            href={basePath}
                            className={`flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold whitespace-nowrap transition-all duration-200 active:scale-95 ${
                                selectedCategory === null
                                    ? 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg shadow-red-500/25'
                                    : 'border border-red-200 bg-white text-red-600 shadow-sm hover:border-red-400 hover:bg-red-50 hover:text-red-700'
                            }`}
                        >
                            <Utensils className="h-4 w-4" />
                            All Items
                        </Link>

                        {categories.map((category) => (
                            <Link
                                key={category.id}
                                href={`${basePath}?category=${category.id}`}
                                className={`flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold whitespace-nowrap transition-all duration-200 active:scale-95 ${
                                    selectedCategory === category.id
                                        ? 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg shadow-red-500/25'
                                        : 'border border-red-200 bg-white text-red-600 shadow-sm hover:border-red-400 hover:bg-red-50 hover:text-red-700'
                                }`}
                            >
                                {getCategoryIcon(category.name)}
                                {category.name}
                            </Link>
                        ))}
                    </div>
                </div>

                {/* ================= MENU ITEMS ================= */}
                {filteredItems.length > 0 ? (
                    <section>
                        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
                            {filteredItems.map((item, index) => (
                                <article
                                    key={item.id}
                                    data-item-id={item.id}
                                    className={`group flex flex-col overflow-hidden rounded-2xl border border-red-100/80 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:shadow-red-200/40 ${
                                        visibleItems.has(item.id)
                                            ? 'animate-in fill-mode-both slide-in-from-bottom-5 fade-in'
                                            : 'opacity-0'
                                    }`}
                                    style={{
                                        animationDuration: '450ms',
                                        animationDelay: `${(index % 9) * 70}ms`,
                                    }}
                                >
                                    <div className="relative overflow-hidden">
                                        {item.image ? (
                                            <img
                                                src={`/storage/${item.image}`}
                                                alt={item.name}
                                                className="h-56 w-full object-cover transition duration-500 group-hover:scale-110"
                                                onError={(e) => {
                                                    const target =
                                                        e.currentTarget;
                                                    target.style.display =
                                                        'none';
                                                    const parent =
                                                        target.parentElement;

                                                    if (parent) {
                                                        const placeholder =
                                                            document.createElement(
                                                                'div',
                                                            );
                                                        placeholder.className =
                                                            'flex h-56 items-center justify-center bg-red-100';
                                                        placeholder.innerHTML =
                                                            '<div class="text-center text-red-400"><svg class="mx-auto h-10 w-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg><p class="mt-2 text-sm">No image available</p></div>';
                                                        parent.appendChild(
                                                            placeholder,
                                                        );
                                                    }
                                                }}
                                            />
                                        ) : (
                                            <div className="flex h-56 items-center justify-center bg-gradient-to-br from-red-100 to-red-100">
                                                <div className="text-center text-red-400">
                                                    <Utensils className="mx-auto h-10 w-10" />
                                                    <p className="mt-2 text-sm">
                                                        No image available
                                                    </p>
                                                </div>
                                            </div>
                                        )}

                                        <div
                                            className={`absolute top-3 left-3 rounded-full px-2.5 py-1 text-[10px] font-bold tracking-wide uppercase shadow-sm ${
                                                item.is_available
                                                    ? 'bg-emerald-500 text-white'
                                                    : 'bg-red-500 text-white'
                                            }`}
                                        >
                                            {item.is_available
                                                ? 'Available'
                                                : 'Unavailable'}
                                        </div>

                                        {item.preparation_time && (
                                            <div className="absolute top-3 right-3 flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-bold text-red-700 shadow-sm backdrop-blur-sm">
                                                <Timer className="h-3 w-3" />
                                                {item.preparation_time} min
                                            </div>
                                        )}

                                        {item.is_available && (
                                            <div className="absolute inset-x-0 bottom-0 translate-y-full bg-gradient-to-t from-black/60 via-black/20 to-transparent p-4 transition-transform duration-300 group-hover:translate-y-0">
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        addToCart(item)
                                                    }
                                                    className={`relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl px-4 py-2.5 text-sm font-bold shadow-lg transition active:scale-[0.97] ${
                                                        animatingItems.has(
                                                            item.id,
                                                        )
                                                            ? 'bg-emerald-500 text-white'
                                                            : 'bg-white text-stone-800 hover:bg-gradient-to-r hover:from-red-500 hover:to-red-600 hover:text-white'
                                                    }`}
                                                >
                                                    <span
                                                        className={`transition-all duration-300 ${animatingItems.has(item.id) ? 'w-0 scale-0 opacity-0' : ''}`}
                                                    >
                                                        <Plus className="h-4 w-4" />
                                                    </span>
                                                    <span
                                                        className={`transition-opacity duration-300 ${animatingItems.has(item.id) ? 'opacity-0' : ''}`}
                                                    >
                                                        Add to Order
                                                    </span>
                                                    <span
                                                        className={`absolute inset-0 flex items-center justify-center gap-2 transition-all duration-300 ${
                                                            animatingItems.has(
                                                                item.id,
                                                            )
                                                                ? 'opacity-100'
                                                                : 'opacity-0'
                                                        }`}
                                                    >
                                                        <CheckCircle2 className="h-4 w-4" />{' '}
                                                        Added!
                                                    </span>
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex flex-1 flex-col p-5">
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex flex-col gap-1">
                                                <h3 className="text-lg font-black text-stone-800">
                                                    {item.name}
                                                </h3>
                                                {item.category && (
                                                    <div className="flex items-center gap-1">
                                                        {getCategoryIcon(
                                                            item.category.name,
                                                        )}
                                                        <span className="text-xs font-medium text-red-500">
                                                            {item.category.name}
                                                        </span>
                                                    </div>
                                                )}
                                                {item.description && (
                                                    <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-red-700/80">
                                                        {item.description}
                                                    </p>
                                                )}
                                            </div>

                                            {(() => {
                                                const activeDiscount = (
                                                    item.discounts ?? []
                                                ).find(
                                                    (d) =>
                                                        d.discount_type ===
                                                            'percentage' &&
                                                        Number(d.percentage) >
                                                            0,
                                                );

                                                if (!activeDiscount) {
                                                    return (
                                                        <span className="text-base font-black whitespace-nowrap text-red-600 drop-shadow-sm">
                                                            {Number(
                                                                item.price,
                                                            ).toFixed(2)}{' '}
                                                            ETB
                                                        </span>
                                                    );
                                                }

                                                const isEligible =
                                                    activeDiscount.applies_to ===
                                                        'all' || isMember;
                                                const discountedPrice =
                                                    Number(item.price) -
                                                    (Number(item.price) *
                                                        Number(
                                                            activeDiscount.percentage,
                                                        )) /
                                                        100;

                                                if (isEligible) {
                                                    return (
                                                        <div className="flex flex-col items-end gap-1.5">
                                                            <Badge
                                                                variant="secondary"
                                                                className="bg-green-100 text-green-800"
                                                            >
                                                                {
                                                                    activeDiscount.percentage
                                                                }
                                                                % OFF
                                                            </Badge>
                                                            <span className="text-sm whitespace-nowrap text-muted-foreground line-through">
                                                                {Number(
                                                                    item.price,
                                                                ).toFixed(
                                                                    2,
                                                                )}{' '}
                                                                ETB
                                                            </span>
                                                            <span className="text-base font-black whitespace-nowrap text-red-600 drop-shadow-sm">
                                                                {discountedPrice.toFixed(
                                                                    2,
                                                                )}{' '}
                                                                ETB
                                                            </span>
                                                        </div>
                                                    );
                                                }

                                                return (
                                                    <div className="flex flex-col items-end gap-1">
                                                        <span className="text-base font-black whitespace-nowrap text-red-600 drop-shadow-sm">
                                                            {Number(
                                                                item.price,
                                                            ).toFixed(2)}{' '}
                                                            ETB
                                                        </span>
                                                        <span className="text-xs text-muted-foreground">
                                                            ⭐ Register as a
                                                            Member to unlock
                                                            this discount.
                                                        </span>
                                                    </div>
                                                );
                                            })()}
                                        </div>

                                        <div className="mt-auto flex-1" />

                                        {item.is_available ? (
                                            <button
                                                type="button"
                                                onClick={() => addToCart(item)}
                                                className={`relative mt-4 flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl px-4 py-3 text-sm font-bold text-white shadow-md transition-all duration-200 active:scale-[0.97] sm:hidden ${
                                                    animatingItems.has(item.id)
                                                        ? 'bg-emerald-500 shadow-emerald-500/30'
                                                        : 'bg-gradient-to-r from-red-500 to-red-600 shadow-red-500/25 hover:from-red-600 hover:to-red-700'
                                                }`}
                                            >
                                                <span
                                                    className={`transition-transform duration-300 ${animatingItems.has(item.id) ? 'scale-0' : ''}`}
                                                >
                                                    <Plus className="h-4 w-4" />
                                                </span>
                                                <span
                                                    className={`transition-opacity duration-300 ${animatingItems.has(item.id) ? 'opacity-0' : ''}`}
                                                >
                                                    Add to Order
                                                </span>
                                                <span
                                                    className={`absolute inset-0 flex items-center justify-center gap-2 transition-all duration-300 ${
                                                        animatingItems.has(
                                                            item.id,
                                                        )
                                                            ? 'opacity-100'
                                                            : 'opacity-0'
                                                    }`}
                                                >
                                                    <CheckCircle2 className="h-4 w-4" />{' '}
                                                    Added!
                                                </span>
                                            </button>
                                        ) : (
                                            <div className="mt-4 w-full rounded-xl bg-red-100/50 px-4 py-3 text-center text-sm font-bold text-red-500">
                                                Currently Unavailable
                                            </div>
                                        )}
                                    </div>
                                </article>
                            ))}
                        </div>
                    </section>
                ) : (
                    <div className="rounded-2xl border border-red-200/60 bg-white p-16 text-center shadow-sm">
                        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-red-100">
                            <Search className="h-8 w-8 text-red-400" />
                        </div>
                        <h2 className="mt-5 text-2xl font-black text-stone-800">
                            {searchQuery
                                ? 'No matching dishes'
                                : 'No menu items available'}
                        </h2>
                        <p className="mt-2 text-red-600">
                            {searchQuery
                                ? `No dishes found for "${searchQuery}". Try a different search.`
                                : 'Please check back later.'}
                        </p>
                        {searchQuery && (
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setSearchQuery('')}
                                className="mt-6 rounded-full border-red-200 text-red-700 hover:bg-red-50 hover:text-red-700"
                            >
                                Clear Search
                            </Button>
                        )}
                    </div>
                )}

                {/* ================= PERSISTENT CART SECTION (desktop) ================= */}
                {cart.length > 0 && (
                    <section id="your-order" className="mt-20 scroll-mt-24">
                        <div className="mb-6">
                            <Badge
                                variant="secondary"
                                className="mb-1 bg-red-100 text-red-700"
                            >
                                <ShoppingBag className="mr-1 h-3 w-3" />
                                Almost there
                            </Badge>
                            <h2 className="text-3xl font-black text-stone-800">
                                Your Order
                            </h2>
                            {table && (
                                <p className="mt-1 text-red-600">
                                    Ordering for{' '}
                                    <strong className="text-stone-800">
                                        Table {table.table_number}
                                    </strong>
                                </p>
                            )}
                        </div>

                        <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
                            <div className="rounded-2xl border border-red-200/60 bg-white p-6 shadow-sm">
                                <div className="space-y-4">
                                    {cart.map((item) => (
                                        <div
                                            key={item.id}
                                            className="flex gap-4 rounded-xl border border-red-100/80 bg-red-50/30 p-4 shadow-sm transition hover:border-red-300 hover:bg-red-100/50 hover:shadow-md"
                                        >
                                            <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl bg-red-100">
                                                {item.image ? (
                                                    <img
                                                        src={`/storage/${item.image}`}
                                                        alt={item.name}
                                                        className="h-full w-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="flex h-full items-center justify-center text-red-400">
                                                        <Utensils className="h-6 w-6" />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-start justify-between">
                                                    <h3 className="font-bold text-stone-800">
                                                        {item.name}
                                                    </h3>
                                                    <span className="text-sm font-black whitespace-nowrap text-red-600">
                                                        {(
                                                            Number(item.price) *
                                                            item.quantity
                                                        ).toFixed(2)}{' '}
                                                        ETB
                                                    </span>
                                                </div>
                                                <p className="mt-0.5 text-xs text-red-600">
                                                    {Number(item.price).toFixed(
                                                        2,
                                                    )}{' '}
                                                    ETB each
                                                </p>
                                                <div className="mt-3 flex items-center gap-3">
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            decreaseQuantity(
                                                                item.id,
                                                            )
                                                        }
                                                        className="flex h-7 w-7 items-center justify-center rounded-full border border-red-200 text-red-600 transition hover:border-red-400 hover:bg-red-100"
                                                    >
                                                        <Minus className="h-3 w-3" />
                                                    </button>
                                                    <span className="w-6 text-center text-sm font-bold text-stone-800">
                                                        {item.quantity}
                                                    </span>
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            increaseQuantity(
                                                                item.id,
                                                            )
                                                        }
                                                        className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-r from-red-500 to-red-600 text-white shadow-sm transition hover:from-red-600 hover:to-red-700 active:scale-90"
                                                    >
                                                        <Plus className="h-3 w-3" />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            removeFromCart(
                                                                item.id,
                                                            )
                                                        }
                                                        className="ml-2 text-xs font-semibold text-red-400 transition hover:text-red-500"
                                                    >
                                                        Remove
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="h-fit rounded-2xl bg-gradient-to-br from-stone-900 to-stone-800 p-7 text-white shadow-xl shadow-stone-900/20 lg:sticky lg:top-24">
                                <h3 className="flex items-center gap-2 text-xl font-black">
                                    <ShoppingBag className="h-5 w-5 text-red-400" />
                                    Order Summary
                                </h3>

                                <div className="mt-6 space-y-3 border-b border-white/10 pb-6">
                                    <div className="flex justify-between text-sm text-red-200">
                                        <span>Items ({cartQuantity})</span>
                                        <span>{cartTotal.toFixed(2)} ETB</span>
                                    </div>
                                    <div className="flex justify-between text-sm text-red-200">
                                        <span>Table</span>
                                        <span>
                                            {table
                                                ? `Table ${table.table_number}`
                                                : 'Not selected'}
                                        </span>
                                    </div>
                                </div>

                                {/* Additional Instructions */}
                                <div className="mt-6 border-b border-white/10 pb-6">
                                    <label
                                        htmlFor="special-instructions"
                                        className="flex items-center gap-2 text-sm font-bold text-white"
                                    >
                                        <MessageSquareText className="h-4 w-4 text-red-400" />
                                        Additional Instructions
                                    </label>
                                    <textarea
                                        id="special-instructions"
                                        value={specialInstructions}
                                        onChange={(e) => {
                                            if (e.target.value.length <= 500) {
                                                setSpecialInstructions(
                                                    e.target.value,
                                                );
                                            }
                                        }}
                                        rows={4}
                                        maxLength={500}
                                        placeholder={`Example:\n• No onions\n• Extra spicy\n• Less sugar\n• Separate the sauce\n• Allergy: No peanuts`}
                                        className="mt-3 w-full resize-y rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-red-200/40 focus:border-red-400 focus:ring-2 focus:ring-red-500/30 focus:outline-none"
                                    />
                                    <div className="mt-1 flex items-center justify-between text-xs">
                                        <span className="text-red-300/60">
                                            Optional
                                        </span>
                                        <span
                                            className={`font-semibold ${specialInstructions.length >= 500 ? 'text-red-400' : 'text-red-200/60'}`}
                                        >
                                            {specialInstructions.length} / 500
                                        </span>
                                    </div>
                                </div>

                                <div className="mt-6 flex items-center justify-between">
                                    <span className="text-lg font-bold">
                                        Total
                                    </span>
                                    <span className="text-2xl font-black text-red-400 drop-shadow-lg">
                                        {cartTotal.toFixed(2)} ETB
                                    </span>
                                </div>

                                <Button
                                    type="button"
                                    onClick={placeOrder}
                                    disabled={isPlacingOrder}
                                    className="mt-7 w-full shadow-lg shadow-red-500/25"
                                    size="lg"
                                >
                                    {isPlacingOrder ? (
                                        <span className="flex items-center justify-center gap-2">
                                            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                            Placing Order...
                                        </span>
                                    ) : (
                                        <span className="flex items-center justify-center gap-2">
                                            Place Order
                                            <ArrowRight className="h-4 w-4" />
                                        </span>
                                    )}
                                </Button>

                                <p className="mt-4 text-center text-xs text-red-300/60">
                                    Your order will be sent directly to the
                                    kitchen.
                                </p>
                            </div>
                        </div>
                    </section>
                )}
            </main>

            {/* Mobile: Floating Cart Button (triggers same sheet) */}
            {cart.length > 0 &&
                createPortal(
                    <div className="fixed inset-x-4 bottom-4 z-40 sm:hidden">
                        <button
                            type="button"
                            onClick={() => setCartOpen(true)}
                            className="flex w-full items-center justify-between gap-3 rounded-2xl bg-gradient-to-r from-red-500 to-red-600 px-5 py-4 text-white shadow-2xl shadow-red-500/40 transition hover:from-red-600 hover:to-red-700 active:scale-[0.98]"
                        >
                            <span className="flex items-center gap-2">
                                <ShoppingBag className="h-5 w-5" />
                                <span className="text-sm font-bold">
                                    View Order
                                </span>
                            </span>
                            <span className="flex items-center gap-3">
                                <span className="text-sm text-red-200">
                                    {cartQuantity} item
                                    {cartQuantity !== 1 ? 's' : ''}
                                </span>
                                <span className="text-lg font-black text-white drop-shadow-sm">
                                    {cartTotal.toFixed(2)} ETB
                                </span>
                            </span>
                        </button>
                    </div>,
                    document.body,
                )}

            {/* My Booking Modal */}
            {showMyBooking && (
                <MyBooking onClose={() => setShowMyBooking(false)} />
            )}

            {/* ================= FOOTER ================= */}
            <footer className="mt-20 border-t border-red-200/60 bg-gradient-to-b from-white to-red-50/50">
                <div className="mx-auto max-w-7xl px-5 py-10 text-center lg:px-8">
                    <p className="text-xl font-black text-stone-800">
                        DINE<span className="text-red-500">.</span>
                    </p>
                    <p className="mt-2 text-sm text-red-600">
                        Thank you for dining with us. We hope to see you again!
                    </p>
                    <div className="mt-4 flex items-center justify-center gap-4 text-xs text-red-400">
                        <span>© 2026 DINE Restaurant</span>
                        <span>·</span>
                        <span>Digital Menu System</span>
                    </div>
                </div>
            </footer>
        </div>
    );
}
