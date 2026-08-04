import { useRef } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Printer, Download, CheckCircle2, X } from 'lucide-react';

type ReceiptItem = {
    id: number;
    quantity: number;
    price: string;
    menu_item: {
        id: number;
        name: string;
    };
};

type Receipt = {
    id: number;
    receipt_number: string;
    transaction_number: string | null;
    payment_method: string | null;
    amount: string;
    subtotal: string;
    tax: string;
    service_charge: string;
    discount: string;
    generated_at: string | null;
};

type Payment = {
    id: number;
    payment_method: string | null;
    payment_status: string;
    verified_at: string | null;
    paid_at: string | null;
    verifier: { id: number; name: string } | null;
};

type Order = {
    id: number;
    order_number: string;
    status: string;
    payment_status: string;
    total_amount: string;
    customer_name: string | null;
    created_at: string;
    table: { id: number; table_number: number } | null;
    order_items: ReceiptItem[];
    receipt: Receipt | null;
    payment: Payment | null;
};

type Props = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    order: Order | null;
};

const paymentMethodLabels: Record<string, string> = {
    cash: 'Cash',
    telebirr: 'Telebirr',
    cbe_birr: 'CBE Birr',
    bank_transfer: 'Bank Transfer',
    card: 'Card',
};

export function ReceiptModal({ open, onOpenChange, order }: Props) {
    const printRef = useRef<HTMLDivElement>(null);

    if (!order || !order.receipt) return null;

    const receipt = order.receipt;
    const subtotal = Number(receipt.subtotal || order.total_amount);
    const tax = Number(receipt.tax || 0);
    const serviceCharge = Number(receipt.service_charge || 0);
    const discount = Number(receipt.discount || 0);
    const total = Number(receipt.amount || order.total_amount);

    const handlePrint = () => {
        if (!printRef.current) return;
        const printWindow = window.open('', '_blank', 'width=800,height=600');
        if (!printWindow) return;
        const content = printRef.current.innerHTML;
        printWindow.document.write(`
            <html>
                <head>
                    <title>Receipt ${receipt.receipt_number}</title>
                    <style>
                        body { font-family: 'Segoe UI', Arial, sans-serif; padding: 40px; color: #1a1a1a; }
                        .receipt { max-width: 500px; margin: 0 auto; }
                        .header { text-align: center; border-bottom: 2px solid #f97316; padding-bottom: 20px; margin-bottom: 20px; }
                        .restaurant-name { font-size: 28px; font-weight: 900; margin: 0; }
                        .restaurant-name span { color: #f97316; }
                        .tagline { font-size: 11px; letter-spacing: 0.2em; text-transform: uppercase; color: #666; margin-top: 4px; }
                        .receipt-number { font-size: 14px; font-weight: 700; color: #f97316; margin-top: 8px; }
                        .section { margin-bottom: 20px; }
                        .section-title { font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: #666; margin-bottom: 8px; }
                        .row { display: flex; justify-content: space-between; padding: 4px 0; font-size: 14px; }
                        .row-label { color: #555; }
                        .row-value { font-weight: 600; }
                        table { width: 100%; border-collapse: collapse; font-size: 14px; }
                        th { text-align: left; padding: 8px 4px; border-bottom: 1px solid #e5e7eb; font-size: 12px; text-transform: uppercase; color: #666; }
                        td { padding: 8px 4px; border-bottom: 1px solid #f3f4f6; }
                        .amount { text-align: right; font-weight: 700; }
                        .total-row { border-top: 2px solid #1a1a1a; font-weight: 900; font-size: 16px; }
                        .paid-badge { display: inline-block; background: #dcfce7; color: #16a34a; padding: 4px 12px; border-radius: 999px; font-size: 12px; font-weight: 700; }
                        .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #666; }
                    </style>
                </head>
                <body>
                    ${content}
                </body>
            </html>
        `);
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
    };

    const handleDownload = () => {
        if (!printRef.current) return;
        const content = printRef.current.innerHTML;
        const blob = new Blob(
            [`<html><head><title>Receipt ${receipt.receipt_number}</title></head><body>${content}</body></html>`],
            { type: 'text/html' }
        );
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${receipt.receipt_number}.html`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl font-black">
                        <CheckCircle2 className="size-5 text-green-600" />
                        Payment Receipt
                    </DialogTitle>
                    <DialogDescription>
                        Your payment has been verified. Here is your receipt.
                    </DialogDescription>
                </DialogHeader>

                <div ref={printRef} className="rounded-xl border border-gray-200 bg-white p-6">
                    {/* Restaurant Header */}
                    <div className="text-center">
                        <h2 className="text-2xl font-black">
                            DINE<span className="text-orange-500">.</span>
                        </h2>
                        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-500">
                            Digital Menu Restaurant
                        </p>
                        <p className="mt-1 text-xs text-gray-500">Addis Ababa, Ethiopia</p>
                        <p className="mt-1 text-xs text-gray-500">+251 9X XXX XXXX</p>
                        <p className="mt-3 inline-block rounded-full bg-orange-100 px-3 py-1 text-xs font-bold text-orange-700">
                            {receipt.receipt_number}
                        </p>
                    </div>

                    {/* Order Info */}
                    <div className="mt-5 border-t border-dashed border-gray-200 pt-4">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Order Information</p>
                        <div className="mt-2 space-y-1.5">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Order ID</span>
                                <span className="font-semibold">{order.order_number}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Customer</span>
                                <span className="font-semibold">{order.customer_name || 'Walk-in'}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Table</span>
                                <span className="font-semibold">
                                    {order.table ? `Table ${order.table.table_number}` : '—'}
                                </span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Date</span>
                                <span className="font-semibold">
                                    {receipt.generated_at
                                        ? new Date(receipt.generated_at).toLocaleString()
                                        : new Date(order.created_at).toLocaleString()}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Payment Info */}
                    <div className="mt-4 border-t border-dashed border-gray-200 pt-4">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Payment Information</p>
                        <div className="mt-2 space-y-1.5">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Method</span>
                                <span className="font-semibold capitalize">
                                    {receipt.payment_method
                                        ? (paymentMethodLabels[receipt.payment_method] || receipt.payment_method)
                                        : '—'}
                                </span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Transaction No.</span>
                                <span className="font-mono text-xs font-semibold">
                                    {receipt.transaction_number || '—'}
                                </span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Status</span>
                                <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-bold text-green-700">
                                    <CheckCircle2 className="size-3" />
                                    Paid
                                </span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Verified By</span>
                                <span className="font-semibold">
                                    {order.payment?.verifier?.name || '—'}
                                </span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Verified At</span>
                                <span className="font-semibold">
                                    {order.payment?.verified_at
                                        ? new Date(order.payment.verified_at).toLocaleString()
                                        : '—'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Order Items */}
                    <div className="mt-4 border-t border-dashed border-gray-200 pt-4">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Order Items</p>
                        <table className="mt-2 w-full text-sm">
                            <thead>
                                <tr className="border-b border-gray-200 text-left text-[10px] uppercase tracking-wider text-gray-400">
                                    <th className="py-1.5 pr-2 font-semibold">Item</th>
                                    <th className="py-1.5 px-2 text-center font-semibold">Qty</th>
                                    <th className="py-1.5 px-2 text-right font-semibold">Price</th>
                                    <th className="py-1.5 pl-2 text-right font-semibold">Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {order.order_items.map((item) => (
                                    <tr key={item.id} className="border-b border-gray-100">
                                        <td className="py-2 pr-2 font-medium">{item.menu_item.name}</td>
                                        <td className="py-2 px-2 text-center text-gray-500">{item.quantity}</td>
                                        <td className="py-2 px-2 text-right text-gray-500">
                                            {Number(item.price).toFixed(2)}
                                        </td>
                                        <td className="py-2 pl-2 text-right font-semibold">
                                            {(Number(item.price) * item.quantity).toFixed(2)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Totals */}
                    <div className="mt-4 space-y-1.5 border-t border-dashed border-gray-200 pt-4 text-sm">
                        <div className="flex justify-between">
                            <span className="text-gray-500">Subtotal</span>
                            <span className="font-semibold">{subtotal.toFixed(2)} ETB</span>
                        </div>
                        {tax > 0 && (
                            <div className="flex justify-between">
                                <span className="text-gray-500">Tax</span>
                                <span className="font-semibold">{tax.toFixed(2)} ETB</span>
                            </div>
                        )}
                        {serviceCharge > 0 && (
                            <div className="flex justify-between">
                                <span className="text-gray-500">Service Charge</span>
                                <span className="font-semibold">{serviceCharge.toFixed(2)} ETB</span>
                            </div>
                        )}
                        {discount > 0 && (
                            <div className="flex justify-between">
                                <span className="text-gray-500">Discount</span>
                                <span className="font-semibold text-green-600">-{discount.toFixed(2)} ETB</span>
                            </div>
                        )}
                        <div className="flex justify-between border-t border-gray-200 pt-2 text-base font-black">
                            <span>Total</span>
                            <span className="text-orange-500">{total.toFixed(2)} ETB</span>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="mt-5 border-t border-dashed border-gray-200 pt-4 text-center">
                        <p className="text-xs text-gray-500">Thank you for dining with us!</p>
                        <p className="mt-1 text-[10px] text-gray-400">
                            This receipt was generated automatically after payment verification.
                        </p>
                    </div>
                </div>

                <DialogFooter className="gap-2 sm:justify-between">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        <X className="mr-2 size-4" />
                        Close
                    </Button>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={handleDownload}>
                            <Download className="mr-2 size-4" />
                            Download
                        </Button>
                        <Button onClick={handlePrint}>
                            <Printer className="mr-2 size-4" />
                            Print
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
