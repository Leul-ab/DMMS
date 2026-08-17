import BookingView from '@/pages/booking/booking-view';

type Props = {
    availableTables: {
        id: number;
        table_number: number;
        status: string;
        table_section_id: number | null;
    }[];
    sections: {
        id: number;
        name: string;
        description: string | null;
        sort_order: number;
        available_tables: {
            id: number;
            table_number: number;
            status: string;
            table_section_id: number | null;
        }[];
    }[];
};

export default function CustomerBookingIndex({
    availableTables,
    sections,
}: Props) {
    return (
        <BookingView
            availableTables={availableTables}
            sections={sections}
            basePath="/customer-booking"
            menuPath="/customer-menu"
        />
    );
}
