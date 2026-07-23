import { Head, Link, router, usePage } from '@inertiajs/react';
import { ArrowLeft, Save, RotateCcw, X } from 'lucide-react';
import { useState } from 'react';
import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { create as createRoute, store as storeRoute } from '@/routes/admin/staff';
import { index as staffIndex } from '@/routes/admin/staff';

type Role = { id: number; name: string; slug: string };

type Props = {
    roles: Role[];
    nextEmployeeId: string;
};

export default function CreateStaff({ roles, nextEmployeeId }: Props) {
    const [form, setForm] = useState({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        gender: '',
        role_id: '',
        address: '',
        photo: null as File | null,
        password: '',
        password_confirmation: '',
    });
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const handleChange = (field: string, value: string) => {
        setForm(prev => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors(prev => { const n = { ...prev }; delete n[field]; return n; });
        }
    };

    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setForm(prev => ({ ...prev, photo: file }));
            const reader = new FileReader();
            reader.onload = () => setPhotoPreview(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const formData = new FormData();
        Object.entries(form).forEach(([key, value]) => {
            if (value !== null && value !== '') {
                formData.append(key, value instanceof File ? value : String(value));
            }
        });
        router.post(storeRoute.url(), formData, {
            onError: (err) => setErrors(err as Record<string, string>),
            onSuccess: () => {},
        });
    };

    const handleReset = () => {
        setForm({
            first_name: '', last_name: '', email: '', phone: '', gender: '',
            role_id: '', address: '', photo: null,
            password: '', password_confirmation: '',
        });
        setPhotoPreview(null);
        setErrors({});
    };

    return (
        <>
            <Head title="Add Staff" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <div className="flex items-center justify-between">
                    <Heading title="Add Staff" description="Register a new employee" />
                    <Button variant="outline" asChild>
                        <Link href={staffIndex.url()}>
                            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Staff
                        </Link>
                    </Button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6" encType="multipart/form-data">
                    {/* Personal Information */}
                    <Card>
                        <CardHeader><CardTitle>Personal Information</CardTitle></CardHeader>
                        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="first_name">First Name *</Label>
                                <Input id="first_name" value={form.first_name} onChange={(e) => handleChange('first_name', e.target.value)} />
                                {errors.first_name && <p className="text-sm text-destructive">{errors.first_name}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="last_name">Last Name *</Label>
                                <Input id="last_name" value={form.last_name} onChange={(e) => handleChange('last_name', e.target.value)} />
                                {errors.last_name && <p className="text-sm text-destructive">{errors.last_name}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="employee_id">Employee ID</Label>
                                <Input id="employee_id" value={nextEmployeeId} disabled className="bg-muted" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email">Email *</Label>
                                <Input id="email" type="email" value={form.email} onChange={(e) => handleChange('email', e.target.value)} />
                                {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="phone">Phone Number</Label>
                                <Input id="phone" value={form.phone} onChange={(e) => handleChange('phone', e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="gender">Gender</Label>
                                <Select value={form.gender} onValueChange={(v) => handleChange('gender', v)}>
                                    <SelectTrigger><SelectValue placeholder="Select gender" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="male">Male</SelectItem>
                                        <SelectItem value="female">Female</SelectItem>
                                        <SelectItem value="other">Other</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Employment Details */}
                    <Card>
                        <CardHeader><CardTitle>Employment Details</CardTitle></CardHeader>
                        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="role_id">Role *</Label>
                                <Select value={form.role_id} onValueChange={(v) => handleChange('role_id', v)}>
                                    <SelectTrigger><SelectValue placeholder="Select role" /></SelectTrigger>
                                    <SelectContent>
                                        {roles.map((role) => (
                                            <SelectItem key={role.id} value={String(role.id)}>{role.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.role_id && <p className="text-sm text-destructive">{errors.role_id}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="address">Address</Label>
                                <Input id="address" value={form.address} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('address', e.target.value)} />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Photo & Password */}
                    <Card>
                        <CardHeader><CardTitle>Photo & Password</CardTitle></CardHeader>
                        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="photo">Photo</Label>
                                <div className="flex items-center gap-4">
                                    {photoPreview ? (
                                        <div className="relative h-20 w-20 rounded-full overflow-hidden">
                                            <img src={photoPreview} alt="Preview" className="h-full w-full object-cover" />
                                            <button type="button" onClick={() => { setPhotoPreview(null); setForm(prev => ({ ...prev, photo: null })); }} className="absolute top-0 right-0 bg-destructive text-white rounded-full p-0.5">
                                                <X className="h-3 w-3" />
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center text-muted-foreground text-sm">Photo</div>
                                    )}
                                    <Input id="photo" type="file" accept="image/*" onChange={handlePhotoChange} className="flex-1" />
                                </div>
                                {errors.photo && <p className="text-sm text-destructive">{errors.photo}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="password">Password *</Label>
                                <Input id="password" type="password" value={form.password} onChange={(e) => handleChange('password', e.target.value)} />
                                {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="password_confirmation">Confirm Password *</Label>
                                <Input id="password_confirmation" type="password" value={form.password_confirmation} onChange={(e) => handleChange('password_confirmation', e.target.value)} />
                            </div>
                        </CardContent>
                    </Card>

                    <Separator />

                    {/* Buttons */}
                    <div className="flex items-center gap-3">
                        <Button type="submit">
                            <Save className="mr-2 h-4 w-4" /> Save
                        </Button>
                        <Button type="button" variant="outline" onClick={handleReset}>
                            <RotateCcw className="mr-2 h-4 w-4" /> Reset
                        </Button>
                        <Button type="button" variant="ghost" asChild>
                            <Link href={staffIndex.url()}>
                                <X className="mr-2 h-4 w-4" /> Cancel
                            </Link>
                        </Button>
                    </div>
                </form>
            </div>
        </>
    );
}

CreateStaff.layout = {
    breadcrumbs: [
        { title: 'Staff Management', href: '/admin/staff' },
        { title: 'Add Staff', href: '/admin/staff/create' },
    ],
};
