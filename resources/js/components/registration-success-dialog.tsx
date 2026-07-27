import { useEffect, useState } from 'react';
import { CheckCircle, Copy, X } from 'lucide-react';

type Props = {
    isOpen: boolean;
    customerCode: string;
    customerName: string;
    onClose: () => void;
};

export default function RegistrationSuccessDialog({
    isOpen,
    customerCode,
    customerName,
    onClose,
}: Props) {
    const [copied, setCopied] = useState(false);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        if (isOpen) {
            // Trigger animation after mount
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    setVisible(true);
                });
            });
        } else {
            setVisible(false);
            setCopied(false);
        }
    }, [isOpen]);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(customerCode);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            // Fallback for older browsers
            const textarea = document.createElement('textarea');
            textarea.value = customerCode;
            textarea.style.position = 'fixed';
            textarea.style.opacity = '0';
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    if (!isOpen) return null;

    return (
        <div
            className={`fixed inset-0 z-[300] flex items-center justify-center p-4 transition-all duration-300 ${
                visible
                    ? 'bg-black/60 backdrop-blur-sm'
                    : 'bg-black/0'
            }`}
            onClick={(e) => {
                if (e.target === e.currentTarget) onClose();
            }}
        >
            <div
                className={`w-full max-w-md transform rounded-3xl bg-white p-8 shadow-2xl transition-all duration-300 ${
                    visible
                        ? 'scale-100 opacity-100 translate-y-0'
                        : 'scale-75 opacity-0 translate-y-8'
                }`}
            >
                {/* Success Icon */}
                <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
                    <CheckCircle className="h-12 w-12 text-green-600" />
                </div>

                {/* Title */}
                <h2 className="text-center text-2xl font-black text-gray-900">
                    Registration Successful
                </h2>

                {/* Message */}
                <p className="mt-3 text-center text-gray-500">
                    Congratulations! You have successfully become a member.
                </p>

                {/* Customer Code Box */}
                <div className="mt-6 rounded-2xl border-2 border-green-200 bg-green-50 p-6 text-center">
                    <p className="mb-2 text-sm font-semibold text-gray-500">
                        Your Customer Code
                    </p>
                    <p className="select-all text-3xl font-black tracking-widest text-green-700">
                        {customerCode}
                    </p>
                </div>

                <p className="mt-4 text-center text-sm text-gray-400">
                    Please save this code. You can use it for future bookings, orders, and member services.
                </p>

                {/* Actions */}
                <div className="mt-6 flex flex-col gap-3">
                    <button
                        type="button"
                        onClick={handleCopy}
                        className="flex items-center justify-center gap-2 rounded-xl bg-green-600 px-5 py-3.5 font-bold text-white transition hover:bg-green-700 active:scale-[0.98]"
                    >
                        {copied ? (
                            <>
                                <CheckCircle className="h-5 w-5" />
                                Copied!
                            </>
                        ) : (
                            <>
                                <Copy className="h-5 w-5" />
                                Copy Code
                            </>
                        )}
                    </button>

                    <button
                        type="button"
                        onClick={onClose}
                        className="flex items-center justify-center gap-2 rounded-xl border border-gray-200 px-5 py-3.5 font-bold text-gray-700 transition hover:bg-gray-100 active:scale-[0.98]"
                    >
                        <X className="h-5 w-5" />
                        Continue
                    </button>
                </div>
            </div>
        </div>
    );
}
