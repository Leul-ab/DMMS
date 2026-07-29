import { useState, useCallback } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Download,
    Printer,
    Copy,
    ExternalLink,
    RefreshCw,
    LoaderCircle,
    ImageOff,
} from 'lucide-react';

type RestaurantTable = {
    id: number;
    table_number: number;
    qr_code: string;
    status: string;
    created_at?: string;
};

type QrPreviewModalProps = {
    table: RestaurantTable | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
};

const statusLabels: Record<string, string> = {
    available: 'Available',
    occupied: 'Occupied',
    awaiting_payment: 'Awaiting Payment',
};

const statusColors: Record<string, string> = {
    available: 'bg-green-500 text-white hover:bg-green-500',
    occupied: 'bg-red-600 text-white hover:bg-red-600',
    awaiting_payment: 'bg-yellow-500 text-white hover:bg-yellow-500',
};

export function QrPreviewModal({ table, open, onOpenChange }: QrPreviewModalProps) {
    const [imageError, setImageError] = useState(false);
    const [copied, setCopied] = useState(false);
    const [isRegenerating, setIsRegenerating] = useState(false);

    // Reset state when modal opens with a new table
    const handleOpenChange = useCallback((newOpen: boolean) => {
        if (newOpen) {
            setImageError(false);
            setCopied(false);
        }
        onOpenChange(newOpen);
    }, [onOpenChange]);

    if (!table) return null;

    const qrImageUrl = `/storage/${table.qr_code}`;
    const menuUrl = `${window.location.origin}/menu?table=${table.table_number}`;
    const isSvg = table.qr_code?.endsWith('.svg');
    const isImage = table.qr_code?.endsWith('.png') || table.qr_code?.endsWith('.jpg') || isSvg;

    // Copy menu link to clipboard
    const handleCopyLink = async () => {
        try {
            await navigator.clipboard.writeText(menuUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            // Fallback
            const textArea = document.createElement('textarea');
            textArea.value = menuUrl;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    // Download QR code
    const handleDownload = () => {
        const link = document.createElement('a');
        link.href = qrImageUrl;
        link.download = `table-${table.table_number}-qrcode.${isSvg ? 'svg' : 'png'}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Print QR code
    const handlePrint = () => {
        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.write(`
                <html>
                    <head>
                        <title>Print QR Code - Table ${table.table_number}</title>
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
                                max-width: 70vw;
                                max-height: 70vh;
                            }
                            h1 { font-size: 2.5rem; margin-bottom: 10px; }
                            p { font-size: 1.2rem; color: #666; margin-top: 0; }
                            .url { font-size: 0.8rem; color: #999; word-break: break-all; max-width: 80vw; margin-top: 20px; }
                            @media print {
                                @page { margin: 0; }
                                body { height: 100%; display: block; text-align: center; padding-top: 2in; }
                            }
                        </style>
                    </head>
                    <body>
                        <h1>Table ${table.table_number}</h1>
                        <p>Scan to view the menu</p>
                        <img src="${qrImageUrl}" onload="window.print(); window.close();" />
                        <div class="url">${menuUrl}</div>
                    </body>
                </html>
            `);
            printWindow.document.close();
        }
    };

    // Open menu in new tab
    const handleOpenMenu = () => {
        window.open(menuUrl, '_blank');
    };

    // Handle image load error
    const handleImageError = () => {
        setImageError(true);
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-md md:max-w-lg">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-black flex items-center gap-3">
                        Table {table.table_number}
                        <Badge className={statusColors[table.status] || 'bg-gray-500 text-white'}>
                            {statusLabels[table.status] || table.status}
                        </Badge>
                    </DialogTitle>
                    <DialogDescription>
                        QR Code for this restaurant table
                    </DialogDescription>
                </DialogHeader>

                <div className="flex flex-col items-center gap-5 py-4">
                    {/* Large QR Code */}
                    <div className="flex items-center justify-center rounded-xl border-2 border-gray-100 bg-white p-6 shadow-sm w-full max-w-[380px]">
                        {imageError || !isImage ? (
                            <div className="flex flex-col items-center justify-center gap-3 py-10 text-gray-400">
                                <ImageOff className="h-12 w-12" />
                                <p className="text-sm font-medium">QR code image could not be loaded</p>
                                <p className="text-xs text-gray-300">The file may have been moved or deleted</p>
                            </div>
                        ) : (
                            <img
                                src={qrImageUrl}
                                alt={`QR Code for Table ${table.table_number}`}
                                className="h-auto w-full max-w-[320px]"
                                onError={handleImageError}
                            />
                        )}
                    </div>

                    {/* URL Display */}
                    <div className="w-full max-w-[380px] rounded-lg bg-gray-50 p-3 border border-gray-100">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Menu URL</p>
                        <p className="text-xs text-gray-700 break-all font-mono">{menuUrl}</p>
                    </div>

                    {/* Table Details */}
                    <div className="w-full max-w-[380px] grid grid-cols-2 gap-3 text-sm">
                        <div className="rounded-lg bg-gray-50 p-3 border border-gray-100">
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Table Number</p>
                            <p className="mt-1 font-bold text-gray-900">{table.table_number}</p>
                        </div>
                        <div className="rounded-lg bg-gray-50 p-3 border border-gray-100">
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</p>
                            <p className="mt-1 font-bold text-gray-900 capitalize">{table.status?.replace('_', ' ')}</p>
                        </div>
                        {table.created_at && (
                            <div className="rounded-lg bg-gray-50 p-3 border border-gray-100 col-span-2">
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Created</p>
                                <p className="mt-1 font-bold text-gray-900">
                                    {new Date(table.created_at).toLocaleDateString('en-US', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric',
                                    })}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Action Buttons */}
                    <div className="w-full max-w-[380px] grid grid-cols-2 gap-2">
                        <Button
                            variant="outline"
                            onClick={handleDownload}
                            className="flex items-center gap-2"
                            size="sm"
                        >
                            <Download className="h-4 w-4" />
                            Download
                        </Button>

                        <Button
                            variant="outline"
                            onClick={handlePrint}
                            className="flex items-center gap-2"
                            size="sm"
                        >
                            <Printer className="h-4 w-4" />
                            Print
                        </Button>

                        <Button
                            variant="outline"
                            onClick={handleCopyLink}
                            className="flex items-center gap-2"
                            size="sm"
                        >
                            {copied ? (
                                <>
                                    <span className="h-4 w-4 text-green-500">✓</span>
                                    Copied!
                                </>
                            ) : (
                                <>
                                    <Copy className="h-4 w-4" />
                                    Copy Link
                                </>
                            )}
                        </Button>

                        <Button
                            variant="outline"
                            onClick={handleOpenMenu}
                            className="flex items-center gap-2"
                            size="sm"
                        >
                            <ExternalLink className="h-4 w-4" />
                            Open Menu
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
