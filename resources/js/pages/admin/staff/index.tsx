import { Head, router, usePage } from '@inertiajs/react';
import {
Plus,
Pencil,
Trash2,
Search,
Eye,
Loader2,
UtensilsCrossed,
Table2,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';

import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
Select,
SelectContent,
SelectItem,
SelectTrigger,
SelectValue,
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import {
Dialog,
DialogContent,
DialogDescription,
DialogFooter,
DialogHeader,
DialogTitle,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';

import {
index as staffIndex,
store as staffStore,
update as staffUpdate,
destroy as staffDestroy,
} from '@/routes/admin/staff';

import type { PaginatedData } from '@/types';

type TableAssignment = {
id: number;
status: string;
table: {
id: number;
table_number: number;
} | null;
};

type StaffMember = {
id: number;
name: string;
email: string;
phone: string | null;
is_active: boolean;
role: {
id: number;
name: string;
slug: string;
} | null;
created_at: string;
latest_table_assignment?: TableAssignment | null;
table_assignments?: TableAssignment[];
active_table_assignments?: TableAssignment[];
};

type RestaurantTable = {
id: number;
table_number: number;
status: string;
is_assigned?: boolean;
assigned_waiter?: {
id: number;
name: string;
} | null;
};

type Props = {
waiters: PaginatedData<StaffMember>;
kitchenStaff: PaginatedData<StaffMember>;
filters: {
search_waiter?: string;
status_waiter?: string;
search_kitchen?: string;
status_kitchen?: string;
};
};

type TabType = 'waiter' | 'kitchen';

type StaffFormData = {
first_name: string;
last_name: string;
email: string;
phone: string;
password: string;
password_confirmation: string;
role_id: string;
is_active: boolean;
};

type EditFormData = {
name: string;
email: string;
phone: string;
password: string;
password_confirmation: string;
role_id: string;
is_active: boolean;
};

type FormErrors = {
[key: string]: string;
};

const initialStaffForm: StaffFormData = {
first_name: '',
last_name: '',
email: '',
phone: '',
password: '',
password_confirmation: '',
role_id: '',
is_active: true,
};

const initialEditForm: EditFormData = {
name: '',
email: '',
phone: '',
password: '',
password_confirmation: '',
role_id: '',
is_active: true,
};

export default function StaffIndex({
waiters,
kitchenStaff,
filters,
}: Props) {
const [activeTab, setActiveTab] =
useState<TabType>('waiter');


const [searchWaiter, setSearchWaiter] =
    useState(filters.search_waiter || '');

const [searchKitchen, setSearchKitchen] =
    useState(filters.search_kitchen || '');

const [statusWaiter, setStatusWaiter] =
    useState(filters.status_waiter || 'all');

const [statusKitchen, setStatusKitchen] =
    useState(filters.status_kitchen || 'all');

// Add modal state
const [showAddModal, setShowAddModal] =
    useState(false);

const [addForm, setAddForm] =
    useState<StaffFormData>({
        ...initialStaffForm,
    });

const [addErrors, setAddErrors] =
    useState<FormErrors>({});

const [addLoading, setAddLoading] =
    useState(false);

// Edit modal state
const [showEditModal, setShowEditModal] =
    useState(false);

const [editForm, setEditForm] =
    useState<EditFormData>({
        ...initialEditForm,
    });

const [editErrors, setEditErrors] =
    useState<FormErrors>({});

const [editLoading, setEditLoading] =
    useState(false);

const [editingStaff, setEditingStaff] =
    useState<StaffMember | null>(null);

// Delete confirmation state
const [showDeleteModal, setShowDeleteModal] =
    useState(false);

const [deletingStaff, setDeletingStaff] =
    useState<StaffMember | null>(null);

const [deleteLoading, setDeleteLoading] =
    useState(false);

// View modal state
const [showViewModal, setShowViewModal] =
    useState(false);

const [viewingStaff, setViewingStaff] =
    useState<StaffMember | null>(null);

// Table assignment state
const [showAssignModal, setShowAssignModal] =
    useState(false);

const [assigningWaiter, setAssigningWaiter] =
    useState<StaffMember | null>(null);

const [tables, setTables] =
    useState<RestaurantTable[]>([]);

const [selectedTables, setSelectedTables] =
    useState<Set<string>>(new Set());

const [assignLoading, setAssignLoading] =
    useState(false);

const [tablesLoading, setTablesLoading] =
    useState(false);

const { auth } = usePage<{
    auth: {
        user: {
            role?: {
                slug: string;
            } | null;
        } | null;
    };
}>().props;

// Search debounce
useEffect(() => {
    const timer = setTimeout(() => {
        if (activeTab === 'waiter') {
            router.get(
                staffIndex.url(),
                {
                    search_waiter:
                        searchWaiter || undefined,

                    status_waiter:
                        statusWaiter === 'all'
                            ? undefined
                            : statusWaiter,

                    search_kitchen:
                        filters.search_kitchen,

                    status_kitchen:
                        filters.status_kitchen,
                },
                {
                    preserveState: true,
                    replace: true,
                },
            );
        } else {
            router.get(
                staffIndex.url(),
                {
                    search_kitchen:
                        searchKitchen || undefined,

                    status_kitchen:
                        statusKitchen === 'all'
                            ? undefined
                            : statusKitchen,

                    search_waiter:
                        filters.search_waiter,

                    status_waiter:
                        filters.status_waiter,
                },
                {
                    preserveState: true,
                    replace: true,
                },
            );
        }
    }, 300);

    return () => clearTimeout(timer);
}, [
    searchWaiter,
    searchKitchen,
    statusWaiter,
    statusKitchen,
    activeTab,
]);

const handleStatusFilter = (
    value: string,
) => {
    if (activeTab === 'waiter') {
        setStatusWaiter(value);
    } else {
        setStatusKitchen(value);
    }
};

const handleSearch = (
    value: string,
) => {
    if (activeTab === 'waiter') {
        setSearchWaiter(value);
    } else {
        setSearchKitchen(value);
    }
};

const currentData =
    activeTab === 'waiter'
        ? waiters
        : kitchenStaff;

const currentSearch =
    activeTab === 'waiter'
        ? searchWaiter
        : searchKitchen;

const currentStatus =
    activeTab === 'waiter'
        ? statusWaiter
        : statusKitchen;

// ============ ADD STAFF ============

const openAddModal = () => {
    setAddForm({
        ...initialStaffForm,
        role_id:
            activeTab === 'waiter'
                ? '4'
                : '3',
    });

    setAddErrors({});
    setShowAddModal(true);
};

const handleAddFieldChange = (
    field: keyof StaffFormData,
    value: string | boolean,
) => {
    setAddForm((prev) => ({
        ...prev,
        [field]: value,
    }));

    if (addErrors[field]) {
        setAddErrors((prev) => {
            const newErrors = {
                ...prev,
            };

            delete newErrors[field];

            return newErrors;
        });
    }
};

const validateAddForm = (): boolean => {
    const errors: FormErrors = {};

    if (!addForm.first_name.trim()) {
        errors.first_name =
            'First name is required';
    }

    if (!addForm.last_name.trim()) {
        errors.last_name =
            'Last name is required';
    }

    if (!addForm.email.trim()) {
        errors.email =
            'Email is required';
    } else if (
        !/\S+@\S+\.\S+/.test(
            addForm.email,
        )
    ) {
        errors.email =
            'Invalid email format';
    }

    if (!addForm.password) {
        errors.password =
            'Password is required';
    } else if (
        addForm.password.length < 8
    ) {
        errors.password =
            'Password must be at least 8 characters';
    }

    if (
        addForm.password !==
        addForm.password_confirmation
    ) {
        errors.password_confirmation =
            'Passwords do not match';
    }

    if (!addForm.role_id) {
        errors.role_id =
            'Role is required';
    }

    setAddErrors(errors);

    return (
        Object.keys(errors).length === 0
    );
};

const handleAddStaff = () => {
    if (!validateAddForm()) {
        return;
    }

    setAddLoading(true);

    router.post(
        staffStore.url(),
        addForm,
        {
            onSuccess: () => {
                setShowAddModal(false);

                setAddForm({
                    ...initialStaffForm,
                });

                setAddErrors({});
                setAddLoading(false);

                toast.success(
                    activeTab === 'waiter'
                        ? 'Waiter created successfully.'
                        : 'Kitchen staff created successfully.',
                );
            },

            onError: (errors) => {
                setAddErrors(
                    errors as FormErrors,
                );

                setAddLoading(false);
            },
        },
    );
};

// ============ EDIT STAFF ============

const openEditModal = (
    staff: StaffMember,
) => {
    setEditingStaff(staff);

    setEditForm({
        name: staff.name,
        email: staff.email,
        phone: staff.phone || '',
        password: '',
        password_confirmation: '',
        role_id: String(
            staff.role?.id || '',
        ),
        is_active: staff.is_active,
    });

    setEditErrors({});
    setShowEditModal(true);
};

const handleEditFieldChange = (
    field: keyof EditFormData,
    value: string | boolean,
) => {
    setEditForm((prev) => ({
        ...prev,
        [field]: value,
    }));

    if (editErrors[field]) {
        setEditErrors((prev) => {
            const newErrors = {
                ...prev,
            };

            delete newErrors[field];

            return newErrors;
        });
    }
};

const validateEditForm = (): boolean => {
    const errors: FormErrors = {};

    if (!editForm.name.trim()) {
        errors.name =
            'Name is required';
    }

    if (!editForm.email.trim()) {
        errors.email =
            'Email is required';
    } else if (
        !/\S+@\S+\.\S+/.test(
            editForm.email,
        )
    ) {
        errors.email =
            'Invalid email format';
    }

    if (
        editForm.password &&
        editForm.password.length < 8
    ) {
        errors.password =
            'Password must be at least 8 characters';
    }

    if (
        editForm.password !==
        editForm.password_confirmation
    ) {
        errors.password_confirmation =
            'Passwords do not match';
    }

    if (!editForm.role_id) {
        errors.role_id =
            'Role is required';
    }

    setEditErrors(errors);

    return (
        Object.keys(errors).length === 0
    );
};

const handleEditStaff = () => {
    if (
        !editingStaff ||
        !validateEditForm()
    ) {
        return;
    }

    setEditLoading(true);

    router.put(
        staffUpdate.url(
            editingStaff.id,
        ),
        editForm,
        {
            onSuccess: () => {
                setShowEditModal(false);
                setEditingStaff(null);

                setEditForm({
                    ...initialEditForm,
                });

                setEditErrors({});
                setEditLoading(false);

                toast.success(
                    'Staff member updated successfully.',
                );
            },

            onError: (errors) => {
                setEditErrors(
                    errors as FormErrors,
                );

                setEditLoading(false);
            },
        },
    );
};

// ============ DELETE STAFF ============

const openDeleteModal = (
    staff: StaffMember,
) => {
    setDeletingStaff(staff);
    setShowDeleteModal(true);
};

const handleDeleteStaff = () => {
    if (!deletingStaff) {
        return;
    }

    setDeleteLoading(true);

    router.delete(
        staffDestroy.url(
            deletingStaff.id,
        ),
        {
            onSuccess: () => {
                setShowDeleteModal(false);
                setDeletingStaff(null);
                setDeleteLoading(false);

                toast.success(
                    'Staff member deleted successfully.',
                );
            },

            onError: () => {
                setDeleteLoading(false);

                toast.error(
                    'Failed to delete staff member.',
                );
            },
        },
    );
};

// ============ TOGGLE STAFF STATUS ============

const handleToggleStatus = (
    staff: StaffMember,
) => {
    router.patch(
        `/admin/users/${staff.id}/toggle-status`,
        {},
        {
            preserveScroll: true,

            onSuccess: () => {
                toast.success(
                    staff.is_active
                        ? `${staff.name} has been deactivated.`
                        : `${staff.name} has been activated.`,
                );
            },

            onError: () => {
                toast.error(
                    'Failed to update staff status.',
                );
            },
        },
    );
};

// ============ VIEW STAFF ============

const openViewModal = (
    staff: StaffMember,
) => {
    setViewingStaff(staff);
    setShowViewModal(true);
};

// ============ TABLE ASSIGNMENT ============

const openAssignModal = async (
    waiter: StaffMember,
) => {
    setAssigningWaiter(waiter);
    setSelectedTables(new Set());
    setTablesLoading(true);
    setShowAssignModal(true);

    try {
        const response =
            await fetch('/api/tables');

        const data =
            await response.json();

        setTables(data);
    } catch {
        toast.error(
            'Failed to load tables.',
        );
    } finally {
        setTablesLoading(false);
    }
};

const toggleTableSelection = (
    tableId: string,
) => {
    setSelectedTables((prev) => {
        const next = new Set(prev);

        if (next.has(tableId)) {
            next.delete(tableId);
        } else {
            next.add(tableId);
        }

        return next;
    });
};

const handleAssignTables = () => {
    if (
        !assigningWaiter ||
        selectedTables.size === 0
    ) {
        return;
    }

    const selectedCount =
        selectedTables.size;

    setAssignLoading(true);

    router.post(
        '/admin/staff/assign-table',
        {
            waiter_id:
                assigningWaiter.id,

            table_ids:
                Array.from(
                    selectedTables,
                ),
        },
        {
            onSuccess: () => {
                setShowAssignModal(false);
                setAssigningWaiter(null);
                setSelectedTables(
                    new Set(),
                );
                setAssignLoading(false);

                toast.success(
                    `${selectedCount} table(s) assigned to waiter successfully.`,
                );
            },

            onError: () => {
                setAssignLoading(false);

                toast.error(
                    'Failed to assign tables.',
                );
            },
        },
    );
};

// ============ PAGINATION ============

const handlePageChange = (
    url: string | null,
) => {
    if (!url) {
        return;
    }

    router.get(
        url,
        {},
        {
            preserveState: true,
            preserveScroll: true,
        },
    );
};

const renderPagination = (
    data: PaginatedData<StaffMember>,
) => {
    if (data.last_page <= 1) {
        return null;
    }

    return (
        <div className="mt-4 flex items-center justify-center gap-2">
            {data.links.map(
                (link, i) => (
                    <Button
                        key={i}
                        variant={
                            link.active
                                ? 'default'
                                : 'outline'
                        }
                        size="sm"
                        disabled={
                            !link.url
                        }
                        onClick={() =>
                            handlePageChange(
                                link.url,
                            )
                        }
                    >
                        <span
                            dangerouslySetInnerHTML={{
                                __html: link.label,
                            }}
                        />
                    </Button>
                ),
            )}
        </div>
    );
};

const renderSkeletonRows = () => (
    <>
        {[1, 2, 3, 4, 5].map(
            (i) => (
                <tr
                    key={i}
                    className="border-b last:border-0"
                >
                    <td className="px-4 py-3">
                        <Skeleton className="h-4 w-32" />
                    </td>

                    <td className="px-4 py-3">
                        <Skeleton className="h-4 w-40" />
                    </td>

                    <td className="px-4 py-3">
                        <Skeleton className="h-4 w-28" />
                    </td>

                    <td className="px-4 py-3">
                        <Skeleton className="h-5 w-16 rounded-full" />
                    </td>

                    <td className="px-4 py-3 text-right">
                        <Skeleton className="ml-auto h-4 w-20" />
                    </td>
                </tr>
            ),
        )}
    </>
);

const getTableStatusVariant = (
    status: string | undefined,
):
    | 'default'
    | 'secondary'
    | 'outline'
    | 'destructive' => {
    switch (status) {
        case 'assigned':
            return 'secondary';

        case 'serving':
            return 'default';

        case 'completed':
            return 'outline';

        default:
            return 'outline';
    }
};

const renderTable = (
    data: PaginatedData<StaffMember>,
    showRole: boolean = false,
) => {
    const isWaiter =
        activeTab === 'waiter';

    const colSpan =
        showRole
            ? 7
            : isWaiter
                ? 6
                : 5;

    return (
        <Card>
            <CardContent className="overflow-x-auto p-0">
                <table className="w-full min-w-[600px]">
                    <thead>
                        <tr className="border-b text-left text-sm text-muted-foreground">
                            <th className="whitespace-nowrap px-4 py-3 font-medium">
                                Name
                            </th>

                            {showRole && (
                                <th className="whitespace-nowrap px-4 py-3 font-medium">
                                    Role
                                </th>
                            )}

                            <th className="whitespace-nowrap px-4 py-3 font-medium">
                                Email
                            </th>

                            <th className="whitespace-nowrap px-4 py-3 font-medium">
                                Phone
                            </th>

                            <th className="whitespace-nowrap px-4 py-3 font-medium">
                                Status
                            </th>

                            {isWaiter && (
                                <th className="whitespace-nowrap px-4 py-3 font-medium">
                                    Table Status
                                </th>
                            )}

                            <th className="whitespace-nowrap px-4 py-3 text-right font-medium">
                                Actions
                            </th>
                        </tr>
                    </thead>

                    <tbody>
                        {data.data.length ===
                        0 ? (
                            <tr>
                                <td
                                    colSpan={
                                        colSpan
                                    }
                                    className="px-4 py-12 text-center"
                                >
                                    <div className="flex flex-col items-center gap-2">
                                        <UtensilsCrossed className="h-8 w-8 text-muted-foreground/50" />

                                        <p className="text-sm text-muted-foreground">
                                            No{' '}
                                            {activeTab ===
                                            'waiter'
                                                ? 'waiters'
                                                : 'kitchen staff'}{' '}
                                            found.
                                        </p>

                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={
                                                openAddModal
                                            }
                                        >
                                            <Plus className="mr-1 h-3 w-3" />

                                            Add{' '}
                                            {activeTab ===
                                            'waiter'
                                                ? 'Waiter'
                                                : 'Kitchen Staff'}
                                        </Button>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            data.data.map(
                                (staff) => (
                                    <tr
                                        key={
                                            staff.id
                                        }
                                        className="border-b transition-colors last:border-0 hover:bg-muted/50"
                                    >
                                        {/* NAME */}
                                        <td className="px-4 py-3 text-sm font-medium">
                                            {
                                                staff.name
                                            }
                                        </td>

                                        {/* ROLE */}
                                        {showRole && (
                                            <td className="px-4 py-3">
                                                <Badge variant="secondary">
                                                    {staff.role
                                                        ?.name ||
                                                        'No role'}
                                                </Badge>
                                            </td>
                                        )}

                                        {/* EMAIL */}
                                        <td className="px-4 py-3 text-sm text-muted-foreground">
                                            {
                                                staff.email
                                            }
                                        </td>

                                        {/* PHONE */}
                                        <td className="px-4 py-3 text-sm text-muted-foreground">
                                            {staff.phone ||
                                                '—'}
                                        </td>

                                        {/* STATUS */}
                                        <td className="px-4 py-3">
                                            <Badge
                                                variant={
                                                    staff.is_active
                                                        ? 'default'
                                                        : 'destructive'
                                                }
                                            >
                                                {staff.is_active
                                                    ? 'Active'
                                                    : 'Inactive'}
                                            </Badge>
                                        </td>

                                        {/* TABLE STATUS */}
                                        {isWaiter && (
                                            <td className="px-4 py-3">
                                                {staff.active_table_assignments &&
                                                staff
                                                    .active_table_assignments
                                                    .length >
                                                    0 ? (
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {staff.active_table_assignments.map(
                                                            (
                                                                ta,
                                                            ) => (
                                                                <Badge
                                                                    key={
                                                                        ta.id
                                                                    }
                                                                    variant={getTableStatusVariant(
                                                                        ta.status,
                                                                    )}
                                                                    className="whitespace-nowrap text-xs capitalize"
                                                                >
                                                                    {ta.status ===
                                                                    'serving'
                                                                        ? '🛎️'
                                                                        : '📋'}{' '}
                                                                    Table{' '}
                                                                    {ta
                                                                        .table
                                                                        ?.table_number ??
                                                                        '?'}
                                                                </Badge>
                                                            ),
                                                        )}
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-muted-foreground">
                                                        —
                                                    </span>
                                                )}
                                            </td>
                                        )}

                                        {/* ACTIONS */}
                                        <td className="px-4 py-3 text-right">
                                            <div className="flex items-center justify-end gap-1">

                                                {/* SMALL BORDERLESS STATUS TOGGLE */}
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        handleToggleStatus(
                                                            staff,
                                                        )
                                                    }
                                                    className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-0 ${
                                                        staff.is_active
                                                            ? 'bg-green-500'
                                                            : 'bg-gray-300 dark:bg-gray-600'
                                                    }`}
                                                    title={
                                                        staff.is_active
                                                            ? 'Deactivate staff'
                                                            : 'Activate staff'
                                                    }
                                                    aria-label={
                                                        staff.is_active
                                                            ? `Deactivate ${staff.name}`
                                                            : `Activate ${staff.name}`
                                                    }
                                                >
                                                    <span
                                                        className={`pointer-events-none inline-block h-3.5 w-3.5 rounded-full bg-white shadow-sm transition-transform duration-200 ${
                                                            staff.is_active
                                                                ? 'translate-x-4'
                                                                : 'translate-x-0.5'
                                                        }`}
                                                    />
                                                </button>

                                                {/* VIEW */}
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() =>
                                                        openViewModal(
                                                            staff,
                                                        )
                                                    }
                                                    title="View"
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </Button>

                                                {/* EDIT */}
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() =>
                                                        openEditModal(
                                                            staff,
                                                        )
                                                    }
                                                    title="Edit"
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </Button>

                                                {/* DELETE */}
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() =>
                                                        openDeleteModal(
                                                            staff,
                                                        )
                                                    }
                                                    title="Delete"
                                                >
                                                    <Trash2 className="h-4 w-4 text-destructive" />
                                                </Button>

                                                {/* ASSIGN TABLE - WAITER ONLY */}
                                                {activeTab ===
                                                    'waiter' && (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() =>
                                                            openAssignModal(
                                                                staff,
                                                            )
                                                        }
                                                        title="Assign to Table"
                                                    >
                                                        <Table2 className="h-4 w-4 text-blue-500" />
                                                    </Button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ),
                            )
                        )}
                    </tbody>
                </table>
            </CardContent>
        </Card>
    );
};

return (
    <>
        <Head title="Staff Management" />

        <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">

            {/* PAGE HEADER */}
            <div className="flex items-center justify-between">
                <Heading
                    title="Staff Management"
                    description="Manage waiters and kitchen staff"
                />

                <Button
                    onClick={
                        openAddModal
                    }
                >
                    <Plus className="mr-2 h-4 w-4" />

                    Add{' '}
                    {activeTab ===
                    'waiter'
                        ? 'Waiter'
                        : 'Kitchen Staff'}
                </Button>
            </div>

            {/* TABS */}
            <div className="flex gap-1 border-b">
                <button
                    onClick={() =>
                        setActiveTab(
                            'waiter',
                        )
                    }
                    className={`relative px-4 py-2.5 text-sm font-medium transition-colors ${
                        activeTab ===
                        'waiter'
                            ? 'text-foreground after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-primary'
                            : 'text-muted-foreground hover:text-foreground'
                    }`}
                >
                    👨‍💼 Waiter Staff
                </button>

                <button
                    onClick={() =>
                        setActiveTab(
                            'kitchen',
                        )
                    }
                    className={`relative px-4 py-2.5 text-sm font-medium transition-colors ${
                        activeTab ===
                        'kitchen'
                            ? 'text-foreground after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-primary'
                            : 'text-muted-foreground hover:text-foreground'
                    }`}
                >
                    👨‍🍳 Kitchen Staff
                </button>
            </div>

            {/* FILTERS */}
            <div className="flex flex-wrap items-center gap-3">
                <div className="relative max-w-sm flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

                    <Input
                        placeholder={
                            activeTab ===
                            'waiter'
                                ? 'Search waiters...'
                                : 'Search kitchen staff...'
                        }
                        value={
                            currentSearch
                        }
                        onChange={(e) =>
                            handleSearch(
                                e.target.value,
                            )
                        }
                        className="pl-9"
                    />
                </div>

                <Select
                    value={
                        currentStatus
                    }
                    onValueChange={
                        handleStatusFilter
                    }
                >
                    <SelectTrigger className="w-[160px]">
                        <SelectValue placeholder="All Status" />
                    </SelectTrigger>

                    <SelectContent>
                        <SelectItem value="all">
                            All
                        </SelectItem>

                        <SelectItem value="active">
                            Active
                        </SelectItem>

                        <SelectItem value="inactive">
                            Inactive
                        </SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* STAFF TABLE */}
            {renderTable(
                currentData,
                activeTab ===
                    'kitchen',
            )}

            {/* PAGINATION */}
            {renderPagination(
                currentData,
            )}
        </div>

        {/* ADD MODAL */}
        <Dialog
            open={
                showAddModal
            }
            onOpenChange={
                setShowAddModal
            }
        >
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>
                        Add{' '}
                        {activeTab ===
                        'waiter'
                            ? 'Waiter'
                            : 'Kitchen Staff'}
                    </DialogTitle>

                    <DialogDescription>
                        Fill in the details to add a new staff member.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">

                    <div className="grid grid-cols-2 gap-3">

                        <div className="grid gap-2">
                            <Label htmlFor="first_name">
                                First Name
                            </Label>

                            <Input
                                id="first_name"
                                value={
                                    addForm.first_name
                                }
                                onChange={(
                                    e,
                                ) =>
                                    handleAddFieldChange(
                                        'first_name',
                                        e.target.value,
                                    )
                                }
                                className={
                                    addErrors.first_name
                                        ? 'border-destructive'
                                        : ''
                                }
                            />

                            {addErrors.first_name && (
                                <p className="text-xs text-destructive">
                                    {
                                        addErrors.first_name
                                    }
                                </p>
                            )}
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="last_name">
                                Last Name
                            </Label>

                            <Input
                                id="last_name"
                                value={
                                    addForm.last_name
                                }
                                onChange={(
                                    e,
                                ) =>
                                    handleAddFieldChange(
                                        'last_name',
                                        e.target.value,
                                    )
                                }
                                className={
                                    addErrors.last_name
                                        ? 'border-destructive'
                                        : ''
                                }
                            />

                            {addErrors.last_name && (
                                <p className="text-xs text-destructive">
                                    {
                                        addErrors.last_name
                                    }
                                </p>
                            )}
                        </div>

                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="add_email">
                            Email
                        </Label>

                        <Input
                            id="add_email"
                            type="email"
                            value={
                                addForm.email
                            }
                            onChange={(e) =>
                                handleAddFieldChange(
                                    'email',
                                    e.target.value,
                                )
                            }
                            className={
                                addErrors.email
                                    ? 'border-destructive'
                                    : ''
                            }
                        />

                        {addErrors.email && (
                            <p className="text-xs text-destructive">
                                {
                                    addErrors.email
                                }
                            </p>
                        )}
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="add_phone">
                            Phone Number
                        </Label>

                        <Input
                            id="add_phone"
                            value={
                                addForm.phone
                            }
                            onChange={(e) =>
                                handleAddFieldChange(
                                    'phone',
                                    e.target.value,
                                )
                            }
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-3">

                        <div className="grid gap-2">
                            <Label htmlFor="add_password">
                                Password
                            </Label>

                            <Input
                                id="add_password"
                                type="password"
                                value={
                                    addForm.password
                                }
                                onChange={(
                                    e,
                                ) =>
                                    handleAddFieldChange(
                                        'password',
                                        e.target.value,
                                    )
                                }
                                className={
                                    addErrors.password
                                        ? 'border-destructive'
                                        : ''
                                }
                            />

                            {addErrors.password && (
                                <p className="text-xs text-destructive">
                                    {
                                        addErrors.password
                                    }
                                </p>
                            )}
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="add_password_confirmation">
                                Confirm Password
                            </Label>

                            <Input
                                id="add_password_confirmation"
                                type="password"
                                value={
                                    addForm.password_confirmation
                                }
                                onChange={(
                                    e,
                                ) =>
                                    handleAddFieldChange(
                                        'password_confirmation',
                                        e.target.value,
                                    )
                                }
                                className={
                                    addErrors.password_confirmation
                                        ? 'border-destructive'
                                        : ''
                                }
                            />

                            {addErrors.password_confirmation && (
                                <p className="text-xs text-destructive">
                                    {
                                        addErrors.password_confirmation
                                    }
                                </p>
                            )}
                        </div>

                    </div>

                    <div className="grid gap-2">
                        <Label>
                            Status
                        </Label>

                        <Select
                            value={
                                addForm.is_active
                                    ? 'active'
                                    : 'inactive'
                            }
                            onValueChange={(
                                v,
                            ) =>
                                handleAddFieldChange(
                                    'is_active',
                                    v ===
                                        'active',
                                )
                            }
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>

                            <SelectContent>
                                <SelectItem value="active">
                                    Active
                                </SelectItem>

                                <SelectItem value="inactive">
                                    Inactive
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                </div>

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() =>
                            setShowAddModal(
                                false,
                            )
                        }
                    >
                        Cancel
                    </Button>

                    <Button
                        onClick={
                            handleAddStaff
                        }
                        disabled={
                            addLoading
                        }
                    >
                        {addLoading && (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}

                        Save
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>

        {/* EDIT MODAL */}
        <Dialog
            open={
                showEditModal
            }
            onOpenChange={
                setShowEditModal
            }
        >
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>
                        Edit{' '}
                        {activeTab ===
                        'waiter'
                            ? 'Waiter'
                            : 'Kitchen Staff'}
                    </DialogTitle>

                    <DialogDescription>
                        Update the staff member's details.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">

                    <div className="grid gap-2">
                        <Label htmlFor="edit_name">
                            Name
                        </Label>

                        <Input
                            id="edit_name"
                            value={
                                editForm.name
                            }
                            onChange={(e) =>
                                handleEditFieldChange(
                                    'name',
                                    e.target.value,
                                )
                            }
                            className={
                                editErrors.name
                                    ? 'border-destructive'
                                    : ''
                            }
                        />

                        {editErrors.name && (
                            <p className="text-xs text-destructive">
                                {
                                    editErrors.name
                                }
                            </p>
                        )}
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="edit_email">
                            Email
                        </Label>

                        <Input
                            id="edit_email"
                            type="email"
                            value={
                                editForm.email
                            }
                            onChange={(e) =>
                                handleEditFieldChange(
                                    'email',
                                    e.target.value,
                                )
                            }
                            className={
                                editErrors.email
                                    ? 'border-destructive'
                                    : ''
                            }
                        />

                        {editErrors.email && (
                            <p className="text-xs text-destructive">
                                {
                                    editErrors.email
                                }
                            </p>
                        )}
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="edit_phone">
                            Phone Number
                        </Label>

                        <Input
                            id="edit_phone"
                            value={
                                editForm.phone
                            }
                            onChange={(e) =>
                                handleEditFieldChange(
                                    'phone',
                                    e.target.value,
                                )
                            }
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-3">

                        <div className="grid gap-2">
                            <Label htmlFor="edit_password">
                                New Password (optional)
                            </Label>

                            <Input
                                id="edit_password"
                                type="password"
                                value={
                                    editForm.password
                                }
                                onChange={(
                                    e,
                                ) =>
                                    handleEditFieldChange(
                                        'password',
                                        e.target.value,
                                    )
                                }
                                className={
                                    editErrors.password
                                        ? 'border-destructive'
                                        : ''
                                }
                            />

                            {editErrors.password && (
                                <p className="text-xs text-destructive">
                                    {
                                        editErrors.password
                                    }
                                </p>
                            )}
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="edit_password_confirmation">
                                Confirm Password
                            </Label>

                            <Input
                                id="edit_password_confirmation"
                                type="password"
                                value={
                                    editForm.password_confirmation
                                }
                                onChange={(
                                    e,
                                ) =>
                                    handleEditFieldChange(
                                        'password_confirmation',
                                        e.target.value,
                                    )
                                }
                                className={
                                    editErrors.password_confirmation
                                        ? 'border-destructive'
                                        : ''
                                }
                            />

                            {editErrors.password_confirmation && (
                                <p className="text-xs text-destructive">
                                    {
                                        editErrors.password_confirmation
                                    }
                                </p>
                            )}
                        </div>

                    </div>

                    <div className="grid gap-2">
                        <Label>
                            Status
                        </Label>

                        <Select
                            value={
                                editForm.is_active
                                    ? 'active'
                                    : 'inactive'
                            }
                            onValueChange={(
                                v,
                            ) =>
                                handleEditFieldChange(
                                    'is_active',
                                    v ===
                                        'active',
                                )
                            }
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>

                            <SelectContent>
                                <SelectItem value="active">
                                    Active
                                </SelectItem>

                                <SelectItem value="inactive">
                                    Inactive
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                </div>

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() =>
                            setShowEditModal(
                                false,
                            )
                        }
                    >
                        Cancel
                    </Button>

                    <Button
                        onClick={
                            handleEditStaff
                        }
                        disabled={
                            editLoading
                        }
                    >
                        {editLoading && (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}

                        Save
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>

        {/* DELETE CONFIRMATION */}
        <Dialog
            open={
                showDeleteModal
            }
            onOpenChange={
                setShowDeleteModal
            }
        >
            <DialogContent className="sm:max-w-sm">
                <DialogHeader>
                    <DialogTitle>
                        Delete{' '}
                        {activeTab ===
                        'waiter'
                            ? 'Waiter'
                            : 'Kitchen Staff'}
                        ?
                    </DialogTitle>

                    <DialogDescription>
                        This action cannot be undone. This will permanently delete{' '}
                        <span className="font-medium text-foreground">
                            {
                                deletingStaff?.name
                            }
                        </span>
                        .
                    </DialogDescription>
                </DialogHeader>

                <DialogFooter className="gap-2 sm:gap-0">
                    <Button
                        variant="outline"
                        onClick={() =>
                            setShowDeleteModal(
                                false,
                            )
                        }
                    >
                        Cancel
                    </Button>

                    <Button
                        variant="destructive"
                        onClick={
                            handleDeleteStaff
                        }
                        disabled={
                            deleteLoading
                        }
                    >
                        {deleteLoading && (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}

                        Delete
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>

        {/* VIEW MODAL */}
        <Dialog
            open={
                showViewModal
            }
            onOpenChange={
                setShowViewModal
            }
        >
            <DialogContent className="sm:max-w-sm">
                <DialogHeader>
                    <DialogTitle>
                        Staff Details
                    </DialogTitle>
                </DialogHeader>

                {viewingStaff && (
                    <div className="space-y-3">

                        <div>
                            <Label className="text-xs text-muted-foreground">
                                Name
                            </Label>

                            <p className="text-sm font-medium">
                                {
                                    viewingStaff.name
                                }
                            </p>
                        </div>

                        <div>
                            <Label className="text-xs text-muted-foreground">
                                Email
                            </Label>

                            <p className="text-sm">
                                {
                                    viewingStaff.email
                                }
                            </p>
                        </div>

                        <div>
                            <Label className="text-xs text-muted-foreground">
                                Phone
                            </Label>

                            <p className="text-sm">
                                {viewingStaff.phone ||
                                    '—'}
                            </p>
                        </div>

                        <div>
                            <Label className="text-xs text-muted-foreground">
                                Role
                            </Label>

                            <p className="text-sm">
                                {viewingStaff.role
                                    ?.name ||
                                    'No role'}
                            </p>
                        </div>

                        <div>
                            <Label className="text-xs text-muted-foreground">
                                Status
                            </Label>

                            <Badge
                                variant={
                                    viewingStaff.is_active
                                        ? 'default'
                                        : 'destructive'
                                }
                            >
                                {viewingStaff.is_active
                                    ? 'Active'
                                    : 'Inactive'}
                            </Badge>
                        </div>

                        {viewingStaff.active_table_assignments &&
                            viewingStaff
                                .active_table_assignments
                                .length >
                                0 && (
                                <div>
                                    <Label className="text-xs text-muted-foreground">
                                        Assigned Tables
                                    </Label>

                                    <div className="mt-1 flex flex-wrap gap-1.5">
                                        {viewingStaff.active_table_assignments.map(
                                            (
                                                ta,
                                            ) => (
                                                <Badge
                                                    key={
                                                        ta.id
                                                    }
                                                    variant={getTableStatusVariant(
                                                        ta.status,
                                                    )}
                                                    className="text-xs capitalize"
                                                >
                                                    Table{' '}
                                                    {ta
                                                        .table
                                                        ?.table_number ??
                                                        '?'}{' '}
                                                    —{' '}
                                                    {
                                                        ta.status
                                                    }
                                                </Badge>
                                            ),
                                        )}
                                    </div>
                                </div>
                            )}

                    </div>
                )}

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() =>
                            setShowViewModal(
                                false,
                            )
                        }
                    >
                        Close
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>

        {/* TABLE ASSIGNMENT MODAL */}
        <Dialog
            open={
                showAssignModal
            }
            onOpenChange={
                setShowAssignModal
            }
        >
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>
                        Assign Tables to Waiter
                    </DialogTitle>

                    <DialogDescription>
                        Select one or more tables to assign to{' '}
                        {
                            assigningWaiter?.name
                        }.
                        Previous active assignments will be completed.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label>
                            Select Tables
                        </Label>

                        {tablesLoading ? (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Loader2 className="h-4 w-4 animate-spin" />

                                Loading tables...
                            </div>
                        ) : tables.length ===
                          0 ? (
                            <p className="text-sm text-muted-foreground">
                                No tables available.
                            </p>
                        ) : (
                            <div className="max-h-[280px] space-y-2 overflow-y-auto rounded-md border p-2">
                                {tables.map(
                                    (
                                        table,
                                    ) => {
                                        const tableId =
                                            String(
                                                table.id,
                                            );

                                        const isChecked =
                                            selectedTables.has(
                                                tableId,
                                            );

                                        const isAssignedElsewhere =
                                            table.is_assigned &&
                                            table.assigned_waiter &&
                                            table.assigned_waiter.id !==
                                                assigningWaiter?.id;

                                        return (
                                            <label
                                                key={
                                                    table.id
                                                }
                                                className={`flex items-center gap-3 rounded-md border p-3 transition-colors ${
                                                    isAssignedElsewhere
                                                        ? 'cursor-not-allowed border-muted bg-muted/30 opacity-60'
                                                        : isChecked
                                                            ? 'cursor-pointer border-primary/30 bg-primary/5'
                                                            : 'cursor-pointer hover:bg-muted/50'
                                                }`}
                                            >
                                                <Checkbox
                                                    checked={
                                                        isChecked
                                                    }
                                                    disabled={
                                                        !!isAssignedElsewhere
                                                    }
                                                    onCheckedChange={() =>
                                                        !isAssignedElsewhere &&
                                                        toggleTableSelection(
                                                            tableId,
                                                        )
                                                    }
                                                />

                                                <div className="flex w-full items-center justify-between">
                                                    <span className="text-sm font-medium">
                                                        Table{' '}
                                                        {
                                                            table.table_number
                                                        }
                                                    </span>

                                                    <div className="flex items-center gap-2">
                                                        {isAssignedElsewhere && (
                                                            <span className="text-xs text-muted-foreground">
                                                                Assigned to{' '}
                                                                {
                                                                    table
                                                                        .assigned_waiter
                                                                        ?.name
                                                                }
                                                            </span>
                                                        )}

                                                        <Badge
                                                            variant="outline"
                                                            className="text-xs capitalize"
                                                        >
                                                            {
                                                                table.status
                                                            }
                                                        </Badge>
                                                    </div>
                                                </div>
                                            </label>
                                        );
                                    },
                                )}
                            </div>
                        )}

                        {selectedTables.size >
                            0 && (
                            <p className="text-xs text-muted-foreground">
                                {
                                    selectedTables.size
                                }{' '}
                                table(s) selected
                            </p>
                        )}
                    </div>
                </div>

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() =>
                            setShowAssignModal(
                                false,
                            )
                        }
                    >
                        Cancel
                    </Button>

                    <Button
                        onClick={
                            handleAssignTables
                        }
                        disabled={
                            assignLoading ||
                            selectedTables.size ===
                                0
                        }
                    >
                        {assignLoading && (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}

                        Assign (
                        {
                            selectedTables.size
                        }
                        )
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    </>
);

}

StaffIndex.layout = {
breadcrumbs: [
{
title: 'Staff Management',
href: staffIndex.url(),
},
],
};
