import { Head, router } from '@inertiajs/react';
import { useEffect } from 'react';

type Props = {
    booking: {
        id: number;
        customer: { id: number; name: string; phone: string };
        tables: Array<{ id: number; table_number: number }>;
    };
};

export default function BookingShow({ booking }: Props) {
    useEffect(() => {
        router.visit('/menu');
    }, []);

    return (
        <>
            <Head title="Redirecting..." />
            <div className="min-h-screen bg-stone-50 flex items-center justify-center">
                <p className="text-gray-500">Redirecting to menu...</p>
            </div>
        </>
    );
}
