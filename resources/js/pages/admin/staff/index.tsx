import { Head, router } from '@inertiajs/react';
import { Loader2, Table2, UserCog, UtensilsCrossed } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import Heading from '@/components/heading';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

import { useCan } from '@/hooks/use-can';

import { index as staffIndex } from '@/routes/admin/staff';

import type { PaginatedData } from '@/types';

type TableAssignment = {
    id: number;
    status: string;
    table: {
        id: number;
        table_number: number;
    } | null;
};

type Waiter = {
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
    waiters: PaginatedData<Waiter>;
};

export default function StaffIndex({
    waiters,
}: Props) {
    const can = useCan();

    const [showAssignModal, setShowAssignModal] =
        useState(false);

    const [assigningWaiter, setAssigningWaiter] =
        useState<Waiter | null>(null);

    const [tables, setTables] =
        useState<RestaurantTable[]>([]);

    const [selectedTables, setSelectedTables] =
        useState<Set<string>>(new Set());

    const [assignLoading, setAssignLoading] =
        useState(false);

    const [tablesLoading, setTablesLoading] =
        useState(false);

    const openAssignModal = async (
        waiter: Waiter,
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
        data: PaginatedData<Waiter>,
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

    return (
        <>
            <Head title="Staff Management" />

            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">

                {/* PAGE HEADER */}
                <div className="flex items-center justify-between">
                    <Heading
                        title="Staff Management"
                        description="Manage waiters and their table assignments"
                        icon={UserCog}
                    />
                </div>

                {/* WAITERS TABLE */}
                <Card>
                    <CardContent className="overflow-x-auto p-0">
                        <table className="w-full min-w-[700px]">
                            <thead>
                                <tr className="border-b text-left text-sm text-muted-foreground">
                                    <th className="whitespace-nowrap px-4 py-3 font-medium">
                                        Name
                                    </th>

                                    <th className="whitespace-nowrap px-4 py-3 font-medium">
                                        Email
                                    </th>

                                    <th className="whitespace-nowrap px-4 py-3 font-medium">
                                        Phone
                                    </th>

                                    <th className="whitespace-nowrap px-4 py-3 font-medium">
                                        Role
                                    </th>

                                    <th className="whitespace-nowrap px-4 py-3 font-medium">
                                        Status
                                    </th>

                                    <th className="whitespace-nowrap px-4 py-3 font-medium">
                                        Assigned Tables
                                    </th>

                                    <th className="whitespace-nowrap px-4 py-3 text-right font-medium">
                                        Actions
                                    </th>
                                </tr>
                            </thead>

                            <tbody>
                                {waiters.data.length ===
                                0 ? (
                                    <tr>
                                        <td
                                            colSpan={7}
                                            className="px-4 py-12 text-center"
                                        >
                                            <div className="flex flex-col items-center gap-2">
                                                <UtensilsCrossed className="h-8 w-8 text-muted-foreground/50" />

                                                <p className="text-sm text-muted-foreground">
                                                    No waiters found.
                                                </p>

                                                <p className="text-xs text-muted-foreground">
                                                    Create a waiter from
                                                    User Management and check
                                                    "Is this user a waiter?".
                                                </p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    waiters.data.map(
                                        (waiter) => (
                                            <tr
                                                key={
                                                    waiter.id
                                                }
                                                className="border-b transition-colors last:border-0 hover:bg-muted/50"
                                            >
                                                {/* NAME */}
                                                <td className="px-4 py-3 text-sm font-medium">
                                                    {
                                                        waiter.name
                                                    }
                                                </td>

                                                {/* EMAIL */}
                                                <td className="px-4 py-3 text-sm text-muted-foreground">
                                                    {
                                                        waiter.email
                                                    }
                                                </td>

                                                {/* PHONE */}
                                                <td className="px-4 py-3 text-sm text-muted-foreground">
                                                    {waiter.phone ||
                                                        '—'}
                                                </td>

                                                {/* ROLE */}
                                                <td className="px-4 py-3 text-sm">
                                                    {waiter.role
                                                        ?.name || (
                                                        <span className="text-muted-foreground">
                                                            No role
                                                        </span>
                                                    )}
                                                </td>

                                                {/* STATUS */}
                                                <td className="px-4 py-3">
                                                    <Badge
                                                        variant={
                                                            waiter.is_active
                                                                ? 'default'
                                                                : 'destructive'
                                                        }
                                                    >
                                                        {waiter.is_active
                                                            ? 'Active'
                                                            : 'Inactive'}
                                                    </Badge>
                                                </td>

                                                {/* ASSIGNED TABLES */}
                                                <td className="px-4 py-3">
                                                    {waiter.active_table_assignments &&
                                                    waiter
                                                        .active_table_assignments
                                                        .length >
                                                        0 ? (
                                                        <div className="flex flex-wrap gap-1.5">
                                                            {waiter.active_table_assignments.map(
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

                                                {/* ACTIONS */}
                                                <td className="px-4 py-3 text-right">
                                                    <div className="flex items-center justify-end gap-1">
                                                        {can('update staff') && (
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() =>
                                                                    openAssignModal(
                                                                        waiter,
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

                {/* PAGINATION */}
                {renderPagination(
                    waiters,
                )}
            </div>

            {/* TABLE ASSIGNMENT MODAL */}
            <Dialog
                open={showAssignModal}
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
