import BookingView from '@/pages/booking/booking-view';

type RestaurantTable = {
    id: number;
    table_number: number;
    status: string;
};

type Props = {
    availableTables: RestaurantTable[];
};

export default function CustomerBookingIndex({ availableTables }: Props) {
    return (
        <BookingView
            availableTables={availableTables}
            basePath="/customer-booking"
            menuPath="/customer-menu"
        />
    );
}
