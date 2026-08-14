import { Head, router } from '@inertiajs/react';
import {
    Eye,
    Pencil,
    Plus,
    Printer,
    RefreshCw,
    Search,
    Table2,
    Trash2,
} from 'lucide-react';
import { useMemo, useEffect, useState } from 'react';

import Heading from '@/components/heading';
import { QrPreviewModal } from '@/components/qr-preview-modal';
import StatusToggle from '@/components/status-toggle';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
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
import { useCan } from '@/hooks/use-can';

import {
    store as sectionsStore,
    update as sectionsUpdate,
    destroy as sectionsDestroy,
} from '@/routes/manager/table-sections';

import {
    index as tablesIndex,
    store as tablesStore,
    update as tablesUpdate,
    destroy as tablesDestroy,
    toggleStatus,
    regenerateQr,
} from '@/routes/manager/tables';

type TableStatus =
    | 'available'
    | 'occupied'
    | 'reserved'
    | 'unavailable';

type RestaurantTable = {
    id: number;
    table_section_id: number | null;
    table_number: number;
    qr_code: string;
    status: TableStatus;
    current_order_id: number | null;
    created_at: string;
    updated_at: string;
};

type TableSection = {
    id: number;
    name: string;
    description: string | null;
    tables_count: number;
    tables: RestaurantTable[];
};

type Props = {
    sections: TableSection[];
    tables: RestaurantTable[];
    editingSection?: TableSection | null;
};

const statusLabels: Record<TableStatus, string> = {
    available: 'Available',
    occupied: 'Occupied',
    reserved: 'Reserved',
    unavailable: 'Unavailable',
};

export default function TablesIndex({
    sections,
    tables,
    editingSection,
}: Props) {
    const can = useCan();
    const [search, setSearch] = useState('');

    const [statusFilter, setStatusFilter] = useState<
        'all' | TableStatus
    >('all');

    const [isAddTableOpen, setIsAddTableOpen] = useState(false);
    const [isEditTableOpen, setIsEditTableOpen] = useState(false);
    const [isQrPreviewOpen, setIsQrPreviewOpen] = useState(false);
    const [isViewOpen, setIsViewOpen] = useState(false);
    const [isDeleteTableOpen, setIsDeleteTableOpen] = useState(false);

    const [selectedTable, setSelectedTable] =
        useState<RestaurantTable | null>(null);

    const [tableNumber, setTableNumber] = useState('');
    const [tableSectionId, setTableSectionId] = useState<
        number | null
    >(null);

    const [errors, setErrors] = useState<Record<string, string>>({});

    const [isAddSectionOpen, setIsAddSectionOpen] =
        useState(false);
    const [isEditSectionOpen, setIsEditSectionOpen] =
        useState(false);
    const [isDeleteSectionOpen, setIsDeleteSectionOpen] =
        useState(false);

    const [sectionName, setSectionName] = useState('');
    const [sectionDescription, setSectionDescription] =
        useState('');
    const [sectionErrors, setSectionErrors] = useState<
        Record<string, string>
    >({});

    const [editingSectionData, setEditingSectionData] =
        useState<TableSection | null>(null);

    const [deletingSectionData, setDeletingSectionData] =
        useState<TableSection | null>(null);

    useEffect(() => {
        if (editingSection) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setEditingSectionData(editingSection);
            setSectionName(editingSection.name);
            setSectionDescription(
                editingSection.description || '',
            );
            setIsEditSectionOpen(true);
        }
    }, [editingSection]);

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

    const openAddSectionModal = () => {
        setSectionName('');
        setSectionDescription('');
        setSectionErrors({});
        setIsAddSectionOpen(true);
    };

    const openEditSectionModal = (
        section: TableSection,
    ) => {
        setEditingSectionData(section);
        setSectionName(section.name);
        setSectionDescription(section.description || '');
        setSectionErrors({});
        setIsEditSectionOpen(true);
    };

    const openDeleteSectionModal = (
        section: TableSection,
    ) => {
        setDeletingSectionData(section);
        setSectionErrors({});
        setIsDeleteSectionOpen(true);
    };

    const handleAddSection = () => {
        if (!sectionName.trim()) {
            setSectionErrors({
                name: 'Section name is required.',
            });

            return;
        }

        setSectionErrors({});

        router.post(
            sectionsStore.url(),
            {
                name: sectionName.trim(),
                description: sectionDescription.trim() || null,
            },
            {
                preserveScroll: true,
                preserveState: true,
                onSuccess: () => {
                    setIsAddSectionOpen(false);
                    setSectionName('');
                    setSectionDescription('');
                    setSectionErrors({});
                },
                onError: (serverErrors) => {
                    setSectionErrors(serverErrors);
                },
            },
        );
    };

    const handleUpdateSection = () => {
        if (!editingSectionData || !sectionName.trim()) {
            setSectionErrors({
                name: 'Section name is required.',
            });

            return;
        }

        setSectionErrors({});

        router.put(
            sectionsUpdate(
                editingSectionData.id,
            ).url,
            {
                name: sectionName.trim(),
                description: sectionDescription.trim() || null,
            },
            {
                preserveScroll: true,
                preserveState: true,
                onSuccess: () => {
                    setIsEditSectionOpen(false);
                    setEditingSectionData(null);
                    setSectionName('');
                    setSectionDescription('');
                    setSectionErrors({});
                },
                onError: (serverErrors) => {
                    setSectionErrors(serverErrors);
                },
            },
        );
    };

    const handleDeleteSection = () => {
        if (!deletingSectionData) {
            return;
        }

        router.delete(
            sectionsDestroy(
                deletingSectionData.id,
            ).url,
            {
                preserveScroll: true,
                onSuccess: () => {
                    setIsDeleteSectionOpen(false);
                    setDeletingSectionData(null);
                },
            },
        );
    };

    const openAddTableModal = () => {
        setTableNumber('');
        setTableSectionId(null);
        setErrors({});
        setIsAddTableOpen(true);
    };

    const openEditTableModal = (
        table: RestaurantTable,
    ) => {
        setSelectedTable(table);
        setTableNumber(table.table_number.toString());
        setTableSectionId(table.table_section_id);
        setIsEditTableOpen(true);
    };

    const openQrPreview = (
        table: RestaurantTable,
    ) => {
        setSelectedTable(table);
        setIsQrPreviewOpen(true);
    };

    const openViewModal = (
        table: RestaurantTable,
    ) => {
        setSelectedTable(table);
        setIsViewOpen(true);
    };

    const openDeleteTableModal = (
        table: RestaurantTable,
    ) => {
        setSelectedTable(table);
        setIsDeleteTableOpen(true);
    };

    const handleAddTable = () => {
        if (!tableNumber) {
            setErrors({ table_number: 'Please enter a table number.' });

            return;
        }

        setErrors({});

        router.post(
            tablesStore.url(),
            {
                table_number: Number(tableNumber),
                table_section_id: tableSectionId,
            },
            {
                preserveScroll: true,
                preserveState: true,
                onSuccess: () => {
                    setIsAddTableOpen(false);
                    setTableNumber('');
                    setTableSectionId(null);
                    setErrors({});
                },
                onError: (serverErrors) => {
                    setErrors(serverErrors);
                },
            },
        );
    };

    const handleUpdateTable = () => {
        if (!selectedTable || !tableNumber) {
            return;
        }

        router.put(
            tablesUpdate(
                selectedTable.id,
            ).url,
            {
                table_number: Number(tableNumber),
                table_section_id: tableSectionId,
            },
            {
                preserveScroll: true,
                preserveState: true,
                onSuccess: () => {
                    setIsEditTableOpen(false);
                    setSelectedTable(null);
                },
                onError: (serverErrors) => {
                    setErrors(serverErrors);
                },
            },
        );
    };

    const handleToggleStatus = (
        table: RestaurantTable,
    ) => {
        if (
            table.status === 'reserved' ||
            table.status === 'unavailable'
        ) {
            return;
        }

        router.patch(
            toggleStatus.url(table.id),
            {},
            {
                preserveScroll: true,
            },
        );
    };

    const handleRegenerateQr = (
        table: RestaurantTable,
    ) => {
        if (
            !window.confirm(
                `Regenerate the QR code for Table ${table.table_number}? The existing QR code will be replaced.`,
            )
        ) {
            return;
        }

        router.post(
            regenerateQr.url(table.id),
            {},
            {
                preserveScroll: true,
                preserveState: true,
            },
        );
    };

    const handleDeleteTable = () => {
        if (!selectedTable) {
            return;
        }

        router.delete(
            tablesDestroy(selectedTable.id).url,
            {
                preserveScroll: true,
                onSuccess: () => {
                    setIsDeleteTableOpen(false);
                    setSelectedTable(null);
                },
            },
        );
    };

    const handlePrintQr = () => {
        if (!selectedTable?.qr_code) {
            return;
        }

        const printWindow = window.open('', '_blank');

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

    const getSectionTables = (sectionId: number | null) => {
        return filteredTables.filter(
            (table) => table.table_section_id === sectionId,
        );
    };

    const renderTableActions = (table: RestaurantTable) => (
        <div className="flex items-center justify-end gap-2">
            {can('status tables') && (
                <StatusToggle
                    checked={
                        table.status === 'available'
                    }
                    onCheckedChange={() =>
                        handleToggleStatus(table)
                    }
                    onLabel="Mark occupied"
                    offLabel="Mark available"
                    ariaLabel={
                        table.status === 'available'
                            ? 'Mark table occupied'
                            : 'Mark table available'
                    }
                    disabled={
                        table.status === 'reserved' ||
                        table.status === 'unavailable'
                    }
                />
            )}

            {can('view tables') && (
                <Button
                    variant="outline"
                    size="icon"
                    onClick={() =>
                        openViewModal(table)
                    }
                    title="View table"
                >
                    <Eye className="h-4 w-4" />
                </Button>
            )}

            {can('update tables') && (
                <Button
                    variant="outline"
                    size="icon"
                    onClick={() =>
                        openEditTableModal(table)
                    }
                    title="Edit table"
                >
                    <Pencil className="h-4 w-4" />
                </Button>
            )}

            {can('update tables') && (
                <Button
                    variant="outline"
                    size="icon"
                    onClick={() =>
                        handleRegenerateQr(table)
                    }
                    title="Regenerate QR code (points to customer menu)"
                >
                    <RefreshCw className="h-4 w-4" />
                </Button>
            )}

            {can('delete tables') && (
                <Button
                    variant="destructive"
                    size="icon"
                    onClick={() =>
                        openDeleteTableModal(table)
                    }
                    title="Delete table"
                >
                    <Trash2 className="h-4 w-4" />
                </Button>
            )}
        </div>
    );

    const renderQrCell = (table: RestaurantTable) => {
        if (
            table.qr_code?.endsWith('.png') ||
            table.qr_code?.endsWith('.jpg') ||
            table.qr_code?.endsWith('.svg')
        ) {
            return (
                <button
                    type="button"
                    onClick={() => openQrPreview(table)}
                    title="Click to preview QR code"
                    className="cursor-pointer transition hover:opacity-80"
                >
                    <img
                        src={`/storage/${table.qr_code}`}
                        alt="QR"
                        className="h-10 w-10 rounded-md border bg-white object-contain"
                    />
                </button>
            );
        }

        return (
            <button
                type="button"
                onClick={() => openQrPreview(table)}
                title="Click to preview QR code"
                className="cursor-pointer text-sm text-blue-600 hover:underline"
            >
                {table.qr_code}
            </button>
        );
    };

    const renderStatusBadge = (table: RestaurantTable) => (
        <Badge
            variant="outline"
            className={
                table.status === 'available'
                    ? 'border-green-600 bg-white text-green-600'
                    : table.status === 'occupied'
                      ? 'border-red-600 bg-white text-red-600'
                      : table.status === 'reserved'
                        ? 'border-blue-600 bg-white text-blue-600'
                        : 'border-gray-400 bg-white text-gray-500'
            }
        >
            {statusLabels[table.status]}
        </Badge>
    );

    const renderSectionTable = (sectionTables: RestaurantTable[]) => {
        if (sectionTables.length === 0) {
            return (
                <div className="rounded-lg border border-dashed py-8 text-center">
                    <p className="text-sm text-muted-foreground">
                        No tables assigned to this section.
                    </p>

                    {can('create tables') && (
                        <Button
                            variant="outline"
                            size="sm"
                            className="mt-3"
                            onClick={openAddTableModal}
                        >
                            <Plus className="mr-2 h-4 w-4" />
                            Add Table
                        </Button>
                    )}
                </div>
            );
        }

        return (
            <div className="overflow-x-auto rounded-lg border">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b bg-muted/50 text-left">
                            <th className="p-3 font-medium">
                                Table Number
                            </th>

                            <th className="p-3 font-medium">
                                Section
                            </th>

                            <th className="p-3 font-medium">
                                QR Code
                            </th>

                            <th className="p-3 font-medium">
                                Status
                            </th>

                            <th className="p-3 font-medium text-right">
                                Actions
                            </th>
                        </tr>
                    </thead>

                    <tbody>
                        {sectionTables.map((table) => (
                            <tr
                                key={table.id}
                                className="border-b last:border-0 hover:bg-muted/50"
                            >
                                <td className="p-3 font-medium">
                                    Table{' '}
                                    {table.table_number}
                                </td>

                                <td className="p-3">
                                    {sections.find(
                                        (s) =>
                                            s.id ===
                                            table.table_section_id,
                                    )?.name ||
                                        '—'}
                                </td>

                                <td className="p-3">
                                    {renderQrCell(table)}
                                </td>

                                <td className="p-3">
                                    {renderStatusBadge(table)}
                                </td>

                                <td className="p-3">
                                    {renderTableActions(
                                        table,
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    };

    return (
        <>
            <Head title="Table Management" />

            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl p-4">

                {/* Page Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <Heading
                        title="Table Management"
                        description="Manage your restaurant tables and sections."
                        icon={Table2}
                    />

                    <div className="flex items-center gap-2">
                        {can('create tables') && (
                            <Button
                                variant="outline"
                                onClick={openAddSectionModal}
                            >
                                <Plus className="mr-2 h-4 w-4" />
                                Add Section
                            </Button>
                        )}

                        {can('create tables') && (
                            <Button
                                onClick={openAddTableModal}
                            >
                                <Plus className="mr-2 h-4 w-4" />
                                Add Table
                            </Button>
                        )}
                    </div>
                </div>

                {/* Search and Filter */}
                <Card>
                    <CardHeader>
                        <CardTitle>
                            Search and Filter
                        </CardTitle>

                        <div className="flex flex-col gap-3 pt-4 sm:flex-row">
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

                                    <SelectItem value="reserved">
                                        Reserved
                                    </SelectItem>

                                    <SelectItem value="unavailable">
                                        Unavailable
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </CardHeader>
                </Card>

                {/* Sections - Vertical Layout */}
                <div className="flex flex-col gap-8">
                    {sections.map((section) => {
                        const sectionTables = getSectionTables(section.id);
                        const totalTables = section.tables_count;

                        return (
                            <div key={section.id} className="space-y-3">
                                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                    <div>
                                        <h3 className="text-lg font-semibold uppercase tracking-wide">
                                            {section.name}
                                        </h3>

                                        <p className="mt-1 text-sm text-muted-foreground">
                                            {totalTables} Table
                                            {totalTables !== 1 ? 's' : ''}
                                        </p>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        {can('update tables') && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() =>
                                                    openEditSectionModal(
                                                        section,
                                                    )
                                                }
                                            >
                                                <Pencil className="mr-2 h-4 w-4" />
                                                Edit
                                            </Button>
                                        )}

                                        {can('delete tables') && (
                                            <Button
                                                variant="destructive"
                                                size="sm"
                                                onClick={() =>
                                                    openDeleteSectionModal(
                                                        section,
                                                    )
                                                }
                                            >
                                                <Trash2 className="mr-2 h-4 w-4" />
                                                Delete
                                            </Button>
                                        )}
                                    </div>
                                </div>

                                {renderSectionTable(sectionTables)}
                            </div>
                        );
                    })}

                    {(() => {
                        const unassignedTables = getSectionTables(null);
                        const totalUnassigned = tables.filter(
                            (t) => t.table_section_id === null,
                        ).length;

                        return (
                            <div className="space-y-3">
                                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                    <div>
                                        <h3 className="text-lg font-semibold uppercase tracking-wide">
                                            Unassigned
                                        </h3>

                                        <p className="mt-1 text-sm text-muted-foreground">
                                            {totalUnassigned} Table
                                            {totalUnassigned !== 1 ? 's' : ''}
                                        </p>
                                    </div>
                                </div>

                                {renderSectionTable(unassignedTables)}
                            </div>
                        );
                    })()}
                </div>

            </div>

            {/* =========================================
                ADD SECTION MODAL
            ========================================= */}

            <Dialog
                open={isAddSectionOpen}
                onOpenChange={(open) => {
                    setIsAddSectionOpen(open);

                    if (!open) {
                        setSectionErrors({});
                    }
                }}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            Add Section
                        </DialogTitle>

                        <DialogDescription>
                            Create a new table section.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div>
                            <label className="mb-2 block text-sm font-medium">
                                Section Name
                            </label>

                            <Input
                                value={sectionName}
                                onChange={(
                                    event,
                                ) => {
                                    setSectionName(
                                        event
                                            .target
                                            .value,
                                    );

                                    if (sectionErrors.name) {
                                        setSectionErrors(
                                            (prev) => {
                                                const next = {
                                                    ...prev,
                                                };

                                                delete next.name;

                                                return next;
                                            },
                                        );
                                    }
                                }}
                                placeholder="Example: Main Dining"
                            />

                            {sectionErrors.name && (
                                <p className="mt-1 text-sm text-red-500">
                                    {sectionErrors.name}
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-medium">
                                Description (optional)
                            </label>

                            <Input
                                value={sectionDescription}
                                onChange={(
                                    event,
                                ) =>
                                    setSectionDescription(
                                        event
                                            .target
                                            .value,
                                    )
                                }
                                placeholder="Brief description"
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setIsAddSectionOpen(
                                    false,
                                );
                                setSectionErrors(
                                    {},
                                );
                            }}
                        >
                            Cancel
                        </Button>

                        <Button
                            onClick={
                                handleAddSection
                            }
                        >
                            Add Section
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* =========================================
                EDIT SECTION MODAL
            ========================================= */}

            <Dialog
                open={isEditSectionOpen}
                onOpenChange={
                    setIsEditSectionOpen
                }
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            Edit Section
                        </DialogTitle>

                        <DialogDescription>
                            Update the section name and description.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div>
                            <label className="mb-2 block text-sm font-medium">
                                Section Name
                            </label>

                            <Input
                                value={sectionName}
                                onChange={(
                                    event,
                                ) => {
                                    setSectionName(
                                        event
                                            .target
                                            .value,
                                    );

                                    if (sectionErrors.name) {
                                        setSectionErrors(
                                            (prev) => {
                                                const next = {
                                                    ...prev,
                                                };

                                                delete next.name;

                                                return next;
                                            },
                                        );
                                    }
                                }}
                                placeholder="Example: Main Dining"
                            />

                            {sectionErrors.name && (
                                <p className="mt-1 text-sm text-red-500">
                                    {sectionErrors.name}
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-medium">
                                Description (optional)
                            </label>

                            <Input
                                value={sectionDescription}
                                onChange={(
                                    event,
                                ) =>
                                    setSectionDescription(
                                        event
                                            .target
                                            .value,
                                    )
                                }
                                placeholder="Brief description"
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setIsEditSectionOpen(
                                    false,
                                );
                                setEditingSectionData(
                                    null,
                                );
                            }}
                        >
                            Cancel
                        </Button>

                        <Button
                            onClick={
                                handleUpdateSection
                            }
                        >
                            Update Section
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* =========================================
                DELETE SECTION MODAL
            ========================================= */}

            <Dialog
                open={isDeleteSectionOpen}
                onOpenChange={
                    setIsDeleteSectionOpen
                }
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            Delete Section?
                        </DialogTitle>

                        <DialogDescription>
                            Are you sure you want to delete{' '}
                            <strong>
                                {
                                    deletingSectionData?.name
                                }
                            </strong>
                            ? Tables in this section will become
                            unassigned. This action cannot be
                            undone.
                        </DialogDescription>
                    </DialogHeader>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setIsDeleteSectionOpen(
                                    false,
                                );
                                setDeletingSectionData(
                                    null,
                                );
                            }}
                        >
                            Cancel
                        </Button>

                        <Button
                            variant="destructive"
                            onClick={
                                handleDeleteSection
                            }
                        >
                            Delete Section
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* =========================================
                ADD TABLE MODAL
            ========================================= */}

            <Dialog
                open={isAddTableOpen}
                onOpenChange={(open) => {
                    setIsAddTableOpen(open);

                    if (!open) {
                        setErrors({});
                    }
                }}
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
                                value={tableNumber}
                                onChange={(
                                    event,
                                ) => {
                                    setTableNumber(
                                        event
                                            .target
                                            .value,
                                    );

                                    if (
                                        errors.table_number
                                    ) {
                                        setErrors(
                                            (prev) => {
                                                const next = {
                                                    ...prev,
                                                };

                                                delete next.table_number;

                                                return next;
                                            },
                                        );
                                    }
                                }}
                                placeholder="Example: 1"
                            />

                            {errors.table_number && (
                                <p className="mt-1 text-sm text-red-500">
                                    {errors.table_number}
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-medium">
                                Section (optional)
                            </label>

                            <Select
                                value={
                                    tableSectionId
                                        ? String(
                                              tableSectionId,
                                          )
                                        : undefined
                                }
                                onValueChange={(
                                    value,
                                ) =>
                                    setTableSectionId(
                                        value
                                            ? Number(
                                                  value,
                                              )
                                            : null,
                                    )
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a section" />
                                </SelectTrigger>

                                <SelectContent>
                                    <SelectItem value="none">
                                        No section
                                    </SelectItem>

                                    {sections.map(
                                        (section) => (
                                            <SelectItem
                                                key={
                                                    section.id
                                                }
                                                value={String(
                                                    section
                                                        .id,
                                                )}
                                            >
                                                {
                                                    section.name
                                                }
                                            </SelectItem>
                                        ),
                                    )}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setIsAddTableOpen(
                                    false,
                                );
                                setErrors({});
                            }}
                        >
                            Cancel
                        </Button>

                        <Button
                            onClick={
                                handleAddTable
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
                open={isEditTableOpen}
                onOpenChange={setIsEditTableOpen}
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
                                value={tableNumber}
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

                        <div>
                            <label className="mb-2 block text-sm font-medium">
                                Section
                            </label>

                            <Select
                                value={
                                    tableSectionId
                                        ? String(
                                              tableSectionId,
                                          )
                                        : undefined
                                }
                                onValueChange={(
                                    value,
                                ) =>
                                    setTableSectionId(
                                        value
                                            ? Number(
                                                  value,
                                              )
                                            : null,
                                    )
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a section" />
                                </SelectTrigger>

                                <SelectContent>
                                    <SelectItem value="none">
                                        No section
                                    </SelectItem>

                                    {sections.map(
                                        (section) => (
                                            <SelectItem
                                                key={
                                                    section.id
                                                }
                                                value={String(
                                                    section
                                                        .id,
                                                )}
                                            >
                                                {
                                                    section.name
                                                }
                                            </SelectItem>
                                        ),
                                    )}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() =>
                                setIsEditTableOpen(
                                    false,
                                )
                            }
                        >
                            Cancel
                        </Button>

                        <Button
                            onClick={
                                handleUpdateTable
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
                onOpenChange={setIsViewOpen}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            Table{' '}
                            {selectedTable?.table_number}
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
                            ) ||
                            selectedTable?.qr_code?.endsWith(
                                '.svg',
                            ) ? (
                                <img
                                    src={`/storage/${selectedTable.qr_code}`}
                                    alt="QR Code"
                                    className="h-auto w-full max-w-[200px] mix-blend-multiply"
                                />
                            ) : (
                                <p className="break-all text-sm text-muted-foreground">
                                    {selectedTable?.qr_code}
                                </p>
                            )}
                        </div>

                        <Button
                            onClick={handlePrintQr}
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
                open={isDeleteTableOpen}
                onOpenChange={setIsDeleteTableOpen}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            Delete Table?
                        </DialogTitle>

                        <DialogDescription>
                            Are you sure you want to delete Table{' '}
                            {selectedTable?.table_number}
                            ? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() =>
                                setIsDeleteTableOpen(
                                    false,
                                )
                            }
                        >
                            Cancel
                        </Button>

                        <Button
                            variant="destructive"
                            onClick={handleDeleteTable}
                        >
                            Delete Table
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* =========================================
                QR CODE PREVIEW MODAL
            ========================================= */}

            <QrPreviewModal
                table={selectedTable}
                open={isQrPreviewOpen}
                onOpenChange={setIsQrPreviewOpen}
            />
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
