
import { Head, router } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import {
    Eye,
    Pencil,
    Plus,
    Printer,
    Search,
    Trash2,
} from 'lucide-react';

import Heading from '@/components/heading';
import StatusToggle from '@/components/status-toggle';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

import { Input } from '@/components/ui/input';

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

import {
    index as tablesIndex,
    store as tablesStore,
    update as tablesUpdate,
    destroy as tablesDestroy,
    toggleStatus,
} from '@/routes/manager/tables';

type TableStatus =
    | 'available'
    | 'occupied'
    | 'awaiting_payment';

type RestaurantTable = {
    id: number;
    table_number: number;
    qr_code: string;
    status: TableStatus;
    current_order_id: number | null;
    created_at: string;
    updated_at: string;
};

type Props = {
    tables: RestaurantTable[];
};

const statusLabels: Record<TableStatus, string> = {
    available: 'Available',
    occupied: 'Occupied',
    awaiting_payment: 'Awaiting Payment',
};

export default function TablesIndex({ tables }: Props) {
    const [search, setSearch] = useState('');

    const [statusFilter, setStatusFilter] = useState<
        'all' | TableStatus
    >('all');

    const [isAddOpen, setIsAddOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isViewOpen, setIsViewOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);

    const [selectedTable, setSelectedTable] =
        useState<RestaurantTable | null>(null);

    const [tableNumber, setTableNumber] = useState('');

    // -----------------------------------------
    // Filter Tables
    // -----------------------------------------

    const filteredTables = useMemo(() => {
        return tables.filter((table) => {
            const searchTerm = search.toLowerCase();

            const matchesSearch =
                table.table_number
                    .toString()
                    .includes(searchTerm) ||
                table.qr_code
                    .toLowerCase()
                    .includes(searchTerm);

            const matchesStatus =
                statusFilter === 'all' ||
                table.status === statusFilter;

            return matchesSearch && matchesStatus;
        });
    }, [tables, search, statusFilter]);

    // -----------------------------------------
    // Open Add Modal
    // -----------------------------------------

    const openAddModal = () => {
        setTableNumber('');
        setIsAddOpen(true);
    };

    // -----------------------------------------
    // Open Edit Modal
    // -----------------------------------------

    const openEditModal = (
        table: RestaurantTable,
    ) => {
        setSelectedTable(table);

        setTableNumber(
            table.table_number.toString(),
        );

        setIsEditOpen(true);
    };

    // -----------------------------------------
    // Open View Modal
    // -----------------------------------------

    const openViewModal = (
        table: RestaurantTable,
    ) => {
        setSelectedTable(table);
        setIsViewOpen(true);
    };

    // -----------------------------------------
    // Open Delete Modal
    // -----------------------------------------

    const openDeleteModal = (
        table: RestaurantTable,
    ) => {
        setSelectedTable(table);
        setIsDeleteOpen(true);
    };

    // -----------------------------------------
    // Add Table
    // -----------------------------------------

    const handleAdd = () => {
        if (!tableNumber) {
            return;
        }

        router.post(
            tablesStore.url(),
            {
                table_number: Number(tableNumber),
            },
            {
                onSuccess: () => {
                    setIsAddOpen(false);
                    setTableNumber('');
                },
            },
        );
    };

    // -----------------------------------------
    // Update Table
    // -----------------------------------------

    const handleUpdate = () => {
        if (!selectedTable || !tableNumber) {
            return;
        }

        router.put(
            tablesUpdate(
                selectedTable.id,
            ).url,
            {
                table_number: Number(
                    tableNumber,
                ),
            },
            {
                onSuccess: () => {
                    setIsEditOpen(false);
                    setSelectedTable(null);
                },
            },
        );
    };

    // -----------------------------------------
    // Toggle Table Status
    //
    // Available = Toggle ON
    // Occupied = Toggle OFF
    // Awaiting Payment = Disabled
    // -----------------------------------------

    const handleToggleStatus = (
        table: RestaurantTable,
    ) => {
        if (
            table.status ===
            'awaiting_payment'
        ) {
            return;
        }

        router.patch(
            toggleStatus.url(
                table.id,
            ),
            {},
            {
                preserveScroll: true,
            },
        );
    };

    // -----------------------------------------
    // Delete Table
    // -----------------------------------------

    const handleDelete = () => {
        if (!selectedTable) {
            return;
        }

        router.delete(
            tablesDestroy(
                selectedTable.id,
            ).url,
            {
                onSuccess: () => {
                    setIsDeleteOpen(false);
                    setSelectedTable(null);
                },
            },
        );
    };

    // -----------------------------------------
    // Print QR Code
    // -----------------------------------------

    const handlePrintQr = () => {
        if (!selectedTable?.qr_code) {
            return;
        }

        const printWindow =
            window.open(
                '',
                '_blank',
            );

        if (printWindow) {
            printWindow.document.write(`
                <html>
                    <head>
                        <title>
                            Print QR Code - Table ${selectedTable.table_number}
                        </title>

                        <style>
                            body {
                                display: flex;
                                flex-direction: column;
                                align-items: center;
                                justify-content: center;
                                height: 100vh;
                                margin: 0;
                                font-family: sans-serif;
                            }

                            img {
                                max-width: 60vw;
                                max-height: 60vh;
                            }

                            h1 {
                                font-size: 3rem;
                                margin-bottom: 20px;
                            }

                            @media print {
                                @page {
                                    margin: 0;
                                }

                                body {
                                    height: 100%;
                                    display: block;
                                    text-align: center;
                                    padding-top: 2in;
                                }
                            }
                        </style>
                    </head>

                    <body>
                        <h1>
                            Table ${selectedTable.table_number}
                        </h1>

                        <img
                            src="/storage/${selectedTable.qr_code}"
                            onload="window.print(); window.close();"
                        />
                    </body>
                </html>
            `);

            printWindow.document.close();
        }
    };

    return (
        <>
            <Head title="Table Management" />

            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl p-4">

                {/* Page Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <Heading
                        title="Table Management"
                        description="Manage your restaurant tables and QR codes."
                    />

                    <Button
                        onClick={
                            openAddModal
                        }
                    >
                        <Plus className="mr-2 h-4 w-4" />
                        Add Table
                    </Button>
                </div>

                {/* Tables Card */}
                <Card>
                    <CardHeader>
                        <CardTitle>
                            Restaurant Tables
                        </CardTitle>

                        {/* Search and Filter */}
                        <div className="flex flex-col gap-3 pt-4 sm:flex-row">

                            {/* Search */}
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

                                <Input
                                    placeholder="Search by table number or QR code..."
                                    value={search}
                                    onChange={(
                                        event,
                                    ) =>
                                        setSearch(
                                            event
                                                .target
                                                .value,
                                        )
                                    }
                                    className="pl-9"
                                />
                            </div>

                            {/* Status Filter */}
                            <Select
                                value={
                                    statusFilter
                                }
                                onValueChange={(
                                    value,
                                ) =>
                                    setStatusFilter(
                                        value as
                                            | 'all'
                                            | TableStatus,
                                    )
                                }
                            >
                                <SelectTrigger className="w-full sm:w-[200px]">
                                    <SelectValue placeholder="Filter by status" />
                                </SelectTrigger>

                                <SelectContent>
                                    <SelectItem value="all">
                                        All Statuses
                                    </SelectItem>

                                    <SelectItem value="available">
                                        Available
                                    </SelectItem>

                                    <SelectItem value="occupied">
                                        Occupied
                                    </SelectItem>

                                    <SelectItem value="awaiting_payment">
                                        Awaiting Payment
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </CardHeader>

                    <CardContent>
                        {filteredTables.length ===
                        0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-center">
                                <p className="text-lg font-medium">
                                    No tables found
                                </p>

                                <p className="mt-1 text-sm text-muted-foreground">
                                    Try changing your search or add a new table.
                                </p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b text-left">
                                            <th className="p-3">
                                                Table Number
                                            </th>

                                            <th className="p-3">
                                                QR Code
                                            </th>

                                            <th className="p-3">
                                                Status
                                            </th>

                                            <th className="p-3 text-right">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>

                                    <tbody>
                                        {filteredTables.map(
                                            (
                                                table,
                                            ) => (
                                                <tr
                                                    key={
                                                        table.id
                                                    }
                                                    className="border-b last:border-0 hover:bg-muted/50"
                                                >
                                                    {/* Table Number */}
                                                    <td className="p-3 font-medium">
                                                        Table{' '}
                                                        {
                                                            table.table_number
                                                        }
                                                    </td>

                                                    {/* QR Code */}
                                                    <td className="p-3">
                                                        {table.qr_code?.endsWith(
                                                            '.png',
                                                        ) ||
                                                        table.qr_code?.endsWith(
                                                            '.jpg',
                                                        ) ? (
                                                            <img
                                                                src={`/storage/${table.qr_code}`}
                                                                alt="QR"
                                                                className="h-10 w-10 rounded-md border bg-white object-contain"
                                                            />
                                                        ) : (
                                                            table.qr_code
                                                        )}
                                                    </td>

                                                    {/* Status */}
                                                    <td className="p-3">
                                                        <Badge
                                                            className={
                                                                table.status ===
                                                                'available'
                                                                    ? 'bg-black text-white hover:bg-black'
                                                                    : table.status ===
                                                                        'occupied'
                                                                      ? 'bg-red-600 text-white hover:bg-red-600'
                                                                      : 'bg-yellow-500 text-white hover:bg-yellow-500'
                                                            }
                                                        >
                                                            {
                                                                statusLabels[
                                                                    table.status
                                                                ]
                                                            }
                                                        </Badge>
                                                    </td>

                                                    {/* Actions */}
                                                    <td className="p-3">
                                                        <div className="flex items-center justify-end gap-2">

                                                            {/* Status Toggle */}
                                                            <StatusToggle
                                                                checked={
                                                                    table.status ===
                                                                    'available'
                                                                }
                                                                onCheckedChange={() =>
                                                                    handleToggleStatus(
                                                                        table,
                                                                    )
                                                                }
                                                                onLabel="Mark occupied"
                                                                offLabel="Mark available"
                                                                ariaLabel={
                                                                    table.status ===
                                                                    'available'
                                                                        ? 'Mark table occupied'
                                                                        : 'Mark table available'
                                                                }
                                                                disabled={
                                                                    table.status ===
                                                                    'awaiting_payment'
                                                                }
                                                            />

                                                            {/* View */}
                                                            <Button
                                                                variant="outline"
                                                                size="icon"
                                                                onClick={() =>
                                                                    openViewModal(
                                                                        table,
                                                                    )
                                                                }
                                                                title="View table"
                                                            >
                                                                <Eye className="h-4 w-4" />
                                                            </Button>

                                                            {/* Edit */}
                                                            <Button
                                                                variant="outline"
                                                                size="icon"
                                                                onClick={() =>
                                                                    openEditModal(
                                                                        table,
                                                                    )
                                                                }
                                                                title="Edit table"
                                                            >
                                                                <Pencil className="h-4 w-4" />
                                                            </Button>

                                                            {/* Delete */}
                                                            <Button
                                                                variant="destructive"
                                                                size="icon"
                                                                onClick={() =>
                                                                    openDeleteModal(
                                                                        table,
                                                                    )
                                                                }
                                                                title="Delete table"
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ),
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* =========================================
                ADD TABLE MODAL
            ========================================= */}

            <Dialog
                open={isAddOpen}
                onOpenChange={
                    setIsAddOpen
                }
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            Add Restaurant Table
                        </DialogTitle>

                        <DialogDescription>
                            Create a new restaurant table.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div>
                            <label className="mb-2 block text-sm font-medium">
                                Table Number
                            </label>

                            <Input
                                type="number"
                                min="1"
                                value={
                                    tableNumber
                                }
                                onChange={(
                                    event,
                                ) =>
                                    setTableNumber(
                                        event
                                            .target
                                            .value,
                                    )
                                }
                                placeholder="Example: 1"
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() =>
                                setIsAddOpen(
                                    false,
                                )
                            }
                        >
                            Cancel
                        </Button>

                        <Button
                            onClick={
                                handleAdd
                            }
                        >
                            Add Table
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* =========================================
                EDIT TABLE MODAL
            ========================================= */}

            <Dialog
                open={isEditOpen}
                onOpenChange={
                    setIsEditOpen
                }
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            Edit Table
                        </DialogTitle>

                        <DialogDescription>
                            Update the restaurant table information.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div>
                            <label className="mb-2 block text-sm font-medium">
                                Table Number
                            </label>

                            <Input
                                type="number"
                                min="1"
                                value={
                                    tableNumber
                                }
                                onChange={(
                                    event,
                                ) =>
                                    setTableNumber(
                                        event
                                            .target
                                            .value,
                                    )
                                }
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() =>
                                setIsEditOpen(
                                    false,
                                )
                            }
                        >
                            Cancel
                        </Button>

                        <Button
                            onClick={
                                handleUpdate
                            }
                        >
                            Update Table
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* =========================================
                QR CODE VIEW MODAL
            ========================================= */}

            <Dialog
                open={isViewOpen}
                onOpenChange={
                    setIsViewOpen
                }
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            Table{' '}
                            {
                                selectedTable?.table_number
                            }
                        </DialogTitle>

                        <DialogDescription>
                            QR Code information for this restaurant table.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="flex flex-col items-center gap-4 py-6">
                        <div className="flex flex-col items-center justify-center rounded-lg border bg-gray-50 p-8 text-center">
                            {selectedTable?.qr_code?.endsWith(
                                '.png',
                            ) ||
                            selectedTable?.qr_code?.endsWith(
                                '.jpg',
                            ) ? (
                                <img
                                    src={`/storage/${selectedTable.qr_code}`}
                                    alt="QR Code"
                                    className="h-auto w-full max-w-[200px] mix-blend-multiply"
                                />
                            ) : (
                                <p className="break-all text-sm text-muted-foreground">
                                    {
                                        selectedTable?.qr_code
                                    }
                                </p>
                            )}
                        </div>

                        <Button
                            onClick={
                                handlePrintQr
                            }
                        >
                            <Printer className="mr-2 h-4 w-4" />
                            Print
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* =========================================
                DELETE CONFIRMATION MODAL
            ========================================= */}

            <Dialog
                open={isDeleteOpen}
                onOpenChange={
                    setIsDeleteOpen
                }
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            Delete Table?
                        </DialogTitle>

                        <DialogDescription>
                            Are you sure you want to delete Table{' '}
                            {
                                selectedTable?.table_number
                            }
                            ? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() =>
                                setIsDeleteOpen(
                                    false,
                                )
                            }
                        >
                            Cancel
                        </Button>

                        <Button
                            variant="destructive"
                            onClick={
                                handleDelete
                            }
                        >
                            Delete Table
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

TablesIndex.layout = {
    breadcrumbs: [
        {
            title: 'Table Management',
            href: tablesIndex.url(),
        },
    ],
};

