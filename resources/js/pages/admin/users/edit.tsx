import { Head, Link, useForm } from '@inertiajs/react';
import { useState } from 'react';
import { User as UserIcon } from 'lucide-react';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    index as usersIndex,
    update as usersUpdate,
} from '@/routes/admin/users';
import {
    confirmFieldRule,
    emailRule,
    requiredRule,
    validateFields,
} from '@/lib/form-validation';

type Role = { id: number; name: string; slug: string };
type Branch = { id: number; name: string };
type User = {
    id: number;
    name: string;
    email: string;
    phone: string | null;
    role_id: number;
    branch_id: number | null;
    is_active: boolean;
    is_waiter: boolean;
};

type Props = { user: User; roles: Role[]; branches: Branch[] };

export default function UserEdit({ user, roles, branches }: Props) {
    const { data, setData, put, processing, errors } = useForm({
        name: user.name,
        email: user.email,
        phone: user.phone || '',
        password: '',
        password_confirmation: '',
        role_id: String(user.role_id),
        branch_id: user.branch_id ? String(user.branch_id) : '',
        is_active: user.is_active,
        is_waiter: user.is_waiter,
    });

    const [clientErrors, setClientErrors] = useState<Record<string, string>>({});

    const validateForm = () => {
        const nextErrors = validateFields(data, {
            name: [requiredRule('Name is required.')],
            email: [requiredRule('Email is required.'), emailRule()],
            role_id: [requiredRule('Please select a role.')],
            branch_id: [requiredRule('Please select a branch.')],
            password_confirmation: [confirmFieldRule('password')],
        });

        setClientErrors(nextErrors);
        return Object.keys(nextErrors).length === 0;
    };

    const handleFieldChange = (field: string, value: string) => {
        setData(field as never, value as never);
        if (clientErrors[field]) {
            setClientErrors((prev) => ({ ...prev, [field]: '' }));
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm()) {
            return;
        }
        put(usersUpdate.url(user.id));
    };

    return (
        <>
            <Head title={`Edit User - ${user.name}`} />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <Heading
                    title="Edit User"
                    description={`Update ${user.name}'s information`}
                    icon={UserIcon}
                />

                <Card className="max-w-2xl">
                    <CardContent className="pt-6">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid gap-2">
                                <Label htmlFor="name">Name</Label>
                                <Input
                                    id="name"
                                    value={data.name}
                                    onChange={(e) =>
                                        handleFieldChange('name', e.target.value)
                                    }
                                    placeholder="Full name"
                                    required
                                    aria-invalid={Boolean(errors.name || clientErrors.name)}
                                />
                                <InputError message={errors.name || clientErrors.name} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={data.email}
                                    onChange={(e) =>
                                        handleFieldChange('email', e.target.value)
                                    }
                                    placeholder="email@example.com"
                                    required
                                    aria-invalid={Boolean(errors.email || clientErrors.email)}
                                />
                                <InputError message={errors.email || clientErrors.email} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="phone">Phone (optional)</Label>
                                <Input
                                    id="phone"
                                    value={data.phone}
                                    onChange={(e) =>
                                        setData('phone', e.target.value)
                                    }
                                    placeholder="+1234567890"
                                />
                                <InputError message={errors.phone} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="password">
                                    Password (leave blank to keep current)
                                </Label>
                                <PasswordInput
                                    id="password"
                                    value={data.password}
                                    onChange={(e) =>
                                        handleFieldChange('password', e.target.value)
                                    }
                                    placeholder="New password"
                                    aria-invalid={Boolean(errors.password || clientErrors.password)}
                                />
                                <InputError message={errors.password || clientErrors.password} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="password_confirmation">
                                    Confirm Password
                                </Label>
                                <PasswordInput
                                    id="password_confirmation"
                                    value={data.password_confirmation}
                                    onChange={(e) =>
                                        handleFieldChange(
                                            'password_confirmation',
                                            e.target.value,
                                        )
                                    }
                                    placeholder="Confirm new password"
                                    aria-invalid={Boolean(
                                        errors.password_confirmation ||
                                            clientErrors.password_confirmation,
                                    )}
                                />
                                <InputError
                                    message={
                                        errors.password_confirmation ||
                                        clientErrors.password_confirmation
                                    }
                                />
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="grid gap-2">
                                    <Label>Role</Label>
                                    <Select
                                        value={data.role_id}
                                        onValueChange={(value) => {
                                            handleFieldChange('role_id', value);
                                        }}
                                    >
                                        <SelectTrigger
                                            aria-invalid={Boolean(
                                                errors.role_id || clientErrors.role_id,
                                            )}
                                        >
                                            <SelectValue placeholder="Select a role" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {roles
                                                .filter(
                                                    (role) =>
                                                        role.slug !==
                                                        'super_admin',
                                                )
                                                .map((role) => (
                                                    <SelectItem
                                                        key={role.id}
                                                        value={String(role.id)}
                                                    >
                                                        {role.name}
                                                    </SelectItem>
                                                ))}
                                        </SelectContent>
                                    </Select>
                                    <InputError message={errors.role_id || clientErrors.role_id} />
                                </div>

                                <div className="grid gap-2">
                                    <Label>Branch</Label>
                                    <Select
                                        value={data.branch_id}
                                        onValueChange={(value) => {
                                            handleFieldChange('branch_id', value);
                                        }}
                                    >
                                        <SelectTrigger
                                            aria-invalid={Boolean(
                                                errors.branch_id || clientErrors.branch_id,
                                            )}
                                        >
                                            <SelectValue placeholder="Select a branch" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {branches.map((branch) => (
                                                <SelectItem
                                                    key={branch.id}
                                                    value={String(branch.id)}
                                                >
                                                    {branch.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <InputError message={errors.branch_id || clientErrors.branch_id} />
                                </div>
                            </div>

                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="is_active"
                                    checked={data.is_active}
                                    onCheckedChange={(checked) =>
                                        setData('is_active', checked === true)
                                    }
                                />
                                <Label htmlFor="is_active">Active</Label>
                            </div>

                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="is_waiter"
                                    checked={data.is_waiter}
                                    onCheckedChange={(checked) =>
                                        setData('is_waiter', checked === true)
                                    }
                                />
                                <Label htmlFor="is_waiter">
                                    Is this user a waiter?
                                </Label>
                            </div>

                            <div className="flex items-center gap-4">
                                <Button disabled={processing}>
                                    Update User
                                </Button>
                                <Link
                                    href={usersIndex.url()}
                                    className="text-sm text-muted-foreground hover:text-foreground"
                                >
                                    Cancel
                                </Link>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

UserEdit.layout = {
    breadcrumbs: [
        { title: 'User Management', href: usersIndex.url() },
        { title: 'Edit User', href: '#' },
    ],
};
