import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, Save, RotateCcw, X } from 'lucide-react';
import { useState } from 'react';
import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { edit as editRoute, update as updateRoute, index as staffIndex } from '@/routes/admin/staff';

type Role = { id: number; name: string; slug: string };
type StaffMember = {
    id: number; first_name: string; last_name: string; employee_id: string; email: string;
    phone: string | null; gender: string | null;
    role_id: number | null; address: string | null;
    photo: string | null;
    password?: string; role: Role | null;
};

type Props = {
    staff: StaffMember;
    roles: Role[];
};

export default function EditStaff({ staff, roles }: Props) {
    const [form, setForm] = useState({
        first_name: staff.first_name || '',
        last_name: staff.last_name || '',
        email: staff.email || '',
        phone: staff.phone || '',
        gender: staff.gender || '',
        role_id: String(staff.role_id || ''),
        address: staff.address || '',
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
        formData.append('_method', 'PUT');
        Object.entries(form).forEach(([key, value]) => {
            if (value !== null && value !== '') {
                formData.append(key, value instanceof File ? value : String(value));
            }
        });
        router.post(updateRoute.url(staff.id), formData, {
            onError: (err) => setErrors(err as Record<string, string>),
        });
    };

    return (
        <>
            <Head title="Edit Staff" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <div className="flex items-center justify-between">
                    <Heading title="Edit Staff" description={`Editing ${form.first_name} ${form.last_name}`} />
                    <Button variant="outline" asChild>
                        <Link href={staffIndex.url()}>
                            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Staff
                        </Link>
                    </Button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6" encType="multipart/form-data">
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
                                <Input id="employee_id" value={staff.employee_id} disabled className="bg-muted" />
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
                                <Input id="address" value={form.address} onChange={(e) => handleChange('address', e.target.value)} />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader><CardTitle>Photo & Password</CardTitle></CardHeader>
                        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="photo">Profile Picture</Label>
                                <div className="flex items-center gap-4">
                                    {photoPreview ? (
                                        <img src={photoPreview} alt="Preview" className="h-20 w-20 rounded-full object-cover" />
                                    ) : staff.photo ? (
                                        <img src={staff.photo} alt="Current" className="h-20 w-20 rounded-full object-cover" />
                                    ) : (
                                        <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center text-muted-foreground text-sm">Photo</div>
                                    )}
                                    <Input id="photo" type="file" accept="image/*" onChange={handlePhotoChange} className="flex-1" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="password">New Password (leave empty to keep current)</Label>
                                <Input id="password" type="password" value={form.password} onChange={(e) => handleChange('password', e.target.value)} />
                                {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="password_confirmation">Confirm New Password</Label>
                                <Input id="password_confirmation" type="password" value={form.password_confirmation} onChange={(e) => handleChange('password_confirmation', e.target.value)} />
                            </div>
                        </CardContent>
                    </Card>

                    <Separator />

                    <div className="flex items-center gap-3">
                        <Button type="submit">
                            <Save className="mr-2 h-4 w-4" /> Save Changes
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

EditStaff.layout = {
    breadcrumbs: [
        { title: 'Staff Management', href: '/admin/staff' },
        { title: 'Edit Staff', href: '/admin/staff/edit' },
    ],
};
