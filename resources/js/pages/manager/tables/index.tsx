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
    FolderPlus,
} from 'lucide-react';
import { useMemo, useState } from 'react';

import Heading from '@/components/heading';
import { QrPreviewModal } from '@/components/qr-preview-modal';
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
import { useCan } from '@/hooks/use-can';

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
    table_number: number;
    qr_code: string;
    status: TableStatus;
    current_order_id: number | null;
    created_at: string;
    updated_at: string;
    section: {
        id: number;
        name: string;
        description: string | null;
        status: string;
    } | null;
};

type Props = {
    tables: RestaurantTable[];
    sections: {
        id: number;
        name: string;
        description: string | null;
        status: string;
    }[];
};

const statusLabels: Record<TableStatus, string> = {
    available: 'Available',
    occupied: 'Occupied',
    reserved: 'Reserved',
    unavailable: 'Unavailable',
};

const SECTION_ORDER = [
    'Main Dining',
    'VIP Dining',
    'Private Dining',
    'Terrace',
    'Garden',
    'Lounge',
];

const getSectionOrder = (name: string) => {
    const index = SECTION_ORDER.indexOf(name);

    return index === -1 ? SECTION_ORDER.length : index;
};

export default function TablesIndex({ tables, sections }: Props) {
    const can = useCan();
    const [search, setSearch] = useState('');

    const [statusFilter, setStatusFilter] = useState<
        'all' | TableStatus
    >('all');

    const [sectionFilter, setSectionFilter] = useState<string>('all');

    const [isAddOpen, setIsAddOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isQrPreviewOpen, setIsQrPreviewOpen] = useState(false);
    const [isViewOpen, setIsViewOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);

    const [selectedTable, setSelectedTable] =
        useState<RestaurantTable | null>(null);

    const [tableNumber, setTableNumber] = useState('');
    const [numberOfTables, setNumberOfTables] = useState('');
    const [tableSectionId, setTableSectionId] = useState<string>('');

    // Validation errors from the server
    const [errors, setErrors] = useState<Record<string, string>>({});

    // -----------------------------------------
    // Section State
    // -----------------------------------------

    const [isSectionAddOpen, setIsSectionAddOpen] = useState(false);
    const [isSectionEditOpen, setIsSectionEditOpen] = useState(false);
    const [isSectionDeleteOpen, setIsSectionDeleteOpen] = useState(false);

    const [selectedSection, setSelectedSection] =
        useState<{
            id: number;
            name: string;
            description: string | null;
            status: string;
        } | null>(null);

    const [sectionName, setSectionName] = useState('');
    const [sectionDescription, setSectionDescription] = useState('');
    const [sectionStatus, setSectionStatus] = useState('active');

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

            const matchesSection =
                sectionFilter === 'all' ||
                table.section?.id.toString() === sectionFilter;

            return matchesSearch && matchesStatus && matchesSection;
        });
    }, [tables, search, statusFilter, sectionFilter]);

    // -----------------------------------------
    // Group Tables by Section
    // -----------------------------------------

    const sectionGroups = useMemo(() => {
        const groups: {
            section: {
                id: number;
                name: string;
                description: string | null;
                status: string;
            } | null;
            tables: RestaurantTable[];
        }[] = [];

        const tablesBySection = new Map<string, RestaurantTable[]>();
        const unassigned: RestaurantTable[] = [];

        filteredTables.forEach((table) => {
            const sectionId = table.section?.id.toString();

            if (sectionId) {
                if (!tablesBySection.has(sectionId)) {
                    tablesBySection.set(sectionId, []);
                }

                tablesBySection.get(sectionId)!.push(table);
            } else {
                unassigned.push(table);
            }
        });

        sections.forEach((section) => {
            const sectionTables = tablesBySection.get(section.id.toString()) || [];

            sectionTables.sort((a, b) => a.table_number - b.table_number);
            groups.push({ section, tables: sectionTables });
        });

        groups.sort((a, b) => {
            if (a.section === null) {
                return 1;
            }

            if (b.section === null) {
                return -1;
            }

            return (
                getSectionOrder(a.section.name) -
                getSectionOrder(b.section.name)
            );
        });

        if (unassigned.length > 0) {
            unassigned.sort((a, b) => a.table_number - b.table_number);
            groups.push({ section: null, tables: unassigned });
        }

        return groups;
    }, [filteredTables, sections]);

    // -----------------------------------------
    // Open Add Modal
    // -----------------------------------------

    const openAddModal = (sectionId?: number) => {
        setNumberOfTables('5');
        setTableSectionId(sectionId ? sectionId.toString() : '');
        setErrors({});
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

        setTableSectionId(
            table.section?.id.toString() || '',
        );

        setIsEditOpen(true);
    };

    // -----------------------------------------
    // Open QR Preview Modal
    // -----------------------------------------

    const openQrPreview = (
        table: RestaurantTable,
    ) => {
        setSelectedTable(table);
        setIsQrPreviewOpen(true);
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

    const validateNumberOfTables = (value: string): string | null => {
        if (!value.trim()) {
            return 'Number of tables is required.';
        }

        if (!/^\d+$/.test(value)) {
            return 'Number of tables must be a positive whole number.';
        }

        const num = parseInt(value, 10);

        if (num < 1) {
            return 'Number of tables must be greater than 0.';
        }

        return null;
    };

    // -----------------------------------------
    // Add Table
    // -----------------------------------------

    const handleAdd = () => {
        let hasError = false;
        const newErrors: Record<string, string> = {};

        if (!tableSectionId) {
            newErrors.table_section_id = 'Please select a section.';
            hasError = true;
        }

        const numberError = validateNumberOfTables(numberOfTables);

        if (numberError) {
            newErrors.number_of_tables = numberError;
            hasError = true;
        }

        if (hasError) {
            setErrors(newErrors);

            return;
        }

        setErrors({});

        router.post(
            tablesStore.url(),
            {
                number_of_tables: parseInt(numberOfTables, 10),
                table_section_id: Number(tableSectionId),
            },
            {
                preserveScroll: true,
                preserveState: true,
                onSuccess: () => {
                    setIsAddOpen(false);
                    setNumberOfTables('');
                    setTableSectionId('');
                    setErrors({});
                },
                onError: (serverErrors) => {
                    setErrors(serverErrors);
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
                table_section_id: tableSectionId
                    ? Number(tableSectionId)
                    : null,
            },
            {
                preserveScroll: true,
                preserveState: true,
                onSuccess: () => {
                    setIsEditOpen(false);
                    setSelectedTable(null);
                    setTableSectionId('');
                },
                onError: (serverErrors) => {
                    setErrors(serverErrors);
                },
            },
        );
    };

    // -----------------------------------------
    // Toggle Table Status
    //
    // Available  → Toggle ON
    // Occupied   → Toggle OFF
    // Reserved / Unavailable → Disabled
    // -----------------------------------------

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
    // Regenerate QR Code
    // -----------------------------------------

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
            regenerateQr.url(
                table.id,
            ),
            {},
            {
                preserveScroll: true,
                preserveState: true,
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
                preserveScroll: true,
                onSuccess: () => {
                    setIsDeleteOpen(false);
                    setSelectedTable(null);
                },
            },
        );
    };

    // -----------------------------------------
    // Section CRUD
    // -----------------------------------------

    const openAddSectionModal = () => {
        setSectionName('');
        setSectionDescription('');
        setSectionStatus('active');
        setErrors({});
        setIsSectionAddOpen(true);
    };

    const openEditSectionModal = (
        section: {
            id: number;
            name: string;
            description: string | null;
            status: string;
        } | null,
    ) => {
        if (!section) {
            return;
        }

        setSelectedSection(section);
        setSectionName(section.name);
        setSectionDescription(section.description || '');
        setSectionStatus(section.status);
        setErrors({});
        setIsSectionEditOpen(true);
    };

    const openDeleteSectionModal = (
        section: {
            id: number;
            name: string;
            description: string | null;
            status: string;
        } | null,
    ) => {
        if (!section) {
            return;
        }

        setSelectedSection(section);
        setIsSectionDeleteOpen(true);
    };

    const handleAddSection = () => {
        if (!sectionName.trim()) {
            setErrors({ name: 'Section name is required.' });

            return;
        }

        setErrors({});

        router.post(
            '/manager/tables/sections',
            {
                name: sectionName.trim(),
                description: sectionDescription.trim() || null,
                status: sectionStatus,
            },
            {
                preserveScroll: true,
                preserveState: true,
                onSuccess: () => {
                    setIsSectionAddOpen(false);
                    setSectionName('');
                    setSectionDescription('');
                    setSectionStatus('active');
                    setErrors({});
                },
                onError: (serverErrors) => {
                    setErrors(serverErrors);
                },
            },
        );
    };

    const handleUpdateSection = () => {
        if (!selectedSection || !sectionName.trim()) {
            return;
        }

        router.put(
            `/manager/tables/sections/${selectedSection.id}`,
            {
                name: sectionName.trim(),
                description: sectionDescription.trim() || null,
                status: sectionStatus,
            },
            {
                preserveScroll: true,
                preserveState: true,
                onSuccess: () => {
                    setIsSectionEditOpen(false);
                    setSelectedSection(null);
                    setSectionName('');
                    setSectionDescription('');
                    setSectionStatus('active');
                    setErrors({});
                },
                onError: (serverErrors) => {
                    setErrors(serverErrors);
                },
            },
        );
    };

    const handleDeleteSection = () => {
        if (!selectedSection) {
            return;
        }

        router.delete(
            `/manager/tables/sections/${selectedSection.id}`,
            {
                preserveScroll: true,
                onSuccess: () => {
                    setIsSectionDeleteOpen(false);
                    setSelectedSection(null);
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
                        icon={Table2}
                    />

                    <div className="flex gap-2">
                        {can('create tables') && (
                            <Button
                                onClick={openAddSectionModal}
                            >
                                <FolderPlus className="mr-2 h-4 w-4" />
                                Add Section
                            </Button>
                        )}

                        {can('create tables') && (
                            <Button
                                onClick={() =>
                                    openAddModal()
                                }
                            >
                                <Plus className="mr-2 h-4 w-4" />
                                Add Table
                            </Button>
                        )}
                    </div>
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

                                    <SelectItem value="reserved">
                                        Reserved
                                    </SelectItem>

                                    <SelectItem value="unavailable">
                                        Unavailable
                                    </SelectItem>
                                </SelectContent>
                            </Select>

                            {/* Section Filter */}
                            <Select
                                value={sectionFilter}
                                onValueChange={setSectionFilter}
                            >
                                <SelectTrigger className="w-full sm:w-[200px]">
                                    <SelectValue placeholder="Filter by section" />
                                </SelectTrigger>

                                <SelectContent>
                                    <SelectItem value="all">
                                        All Sections
                                    </SelectItem>

                                    {sections.map((section) => (
                                        <SelectItem
                                            key={section.id}
                                            value={section.id.toString()}
                                        >
                                            {section.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </CardHeader>

                    <CardContent>
                        <div className="space-y-8">
                            {sectionGroups.map((group) => (
                                <Card key={group.section?.id ?? 'unassigned'}>
                                    <CardHeader className="pb-3">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <CardTitle className="text-base">
                                                    {group.section?.name ?? 'Unassigned'}
                                                </CardTitle>

                                                <p className="text-sm text-muted-foreground">
                                                    {group.tables.length} {group.tables.length === 1 ? 'Table' : 'Tables'}
                                                </p>
                                            </div>

                                            {group.section && (
                                                <div className="flex items-center gap-2">
                                                    {can('update tables') && (
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() =>
                                                                openEditSectionModal(
                                                                    group.section,
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
                                                                    group.section,
                                                                )
                                                            }
                                                        >
                                                            <Trash2 className="mr-2 h-4 w-4" />
                                                            Delete
                                                        </Button>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        {group.tables.length === 0 ? (
                                            <div className="flex flex-col items-center justify-center py-12 text-center">
                                                <p className="text-lg font-medium">
                                                    No tables assigned to this section.
                                                </p>

                                                {can('create tables') && (
                                                    <Button
                                                        className="mt-4"
                                                        onClick={() =>
                                                            openAddModal(
                                                                group.section?.id,
                                                            )
                                                        }
                                                    >
                                                        <Plus className="mr-2 h-4 w-4" />
                                                        Add Table
                                                    </Button>
                                                )}
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
                                                                Section
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
                                                        {group.tables.map((table) => (
                                                            <tr
                                                                key={table.id}
                                                                className="border-b last:border-0 hover:bg-muted/50"
                                                            >
                                                                {/* Table Number */}
                                                                <td className="p-3 font-medium">
                                                                    Table{' '}
                                                                    {table.table_number}
                                                                </td>

                                                                {/* Section */}
                                                                <td className="p-3">
                                                                    {table.section?.name ?? '—'}
                                                                </td>

                                                                {/* QR Code */}
                                                                <td className="p-3">
                                                                    {table.qr_code ? (
                                                                        table.qr_code.endsWith('.png') ||
                                                                        table.qr_code.endsWith('.jpg') ||
                                                                        table.qr_code.endsWith('.svg') ? (
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
                                                                        ) : (
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => openQrPreview(table)}
                                                                                title="Click to preview QR code"
                                                                                className="cursor-pointer text-sm text-blue-600 hover:underline"
                                                                            >
                                                                                {table.qr_code}
                                                                            </button>
                                                                        )
                                                                    ) : (
                                                                        <span className="text-muted-foreground">—</span>
                                                                    )}
                                                                </td>

                                                                {/* Status */}
                                                                <td className="p-3">
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
                                                                </td>

                                                                {/* Actions */}
                                                                <td className="p-3">
                                                                    <div className="flex items-center justify-end gap-2">

                                                                        {/* Status Toggle */}
                                                                        {can('status tables') && (
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
                                                                                    table.status === 'reserved' ||
                                                                                    table.status === 'unavailable'
                                                                                }
                                                                            />
                                                                        )}

                                                                        {/* View */}
                                                                        {can('view tables') && (
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
                                                                        )}

                                                                        {/* Edit */}
                                                                        {can('update tables') && (
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
                                                                        )}

                                                                        {/* Regenerate QR */}
                                                                        {can('update tables') && (
                                                                            <Button
                                                                                variant="outline"
                                                                                size="icon"
                                                                                onClick={() =>
                                                                                    handleRegenerateQr(
                                                                                        table,
                                                                                    )
                                                                                }
                                                                                title="Regenerate QR code (points to customer menu)"
                                                                            >
                                                                                <RefreshCw className="h-4 w-4" />
                                                                            </Button>
                                                                        )}

                                                                        {/* Delete */}
                                                                        {can('delete tables') && (
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
                                                                        )}
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* =========================================
                ADD TABLE MODAL
            ========================================= */}

            <Dialog
                open={isAddOpen}
                onOpenChange={(open) => {
                    setIsAddOpen(open);

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
                        {/* Section */}
                        <div>
                            <label className="mb-2 block text-sm font-medium">
                                Section
                            </label>

                            <Select
                                value={tableSectionId}
                                onValueChange={(value) => {
                                    setTableSectionId(value);

                                    if (errors.table_section_id) {
                                        setErrors((prev) => {
                                            const next = { ...prev };
                                            delete next.table_section_id;

                                            return next;
                                        });
                                    }
                                }}
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Select Section" />
                                </SelectTrigger>

                                <SelectContent>
                                    {sections.map((section) => (
                                        <SelectItem
                                            key={section.id}
                                            value={section.id.toString()}
                                        >
                                            {section.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            {errors.table_section_id && (
                                <p className="mt-1 text-sm text-red-500">
                                    {errors.table_section_id}
                                </p>
                            )}
                        </div>

                        {/* Number of Tables */}
                        <div>
                            <label className="mb-2 block text-sm font-medium">
                                Number of Tables
                            </label>

                            <Input
                                type="number"
                                min="1"
                                step="1"
                                value={numberOfTables}
                                onChange={(event) => {
                                    setNumberOfTables(
                                        event.target.value,
                                    );

                                    const error = validateNumberOfTables(
                                        event.target.value,
                                    );

                                    if (error) {
                                        setErrors((prev) => ({
                                            ...prev,
                                            number_of_tables: error,
                                        }));
                                    } else {
                                        setErrors((prev) => {
                                            const next = { ...prev };
                                            delete next.number_of_tables;

                                            return next;
                                        });
                                    }
                                }}
                                placeholder="Example: 5"
                            />

                            {errors.number_of_tables && (
                                <p className="mt-1 text-sm text-red-500">
                                    {errors.number_of_tables}
                                </p>
                            )}
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setIsAddOpen(
                                    false,
                                );
                                setErrors({});
                            }}
                        >
                            Cancel
                        </Button>

                        <Button
                            onClick={
                                handleAdd
                            }
                        >
                            Add Tables
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

                        {/* Section */}
                        <div>
                            <label className="mb-2 block text-sm font-medium">
                                Section
                            </label>

                            <Select
                                value={tableSectionId}
                                onValueChange={setTableSectionId}
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Select a section" />
                                </SelectTrigger>

                                <SelectContent>
                                    <SelectItem value="">
                                        No section
                                    </SelectItem>

                                    {sections.map((section) => (
                                        <SelectItem
                                            key={section.id}
                                            value={section.id.toString()}
                                        >
                                            {section.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
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

            {/* =========================================
                QR CODE PREVIEW MODAL
            ========================================= */}

            <QrPreviewModal
                table={selectedTable}
                open={isQrPreviewOpen}
                onOpenChange={setIsQrPreviewOpen}
            />

            {/* =========================================
                ADD SECTION MODAL
            ========================================= */}

            <Dialog
                open={isSectionAddOpen}
                onOpenChange={(open) => {
                    setIsSectionAddOpen(open);

                    if (!open) {
                        setErrors({});
                    }
                }}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            Create Section
                        </DialogTitle>

                        <DialogDescription>
                            Add a new section to organize your tables.
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
                                        event.target.value,
                                    );

                                    if (errors.name) {
                                        setErrors(
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

                            {errors.name && (
                                <p className="mt-1 text-sm text-red-500">
                                    {errors.name}
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-medium">
                                Description
                            </label>

                            <Input
                                value={sectionDescription}
                                onChange={(
                                    event,
                                ) =>
                                    setSectionDescription(
                                        event.target.value,
                                    )
                                }
                                placeholder="Optional description"
                            />
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-medium">
                                Status
                            </label>

                            <Select
                                value={sectionStatus}
                                onValueChange={setSectionStatus}
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Select status" />
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
                            onClick={() => {
                                setIsSectionAddOpen(
                                    false,
                                );
                                setErrors({});
                            }}
                        >
                            Cancel
                        </Button>

                        <Button
                            onClick={
                                handleAddSection
                            }
                        >
                            Save Section
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* =========================================
                EDIT SECTION MODAL
            ========================================= */}

            <Dialog
                open={isSectionEditOpen}
                onOpenChange={
                    setIsSectionEditOpen
                }
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            Edit Section
                        </DialogTitle>

                        <DialogDescription>
                            Update the section name and details.
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
                                        event.target.value,
                                    );

                                    if (errors.name) {
                                        setErrors(
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

                            {errors.name && (
                                <p className="mt-1 text-sm text-red-500">
                                    {errors.name}
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-medium">
                                Description
                            </label>

                            <Input
                                value={sectionDescription}
                                onChange={(
                                    event,
                                ) =>
                                    setSectionDescription(
                                        event.target.value,
                                    )
                                }
                                placeholder="Optional description"
                            />
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-medium">
                                Status
                            </label>

                            <Select
                                value={sectionStatus}
                                onValueChange={setSectionStatus}
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Select status" />
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
                                setIsSectionEditOpen(
                                    false,
                                )
                            }
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
                DELETE SECTION CONFIRMATION MODAL
            ========================================= */}

            <Dialog
                open={isSectionDeleteOpen}
                onOpenChange={
                    setIsSectionDeleteOpen
                }
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            Delete Section?
                        </DialogTitle>

                        <DialogDescription>
                            Are you sure you want to delete the section{' '}
                            <strong>
                                {
                                    selectedSection?.name
                                }
                            </strong>
                            ? Tables in this section will become unassigned.
                        </DialogDescription>
                    </DialogHeader>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() =>
                                setIsSectionDeleteOpen(
                                    false,
                                )
                            }
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
