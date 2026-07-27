import { CheckCircle2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

type Props = {
    isOpen: boolean;
    customerCode: string;
    onClose: () => void;
};

export default function BookingSuccessDialog({ isOpen, customerCode, onClose }: Props) {
    if (!isOpen) return null;

    return (
        <>
            {/* Overlay */}
            <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm" />

            {/* Modal */}
            <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                <div className="w-full max-w-md rounded-3xl bg-white shadow-2xl">
                    {/* Header */}
                    <div className="flex items-center justify-between rounded-t-3xl bg-gradient-to-r from-green-500 to-green-600 px-6 py-5 text-white">
                        <h2 className="text-xl font-black">Booking Successful!</h2>
                        <button
                            onClick={onClose}
                            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-white transition hover:bg-white/30"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-6 text-center space-y-5">
                        <CheckCircle2 className="mx-auto h-16 w-16 text-green-500" />

                        <div>
                            <h3 className="text-2xl font-black text-gray-900">Booking Successful!</h3>
                            <p className="mt-2 text-gray-500">Your table has been booked successfully.</p>
                        </div>

                        <div className="rounded-2xl bg-green-50 p-5">
                            <p className="text-sm font-semibold text-green-700">Your Customer Code</p>
                            <p className="mt-1 text-2xl font-black text-green-600 tracking-wider">
                                {customerCode}
                            </p>
                            <p className="mt-2 text-sm text-green-600">
                                Save this code to view your booking details later.
                            </p>
                        </div>

                        <Button
                            onClick={() => {
                                window.location.href = '/menu';
                            }}
                            className="w-full rounded-xl bg-gray-900 py-6 text-base font-bold text-white hover:bg-orange-500"
                        >
                            OK
                        </Button>
                    </div>
                </div>
            </div>
        </>
    );
}
