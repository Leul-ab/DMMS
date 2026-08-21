import { useEffect, useState } from 'react';

interface VerificationCounts {
    paymentVerification: number;
    bookingPayment: number;
    total: number;
}

export function useVerificationCount(pollIntervalMs = 30000) {
    const [counts, setCounts] = useState<VerificationCounts>({
        paymentVerification: 0,
        bookingPayment: 0,
        total: 0,
    });

    const fetchCounts = async () => {
        try {
            const response = await fetch('/manager/verification-count');

            if (response.ok) {
                const data = await response.json();
                setCounts({
                    paymentVerification: data.paymentVerification ?? 0,
                    bookingPayment: data.bookingPayment ?? 0,
                    total: data.total ?? 0,
                });
            }
        } catch {
            // Silently fail
        }
    };

    useEffect(() => {
        fetchCounts();

        const interval = setInterval(fetchCounts, pollIntervalMs);

        return () => clearInterval(interval);
    }, [pollIntervalMs]);

    return counts;
}
