import { Form, Head, router } from '@inertiajs/react';
import {
    ArrowRight,
    Lock,
    Sparkles,
    TrendingUp,
    UtensilsCrossed,
    ShoppingCart,
} from 'lucide-react';
import { useRef, useState } from 'react';

import PasswordChangeController from '@/actions/App/Http/Controllers/Auth/PasswordChangeController';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';

import { logout } from '@/routes';

const features = [
    {
        icon: UtensilsCrossed,
        title: 'Digital Menu',
        description: 'Manage your menu with ease',
    },
    {
        icon: ShoppingCart,
        title: 'Easy Ordering',
        description: 'Fast and seamless order management',
    },
    {
        icon: TrendingUp,
        title: 'Smart Reports',
        description: 'Track sales and performance',
    },
];

export default function PasswordChange() {
    const [processing, setProcessing] = useState(false);
    const [newPassword, setNewPassword] = useState('');
    const currentPasswordInput = useRef<HTMLInputElement>(null);
    const passwordInput = useRef<HTMLInputElement>(null);

    const cancel = () => {
        router.post(logout.url());
    };

    return (
        <>
            <Head title="Change Password" />

            <div className="fixed inset-0 z-50 min-h-screen w-screen overflow-y-auto bg-[#faf7f2]">
                <div className="flex min-h-screen w-full flex-col lg:flex-row">
                    {/* =====================================================
                    LEFT SIDE - FOOD IMAGE / RESTAURANT EXPERIENCE
                ====================================================== */}
                    <div className="relative hidden min-h-screen overflow-hidden lg:flex lg:w-[58%] xl:w-[60%]">
                        {/* Food Image */}
                        <img
                            src="https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=1800&q=85"
                            alt="Beautifully prepared restaurant food"
                            className="absolute inset-0 h-full w-full object-cover"
                        />

                        {/* Dark warm overlay */}
                        <div className="absolute inset-0 bg-gradient-to-br from-[#211b17]/95 via-[#211b17]/65 to-red-950/40" />

                        {/* Extra warm overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-[#211b17]/95 via-transparent to-[#211b17]/30" />

                        {/* Decorative warm glow */}
                        <div className="absolute -top-32 -left-32 h-[500px] w-[500px] rounded-full bg-red-500/20 blur-3xl" />

                        <div className="absolute -right-20 -bottom-40 h-[500px] w-[500px] rounded-full bg-red-500/20 blur-3xl" />

                        {/* Content */}
                        <div className="relative z-10 flex min-h-screen w-full flex-col justify-between p-10 xl:p-16">
                            {/* Top Icon */}
                            <div className="flex items-center">
                                <div className="flex h-12 w-12 items-center justify-center rounded-2xl shadow-xl shadow-red-900/30">
                                    <img
                                        src="/mamaskitchen-logo.png"
                                        alt="Mama's Kitchen"
                                        className="h-12 w-auto object-contain drop-shadow-sm"
                                    />
                                </div>
                            </div>

                            {/* Main Content */}
                            <div className="max-w-2xl py-12">
                                {/* Badge */}
                                <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium text-red-100 backdrop-blur-md">
                                    <Sparkles className="h-4 w-4 text-red-400" />
                                    <span>Restaurant Management Made Simple</span>
                                </div>

                                {/* Heading */}
                                <h1 className="max-w-2xl text-4xl leading-[1.1] font-bold tracking-tight text-white sm:text-5xl xl:text-6xl">
                                    Great Food.
                                    <br />
                                    <span className="text-red-400">
                                        Great Experience.
                                    </span>
                                </h1>

                                {/* Description */}
                                <p className="mt-6 max-w-xl text-base leading-7 text-stone-200 sm:text-lg">
                                    Everything your restaurant needs to manage
                                    menus, orders, tables, customers, and staff
                                    in one simple and powerful platform.
                                </p>

                                {/* Decorative Line */}
                                <div className="mt-8 flex items-center gap-2">
                                    <div className="h-1 w-16 rounded-full bg-red-500" />
                                    <div className="h-1 w-3 rounded-full bg-red-400/60" />
                                    <div className="h-1 w-2 rounded-full bg-red-300/40" />
                                </div>
                            </div>

                            {/* Features */}
                            <div className="grid w-full max-w-3xl grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
                                {features.map(({ icon: Icon, title, description }) => (
                                    <div
                                        key={title}
                                        className="group rounded-2xl border border-white/10 bg-black/20 p-4 backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:border-red-400/30 hover:bg-black/30"
                                    >
                                        <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/20 text-red-300 transition-all duration-300 group-hover:bg-red-500 group-hover:text-white">
                                            <Icon className="h-5 w-5" />
                                        </div>

                                        <p className="text-sm font-semibold text-white">
                                            {title}
                                        </p>

                                        <p className="mt-1 text-xs leading-5 text-stone-300">
                                            {description}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* =====================================================
                    RIGHT SIDE - CHANGE PASSWORD FORM
                ====================================================== */}
                    <div className="flex min-h-screen w-full items-center justify-center bg-[#faf7f2] px-6 py-12 sm:px-10 lg:w-[42%] lg:px-12 xl:px-20">
                        <div className="w-full max-w-lg">
                            {/* Header */}
                            <div className="mb-8">
                                <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-100 text-red-600">
                                    <img
                                        src="/mamaskitchen-logo.png"
                                        alt="Mama's Kitchen"
                                        className="h-12 w-auto object-contain drop-shadow-sm"
                                    />
                                </div>

                                <h2 className="text-3xl font-bold tracking-tight text-[#211b17] sm:text-4xl">
                                    Change Password
                                </h2>

                                <p className="mt-3 max-w-md text-sm leading-6 text-stone-500 sm:text-base">
                                    Enter your current password and choose a new
                                    one.
                                </p>
                            </div>

                            {/* Change Password Form */}
                            <Form
                                {...PasswordChangeController.update.form()}
                                options={{ preserveScroll: true }}
                                resetOnError={[
                                    'password',
                                    'password_confirmation',
                                    'current_password',
                                ]}
                                resetOnSuccess
                                onBefore={() => {
                                    setProcessing(true);

                                    return true;
                                }}
                                onFinish={() => setProcessing(false)}
                                onError={(errors) => {
                                    if (errors.current_password) {
                                        currentPasswordInput.current?.focus();
                                    } else if (errors.password) {
                                        passwordInput.current?.focus();
                                    }
                                }}
                                className="space-y-6"
                            >
                                {({ errors }) => (
                                    <>
                                        {/* Old Password */}
                                        <div className="space-y-2">
                                            <Label
                                                htmlFor="current_password"
                                                className="text-sm font-semibold text-[#211b17]"
                                            >
                                                Old Password
                                            </Label>

                                            <div className="group relative">
                                                <Lock className="pointer-events-none absolute top-1/2 left-4 z-10 h-5 w-5 -translate-y-1/2 text-stone-400 transition-colors group-focus-within:text-red-500" />

                                                <PasswordInput
                                                    id="current_password"
                                                    name="current_password"
                                                    ref={currentPasswordInput}
                                                    autoFocus
                                                    autoComplete="current-password"
                                                    required
                                                    tabIndex={1}
                                                    placeholder="Enter your current password"
                                                    className="h-13 w-full rounded-xl border-stone-200 bg-white pr-12 pl-12 text-sm shadow-sm transition-all placeholder:text-stone-400 focus:border-red-500 focus:ring-4 focus:ring-red-500/10"
                                                />
                                            </div>

                                            <InputError
                                                message={errors.current_password}
                                            />
                                        </div>

                                        {/* New Password */}
                                        <div className="space-y-2">
                                            <Label
                                                htmlFor="password"
                                                className="text-sm font-semibold text-[#211b17]"
                                            >
                                                New Password
                                            </Label>

                                            <div className="group relative">
                                                <Lock className="pointer-events-none absolute top-1/2 left-4 z-10 h-5 w-5 -translate-y-1/2 text-stone-400 transition-colors group-focus-within:text-red-500" />

                                                <PasswordInput
                                                    id="password"
                                                    name="password"
                                                    ref={passwordInput}
                                                    autoComplete="new-password"
                                                    required
                                                    tabIndex={2}
                                                    placeholder="Enter your new password"
                                                    className="h-13 w-full rounded-xl border-stone-200 bg-white pr-12 pl-12 text-sm shadow-sm transition-all placeholder:text-stone-400 focus:border-red-500 focus:ring-4 focus:ring-red-500/10"
                                                    onChange={(e) =>
                                                        setNewPassword(
                                                            e.target.value,
                                                        )
                                                    }
                                                />
                                            </div>

                                            <InputError
                                                message={errors.password}
                                            />

                                            {newPassword.length > 0 && (() => {
                                                const weakPasswords = [
                                                    'password',
                                                    '12345678',
                                                    'qwerty',
                                                    'admin123',
                                                    'password123',
                                                    '123456',
                                                    'letmein',
                                                    'welcome',
                                                    'abc123',
                                                    'iloveyou',
                                                ];
                                                const checks = [
                                                    {
                                                        label: '8+ characters',
                                                        valid:
                                                            newPassword.length >=
                                                            8,
                                                    },
                                                    {
                                                        label: 'Uppercase, lowercase & number',
                                                        valid:
                                                            /[A-Z]/.test(
                                                                newPassword,
                                                            ) &&
                                                            /[a-z]/.test(
                                                                newPassword,
                                                            ) &&
                                                            /[0-9]/.test(
                                                                newPassword,
                                                            ),
                                                    },
                                                    {
                                                        label: '1 special character',
                                                        valid: /[^A-Za-z0-9]/.test(
                                                            newPassword,
                                                        ),
                                                    },
                                                    {
                                                        label:
                                                            'Avoid common or easily guessed passwords',
                                                        valid: !weakPasswords.includes(
                                                            newPassword.toLowerCase(),
                                                        ),
                                                    },
                                                ];
                                                return (
                                                    <div className="mt-2 flex flex-wrap gap-1.5">
                                                        {checks.map(
                                                            (check) => (
                                                                <span
                                                                    key={
                                                                        check.label
                                                                    }
                                                                    className={
                                                                        'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] leading-none transition-colors ' +
                                                                        (check.valid
                                                                            ? 'border-green-200 bg-green-50 text-green-700'
                                                                            : 'border-stone-200 bg-stone-50 text-stone-400')
                                                                    }
                                                                >
                                                                    <span
                                                                        className={
                                                                            'h-1.5 w-1.5 rounded-full ' +
                                                                            (check.valid
                                                                                ? 'bg-green-500'
                                                                                : 'bg-stone-300')
                                                                        }
                                                                    />
                                                                    {check.label}
                                                                </span>
                                                            ),
                                                        )}
                                                    </div>
                                                );
                                            })()}
                                        </div>

                                        {/* Confirm Password */}
                                        <div className="space-y-2">
                                            <Label
                                                htmlFor="password_confirmation"
                                                className="text-sm font-semibold text-[#211b17]"
                                            >
                                                Confirm Password
                                            </Label>

                                            <div className="group relative">
                                                <Lock className="pointer-events-none absolute top-1/2 left-4 z-10 h-5 w-5 -translate-y-1/2 text-stone-400 transition-colors group-focus-within:text-red-500" />

                                                <PasswordInput
                                                    id="password_confirmation"
                                                    name="password_confirmation"
                                                    autoComplete="new-password"
                                                    required
                                                    tabIndex={3}
                                                    placeholder="Confirm your new password"
                                                    className="h-13 w-full rounded-xl border-stone-200 bg-white pr-12 pl-12 text-sm shadow-sm transition-all placeholder:text-stone-400 focus:border-red-500 focus:ring-4 focus:ring-red-500/10"
                                                />
                                            </div>

                                            <InputError
                                                message={
                                                    errors.password_confirmation
                                                }
                                            />
                                        </div>

                                        {/* Buttons */}
                                        <div className="flex items-center gap-4">
                                            <Button
                                                type="button"
                                                onClick={cancel}
                                                tabIndex={4}
                                                className="h-13 w-full rounded-xl border border-stone-200 bg-white text-sm font-semibold text-[#211b17] shadow-sm transition-all hover:bg-stone-50"
                                            >
                                                Cancel
                                            </Button>

                                            <Button
                                                type="submit"
                                                disabled={processing}
                                                tabIndex={5}
                                                className="group h-13 w-full rounded-xl bg-gradient-to-r from-red-500 to-red-600 text-sm font-semibold text-white shadow-lg shadow-red-500/20 transition-all duration-300 hover:from-red-600 hover:to-red-700 hover:shadow-xl hover:shadow-red-500/30"
                                            >
                                                {processing ? (
                                                    <>
                                                        <Spinner />
                                                        <span>Saving...</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <span>Save</span>

                                                        <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                                                    </>
                                                )}
                                            </Button>
                                        </div>
                                    </>
                                )}
                            </Form>

                            {/* Bottom Decoration */}
                            <div className="mt-10 flex items-center justify-center gap-3">
                                <div className="h-px w-16 bg-stone-200" />

                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-100">
                                    <UtensilsCrossed className="h-4 w-4 text-red-500" />
                                </div>

                                <div className="h-px w-16 bg-stone-200" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
