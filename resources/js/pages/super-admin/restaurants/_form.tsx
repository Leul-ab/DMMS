import { Head, router, useForm } from '@inertiajs/react';
import { ArrowLeft, Building2, Check, Image, Palette, Type } from 'lucide-react';
import { useRef, useState } from 'react';
import { Link } from '@inertiajs/react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { GOOGLE_FONTS } from '@/components/theme-provider';

// ─── Reusable form field ──────────────────────────────────────────────────────

function Field({
    label,
    error,
    required,
    children,
}: {
    label: string;
    error?: string;
    required?: boolean;
    children: React.ReactNode;
}) {
    return (
        <div className="space-y-1.5">
            <label className="block text-sm font-medium">
                {label}
                {required && <span className="ml-1 text-red-500">*</span>}
            </label>
            {children}
            {error && <p className="text-xs text-red-500">{error}</p>}
        </div>
    );
}

// ─── Color Picker input ───────────────────────────────────────────────────────

function ColorPicker({
    label,
    value,
    onChange,
    error,
}: {
    label: string;
    value: string;
    onChange: (v: string) => void;
    error?: string;
}) {
    return (
        <Field label={label} error={error}>
            <div className="flex items-center gap-2">
                <div className="relative">
                    <input
                        type="color"
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        className="size-10 cursor-pointer rounded-lg border p-0.5"
                    />
                </div>
                <Input
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder="#e85d04"
                    className="font-mono uppercase"
                    maxLength={7}
                />
                <div
                    className="size-10 shrink-0 rounded-lg border shadow-inner"
                    style={{ background: value }}
                />
            </div>
        </Field>
    );
}

// ─── Live Preview ──────────────────────────────────────────────────────────────

function BrandingPreview({
    name,
    logoPreview,
    primaryColor,
    secondaryColor,
    accentColor,
    fontFamily,
}: {
    name: string;
    logoPreview: string | null;
    primaryColor: string;
    secondaryColor: string;
    accentColor: string;
    fontFamily: string;
}) {
    return (
        <div
            className="rounded-2xl border shadow-2xl overflow-hidden"
            style={{ fontFamily: `'${fontFamily}', sans-serif` }}
        >
            {/* Fake sidebar */}
            <div className="flex h-[420px]">
                <div className="w-56 shrink-0 border-r bg-white dark:bg-zinc-900 flex flex-col">
                    {/* Logo area */}
                    <div className="flex items-center gap-2.5 border-b px-3 py-3">
                        <div
                            className="flex size-8 items-center justify-center rounded-lg text-white text-[10px] font-bold shadow overflow-hidden"
                            style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }}
                        >
                            {logoPreview
                                ? <img src={logoPreview} alt="logo" className="size-8 object-cover" />
                                : (name || 'R').slice(0, 2).toUpperCase()
                            }
                        </div>
                        <div>
                            <p className="text-[11px] font-black truncate" style={{ fontFamily: `'${fontFamily}', sans-serif` }}>
                                {name || 'Restaurant Name'}
                            </p>
                            <p className="text-[8px] font-semibold uppercase tracking-widest" style={{ color: accentColor }}>
                                Digital Menu
                            </p>
                        </div>
                    </div>

                    {/* Nav items */}
                    <div className="flex-1 p-2 space-y-1">
                        {[
                            { label: 'Dashboard', active: true },
                            { label: 'Menu Items', active: false },
                            { label: 'Orders', active: false },
                            { label: 'Payments', active: false },
                        ].map((item) => (
                            <div
                                key={item.label}
                                className={`flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-[11px] font-medium transition-colors`}
                                style={
                                    item.active
                                        ? { background: primaryColor, color: '#fff' }
                                        : { color: '#64748b' }
                                }
                            >
                                <div
                                    className="size-3 rounded-sm"
                                    style={{ background: item.active ? 'rgba(255,255,255,0.4)' : '#e2e8f0' }}
                                />
                                {item.label}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Fake content */}
                <div className="flex-1 bg-zinc-50 dark:bg-zinc-950 p-4 space-y-3">
                    {/* Stat cards */}
                    <div className="grid grid-cols-3 gap-2">
                        {[
                            { label: 'Revenue', val: 'ETB 4,200' },
                            { label: 'Orders', val: '38' },
                            { label: 'Customers', val: '127' },
                        ].map((s) => (
                            <div key={s.label} className="rounded-xl bg-white dark:bg-zinc-900 border p-2.5 shadow-sm">
                                <div className="h-1.5 w-12 rounded-full mb-1.5" style={{ background: primaryColor }} />
                                <p className="text-[11px] font-bold">{s.val}</p>
                                <p className="text-[9px] text-zinc-400">{s.label}</p>
                            </div>
                        ))}
                    </div>

                    {/* Fake table */}
                    <div className="rounded-xl bg-white dark:bg-zinc-900 border shadow-sm overflow-hidden">
                        <div
                            className="flex items-center gap-2 px-3 py-2 border-b"
                            style={{ borderLeftWidth: 3, borderLeftColor: primaryColor }}
                        >
                            <p className="text-[11px] font-semibold">Recent Orders</p>
                        </div>
                        <div className="divide-y">
                            {['Table 1 — Tibs', 'Table 3 — Injera Combo', 'Table 5 — Doro Wat'].map((row) => (
                                <div key={row} className="flex items-center justify-between px-3 py-1.5">
                                    <p className="text-[10px] text-zinc-600 dark:text-zinc-300">{row}</p>
                                    <span
                                        className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                                        style={{ background: accentColor + '30', color: accentColor }}
                                    >
                                        Pending
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Button preview */}
                    <div className="flex gap-2">
                        <button
                            className="px-3 py-1.5 rounded-lg text-[11px] font-semibold text-white shadow"
                            style={{ background: primaryColor }}
                        >
                            Primary Button
                        </button>
                        <button
                            className="px-3 py-1.5 rounded-lg text-[11px] font-semibold border"
                            style={{ color: primaryColor, borderColor: primaryColor }}
                        >
                            Outline
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── Tab types ────────────────────────────────────────────────────────────────

type TabId = 'basic' | 'branding' | 'plan';

type FormData = {
    name: string;
    owner_email: string;
    owner_phone: string;
    owner_password?: string;
    description: string;
    primary_color: string;
    secondary_color: string;
    accent_color: string;
    font_family: string;
    currency: string;
    tax_rate: string;
    timezone: string;
    plan: string;
    is_active: boolean;
    logo: File | null;
    _method?: string;
};

type Props = {
    restaurant?: {
        id: number;
        name: string;
        slug: string;
        logo_url: string | null;
        primary_color: string;
        secondary_color: string;
        accent_color: string;
        font_family: string;
        currency: string;
        tax_rate: string;
        timezone: string;
        description: string | null;
        owner_email: string | null;
        owner_phone: string | null;
        plan: string;
        is_active: boolean;
    };
};

const TABS: { id: TabId; label: string; icon: typeof Building2 }[] = [
    { id: 'basic',    label: 'Basic Info',  icon: Building2 },
    { id: 'branding', label: 'Branding',    icon: Palette   },
    { id: 'plan',     label: 'Plan',        icon: Check     },
];

export default function RestaurantForm({ restaurant }: Props) {
    const isEdit = !!restaurant;
    const [tab, setTab] = useState<TabId>('basic');
    const [logoPreview, setLogoPreview] = useState<string | null>(restaurant?.logo_url ?? null);
    const fileRef = useRef<HTMLInputElement>(null);

    const { data, setData, errors, processing, post } = useForm<FormData>({
        name:            restaurant?.name            ?? '',
        owner_email:     restaurant?.owner_email     ?? '',
        owner_phone:     restaurant?.owner_phone     ?? '',
        owner_password:  '',
        description:     restaurant?.description     ?? '',
        primary_color:   restaurant?.primary_color   ?? '#e85d04',
        secondary_color: restaurant?.secondary_color ?? '#f48c06',
        accent_color:    restaurant?.accent_color    ?? '#ffb703',
        font_family:     restaurant?.font_family     ?? 'Inter',
        currency:        restaurant?.currency        ?? 'ETB',
        tax_rate:        restaurant?.tax_rate        ?? '15',
        timezone:        restaurant?.timezone        ?? 'Africa/Addis_Ababa',
        plan:            restaurant?.plan            ?? 'starter',
        is_active:       restaurant?.is_active       ?? true,
        logo:            null,
        ...(isEdit ? { _method: 'PUT' } : {}),
    });

    const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] ?? null;
        setData('logo', file);
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => setLogoPreview(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const url = isEdit
            ? `/super-admin/restaurants/${restaurant!.id}`
            : '/super-admin/restaurants';
        post(url, { forceFormData: true });
    };

    return (
        <>
            <Head title={isEdit ? `Edit ${restaurant!.name}` : 'New Restaurant — Super Admin'} />

            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-6 max-w-7xl mx-auto">

                {/* Header */}
                <div className="flex items-center gap-3">
                    <Button variant="outline" size="icon" asChild>
                        <Link href="/super-admin/restaurants" title="Back">
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">
                            {isEdit ? `Edit — ${restaurant!.name}` : 'Create Restaurant'}
                        </h1>
                        <p className="text-sm text-muted-foreground mt-0.5">
                            {isEdit ? 'Update branding, plan, and details.' : 'Fill in details to onboard a new restaurant tenant.'}
                        </p>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-1 border-b">
                    {TABS.map((t) => (
                        <button
                            key={t.id}
                            onClick={() => setTab(t.id)}
                            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
                                tab === t.id
                                    ? 'border-orange-500 text-orange-600 dark:text-orange-400'
                                    : 'border-transparent text-muted-foreground hover:text-foreground'
                            }`}
                        >
                            <t.icon className="h-4 w-4" />
                            {t.label}
                        </button>
                    ))}
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="grid gap-6 lg:grid-cols-[1fr_420px]">

                        {/* Left — form panels */}
                        <div>

                            {/* ── BASIC INFO ── */}
                            {tab === 'basic' && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Basic Information</CardTitle>
                                        <CardDescription>Restaurant name, contact details, and location settings.</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-5">
                                        <Field label="Restaurant Name" required error={errors.name}>
                                            <Input
                                                value={data.name}
                                                onChange={(e) => setData('name', e.target.value)}
                                                placeholder="e.g. Addis Kitchen"
                                            />
                                        </Field>

                                        <div className="grid gap-4 sm:grid-cols-2">
                                            <Field label="Owner Email" error={errors.owner_email}>
                                                <Input
                                                    type="email"
                                                    value={data.owner_email}
                                                    onChange={(e) => setData('owner_email', e.target.value)}
                                                    placeholder="owner@example.com"
                                                />
                                            </Field>
                                            <Field label="Owner Phone" error={errors.owner_phone}>
                                                <Input
                                                    value={data.owner_phone}
                                                    onChange={(e) => setData('owner_phone', e.target.value)}
                                                    placeholder="+251 9xx xxx xxx"
                                                />
                                            </Field>
                                        </div>

                                        {!isEdit && (
                                            <Field label="Owner Password" error={errors.owner_password} required={!!data.owner_email}>
                                                <Input
                                                    type="password"
                                                    value={data.owner_password}
                                                    onChange={(e) => setData('owner_password', e.target.value)}
                                                    placeholder="Set initial password for the owner"
                                                />
                                                <p className="text-xs text-muted-foreground mt-1">
                                                    Required if creating an owner account.
                                                </p>
                                            </Field>
                                        )}

                                        <div className="grid gap-4 sm:grid-cols-2">
                                            <Field label="Currency" required error={errors.currency}>
                                                <Input
                                                    value={data.currency}
                                                    onChange={(e) => setData('currency', e.target.value)}
                                                    placeholder="ETB"
                                                />
                                            </Field>
                                            <Field label="Tax Rate (%)" required error={errors.tax_rate}>
                                                <Input
                                                    type="number"
                                                    min="0"
                                                    max="100"
                                                    step="0.01"
                                                    value={data.tax_rate}
                                                    onChange={(e) => setData('tax_rate', e.target.value)}
                                                />
                                            </Field>
                                        </div>

                                        <Field label="Timezone" required error={errors.timezone}>
                                            <Select value={data.timezone} onValueChange={(v) => setData('timezone', v)}>
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {[
                                                        'Africa/Addis_Ababa',
                                                        'Africa/Nairobi',
                                                        'Africa/Cairo',
                                                        'Africa/Lagos',
                                                        'Europe/London',
                                                        'Europe/Paris',
                                                        'America/New_York',
                                                        'America/Los_Angeles',
                                                        'Asia/Dubai',
                                                    ].map((tz) => (
                                                        <SelectItem key={tz} value={tz}>{tz}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </Field>

                                        <Field label="Description" error={errors.description}>
                                            <textarea
                                                value={data.description}
                                                onChange={(e) => setData('description', e.target.value)}
                                                placeholder="Short description of the restaurant…"
                                                rows={3}
                                                className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                                            />
                                        </Field>

                                        <div className="flex items-center gap-3">
                                            <input
                                                type="checkbox"
                                                id="is_active"
                                                checked={data.is_active}
                                                onChange={(e) => setData('is_active', e.target.checked)}
                                                className="h-4 w-4"
                                            />
                                            <label htmlFor="is_active" className="text-sm font-medium">
                                                Active (restaurant can be used)
                                            </label>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            {/* ── BRANDING ── */}
                            {tab === 'branding' && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Branding</CardTitle>
                                        <CardDescription>Customize colors, font, and logo. Changes reflect in the live preview.</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-6">

                                        {/* Logo upload */}
                                        <Field label="Logo" error={errors.logo as string}>
                                            <div
                                                className="flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-6 cursor-pointer hover:border-orange-400 transition-colors"
                                                onClick={() => fileRef.current?.click()}
                                            >
                                                {logoPreview ? (
                                                    <img src={logoPreview} alt="Logo preview" className="h-20 w-20 rounded-xl object-contain" />
                                                ) : (
                                                    <div className="rounded-xl bg-muted p-4">
                                                        <Image className="h-8 w-8 text-muted-foreground" />
                                                    </div>
                                                )}
                                                <p className="text-sm text-muted-foreground">Click to upload logo (PNG, JPG — max 2MB)</p>
                                                <input
                                                    ref={fileRef}
                                                    type="file"
                                                    accept="image/*"
                                                    className="hidden"
                                                    onChange={handleLogoChange}
                                                />
                                            </div>
                                        </Field>

                                        {/* Colors */}
                                        <div className="space-y-4">
                                            <p className="text-sm font-semibold flex items-center gap-2">
                                                <Palette className="h-4 w-4 text-orange-500" />
                                                Brand Colors
                                            </p>
                                            <div className="grid gap-4 sm:grid-cols-3">
                                                <ColorPicker
                                                    label="Primary Color"
                                                    value={data.primary_color}
                                                    onChange={(v) => setData('primary_color', v)}
                                                    error={errors.primary_color}
                                                />
                                                <ColorPicker
                                                    label="Secondary Color"
                                                    value={data.secondary_color}
                                                    onChange={(v) => setData('secondary_color', v)}
                                                    error={errors.secondary_color}
                                                />
                                                <ColorPicker
                                                    label="Accent Color"
                                                    value={data.accent_color}
                                                    onChange={(v) => setData('accent_color', v)}
                                                    error={errors.accent_color}
                                                />
                                            </div>
                                        </div>

                                        {/* Font */}
                                        <div>
                                            <p className="text-sm font-semibold flex items-center gap-2 mb-3">
                                                <Type className="h-4 w-4 text-orange-500" />
                                                Font Family
                                            </p>
                                            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3">
                                                {GOOGLE_FONTS.map((font) => (
                                                    <button
                                                        key={font}
                                                        type="button"
                                                        onClick={() => setData('font_family', font)}
                                                        className={`rounded-xl border-2 p-3 text-left transition-all ${
                                                            data.font_family === font
                                                                ? 'border-orange-500 bg-orange-50 dark:bg-orange-950/30'
                                                                : 'border-border hover:border-orange-300'
                                                        }`}
                                                    >
                                                        <p className="text-sm font-semibold truncate" style={{ fontFamily: `'${font}', sans-serif` }}>{font}</p>
                                                        <p className="text-xs text-muted-foreground" style={{ fontFamily: `'${font}', sans-serif` }}>Aa Bb Cc 123</p>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            {/* ── PLAN ── */}
                            {tab === 'plan' && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Plan & Subscription</CardTitle>
                                        <CardDescription>Select the tenant's SaaS plan.</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="grid gap-3 sm:grid-cols-3">
                                            {[
                                                { id: 'starter',    label: 'Starter',    desc: 'Basic features, 1 branch',   color: '#64748b' },
                                                { id: 'pro',        label: 'Pro',        desc: 'All features, multi-branch', color: '#3b82f6' },
                                                { id: 'enterprise', label: 'Enterprise', desc: 'Unlimited + white-label',    color: '#9333ea' },
                                            ].map((plan) => (
                                                <button
                                                    key={plan.id}
                                                    type="button"
                                                    onClick={() => setData('plan', plan.id)}
                                                    className={`rounded-xl border-2 p-4 text-left transition-all ${
                                                        data.plan === plan.id
                                                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30'
                                                            : 'border-border hover:border-blue-300'
                                                    }`}
                                                >
                                                    <div className="flex items-center justify-between mb-2">
                                                        <span
                                                            className="text-xs font-bold px-2 py-0.5 rounded-full text-white"
                                                            style={{ background: plan.color }}
                                                        >
                                                            {plan.label}
                                                        </span>
                                                        {data.plan === plan.id && (
                                                            <Check className="h-4 w-4 text-blue-500" />
                                                        )}
                                                    </div>
                                                    <p className="text-xs text-muted-foreground">{plan.desc}</p>
                                                </button>
                                            ))}
                                        </div>

                                        {errors.plan && <p className="text-xs text-red-500">{errors.plan}</p>}
                                    </CardContent>
                                </Card>
                            )}

                            {/* Submit */}
                            <div className="flex justify-end gap-3 mt-4">
                                <Button type="button" variant="outline" asChild>
                                    <Link href="/super-admin/restaurants">Cancel</Link>
                                </Button>
                                <Button type="submit" disabled={processing}>
                                    {processing
                                        ? (isEdit ? 'Saving…' : 'Creating…')
                                        : (isEdit ? 'Save Changes' : 'Create Restaurant')}
                                </Button>
                            </div>
                        </div>

                        {/* Right — live preview */}
                        <div className="hidden lg:block">
                            <div className="sticky top-6">
                                <p className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wider">Live Preview</p>
                                <BrandingPreview
                                    name={data.name}
                                    logoPreview={logoPreview}
                                    primaryColor={data.primary_color}
                                    secondaryColor={data.secondary_color}
                                    accentColor={data.accent_color}
                                    fontFamily={data.font_family}
                                />
                                <p className="text-xs text-muted-foreground text-center mt-3">
                                    Updates in real-time as you type
                                </p>
                            </div>
                        </div>
                    </div>
                </form>
            </div>
        </>
    );
}
