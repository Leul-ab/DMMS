import { Link, router, useForm } from '@inertiajs/react';
import { useState, useEffect, useRef, useCallback } from 'react';
import { toast } from 'sonner';
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
    Calendar,
    Package,
    Search,
    Sparkles,
    Star,
    Timer,
    Pill,
    Leaf,
    Flame,
} from 'lucide-react';
import MyBooking from '@/pages/booking/my-booking';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';

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

type BookingData = {
    id: number;
    customer_name: string;
    customer_code: string;
    tables: number[];
    booked_at: string;
    expires_at: string;
    expires_in_seconds: number;
};

type Props = {
    categories: Category[];
    menuItems: MenuItem[];
    selectedCategory: number | null;
    table: RestaurantTable | null;
    availableTables: RestaurantTable[];
    booking_success?: boolean;
    booking_data?: BookingData | null;
    customer_code?: string;
};

const formatCountdown = (seconds: number): string => {
    if (seconds <= 0) return 'Expired';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const categoryIcons: Record<string, JSX.Element> = {};

const getCategoryIcon = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes('appetizer') || lower.includes('starter')) return <Leaf className="h-4 w-4" />;
    if (lower.includes('main') || lower.includes('entree')) return <Flame className="h-4 w-4" />;
    if (lower.includes('dessert')) return <Sparkles className="h-4 w-4" />;
    if (lower.includes('drink') || lower.includes('beverage')) return <Pill className="h-4 w-4" />;
    return <Utensils className="h-4 w-4" />;
};

export default function MenuIndex({
    categories,
    menuItems,
    selectedCategory,
    table,
    availableTables,
    booking_success = false,
    booking_data = null,
    customer_code = '',
}: Props) {
    const [cart, setCart] = useState<CartItem[]>([]);
    const [showMemberForm, setShowMemberForm] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [tableError, setTableError] = useState<string | null>(null);
    const [animatingItems, setAnimatingItems] = useState<Set<number>>(new Set());
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

    const [isPlacingOrder, setIsPlacingOrder] = useState(false);
    const [showMyBooking, setShowMyBooking] = useState(false);
    const [hasActiveBooking, setHasActiveBooking] = useState(false);
    const [showRegistrationSuccess, setShowRegistrationSuccess] = useState(false);
    const [registeredCustomerCode, setRegisteredCustomerCode] = useState('');
    const [copied, setCopied] = useState(false);
    const [showBookingSuccess, setShowBookingSuccess] = useState(false);
    const [bookingCodeCopied, setBookingCodeCopied] = useState(false);
    const [countdown, setCountdown] = useState(booking_data?.expires_in_seconds ?? 600);

    useEffect(() => {
        if (booking_success && customer_code) {
            setShowBookingSuccess(true);
            setCountdown(booking_data?.expires_in_seconds ?? 600);
        }
    }, [booking_success, customer_code]);

    useEffect(() => {
        if (!showBookingSuccess) return;
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
                        const id = Number(entry.target.getAttribute('data-item-id'));
                        if (id) {
                            setVisibleItems((prev) => new Set(prev).add(id));
                        }
                    }
                });
            },
            { threshold: 0.1 }
        );

        document.querySelectorAll('[data-item-id]').forEach((el) => observer.observe(el));
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
                (cartItem) => cartItem.id === item.id
            );
            if (existingItem) {
                return currentCart.map((cartItem) =>
                    cartItem.id === item.id
                        ? { ...cartItem, quantity: cartItem.quantity + 1 }
                        : cartItem
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
                    : item
            )
        );
    };

    const decreaseQuantity = (itemId: number) => {
        setCart((currentCart) =>
            currentCart
                .map((item) =>
                    item.id === itemId
                        ? { ...item, quantity: item.quantity - 1 }
                        : item
                )
                .filter((item) => item.quantity > 0)
        );
    };

    const removeFromCart = (itemId: number) => {
        setCart((currentCart) =>
            currentCart.filter((item) => item.id !== itemId)
        );
        toast.info('Item removed from order');
    };

    const cartTotal = cart.reduce(
        (total, item) => total + Number(item.price) * item.quantity,
        0
    );

    const cartQuantity = cart.reduce(
        (total, item) => total + item.quantity,
        0
    );

    const placeOrder = () => {
        if (!table) {
            setTableError('No table assigned. Please scan the QR code on your table.');
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
            },
            {
                onSuccess: () => {
                    setCart([]);
                    setCartOpen(false);
                    toast.success('Order placed successfully!', {
                        duration: 4000,
                        icon: <CheckCircle2 className="h-4 w-4 text-green-500" />,
                    });
                    setIsPlacingOrder(false);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                },
                onError: (errors) => {
                    console.error(errors);
                    setIsPlacingOrder(false);
                    toast.error('Failed to place order. Please try again.');
                },
            }
        );
    };

    const handleRegisterMember = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!memberData.name.trim() || !memberData.phone.trim()) return;
        try {
            const getXsrfToken = () => {
                const match = document.cookie.match(new RegExp('(^|;\\s*)(XSRF-TOKEN)=([^;]*)'));
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
                setRegisteredCustomerCode(data.customer_code);
                setShowRegistrationSuccess(true);
                setCopied(false);
            } else {
                toast.error(data.message || 'Registration failed.');
            }
        } catch {
            toast.error('Registration failed. Please try again.');
        }
    };

    const handleCopyCode = async () => {
        try {
            await navigator.clipboard.writeText(registeredCustomerCode);
            setCopied(true);
            toast.success('Code copied!');
            setTimeout(() => setCopied(false), 2000);
        } catch {
            const textArea = document.createElement('textarea');
            textArea.value = registeredCustomerCode;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            setCopied(true);
            toast.success('Code copied!');
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleCopyBookingCode = async () => {
        try {
            await navigator.clipboard.writeText(customer_code);
            setBookingCodeCopied(true);
            toast.success('Customer code copied!');
            setTimeout(() => setBookingCodeCopied(false), 2000);
        } catch {
            const textArea = document.createElement('textarea');
            textArea.value = customer_code;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            setBookingCodeCopied(true);
            toast.success('Customer code copied!');
            setTimeout(() => setBookingCodeCopied(false), 2000);
        }
    };

    const handleMyOrderClick = () => {
        if (!table) {
            setTableError('Please select a table before viewing your order.');
            setTimeout(() => setTableError(null), 4000);
            return;
        }
        setTableError(null);
        router.get(`/my-order?table=${table.table_number}`);
    };

    const filteredItems = searchQuery
        ? menuItems.filter((item) =>
              item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
              item.description?.toLowerCase().includes(searchQuery.toLowerCase())
          )
        : menuItems;

    const CartContent = ({ inSheet = false }: { inSheet?: boolean }) => (
        <div className="flex h-full flex-col">
            {!inSheet && (
                <div className="flex items-center justify-between border-b border-stone-200 p-4">
                    <div>
                        <h3 className="text-lg font-bold">Your Order</h3>
                        <p className="text-sm text-stone-500">{cartQuantity} item{cartQuantity !== 1 ? 's' : ''}</p>
                    </div>
                    <button
                        type="button"
                        onClick={() => setCartOpen(false)}
                        className="flex h-8 w-8 items-center justify-center rounded-full bg-stone-100 text-stone-500 transition hover:bg-stone-200"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>
            )}

            <div className="flex-1 overflow-y-auto p-4">
                {cart.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-stone-100">
                            <ShoppingBag className="h-7 w-7 text-stone-400" />
                        </div>
                        <p className="font-semibold text-stone-900">Your order is empty</p>
                        <p className="mt-1 text-sm text-stone-500">
                            Browse the menu and add items to get started.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {cart.map((item) => (
                            <div
                                key={item.id}
                                className="group flex items-center gap-3 rounded-xl border border-stone-200 bg-white p-3 transition hover:border-orange-200 hover:shadow-sm"
                            >
                                <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-stone-100">
                                    {item.image ? (
                                        <img
                                            src={`/storage/${item.image}`}
                                            alt={item.name}
                                            className="h-full w-full object-cover"
                                        />
                                    ) : (
                                        <div className="flex h-full items-center justify-center text-stone-400">
                                            <Utensils className="h-5 w-5" />
                                        </div>
                                    )}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-sm font-bold">{item.name}</p>
                                    <p className="text-xs text-stone-500">
                                        {Number(item.price).toFixed(2)} ETB
                                    </p>
                                    <div className="mt-2 flex items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={() => decreaseQuantity(item.id)}
                                            className="flex h-6 w-6 items-center justify-center rounded-full border border-stone-200 text-stone-600 transition hover:border-orange-400 hover:bg-orange-50"
                                        >
                                            <Minus className="h-3 w-3" />
                                        </button>
                                        <span className="w-5 text-center text-sm font-bold">{item.quantity}</span>
                                        <button
                                            type="button"
                                            onClick={() => increaseQuantity(item.id)}
                                            className="flex h-6 w-6 items-center justify-center rounded-full bg-stone-900 text-white transition hover:bg-orange-500"
                                        >
                                            <Plus className="h-3 w-3" />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => removeFromCart(item.id)}
                                            className="ml-auto text-stone-400 transition hover:text-red-500"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                                <div className="text-right text-sm font-bold text-orange-600">
                                    {(Number(item.price) * item.quantity).toFixed(2)} ETB
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {cart.length > 0 && (
                <div className="border-t border-stone-200 bg-white p-4">
                    <div className="mb-3 space-y-2">
                        <div className="flex items-center justify-between text-sm text-stone-600">
                            <span>Subtotal ({cartQuantity} items)</span>
                            <span>{cartTotal.toFixed(2)} ETB</span>
                        </div>
                        {table && (
                            <div className="flex items-center justify-between text-sm text-stone-600">
                                <span>Table</span>
                                <span className="font-semibold">Table {table.table_number}</span>
                            </div>
                        )}
                        <Separator />
                        <div className="flex items-center justify-between">
                            <span className="font-bold">Total</span>
                            <span className="text-xl font-black text-orange-600">{cartTotal.toFixed(2)} ETB</span>
                        </div>
                    </div>
                    <Button
                        type="button"
                        onClick={placeOrder}
                        disabled={isPlacingOrder}
                        className="w-full"
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
        <div className="min-h-screen bg-gradient-to-b from-stone-50 to-white text-stone-900">
            {/* ================= TOAST ERROR ================= */}
            {tableError && (
                <div className="fixed left-1/2 top-24 z-[100] -translate-x-1/2 animate-in fade-in slide-in-from-top-2 rounded-2xl bg-red-500 px-6 py-3 text-sm font-semibold text-white shadow-xl">
                    <span className="flex items-center gap-2">
                        <X className="h-4 w-4" />
                        {tableError}
                    </span>
                </div>
            )}

            {/* ================= BOOKING CONFIRMED DIALOG ================= */}
            <Dialog open={showBookingSuccess} onOpenChange={setShowBookingSuccess}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader className="text-center">
                        <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                            <CheckCircle2 className="h-8 w-8 text-green-600" />
                        </div>
                        <DialogTitle className="text-2xl font-black text-stone-900">Booking Confirmed!</DialogTitle>
                        <DialogDescription className="text-stone-500">
                            Your table has been booked successfully.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="rounded-2xl border border-stone-200 bg-stone-50 p-5">
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-stone-500">Booking ID</span>
                                <span className="text-sm font-bold text-stone-900">#{booking_data?.id}</span>
                            </div>
                            <Separator />
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-stone-500">Customer</span>
                                <span className="text-sm font-bold text-stone-900">{booking_data?.customer_name}</span>
                            </div>
                            <Separator />
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-stone-500">Customer Code</span>
                                <Badge variant="secondary" className="bg-orange-100 text-orange-700 font-mono font-bold">
                                    {booking_data?.customer_code || customer_code}
                                </Badge>
                            </div>
                            <Separator />
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-stone-500">Table</span>
                                <span className="text-sm font-bold">{booking_data?.tables?.join(', ') || 'N/A'}</span>
                            </div>
                            <Separator />
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-stone-500">Date</span>
                                <span className="text-sm font-bold">
                                    {booking_data?.booked_at
                                        ? new Date(booking_data.booked_at).toLocaleDateString('en-US', {
                                              year: 'numeric',
                                              month: 'short',
                                              day: 'numeric',
                                          })
                                        : '—'}
                                </span>
                            </div>
                            <Separator />
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-stone-500">Time</span>
                                <span className="text-sm font-bold">
                                    {booking_data?.booked_at
                                        ? new Date(booking_data.booked_at).toLocaleTimeString('en-US', {
                                              hour: '2-digit',
                                              minute: '2-digit',
                                          })
                                        : '—'}
                                </span>
                            </div>
                            <Separator />
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-stone-500">Expires In</span>
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-100 px-3 py-1 text-sm font-bold text-orange-700">
                                    <span className="h-2 w-2 animate-pulse rounded-full bg-orange-500" />
                                    {formatCountdown(countdown)}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-xl bg-orange-50 p-4">
                        <div className="flex items-start gap-3">
                            <span className="mt-0.5 text-lg">!</span>
                            <div>
                                <p className="text-sm font-bold text-orange-800">Save Your Customer Code</p>
                                <p className="mt-1 text-xs text-orange-600">
                                    Your customer code is required to manage your booking. Please save it.
                                </p>
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="gap-2">
                        <Button variant="outline" onClick={() => setShowBookingSuccess(false)} className="flex-1">
                            Done
                        </Button>
                        <Button
                            onClick={() => {
                                setShowBookingSuccess(false);
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
            <Dialog open={showRegistrationSuccess} onOpenChange={setShowRegistrationSuccess}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader className="text-center">
                        <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                            <CheckCircle2 className="h-8 w-8 text-green-600" />
                        </div>
                        <DialogTitle className="text-2xl font-black">Registration Successful!</DialogTitle>
                        <DialogDescription>
                            Welcome to our family! You are now a valued member.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="mx-auto max-w-[220px] rounded-xl border-2 border-dashed border-orange-300 bg-orange-50 px-6 py-4 text-center">
                        <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-orange-500">
                            Customer Code
                        </p>
                        <p className="font-mono text-2xl font-black tracking-wider text-orange-600">
                            {registeredCustomerCode}
                        </p>
                    </div>

                    <p className="text-center text-xs text-stone-400">
                        Save this code. You'll need it for future bookings, orders, and member verification.
                    </p>

                    <DialogFooter className="gap-2">
                        <Button variant="outline" onClick={handleCopyCode} className="flex-1">
                            {copied ? (
                                <span className="flex items-center gap-2">
                                    <CheckCircle2 className="h-4 w-4" /> Copied!
                                </span>
                            ) : (
                                <span className="flex items-center gap-2">
                                    <Copy className="h-4 w-4" /> Copy Code
                                </span>
                            )}
                        </Button>
                        <Button onClick={() => setShowRegistrationSuccess(false)} className="flex-1">
                            Continue
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ================= MEMBER REGISTRATION DIALOG ================= */}
            <Dialog open={showMemberForm} onOpenChange={(open) => { setShowMemberForm(open); if (!open) resetMemberForm(); }}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <Badge variant="secondary" className="mb-1 w-fit bg-orange-100 text-orange-700">
                            Join Us
                        </Badge>
                        <DialogTitle className="text-2xl font-black">Become a Member</DialogTitle>
                        <DialogDescription>
                            Register to enjoy exclusive perks and faster ordering.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleRegisterMember} className="space-y-4">
                        <div>
                            <label className="mb-1.5 block text-sm font-bold text-stone-700">Full Name</label>
                            <Input
                                type="text"
                                value={memberData.name}
                                onChange={(e) => setMemberData('name', e.target.value)}
                                placeholder="Enter your full name"
                            />
                            {memberErrors.name && (
                                <p className="mt-1 text-sm text-red-500">{memberErrors.name}</p>
                            )}
                        </div>
                        <div>
                            <label className="mb-1.5 block text-sm font-bold text-stone-700">Phone Number</label>
                            <Input
                                type="tel"
                                value={memberData.phone}
                                onChange={(e) => setMemberData('phone', e.target.value)}
                                placeholder="Enter your phone number"
                            />
                            {memberErrors.phone && (
                                <p className="mt-1 text-sm text-red-500">{memberErrors.phone}</p>
                            )}
                        </div>
                        <div>
                            <label className="mb-1.5 block text-sm font-bold text-stone-700">
                                Email Address{' '}
                                <span className="font-normal text-stone-400">(Optional)</span>
                            </label>
                            <Input
                                type="email"
                                value={memberData.email}
                                onChange={(e) => setMemberData('email', e.target.value)}
                                placeholder="Enter your email address"
                            />
                            {memberErrors.email && (
                                <p className="mt-1 text-sm text-red-500">{memberErrors.email}</p>
                            )}
                        </div>
                        <DialogFooter className="gap-2 pt-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => { setShowMemberForm(false); resetMemberForm(); }}
                                className="flex-1"
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isRegistering} className="flex-1">
                                {isRegistering ? 'Registering...' : 'Become a Member'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* ================= HEADER ================= */}
            <header className="sticky top-0 z-50 border-b border-stone-200/80 bg-white/80 shadow-sm backdrop-blur-xl">
                <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
                    <Link href="/menu" className="group">
                        <h1 className="text-2xl font-black tracking-tight transition group-hover:text-orange-500">
                            DINE<span className="text-orange-500">.</span>
                        </h1>
                        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-stone-400">
                            Digital Menu
                        </p>
                    </Link>

                    <nav className="flex items-center gap-1.5 sm:gap-2.5">
                        {/* Choose Table / Table Badge */}
                        {table ? (
                            <div className="flex items-center gap-1.5 rounded-full border border-orange-200 bg-orange-50/80 px-3 py-1.5 text-sm font-bold text-orange-700 shadow-sm">
                                <Utensils className="h-3.5 w-3.5" />
                                <span className="hidden xs:inline">Table</span>
                                {table.table_number}
                                <Badge variant="secondary" className="bg-orange-200 text-orange-800 text-[10px] px-1.5 py-0">
                                    QR
                                </Badge>
                            </div>
                        ) : availableTables.length > 0 ? (
                            <Select
                                value={table ? String(table.table_number) : ''}
                                onValueChange={(value) => {
                                    router.get(`/menu?table=${value}`, {}, { preserveScroll: true });
                                }}
                            >
                                <SelectTrigger className="h-9 w-fit gap-1 rounded-full border-stone-200 bg-stone-50/80 px-3 text-sm font-semibold text-stone-700 hover:bg-stone-100 hover:text-stone-900 [&>svg]:ml-0">
                                    <Utensils className="h-3.5 w-3.5 shrink-0" />
                                    <span className="hidden sm:inline">Choose Table</span>
                                </SelectTrigger>
                                <SelectContent className="rounded-xl">
                                    {availableTables.map((t) => (
                                        <SelectItem key={t.id} value={String(t.table_number)} className="font-semibold">
                                            Table {t.table_number}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        ) : (
                            <Badge variant="secondary" className="bg-red-50 text-red-600 whitespace-nowrap">
                                No tables
                            </Badge>
                        )}

                        {/* Book a Table */}
                        <a href="/booking">
                            <Button variant="ghost" size="sm" className="rounded-full text-stone-600 hover:bg-stone-100 hover:text-orange-600">
                                <Calendar className="h-3.5 w-3.5" />
                                <span className="hidden sm:inline">Book a Table</span>
                            </Button>
                        </a>

                        {/* My Order */}
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={handleMyOrderClick}
                            className="rounded-full text-stone-600 hover:bg-stone-100 hover:text-orange-600"
                        >
                            <Package className="h-3.5 w-3.5" />
                            <span className="hidden sm:inline">My Order</span>
                        </Button>

                        {/* My Booking (conditional) */}
                        {hasActiveBooking && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setShowMyBooking(true)}
                                className="rounded-full text-stone-600 hover:bg-stone-100 hover:text-orange-600"
                            >
                                My Booking
                            </Button>
                        )}

                        {/* Cart — always visible */}
                        <Sheet open={cartOpen} onOpenChange={setCartOpen}>
                            <SheetTrigger asChild>
                                <button
                                    type="button"
                                    className="relative flex h-9 items-center gap-1.5 rounded-full bg-stone-900 px-3 text-sm font-bold text-white shadow-md transition hover:bg-orange-500 hover:shadow-lg active:scale-95"
                                >
                                    <ShoppingBag className="h-4 w-4" />
                                    <span className="hidden sm:inline">Cart</span>
                                    {cartQuantity > 0 && (
                                        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-orange-500 px-1 text-[10px] font-bold text-white ring-2 ring-white animate-in zoom-in">
                                            {cartQuantity}
                                        </span>
                                    )}
                                </button>
                            </SheetTrigger>
                            <SheetContent side="right" className="flex w-full flex-col p-0 sm:max-w-sm">
                                <SheetHeader className="border-b border-stone-200 p-4">
                                    <SheetTitle className="flex items-center justify-between">
                                        <span>Your Order</span>
                                        {cartQuantity > 0 && (
                                            <Badge variant="secondary" className="bg-orange-100 text-orange-700">
                                                {cartQuantity} items
                                            </Badge>
                                        )}
                                    </SheetTitle>
                                </SheetHeader>
                                <CartContent />
                            </SheetContent>
                        </Sheet>
                    </nav>
                </div>
            </header>

            {/* ================= HERO ================= */}
            <section className="relative overflow-hidden bg-gradient-to-br from-stone-900 via-stone-800 to-orange-950">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyek0zNiAyNHYySDI0di0yaDEyeiIvPjwvZz48L2c+PC9zdmc+')] opacity-40" />
                <div className="absolute -right-40 -top-40 h-[500px] w-[500px] rounded-full bg-orange-500/10 blur-3xl" />
                <div className="absolute -bottom-40 -left-40 h-[400px] w-[400px] rounded-full bg-orange-500/5 blur-3xl" />

                <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-28">
                    <div className="max-w-2xl">
                        <Badge variant="secondary" className="mb-4 bg-orange-500/15 text-orange-300 backdrop-blur-sm">
                            <Sparkles className="mr-1 h-3 w-3" />
                            Welcome to our restaurant
                        </Badge>

                        <h2 className="text-4xl font-black leading-tight text-white sm:text-5xl lg:text-6xl">
                            Delicious food,
                            <br />
                            <span className="bg-gradient-to-r from-orange-300 to-orange-500 bg-clip-text text-transparent">
                                made for you.
                            </span>
                        </h2>

                        <p className="mt-5 max-w-xl text-base leading-relaxed text-stone-300 sm:text-lg">
                            Explore our menu, choose your favorite dishes, and order directly from your table.
                            Every dish is crafted with passion and the finest ingredients.
                        </p>

                        <div className="mt-8 flex flex-wrap gap-3">
                            <Button
                                type="button"
                                onClick={() => document.getElementById('menu-section')?.scrollIntoView({ behavior: 'smooth' })}
                                className="rounded-full"
                            >
                                <ChefHat className="h-4 w-4" />
                                Explore Menu
                                <ArrowRight className="h-4 w-4" />
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setShowMemberForm(true)}
                                className="rounded-full border-white/20 bg-white/10 text-white backdrop-blur-sm hover:bg-white/20"
                            >
                                <UserPlus className="h-4 w-4" />
                                Join as Member
                            </Button>
                        </div>
                    </div>
                </div>
            </section>

            {/* ================= MAIN CONTENT ================= */}
            <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8" id="menu-section">
                {/* Search + Categories header */}
                <div className="mb-8 space-y-6">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h2 className="text-3xl font-black tracking-tight">Explore Our Menu</h2>
                            <p className="mt-1 text-stone-500">Discover dishes crafted to perfection.</p>
                        </div>
                        <div className="relative w-full sm:w-72">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
                            <Input
                                type="text"
                                placeholder="Search dishes..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="h-10 rounded-full border-stone-200 pl-9 text-sm"
                            />
                        </div>
                    </div>

                    {/* Category Navigation */}
                    <div
                        ref={categoryScrollRef}
                        className="flex gap-2 overflow-x-auto pb-2 scrollbar-none"
                    >
                        <Link
                            href="/menu"
                            className={`flex items-center gap-2 whitespace-nowrap rounded-full px-5 py-2.5 text-sm font-bold transition-all duration-200 active:scale-95 ${
                                selectedCategory === null
                                    ? 'bg-stone-900 text-white shadow-lg'
                                    : 'border border-stone-200 bg-white text-stone-600 hover:border-orange-300 hover:bg-orange-50 hover:text-orange-600'
                            }`}
                        >
                            <Utensils className="h-4 w-4" />
                            All Items
                        </Link>

                        {categories.map((category) => (
                            <Link
                                key={category.id}
                                href={`/menu?category=${category.id}`}
                                className={`flex items-center gap-2 whitespace-nowrap rounded-full px-5 py-2.5 text-sm font-bold transition-all duration-200 active:scale-95 ${
                                    selectedCategory === category.id
                                        ? 'bg-stone-900 text-white shadow-lg'
                                        : 'border border-stone-200 bg-white text-stone-600 hover:border-orange-300 hover:bg-orange-50 hover:text-orange-600'
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
                                    className={`group flex flex-col overflow-hidden rounded-2xl border border-stone-100 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${
                                        visibleItems.has(item.id)
                                            ? 'animate-in fade-in slide-in-from-bottom-4 fill-mode-both'
                                            : 'opacity-0'
                                    }`}
                                    style={{
                                        animationDuration: '400ms',
                                        animationDelay: `${(index % 9) * 60}ms`,
                                    }}
                                >
                                    {/* Food Image */}
                                    <div className="relative overflow-hidden">
                                        {item.image ? (
                                            <img
                                                src={`/storage/${item.image}`}
                                                alt={item.name}
                                                className="h-56 w-full object-cover transition duration-500 group-hover:scale-105"
                                                onError={(e) => {
                                                    const target = e.currentTarget;
                                                    target.style.display = 'none';
                                                    const parent = target.parentElement;
                                                    if (parent) {
                                                        const placeholder = document.createElement('div');
                                                        placeholder.className = 'flex h-56 items-center justify-center bg-stone-100';
                                                        placeholder.innerHTML =
                                                            '<div class="text-center text-stone-400"><svg class="mx-auto h-10 w-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg><p class="mt-2 text-sm">No image available</p></div>';
                                                        parent.appendChild(placeholder);
                                                    }
                                                }}
                                            />
                                        ) : (
                                            <div className="flex h-56 items-center justify-center bg-gradient-to-br from-stone-100 to-stone-200">
                                                <div className="text-center text-stone-400">
                                                    <Utensils className="mx-auto h-10 w-10" />
                                                    <p className="mt-2 text-sm">No image available</p>
                                                </div>
                                            </div>
                                        )}

                                        {/* Availability Badge */}
                                        <div
                                            className={`absolute left-3 top-3 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide shadow-sm ${
                                                item.is_available
                                                    ? 'bg-green-500 text-white'
                                                    : 'bg-red-500 text-white'
                                            }`}
                                        >
                                            {item.is_available ? 'Available' : 'Unavailable'}
                                        </div>

                                        {/* Preparation Time */}
                                        {item.preparation_time && (
                                            <div className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-bold text-stone-700 shadow-sm backdrop-blur-sm">
                                                <Timer className="h-3 w-3" />
                                                {item.preparation_time} min
                                            </div>
                                        )}

                                        {/* Add to cart overlay on hover (desktop) */}
                                        {item.is_available && (
                                            <div className="absolute inset-x-0 bottom-0 translate-y-full bg-gradient-to-t from-black/60 via-black/20 to-transparent p-4 transition-transform duration-300 group-hover:translate-y-0">
                                                <button
                                                    type="button"
                                                    onClick={() => addToCart(item)}
                                                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-stone-900 shadow-lg transition hover:bg-orange-500 hover:text-white active:scale-[0.97]"
                                                >
                                                    <Plus className={`h-4 w-4 transition-transform duration-300 ${animatingItems.has(item.id) ? 'rotate-45 scale-0' : ''}`} />
                                                    Add to Order
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    {/* Food Details */}
                                    <div className="flex flex-1 flex-col p-5">
                                        <div className="flex items-start justify-between gap-3">
                                            <h3 className="text-lg font-black text-stone-900">{item.name}</h3>
                                            <span className="whitespace-nowrap text-base font-black text-orange-600">
                                                {Number(item.price).toFixed(2)} ETB
                                            </span>
                                        </div>

                                        {item.category && (
                                            <div className="mt-1.5 flex items-center gap-1">
                                                {getCategoryIcon(item.category.name)}
                                                <span className="text-xs font-medium text-stone-400">{item.category.name}</span>
                                            </div>
                                        )}

                                        {item.description && (
                                            <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-stone-500">
                                                {item.description}
                                            </p>
                                        )}

                                        <div className="mt-auto flex-1" />

                                        {/* Mobile: Add to cart button */}
                                        {item.is_available ? (
                                            <button
                                                type="button"
                                                onClick={() => addToCart(item)}
                                                className={`relative mt-4 flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl px-4 py-3 text-sm font-bold text-white transition-all duration-200 active:scale-[0.97] sm:hidden ${
                                                    animatingItems.has(item.id)
                                                        ? 'bg-green-500'
                                                        : 'bg-stone-900 hover:bg-orange-500'
                                                }`}
                                            >
                                                <span className={`transition-transform duration-300 ${animatingItems.has(item.id) ? 'scale-0' : ''}`}>
                                                    <Plus className="h-4 w-4" />
                                                </span>
                                                <span className={`transition-opacity duration-300 ${animatingItems.has(item.id) ? 'opacity-0' : ''}`}>
                                                    Add to Order
                                                </span>
                                                <span
                                                    className={`absolute inset-0 flex items-center justify-center gap-2 transition-all duration-300 ${
                                                        animatingItems.has(item.id) ? 'opacity-100' : 'opacity-0'
                                                    }`}
                                                >
                                                    <CheckCircle2 className="h-4 w-4" /> Added!
                                                </span>
                                            </button>
                                        ) : (
                                            <div className="mt-4 w-full rounded-xl bg-stone-100 px-4 py-3 text-center text-sm font-bold text-stone-400">
                                                Currently Unavailable
                                            </div>
                        )}
                    </div>
                                </article>
                            ))}
                        </div>
                    </section>
                ) : (
                    <div className="rounded-2xl border border-stone-200 bg-white p-16 text-center shadow-sm">
                        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-stone-100">
                            <Search className="h-8 w-8 text-stone-400" />
                        </div>
                        <h2 className="mt-5 text-2xl font-black text-stone-900">
                            {searchQuery ? 'No matching dishes' : 'No menu items available'}
                        </h2>
                        <p className="mt-2 text-stone-500">
                            {searchQuery
                                ? `No dishes found for "${searchQuery}". Try a different search.`
                                : 'Please check back later.'}
                        </p>
                        {searchQuery && (
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setSearchQuery('')}
                                className="mt-6 rounded-full"
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
                            <Badge variant="secondary" className="mb-1 bg-orange-100 text-orange-700">
                                <ShoppingBag className="mr-1 h-3 w-3" />
                                Almost there
                            </Badge>
                            <h2 className="text-3xl font-black">Your Order</h2>
                            {table && (
                                <p className="mt-1 text-stone-500">
                                    Ordering for <strong>Table {table.table_number}</strong>
                                </p>
                            )}
                        </div>

                        <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
                            {/* Cart Items */}
                            <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
                                <div className="space-y-4">
                                    {cart.map((item) => (
                                        <div
                                            key={item.id}
                                            className="flex gap-4 rounded-xl border border-stone-100 bg-stone-50/50 p-4 transition hover:border-orange-200 hover:bg-orange-50/50"
                                        >
                                            <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl bg-stone-100">
                                                {item.image ? (
                                                    <img
                                                        src={`/storage/${item.image}`}
                                                        alt={item.name}
                                                        className="h-full w-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="flex h-full items-center justify-center text-stone-400">
                                                        <Utensils className="h-6 w-6" />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-start justify-between">
                                                    <h3 className="font-bold text-stone-900">{item.name}</h3>
                                                    <span className="whitespace-nowrap text-sm font-black text-orange-600">
                                                        {(Number(item.price) * item.quantity).toFixed(2)} ETB
                                                    </span>
                                                </div>
                                                <p className="mt-0.5 text-xs text-stone-500">
                                                    {Number(item.price).toFixed(2)} ETB each
                                                </p>
                                                <div className="mt-3 flex items-center gap-3">
                                                    <button
                                                        type="button"
                                                        onClick={() => decreaseQuantity(item.id)}
                                                        className="flex h-7 w-7 items-center justify-center rounded-full border border-stone-200 text-stone-600 transition hover:border-orange-400 hover:bg-orange-50"
                                                    >
                                                        <Minus className="h-3 w-3" />
                                                    </button>
                                                    <span className="w-6 text-center text-sm font-bold">{item.quantity}</span>
                                                    <button
                                                        type="button"
                                                        onClick={() => increaseQuantity(item.id)}
                                                        className="flex h-7 w-7 items-center justify-center rounded-full bg-stone-900 text-white transition hover:bg-orange-500"
                                                    >
                                                        <Plus className="h-3 w-3" />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => removeFromCart(item.id)}
                                                        className="ml-2 text-xs font-semibold text-stone-400 transition hover:text-red-500"
                                                    >
                                                        Remove
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Order Summary */}
                            <div className="h-fit rounded-2xl bg-stone-900 p-7 text-white shadow-xl lg:sticky lg:top-24">
                                <h3 className="flex items-center gap-2 text-xl font-black">
                                    <ShoppingBag className="h-5 w-5 text-orange-400" />
                                    Order Summary
                                </h3>

                                <div className="mt-6 space-y-3 border-b border-white/10 pb-6">
                                    <div className="flex justify-between text-sm text-stone-300">
                                        <span>Items ({cartQuantity})</span>
                                        <span>{cartTotal.toFixed(2)} ETB</span>
                                    </div>
                                    <div className="flex justify-between text-sm text-stone-300">
                                        <span>Table</span>
                                        <span>{table ? `Table ${table.table_number}` : 'Not selected'}</span>
                                    </div>
                                </div>

                                <div className="mt-6 flex items-center justify-between">
                                    <span className="text-lg font-bold">Total</span>
                                    <span className="text-2xl font-black text-orange-400">
                                        {cartTotal.toFixed(2)} ETB
                                    </span>
                                </div>

                                <Button
                                    type="button"
                                    onClick={placeOrder}
                                    disabled={isPlacingOrder}
                                    className="mt-7 w-full"
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

                                <p className="mt-4 text-center text-xs text-stone-500">
                                    Your order will be sent directly to the kitchen.
                                </p>
                            </div>
                        </div>
                    </section>
                )}
            </main>

            {/* Mobile: Floating Cart Button */}
            {cart.length > 0 && (
                <div className="fixed inset-x-4 bottom-4 z-40 sm:hidden">
                    <button
                        type="button"
                        onClick={() => setCartOpen(true)}
                        className="flex w-full items-center justify-between gap-3 rounded-2xl bg-stone-900 px-5 py-4 text-white shadow-2xl transition hover:bg-orange-500 active:scale-[0.98]"
                    >
                        <span className="flex items-center gap-2">
                            <ShoppingBag className="h-5 w-5" />
                            <span className="text-sm font-bold">View Order</span>
                        </span>
                        <span className="flex items-center gap-3">
                            <span className="text-sm text-stone-300">
                                {cartQuantity} item{cartQuantity !== 1 ? 's' : ''}
                            </span>
                            <span className="text-lg font-black text-orange-400">{cartTotal.toFixed(2)} ETB</span>
                        </span>
                    </button>
                </div>
            )}

            {/* My Booking Modal */}
            {showMyBooking && (
                <MyBooking onClose={() => setShowMyBooking(false)} />
            )}

            {/* ================= FOOTER ================= */}
            <footer className="mt-20 border-t border-stone-200 bg-white">
                <div className="mx-auto max-w-7xl px-5 py-10 text-center lg:px-8">
                    <p className="text-xl font-black">
                        DINE<span className="text-orange-500">.</span>
                    </p>
                    <p className="mt-2 text-sm text-stone-500">
                        Thank you for dining with us. We hope to see you again!
                    </p>
                    <div className="mt-4 flex items-center justify-center gap-4 text-xs text-stone-400">
                        <span>© 2026 DINE Restaurant</span>
                        <span>·</span>
                        <span>Digital Menu System</span>
                    </div>
                </div>
            </footer>
        </div>
    );
}
