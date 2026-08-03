
import { Head, router } from '@inertiajs/react';
import { FormEvent, useState } from 'react';
import {
    Building2,
    Edit,
    MapPin,
    Phone,
    Plus,
    Search,
    Trash2,
    Users,
    Utensils,
    X,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type Branch = {
    id: number;
    name: string;
    address: string | null;
    phone: string | null;
    is_active: boolean;
    users_count: number;
    restaurant_tables_count: number;
    menu_items_count: number;
    orders_count: number;
    created_at: string;
};

type Props = {
    branches: Branch[];
};

export default function BranchesIndex({ branches }: Props) {
    const [search, setSearch] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingBranch, setEditingBranch] = useState<Branch | null>(null);

    const [form, setForm] = useState({
        name: '',
        address: '',
        phone: '',
        is_active: true,
    });

    const filteredBranches = branches.filter((branch) => {
        const searchTerm = search.toLowerCase();

        return (
            branch.name.toLowerCase().includes(searchTerm) ||
            branch.address?.toLowerCase().includes(searchTerm) ||
            branch.phone?.toLowerCase().includes(searchTerm)
        );
    });

    const openCreateModal = () => {
        setEditingBranch(null);

        setForm({
            name: '',
            address: '',
            phone: '',
            is_active: true,
        });

        setShowModal(true);
    };

    const openEditModal = (branch: Branch) => {
        setEditingBranch(branch);

        setForm({
            name: branch.name,
            address: branch.address ?? '',
            phone: branch.phone ?? '',
            is_active: branch.is_active,
        });

        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingBranch(null);
    };

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();

        if (editingBranch) {
            router.put(
                `/manager/branches/${editingBranch.id}`,
                form,
                {
                    onSuccess: () => closeModal(),
                },
            );
        } else {
            router.post('/manager/branches', form, {
                onSuccess: () => closeModal(),
            });
        }
    };

    const handleDelete = (branch: Branch) => {
        const confirmed = window.confirm(
            `Are you sure you want to delete "${branch.name}"?`,
        );

        if (!confirmed) {
            return;
        }

        router.delete(`/manager/branches/${branch.id}`);
    };

    return (
        <>
            <Head title="Branches" />

            <div className="w-full min-w-0 space-y-6 p-6">
                {/* Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">
                            Branches
                        </h1>

                        <p className="text-sm text-muted-foreground">
                            Manage your restaurant branches and their
                            information.
                        </p>
                    </div>

                    <Button onClick={openCreateModal}>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Branch
                    </Button>
                </div>

                {/* Search */}
                <div className="relative max-w-md">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

                    <Input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search branches..."
                        className="pl-9"
                    />
                </div>

                {/* Branches */}
                {filteredBranches.length === 0 ? (
                    <div className="rounded-xl border bg-card p-12 text-center">
                        <Building2 className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />

                        <h3 className="text-lg font-semibold">
                            No branches found
                        </h3>

                        <p className="mt-1 text-sm text-muted-foreground">
                            {search
                                ? 'Try a different search term.'
                                : 'Create your first restaurant branch to get started.'}
                        </p>

                        {!search && (
                            <Button
                                onClick={openCreateModal}
                                className="mt-5"
                            >
                                <Plus className="mr-2 h-4 w-4" />
                                Add Branch
                            </Button>
                        )}
                    </div>
                ) : (
                    <div className="overflow-hidden rounded-xl border bg-card">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="border-b bg-muted/40">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-sm font-semibold">
                                            Branch
                                        </th>

                                        <th className="px-6 py-4 text-left text-sm font-semibold">
                                            Contact
                                        </th>

                                        <th className="px-6 py-4 text-center text-sm font-semibold">
                                            Users
                                        </th>

                                        <th className="px-6 py-4 text-center text-sm font-semibold">
                                            Tables
                                        </th>

                                        <th className="px-6 py-4 text-center text-sm font-semibold">
                                            Menu
                                        </th>

                                        <th className="px-6 py-4 text-center text-sm font-semibold">
                                            Orders
                                        </th>

                                        <th className="px-6 py-4 text-center text-sm font-semibold">
                                            Status
                                        </th>

                                        <th className="px-6 py-4 text-right text-sm font-semibold">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>

                                <tbody className="divide-y">
                                    {filteredBranches.map((branch) => (
                                        <tr
                                            key={branch.id}
                                            className="transition-colors hover:bg-muted/30"
                                        >
                                            {/* Branch */}
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                                                        <Building2 className="h-5 w-5 text-primary" />
                                                    </div>

                                                    <div>
                                                        <p className="font-medium">
                                                            {branch.name}
                                                        </p>

                                                        {branch.address && (
                                                            <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                                                                <MapPin className="h-3 w-3" />
                                                                {branch.address}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Contact */}
                                            <td className="px-6 py-4">
                                                {branch.phone ? (
                                                    <div className="flex items-center gap-2 text-sm">
                                                        <Phone className="h-4 w-4 text-muted-foreground" />
                                                        {branch.phone}
                                                    </div>
                                                ) : (
                                                    <span className="text-sm text-muted-foreground">
                                                        No phone
                                                    </span>
                                                )}
                                            </td>

                                            {/* Users */}
                                            <td className="px-6 py-4 text-center">
                                                <div className="inline-flex items-center gap-1 text-sm">
                                                    <Users className="h-4 w-4 text-muted-foreground" />
                                                    {branch.users_count}
                                                </div>
                                            </td>

                                            {/* Tables */}
                                            <td className="px-6 py-4 text-center">
                                                {branch.restaurant_tables_count}
                                            </td>

                                            {/* Menu */}
                                            <td className="px-6 py-4 text-center">
                                                <div className="inline-flex items-center gap-1 text-sm">
                                                    <Utensils className="h-4 w-4 text-muted-foreground" />
                                                    {branch.menu_items_count}
                                                </div>
                                            </td>

                                            {/* Orders */}
                                            <td className="px-6 py-4 text-center">
                                                {branch.orders_count}
                                            </td>

                                            {/* Status */}
                                            <td className="px-6 py-4 text-center">
                                                <span
                                                    className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${
                                                        branch.is_active
                                                            ? 'bg-green-100 text-green-700'
                                                            : 'bg-gray-100 text-gray-600'
                                                    }`}
                                                >
                                                    {branch.is_active
                                                        ? 'Active'
                                                        : 'Inactive'}
                                                </span>
                                            </td>

                                            {/* Actions */}
                                            <td className="px-6 py-4">
                                                <div className="flex justify-end gap-2">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() =>
                                                            openEditModal(
                                                                branch,
                                                            )
                                                        }
                                                    >
                                                        <Edit className="mr-1 h-4 w-4" />
                                                        Edit
                                                    </Button>

                                                    <Button
                                                        variant="destructive"
                                                        size="sm"
                                                        onClick={() =>
                                                            handleDelete(branch)
                                                        }
                                                    >
                                                        <Trash2 className="mr-1 h-4 w-4" />
                                                        Delete
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {/* Create / Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-lg rounded-xl bg-background shadow-xl">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between border-b p-6">
                            <div>
                                <h2 className="text-lg font-semibold">
                                    {editingBranch
                                        ? 'Edit Branch'
                                        : 'Add New Branch'}
                                </h2>

                                <p className="mt-1 text-sm text-muted-foreground">
                                    {editingBranch
                                        ? 'Update branch information.'
                                        : 'Create a new restaurant branch.'}
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={closeModal}
                                className="rounded-md p-2 hover:bg-muted"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        {/* Form */}
                        <form
                            onSubmit={handleSubmit}
                            className="space-y-5 p-6"
                        >
                            <div>
                                <label className="mb-2 block text-sm font-medium">
                                    Branch Name
                                </label>

                                <Input
                                    value={form.name}
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            name: e.target.value,
                                        })
                                    }
                                    placeholder="e.g. Main Branch"
                                    required
                                />
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-medium">
                                    Address
                                </label>

                                <Input
                                    value={form.address}
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            address: e.target.value,
                                        })
                                    }
                                    placeholder="e.g. Addis Ababa"
                                />
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-medium">
                                    Phone
                                </label>

                                <Input
                                    value={form.phone}
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            phone: e.target.value,
                                        })
                                    }
                                    placeholder="e.g. 0911111111"
                                />
                            </div>

                            <label className="flex cursor-pointer items-center gap-3">
                                <input
                                    type="checkbox"
                                    checked={form.is_active}
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            is_active: e.target.checked,
                                        })
                                    }
                                    className="h-4 w-4 rounded"
                                />

                                <span className="text-sm font-medium">
                                    Branch is active
                                </span>
                            </label>

                            <div className="flex justify-end gap-3 border-t pt-5">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={closeModal}
                                >
                                    Cancel
                                </Button>

                                <Button type="submit">
                                    {editingBranch
                                        ? 'Update Branch'
                                        : 'Create Branch'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}

BranchesIndex.layout = {
    breadcrumbs: [
        {
            title: 'Branches',
            href: '/manager/branches',
        },
    ],
};

