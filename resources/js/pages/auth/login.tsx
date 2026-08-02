import { Form, Head } from '@inertiajs/react';
import {
ArrowRight,
Check,
ChefHat,
Lock,
Mail,
ShoppingCart,
Sparkles,
TrendingUp,
UtensilsCrossed,
} from 'lucide-react';

import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';

import { register } from '@/routes';
import { store } from '@/routes/login';
import { request } from '@/routes/password';

type Props = {
status?: string;
canResetPassword: boolean;
};

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

export default function Login({ status, canResetPassword }: Props) {
return (
<> <Head title="Log in" />

```
        {/* 
            IMPORTANT:
            The fixed inset-0 and w-screen ensure this page is not
            squished inside a narrow parent layout.
        */}
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
                    <div className="absolute inset-0 bg-gradient-to-br from-[#211b17]/95 via-[#211b17]/65 to-orange-950/40" />

                    {/* Extra warm overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#211b17]/95 via-transparent to-[#211b17]/30" />

                    {/* Decorative warm glow */}
                    <div className="absolute -left-32 -top-32 h-[500px] w-[500px] rounded-full bg-orange-500/20 blur-3xl" />

                    <div className="absolute -bottom-40 -right-20 h-[500px] w-[500px] rounded-full bg-amber-500/20 blur-3xl" />

                    {/* Content */}
                    <div className="relative z-10 flex min-h-screen w-full flex-col justify-between p-10 xl:p-16">
                        {/* Top Icon */}
                        <div className="flex items-center">
                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-500 shadow-xl shadow-orange-900/30">
                                <ChefHat className="h-6 w-6 text-white" />
                            </div>
                        </div>

                        {/* Main Content */}
                        <div className="max-w-2xl py-12">
                            {/* Badge */}
                            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium text-orange-100 backdrop-blur-md">
                                <Sparkles className="h-4 w-4 text-orange-400" />
                                <span>
                                    Restaurant Management Made Simple
                                </span>
                            </div>

                            {/* Heading */}
                            <h1 className="max-w-2xl text-4xl font-bold leading-[1.1] tracking-tight text-white sm:text-5xl xl:text-6xl">
                                Great Food.
                                <br />
                                <span className="text-orange-400">
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
                                <div className="h-1 w-16 rounded-full bg-orange-500" />
                                <div className="h-1 w-3 rounded-full bg-orange-400/60" />
                                <div className="h-1 w-2 rounded-full bg-orange-300/40" />
                            </div>
                        </div>

                        {/* Features */}
                        <div className="grid w-full max-w-3xl grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
                            {features.map(
                                ({ icon: Icon, title, description }) => (
                                    <div
                                        key={title}
                                        className="group rounded-2xl border border-white/10 bg-black/20 p-4 backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:border-orange-400/30 hover:bg-black/30"
                                    >
                                        <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/20 text-orange-300 transition-all duration-300 group-hover:bg-orange-500 group-hover:text-white">
                                            <Icon className="h-5 w-5" />
                                        </div>

                                        <p className="text-sm font-semibold text-white">
                                            {title}
                                        </p>

                                        <p className="mt-1 text-xs leading-5 text-stone-300">
                                            {description}
                                        </p>
                                    </div>
                                ),
                            )}
                        </div>
                    </div>
                </div>

                {/* =====================================================
                    RIGHT SIDE - LOGIN FORM
                ====================================================== */}
                <div className="flex min-h-screen w-full items-center justify-center bg-[#faf7f2] px-6 py-12 sm:px-10 lg:w-[42%] lg:px-12 xl:px-20">
                    <div className="w-full max-w-lg">
                        {/* Header */}
                        <div className="mb-8">
                            <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-100 text-orange-600">
                                <ChefHat className="h-7 w-7" />
                            </div>

                            <h2 className="text-3xl font-bold tracking-tight text-[#211b17] sm:text-4xl">
                                Welcome back!
                            </h2>

                            <p className="mt-3 max-w-md text-sm leading-6 text-stone-500 sm:text-base">
                                Sign in to continue managing your
                                restaurant.
                            </p>
                        </div>

                        {/* Success Message */}
                        {status && (
                            <div className="mb-6 flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
                                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-green-100">
                                    <Check className="h-4 w-4" />
                                </div>

                                <span>{status}</span>
                            </div>
                        )}

                        {/* Login Form */}
                        <Form
                            {...store.form()}
                            resetOnSuccess={['password']}
                            className="space-y-6"
                        >
                            {({ processing, errors }) => (
                                <>
                                    {/* Email */}
                                    <div className="space-y-2">
                                        <Label
                                            htmlFor="email"
                                            className="text-sm font-semibold text-[#211b17]"
                                        >
                                            Email address
                                        </Label>

                                        <div className="group relative">
                                            <Mail className="pointer-events-none absolute left-4 top-1/2 z-10 h-5 w-5 -translate-y-1/2 text-stone-400 transition-colors group-focus-within:text-orange-500" />

                                            <Input
                                                id="email"
                                                type="email"
                                                name="email"
                                                required
                                                autoFocus
                                                tabIndex={1}
                                                autoComplete="email"
                                                placeholder="you@example.com"
                                                className="h-13 w-full rounded-xl border-stone-200 bg-white pl-12 pr-4 text-sm shadow-sm transition-all placeholder:text-stone-400 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10"
                                            />
                                        </div>

                                        <InputError
                                            message={errors.email}
                                        />
                                    </div>

                                    {/* Password */}
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between gap-4">
                                            <Label
                                                htmlFor="password"
                                                className="text-sm font-semibold text-[#211b17]"
                                            >
                                                Password
                                            </Label>

                                            {canResetPassword && (
                                                <TextLink
                                                    href={request()}
                                                    className="shrink-0 text-sm font-semibold text-orange-600 transition-colors hover:text-orange-700"
                                                    tabIndex={5}
                                                >
                                                    Forgot password?
                                                </TextLink>
                                            )}
                                        </div>

                                        <div className="group relative">
                                            <Lock className="pointer-events-none absolute left-4 top-1/2 z-10 h-5 w-5 -translate-y-1/2 text-stone-400 transition-colors group-focus-within:text-orange-500" />

                                            <PasswordInput
                                                id="password"
                                                name="password"
                                                required
                                                tabIndex={2}
                                                autoComplete="current-password"
                                                placeholder="Enter your password"
                                                className="h-13 w-full rounded-xl border-stone-200 bg-white pl-12 pr-12 text-sm shadow-sm transition-all placeholder:text-stone-400 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10"
                                            />
                                        </div>

                                        <InputError
                                            message={errors.password}
                                        />
                                    </div>

                                    {/* Remember Me */}
                                    <div className="flex items-center gap-3">
                                        <Checkbox
                                            id="remember"
                                            name="remember"
                                            tabIndex={3}
                                            className="h-5 w-5 rounded-md border-stone-300 data-[state=checked]:border-orange-500 data-[state=checked]:bg-orange-500"
                                        />

                                        <Label
                                            htmlFor="remember"
                                            className="cursor-pointer text-sm text-stone-600"
                                        >
                                            Remember me
                                        </Label>
                                    </div>

                                    {/* Login Button */}
                                    <Button
                                        type="submit"
                                        className="group h-13 w-full rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 text-sm font-semibold text-white shadow-lg shadow-orange-500/20 transition-all duration-300 hover:from-orange-600 hover:to-orange-700 hover:shadow-xl hover:shadow-orange-500/30"
                                        tabIndex={4}
                                        disabled={processing}
                                        data-test="login-button"
                                    >
                                        {processing ? (
                                            <>
                                                <Spinner />
                                                <span>Signing in...</span>
                                            </>
                                        ) : (
                                            <>
                                                <span>
                                                    Sign in to your account
                                                </span>

                                                <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                                            </>
                                        )}
                                    </Button>
                                </>
                            )}
                        </Form>

                        {/* Register */}
                        <div className="mt-8 text-center text-sm text-stone-500">
                            <span>Don't have an account? </span>

                            <TextLink
                                href={register()}
                                tabIndex={6}
                                className="font-semibold text-orange-600 transition-colors hover:text-orange-700"
                            >
                                Create an account
                            </TextLink>
                        </div>

                        {/* Bottom Decoration */}
                        <div className="mt-10 flex items-center justify-center gap-3">
                            <div className="h-px w-16 bg-stone-200" />

                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-100">
                                <UtensilsCrossed className="h-4 w-4 text-orange-500" />
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

Login.layout = {
title: 'Log in to your account',
description: 'Enter your email and password below to log in',
};
