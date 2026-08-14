import { Head, Link, usePage } from '@inertiajs/react';
import { CheckCircle2, Copy } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { login } from '@/routes';
import menuRoutes from '@/routes/menu';

export default function LandingPage() {
    const { auth } = usePage().props;
    const [scrolled, setScrolled] = useState(false);
    const [showMemberForm, setShowMemberForm] = useState(false);
    const [showRegistrationSuccess, setShowRegistrationSuccess] =
        useState(false);
    const [registeredCustomerPhone, setRegisteredCustomerPhone] = useState('');
    const [copied, setCopied] = useState(false);

    const [memberData, setMemberData] = useState({
        name: '',
        phone: '',
        email: '',
    });
    const [isRegistering, setIsRegistering] = useState(false);
    const [memberErrors, setMemberErrors] = useState<Record<string, string>>(
        {},
    );

    const resetMemberForm = () => {
        setMemberData({ name: '', phone: '', email: '' });
        setMemberErrors({});
    };

    const handleRegisterMember = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!memberData.name.trim() || !memberData.phone.trim()) {
            return;
        }

        setIsRegistering(true);

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
                setMemberErrors(errorData.errors || {});
                const firstError =
                    (Object.values(errorData.errors)[0] as string[])?.[0] ||
                    'Validation failed.';
                alert(firstError);
                setIsRegistering(false);

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
                alert(data.message || 'Registration failed. Please try again.');
            }
        } catch (e) {
            console.error(e);
            alert('Registration failed. Please try again.');
        } finally {
            setIsRegistering(false);
        }
    };

    const handleCopyPhone = async () => {
        try {
            await navigator.clipboard.writeText(registeredCustomerPhone);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            const textArea = document.createElement('textarea');
            textArea.value = registeredCustomerPhone;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 50);
        window.addEventListener('scroll', handleScroll);

        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <>
            <Head title="Digital Menu Management System" />
            <div className="min-h-screen bg-white">
                {/* Navigation */}
                <nav
                    className={`fixed top-0 right-0 left-0 z-50 transition-all duration-300 ${
                        scrolled
                            ? 'bg-white/95 shadow-sm backdrop-blur-md'
                            : 'bg-transparent'
                    }`}
                >
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <div className="flex h-16 items-center justify-between lg:h-20">
                            <Link href="/" className="flex items-center gap-2">
                                <img
                                    src="/mamaskitchen-logo.png"
                                    alt="Mama's Kitchen"
                                    className="h-12 w-auto object-contain drop-shadow-sm"
                                />
                            </Link>
                            <div className="hidden items-center gap-8 md:flex">
                                <a
                                    href="#features"
                                    className="text-sm font-medium text-gray-600 transition-colors hover:text-gray-900"
                                >
                                    Features
                                </a>
                                <a
                                    href="#how-it-works"
                                    className="text-sm font-medium text-gray-600 transition-colors hover:text-gray-900"
                                >
                                    How It Works
                                </a>
                                <a
                                    href="#menu"
                                    className="text-sm font-medium text-gray-600 transition-colors hover:text-gray-900"
                                >
                                    Menu
                                </a>
                                <a
                                    href="#benefits"
                                    className="text-sm font-medium text-gray-600 transition-colors hover:text-gray-900"
                                >
                                    Benefits
                                </a>
                            </div>
                            <div className="flex items-center gap-3">
                                {auth.user ? (
                                    <Link
                                        href="/dashboard"
                                        className="inline-flex items-center rounded-full bg-gradient-to-r from-red-400 to-red-600 px-4 py-2 text-sm font-medium text-white transition-all duration-300 hover:shadow-lg hover:shadow-red-200"
                                    >
                                        Dashboard
                                    </Link>
                                ) : (
                                    <>
                                        <Link
                                            href={login()}
                                            className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:text-gray-900"
                                        >
                                            Log in
                                        </Link>
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setShowMemberForm(true)
                                            }
                                            className="inline-flex items-center rounded-full bg-gradient-to-r from-red-400 to-red-600 px-4 py-2 text-sm font-medium text-white transition-all duration-300 hover:shadow-lg hover:shadow-red-200"
                                        >
                                            Become a Member
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </nav>

                {/* Hero Section */}
                <HeroSection />

                {/* Features Section */}
                <FeaturesSection />

                {/* How It Works */}
                <HowItWorksSection />

                {/* Menu Preview */}
                <MenuPreviewSection />

                {/* Benefits Section */}
                <BenefitsSection />

                {/* Customer Experience */}
                <CustomerExperienceSection />

                {/* CTA Section */}
                <CTASection />

                {/* Footer */}
                <FooterSection />
            </div>

            {/* ================= MEMBER REGISTRATION MODAL ================= */}
            {showMemberForm && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 p-4">
                    <div className="w-full max-w-md rounded-3xl bg-white p-7 shadow-2xl">
                        {/* Modal Header */}
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="font-semibold tracking-widest text-red-500 uppercase">
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
                                        setMemberData({
                                            ...memberData,
                                            name: e.target.value,
                                        })
                                    }
                                    placeholder="Enter your full name"
                                    className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-red-500"
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
                                        setMemberData({
                                            ...memberData,
                                            phone: e.target.value,
                                        })
                                    }
                                    placeholder="Enter your phone number"
                                    className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-red-500"
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
                                        setMemberData({
                                            ...memberData,
                                            email: e.target.value,
                                        })
                                    }
                                    placeholder="Enter your email address"
                                    className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-red-500"
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
                                    className="flex-1 rounded-xl bg-gradient-to-r from-red-500 to-red-600 px-5 py-3.5 font-bold text-white shadow-lg shadow-red-500/25 transition-all duration-300 hover:from-red-600 hover:to-red-700 hover:shadow-xl hover:shadow-red-500/40 disabled:opacity-60"
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

            {/* ================= REGISTRATION SUCCESS MODAL ================= */}
            {showRegistrationSuccess && (
                <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/60 p-4">
                    <div className="w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-2xl">
                        {/* Success Icon */}
                        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
                            <CheckCircle2 className="h-10 w-10 text-green-600" />
                        </div>

                        {/* Title */}
                        <h2 className="mt-5 text-2xl font-black text-gray-900">
                            Registration Successful
                        </h2>

                        <p className="mt-3 text-sm leading-relaxed text-gray-500">
                            Congratulations! You have successfully become a
                            member.
                        </p>

                        <p className="mt-1 text-sm text-gray-500">
                            Your Phone Number is:
                        </p>

                        {/* Phone Number Box */}
                        <div className="mx-auto mt-4 max-w-[220px] rounded-xl border-2 border-dashed border-red-300 bg-red-50 px-6 py-4">
                            <p className="mb-1 text-xs font-semibold tracking-wider text-red-500 uppercase">
                                Phone Number
                            </p>
                            <p className="font-mono text-2xl font-black tracking-wider text-red-600">
                                {registeredCustomerPhone}
                            </p>
                        </div>

                        <p className="mt-4 text-xs leading-relaxed text-gray-400">
                            Please save this phone number. You will need it for
                            future bookings, orders, and member verification.
                        </p>

                        {/* Buttons */}
                        <div className="mt-6 flex gap-3">
                            <button
                                type="button"
                                onClick={handleCopyPhone}
                                className="flex flex-1 items-center justify-center gap-2 rounded-xl border-2 border-red-500 bg-white px-5 py-3.5 font-bold text-red-600 transition hover:bg-red-50"
                            >
                                {copied ? (
                                    <>
                                        <CheckCircle2 className="h-4 w-4" />
                                        Copied!
                                    </>
                                ) : (
                                    <>
                                        <Copy className="h-4 w-4" />
                                        Copy Phone
                                    </>
                                )}
                            </button>

                            <Link
                                href={menuRoutes.index()}
                                className="inline-flex flex-1 items-center justify-center rounded-xl bg-gradient-to-r from-red-500 to-red-600 px-5 py-3.5 font-bold text-white shadow-lg shadow-red-500/25 transition-all duration-300 hover:from-red-600 hover:to-red-700 hover:shadow-xl hover:shadow-red-500/40"
                            >
                                Continue to Menu
                            </Link>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

function HeroSection() {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        setIsVisible(true);
    }, []);

    return (
        <section className="relative flex min-h-screen items-center overflow-hidden bg-gradient-to-br from-red-50 via-white to-red-50">
            {/* Background decoration */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -top-40 -right-40 h-80 w-80 animate-pulse rounded-full bg-red-200 opacity-30 mix-blend-multiply blur-3xl filter" />
                <div
                    className="absolute -bottom-40 -left-40 h-80 w-80 animate-pulse rounded-full bg-red-200 opacity-30 mix-blend-multiply blur-3xl filter"
                    style={{ animationDelay: '1s' }}
                />
            </div>

            <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-32">
                <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
                    {/* Left Content */}
                    <div
                        className={`space-y-8 transition-all duration-1000 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}
                    >
                        <div className="inline-flex items-center gap-2 rounded-full bg-red-100 px-4 py-2 text-sm font-medium text-red-700">
                            <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
                            Digital Menu Management System
                        </div>
                        <h1 className="text-4xl leading-tight font-bold text-gray-900 sm:text-5xl lg:text-6xl">
                            Digital Menu.
                            <span className="block bg-gradient-to-r from-red-400 to-red-600 bg-clip-text text-transparent">
                                Smart Ordering.
                            </span>
                            Better Dining Experience.
                        </h1>
                        <p className="max-w-lg text-lg leading-relaxed text-gray-600 sm:text-xl">
                            Manage your restaurant menu digitally, allow
                            customers to browse meals, reserve tables, and place
                            orders easily.
                        </p>
                        <div className="flex flex-wrap gap-4">
                            <Link
                                href={menuRoutes.index()}
                                className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-red-400 to-red-600 px-8 py-4 font-semibold text-white transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-red-200"
                            >
                                Order Now
                                <svg
                                    className="h-5 w-5"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M17 8l4 4m0 0l-4 4m4-4H3"
                                    />
                                </svg>
                            </Link>
                        </div>
                    </div>

                    {/* Right Content - Hero Image with floating cards */}
                    <div
                        className={`relative transition-all delay-300 duration-1000 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}
                    >
                        <div className="relative">
                            {/* Main Image */}
                            <div className="relative overflow-hidden rounded-2xl shadow-2xl">
                                <img
                                    src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&q=80"
                                    alt="Restaurant interior"
                                    className="h-[400px] w-full object-cover lg:h-[500px]"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                            </div>

                            {/* Floating Menu Card */}
                            <div className="animate-float absolute -bottom-6 -left-6 rounded-xl bg-white p-4 shadow-xl">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-red-100">
                                        <svg
                                            className="h-6 w-6 text-red-600"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M4 6h16M4 12h16M4 18h16"
                                            />
                                        </svg>
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-gray-900">
                                            Digital Menu
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            Browse items
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Floating Order Notification */}
                            <div
                                className="animate-float absolute -top-4 -right-4 rounded-xl bg-white p-4 shadow-xl"
                                style={{ animationDelay: '2s' }}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
                                        <svg
                                            className="h-5 w-5 text-green-600"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                            />
                                        </svg>
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-gray-900">
                                            Order #1245
                                        </p>
                                        <p className="text-xs text-green-600">
                                            Ready to serve
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Floating Rating Card */}
                            <div
                                className="animate-float absolute -right-8 bottom-12 rounded-xl bg-white p-4 shadow-xl"
                                style={{ animationDelay: '1s' }}
                            >
                                <div className="flex items-center gap-2">
                                    <div className="flex text-yellow-400">
                                        {[1, 2, 3, 4, 5].map((i) => (
                                            <svg
                                                key={i}
                                                className="h-4 w-4"
                                                fill="currentColor"
                                                viewBox="0 0 20 20"
                                            >
                                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                            </svg>
                                        ))}
                                    </div>
                                    <span className="text-sm font-semibold text-gray-900">
                                        4.9
                                    </span>
                                </div>
                                <p className="mt-1 text-xs text-gray-500">
                                    Excellent service
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

function FeaturesSection() {
    const features = [
        {
            icon: (
                <svg
                    className="h-7 w-7"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M4 6h16M4 12h16M4 18h16"
                    />
                </svg>
            ),
            title: 'Digital Menu',
            description:
                'Customers can explore menu items with images, prices, and descriptions.',
            color: 'from-red-400 to-red-600',
            bgColor: 'bg-red-50',
        },
        {
            icon: (
                <svg
                    className="h-7 w-7"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z"
                    />
                </svg>
            ),
            title: 'Smart Ordering',
            description:
                'Customers can order directly from their mobile devices with ease.',
            color: 'from-green-400 to-green-600',
            bgColor: 'bg-green-50',
        },
        {
            icon: (
                <svg
                    className="h-7 w-7"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                </svg>
            ),
            title: 'Table Reservation',
            description:
                'Customers can reserve available tables easily online.',
            color: 'from-blue-400 to-blue-600',
            bgColor: 'bg-blue-50',
        },
        {
            icon: (
                <svg
                    className="h-7 w-7"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                    />
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                </svg>
            ),
            title: 'Restaurant Management',
            description:
                'Managers can control menus, orders, and staff efficiently.',
            color: 'from-purple-400 to-purple-600',
            bgColor: 'bg-purple-50',
        },
    ];

    const [isVisible, setIsVisible] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                }
            },
            { threshold: 0.1 },
        );

        if (ref.current) {
            observer.observe(ref.current);
        }

        return () => observer.disconnect();
    }, []);

    return (
        <section id="features" ref={ref} className="bg-white py-20 lg:py-28">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="mx-auto mb-16 max-w-3xl text-center">
                    <h2 className="mb-4 text-3xl font-bold text-gray-900 sm:text-4xl">
                        Everything You Need to
                        <span className="block bg-gradient-to-r from-red-400 to-red-600 bg-clip-text text-transparent">
                            Manage Your Restaurant
                        </span>
                    </h2>
                    <p className="text-lg text-gray-600">
                        Powerful features designed to streamline your restaurant
                        operations and enhance customer experience.
                    </p>
                </div>

                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 lg:gap-8">
                    {features.map((feature, index) => (
                        <div
                            key={index}
                            className={`group relative rounded-2xl border border-gray-100 bg-white p-8 transition-all duration-500 hover:-translate-y-2 hover:border-transparent hover:shadow-xl ${
                                isVisible
                                    ? 'translate-y-0 opacity-100'
                                    : 'translate-y-10 opacity-0'
                            }`}
                            style={{ transitionDelay: `${index * 100}ms` }}
                        >
                            <div
                                className={`h-14 w-14 ${feature.bgColor} mb-6 flex items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110`}
                            >
                                <div
                                    className={`bg-gradient-to-r bg-clip-text text-transparent ${feature.color}`}
                                >
                                    {feature.icon}
                                </div>
                            </div>
                            <h3 className="mb-3 text-lg font-semibold text-gray-900">
                                {feature.title}
                            </h3>
                            <p className="text-sm leading-relaxed text-gray-600">
                                {feature.description}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

function HowItWorksSection() {
    const steps = [
        {
            step: 1,
            title: 'Scan or Open Menu',
            description:
                'Customers scan the QR code or open the digital menu on their mobile device.',
            icon: (
                <svg
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
                    />
                </svg>
            ),
        },
        {
            step: 2,
            title: 'Select Food Items',
            description:
                'Browse the menu, view descriptions and prices, and add items to your cart.',
            icon: (
                <svg
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                    />
                </svg>
            ),
        },
        {
            step: 3,
            title: 'Place Order or Book',
            description:
                'Submit your order or reserve a table at your preferred time.',
            icon: (
                <svg
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                </svg>
            ),
        },
        {
            step: 4,
            title: 'Restaurant Serves',
            description:
                'The restaurant prepares and serves your order fresh and hot.',
            icon: (
                <svg
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M21 15.546c-.523 0-1.046.151-1.5.454a2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.704 2.704 0 01-3 0A2.701 2.701 0 003 15.546M21 15.546v-3.375A2.751 2.751 0 0018.25 9.75h-12.5A2.751 2.751 0 003 12.171v3.375m18 0v.75A2.25 2.25 0 0118.75 18h-13.5A2.25 2.25 0 013 16.5v-.75"
                    />
                </svg>
            ),
        },
    ];

    const [isVisible, setIsVisible] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                }
            },
            { threshold: 0.1 },
        );

        if (ref.current) {
            observer.observe(ref.current);
        }

        return () => observer.disconnect();
    }, []);

    return (
        <section
            id="how-it-works"
            ref={ref}
            className="bg-gradient-to-br from-red-50 via-white to-red-50 py-20 lg:py-28"
        >
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="mx-auto mb-16 max-w-3xl text-center">
                    <h2 className="mb-4 text-3xl font-bold text-gray-900 sm:text-4xl">
                        How Mama's Kitchen
                        <span className="block bg-gradient-to-r from-red-400 to-red-600 bg-clip-text text-transparent">
                            Works
                        </span>
                    </h2>
                    <p className="text-lg text-gray-600">
                        From browsing the menu to enjoying your meal — it's that
                        simple.
                    </p>
                </div>

                <div className="relative grid gap-8 md:grid-cols-4 lg:gap-12">
                    {/* Connecting line */}
                    <div className="absolute top-12 right-[12.5%] left-[12.5%] hidden h-0.5 bg-gradient-to-r from-red-300 via-red-400 to-red-500 md:block" />

                    {steps.map((item, index) => (
                        <div
                            key={index}
                            className={`relative flex flex-col items-center text-center ${
                                isVisible
                                    ? 'translate-y-0 opacity-100'
                                    : 'translate-y-10 opacity-0'
                            }`}
                            style={{
                                transition: `all 0.6s ease-out ${index * 0.15}s`,
                            }}
                        >
                            <div className="relative z-10 mb-6 flex h-24 w-24 items-center justify-center rounded-2xl border-2 border-red-100 bg-white shadow-lg transition-all duration-300 group-hover:border-red-400">
                                <div className="absolute -top-3 -right-3 flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-red-400 to-red-600 text-sm font-bold text-white shadow-lg">
                                    {item.step}
                                </div>
                                <div className="text-red-500">{item.icon}</div>
                            </div>
                            <h3 className="mb-2 text-lg font-semibold text-gray-900">
                                {item.title}
                            </h3>
                            <p className="max-w-xs text-sm leading-relaxed text-gray-600">
                                {item.description}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

function MenuPreviewSection() {
    const placeholderItems = [
        {
            name: 'Grilled Salmon',
            category: 'Main Course',
            price: '$24.99',
            description:
                'Fresh Atlantic salmon with herbs and lemon butter sauce.',
            image: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=300&q=80',
        },
        {
            name: 'Caesar Salad',
            category: 'Starters',
            price: '$12.99',
            description: 'Crisp romaine lettuce with parmesan and croutons.',
            image: 'https://images.unsplash.com/photo-1546793665-c74683f339c1?w=300&q=80',
        },
        {
            name: 'Beef Steak',
            category: 'Main Course',
            price: '$32.99',
            description:
                'Prime cut grilled to perfection with seasonal vegetables.',
            image: 'https://images.unsplash.com/photo-1600891964092-4316c288032e?w=300&q=80',
        },
        {
            name: 'Chocolate Lava Cake',
            category: 'Desserts',
            price: '$9.99',
            description: 'Rich dark chocolate cake with a molten center.',
            image: 'https://images.unsplash.com/photo-1624353365286-3f8d62daad51?w=300&q=80',
        },
    ];

    const [isVisible, setIsVisible] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                }
            },
            { threshold: 0.1 },
        );

        if (ref.current) {
            observer.observe(ref.current);
        }

        return () => observer.disconnect();
    }, []);

    return (
        <section id="menu" ref={ref} className="bg-white py-20 lg:py-28">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="mx-auto mb-16 max-w-3xl text-center">
                    <h2 className="mb-4 text-3xl font-bold text-gray-900 sm:text-4xl">
                        Explore Our
                        <span className="block bg-gradient-to-r from-red-400 to-red-600 bg-clip-text text-transparent">
                            Featured Menu
                        </span>
                    </h2>
                    <p className="text-lg text-gray-600">
                        Discover our most popular dishes, carefully prepared by
                        our expert chefs.
                    </p>
                </div>

                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
                    {placeholderItems.map((item, index) => (
                        <div
                            key={index}
                            className={`group overflow-hidden rounded-2xl border border-gray-100 bg-white transition-all duration-500 hover:-translate-y-2 hover:shadow-xl ${
                                isVisible
                                    ? 'translate-y-0 opacity-100'
                                    : 'translate-y-10 opacity-0'
                            }`}
                            style={{ transitionDelay: `${index * 100}ms` }}
                        >
                            <div className="relative h-48 overflow-hidden">
                                <img
                                    src={item.image}
                                    alt={item.name}
                                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                                <span className="absolute top-3 left-3 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-gray-700 backdrop-blur-sm">
                                    {item.category}
                                </span>
                            </div>
                            <div className="p-5">
                                <div className="mb-2 flex items-center justify-between">
                                    <h3 className="text-lg font-semibold text-gray-900">
                                        {item.name}
                                    </h3>
                                    <span className="text-lg font-bold text-red-600">
                                        {item.price}
                                    </span>
                                </div>
                                <p className="mb-4 line-clamp-2 text-sm text-gray-600">
                                    {item.description}
                                </p>
                                <Link
                                    href={menuRoutes.index()}
                                    className="inline-flex items-center gap-2 text-sm font-semibold text-red-600 transition-colors hover:text-red-700"
                                >
                                    Order Now
                                    <svg
                                        className="h-4 w-4"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M17 8l4 4m0 0l-4 4m4-4H3"
                                        />
                                    </svg>
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-12 text-center">
                    <Link
                        href={menuRoutes.index()}
                        className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-red-400 to-red-600 px-8 py-4 font-semibold text-white transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-red-200"
                    >
                        View Full Menu
                        <svg
                            className="h-5 w-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M17 8l4 4m0 0l-4 4m4-4H3"
                            />
                        </svg>
                    </Link>
                </div>
            </div>
        </section>
    );
}

function BenefitsSection() {
    const benefits = [
        'Reduce waiting time for customers',
        'Digital ordering experience',
        'Manage tables easily',
        'Track customer orders in real-time',
        'Improve customer satisfaction',
        'Manage restaurant operations efficiently',
    ];

    const [isVisible, setIsVisible] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                }
            },
            { threshold: 0.1 },
        );

        if (ref.current) {
            observer.observe(ref.current);
        }

        return () => observer.disconnect();
    }, []);

    return (
        <section
            id="benefits"
            ref={ref}
            className="bg-gradient-to-br from-red-50 via-white to-red-50 py-20 lg:py-28"
        >
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
                    {/* Left - Image */}
                    <div
                        className={`transition-all duration-1000 ${isVisible ? 'translate-x-0 opacity-100' : '-translate-x-10 opacity-0'}`}
                    >
                        <div className="relative overflow-hidden rounded-2xl shadow-2xl">
                            <img
                                src="https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&q=80"
                                alt="Restaurant dining experience"
                                className="h-[400px] w-full object-cover lg:h-[500px]"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                        </div>
                    </div>

                    {/* Right - Content */}
                    <div
                        className={`space-y-8 transition-all delay-200 duration-1000 ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-10 opacity-0'}`}
                    >
                        <h2 className="text-3xl leading-tight font-bold text-gray-900 sm:text-4xl">
                            Everything Your
                            <span className="block bg-gradient-to-r from-red-400 to-red-600 bg-clip-text text-transparent">
                                Restaurant Needs
                            </span>
                        </h2>

                        <div className="space-y-4">
                            {benefits.map((benefit, index) => (
                                <div
                                    key={index}
                                    className={`flex items-center gap-4 transition-all duration-500 ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-10 opacity-0'}`}
                                    style={{
                                        transitionDelay: `${300 + index * 100}ms`,
                                    }}
                                >
                                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-green-100">
                                        <svg
                                            className="h-4 w-4 text-green-600"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2.5}
                                                d="M5 13l4 4L19 7"
                                            />
                                        </svg>
                                    </div>
                                    <span className="font-medium text-gray-700">
                                        {benefit}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

function CustomerExperienceSection() {
    const experiences = [
        {
            icon: (
                <svg
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                </svg>
            ),
            title: 'Fast Ordering',
            description:
                'Place your order in seconds with our intuitive digital menu interface.',
            color: 'from-red-400 to-red-600',
            bgColor: 'bg-red-50',
        },
        {
            icon: (
                <svg
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                </svg>
            ),
            title: 'Easy Booking',
            description:
                'Reserve your table anytime, anywhere with just a few taps.',
            color: 'from-green-400 to-green-600',
            bgColor: 'bg-green-50',
        },
        {
            icon: (
                <svg
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                </svg>
            ),
            title: 'Real-time Updates',
            description:
                'Get instant notifications about your order status and table availability.',
            color: 'from-blue-400 to-blue-600',
            bgColor: 'bg-blue-50',
        },
        {
            icon: (
                <svg
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                </svg>
            ),
            title: 'Better Dining Experience',
            description:
                'Enjoy a seamless dining experience from start to finish.',
            color: 'from-purple-400 to-purple-600',
            bgColor: 'bg-purple-50',
        },
    ];

    const [isVisible, setIsVisible] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                }
            },
            { threshold: 0.1 },
        );

        if (ref.current) {
            observer.observe(ref.current);
        }

        return () => observer.disconnect();
    }, []);

    return (
        <section ref={ref} className="bg-white py-20 lg:py-28">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="mx-auto mb-16 max-w-3xl text-center">
                    <h2 className="mb-4 text-3xl font-bold text-gray-900 sm:text-4xl">
                        Amazing Customer
                        <span className="block bg-gradient-to-r from-red-400 to-red-600 bg-clip-text text-transparent">
                            Experience
                        </span>
                    </h2>
                    <p className="text-lg text-gray-600">
                        We make dining out effortless and enjoyable for every
                        customer.
                    </p>
                </div>

                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
                    {experiences.map((item, index) => (
                        <div
                            key={index}
                            className={`group relative rounded-2xl border border-gray-100 bg-white p-8 text-center transition-all duration-500 hover:-translate-y-2 hover:border-transparent hover:shadow-xl ${
                                isVisible
                                    ? 'translate-y-0 opacity-100'
                                    : 'translate-y-10 opacity-0'
                            }`}
                            style={{ transitionDelay: `${index * 100}ms` }}
                        >
                            <div
                                className={`h-16 w-16 ${item.bgColor} mx-auto mb-6 flex items-center justify-center rounded-2xl transition-transform duration-300 group-hover:scale-110`}
                            >
                                <div
                                    className={`bg-gradient-to-r bg-clip-text text-transparent ${item.color}`}
                                >
                                    {item.icon}
                                </div>
                            </div>
                            <h3 className="mb-3 text-lg font-semibold text-gray-900">
                                {item.title}
                            </h3>
                            <p className="text-sm leading-relaxed text-gray-600">
                                {item.description}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

function CTASection() {
    return (
        <section className="relative overflow-hidden py-20 lg:py-28">
            {/* Background with gradient */}
            <div className="absolute inset-0 bg-gradient-to-r from-red-500 via-red-600 to-red-700" />
            <div className="absolute inset-0">
                <div className="absolute top-0 left-0 h-full w-full bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.1),transparent_50%)]" />
                <div className="absolute top-0 right-0 h-full w-full bg-[radial-gradient(circle_at_70%_50%,rgba(255,255,255,0.1),transparent_50%)]" />
            </div>

            {/* Decorative circles */}
            <div className="absolute top-10 left-10 h-32 w-32 rounded-full border border-white/10" />
            <div className="absolute right-10 bottom-10 h-48 w-48 rounded-full border border-white/10" />

            <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
                <h2 className="mb-6 text-3xl leading-tight font-bold text-white sm:text-4xl lg:text-5xl">
                    Ready to Transform Your
                    <span className="block">Restaurant Experience?</span>
                </h2>
                <p className="mx-auto mb-0 max-w-2xl text-lg text-red-100 sm:text-xl">
                    Join thousands of restaurants using @ to streamline their
                    operations and delight their customers.
                </p>
            </div>
        </section>
    );
}

function FooterSection() {
    return (
        <footer className="bg-gray-900 text-gray-300">
            <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
                <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-3">
                    {/* Brand */}
                    <div>
                        <div className="mb-6 flex items-center gap-2">
                            <img
                                src="/mamaskitchen-logo.png"
                                alt="Mama's Kitchen"
                                className="h-10 w-auto object-contain opacity-90 brightness-0 invert"
                            />
                        </div>
                        <p className="mb-6 text-sm leading-relaxed text-gray-400">
                            Digital Menu Management System — transforming
                            restaurant operations with smart digital solutions.
                        </p>
                        <div className="flex gap-4">
                            {[
                                {
                                    name: 'facebook',
                                    path: 'M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z',
                                },
                                {
                                    name: 'twitter',
                                    path: 'M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z',
                                },
                                {
                                    name: 'instagram',
                                    path: 'M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.899 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.899-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06l.045.03zm0 2.16c-3.179 0-5.76 2.581-5.76 5.76s2.581 5.76 5.76 5.76 5.76-2.581 5.76-5.76-2.581-5.76-5.76-5.76zm0 9.52c-2.073 0-3.76-1.686-3.76-3.76s1.687-3.76 3.76-3.76 3.76 1.687 3.76 3.76-1.687 3.76-3.76 3.76zm5.86-9.82a1.44 1.44 0 11-2.88 0 1.44 1.44 0 012.88 0z',
                                },
                            ].map((social) => (
                                <a
                                    key={social.name}
                                    href="#"
                                    className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-800 transition-colors duration-300 hover:bg-red-600"
                                >
                                    <svg
                                        className="h-5 w-5"
                                        fill="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path d={social.path} />
                                    </svg>
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h3 className="mb-4 font-semibold text-white">
                            Quick Links
                        </h3>
                        <ul className="space-y-3">
                            {[
                                { name: 'Home', href: '/' },
                                { name: 'Menu', href: menuRoutes.index() },
                                { name: 'About', href: '#' },
                                { name: 'Contact', href: '#' },
                            ].map((link) => (
                                <li key={link.name}>
                                    <Link
                                        href={link.href}
                                        className="text-sm text-gray-400 transition-colors duration-300 hover:text-red-400"
                                    >
                                        {link.name}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Contact */}
                    <div>
                        <h3 className="mb-4 font-semibold text-white">
                            Contact Info
                        </h3>
                        <ul className="space-y-3 text-sm text-gray-400">
                            <li className="flex items-start gap-3">
                                <svg
                                    className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-500"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={1.5}
                                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                                    />
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={1.5}
                                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                                    />
                                </svg>
                                <span>
                                    123 Restaurant Street, Food City, FC 12345
                                </span>
                            </li>
                            <li className="flex items-center gap-3">
                                <svg
                                    className="h-5 w-5 flex-shrink-0 text-red-500"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={1.5}
                                        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                                    />
                                </svg>
                                <span>contact@dmms.com</span>
                            </li>
                            <li className="flex items-center gap-3">
                                <svg
                                    className="h-5 w-5 flex-shrink-0 text-red-500"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={1.5}
                                        d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                                    />
                                </svg>
                                <span>+1 (555) 123-4567</span>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Divider */}
                <div className="mt-12 border-t border-gray-800 pt-8">
                    <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
                        <p className="text-sm text-gray-500">
                            &copy; 2026 Digital Menu Management System. All
                            rights reserved.
                        </p>
                        <div className="flex gap-6">
                            <a
                                href="#"
                                className="text-sm text-gray-500 transition-colors hover:text-red-400"
                            >
                                Privacy Policy
                            </a>
                            <a
                                href="#"
                                className="text-sm text-gray-500 transition-colors hover:text-red-400"
                            >
                                Terms of Service
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
}
