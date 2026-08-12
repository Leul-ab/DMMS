import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { UserPlus } from 'lucide-react';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
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
    create as usersCreate,
    index as usersIndex,
    store as usersStore,
} from '@/routes/admin/users';

type Role = { id: number; name: string; slug: string };
type Branch = { id: number; name: string };

type Props = {
    roles: Role[];
    branches: Branch[];
    currentBranchId: number | null;
};

export default function UserCreate({
    roles,
    branches,
    currentBranchId,
}: Props) {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        email: '',
        phone: '',
        password: '12345678',
        role_id: '',
        branch_id: currentBranchId
            ? String(currentBranchId)
            : branches.length > 0
              ? String(branches[0].id)
              : '',
        is_active: true,
        is_waiter: false,
    });

    const pageErrors = (usePage().props.errors ?? {}) as Record<
        string,
        string | undefined
    >;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(usersStore.url());
    };

    return (
        <>
            <Head title="Create User" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <Heading
                    title="Create User"
                    description="Add a new user to the system"
                    icon={UserPlus}
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
                                        setData('name', e.target.value)
                                    }
                                    placeholder="Full name"
                                    required
                                />
                                <InputError message={errors.name} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={data.email}
                                    onChange={(e) =>
                                        setData('email', e.target.value)
                                    }
                                    placeholder="email@example.com"
                                    required
                                />
                                <InputError message={errors.email} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="phone">Phone Number</Label>
                                <Input
                                    id="phone"
                                    value={data.phone}
                                    onChange={(e) =>
                                        setData('phone', e.target.value)
                                    }
                                    placeholder="+1234567890"
                                />
                                <InputError
                                    message={errors.phone ?? pageErrors.phone}
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="password">Password</Label>
                                <Input
                                    id="password"
                                    value={data.password}
                                    placeholder="12345678"
                                    disabled
                                />
                                <InputError message={errors.password} />
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="grid gap-2">
                                    <Label>Role</Label>
                                    <Select
                                        value={data.role_id}
                                        onValueChange={(value) =>
                                            setData('role_id', value)
                                        }
                                    >
                                        <SelectTrigger>
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
                                    <InputError message={errors.role_id} />
                                </div>

                                <div className="grid gap-2">
                                    <Label>Branch</Label>
                                    <Select
                                        value={data.branch_id}
                                        onValueChange={(value) =>
                                            setData('branch_id', value)
                                        }
                                    >
                                        <SelectTrigger>
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
                                    <InputError message={errors.branch_id} />
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
                                    Create User
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

UserCreate.layout = {
    breadcrumbs: [
        { title: 'User Management', href: usersIndex.url() },
        { title: 'Create User', href: usersCreate.url() },
    ],
};
